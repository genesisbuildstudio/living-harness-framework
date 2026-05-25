#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function compact(sql) {
  return sql.replace(/--.*$/gm, " ").replace(/\s+/g, " ").trim();
}

const root = resolve(String(parseArgs(process.argv.slice(2)).root ?? ROOT));
const migrationFiles = walk(join(root, "supabase/migrations")).filter((path) => path.endsWith(".sql"));
const testFiles = walk(join(root, "supabase/tests/database")).filter((path) => path.endsWith(".sql"));
const testBody = testFiles.map((path) => readFileSync(path, "utf8")).join("\n");
const failures = [];
const tables = new Set();

for (const file of migrationFiles) {
  const sql = compact(readFileSync(file, "utf8"));
  const regex = /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?public"?\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(/gi;
  for (const match of sql.matchAll(regex)) tables.add(match[1]);
}

for (const table of [...tables].sort()) {
  if (!testBody.includes(table)) {
    failures.push(`public.${table}: missing pgTAP test`);
    continue;
  }
  if (!/(has_table|policies_are|results_eq|throws_ok)\s*\(/i.test(testBody)) {
    failures.push(`public.${table}: pgTAP test must use assertions`);
  }
}

if (failures.length > 0) {
  console.error("Supabase database test coverage check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${tables.size} public table(s) have pgTAP-style database test coverage.`);
