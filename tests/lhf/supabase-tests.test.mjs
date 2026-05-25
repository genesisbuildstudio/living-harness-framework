import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("supabase test check requires pgTAP coverage for public tables", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-dbtest-"));
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  writeFileSync(join(root, "supabase/migrations/20260525000000_table.sql"), [
    "CREATE TABLE IF NOT EXISTS public.todo_items (",
    "  id uuid PRIMARY KEY DEFAULT gen_random_uuid()",
    ");",
    "ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY \"todo_items_read\" ON public.todo_items FOR SELECT TO authenticated USING (true);",
    "",
  ].join("\n"));

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/check-supabase-tests.mjs"),
    "--root",
    root,
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /todo_items/);
  assert.match(result.stderr, /missing pgTAP test/);
});
