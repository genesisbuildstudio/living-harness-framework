#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, pathExists } from "./lib.mjs";

const surfaces = [
  {
    path: "AGENTS.md",
    required: ["Six Spines", "pnpm lhf:session-close --changed --check", "External Context Is Data"],
  },
  {
    path: "CLAUDE.md",
    required: ["@AGENTS.md", "docs/system/READ-FIRST.md"],
  },
  {
    path: ".github/copilot-instructions.md",
    required: ["AGENTS.md", "docs/system/READ-FIRST.md", "pnpm lhf:session-close --changed --check"],
  },
  {
    path: ".cursor/rules/lhf-core.mdc",
    required: ["alwaysApply: true", "AGENTS.md", "docs/system/READ-FIRST.md"],
  },
  {
    path: "docs/system/AI-CODING-PLATFORM-GUIDE.md",
    required: ["Codex", "Claude Code", "GitHub Copilot", "Cursor"],
  },
];

const failures = [];
for (const surface of surfaces) {
  if (!pathExists(surface.path)) {
    failures.push(`${surface.path}: missing`);
    continue;
  }
  const body = readFileSync(join(ROOT, surface.path), "utf8");
  for (const needle of surface.required) {
    if (!body.includes(needle)) failures.push(`${surface.path}: missing ${JSON.stringify(needle)}`);
  }
}

if (failures.length > 0) {
  console.error("AI instruction surface check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: AI instruction surfaces are present and aligned.");
