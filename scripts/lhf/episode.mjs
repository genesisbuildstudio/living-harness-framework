#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

const VALID_STATUSES = new Set(["pass", "fail", "block", "partial"]);

function parseArgs(argv) {
  const args = { root: ROOT, command: [], changed: [], proof: [], note: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }
    if (["command", "changed", "proof", "note"].includes(key)) {
      args[key].push(value);
    } else {
      args[key] = value;
    }
    index += 1;
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function safePart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "episode";
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const task = String(args.task ?? "").trim();
const status = String(args.status ?? "").trim();

if (!task) fail("Missing required --task <id>.");
if (!VALID_STATUSES.has(status)) fail(`Missing or invalid --status. Use one of: ${[...VALID_STATUSES].join(", ")}.`);

const createdAt = new Date().toISOString();
const receipt = {
  schemaVersion: "lhf-episode/v1",
  createdAt,
  task,
  status,
  commands: args.command,
  changedFiles: args.changed,
  proof: args.proof,
  notes: args.note,
};

const outDir = join(root, "docs/operations/episodes");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${safePart(task)}-${createdAt.replace(/[:.]/g, "-")}.json`);
writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, path: outPath, receipt }, null, 2));
