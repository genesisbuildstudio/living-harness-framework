#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, collectChangedPaths, trackedFiles } from "./lib.mjs";

const ignoredPaths = new Set([
  "pnpm-lock.yaml",
  "scripts/lhf/check-template-isolation.mjs",
  "tests/lhf/safety-gates.test.mjs",
]);
const ignoredPrefixes = [
  ".git/",
  "node_modules/",
  "dist/",
  "coverage/",
  ".wrangler/",
];

const forbidden = [
  ["GENESIS product name", /\bGENESIS\b/],
  ["GENESIS product repo", /\bgenesisbuildstudio\/genesis-cloud\b/i],
  ["GENESIS product repo slug", /\bgenesis-cloud\b/i],
  ["GENESIS production domain", /\b(?:app\.)?genesis\.build\b/i],
  ["GENESIS product email", /\b[A-Z0-9._%+-]+@genesis\.build\b/i],
  ["GENESIS product plan path", /\bLHF-Plan\b/],
  ["GENESIS product ticket", /\bT-LH-\d+\b/],
  ["GENESIS user-brain worker", /\buser-brain\b/i],
  ["GENESIS api-gateway worker", /\bapi-gateway\b/i],
  ["GENESIS Supabase project", /\bhvgnlxzbexjoftcpftes\b/i],
  ["GENESIS local product checkout", /\/Users\/samadhi\/Projects\/GENESIS\b/],
  ["GENESIS founder-specific name", /\bDouglas Bentley\b/],
];

const paths = new Set([...trackedFiles(), ...collectChangedPaths()]);
const failures = [];

for (const path of [...paths].sort()) {
  if (ignoredPaths.has(path) || ignoredPrefixes.some((prefix) => path.startsWith(prefix))) continue;
  const full = join(ROOT, path);
  if (!existsSync(full) || !statSync(full).isFile()) continue;

  const body = readFileSync(full, "utf8");
  const lines = body.split("\n");
  lines.forEach((line, index) => {
    for (const [label, pattern] of forbidden) {
      const match = line.match(pattern);
      if (match) {
        failures.push(`${path}:${index + 1}: GENESIS-specific string (${label}): ${match[0]}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error("Template isolation check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: reusable LHF template is isolated from GENESIS product-specific strings.");
