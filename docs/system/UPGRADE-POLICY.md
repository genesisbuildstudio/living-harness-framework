# Upgrade Policy

LHF must be safe to adopt without trapping projects on one starter version.

## Compatibility Promise

- Patch releases may tighten checks only when the failure points to a real
  security, correctness, or drift risk.
- Minor releases may add new checks, docs, scripts, or examples.
- Breaking changes require a migration note and should provide a script or
  checklist.

## Upgrade Shape

Future `pnpm lhf:upgrade` should:

1. Detect the installed LHF version.
2. Compare framework-owned files with the target version.
3. Apply safe additive updates.
4. Produce a diff receipt for human review.
5. Refuse to overwrite app-owned code without explicit approval.

## Current Manual Upgrade

Until the upgrade command exists, copy framework changes only after running:

```bash
pnpm lhf:impact --changed
pnpm lhf:session-close --changed --check
```
