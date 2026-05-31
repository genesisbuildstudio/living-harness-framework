# Cloudflare + Supabase CRUD Example

This example maps the starter's demo-items flow into a common production shape.

## Files To Adapt

- `workers/api/src/index.ts` owns HTTP routing and typed failures.
- `supabase/migrations/` owns schema and RLS.
- `supabase/tests/database/` owns database proof.
- `docs/specs/features/demo-items.md` owns acceptance criteria.
- `full-system-tester/tasks/002-demo-items.md` owns end-to-end proof.

## First Production PR

1. Rename `demo_items` to the app-specific table.
2. Update the feature spec before changing runtime behavior.
3. Add RLS policies and pgTAP-style database tests.
4. Run `pnpm lhf:impact --changed`.
5. Run `pnpm lhf:session-close --changed --check`.

Do not create a second API registry or second schema source of truth.
