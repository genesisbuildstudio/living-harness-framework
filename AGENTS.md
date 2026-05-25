# AGENTS.md — Living Harness Framework

You are working inside a Living Harness Framework monorepo.

Before changing code, read:

1. `docs/system/READ-FIRST.md`
2. `docs/system/MONOREPO-LAWS.md`
3. `docs/system/SYSTEM-MANIFEST.md`
4. `docs/system/PLATFORM-MAP.md`
5. `docs/specs/registry.json`
6. `docs/operations/BACKLOG.md`

## What LHF Is

LHF is an operating framework for AI-built software. It connects source files,
docs, specs, runtime assets, database tables, tests, admin surfaces, and proof
receipts into one maintainable system.

## Six Spines

Every task must declare one primary spine:

1. **Truth Graph** — repo/runtime graph, source refs, drift, ownership.
2. **Run Spine** — requests, jobs, actions, tasks, events, outcomes.
3. **Capability Gate** — tool permissions, policy, scopes, kill switches.
4. **Context/Cost Spine** — prompts, context, tokens, cache, budgets.
5. **Proof Spine** — specs, tests, FST, CI, receipts, evals.
6. **Admin Cortex** — operator visibility, status, drift, incidents.

Secondary spines may consume or prove a fact. They may not create another owner
for the same fact.

## Required Change Flow

1. Identify the owning spec with `pnpm lhf:impact --changed`.
2. Add or update a feature spec before implementing behavior.
3. Fill an LHF Ticket Contract for non-trivial work.
4. Keep `pnpm lhf:harness-graph --check` green.
5. Run relevant tests and `pnpm lhf:session-close --changed --check`.
6. Never claim completion without proof.

## Hard Rules

- Use `pnpm`, not npm or yarn.
- Do not commit secrets.
- Do not add duplicate registries, dashboards, or source-of-truth docs.
- Do not silently delete files, tables, routes, or workflows. Propose cleanup.
- Do not add runtime paths without typed errors and observable failure states.
- Do not increase token/cost surfaces without a measured quality reason.
- Do not bypass Cloudflare/Supabase security patterns.

## Checkpoint Discipline

Write durable notes to `docs/operations/.ai-checkpoint.md` when work spans
multiple sessions. Keep notes factual and short.

