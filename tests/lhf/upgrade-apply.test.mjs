import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function writeManifest(root, files) {
  mkdirSync(join(root, ".lhf"), { recursive: true });
  writeFileSync(join(root, ".lhf/manifest.json"), `${JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: "0.4.0",
    frameworkFiles: files,
  }, null, 2)}\n`);
}

test("upgrade apply copies framework-owned files from source and writes a receipt", () => {
  const source = mkdtempSync(join(tmpdir(), "lhf-upgrade-source-"));
  const target = mkdtempSync(join(tmpdir(), "lhf-upgrade-target-"));
  writeManifest(source, ["AGENTS.md", "docs/system/READ-FIRST.md"]);
  writeManifest(target, ["AGENTS.md", "docs/system/READ-FIRST.md"]);
  mkdirSync(join(source, "docs/system"), { recursive: true });
  mkdirSync(join(target, "docs/system"), { recursive: true });
  writeFileSync(join(source, "AGENTS.md"), "source agents\n");
  writeFileSync(join(source, "docs/system/READ-FIRST.md"), "source read first\n");
  writeFileSync(join(target, "AGENTS.md"), "old agents\n");

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/upgrade.mjs"),
    "--root",
    target,
    "--source",
    source,
    "--apply",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(readFileSync(join(target, "AGENTS.md"), "utf8"), "source agents\n");
  assert.equal(readFileSync(join(target, "docs/system/READ-FIRST.md"), "utf8"), "source read first\n");
  assert.match(result.stdout, /applied/);
});

test("upgrade diff previews changes and rollback restores previous files", () => {
  const source = mkdtempSync(join(tmpdir(), "lhf-upgrade-source-"));
  const target = mkdtempSync(join(tmpdir(), "lhf-upgrade-target-"));
  writeManifest(source, ["AGENTS.md", "docs/system/READ-FIRST.md"]);
  writeManifest(target, ["AGENTS.md", "docs/system/READ-FIRST.md"]);
  mkdirSync(join(source, "docs/system"), { recursive: true });
  mkdirSync(join(target, "docs/system"), { recursive: true });
  writeFileSync(join(source, "AGENTS.md"), "source agents\n");
  writeFileSync(join(source, "docs/system/READ-FIRST.md"), "source read first\n");
  writeFileSync(join(target, "AGENTS.md"), "old agents\n");

  const diff = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/upgrade.mjs"),
    "--root",
    target,
    "--source",
    source,
    "--diff",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(diff.status, 1);
  const preview = JSON.parse(diff.stdout);
  assert.equal(preview.action, "diff");
  assert.equal(preview.planned.length, 2);
  assert.ok(preview.planned.every((item) => typeof item.patch === "string"));

  const apply = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/upgrade.mjs"),
    "--root",
    target,
    "--source",
    source,
    "--apply",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(apply.status, 0, apply.stderr || apply.stdout);
  const applied = JSON.parse(apply.stdout);
  assert.equal(readFileSync(join(target, "AGENTS.md"), "utf8"), "source agents\n");
  assert.equal(readFileSync(join(target, "docs/system/READ-FIRST.md"), "utf8"), "source read first\n");
  assert.ok(existsSync(applied.receipt.backupDir));

  const rollback = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/upgrade.mjs"),
    "--root",
    target,
    "--rollback",
    applied.path,
    "--json",
  ], { encoding: "utf8" });

  assert.equal(rollback.status, 0, rollback.stderr || rollback.stdout);
  assert.equal(readFileSync(join(target, "AGENTS.md"), "utf8"), "old agents\n");
  assert.equal(existsSync(join(target, "docs/system/READ-FIRST.md")), false);
});
