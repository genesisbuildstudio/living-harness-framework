#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, trackedFiles } from "./lib.mjs";

const REQUIRED_FIELDS = [
  "Ticket",
  "Primary Spine",
  "Consolidates/Replaces",
  "Must Not Duplicate",
  "Owning Spec",
  "FST / CI / Eval Proof",
  "Rollback / Kill Switch",
  "Cleanup / Removal Target",
  "Acceptance Criteria",
  "Done Means",
];

const markdownFiles = trackedFiles().filter((path) => path.endsWith(".md"));
const failures = [];

for (const path of markdownFiles) {
  const text = readFileSync(join(ROOT, path), "utf8");
  if (!text.includes("LHF Ticket Contract:")) continue;
  for (const field of REQUIRED_FIELDS) {
    const re = new RegExp(`- ${field}:\\s*(.+)`);
    const match = text.match(re);
    if (!match || !match[1].trim()) failures.push(`${path}: missing ${field}`);
  }
}

if (failures.length > 0) {
  console.error("LHF ticket contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: LHF ticket contracts are complete.");

