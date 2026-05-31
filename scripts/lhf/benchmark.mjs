#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function metric(id, title, score, evidence) {
  return { id, title, score, evidence };
}

const args = parseArgs(process.argv.slice(2));
const root = resolve(String(args.root ?? ROOT));
const registry = existsSync(join(root, "docs/specs/registry.json")) ? readJson(join(root, "docs/specs/registry.json")) : { contracts: {} };
const manifest = existsSync(join(root, ".lhf/manifest.json")) ? readJson(join(root, ".lhf/manifest.json")) : { frameworkFiles: [] };
const workflows = [
  ".github/workflows/ci.yml",
  ".github/workflows/lhf-health.yml",
  ".github/workflows/codeql.yml",
  ".github/workflows/pages.yml",
  ".github/workflows/release-npm.yml",
  ".github/workflows/scorecard.yml",
];
const aiSurfaces = ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".cursor/rules/lhf-core.mdc"];
const frameworkMissing = (manifest.frameworkFiles ?? []).filter((file) => !existsSync(join(root, file)));
const contractCount = Object.keys(registry.contracts ?? {}).length;
const metrics = [
  metric("contracts", "Spec registry contracts exist", contractCount > 0 ? 20 : 0, { contractCount }),
  metric("framework-files", "Manifest-owned framework files exist", frameworkMissing.length === 0 ? 20 : 0, { missing: frameworkMissing }),
  metric("ai-surfaces", "AI instruction surfaces exist", aiSurfaces.every((file) => existsSync(join(root, file))) ? 20 : 0, { expected: aiSurfaces.length }),
  metric("workflows", "Core workflows exist", workflows.every((file) => existsSync(join(root, file))) ? 20 : 0, { expected: workflows.length }),
  metric("tester", "Full-system tester task exists", existsSync(join(root, "full-system-tester/tasks/000-lhf-kernel-health.md")) ? 20 : 0, { task: "000-lhf-kernel-health" }),
];
const score = metrics.reduce((sum, item) => sum + item.score, 0);
const receipt = {
  schemaVersion: "lhf-benchmark-receipt/v1",
  createdAt: new Date().toISOString(),
  root,
  score,
  maxScore: 100,
  metrics,
};
const outDir = args["out-dir"] ? resolve(String(args["out-dir"])) : join(root, "docs/operations/episodes");
mkdirSync(outDir, { recursive: true });
const path = join(outDir, `lhf-benchmark-${receipt.createdAt.replace(/[:.]/g, "-")}.json`);
writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
const payload = { ok: score >= 80, path, receipt };
if (args.json) console.log(JSON.stringify(payload, null, 2));
else {
  console.log(`LHF Benchmark: ${score}/100`);
  for (const item of metrics) console.log(`- ${item.score}/20 ${item.id}: ${item.title}`);
  console.log(`Receipt: ${path}`);
}
process.exit(payload.ok ? 0 : 1);
