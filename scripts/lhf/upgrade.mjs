#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
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

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const manifestPath = join(root, ".lhf/manifest.json");
const failures = [];

if (!existsSync(manifestPath)) {
  failures.push(".lhf/manifest.json: missing framework manifest");
} else {
  const manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== "lhf-manifest/v1") failures.push(".lhf/manifest.json: unsupported schemaVersion");
  if (!manifest.version) failures.push(".lhf/manifest.json: missing version");
  for (const file of manifest.frameworkFiles ?? []) {
    if (!existsSync(join(root, file))) failures.push(`${file}: missing framework file`);
  }
}

if (failures.length > 0) {
  console.error("LHF upgrade check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: LHF framework manifest is present and all framework-owned files exist.");
