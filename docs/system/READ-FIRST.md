# READ FIRST

This repo uses Living Harness Framework.

## Start Here

| Need | File |
| --- | --- |
| Rules for AI sessions | `AGENTS.md` |
| Monorepo laws | `docs/system/MONOREPO-LAWS.md` |
| Current system inventory | `docs/system/SYSTEM-MANIFEST.md` |
| Routes/workers/surfaces | `docs/system/PLATFORM-MAP.md` |
| Feature contracts | `docs/specs/registry.json` |
| Work queue | `docs/operations/BACKLOG.md` |
| Harness graph | `docs/system/generated/harness-graph.json` |

## Standard Commands

```bash
pnpm lhf:session-start --scope "<work>"
pnpm lhf:impact --changed
pnpm lhf:harness-graph --check
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

