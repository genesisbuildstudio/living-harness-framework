# Cloudflare + Supabase Setup

This starter is safe to commit because it contains no real credentials.

## Cloudflare

1. Create a Cloudflare account and Workers project.
2. Run `pnpm lhf:init --name "<Project Name>" --slug "<project-slug>"`.
3. Store secrets with Wrangler:

```bash
pnpm --filter lhf-api-worker wrangler secret put SUPABASE_URL
pnpm --filter lhf-api-worker wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm --filter lhf-api-worker wrangler secret put SENTRY_DSN
pnpm --filter lhf-api-worker wrangler secret put OTEL_EXPORTER_OTLP_ENDPOINT
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
- Configure OpenTelemetry export if you need centralized traces.
- Add app-specific FST tasks for core flows.
- Run `pnpm lhf:session-close --changed --check`.
