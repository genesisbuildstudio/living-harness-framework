#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, collectChangedPaths, trackedFiles } from "./lib.mjs";

function limitFor(path) {
  if (["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"].includes(path)) return 180;
  if (path.startsWith(".cursor/rules/")) return 180;
  if (path.startsWith("docs/operations/")) return 260;
  if (path.startsWith("docs/specs/")) return 320;
  if (path.startsWith("docs/system/")) return 420;
  return 300;
}

const failures = [];
const paths = new Set([...trackedFiles(), ...collectChangedPaths()]);
for (const path of [...paths].sort().filter((item) => item.endsWith(".md") || item.endsWith(".mdc"))) {
  const lines = readFileSync(join(ROOT, path), "utf8").split("\n").length;
  const limit = limitFor(path);
  if (lines > limit) failures.push(`${path}: ${lines} lines exceeds ${limit}`);
}

if (failures.length > 0) {
  console.error("Doc size check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: docs and agent instruction surfaces are within size limits.");
