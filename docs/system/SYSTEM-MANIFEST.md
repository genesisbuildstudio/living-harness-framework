# System Manifest

This is the human-readable inventory. Generated truth lives in
`docs/system/generated/harness-graph.json`.

## Stack

| Layer | Default |
| --- | --- |
| Package manager | pnpm |
| Runtime | Node.js 22+ |
| App hosting | Cloudflare Workers |
| Database | Supabase Postgres |
| CI | GitHub Actions |
| Agent framework | Living Harness Framework |

## Workspaces

| Workspace | Purpose |
| --- | --- |
| `apps/web` | Optional web app package |
| `workers/api` | Cloudflare Worker starter |
| `workers/brain` | Optional agent/runtime Worker starter |
| `packages/shared` | Shared TypeScript contracts |
| `scripts/lhf` | Harness scripts |
| `full-system-tester` | Lightweight proof tasks |
| `supabase` | Database migrations and seed data |

## Required Generated Files

- `docs/specs/registry.json`
- `docs/system/generated/harness-graph.json`

