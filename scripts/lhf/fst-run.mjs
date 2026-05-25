#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT, task: "all" };
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

function safePart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "fst";
}

function taskIdFromPath(path) {
  return path.split("/").at(-1).replace(/\.md$/, "");
}

function extractCommands(markdown) {
  const commands = [];
  const fence = /```(?:bash|sh|shell)\n([\s\S]*?)```/g;
  for (const match of markdown.matchAll(fence)) {
    for (const line of match[1].split("\n").map((item) => item.trim()).filter(Boolean)) {
      if (!line.startsWith("#")) commands.push(line);
    }
  }
  return commands;
}

function findTasks(root, requested) {
  const taskRoot = join(root, "full-system-tester/tasks");
  if (!existsSync(taskRoot)) return [];
  const files = readdirSync(taskRoot)
    .filter((file) => file.endsWith(".md"))
    .map((file) => join(taskRoot, file))
    .sort();
  if (requested === "all") return files;
  return files.filter((file) => taskIdFromPath(file) === requested || taskIdFromPath(file).startsWith(`${requested}-`));
}

function writeReceipt(root, receipt) {
  const outDir = join(root, "docs/operations/episodes");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${safePart(receipt.task)}-${receipt.createdAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return outPath;
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const tasks = findTasks(root, String(args.task ?? "all"));
if (tasks.length === 0) {
  console.error(`No FST tasks found for ${String(args.task ?? "all")}.`);
  process.exit(1);
}

const receipts = [];
let failed = false;
for (const taskPath of tasks) {
  const task = taskIdFromPath(taskPath);
  const commands = extractCommands(readFileSync(taskPath, "utf8"));
  const proof = [];
  const notes = [];
  let status = "pass";

  if (commands.length === 0) {
    status = "block";
    notes.push("Task has no executable bash code fence.");
    failed = true;
  }

  for (const command of commands) {
    const result = spawnSync(command, {
      cwd: root,
      encoding: "utf8",
      shell: true,
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    proof.push(output || `${command} exited ${result.status ?? 1}`);
    if ((result.status ?? 1) !== 0) {
      status = "fail";
      failed = true;
      break;
    }
  }

  const receipt = {
    schemaVersion: "lhf-fst-receipt/v1",
    createdAt: new Date().toISOString(),
    task,
    status,
    commands,
    proof,
    notes,
  };
  const path = writeReceipt(root, receipt);
  receipts.push({ path, receipt });
  console.log(JSON.stringify({ ok: status === "pass", path, receipt }, null, 2));
}

if (failed) process.exit(1);
