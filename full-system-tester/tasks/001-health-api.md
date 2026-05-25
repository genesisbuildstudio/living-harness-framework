# FST 001 — Health API

## Owning Spec

`docs/specs/features/health-api.md`

## Goal

Prove the starter Cloudflare Worker exposes a health endpoint.

## Steps

1. Run `pnpm --filter lhf-api-worker typecheck`.
2. Run `pnpm --filter lhf-api-worker dev`.
3. Request `GET /healthz`.
4. Confirm response has `ok: true`, `service: "lhf-api"`, and `correlationId`.

```bash
pnpm --filter lhf-api-worker typecheck
```

## Pass Criteria

- Typecheck passes.
- `/healthz` returns HTTP 200.
- Result is recorded in the session or PR receipt.
