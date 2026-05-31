import assert from "node:assert/strict";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("agent conformance scores the current instruction surfaces", () => {
  const result = spawnSync(process.execPath, [
    "scripts/lhf/agent-conformance.mjs",
    "--root",
    repoRoot,
    "--json",
  ], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.receipt.schemaVersion, "lhf-agent-conformance/v1");
  assert.ok(payload.receipt.score >= 90);
  assert.ok(payload.receipt.checks.some((check) => check.id === "prompt-injection-boundary"));
});
