#!/usr/bin/env node
import { contractEntries, loadRegistry, pathExists } from "./lib.mjs";

const registry = loadRegistry();
const errors = [];

for (const [id, contract] of contractEntries(registry)) {
  if (id !== contract.id) errors.push(`${id}: registry key does not match contract id ${contract.id}`);
  if (!pathExists(contract.spec)) errors.push(`${id}: missing spec ${contract.spec}`);
  for (const path of contract.source_paths ?? []) if (!pathExists(path)) errors.push(`${id}: missing source ${path}`);
  for (const path of contract.test_paths ?? []) if (!pathExists(path)) errors.push(`${id}: missing test ${path}`);
  for (const path of contract.required_generated ?? []) if (!pathExists(path)) errors.push(`${id}: missing generated ${path}`);
  if (contract.fst_task_path && !pathExists(contract.fst_task_path)) errors.push(`${id}: missing FST task ${contract.fst_task_path}`);
}

if (errors.length > 0) {
  console.error("Contract validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS: ${contractEntries(registry).length} contracts validate.`);

