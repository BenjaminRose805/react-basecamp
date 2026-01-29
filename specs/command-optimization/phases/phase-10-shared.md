# Phase 10: Shared Refactoring

## Source Files

- `specs/command-optimization/synthesis.md` section 1.5 (Implementation Orchestrator Template)

## Deliverables

| File                                                      | Description                   |
| --------------------------------------------------------- | ----------------------------- |
| `.claude/agents/templates/implementation-orchestrator.md` | Shared orchestration template |
| `.claude/agents/code-agent.md`                            | Refactor to use template      |
| `.claude/agents/ui-agent.md`                              | Refactor to use template      |
| `.claude/agents/docs-agent.md`                            | Refactor to use template      |
| `.claude/agents/eval-agent.md`                            | Refactor to use template      |
| `.claude/sub-agents/templates/domain-researcher.md`       | Add mode=research             |
| `.claude/sub-agents/templates/domain-researcher.md`       | Add mode=reconcile            |
| `.claude/sub-agents/templates/domain-writer.md`           | Add mode=reconcile            |

## Design Command

```
/design orchestrator-consolidation
```

## After Design

```
/implement
/review
/ship
```
