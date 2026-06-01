import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function runScript(script, root) {
  return spawnSync(process.execPath, [join(repoRoot, "scripts/lhf", script)], {
    encoding: "utf8",
    env: { ...process.env, LHF_ROOT: root },
  });
}

test("secret check blocks high-confidence committed credentials", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-secret-"));
  mkdirSync(join(root, "src"), { recursive: true });
  const fakeKey = ["sk", "proj", "1234567890abcdefghijklmnopqrstuvwxyz"].join("-");
  writeFileSync(join(root, "src/leak.ts"), `export const key = '${fakeKey}';\n`);

  const result = runScript("check-secrets.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /possible OpenAI key/);
});

test("supabase RLS check blocks public tables without policies", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-rls-"));
  mkdirSync(join(root, "supabase/migrations"), { recursive: true });
  writeFileSync(join(root, "supabase/migrations/20260525000000_bad.sql"), [
    "CREATE TABLE IF NOT EXISTS public.todos (",
    "  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  title text NOT NULL",
    ");",
    "",
  ].join("\n"));

  const result = runScript("check-supabase-rls.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /without ENABLE ROW LEVEL SECURITY/);
  assert.match(result.stderr, /without at least one policy/);
});

test("template isolation check blocks GENESIS product coupling", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-isolation-"));
  mkdirSync(join(root, "docs/system"), { recursive: true });
  writeFileSync(join(root, "docs/system/READ-FIRST.md"), [
    "# Read First",
    "This reusable template must not point users at genesisbuildstudio/genesis-cloud.",
    "",
  ].join("\n"));

  const result = runScript("check-template-isolation.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GENESIS-specific string/);
  assert.match(result.stderr, /genesisbuildstudio\/genesis-cloud/);
});

test("template isolation check allows generic LHF framework wording", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-isolation-clean-"));
  mkdirSync(join(root, "docs/system"), { recursive: true });
  writeFileSync(join(root, "docs/system/READ-FIRST.md"), [
    "# Read First",
    "The Living Harness Framework is a reusable Cloudflare and Supabase starter.",
    "Use GitHub Security Advisories for coordinated vulnerability disclosure.",
    "",
  ].join("\n"));

  const result = runScript("check-template-isolation.mjs", root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});

function writeNpmReleaseFixture(root, { rootVersion = "0.4.3", packageVersion = "0.4.3", manifestVersion = "0.4.3" } = {}) {
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  mkdirSync(join(root, ".lhf"), { recursive: true });
  mkdirSync(join(root, "packages/create-living-harness/bin"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({
    name: "living-harness-framework-starter",
    version: rootVersion,
    private: true,
  }, null, 2));
  writeFileSync(join(root, ".lhf/manifest.json"), JSON.stringify({
    schemaVersion: "lhf-manifest/v1",
    version: manifestVersion,
    frameworkFiles: [],
  }, null, 2));
  writeFileSync(join(root, "packages/create-living-harness/package.json"), JSON.stringify({
    name: "create-living-harness",
    version: packageVersion,
    type: "module",
    bin: {
      "create-living-harness": "bin/create-living-harness.mjs",
    },
    publishConfig: {
      access: "public",
      provenance: true,
    },
  }, null, 2));
  writeFileSync(join(root, "packages/create-living-harness/bin/create-living-harness.mjs"), "#!/usr/bin/env node\n");
  writeFileSync(join(root, ".github/workflows/release-npm.yml"), [
    "name: Release npm",
    "on:",
    "  release:",
    "    types: [published]",
    "  workflow_dispatch:",
    "permissions:",
    "  contents: read",
    "  id-token: write",
    "jobs:",
    "  publish:",
    "    runs-on: ubuntu-latest",
    "    environment: npm-publish",
    "    steps:",
    "      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
    "      - uses: pnpm/action-setup@d15e628ca66d93ee5f352c71671a7bc6a97af5c9",
    "      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e",
    "        with:",
    "          node-version: 24",
    "          package-manager-cache: false",
    "          registry-url: https://registry.npmjs.org",
    "      - run: npm install -g npm@11.16.0",
    "      - run: pnpm install --frozen-lockfile",
    "      - run: pnpm typecheck",
    "      - run: pnpm build",
    "      - run: pnpm test",
    "      - run: pnpm lhf:session-close --changed --check",
    "      - name: Verify release tag matches package version",
    "        run: |",
    "          package_version=\"$(node -p \"JSON.parse(require('node:fs').readFileSync('packages/create-living-harness/package.json', 'utf8')).version\")\"",
    "          tag_name=\"${{ github.event.release.tag_name || github.ref_name }}\"",
    "          test \"$tag_name\" = \"v$package_version\"",
    "      - run: npm pack --dry-run",
    "        working-directory: packages/create-living-harness",
    "      - run: npm publish --access public",
    "        working-directory: packages/create-living-harness",
    "",
  ].join("\n"));
}

test("npm release readiness check blocks framework version drift", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-npm-release-bad-"));
  writeNpmReleaseFixture(root, { manifestVersion: "0.4.2" });

  const result = runScript("check-npm-release-readiness.mjs", root);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /manifest version 0\.4\.2 must match package version 0\.4\.3/);
});

test("npm release readiness check accepts trusted publishing workflow", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-npm-release-good-"));
  writeNpmReleaseFixture(root);

  const result = runScript("check-npm-release-readiness.mjs", root);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PASS/);
});
