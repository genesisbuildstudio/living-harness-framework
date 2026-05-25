#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, collectChangedPaths, trackedFiles } from "./lib.mjs";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compact(sql) {
  return sql.replace(/--.*$/gm, " ").replace(/\s+/g, " ").trim();
}

const paths = new Set([...trackedFiles(), ...collectChangedPaths()]);
const migrations = [...paths].sort().filter((path) => path.startsWith("supabase/migrations/") && path.endsWith(".sql"));
const failures = [];

for (const migration of migrations) {
  const sql = compact(readFileSync(join(ROOT, migration), "utf8"));
  const tableNames = new Set();
  const tableRegex = /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?public"?\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(/gi;
  for (const match of sql.matchAll(tableRegex)) tableNames.add(match[1]);

  for (const table of tableNames) {
    const name = escapeRegExp(table);
    const rls = new RegExp(`\\balter\\s+table\\s+(?:if\\s+exists\\s+)?(?:"?public"?\\.)?"?${name}"?\\s+enable\\s+row\\s+level\\s+security\\b`, "i");
    const policy = new RegExp(`\\bcreate\\s+policy\\s+[^;]+\\bon\\s+(?:"?public"?\\.)?"?${name}"?\\b`, "i");
    if (!rls.test(sql)) failures.push(`${migration}: public.${table} is created without ENABLE ROW LEVEL SECURITY`);
    if (!policy.test(sql)) failures.push(`${migration}: public.${table} is created without at least one policy`);
  }
}

if (failures.length > 0) {
  console.error("Supabase RLS check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${migrations.length} Supabase migration file(s) include RLS coverage for public tables.`);
