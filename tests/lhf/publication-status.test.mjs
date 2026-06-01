import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "../..");

function writeFixture(root, version = "0.4.3") {
  mkdirSync(join(root, "packages/create-living-harness"), { recursive: true });
  writeFileSync(join(root, "package.json"), `${JSON.stringify({
    version,
  }, null, 2)}\n`);
  writeFileSync(join(root, "packages/create-living-harness/package.json"), `${JSON.stringify({
    name: "create-living-harness",
    version,
  }, null, 2)}\n`);
}

test("publication status reports offline release blockers without failing", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-"));
  writeFixture(root);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--offline",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.packageName, "create-living-harness");
  assert.equal(payload.expectedVersion, "0.4.3");
  assert.equal(payload.releaseTag, "v0.4.3");
  assert.equal(payload.readyToPublish, false);
  assert.match(payload.blockers.join("\n"), /Network checks skipped/);
});

test("publication status require-published fails before npm publication", () => {
  const root = mkdtempSync(join(tmpdir(), "lhf-publication-status-require-"));
  writeFixture(root);

  const result = spawnSync(process.execPath, [
    join(repoRoot, "scripts/lhf/publication-status.mjs"),
    "--root",
    root,
    "--offline",
    "--require-published",
    "--json",
  ], { encoding: "utf8" });

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.published, false);
  assert.equal(payload.readyToPublish, false);
});
