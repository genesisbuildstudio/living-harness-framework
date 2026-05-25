#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, collectChangedPaths, trackedFiles } from "./lib.mjs";

function stripJsonComments(input) {
  let output = "";
  let inString = false;
  let stringQuote = "";
  let escaped = false;
  let inLine = false;
  let inBlock = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (inLine) {
      if (char === "\n") {
        inLine = false;
        output += char;
      }
      continue;
    }
    if (inBlock) {
      if (char === "*" && next === "/") {
        inBlock = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === stringQuote) {
        inString = false;
      }
      continue;
    }
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringQuote = char;
      output += char;
      continue;
    }
    if (char === "/" && next === "/") {
      inLine = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      inBlock = true;
      index += 1;
      continue;
    }
    output += char;
  }
  return output;
}

const files = [...new Set([...trackedFiles(), ...collectChangedPaths()])].sort();
const failures = [];
for (const path of files) {
  if (path.endsWith("wrangler.toml")) failures.push(`${path}: use wrangler.jsonc for new Cloudflare Workers`);
}

const configs = files.filter((path) => path.endsWith("wrangler.jsonc"));
for (const path of configs) {
  const raw = readFileSync(join(ROOT, path), "utf8");
  let config;
  try {
    config = JSON.parse(stripJsonComments(raw).replace(/,\s*([}\]])/g, "$1"));
  } catch (error) {
    failures.push(`${path}: invalid JSONC (${error.message})`);
    continue;
  }
  for (const key of ["$schema", "name", "main", "compatibility_date"]) {
    if (!config[key]) failures.push(`${path}: missing ${key}`);
  }
  if (!String(config.$schema ?? "").includes("wrangler/config-schema.json")) {
    failures.push(`${path}: $schema must point at wrangler/config-schema.json`);
  }
  if (config.observability?.enabled !== true) {
    failures.push(`${path}: observability.enabled must be true`);
  }
  for (const [key, value] of Object.entries(config.vars ?? {})) {
    if (/(secret|token|password|private|service_role)/i.test(key) && String(value ?? "").trim()) {
      failures.push(`${path}: vars.${key} looks secret-like; use Cloudflare secrets instead`);
    }
  }
}

if (failures.length > 0) {
  console.error("Wrangler config check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${configs.length} Wrangler JSONC config(s) are hardened.`);
