#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const REQUIRED_CHECKS = ["ci", "lhf-health", "analyze"];

function parseArgs(argv) {
  const args = {};
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

function loadRules(args) {
  if (args.fixture) return JSON.parse(readFileSync(String(args.fixture), "utf8"));
  if (!args.repo) {
    console.error("Missing --repo owner/name or --fixture rules.json.");
    process.exit(1);
  }
  const result = spawnSync("gh", ["api", `/repos/${args.repo}/rulesets?targets=branch`], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || "Unable to fetch repository rulesets with gh.");
    process.exit(1);
  }
  const rulesets = JSON.parse(result.stdout);
  return rulesets.map((ruleset) => {
    if (Array.isArray(ruleset.rules)) return ruleset;
    const detail = spawnSync("gh", ["api", `/repos/${args.repo}/rulesets/${ruleset.id}`], {
      encoding: "utf8",
      shell: false,
    });
    if (detail.status !== 0) return ruleset;
    return JSON.parse(detail.stdout);
  });
}

function flattenChecks(rulesets) {
  const checks = new Set();
  for (const ruleset of rulesets) {
    for (const rule of ruleset.rules ?? []) {
      for (const check of rule.parameters?.required_status_checks ?? []) {
        checks.add(check.context);
      }
    }
  }
  return checks;
}

const args = parseArgs(process.argv.slice(2));
const rulesets = loadRules(args);
const active = rulesets.filter((ruleset) => ruleset.enforcement === "active");
const ruleTypes = new Set(active.flatMap((ruleset) => (ruleset.rules ?? []).map((rule) => rule.type)));
const checks = flattenChecks(active);
const failures = [];

if (active.length === 0) failures.push("no active branch rulesets found");
if (!ruleTypes.has("pull_request")) failures.push("missing pull_request rule");
if (!ruleTypes.has("required_status_checks")) failures.push("missing required_status_checks rule");
for (const check of REQUIRED_CHECKS) {
  if (!checks.has(check)) failures.push(`missing required status check: ${check}`);
}

if (failures.length > 0) {
  console.error("Branch protection check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: active branch protection includes pull requests and required checks: ${REQUIRED_CHECKS.join(", ")}.`);
