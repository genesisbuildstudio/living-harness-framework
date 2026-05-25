#!/usr/bin/env node
import { runProcess } from "./lib.mjs";

const checks = [
  ["pnpm", ["lhf:validate-contracts"]],
  ["pnpm", ["lhf:harness-graph", "--check"]],
  ["pnpm", ["lhf:check-ai-surfaces"]],
  ["pnpm", ["lhf:check-doc-size"]],
  ["pnpm", ["lhf:check-github-actions"]],
  ["pnpm", ["lhf:check-script-registry"]],
  ["pnpm", ["lhf:check-secrets"]],
  ["pnpm", ["lhf:check-supabase-rls"]],
  ["pnpm", ["lhf:check-supabase-tests"]],
  ["pnpm", ["lhf:check-wrangler"]],
  ["pnpm", ["lhf:ticket-contract", "--check"]],
  ["pnpm", ["lhf:upgrade", "--check"]],
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
