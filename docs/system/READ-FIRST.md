# READ FIRST

This repo uses Living Harness Framework.

## Start Here

| Need | File |
| --- | --- |
| Rules for AI sessions | `AGENTS.md` |
| Monorepo laws | `docs/system/MONOREPO-LAWS.md` |
| Current system inventory | `docs/system/SYSTEM-MANIFEST.md` |
| Routes/workers/surfaces | `docs/system/PLATFORM-MAP.md` |
| AI platform adapters | `docs/system/AI-CODING-PLATFORM-GUIDE.md` |
| Security model | `docs/system/SECURITY-MODEL.md` |
| Observability model | `docs/system/OBSERVABILITY.md` |
| Project adaptation | `docs/system/ADAPTATION-GUIDE.md` |
| Public release checklist | `docs/system/PUBLICATION-CHECKLIST.md` |
| Release playbook | `docs/system/RELEASE.md` |
| Upgrade policy | `docs/system/UPGRADE-POLICY.md` |
| Feature contracts | `docs/specs/registry.json` |
| Work queue | `docs/operations/BACKLOG.md` |
| Harness graph | `docs/system/generated/harness-graph.json` |

## Standard Commands

```bash
pnpm lhf:session-start --scope "<work>"
pnpm lhf:init --name "<Project Name>" --slug "<project-slug>"
pnpm lhf:episode --task "<id>" --status pass --proof "<proof>"
pnpm lhf:fst --task 000-lhf-kernel-health
pnpm lhf:upgrade --check
pnpm lhf:check-branch-protection --repo <owner>/<repo>
pnpm lhf:impact --changed
pnpm lhf:harness-graph --check
pnpm lhf:check-ai-surfaces
pnpm lhf:check-branch-protection --fixture <rules.json>
pnpm lhf:check-github-actions
pnpm lhf:check-secrets
pnpm lhf:check-supabase-rls
pnpm lhf:check-supabase-tests
pnpm lhf:check-wrangler
pnpm lhf:ticket-contract --check
pnpm lhf:session-close --changed --check
```

## Post-Change Checklist

- Changed files map to specs.
- Harness graph is current.
- Ticket contract exists for non-trivial work.
- Runtime paths have typed errors and observable failure states.
- Security/privacy/cost impact is documented.
- Tests or FST-lite proof exist.
- Cleanup/dead-code implications are handled.
- AI platform adapters still point to the same source of truth.
