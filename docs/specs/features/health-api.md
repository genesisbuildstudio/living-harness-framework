---
id: feature.health-api
title: "Health API"
status: live
mrf_contract: true
kind: feature
risk_class: low
source_paths: [workers/api/src/index.ts, workers/api/wrangler.jsonc]
test_paths: []
required_generated: [docs/system/generated/harness-graph.json]
fst_task_path: full-system-tester/tasks/001-health-api.md
---

# Health API

## Purpose

Expose a minimal health endpoint so deployment and monitoring can prove the
starter Worker is alive.

## Acceptance Criteria

- `GET /healthz` returns `200` with `{ "ok": true }`.
- The API Worker appears in the harness graph.
- The FST-lite health task documents how to verify the endpoint.

