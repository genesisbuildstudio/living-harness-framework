import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("github-actions check blocks dangerous workflow permissions", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-actions-"));
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  writeFileSync(join(root, ".github/workflows/unsafe.yml"), [
    "name: Unsafe",
    "on: pull_request_target",
    "permissions: write-all",
    "jobs:",
    "  unsafe:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "",
  ].join("\n"));

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/check-github-actions.mjs"),
    "--root",
    root,
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pull_request_target/);
  assert.match(result.stderr, /write-all/);
});
