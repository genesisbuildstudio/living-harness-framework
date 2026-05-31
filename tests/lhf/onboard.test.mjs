import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("onboard writes a first-run receipt with selected stack choices", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-onboard-"));
  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/onboard.mjs"),
    "--root",
    root,
    "--name",
    "Acme App",
    "--slug",
    "acme-app",
    "--platform",
    "codex",
    "--cloudflare",
    "--supabase",
    "--sentry",
    "--write",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.receipt.project.slug, "acme-app");
  assert.deepEqual(payload.receipt.stack, {
    cloudflare: true,
    supabase: true,
    sentry: true,
  });
  const disk = JSON.parse(readFileSync(join(root, ".lhf/onboarding.json"), "utf8"));
  assert.equal(disk.nextCommands[0], "pnpm install");
});
