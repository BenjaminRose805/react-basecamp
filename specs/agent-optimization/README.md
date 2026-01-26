# Agent Optimization Specs

> **Initiative:** Sub-Agent Optimization for Context Efficiency
> **Created:** 2026-01-26
> **Status:** Draft

## Overview

This spec suite defines the architecture and implementation plan for optimizing agent executions using sub-agents. The goal is to enable main agents to work on longer specs without running out of context by:

1. **Isolating context** - Each sub-agent operates in its own context window
2. **Parallelizing work** - Independent tasks run simultaneously
3. **Compacting handoffs** - Only essential information passes between phases

## Expected Benefits

| Metric                     | Current | Target   | Improvement     |
| -------------------------- | ------- | -------- | --------------- |
| Context usage per workflow | 100%    | 60-70%   | 30-40% savings  |
| Quality check duration     | ~60s    | ~20s     | 3x faster       |
| Max spec complexity        | Limited | Extended | 2x longer specs |

## Spec Structure

Each spec follows the 3-file format:

```
specs/agent-optimization/{feature}/
├── requirements.md   # EARS user stories, acceptance criteria
├── design.md         # Architecture, components, data flow
└── tasks.md          # Phased implementation tasks
```

## Specs

| #   | Spec                        | Directory                | Purpose                                 |
| --- | --------------------------- | ------------------------ | --------------------------------------- |
| 1   | Sub-Agent Infrastructure    | `01-infrastructure/`     | Foundation: templates, handoff protocol |
| 2   | Code Agent Split            | `02-code-agent/`         | 3-agent pattern for code-agent          |
| 3   | UI Agent Split              | `03-ui-agent/`           | 3-agent pattern for ui-agent            |
| 4   | Check Agent Parallelization | `04-check-agent/`        | Parallel quality checks                 |
| 5   | Context Compaction          | `05-context-compaction/` | Phase-boundary compaction               |
| 6   | Plan Agent Optimization     | `06-plan-agent/`         | Parallel analysis phases                |
| 7   | Workflow Updates            | `07-workflow-updates/`   | Orchestration changes                   |

## Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│  01-infrastructure (FOUNDATION)                             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 02-code-agent │   │ 03-ui-agent   │   │ 04-check-agent│
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  05-context-compaction                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  06-plan-agent                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  07-workflow-updates                                        │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Order

| Phase | Spec                  | Complexity | Context Savings | Performance     |
| ----- | --------------------- | ---------- | --------------- | --------------- |
| 1     | 01-infrastructure     | Low        | Foundation      | Foundation      |
| 2     | 04-check-agent        | Medium     | 15-20%          | **3-4x faster** |
| 3     | 05-context-compaction | Medium     | **30-40%**      | High            |
| 4     | 02-code-agent         | High       | 25-30%          | Medium          |
| 5     | 03-ui-agent           | High       | 20-25%          | Medium          |
| 6     | 06-plan-agent         | Medium     | 20-25%          | 2x faster       |
| 7     | 07-workflow-updates   | Medium     | 10-15%          | 2-3x faster     |

## Success Metrics

- [ ] All specs approved
- [ ] Infrastructure implemented and tested
- [ ] At least one agent (check-agent) fully parallelized
- [ ] Context compaction hooks operational
- [ ] Measurable reduction in context usage
- [ ] No regression in output quality
