# Cloudflare + Supabase Setup

This starter is safe to commit because it contains no real credentials.

## Cloudflare

1. Create a Cloudflare account and Workers project.
2. Rename `workers/api/wrangler.jsonc` from `lhf-api` to your project worker.
3. Store secrets with Wrangler:

```bash
pnpm --filter lhf-api-worker wrangler secret put SUPABASE_URL
pnpm --filter lhf-api-worker wrangler secret put SUPABASE_ANON_KEY
pnpm --filter lhf-api-worker wrangler secret put SENTRY_DSN
```

4. Run locally:

```bash
pnpm --filter lhf-api-worker dev
```

## Supabase

1. Install Supabase CLI.
2. Start local Supabase:

```bash
supabase start
```

3. Apply migrations:

```bash
supabase db reset
```

4. Generate TypeScript types after connecting a real project:

```bash
supabase gen types typescript --project-id <project-id> > packages/shared/src/supabase.types.ts
```

## Production Readiness

Before launch:

- Verify RLS on every user-facing table.
- Rotate initial secrets.
- Configure branch protection.
- Configure Sentry or equivalent error monitoring.
- Add app-specific FST tasks for core flows.
- Run `pnpm lhf:session-close --changed --check`.

