#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, pathExists, readJson } from "./lib.mjs";

const rootPackagePath = "package.json";
const manifestPath = ".lhf/manifest.json";
const createPackagePath = "packages/create-living-harness/package.json";
const createBinPath = "packages/create-living-harness/bin/create-living-harness.mjs";
const releaseWorkflowPath = ".github/workflows/release-npm.yml";

const failures = [];

function addFailure(message) {
  failures.push(message);
}

function requirePath(path) {
  if (!pathExists(path)) addFailure(`${path} is missing`);
}

function requireIncludes(label, body, expected) {
  if (!body.includes(expected)) addFailure(`${label} must include ${expected}`);
}

function requireMatches(label, body, pattern, description) {
  if (!pattern.test(body)) addFailure(`${label} must include ${description}`);
}

for (const path of [rootPackagePath, manifestPath, createPackagePath, createBinPath, releaseWorkflowPath]) {
  requirePath(path);
}

let rootPackage = {};
let manifest = {};
let createPackage = {};

try {
  rootPackage = readJson(rootPackagePath);
  manifest = readJson(manifestPath);
  createPackage = readJson(createPackagePath);
} catch (error) {
  addFailure(`release metadata JSON must parse: ${error.message}`);
}

const rootVersion = rootPackage.version;
const packageVersion = createPackage.version;
const manifestVersion = manifest.version;

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(String(packageVersion ?? ""))) {
  addFailure(`package version ${packageVersion ?? "<missing>"} must be valid semver`);
}
if (rootVersion !== packageVersion) {
  addFailure(`root package version ${rootVersion ?? "<missing>"} must match package version ${packageVersion ?? "<missing>"}`);
}
if (manifestVersion !== packageVersion) {
  addFailure(`manifest version ${manifestVersion ?? "<missing>"} must match package version ${packageVersion ?? "<missing>"}`);
}

if (createPackage.name !== "create-living-harness") {
  addFailure("create package name must be create-living-harness");
}
if (createPackage.publishConfig?.access !== "public") {
  addFailure("create package publishConfig.access must be public");
}
if (createPackage.publishConfig?.provenance !== true) {
  addFailure("create package publishConfig.provenance must be true");
}
if (createPackage.bin?.["create-living-harness"] !== "bin/create-living-harness.mjs") {
  addFailure("create package bin must expose bin/create-living-harness.mjs");
}

if (pathExists(releaseWorkflowPath)) {
  const workflow = readFileSync(join(ROOT, releaseWorkflowPath), "utf8");
  requireMatches(releaseWorkflowPath, workflow, /on:\s*\n\s*release:\s*\n\s*types:\s*\[\s*published\s*\]/m, "release published trigger");
  requireIncludes(releaseWorkflowPath, workflow, "workflow_dispatch:");
  requireMatches(releaseWorkflowPath, workflow, /^permissions:/m, "explicit permissions");
  requireMatches(releaseWorkflowPath, workflow, /^\s+contents:\s+read\s*$/m, "contents: read permission");
  requireMatches(releaseWorkflowPath, workflow, /^\s+id-token:\s+write\s*$/m, "id-token: write permission");
  requireIncludes(releaseWorkflowPath, workflow, "environment: npm-publish");
  requireIncludes(releaseWorkflowPath, workflow, "registry-url: https://registry.npmjs.org");
  requireIncludes(releaseWorkflowPath, workflow, "package-manager-cache: false");
  requireIncludes(releaseWorkflowPath, workflow, "npm install -g npm@11.16.0");
  requireIncludes(releaseWorkflowPath, workflow, "pnpm install --frozen-lockfile");
  requireIncludes(releaseWorkflowPath, workflow, "pnpm typecheck");
  requireIncludes(releaseWorkflowPath, workflow, "pnpm build");
  requireIncludes(releaseWorkflowPath, workflow, "pnpm test");
  requireIncludes(releaseWorkflowPath, workflow, "pnpm lhf:session-close --changed --check");
  requireIncludes(releaseWorkflowPath, workflow, "package_version=");
  requireIncludes(releaseWorkflowPath, workflow, "github.event.release.tag_name || github.ref_name");
  requireIncludes(releaseWorkflowPath, workflow, "test \"$tag_name\" = \"v$package_version\"");
  requireIncludes(releaseWorkflowPath, workflow, "npm pack --dry-run");
  requireIncludes(releaseWorkflowPath, workflow, "npm publish --access public");
  requireIncludes(releaseWorkflowPath, workflow, "working-directory: packages/create-living-harness");

  for (const blocked of ["NODE_AUTH_TOKEN", "NPM_TOKEN", "_authToken"]) {
    if (workflow.includes(blocked)) {
      addFailure(`${releaseWorkflowPath} must use OIDC trusted publishing, not ${blocked}`);
    }
  }
}

if (existsSync(join(ROOT, "wrangler.toml"))) {
  addFailure("release-ready template must not contain wrangler.toml");
}

if (failures.length > 0) {
  console.error("npm release readiness check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: npm release boundary is ready for create-living-harness@${packageVersion}.`);
