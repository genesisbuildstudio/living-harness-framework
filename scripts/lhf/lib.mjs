import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = process.env.LHF_ROOT
  ? resolve(process.env.LHF_ROOT)
  : join(dirname(fileURLToPath(import.meta.url)), "../..");
export const REGISTRY_PATH = "docs/specs/registry.json";

export function normalizePath(path) {
  return String(path ?? "").replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

export function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
}

export function pathExists(path) {
  return existsSync(join(ROOT, path));
}

export function runProcess(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    ...options,
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
}

export function trackedFiles() {
  const result = runProcess("git", ["ls-files"]);
  if (result.status === 0 && result.stdout.trim()) {
    return result.stdout.split("\n").map(normalizePath).filter(Boolean).sort();
  }
  return walkFiles(ROOT)
    .map((file) => normalizePath(relative(ROOT, file)))
    .filter((path) => !path.startsWith(".git/") && !path.startsWith("node_modules/"))
    .sort();
}

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if ([".git", "node_modules", "dist", ".wrangler"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

export function loadRegistry() {
  if (!pathExists(REGISTRY_PATH)) {
    throw new Error(`${REGISTRY_PATH} is missing`);
  }
  return readJson(REGISTRY_PATH);
}

export function contractEntries(registry = loadRegistry()) {
  return Object.entries(registry.contracts ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

function registeredPathMatches(changedPath, registeredPath) {
  const changed = normalizePath(changedPath);
  const registered = normalizePath(registeredPath);
  if (!registered) return false;
  if (changed === registered) return true;
  const full = join(ROOT, registered);
  if (existsSync(full) && statSync(full).isDirectory()) return changed.startsWith(`${registered}/`);
  return registered.endsWith("/") && changed.startsWith(registered);
}

export function collectChangedPaths() {
  const paths = new Set();
  for (const args of [
    ["diff", "--name-only", "--diff-filter=ACMRTUXB", "origin/main...HEAD"],
    ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    const result = runProcess("git", args);
    if (result.status === 0) {
      for (const path of result.stdout.split("\n").map(normalizePath).filter(Boolean)) paths.add(path);
    }
  }
  return [...paths].sort();
}

export function mapPathsToContracts(paths, registry = loadRegistry()) {
  const mapped_paths = [];
  const unmapped_paths = [];
  const impacted = new Map();

  for (const path of [...new Set(paths.map(normalizePath).filter(Boolean))].sort()) {
    const matches = [];
    for (const [, contract] of contractEntries(registry)) {
      const checks = [
        ["spec", contract.spec],
        ...((contract.source_paths ?? []).map((source) => ["source", source])),
        ...((contract.test_paths ?? []).map((test) => ["test", test])),
        ...((contract.required_generated ?? []).map((generated) => ["generated", generated])),
        ["fst", contract.fst_task_path],
      ];
      for (const [relationship, registered] of checks) {
        if (registeredPathMatches(path, registered)) {
          matches.push({ id: contract.id, title: contract.title, relationship, spec: contract.spec, fst_task_path: contract.fst_task_path ?? null });
        }
      }
    }
    if (matches.length === 0) {
      unmapped_paths.push(path);
      continue;
    }
    mapped_paths.push({ path, contracts: matches });
    for (const match of matches) {
      if (!impacted.has(match.id)) {
        impacted.set(match.id, { ...match, relationships: new Set(), paths: [] });
      }
      impacted.get(match.id).relationships.add(match.relationship);
      impacted.get(match.id).paths.push(path);
    }
  }

  return {
    mapped_paths,
    unmapped_paths,
    impacted_contracts: [...impacted.values()].map((item) => ({
      ...item,
      relationships: [...item.relationships].sort(),
      paths: [...new Set(item.paths)].sort(),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  };
}
