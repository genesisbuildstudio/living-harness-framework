#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT, platform: "codex", json: false, write: false };
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

function slugify(value) {
  return String(value ?? "my-app")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "my-app";
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const name = String(args.name ?? "My App");
const slug = slugify(args.slug ?? name);
const platform = String(args.platform ?? "codex");
const receipt = {
  schemaVersion: "lhf-onboarding/v1",
  createdAt: new Date().toISOString(),
  project: { name, slug },
  platform,
  stack: {
    cloudflare: Boolean(args.cloudflare),
    supabase: Boolean(args.supabase),
    sentry: Boolean(args.sentry),
  },
  nextCommands: [
    "pnpm install",
    `pnpm lhf:init --name ${JSON.stringify(name)} --slug ${JSON.stringify(slug)}`,
    `pnpm lhf:session-start --scope ${JSON.stringify("first app setup")}`,
    "pnpm lhf:doctor",
    "pnpm lhf:session-close --changed --check",
  ],
  aiPrompt: "Read AGENTS.md and docs/system/READ-FIRST.md. Use the Living Harness Framework rules while helping me build this app.",
};

let path = null;
if (args.write) {
  mkdirSync(join(root, ".lhf"), { recursive: true });
  path = join(root, ".lhf/onboarding.json");
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

const payload = { ok: true, root, path, receipt };
if (args.json) console.log(JSON.stringify(payload, null, 2));
else {
  console.log(`LHF onboarding for ${name} (${slug})`);
  console.log(`AI platform: ${platform}`);
  console.log("Next commands:");
  for (const command of receipt.nextCommands) console.log(`- ${command}`);
  console.log(`AI prompt: ${receipt.aiPrompt}`);
}
