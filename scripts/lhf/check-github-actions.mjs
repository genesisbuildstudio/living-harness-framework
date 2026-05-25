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
    else if (/\.(ya?ml)$/i.test(entry)) out.push(full);
  }
  return out;
}

const root = resolve(String(parseArgs(process.argv.slice(2)).root ?? ROOT));
const workflowRoot = join(root, ".github/workflows");
const files = walk(workflowRoot);
const failures = [];

for (const file of files) {
  const rel = file.replace(`${root}/`, "");
  const body = readFileSync(file, "utf8");
  if (/\bpull_request_target\b/.test(body)) {
    failures.push(`${rel}: pull_request_target is blocked by default; use pull_request plus explicit maintainer review`);
  }
  if (/^permissions:\s*write-all\s*$/im.test(body)) {
    failures.push(`${rel}: permissions: write-all is blocked`);
  }
  if (!/^permissions:/m.test(body)) {
    failures.push(`${rel}: missing explicit top-level permissions`);
  }
  if (/\bsecrets:\s*inherit\b/.test(body)) {
    failures.push(`${rel}: secrets: inherit is blocked by default`);
  }
  for (const match of body.matchAll(/uses:\s*([^\s#]+)@([^\s#]+)/g)) {
    const reference = match[0];
    const ref = match[2];
    if (!/^[a-f0-9]{40}$/i.test(ref)) {
      failures.push(`${rel}: ${reference} must pin action references to a full commit SHA`);
    }
  }
}

if (failures.length > 0) {
  console.error("GitHub Actions hardening check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${files.length} GitHub Actions workflow(s) pass baseline hardening.`);
