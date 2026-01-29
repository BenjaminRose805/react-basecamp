# Phase 1: Foundation

## Source Files

Read these sections from `specs/command-optimization/synthesis.md`:

- Section 2.3: Checkpoint Manager Interface
- Section 3.1: Unified Checkpoint Schema
- Section 1.4: Sub-Agent Handoff Schema

## Deliverables

| File                                         | Description                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| `.claude/scripts/lib/checkpoint-manager.cjs` | Unified checkpoint management per section 2.3 interface |
| `.claude/scripts/lib/token-counter.cjs`      | Validate context_summary ≤500 tokens                    |
| `.claude/protocols/checkpoint-schema.md`     | Document unified schema per section 3.1                 |
| `.claude/protocols/handoff-schema.md`        | Document SubAgentHandoff interface per section 1.4      |

## Design Command

```
/design checkpoint-infrastructure
```

## After Design

```
/implement
/review
/ship
```
