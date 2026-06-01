#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT, json: false, offline: false, requirePublished: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizeResult(result) {
  return {
    status: Number.isInteger(result?.status) ? result.status : 1,
    stdout: String(result?.stdout ?? ""),
    stderr: String(result?.stderr ?? ""),
  };
}

function run(root, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  return normalizeResult({
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  });
}

function print(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(`LHF Publication Status: ${payload.ok ? "PASS" : "BLOCKED"}`);
  console.log(`- package: ${payload.packageName}@${payload.expectedVersion}`);
  console.log(`- release: ${payload.releaseTag}`);
  console.log(`- package exists: ${payload.packageExists ? "yes" : "no"}`);
  console.log(`- published: ${payload.published ? payload.publishedVersion : "no"}`);
  for (const blocker of payload.blockers) console.log(`- blocker: ${blocker}`);
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const fixture = args.fixture ? readJson(resolve(String(args.fixture))) : null;
const rootPackagePath = join(root, "package.json");
const createPackagePath = join(root, "packages/create-living-harness/package.json");
const failures = [];
const blockers = [];

if (!existsSync(rootPackagePath)) failures.push("package.json missing");
if (!existsSync(createPackagePath)) failures.push("packages/create-living-harness/package.json missing");

const rootPackage = existsSync(rootPackagePath) ? readJson(rootPackagePath) : {};
const createPackage = existsSync(createPackagePath) ? readJson(createPackagePath) : {};
const packageName = String(createPackage.name ?? "create-living-harness");
const expectedVersion = String(createPackage.version ?? rootPackage.version ?? "");
const releaseTag = String(args.release ?? `v${expectedVersion}`);
const repo = String(args.repo ?? "genesisbuildstudio/living-harness-framework");
let published = false;
let publishedVersion = null;
let packageExists = false;
let trustedPublisherShapeOk = false;

function external(name, command, commandArgs) {
  if (fixture?.[name]) return normalizeResult(fixture[name]);
  return run(root, command, commandArgs);
}

function hasAccount2fa(profile) {
  if (profile?.tfa === true) return true;
  if (typeof profile?.tfa === "object" && profile.tfa !== null) {
    const mode = String(profile.tfa.mode ?? "");
    return profile.tfa.pending === null && (mode === "auth-only" || mode === "auth-and-writes");
  }
  return false;
}

function trustMatches(entry, { packageName, repo }) {
  return entry?.type === "github"
    && entry?.file === "release-npm.yml"
    && entry?.repository === repo
    && entry?.environment === "npm-publish"
    && Array.isArray(entry?.permissions)
    && entry.permissions.length > 0
    && String(packageName).length > 0;
}

function parseTrustList(stdout) {
  const parsed = JSON.parse(stdout);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  return [];
}

if (!expectedVersion) failures.push("expected package version missing");

const npm = {
  packageExists: false,
  published: false,
  version: null,
  authenticatedUser: null,
  profile: null,
  account2faEnabled: false,
  trustDryRun: null,
  trustList: null,
  trustedPublisherConfigured: false,
  trustDryRunSkippedReason: null,
};
const github = {
  release: null,
  head: null,
};

if (args.offline) {
  blockers.push("Network checks skipped; cannot verify npm or GitHub publication state.");
} else {
  const npmView = external("npmView", "npm", ["view", packageName, "version", "--json"]);
  if (npmView.status === 0 && npmView.stdout.trim()) {
    packageExists = true;
    publishedVersion = JSON.parse(npmView.stdout);
    published = publishedVersion === expectedVersion;
    npm.packageExists = true;
    npm.published = true;
    npm.version = publishedVersion;
    if (!published) blockers.push(`npm has ${packageName}@${publishedVersion}; expected ${expectedVersion}.`);
  } else if (/E404|Not Found/i.test(`${npmView.stderr}\n${npmView.stdout}`)) {
    blockers.push(`npm package ${packageName} does not exist yet; npm trust cannot be configured until a package exists.`);
  } else {
    blockers.push(`npm package version could not be verified: ${npmView.stderr.trim() || npmView.stdout.trim()}`);
  }

  const whoami = external("whoami", "npm", ["whoami"]);
  if (whoami.status === 0 && whoami.stdout.trim()) {
    npm.authenticatedUser = whoami.stdout.trim();
  } else {
    blockers.push("npm owner auth is not available on this machine.");
  }

  const profile = external("profile", "npm", ["profile", "get", "--json"]);
  if (profile.status === 0 && profile.stdout.trim()) {
    npm.profile = JSON.parse(profile.stdout);
    npm.account2faEnabled = hasAccount2fa(npm.profile);
    if (!npm.account2faEnabled) blockers.push(`npm account ${npm.authenticatedUser ?? "owner"} does not have account-level 2FA enabled.`);
    if (npm.profile.email_verified !== true) blockers.push(`npm account ${npm.authenticatedUser ?? "owner"} email is not verified.`);
  } else {
    blockers.push(`npm account profile could not be verified: ${profile.stderr.trim() || profile.stdout.trim()}`);
  }

  if (packageExists && npm.account2faEnabled) {
    const trustList = external("trustList", "npm", ["trust", "list", packageName, "--json"]);
    if (trustList.status === 0 && trustList.stdout.trim()) {
      npm.trustList = parseTrustList(trustList.stdout);
      npm.trustedPublisherConfigured = npm.trustList.some((entry) => trustMatches(entry, { packageName, repo }));
    } else {
      blockers.push(`npm trusted-publisher list failed: ${trustList.stderr.trim() || trustList.stdout.trim()}`);
    }
  }

  if (!packageExists) {
    npm.trustDryRunSkippedReason = "Package does not exist yet; npm docs require an existing package before configuring trust.";
  } else if (!npm.account2faEnabled) {
    npm.trustDryRunSkippedReason = "Account-level 2FA is not enabled; npm docs require 2FA before trust commands.";
  } else if (npm.trustedPublisherConfigured) {
    npm.trustDryRunSkippedReason = "Trusted publisher is already configured.";
  } else {
    const trustDryRun = external("trustDryRun", "npm", [
      "trust",
      "github",
      packageName,
      "--repo",
      repo,
      "--file",
      "release-npm.yml",
      "--env",
      "npm-publish",
      "--allow-publish",
      "--dry-run",
      "--json",
    ]);
    if (trustDryRun.status === 0 && trustDryRun.stdout.trim()) {
      npm.trustDryRun = JSON.parse(trustDryRun.stdout);
      trustedPublisherShapeOk = npm.trustDryRun.package === packageName
        && npm.trustDryRun.repository === repo
        && npm.trustDryRun.file === "release-npm.yml"
        && npm.trustDryRun.environment === "npm-publish";
    } else {
      blockers.push(`npm trusted-publishing dry run failed: ${trustDryRun.stderr.trim() || trustDryRun.stdout.trim()}`);
    }
  }

  const release = external("release", "gh", ["release", "view", releaseTag, "--json", "isDraft,isPrerelease,publishedAt,tagName,targetCommitish,url"]);
  if (release.status === 0 && release.stdout.trim()) {
    github.release = JSON.parse(release.stdout);
    if (published && github.release.isDraft) blockers.push(`${releaseTag} is still a draft release.`);
    if (!published && !github.release.isDraft) blockers.push(`${releaseTag} is published but npm ${packageName}@${expectedVersion} is not live.`);
  } else {
    blockers.push(`GitHub release ${releaseTag} could not be verified: ${release.stderr.trim() || release.stdout.trim()}`);
  }

  const head = external("head", "git", ["rev-parse", "HEAD"]);
  if (head.status === 0) github.head = head.stdout.trim();
  if (github.release?.targetCommitish && github.head && github.release.targetCommitish !== github.head) {
    blockers.push(`${releaseTag} targets ${github.release.targetCommitish}; current HEAD is ${github.head}.`);
  }
}

const localReady = failures.length === 0;
const releaseDraftOnHead = github.release?.isDraft === true
  && Boolean(github.release?.targetCommitish)
  && Boolean(github.head)
  && github.release.targetCommitish === github.head;
const account2faEnabled = npm.account2faEnabled;
const readyForInitialPackageBootstrap = localReady
  && !packageExists
  && Boolean(npm.authenticatedUser)
  && account2faEnabled
  && releaseDraftOnHead;
const readyForTrustedPublisherSetup = localReady
  && packageExists
  && !published
  && Boolean(npm.authenticatedUser)
  && account2faEnabled
  && npm.trustedPublisherConfigured === false
  && trustedPublisherShapeOk
  && releaseDraftOnHead;
const readyForGitHubReleasePublish = localReady
  && packageExists
  && !published
  && npm.trustedPublisherConfigured === true
  && releaseDraftOnHead;
const readyForNpmOwnerAction = localReady
  && (readyForInitialPackageBootstrap || readyForTrustedPublisherSetup || readyForGitHubReleasePublish);
const ok = localReady && (args.requirePublished ? published : true);
const payload = {
  ok,
  root,
  packageName,
  expectedVersion,
  releaseTag,
  published,
  publishedVersion,
  packageExists,
  readyToPublish: localReady && blockers.length === 0 && !published,
  readyForInitialPackageBootstrap,
  readyForTrustedPublisherSetup,
  readyForGitHubReleasePublish,
  readyForNpmOwnerAction,
  localReady,
  failures,
  blockers,
  npm,
  github,
};

print(payload, args.json);
process.exit(ok ? 0 : 1);
