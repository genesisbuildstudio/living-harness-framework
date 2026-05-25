import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test("init-project rewrites starter identity without touching missing optional files", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-init-"));
  mkdirSync(join(root, "workers/api"), { recursive: true });
  mkdirSync(join(root, "workers/brain"), { recursive: true });
  mkdirSync(join(root, "apps/web"), { recursive: true });
  mkdirSync(join(root, "docs/system"), { recursive: true });

  writeJson(join(root, "package.json"), {
    name: "living-harness-framework-starter",
    version: "0.1.0",
    description: "AI-native monorepo starter for Cloudflare + Supabase apps",
  });
  writeJson(join(root, "workers/api/wrangler.jsonc"), {
    name: "lhf-api",
    main: "src/index.ts",
    compatibility_date: "2026-05-25",
    observability: { enabled: true },
  });
  writeJson(join(root, "workers/brain/package.json"), { name: "lhf-brain-worker" });
  writeJson(join(root, "apps/web/package.json"), { name: "lhf-web" });
  writeFileSync(join(root, "README.md"), "# Living Harness Framework\n\nAI-native monorepo starter.\n");
  writeFileSync(join(root, "docs/system/SYSTEM-MANIFEST.md"), "# System Manifest\n\n| Agent framework | Living Harness Framework |\n");

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/init-project.mjs"),
    "--root",
    root,
    "--name",
    "Acme Ops",
    "--slug",
    "acme-ops",
    "--worker-prefix",
    "acme-ops",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name, "acme-ops");
  assert.equal(JSON.parse(readFileSync(join(root, "workers/api/wrangler.jsonc"), "utf8")).name, "acme-ops-api");
  assert.equal(JSON.parse(readFileSync(join(root, "workers/brain/package.json"), "utf8")).name, "acme-ops-brain-worker");
  assert.equal(JSON.parse(readFileSync(join(root, "apps/web/package.json"), "utf8")).name, "acme-ops-web");
  assert.match(readFileSync(join(root, "README.md"), "utf8"), /^# Acme Ops/m);
  assert.match(readFileSync(join(root, "docs/system/SYSTEM-MANIFEST.md"), "utf8"), /Acme Ops/);
});
