import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

test("create-living-harness default clone target uses the public template repo", () => {
  const body = readFileSync(join(repoRoot, "packages/create-living-harness/bin/create-living-harness.mjs"), "utf8");
  assert.match(body, /https:\/\/github\.com\/genesisbuildstudio\/living-harness-framework\.git/);
  assert.doesNotMatch(body, /github\.com\/living-harness\/framework\.git/);
});

test("create-living-harness copies a local template and runs init", () => {
  const source = mkdtempSync(join(tmpdir(), "lhf-template-"));
  const targetRoot = mkdtempSync(join(tmpdir(), "lhf-create-"));
  mkdirSync(join(source, "scripts/lhf"), { recursive: true });
  mkdirSync(join(source, "workers/api"), { recursive: true });
  writeFileSync(join(source, "README.md"), "# Living Harness Framework\n");
  writeFileSync(join(source, "package.json"), JSON.stringify({ name: "living-harness-framework-starter", type: "module" }, null, 2));
  writeFileSync(join(source, "workers/api/wrangler.jsonc"), JSON.stringify({
    name: "lhf-api",
    main: "src/index.ts",
    compatibility_date: "2026-05-25",
    observability: { enabled: true },
  }, null, 2));
  writeFileSync(join(source, "scripts/lhf/init-project.mjs"), readFileSync(join(repoRoot, "scripts/lhf/init-project.mjs"), "utf8"));
  writeFileSync(join(source, "scripts/lhf/lib.mjs"), readFileSync(join(repoRoot, "scripts/lhf/lib.mjs"), "utf8"));

  const result = spawnSync(process.execPath, [
    join(repoRoot, "packages/create-living-harness/bin/create-living-harness.mjs"),
    "acme-app",
    "--source",
    source,
    "--dir",
    targetRoot,
    "--name",
    "Acme App",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const target = join(targetRoot, "acme-app");
  assert.equal(JSON.parse(readFileSync(join(target, "package.json"), "utf8")).name, "acme-app");
  assert.equal(JSON.parse(readFileSync(join(target, "workers/api/wrangler.jsonc"), "utf8")).name, "acme-app-api");
  assert.equal(existsSync(join(target, ".git")), false);
});
