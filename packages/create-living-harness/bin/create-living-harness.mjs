#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_TEMPLATE_REPO = "https://github.com/living-harness/framework.git";
const SKIP = new Set([".git", "node_modules", "dist", ".wrangler", ".turbo"]);

function parseArgs(argv) {
  const args = { dir: process.cwd(), source: process.env.LHF_TEMPLATE_SOURCE ?? "", name: "", slug: "" };
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) {
      positional.push(item);
      continue;
    }
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  args.slug = args.slug || positional[0] || "";
  args.name = args.name || args.slug;
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function copyDir(source, target) {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    if (SKIP.has(entry)) continue;
    const from = join(source, entry);
    const to = join(target, entry);
    const stat = statSync(from);
    if (stat.isDirectory()) copyDir(from, to);
    else writeFileSync(to, readFileSync(from));
  }
}

function cloneTemplate(target) {
  const result = spawnSync("git", ["clone", "--depth", "1", DEFAULT_TEMPLATE_REPO, target], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) fail(result.stderr || result.stdout || `Failed to clone ${DEFAULT_TEMPLATE_REPO}`);
}

const args = parseArgs(process.argv.slice(2));
const slug = String(args.slug ?? "").trim();
const name = String(args.name ?? slug).trim();
if (!slug) fail("Usage: create-living-harness <slug> --name \"Project Name\" [--source <template-path>] [--dir <parent-dir>]");

const parent = resolve(String(args.dir ?? process.cwd()));
const target = join(parent, slug);
if (existsSync(target)) fail(`${target} already exists.`);

if (args.source) copyDir(resolve(String(args.source)), target);
else cloneTemplate(target);

const initPath = join(target, "scripts/lhf/init-project.mjs");
if (!existsSync(initPath)) fail("Template is missing scripts/lhf/init-project.mjs.");

const init = spawnSync(process.execPath, [
  initPath,
  "--root",
  target,
  "--name",
  name,
  "--slug",
  slug,
  "--worker-prefix",
  slug,
], { encoding: "utf8" });
if (init.status !== 0) fail(init.stderr || init.stdout || "Project initialization failed.");

console.log(JSON.stringify({
  ok: true,
  target,
  name,
  slug,
  command: `cd ${target} && pnpm install && pnpm lhf:session-close --changed --check`,
  packageRoot: dirname(fileURLToPath(import.meta.url)),
}, null, 2));
