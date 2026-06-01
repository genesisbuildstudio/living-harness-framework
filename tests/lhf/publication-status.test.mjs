import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function writeFixture(root, version = "0.4.3") {
  mkdirSync(join(root, "packages/create-living-harness"), { recursive: true });
  writeFileSync(join(root, "package.json"), `${JSON.stringify({
    version,
  }, null, 2)}\n`);
  writeFileSync(join(root, "packages/create-living-harness/package.json"), `${JSON.stringify({
    name: "create-living-harness",
    version,
  }, null, 2)}\n`);
}

test("publication status reports offline release blockers without failing", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-"));
  writeFixture(root);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--offline",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageName, "create-living-harness");
  assert.equal(payload.expectedVersion, "0.4.3");
  assert.equal(payload.releaseTag, "v0.4.3");
  assert.equal(payload.readyToPublish, false);
  assert.match(payload.blockers.join("\n"), /Network checks skipped/);
});

test("publication status require-published fails before npm publication", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-require-"));
  writeFixture(root);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--offline",
    "--require-published",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.published, false);
  assert.equal(payload.readyToPublish, false);
});

test("publication status blocks npm owner action until account-level 2FA is enabled", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-2fa-"));
  writeFixture(root);
  const fixture = join(root, "fixture.json");
  writeFileSync(fixture, `${JSON.stringify({
    npmView: { status: 1, stdout: "", stderr: "npm error code E404" },
    whoami: { status: 0, stdout: "genesisbuild\n", stderr: "" },
    profile: { status: 0, stdout: JSON.stringify({ tfa: false, email_verified: true }), stderr: "" },
    release: {
      status: 0,
      stdout: JSON.stringify({
        isDraft: true,
        isPrerelease: false,
        publishedAt: null,
        tagName: "v0.4.3",
        targetCommitish: "abc123",
        url: "https://github.com/genesisbuildstudio/living-harness-framework/releases/tag/v0.4.3",
      }),
      stderr: "",
    },
    head: { status: 0, stdout: "abc123\n", stderr: "" },
  }, null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--fixture",
    fixture,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageExists, false);
  assert.equal(payload.readyForNpmOwnerAction, false);
  assert.equal(payload.readyForInitialPackageBootstrap, false);
  assert.match(payload.blockers.join("\n"), /does not have account-level 2FA enabled/);
  assert.match(payload.npm.trustDryRunSkippedReason, /Package does not exist yet/);
});

test("publication status allows bootstrap action only after 2FA and draft release proof", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-bootstrap-"));
  writeFixture(root);
  const fixture = join(root, "fixture.json");
  writeFileSync(fixture, `${JSON.stringify({
    npmView: { status: 1, stdout: "", stderr: "npm error code E404" },
    whoami: { status: 0, stdout: "genesisbuild\n", stderr: "" },
    profile: { status: 0, stdout: JSON.stringify({ tfa: true, email_verified: true }), stderr: "" },
    release: {
      status: 0,
      stdout: JSON.stringify({
        isDraft: true,
        isPrerelease: false,
        publishedAt: null,
        tagName: "v0.4.3",
        targetCommitish: "abc123",
        url: "https://github.com/genesisbuildstudio/living-harness-framework/releases/tag/v0.4.3",
      }),
      stderr: "",
    },
    head: { status: 0, stdout: "abc123\n", stderr: "" },
  }, null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--fixture",
    fixture,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageExists, false);
  assert.equal(payload.readyForInitialPackageBootstrap, true);
  assert.equal(payload.readyForNpmOwnerAction, true);
  assert.match(payload.blockers.join("\n"), /npm trust cannot be configured until a package exists/);
});

test("publication status accepts npm CLI object-shaped 2FA profile", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-object-2fa-"));
  writeFixture(root);
  const fixture = join(root, "fixture.json");
  writeFileSync(fixture, `${JSON.stringify({
    npmView: { status: 1, stdout: "", stderr: "npm error code E404" },
    whoami: { status: 0, stdout: "genesisbuild\n", stderr: "" },
    profile: {
      status: 0,
      stdout: JSON.stringify({
        tfa: { pending: null, mode: "auth-and-writes" },
        email_verified: true,
      }),
      stderr: "",
    },
    release: {
      status: 0,
      stdout: JSON.stringify({
        isDraft: true,
        isPrerelease: false,
        publishedAt: null,
        tagName: "v0.4.3",
        targetCommitish: "abc123",
        url: "https://github.com/genesisbuildstudio/living-harness-framework/releases/tag/v0.4.3",
      }),
      stderr: "",
    },
    head: { status: 0, stdout: "abc123\n", stderr: "" },
  }, null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--fixture",
    fixture,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.npm.account2faEnabled, true);
  assert.equal(payload.readyForInitialPackageBootstrap, true);
  assert.doesNotMatch(payload.blockers.join("\n"), /does not have account-level 2FA enabled/);
});

test("publication status detects configured trusted publisher for next GitHub release", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-trust-list-"));
  writeFixture(root, "0.4.4");
  const fixture = join(root, "fixture.json");
  writeFileSync(fixture, `${JSON.stringify({
    npmView: { status: 0, stdout: JSON.stringify("0.4.3"), stderr: "" },
    whoami: { status: 0, stdout: "genesisbuild\n", stderr: "" },
    profile: {
      status: 0,
      stdout: JSON.stringify({
        tfa: { pending: null, mode: "auth-and-writes" },
        email_verified: true,
      }),
      stderr: "",
    },
    trustList: {
      status: 0,
      stdout: JSON.stringify({
        id: "trusted-publisher-id",
        type: "github",
        file: "release-npm.yml",
        repository: "genesisbuildstudio/living-harness-framework",
        environment: "npm-publish",
        permissions: ["createPackage"],
      }),
      stderr: "",
    },
    release: {
      status: 0,
      stdout: JSON.stringify({
        isDraft: true,
        isPrerelease: false,
        publishedAt: null,
        tagName: "v0.4.4",
        targetCommitish: "abc123",
        url: "https://github.com/genesisbuildstudio/living-harness-framework/releases/tag/v0.4.4",
      }),
      stderr: "",
    },
    head: { status: 0, stdout: "abc123\n", stderr: "" },
  }, null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--fixture",
    fixture,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.npm.trustedPublisherConfigured, true);
  assert.equal(payload.readyForGitHubReleasePublish, true);
  assert.equal(payload.readyForNpmOwnerAction, true);
  assert.match(payload.blockers.join("\n"), /npm has create-living-harness@0.4.3; expected 0.4.4/);
});
