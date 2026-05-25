import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("fst runner executes command-backed tasks and writes a receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-fst-"));
  mkdirSync(join(root, "full-system-tester/tasks"), { recursive: true });
  mkdirSync(join(root, "docs/operations"), { recursive: true });
  writeFileSync(join(root, "full-system-tester/tasks/999-smoke.md"), [
    "# FST 999 — Smoke",
    "",
    "```bash",
    "node -e \"console.log('smoke-ok')\"",
    "```",
    "",
  ].join("\n"));

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/fst-run.mjs"),
    "--root",
    root,
    "--task",
    "999-smoke",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const receipts = readdirSync(join(root, "docs/operations/episodes"));
  assert.equal(receipts.length, 1);
  const receipt = JSON.parse(readFileSync(join(root, "docs/operations/episodes", receipts[0]), "utf8"));
  assert.equal(receipt.task, "999-smoke");
  assert.equal(receipt.status, "pass");
  assert.deepEqual(receipt.commands, ["node -e \"console.log('smoke-ok')\""]);
  assert.match(receipt.proof[0], /smoke-ok/);
});
