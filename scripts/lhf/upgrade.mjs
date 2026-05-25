#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

function writeReceipt(root, receipt) {
  const outDir = join(root, "docs/operations/episodes");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `lhf-upgrade-${receipt.createdAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return outPath;
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const source = args.source ? resolve(String(args.source)) : "";
const manifestPath = join(root, ".lhf/manifest.json");
const failures = [];
const planned = [];
const applied = [];

if (!existsSync(manifestPath)) {
  failures.push(".lhf/manifest.json: missing framework manifest");
} else {
  const manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== "lhf-manifest/v1") failures.push(".lhf/manifest.json: unsupported schemaVersion");
  if (!manifest.version) failures.push(".lhf/manifest.json: missing version");
  for (const file of manifest.frameworkFiles ?? []) {
    const targetPath = join(root, file);
    const sourcePath = source ? join(source, file) : "";
    if (!existsSync(targetPath)) {
      if (args.apply && source && existsSync(sourcePath)) planned.push({ file, action: "restore" });
      else failures.push(`${file}: missing framework file`);
      continue;
    }
    if (source && existsSync(sourcePath) && readFileSync(targetPath, "utf8") !== readFileSync(sourcePath, "utf8")) {
      planned.push({ file, action: "update" });
    }
  }
}

if (args.apply) {
  if (!source) failures.push("--apply requires --source <template-root>");
  if (failures.length === 0) {
    for (const item of planned) {
      const sourcePath = join(source, item.file);
      const targetPath = join(root, item.file);
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, readFileSync(sourcePath));
      applied.push(item);
    }
    const receipt = {
      schemaVersion: "lhf-upgrade-receipt/v1",
      createdAt: new Date().toISOString(),
      source,
      root,
      applied,
    };
    const path = writeReceipt(root, receipt);
    console.log(JSON.stringify({ ok: true, action: "applied", path, receipt }, null, 2));
    process.exit(0);
  }
}

if (failures.length > 0) {
  console.error("LHF upgrade check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (planned.length > 0) {
  console.log(JSON.stringify({ ok: false, action: "diff", planned }, null, 2));
  if (args.check) process.exit(1);
} else {
  console.log("PASS: LHF framework manifest is present and all framework-owned files exist.");
}
