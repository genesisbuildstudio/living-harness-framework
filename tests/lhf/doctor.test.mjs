import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("doctor reports missing required framework files as actionable failures", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-doctor-missing-"));
  mkdirSync(join(root, ".lhf"), { recursive: true });
  writeFileSync(join(root, "package.json"), `${JSON.stringify({
    private: true,
    packageManager: "pnpm@10.30.1",
  }, null, 2)}\n`);
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(root, ".lhf/manifest.json"), `${JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: "0.4.2",
    frameworkFiles: ["AGENTS.md"],
  }, null, 2)}\n`);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/doctor.mjs"),
    "--root",
    root,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.summary.fail >= 1);
  assert.deepEqual(payload.checks.find((check) => check.id === "framework-files").failures, ["AGENTS.md"]);
});

test("doctor passes a copied starter with warnings allowed", () => {
  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/doctor.mjs"),
    "--root",
    repoRoot,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.fail, 0);
  assert.ok(payload.checks.some((check) => check.id === "ai-surfaces"));
});

test("doctor treats a fresh non-git download as a warning", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-doctor-fresh-"));
  mkdirSync(join(root, ".lhf"), { recursive: true });
  writeFileSync(join(root, "package.json"), `${JSON.stringify({
    private: true,
    packageManager: "pnpm@10.30.1",
  }, null, 2)}\n`);
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(root, ".lhf/manifest.json"), `${JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: "0.4.2",
    frameworkFiles: [],
  }, null, 2)}\n`);
  for (const file of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".cursor/rules/lhf-core.mdc"]) {
    mkdirSync(join(root, file.split("/").slice(0, -1).join("/")), { recursive: true });
    writeFileSync(join(root, file), "read AGENTS.md and docs/system/READ-FIRST.md\n");
  }
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/lhf-health.yml",
    ".github/workflows/codeql.yml",
    ".github/workflows/pages.yml",
    ".github/workflows/release-npm.yml",
    ".github/workflows/scorecard.yml",
  ]) {
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(join(root, file), "name: test\n");
  }

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/doctor.mjs"),
    "--root",
    root,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.summary.fail, 0);
  assert.ok(payload.checks.find((check) => check.id === "git").warnings.includes("not a git working tree yet"));
});
