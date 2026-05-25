# Platform Map

This starter begins intentionally small.

## Workers

| Worker | Path | Purpose |
| --- | --- | --- |
| API | `workers/api` | HTTP API starter with health route |
| Brain | `workers/brain` | Optional AI/runtime worker placeholder |

## Apps

| App | Path | Purpose |
| --- | --- | --- |
| Web | `apps/web` | Optional web app placeholder |

## Database

| Store | Path | Purpose |
| --- | --- | --- |
| Supabase | `supabase/migrations` | Postgres schema migrations |

## Reference Flows

| Flow | Paths |
| --- | --- |
| Demo items | `apps/web/src/index.ts`, `workers/api/src/index.ts`, `public.lhf_demo_items` |

## Proof

| Proof Surface | Path |
| --- | --- |
| FST-lite tasks | `full-system-tester/tasks` |
| Specs registry | `docs/specs/registry.json` |
| Harness graph | `docs/system/generated/harness-graph.json` |

## AI Platform Adapters

| Platform | Path |
| --- | --- |
| Shared agents | `AGENTS.md` |
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| GitHub path instructions | `.github/instructions/lhf-framework.instructions.md` |
| Cursor | `.cursor/rules/lhf-core.mdc` |
