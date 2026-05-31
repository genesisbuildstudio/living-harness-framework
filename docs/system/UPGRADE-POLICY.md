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

`pnpm lhf:upgrade --source <template-root> --apply` currently:

1. Compares manifest-owned framework files against a source template.
2. Restores missing framework files.
3. Updates changed framework files.
4. Backs up changed or restored target files.
5. Writes an `lhf-upgrade-receipt/v1` receipt under `docs/operations/episodes`.

It only touches files listed in `.lhf/manifest.json`.

`pnpm lhf:upgrade --source <template-root> --diff` previews the exact
framework-owned file changes without mutating the project.

`pnpm lhf:upgrade --rollback <receipt>` restores files from an upgrade receipt
backup and deletes files that the upgrade restored into existence.

## Current Manual Upgrade

Copy framework changes only after running:

```bash
pnpm lhf:impact --changed
pnpm lhf:session-close --changed --check
```
