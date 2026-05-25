#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function updateJson(root, path, update, changed) {
  const full = join(root, path);
  if (!existsSync(full)) return;
  const before = readFileSync(full, "utf8");
  const next = update(readJson(full));
  const after = `${JSON.stringify(next, null, 2)}\n`;
  if (before !== after) {
    writeFileSync(full, after);
    changed.push(path);
  }
}

function updateText(root, path, update, changed) {
  const full = join(root, path);
  if (!existsSync(full)) return;
  const before = readFileSync(full, "utf8");
  const after = update(before);
  if (before !== after) {
    writeFileSync(full, after);
    changed.push(path);
  }
}

const args = parseArgs(process.argv.slice(2));
const projectName = String(args.name ?? "").trim();
const slug = slugify(args.slug ?? projectName);
const workerPrefix = slugify(args["worker-prefix"] ?? slug);
const root = resolve(String(args.root ?? ROOT));

if (!projectName) fail("Missing required --name <Project Name>.");
if (!slug) fail("Missing valid --slug <project-slug> or slugifiable --name.");
if (!workerPrefix) fail("Missing valid --worker-prefix <prefix>.");

const changed = [];

updateJson(root, "package.json", (pkg) => ({
  ...pkg,
  name: slug,
  description: pkg.description?.includes("AI-native monorepo starter")
    ? `${projectName} application monorepo`
    : pkg.description,
}), changed);

updateJson(root, "workers/api/package.json", (pkg) => ({ ...pkg, name: `${slug}-api-worker` }), changed);
updateJson(root, "workers/brain/package.json", (pkg) => ({ ...pkg, name: `${slug}-brain-worker` }), changed);
updateJson(root, "apps/web/package.json", (pkg) => ({ ...pkg, name: `${slug}-web` }), changed);

updateJson(root, "workers/api/wrangler.jsonc", (config) => ({
  ...config,
  name: `${workerPrefix}-api`,
  vars: {
    ...(config.vars ?? {}),
    LHF_PROJECT_SLUG: slug,
  },
}), changed);

updateText(root, "README.md", (body) => {
  if (/^# .+$/m.test(body)) return body.replace(/^# .+$/m, `# ${projectName}`);
  return `# ${projectName}\n\n${body}`;
}, changed);

updateText(root, "docs/system/SYSTEM-MANIFEST.md", (body) => {
  if (body.includes(projectName)) return body;
  return body.replace("Living Harness Framework", `${projectName} on Living Harness Framework`);
}, changed);

console.log(JSON.stringify({
  ok: true,
  root,
  projectName,
  slug,
  workerPrefix,
  changed,
}, null, 2));
