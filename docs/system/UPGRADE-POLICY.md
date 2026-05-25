# Upgrade Policy

LHF must be safe to adopt without trapping projects on one starter version.

## Compatibility Promise

- Patch releases may tighten checks only when the failure points to a real
  security, correctness, or drift risk.
- Minor releases may add new checks, docs, scripts, or examples.
- Breaking changes require a migration note and should provide a script or
  checklist.

## Upgrade Shape

`pnpm lhf:upgrade --check` currently:

1. Reads `.lhf/manifest.json`.
2. Verifies the framework manifest schema and version.
3. Verifies listed framework-owned files still exist.
4. Refuses to claim upgrade health when framework files are missing.

Future upgrade modes may apply additive framework updates, but must produce a
diff receipt and refuse to overwrite app-owned code without explicit approval.

## Current Manual Upgrade

Copy framework changes only after running:

```bash
pnpm lhf:impact --changed
pnpm lhf:session-close --changed --check
```
