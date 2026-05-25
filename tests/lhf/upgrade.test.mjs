import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("upgrade check reports missing framework-owned files without mutating", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-upgrade-"));
  mkdirSync(join(root, ".lhf"), { recursive: true });
  writeFileSync(join(root, ".lhf/manifest.json"), `${JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: "0.3.0",
    frameworkFiles: ["AGENTS.md", "docs/system/READ-FIRST.md"],
  }, null, 2)}\n`);
  writeFileSync(join(root, "AGENTS.md"), "# Agent rules\n");

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/upgrade.mjs"),
    "--root",
    root,
    "--check",
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /docs\/system\/READ-FIRST\.md/);
  assert.match(result.stderr, /missing framework file/);
});
