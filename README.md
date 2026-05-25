# Living Harness Framework

AI-native monorepo starter for Cloudflare + Supabase apps.

Living Harness Framework (LHF) gives AI coding agents a governed repo structure:
laws, specs, graph truth, ticket contracts, proof gates, and cleanup rules. The
goal is not to slow development down. The goal is to keep AI-built software
coherent as it grows.

## Quick Start

```bash
pnpm create living-harness my-app --name "My App"
cd my-app
pnpm install
pnpm lhf:session-start --scope "first app setup"
pnpm lhf:harness-graph
pnpm lhf:session-close --changed --check
```

Then tell your AI coding platform:

```text
Read AGENTS.md, then docs/system/READ-FIRST.md. Use the Living Harness
Framework rules while helping me build this app.
```

## What This Starter Includes

- AI agent instructions: `AGENTS.md`, `CLAUDE.md`, GitHub Copilot, Cursor
- LHF laws and source-of-truth docs: `docs/system/`
- Feature specs and generated registry: `docs/specs/`
- Harness graph generator: `scripts/lhf/harness-graph.mjs`
- Project initializer: `scripts/lhf/init-project.mjs`
- Upgrade manifest checker: `scripts/lhf/upgrade.mjs`
- Create package: `packages/create-living-harness/`
- Episode receipt writer: `scripts/lhf/episode.mjs`
- Executable FST runner: `scripts/lhf/fst-run.mjs`
- Ticket contract gate: `scripts/lhf/ticket-contract.mjs`
- Impact/session gates: `scripts/lhf/impact.mjs`, `session-start.mjs`, `session-close.mjs`
- Security/config gates: secrets, doc size, GitHub Actions, script registry, Wrangler, Supabase RLS, Supabase tests
- Cloudflare Worker starter: `workers/api/`
- Supabase migration starter: `supabase/migrations/`
- Complete reference flow: `GET /demo/items` + `public.lhf_demo_items`
- FST-lite proof tasks: `full-system-tester/`
- GitHub Actions and PR template: `.github/`

## Use As A Template

Create a new GitHub repository from this folder, then follow
`docs/system/ADAPTATION-GUIDE.md`. Keep the harness gates intact while replacing
the app identity, routes, schema, and business logic.

## Core Rule

Every meaningful change must map to one LHF spine, one spec owner, one proof
path, and one cleanup policy. If work does not simplify, consolidate, prove, or
enforce something, cut it.

## Hardening Commands

```bash
pnpm lhf:check-ai-surfaces
pnpm lhf:check-branch-protection --repo owner/name
pnpm lhf:check-github-actions
pnpm lhf:check-secrets
pnpm lhf:check-supabase-rls
pnpm lhf:check-supabase-tests
pnpm lhf:check-wrangler
pnpm lhf:fst --task 000-lhf-kernel-health
pnpm lhf:upgrade --check
pnpm lhf:session-close --changed --check
```

## Not Included

This is a framework kernel. It intentionally does not include app-specific
branding, business logic, private data, secrets, or production credentials.
