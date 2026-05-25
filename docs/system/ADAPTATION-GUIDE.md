# Adaptation Guide

Use this folder as a GitHub template, then adapt it to the new app without
breaking the harness.

## First Hour

1. Rename package and Worker names in `package.json` and `workers/*/wrangler.jsonc`.
2. Update `docs/system/SYSTEM-MANIFEST.md` and `docs/system/PLATFORM-MAP.md`.
3. Replace placeholder backlog items in `docs/operations/BACKLOG.md`.
4. Add the first real feature spec under `docs/specs/features/`.
5. Run `pnpm lhf:session-close --changed --check`.

## What To Keep

- The Six Spines.
- The spec registry and harness graph.
- The ticket contract.
- The Cloudflare/Supabase safety checks.
- The FST-lite proof folder.

## What To Replace

- App names, routes, domains, product copy, database schema, and business logic.
- Placeholder FST tasks once real user flows exist.
- Placeholder security contacts and release ownership.

## Migration Rule

Do not delete framework gates during adaptation. If a gate does not fit the new
project, document the replacement and prove it is at least as strict.
