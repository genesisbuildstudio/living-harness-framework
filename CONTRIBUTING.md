# Contributing

All contributions must follow Living Harness Framework.

## Before Coding

```bash
pnpm lhf:session-start --scope "<work>"
pnpm lhf:impact --changed
```

## Before Opening A PR

```bash
pnpm typecheck
pnpm lhf:session-close --changed --check
```

## PR Expectations

- Declare the primary LHF spine.
- Name the owning spec.
- Explain what the change consolidates or replaces.
- Include proof commands.
- Do not introduce duplicate sources of truth.
