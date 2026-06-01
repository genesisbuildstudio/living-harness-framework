# System Manifest

This is the human-readable inventory. Generated truth lives in
`docs/system/generated/harness-graph.json`.

## Stack

| Layer | Default |
| --- | --- |
| Package manager | pnpm |
| Runtime | Node.js 22.14+ |
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
| `packages/create-living-harness` | Public create package |
| `scripts/lhf` | Harness scripts |
| `full-system-tester` | Lightweight proof tasks |
| `supabase` | Database migrations and seed data |
| `.github` | CI, PR template, Copilot instructions |
| `.cursor` | Cursor project rule adapter |
| `examples` | Adaptation examples that keep proof and ownership boundaries |

## Required Generated Files

- `docs/specs/registry.json`
- `docs/system/generated/harness-graph.json`

## Required Gates

- `pnpm lhf:doctor`
- `pnpm lhf:download-smoke --json`
- `pnpm lhf:benchmark`
- `pnpm lhf:agent-conformance`
- `pnpm lhf:publication-status --json`
- `pnpm lhf:check-ai-surfaces`
- `pnpm lhf:check-branch-protection --repo <owner>/<repo>`
- `pnpm lhf:check-github-actions`
- `pnpm lhf:check-npm-release`
- `pnpm lhf:check-template-isolation`
- `pnpm lhf:check-secrets`
- `pnpm lhf:check-script-registry`
- `pnpm lhf:check-supabase-rls`
- `pnpm lhf:check-supabase-tests`
- `pnpm lhf:check-wrangler`
- `pnpm lhf:upgrade --check`
- `pnpm lhf:session-close --changed --check`

## Public Distribution

- `packages/create-living-harness` publishes the `create-living-harness` CLI.
- `.github/workflows/release-npm.yml` publishes with npm provenance.
- `.github/workflows/pages.yml` deploys `docs-site/` to GitHub Pages.
