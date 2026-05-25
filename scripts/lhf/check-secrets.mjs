#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT, collectChangedPaths, trackedFiles } from "./lib.mjs";

const allowLine = /(example|placeholder|replace[_ -]?me|your[_ -]?|<[^>]+>|^\s*#)/i;
const skipPaths = new Set(["pnpm-lock.yaml"]);
const skipPrefixes = ["node_modules/", ".git/", "docs/system/RESEARCH-BASELINE.md"];
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ["OpenAI key", /\bsk-(?:proj-|live-)?[A-Za-z0-9_-]{20,}\b/],
  ["Anthropic key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ["Stripe live key", /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ["GitHub token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["Supabase service role JWT", /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ[A-Za-z0-9_-]{20,}\./],
];

const paths = new Set([...trackedFiles(), ...collectChangedPaths()]);
const failures = [];

for (const path of [...paths].sort()) {
  if (skipPaths.has(path) || skipPrefixes.some((prefix) => path.startsWith(prefix))) continue;
  const full = join(ROOT, path);
  if (!existsSync(full) || !statSync(full).isFile()) continue;
  const body = readFileSync(full, "utf8");
  const lines = body.split("\n");
  lines.forEach((line, index) => {
    if (allowLine.test(line)) return;
    for (const [name, pattern] of patterns) {
      if (pattern.test(line)) failures.push(`${path}:${index + 1}: possible ${name}`);
    }
  });
}

if (failures.length > 0) {
  console.error("Secret scan failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: no high-confidence committed secrets found.");
