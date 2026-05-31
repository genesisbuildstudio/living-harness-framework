import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { tmpdir } from "node:os";

const repoRoot = resolve(import.meta.dirname, "../..");

test("benchmark writes a measurable local harness receipt", () => {
  const outDir = mkdtempSync(`${tmpdir()}/lhf-benchmark-`);
  const result = spawnSync(process.execPath, [
    "scripts/lhf/benchmark.mjs",
    "--root",
    repoRoot,
    "--out-dir",
    outDir,
    "--json",
  ], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.receipt.schemaVersion, "lhf-benchmark-receipt/v1");
  assert.ok(payload.receipt.score >= 80);
  assert.ok(existsSync(payload.path));
  const disk = JSON.parse(readFileSync(payload.path, "utf8"));
  assert.equal(disk.score, payload.receipt.score);
});
