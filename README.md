# Living Harness Framework

AI-native monorepo starter for Cloudflare + Supabase apps.

Living Harness Framework (LHF) gives AI coding agents a governed repo structure:
laws, specs, graph truth, ticket contracts, proof gates, and cleanup rules. The
goal is not to slow development down. The goal is to keep AI-built software
coherent as it grows.

## Quick Start

```bash
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

- AI agent instructions: `AGENTS.md`, `CLAUDE.md`
- LHF laws and source-of-truth docs: `docs/system/`
- Feature specs and generated registry: `docs/specs/`
- Harness graph generator: `scripts/lhf/harness-graph.mjs`
- Ticket contract gate: `scripts/lhf/ticket-contract.mjs`
- Impact/session gates: `scripts/lhf/impact.mjs`, `session-start.mjs`, `session-close.mjs`
- Cloudflare Worker starter: `workers/api/`
- Supabase migration starter: `supabase/migrations/`
- FST-lite proof tasks: `full-system-tester/`
- GitHub Actions and PR template: `.github/`

## Core Rule

Every meaningful change must map to one LHF spine, one spec owner, one proof
path, and one cleanup policy. If work does not simplify, consolidate, prove, or
enforce something, cut it.

## Not Included

This is a framework kernel. It intentionally does not include app-specific
branding, business logic, private data, secrets, or production credentials.

