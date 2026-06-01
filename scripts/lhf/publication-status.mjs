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

function run(root, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
}

function print(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(`LHF Publication Status: ${payload.ok ? "PASS" : "BLOCKED"}`);
  console.log(`- package: ${payload.packageName}@${payload.expectedVersion}`);
  console.log(`- release: ${payload.releaseTag}`);
  console.log(`- published: ${payload.published ? payload.publishedVersion : "no"}`);
  for (const blocker of payload.blockers) console.log(`- blocker: ${blocker}`);
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
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
let trustedPublisherShapeOk = false;

if (!expectedVersion) failures.push("expected package version missing");

const npm = {
  published: false,
  version: null,
  authenticatedUser: null,
  trustDryRun: null,
};
const github = {
  release: null,
  head: null,
};

if (args.offline) {
  blockers.push("Network checks skipped; cannot verify npm or GitHub publication state.");
} else {
  const npmView = run(root, "npm", ["view", packageName, "version", "--json"]);
  if (npmView.status === 0 && npmView.stdout.trim()) {
    publishedVersion = JSON.parse(npmView.stdout);
    published = publishedVersion === expectedVersion;
    npm.published = true;
    npm.version = publishedVersion;
    if (!published) blockers.push(`npm has ${packageName}@${publishedVersion}; expected ${expectedVersion}.`);
  } else if (/E404|Not Found/i.test(`${npmView.stderr}\n${npmView.stdout}`)) {
    blockers.push(`npm package ${packageName} is not published yet.`);
  } else {
    blockers.push(`npm package version could not be verified: ${npmView.stderr.trim() || npmView.stdout.trim()}`);
  }

  const whoami = run(root, "npm", ["whoami"]);
  if (whoami.status === 0 && whoami.stdout.trim()) {
    npm.authenticatedUser = whoami.stdout.trim();
  } else {
    blockers.push("npm owner auth is not available on this machine.");
  }

  const trustDryRun = run(root, "npm", [
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

  const release = run(root, "gh", ["release", "view", releaseTag, "--json", "isDraft,isPrerelease,publishedAt,tagName,targetCommitish,url"]);
  if (release.status === 0 && release.stdout.trim()) {
    github.release = JSON.parse(release.stdout);
    if (published && github.release.isDraft) blockers.push(`${releaseTag} is still a draft release.`);
    if (!published && !github.release.isDraft) blockers.push(`${releaseTag} is published but npm ${packageName}@${expectedVersion} is not live.`);
  } else {
    blockers.push(`GitHub release ${releaseTag} could not be verified: ${release.stderr.trim() || release.stdout.trim()}`);
  }

  const head = run(root, "git", ["rev-parse", "HEAD"]);
  if (head.status === 0) github.head = head.stdout.trim();
  if (github.release?.targetCommitish && github.head && github.release.targetCommitish !== github.head) {
    blockers.push(`${releaseTag} targets ${github.release.targetCommitish}; current HEAD is ${github.head}.`);
  }
}

const localReady = failures.length === 0;
const readyForNpmOwnerAction = localReady
  && !published
  && trustedPublisherShapeOk
  && github.release?.isDraft === true
  && github.release?.targetCommitish === github.head;
const ok = localReady && (args.requirePublished ? published : true);
const payload = {
  ok,
  root,
  packageName,
  expectedVersion,
  releaseTag,
  published,
  publishedVersion,
  readyToPublish: localReady && blockers.length === 0 && !published,
  readyForNpmOwnerAction,
  localReady,
  failures,
  blockers,
  npm,
  github,
};

print(payload, args.json);
process.exit(ok ? 0 : 1);
