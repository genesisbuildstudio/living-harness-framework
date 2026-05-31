#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
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

function jsonOut(args, payload) {
  if (args.json) console.log(JSON.stringify(payload, null, 2));
  else console.log(JSON.stringify(payload, null, 2));
}

function diffLines(before, after, file) {
  const beforeLines = String(before ?? "").split("\n");
  const afterLines = String(after ?? "").split("\n");
  const out = [`--- a/${file}`, `+++ b/${file}`];
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let index = 0; index < max; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];
    if (left === right) continue;
    if (left !== undefined) out.push(`-${left}`);
    if (right !== undefined) out.push(`+${right}`);
  }
  return `${out.join("\n")}\n`;
}

function backupTarget(root, backupDir, file) {
  const sourcePath = join(root, file);
  const backupPath = join(backupDir, file);
  if (!existsSync(sourcePath)) return { file, existedBefore: false, backupPath: null };
  mkdirSync(dirname(backupPath), { recursive: true });
  writeFileSync(backupPath, readFileSync(sourcePath));
  return { file, existedBefore: true, backupPath };
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const source = args.source ? resolve(String(args.source)) : "";
const manifestPath = join(root, ".lhf/manifest.json");
const failures = [];
const planned = [];
const applied = [];

if (args.rollback) {
  const rollbackPath = resolve(String(args.rollback));
  const receipt = readJson(rollbackPath);
  const rolledBack = [];
  for (const backup of [...(receipt.backups ?? [])].reverse()) {
    const targetPath = join(root, backup.file);
    if (backup.existedBefore) {
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, readFileSync(backup.backupPath));
      rolledBack.push({ file: backup.file, action: "restore-backup" });
    } else if (existsSync(targetPath)) {
      unlinkSync(targetPath);
      rolledBack.push({ file: backup.file, action: "delete-restored-file" });
    }
  }
  const rollbackReceipt = {
    schemaVersion: "lhf-upgrade-rollback/v1",
    createdAt: new Date().toISOString(),
    root,
    rollbackOf: rollbackPath,
    rolledBack,
  };
  const path = writeReceipt(root, rollbackReceipt);
  jsonOut(args, { ok: true, action: "rollback", path, receipt: rollbackReceipt });
  process.exit(0);
}

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
      if ((args.apply || args.diff) && source && existsSync(sourcePath)) {
        planned.push({
          file,
          action: "restore",
          patch: diffLines("", readFileSync(sourcePath, "utf8"), file),
        });
      }
      else failures.push(`${file}: missing framework file`);
      continue;
    }
    if (source && existsSync(sourcePath) && readFileSync(targetPath, "utf8") !== readFileSync(sourcePath, "utf8")) {
      planned.push({
        file,
        action: "update",
        patch: diffLines(readFileSync(targetPath, "utf8"), readFileSync(sourcePath, "utf8"), file),
      });
    }
  }
}

if (args.apply) {
  if (!source) failures.push("--apply requires --source <template-root>");
  if (failures.length === 0) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = join(root, "docs/operations/episodes/lhf-upgrade-backups", stamp);
    const backups = [];
    for (const item of planned) {
      const sourcePath = join(source, item.file);
      const targetPath = join(root, item.file);
      backups.push(backupTarget(root, backupDir, item.file));
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, readFileSync(sourcePath));
      applied.push({ file: item.file, action: item.action });
    }
    const receipt = {
      schemaVersion: "lhf-upgrade-receipt/v1",
      createdAt: new Date().toISOString(),
      source,
      root,
      backupDir,
      backups,
      applied,
    };
    const path = writeReceipt(root, receipt);
    jsonOut(args, { ok: true, action: "applied", path, receipt });
    process.exit(0);
  }
}

if (failures.length > 0) {
  console.error("LHF upgrade check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (planned.length > 0) {
  const payload = { ok: false, action: "diff", planned };
  jsonOut(args, payload);
  if (args.check || args.diff) process.exit(1);
} else {
  console.log("PASS: LHF framework manifest is present and all framework-owned files exist.");
}
