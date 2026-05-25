#!/usr/bin/env node
import { collectChangedPaths, loadRegistry, mapPathsToContracts } from "./lib.mjs";

function parseArgs(argv) {
  const options = { changed: false, paths: [], check: false, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--changed") options.changed = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--path") options.paths.push(argv[++i]);
    else options.paths.push(arg);
  }
  if (!options.changed && options.paths.length === 0) options.changed = true;
  return options;
}

const options = parseArgs(process.argv.slice(2));
const registry = loadRegistry();
const paths = options.changed ? collectChangedPaths() : options.paths;
const report = {
  generated_at: new Date().toISOString(),
  path_count: paths.length,
  ...mapPathsToContracts(paths, registry),
};

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("LHF Impact Map");
  console.log(`Changed/provided paths: ${report.path_count}`);
  console.log(`Impacted contracts: ${report.impacted_contracts.length}`);
  for (const contract of report.impacted_contracts) {
    console.log(`\n- ${contract.id} — ${contract.title}`);
    console.log(`  spec: ${contract.spec}`);
    console.log(`  relationships: ${contract.relationships.join(", ")}`);
    if (contract.fst_task_path) console.log(`  fst: ${contract.fst_task_path}`);
    console.log(`  paths: ${contract.paths.join(", ")}`);
  }
  if (report.unmapped_paths.length) {
    console.log("\nUnmapped paths:");
    for (const path of report.unmapped_paths) console.log(`- ${path}`);
  }
}

if (options.check && report.unmapped_paths.length > 0) process.exitCode = 1;

