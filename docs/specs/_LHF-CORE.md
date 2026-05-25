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
    README.md,
    SECURITY.md,
    package.json,
    pnpm-lock.yaml,
    pnpm-workspace.yaml,
    tsconfig.base.json,
    .env.example,
    .gitignore,
    .github,
    docs/system,
    docs/specs,
    docs/operations,
    scripts,
    packages/shared,
    workers/brain,
    workers/api/package.json,
    workers/api/tsconfig.json,
    apps/web,
    supabase,
    full-system-tester,
  ]
test_paths: []
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
- `pnpm lhf:harness-graph --check` passes.
- `pnpm lhf:ticket-contract --check` passes.
- `pnpm lhf:impact --changed` maps framework-owned files to this contract.
- `pnpm lhf:session-close --changed --check` passes.
