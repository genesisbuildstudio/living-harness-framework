#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT, json: false };
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

function check(id, title, failures = [], warnings = [], details = {}) {
  return {
    id,
    title,
    status: failures.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass",
    failures,
    warnings,
    details,
  };
}

function versionAtLeast(actual, minimum) {
  const actualParts = actual.split(".").map((part) => Number.parseInt(part, 10));
  const minimumParts = minimum.split(".").map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < minimumParts.length; index += 1) {
    const actualPart = actualParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;
    if (actualPart > minimumPart) return true;
    if (actualPart < minimumPart) return false;
  }
  return true;
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const checks = [];
const nodeMinimum = "22.14.0";
const nodeVersion = process.versions.node;

checks.push(check(
  "node",
  "Node runtime",
  versionAtLeast(nodeVersion, nodeMinimum) ? [] : [`Node ${nodeMinimum}+ required; found ${nodeVersion}`],
  [],
  { found: nodeVersion, required: nodeMinimum },
));

const packagePath = join(root, "package.json");
const packageJson = existsSync(packagePath) ? readJson(packagePath) : null;
checks.push(check(
  "package-manager",
  "pnpm workspace",
  [
    ...(!packageJson ? ["package.json missing"] : []),
    ...(packageJson && !String(packageJson.packageManager ?? "").startsWith("pnpm@") ? ["packageManager must be pnpm"] : []),
    ...(!existsSync(join(root, "pnpm-workspace.yaml")) ? ["pnpm-workspace.yaml missing"] : []),
  ],
  [],
  { packageManager: packageJson?.packageManager ?? null },
));

const manifestPath = join(root, ".lhf/manifest.json");
let manifest = null;
const manifestFailures = [];
if (!existsSync(manifestPath)) manifestFailures.push(".lhf/manifest.json missing");
else {
  manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== "lhf-manifest/v1") manifestFailures.push("unsupported manifest schemaVersion");
  if (!manifest.version) manifestFailures.push("manifest version missing");
}
checks.push(check("manifest", "LHF manifest", manifestFailures, [], { version: manifest?.version ?? null }));

const frameworkFiles = manifest?.frameworkFiles ?? [];
checks.push(check(
  "framework-files",
  "Framework-owned files",
  frameworkFiles.filter((file) => !existsSync(join(root, file))),
  [],
  { expected: frameworkFiles.length },
));

const aiSurfaces = ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".cursor/rules/lhf-core.mdc"];
checks.push(check(
  "ai-surfaces",
  "AI coding instruction surfaces",
  aiSurfaces.filter((file) => !existsSync(join(root, file))),
  [],
  { expected: aiSurfaces.length },
));

const requiredWorkflows = [
  ".github/workflows/ci.yml",
  ".github/workflows/lhf-health.yml",
  ".github/workflows/codeql.yml",
  ".github/workflows/pages.yml",
  ".github/workflows/release-npm.yml",
  ".github/workflows/scorecard.yml",
];
checks.push(check(
  "workflows",
  "Required GitHub workflows",
  requiredWorkflows.filter((file) => !existsSync(join(root, file))),
  [],
  { expected: requiredWorkflows.length },
));

const git = spawnSync("git", ["-C", root, "status", "--short"], { encoding: "utf8" });
checks.push(check(
  "git",
  "Git working tree",
  [],
  [
    ...(git.status === 0 ? [] : ["not a git working tree yet"]),
    ...(git.status === 0 && git.stdout.trim() ? ["working tree has local changes"] : []),
  ],
  { changedLines: git.status === 0 && git.stdout.trim() ? git.stdout.trim().split("\n").length : 0 },
));

const summary = {
  pass: checks.filter((item) => item.status === "pass").length,
  warn: checks.filter((item) => item.status === "warn").length,
  fail: checks.filter((item) => item.status === "fail").length,
};
const payload = {
  ok: summary.fail === 0,
  root,
  summary,
  checks,
};

if (args.json) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`LHF Doctor: ${payload.ok ? "PASS" : "FAIL"} (${summary.pass} pass, ${summary.warn} warn, ${summary.fail} fail)`);
  for (const item of checks) {
    console.log(`- ${item.status.toUpperCase()} ${item.id}: ${item.title}`);
    for (const failure of item.failures) console.log(`  fail: ${failure}`);
    for (const warning of item.warnings) console.log(`  warn: ${warning}`);
  }
}

process.exit(payload.ok ? 0 : 1);
