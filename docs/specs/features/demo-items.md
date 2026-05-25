---
id: feature.demo-items
title: "Demo Items Reference Flow"
status: live
mrf_contract: true
kind: reference-flow
risk_class: medium
source_paths:
  [
    apps/web/src/index.ts,
    workers/api/src/index.ts,
    workers/api/wrangler.jsonc,
    supabase/migrations/20260525000000_initial_lhf.sql,
    packages/shared/src/observability.ts,
  ]
test_paths: [full-system-tester/tasks/002-demo-items.md]
required_generated: [docs/system/generated/harness-graph.json]
fst_task_path: full-system-tester/tasks/002-demo-items.md
---

# Demo Items Reference Flow

## Purpose

Provide one complete, safe reference path that new projects can copy: web view
model, Cloudflare Worker route, Supabase-backed table, typed errors, correlation
IDs, and FST proof.

## Runtime Contract

- `GET /demo/items` returns `ok: true`, `correlationId`, `dataMode`, and
  `items`.
- Without Supabase secrets, the endpoint returns deterministic sample data.
- With Supabase secrets, the endpoint reads from `public.lhf_demo_items`.
- Supabase failures return a typed `DEMO_ITEMS_UNAVAILABLE` envelope.
- Route failures emit redacted runtime events.

## Acceptance Criteria

- `pnpm --filter lhf-api-worker typecheck` passes.
- `pnpm lhf:check-supabase-rls` passes for `lhf_demo_items`.
- FST 002 proves the route returns a correlation ID and item list.
