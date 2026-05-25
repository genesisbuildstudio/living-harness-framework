# Research Baseline

Current as of 2026-05-25.

## Findings Applied

- `AGENTS.md` is a shared open format used across coding agents; LHF keeps it as
  the small common entrypoint and pushes detail into scoped docs.
- Claude Code supports project `CLAUDE.md` files and hooks; LHF uses
  `CLAUDE.md` as an adapter, not a second rule source.
- GitHub Copilot supports `.github/copilot-instructions.md`,
  `.github/instructions/*.instructions.md`, and `AGENTS.md`; LHF ships all three
  as pointers back to one contract.
- Cursor project rules live in `.cursor/rules`; LHF ships a small always-on MDC
  rule that points back to `AGENTS.md`.
- Harness research is converging on observable, reversible, versioned episode
  evidence. LHF implements this through graph, registry, FST, ticket, and
  session-close gates.
- Agent security research keeps prompt injection, tool poisoning, excessive
  agency, audit logging, and real integration proof as first-class risks. LHF
  turns those into hard rules and scripts.
- Monorepo tooling leaders emphasize affected graphs and selective CI. LHF keeps
  the starter lightweight but preserves the same idea through `lhf:impact` and
  the harness graph.

## Primary References

- https://agents.md/
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
- https://docs.cursor.com/context/rules
- https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- https://www.anthropic.com/engineering/harness-design-long-running-apps
- https://arxiv.org/abs/2604.25850
- https://arxiv.org/abs/2605.13357
- https://arxiv.org/abs/2603.21642
- https://owasp.org/www-project-top-10-for-large-language-model-applications/
- https://opentelemetry.io/docs/specs/semconv/gen-ai/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://github.com/ossf/scorecard
