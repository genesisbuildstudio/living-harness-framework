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

## Reporting Issues

For public projects, replace this section with your security contact and
disclosure policy before launch.

