#!/usr/bin/env node
import { loadRegistry } from "./lib.mjs";

const scopeIndex = process.argv.indexOf("--scope");
const scope = scopeIndex === -1 ? "unspecified" : process.argv[scopeIndex + 1];
const registry = loadRegistry();

console.log("LHF Session Start");
console.log(`Scope: ${scope}`);
console.log("\nRead before changing files:");
console.log("- AGENTS.md");
console.log("- docs/system/READ-FIRST.md");
console.log("- docs/system/MONOREPO-LAWS.md");
console.log("- docs/system/SYSTEM-MANIFEST.md");
console.log("- docs/specs/registry.json");
console.log("\nContracts loaded:", Object.keys(registry.contracts ?? {}).length);
console.log("\nRecommended closeout:");
console.log("pnpm lhf:impact --changed");
console.log("pnpm lhf:harness-graph --check");
console.log("pnpm lhf:ticket-contract --check");
console.log("pnpm lhf:session-close --changed --check");

