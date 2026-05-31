# Benchmarks

LHF benchmarks are intentionally local, reproducible, and receipt-backed. They
do not claim model intelligence. They measure whether a repo has the structure
that lets AI coding agents work safely.

## Local Harness Benchmark

```bash
pnpm lhf:benchmark
```

The benchmark writes an `lhf-benchmark-receipt/v1` receipt with five measured
areas:

| Area | Why It Matters |
| --- | --- |
| Spec registry | Features need durable owners. |
| Manifest files | Framework-owned files must survive project edits. |
| AI surfaces | Codex, Claude Code, Copilot, and Cursor need one shared contract. |
| Workflows | CI, health, CodeQL, Pages, release, and Scorecard proof must exist. |
| FST task | A starter needs at least one executable proof path. |

## Agent Conformance

```bash
pnpm lhf:agent-conformance
```

This scores the instruction surfaces for shared entrypoint coverage, proof
requirements, prompt-injection boundaries, source-of-truth routing, and duplicate
system pressure.

## Public Benchmark Direction

Future public benchmarks should compare the same coding tasks with and without
LHF and measure:

- changed files per task,
- missing specs,
- missing proof,
- duplicate systems introduced,
- stale docs,
- test failures,
- prompt-injection instruction violations.

Publish benchmark fixtures, task prompts, raw receipts, and scoring scripts so
the claim is reproducible.
