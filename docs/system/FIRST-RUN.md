# First Run

Use this flow after creating a new LHF repo from GitHub template or
`create-living-harness`.

```bash
pnpm install
pnpm lhf:onboard --name "My App" --slug "my-app" --platform codex --cloudflare --supabase --write
pnpm lhf:init --name "My App" --slug "my-app"
pnpm lhf:doctor
pnpm lhf:session-close --changed --check
```

Before recommending the template publicly, maintainers should also run:

```bash
pnpm lhf:download-smoke --json
```

Then give your AI coding platform this prompt:

```text
Read AGENTS.md and docs/system/READ-FIRST.md. Use the Living Harness Framework
rules while helping me build this app.
```

## What Good Looks Like

- `pnpm lhf:doctor` reports zero failures.
- `pnpm lhf:download-smoke --json` proves a clean downloaded copy can run the
  starter health checks.
- `.lhf/onboarding.json` records the chosen project name, slug, stack, and AI
  platform.
- The first pull request keeps CI, CodeQL, `lhf-health`, and the harness graph
  green.
- Every non-trivial task maps to one spec, one primary spine, and one proof
  path.

## If Something Fails

- Missing framework files: run `pnpm lhf:upgrade --check` and restore from the
  template source with `pnpm lhf:upgrade --source <template-root> --apply`.
- Unknown impact paths: add the path to the owning contract in
  `docs/specs/registry.json`.
- Agent drift: run `pnpm lhf:agent-conformance` and tighten the shared agent
  surface instead of adding platform-specific forks.
