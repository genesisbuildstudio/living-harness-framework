import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("episode writes an auditable session receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-episode-"));
  mkdirSync(join(root, "docs/operations"), { recursive: true });

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/episode.mjs"),
    "--root",
    root,
    "--task",
    "T-001",
    "--status",
    "pass",
    "--command",
    "pnpm test",
    "--changed",
    "src/index.ts",
    "--proof",
    "node --test passed",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const files = readdirSync(join(root, "docs/operations/episodes"));
  assert.equal(files.length, 1);
  const receipt = JSON.parse(readFileSync(join(root, "docs/operations/episodes", files[0]), "utf8"));
  assert.equal(receipt.schemaVersion, "lhf-episode/v1");
  assert.equal(receipt.task, "T-001");
  assert.equal(receipt.status, "pass");
  assert.deepEqual(receipt.commands, ["pnpm test"]);
  assert.deepEqual(receipt.changedFiles, ["src/index.ts"]);
  assert.deepEqual(receipt.proof, ["node --test passed"]);
  assert.match(receipt.createdAt, /^\d{4}-\d{2}-\d{2}T/);
});
