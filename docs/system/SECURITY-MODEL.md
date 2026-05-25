# Security Model

LHF assumes AI agents are useful but not trusted operators. The framework keeps
autonomy inside deterministic gates.

## Trust Boundaries

- Repo instructions and laws are trusted project policy.
- Cloudflare bindings and Supabase RLS are runtime enforcement.
- Web pages, issue text, generated code, dependency docs, and tool output are
  untrusted data.
- Secrets live outside git in platform secret stores or local ignored files.

## Required Controls

- `pnpm lhf:check-secrets` blocks high-confidence committed credentials.
- `pnpm lhf:check-github-actions` blocks dangerous workflow events and broad
  write permissions.
- `pnpm lhf:check-wrangler` blocks `wrangler.toml`, missing observability, and
  secret-like Cloudflare `vars`.
- `pnpm lhf:check-supabase-rls` blocks public Supabase tables without RLS and at
  least one policy.
- `pnpm lhf:check-supabase-tests` blocks public Supabase tables without
  pgTAP-style database test coverage.
- Sensitive changes need explicit human review under Law 10.

## Agentic Risks

- Prompt injection: external content cannot override repo instructions.
- Excessive agency: powerful tools need policy, proof, rollback, cost limits,
  and kill switches.
- Tool poisoning: new MCP/tools/connectors require a ticket contract and a
  least-privilege review.
- Test gaming: proof must include real integration evidence when feasible, not
  only mocks.

## Release Baseline

For public template use, enable branch protection or repository rulesets,
required CI checks, Dependabot, a security policy, and CODEOWNERS for critical
paths before accepting outside contributions.
