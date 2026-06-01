#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_SOURCE = "https://github.com/genesisbuildstudio/living-harness-framework.git";

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    name: "lhf-download-smoke",
    json: false,
    keep: false,
    skipInstall: false,
    skipSessionClose: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function commandString(command, args) {
  return [command, ...args].join(" ");
}

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  return {
    command: commandString(command, args),
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
}

function isProbablyGitUrl(source) {
  return /^(https?:|git@|ssh:)/.test(source) || source.endsWith(".git");
}

function copyLocalSource(source, target) {
  cpSync(source, target, {
    recursive: true,
    filter: (path) => {
      const parts = path.split(/[\\/]+/);
      return !parts.some((part) => [".git", "node_modules", "dist", "coverage", ".wrangler"].includes(part));
    },
  });
}

function print(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(`LHF Download Smoke: ${payload.ok ? "PASS" : "FAIL"}`);
  console.log(`- source: ${payload.source}`);
  console.log(`- target: ${payload.target}`);
  for (const command of payload.commands) {
    console.log(`- ${command.status === 0 ? "PASS" : "FAIL"} ${command.command}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const source = String(args.source ?? DEFAULT_SOURCE);
const parent = args.dir ? resolve(String(args.dir)) : mkdtempSync(join(tmpdir(), "lhf-download-smoke-"));
const name = String((args.name ?? basename(source, ".git")) || "lhf-download-smoke").replace(/[^a-zA-Z0-9._-]+/g, "-");
const target = resolve(parent, name);
const commands = [];
const failures = [];

if (existsSync(target)) {
  failures.push(`target already exists: ${target}`);
} else {
  mkdirSync(parent, { recursive: true });
  if (existsSync(source)) {
    copyLocalSource(resolve(source), target);
  } else if (isProbablyGitUrl(source)) {
    const clone = run(parent, "git", ["clone", "--depth", "1", source, name]);
    commands.push(clone);
    if (clone.status !== 0) failures.push(`clone failed: ${clone.stderr || clone.stdout}`);
  } else {
    failures.push(`source does not exist and is not a git URL: ${source}`);
  }
}

if (failures.length === 0) {
  if (!args.skipInstall) {
    const install = run(target, "pnpm", ["install", "--frozen-lockfile"]);
    commands.push(install);
    if (install.status !== 0) failures.push(`install failed: ${install.stderr || install.stdout}`);
  }

  const doctor = run(target, "pnpm", ["lhf:doctor", "--json"]);
  commands.push(doctor);
  if (doctor.status !== 0) failures.push(`doctor failed: ${doctor.stderr || doctor.stdout}`);

  const publication = run(target, "pnpm", ["lhf:publication-status", "--offline", "--json"]);
  commands.push(publication);
  if (publication.status !== 0) failures.push(`publication status failed: ${publication.stderr || publication.stdout}`);

  if (!args.skipSessionClose) {
    const sessionClose = run(target, "pnpm", ["lhf:session-close", "--changed", "--check"]);
    commands.push(sessionClose);
    if (sessionClose.status !== 0) failures.push(`session close failed: ${sessionClose.stderr || sessionClose.stdout}`);
  }
}

const payload = {
  ok: failures.length === 0,
  source,
  target,
  kept: Boolean(args.keep),
  skippedInstall: Boolean(args.skipInstall),
  skippedSessionClose: Boolean(args.skipSessionClose),
  failures,
  commands,
};

if (!args.keep && !args.dir && existsSync(parent)) {
  rmSync(parent, { recursive: true, force: true });
}

print(payload, args.json);
process.exit(payload.ok ? 0 : 1);
