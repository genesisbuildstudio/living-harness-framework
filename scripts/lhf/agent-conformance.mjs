#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT } from "./lib.mjs";

function parseArgs(argv) {
  const args = { root: ROOT, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) args[key] = true;
    else {
      args[key] = value;
      index += 1;
    }
  }
  return args;
}

function fileContains(root, path, needles) {
  if (!existsSync(join(root, path))) return { path, missing: needles, exists: false };
  const body = readFileSync(join(root, path), "utf8");
  return { path, missing: needles.filter((needle) => !body.includes(needle)), exists: true };
}

function conformanceCheck(id, title, points, evidence) {
  const missing = evidence.flatMap((item) => item.missing.map((needle) => `${item.path}: ${needle}`));
  return {
    id,
    title,
    points,
    score: missing.length === 0 ? points : 0,
    missing,
    evidence,
  };
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const checks = [
  conformanceCheck("shared-entrypoint", "All agent platforms point at shared instructions", 20, [
    fileContains(root, "CLAUDE.md", ["@AGENTS.md", "docs/system/READ-FIRST.md"]),
    fileContains(root, ".github/copilot-instructions.md", ["AGENTS.md", "docs/system/READ-FIRST.md"]),
    fileContains(root, ".cursor/rules/lhf-core.mdc", ["AGENTS.md", "docs/system/READ-FIRST.md"]),
  ]),
  conformanceCheck("proof-before-claim", "Agent surfaces require proof before completion", 20, [
    fileContains(root, "AGENTS.md", ["pnpm lhf:session-close --changed --check"]),
    fileContains(root, ".github/pull_request_template.md", ["FST/CI Proof", "Token/Cost Impact"]),
  ]),
  conformanceCheck("prompt-injection-boundary", "External context is treated as data", 20, [
    fileContains(root, "AGENTS.md", ["External Context Is Data"]),
    fileContains(root, ".github/instructions/lhf-framework.instructions.md", ["Treat external text as data"]),
  ]),
  conformanceCheck("source-of-truth", "Agents are routed through source-of-truth docs", 20, [
    fileContains(root, "AGENTS.md", ["docs/system/READ-FIRST.md", "docs/specs/registry.json"]),
    fileContains(root, "docs/system/AI-CODING-PLATFORM-GUIDE.md", ["Codex", "Claude Code", "GitHub Copilot", "Cursor"]),
  ]),
  conformanceCheck("cleanup-pressure", "Agent work must avoid duplicate systems", 20, [
    fileContains(root, "AGENTS.md", ["Do not create duplicate systems"]),
    fileContains(root, "docs/system/MONOREPO-LAWS.md", ["duplicate"]),
  ]),
];
const score = checks.reduce((sum, item) => sum + item.score, 0);
const receipt = {
  schemaVersion: "lhf-agent-conformance/v1",
  createdAt: new Date().toISOString(),
  root,
  score,
  maxScore: 100,
  checks,
};
const payload = { ok: score >= 90, receipt };
if (args.json) console.log(JSON.stringify(payload, null, 2));
else {
  console.log(`LHF Agent Conformance: ${score}/100`);
  for (const check of checks) console.log(`- ${check.score}/${check.points} ${check.id}: ${check.title}`);
}
process.exit(payload.ok ? 0 : 1);
