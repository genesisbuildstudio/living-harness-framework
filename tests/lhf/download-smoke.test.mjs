import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function writeDownloadFixture(root) {
  mkdirSync(join(root, ".lhf"), { recursive: true });
  mkdirSync(join(root, "scripts/lhf"), { recursive: true });
  mkdirSync(join(root, "packages/create-living-harness"), { recursive: true });
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  mkdirSync(join(root, ".github"), { recursive: true });
  mkdirSync(join(root, ".cursor/rules"), { recursive: true });

  writeFileSync(join(root, "package.json"), `${JSON.stringify({
    name: "download-fixture",
    private: true,
    packageManager: "pnpm@10.30.1",
    scripts: {
      "lhf:doctor": "node scripts/lhf/doctor.mjs",
      "lhf:publication-status": "node scripts/lhf/publication-status.mjs",
    },
  }, null, 2)}\n`);
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages: []\n");
  writeFileSync(join(root, ".lhf/manifest.json"), `${JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: "0.4.3",
    frameworkFiles: [],
  }, null, 2)}\n`);
  writeFileSync(join(root, "packages/create-living-harness/package.json"), `${JSON.stringify({
    name: "create-living-harness",
    version: "0.4.3",
  }, null, 2)}\n`);

  for (const file of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".cursor/rules/lhf-core.mdc"]) {
    writeFileSync(join(root, file), "Read docs/system/READ-FIRST.md before changing this repo.\n");
  }
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/lhf-health.yml",
    ".github/workflows/codeql.yml",
    ".github/workflows/pages.yml",
    ".github/workflows/release-npm.yml",
    ".github/workflows/scorecard.yml",
  ]) {
    writeFileSync(join(root, file), "name: fixture\n");
  }
  for (const file of ["lib.mjs", "doctor.mjs", "publication-status.mjs"]) {
    cpSync(join(repoRoot, "scripts/lhf", file), join(root, "scripts/lhf", file));
  }
}

test("download smoke copies a local source and proves first-run checks", () => {
  const source = mkdtempSync(join(tmpdir(), "lhf-download-source-"));
  const outDir = mkdtempSync(join(tmpdir(), "lhf-download-out-"));
  writeDownloadFixture(source);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/download-smoke.mjs"),
    "--source",
    source,
    "--dir",
    outDir,
    "--name",
    "download-smoke",
    "--skip-install",
    "--skip-session-close",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.source, source);
  assert.equal(payload.commands.every((command) => command.status === 0), true);
  assert.match(payload.commands.map((command) => command.command).join("\n"), /pnpm lhf:doctor --json/);
  assert.match(payload.commands.map((command) => command.command).join("\n"), /pnpm lhf:publication-status --offline --json/);
});
