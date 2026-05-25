#!/usr/bin/env node
import { collectChangedPaths, readJson, trackedFiles, pathExists } from "./lib.mjs";

function registryEntries(node, entries = []) {
  if (!node || typeof node !== "object") return entries;
  if (typeof node.path === "string") entries.push(node.path);
  for (const value of Object.values(node)) registryEntries(value, entries);
  return entries;
}

const registry = readJson("scripts/REGISTRY.json");
const registered = new Set(registryEntries(registry));
const paths = new Set([...trackedFiles(), ...collectChangedPaths()]);
const scripts = [...paths].sort().filter((path) => path.startsWith("scripts/") && path.endsWith(".mjs"));
const failures = [];

for (const script of scripts) {
  if (!registered.has(script)) failures.push(`${script}: missing from scripts/REGISTRY.json`);
}

for (const script of registered) {
  if (!pathExists(script)) failures.push(`${script}: registered script does not exist`);
}

if (failures.length > 0) {
  console.error("Script registry check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: ${scripts.length} scripts are registered.`);
