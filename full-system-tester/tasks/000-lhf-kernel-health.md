# FST 000 — LHF Kernel Health

## Owning Spec

`docs/specs/_LHF-CORE.md`

## Goal

Prove the framework kernel is not just documentation. Its graph, registry,
agent surfaces, security checks, Cloudflare checks, Supabase checks, and ticket
contracts must all pass together.

## Steps

1. Run `pnpm lhf:impact --changed`.
2. Run `pnpm lhf:harness-graph --check`.
3. Run `pnpm lhf:session-close --changed --check`.
4. Record any failure and the exact command output in the PR/session receipt.

## Pass Criteria

- All LHF closeout checks pass.
- Any changed file maps to a contract.
- No missing AI instruction adapter, secret, Wrangler, RLS, script registry, doc
  size, harness graph, or ticket-contract issue remains.
