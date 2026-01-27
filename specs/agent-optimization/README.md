# Agent Optimization Specs

> **Initiative:** Sub-Agent Optimization for Context Efficiency
> **Created:** 2026-01-26
> **Status:** In Progress

## Overview

This spec suite defines the architecture and implementation plan for optimizing agent executions using sub-agents. The goal is to enable main agents to work on longer specs without running out of context by:

1. **Isolating context** - Each sub-agent operates in its own context window
2. **Parallelizing work** - Independent tasks run simultaneously
3. **Compacting handoffs** - Only essential information passes between phases
4. **Consolidating agents** - 7 focused agents with no gaps or overlaps
5. **Simplifying UX** - 5 core commands with automatic routing

## Expected Benefits

| Metric                     | Current | Target   | Improvement     |
| -------------------------- | ------- | -------- | --------------- |
| Context usage per workflow | 100%    | 60-70%   | 30-40% savings  |
| Quality check duration     | ~60s    | ~20s     | 3x faster       |
| Max spec complexity        | Limited | Extended | 2x longer specs |
| User commands to learn     | 13+     | 5        | Simplified UX   |
| Agents                     | 11      | 7        | No overlap      |
| Workflows                  | 4       | 8        | Full coverage   |

## Spec Structure

Each spec follows the 3-file format:

```
specs/agent-optimization/{feature}/
├── requirements.md   # EARS user stories, acceptance criteria
├── design.md         # Architecture, components, data flow
└── tasks.md          # Phased implementation tasks
```

## Specs

| #   | Spec                        | Directory                   | Purpose                                 | Status         |
| --- | --------------------------- | --------------------------- | --------------------------------------- | -------------- |
| 1   | Sub-Agent Infrastructure    | `01-infrastructure/`        | Foundation: templates, handoff protocol | ✅ Complete    |
| 4   | Check Agent Parallelization | `04-check-agent/`           | Parallel quality checks                 | ✅ Complete    |
| 5   | Context Compaction          | `05-context-compaction/`    | Phase-boundary compaction               | ✅ Complete    |
| 8   | Architecture V2             | `08-architecture-v2/`       | Agent consolidation, UX, workflows      | ✅ Complete    |
| 2   | Code Agent Split            | `02-code-agent/`            | 3-agent pattern for code-agent          | 🔵 In Progress |
| 3   | UI Agent Split              | `03-ui-agent/`              | 3-agent pattern for ui-agent            | ⏸️ Blocked     |
| 6   | Plan Agent Optimization     | `06-plan-agent/`            | Parallel analysis phases                | 🔵 In Progress |
| 7   | Workflow Updates            | `07-workflow-updates/`      | Orchestration changes                   | ⏸️ Blocked     |
| 9   | **Task Tool Binding**       | `09-task-tool-binding/`     | Bind docs to Task tool execution        | 📋 Draft       |
| 10  | **Cleanup & Consolidation** | `10-cleanup-consolidation/` | Remove stale refs, update docs          | 🔵 In Progress |

**Notes:**

- Phase 09 is CRITICAL - it binds all documentation to actual Task tool execution. Without it, commands run directly instead of spawning sub-agents.
- Phase 10 cleans up 200+ stale references to deprecated commands, agents, and MCP servers found after the spec 01-08 implementation.

### Phase 8 Progress

| Phase                        | Tasks | Status      |
| ---------------------------- | ----- | ----------- |
| Phase 1: Agent Consolidation | 5/5   | ✅ Complete |
| Phase 2: Sub-Agent Updates   | 7/7   | ✅ Complete |
| Phase 3: New Workflows       | 4/4   | ✅ Complete |
| Phase 4: User Interface      | 4/4   | ✅ Complete |
| Phase 5: Documentation       | 3/3   | ✅ Complete |
| Phase 6: Validation          | 0/5   | 🔵 Next     |

## Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│  01-infrastructure (FOUNDATION)                  ✅ COMPLETE │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 04-check-agent│   │05-compaction  │   │               │
│  ✅ COMPLETE   │   │ ✅ COMPLETE   │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  08-architecture-v2                              ✅ COMPLETE │
│  - Agent consolidation (7 agents)                           │
│  - Model assignments (Opus/Sonnet/Haiku)                    │
│  - New workflows (fix, refactor, security, research)        │
│  - User interface (5 commands + preview)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ 02-code-agent │   │ 03-ui-agent   │   │ 06-plan-agent │
│  (sub-agents) │   │  (sub-agents) │   │  (sub-agents) │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  07-workflow-updates                                        │
│  (Implement all 8 workflows)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  09-task-tool-binding (CRITICAL)                 📋 DRAFT   │
│  - Add MANDATORY Task tool instructions to all commands     │
│  - Add execution sections to all workflows                  │
│  - Create 4 missing command files                           │
│  - Update CLAUDE.md with enforcement section                │
│  (Without this, commands run directly instead of spawning)  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  10-cleanup-consolidation                     🔵 IN PROGRESS │
│  - Remove 200+ stale command/agent/MCP references           │
│  - Commit 66 uncommitted changes                            │
│  - Rewrite docs/DEVELOPER_WORKFLOW.md                       │
│  - Remove .claude/contexts/ (entirely stale)                │
│  - Update rules, workflows, and other docs                  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Order

| Order | Spec                         | Status         | Complexity | Notes                              |
| ----- | ---------------------------- | -------------- | ---------- | ---------------------------------- |
| 1     | 01-infrastructure            | ✅ Complete    | Low        | Foundation done                    |
| 2     | 04-check-agent               | ✅ Complete    | Medium     | Parallelization done               |
| 3     | 05-context-compaction        | ✅ Complete    | Medium     | Compaction rules done              |
| 4     | 08-architecture-v2           | ✅ Complete    | High       | Agent consolidation done           |
| 5     | 02-code-agent                | 🔵 In Progress | Medium     | Sub-agent implementation           |
| 6     | 06-plan-agent                | 🔵 In Progress | Medium     | Parallel analysis sub-agents       |
| 7     | 03-ui-agent                  | ⏸️ Blocked     | Medium     | After 02                           |
| 8     | 07-workflow-updates          | ⏸️ Blocked     | Medium     | After all agents updated           |
| 9     | **09-task-tool-binding**     | 📋 Draft       | Medium     | CRITICAL - binds docs to execution |
| 10    | **10-cleanup-consolidation** | 🔵 In Progress | Medium     | Clean up stale refs, update docs   |

## Architecture Summary (from Phase 08)

### Agents (7 total)

| Agent       | Domain                | Model (Orchestrator) |
| ----------- | --------------------- | -------------------- |
| plan-agent  | Specifications        | Opus                 |
| code-agent  | Backend               | Opus                 |
| ui-agent    | Frontend              | Opus                 |
| docs-agent  | Documentation         | Opus                 |
| eval-agent  | LLM evaluations       | Opus                 |
| check-agent | Quality               | Opus                 |
| git-agent   | Version control + PRs | Opus                 |

**Removed:** debug-agent, pr-agent, help-agent, context-agent

### Workflows (8 total)

| Workflow     | Trigger             | Chain                            |
| ------------ | ------------------- | -------------------------------- |
| implement    | /build (full-stack) | code → ui                        |
| fix          | /fix                | investigate → (code\|ui) → check |
| refactor     | /refactor           | check → (code\|ui) → check       |
| ship         | /ship               | check → git                      |
| review       | /review             | git → check → git                |
| full-feature | /feature            | plan → implement → ship          |
| security     | /security           | check(sec) → (code\|ui) → check  |
| research     | /research           | researcher (read-only)           |

### User Commands (5 core)

| Command | Intent            |
| ------- | ----------------- |
| /plan   | Design something  |
| /build  | Create something  |
| /fix    | Correct something |
| /check  | Verify something  |
| /ship   | Ship current work |

## Success Metrics

- [x] Infrastructure implemented (Phase 01)
- [x] Check-agent parallelized (Phase 04)
- [x] Context compaction operational (Phase 05)
- [x] Agent consolidation complete (Phase 08 - T001-T005)
- [x] Sub-agent model assignments updated (Phase 08 - T006-T012)
- [x] All 8 workflows implemented (Phase 08 - T013-T016)
- [x] 5 core commands with routing documented (Phase 08 - T017-T020)
- [x] Preview system documented (Phase 08 - T018)
- [x] Documentation complete (Phase 08 - T021-T023)
- [ ] Validation testing complete (Phase 08 - T024-T028)
- [ ] Measurable 30%+ context savings
- [ ] No regression in output quality
