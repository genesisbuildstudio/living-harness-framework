---
id: system.lhf-core
title: "Living Harness Core"
status: live
mrf_contract: true
kind: framework
risk_class: high
source_paths:
  [
    AGENTS.md,
    CLAUDE.md,
    CONTRIBUTING.md,
    LICENSE,
    README.md,
    SECURITY.md,
    package.json,
    packages/create-living-harness,
    docs-site,
    examples,
    pnpm-lock.yaml,
    pnpm-workspace.yaml,
    tsconfig.base.json,
    .env.example,
    .gitignore,
    .lhf,
    .cursor,
    .github,
    docs/system,
    docs/specs/_LHF-CORE.md,
    docs/specs/_TEMPLATE.md,
    docs/specs/registry.json,
    docs/specs/registry.schema.json,
    docs/operations,
    scripts,
    packages/shared/package.json,
    packages/shared/tsconfig.json,
    packages/shared/src/harness.ts,
    packages/shared/src/index.ts,
    workers/brain,
    workers/api/package.json,
    workers/api/tsconfig.json,
    full-system-tester/CLAUDE.md,
    full-system-tester/tasks/000-lhf-kernel-health.md,
    full-system-tester/templates,
  ]
test_paths: [tests/lhf]
required_generated: [docs/specs/registry.json, docs/system/generated/harness-graph.json]
fst_task_path: full-system-tester/tasks/001-health-api.md
---

# Living Harness Core

## Purpose

Own the reusable framework kernel: AI instructions, monorepo laws, source maps,
spec registry, harness graph, session gates, ticket contracts, starter package
structure, GitHub workflows, Cloudflare/Supabase starter conventions, and
FST-lite proof templates.

## Acceptance Criteria

- `pnpm lhf:validate-contracts` passes.
- `pnpm test` passes.
- `pnpm lhf:harness-graph --check` passes.
- `pnpm lhf:check-ai-surfaces` passes.
- `pnpm lhf:check-branch-protection --fixture <rules.json>` passes in tests.
- `pnpm lhf:check-github-actions` passes.
- `pnpm lhf:check-npm-release` passes.
- `pnpm lhf:check-template-isolation` passes.
- `pnpm lhf:check-secrets` passes.
- `pnpm lhf:check-supabase-rls` passes.
- `pnpm lhf:check-supabase-tests` passes.
- `pnpm lhf:check-wrangler` passes.
- `pnpm lhf:download-smoke --json` passes before public download promotion.
- `pnpm lhf:ticket-contract --check` passes.
- `pnpm lhf:upgrade --check` passes.
- `pnpm lhf:impact --changed` maps framework-owned files to this contract.
- `pnpm lhf:session-close --changed --check` passes.
