# Security

## Supported Use

This starter is a framework kernel. Before production use, each application must
complete its own threat model, secret setup, data-classification review, and
compliance review.

## Required Practices

- Store Cloudflare secrets with `wrangler secret put`, not in source.
- Store Supabase service role keys only in trusted server/worker environments.
- Enable Supabase RLS on user-facing tables.
- Keep `.env`, `.env.*`, and `.dev.vars` out of git.
- Review every auth, billing, privacy, AI-autonomy, deployment, and deletion
  change as a sensitive change.
- Use typed errors and user-safe failure messages for runtime paths.
- Keep CI required on protected branches. At minimum require `pnpm typecheck`
  and `pnpm lhf:session-close --changed --check`.
- Before publishing as a public template, enable Dependabot, branch protection
  or repository rulesets, a security contact, and code ownership for critical
  paths.

## Local Security Gates

```bash
pnpm lhf:check-secrets
pnpm lhf:check-github-actions
pnpm lhf:check-wrangler
pnpm lhf:check-supabase-rls
pnpm lhf:check-supabase-tests
```

## Reporting Issues

Report suspected vulnerabilities through GitHub private vulnerability reporting
for this repository when available. If GitHub private reporting is unavailable,
email `security@genesis.build` with:

- affected package or path,
- reproducible impact,
- affected version or commit,
- proof-of-concept steps that avoid harming other users.

Do not open public issues for active vulnerabilities.
