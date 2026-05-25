# GitHub Copilot Instructions

Follow `AGENTS.md` as the shared agent contract for this repository.

Before making non-trivial changes, read:

1. `docs/system/READ-FIRST.md`
2. `docs/system/MONOREPO-LAWS.md`
3. `docs/specs/registry.json`
4. `docs/operations/BACKLOG.md`

Required closeout:

```bash
pnpm lhf:impact --changed
pnpm lhf:session-close --changed --check
```

Do not create separate source-of-truth docs, duplicate registries, or unmanaged
runtime paths. Keep every change mapped to a spec, proof path, and cleanup rule.
