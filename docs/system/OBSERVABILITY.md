# Observability Model

LHF requires every important path to leave evidence that humans and agents can
inspect later.

## Local Evidence

- `docs/specs/registry.json` maps source to contracts.
- `docs/system/generated/harness-graph.json` maps repo structure and proof
  edges.
- `docs/operations/.ai-checkpoint.md` records session handoff risk.
- FST-lite tasks record reproducible user-flow proof.

## Runtime Evidence

- Cloudflare Workers should enable `observability` in `wrangler.jsonc`.
- Cloudflare Workers can export OpenTelemetry-compatible traces and logs to an
  OTLP destination. Metrics export is not currently supported by Workers OTel
  export, so keep application counters in logs or your own metrics path.
- Use correlation IDs on request paths.
- Emit typed errors with user-safe messages and operator-safe details.
- If Sentry or OpenTelemetry is configured, record request spans, tool calls,
  model calls, cost counters, retries, and policy denials.
- Shared helpers in `packages/shared/src/observability.ts` provide correlation
  IDs, typed error envelopes, redaction, and runtime event serialization.
- Session receipts can be written with `pnpm lhf:episode`.
- FST tasks can be executed with `pnpm lhf:fst --task <id>`, which writes
  machine-readable receipts under `docs/operations/episodes/`.

## Done Means Observable

A feature is not done unless failure states are visible through at least one of:
CI output, FST receipt, runtime logs/traces, Sentry event, or admin/operator UI.

## Cost Discipline

Observability must not become a cost leak. Sample high-volume traces, aggregate
token/cost counters, and keep raw prompt retention opt-in.
