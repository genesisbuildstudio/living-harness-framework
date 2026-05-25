import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("branch protection check accepts a ruleset fixture with required gates", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-rules-"));
  const fixture = join(root, "rules.json");
  writeFileSync(fixture, JSON.stringify([
    {
      name: "main",
      target: "branch",
      enforcement: "active",
      rules: [
        { type: "pull_request" },
        { type: "required_status_checks", parameters: { required_status_checks: [
          { context: "ci" },
          { context: "lhf-health" },
          { context: "analyze" }
        ] } },
        { type: "required_linear_history" }
      ]
    }
  ], null, 2));

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/check-branch-protection.mjs"),
    "--fixture",
    fixture,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});
