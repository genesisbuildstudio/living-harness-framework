# FST 002 — Demo Items Reference Flow

## Owning Spec

`docs/specs/features/demo-items.md`

## Goal

Prove the starter contains a real app pattern, not only a health route: web
view model, Worker API, Supabase table, typed errors, and runtime evidence.

## Steps

1. Run `pnpm --filter lhf-api-worker typecheck`.
2. Run `pnpm lhf:check-supabase-rls`.
3. Run `pnpm --filter lhf-api-worker dev`.
4. Request `GET /demo/items`.
5. Confirm the response contains `ok: true`, `correlationId`, `dataMode`, and a
   non-empty `items` array.

## Pass Criteria

- Typecheck passes.
- RLS check passes.
- `/demo/items` returns HTTP 200 in sample mode without secrets, or Supabase
  mode with configured secrets.
- Failure mode returns a typed error envelope and logs a redacted runtime event.
