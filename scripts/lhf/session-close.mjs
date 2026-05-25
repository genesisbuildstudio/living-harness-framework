#!/usr/bin/env node
import { runProcess } from "./lib.mjs";

const checks = [
  ["pnpm", ["lhf:validate-contracts"]],
  ["pnpm", ["lhf:harness-graph", "--check"]],
  ["pnpm", ["lhf:ticket-contract", "--check"]],
];

let failed = false;
for (const [command, args] of checks) {
  const result = runProcess(command, args, { stdio: "pipe" });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) failed = true;
}

if (failed) {
  console.error("LHF session close failed.");
  process.exit(1);
}

console.log("PASS: LHF session close checks passed.");

