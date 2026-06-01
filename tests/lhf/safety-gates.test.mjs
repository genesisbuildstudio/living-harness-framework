import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function runScript(script, root) {
  return spawnSync(process.execPath, [join(repoRoot, "scripts/lhf", script)], {
    encoding: "utf8",
    env: { ...process.env, LHF_ROOT: root },
  });
}

test("secret check blocks high-confidence committed credentials", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-secret-"));
  mkdirSync(join(root, "src"), { recursive: true });
  const fakeKey = ["sk", "proj", "1234567890abcdefghijklmnopqrstuvwxyz"].join("-");
  writeFileSync(join(root, "src/leak.ts"), `export const key = '${fakeKey}';\n`);

  const result = runScript("check-secrets.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /possible OpenAI key/);
});

test("supabase RLS check blocks public tables without policies", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-rls-"));
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  writeFileSync(join(root, "supabase/migrations/20260525000000_bad.sql"), [
    "CREATE TABLE IF NOT EXISTS public.todos (",
    "  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  title text NOT NULL",
    ");",
    "",
  ].join("\n"));

  const result = runScript("check-supabase-rls.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /without ENABLE ROW LEVEL SECURITY/);
  assert.match(result.stderr, /without at least one policy/);
});

test("template isolation check blocks GENESIS product coupling", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-isolation-"));
  mkdirSync(join(root, "docs/system"), { recursive: true });
  writeFileSync(join(root, "docs/system/READ-FIRST.md"), [
    "# Read First",
    "This reusable template must not point users at genesisbuildstudio/genesis-cloud.",
    "",
  ].join("\n"));

  const result = runScript("check-template-isolation.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GENESIS-specific string/);
  assert.match(result.stderr, /genesisbuildstudio\/genesis-cloud/);
});

test("template isolation check allows generic LHF framework wording", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-isolation-clean-"));
  mkdirSync(join(root, "docs/system"), { recursive: true });
  writeFileSync(join(root, "docs/system/READ-FIRST.md"), [
    "# Read First",
    "The Living Harness Framework is a reusable Cloudflare and Supabase starter.",
    "Use GitHub Security Advisories for coordinated vulnerability disclosure.",
    "",
  ].join("\n"));

  const result = runScript("check-template-isolation.mjs", root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});
