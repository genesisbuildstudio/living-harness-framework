# AI Assistant Example

Use this shape when adding an AI worker or agent runtime to an LHF app.

## Required Boundaries

- `workers/brain` owns AI runtime entrypoints.
- `docs/specs/_LHF-CORE.md` owns framework contracts until the app adds a
  dedicated AI feature spec.
- `AGENTS.md` owns shared AI coding instructions.
- `docs/system/SECURITY-MODEL.md` owns tool, secret, and autonomy boundaries.

## First Production PR

1. Add an AI feature spec with model, tool, cost, and failure-state acceptance.
2. Add a capability gate before any tool can mutate external state.
3. Add typed errors and user-safe failure messages.
4. Add FST proof for at least one successful path and one denied path.
5. Run `pnpm lhf:agent-conformance` to confirm the agent instructions still
   route through the shared contract.

Do not let provider-specific prompts become the source of truth.
