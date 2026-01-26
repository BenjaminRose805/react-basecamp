# Sub-Agent System

Infrastructure for delegating work to isolated sub-agents via Claude Code's Task tool.

## Overview

The sub-agent system enables context-efficient orchestration by spawning isolated sub-agents for each phase of work. Instead of accumulating context in a single agent, each sub-agent operates in a fresh context window with only the information it needs.

### Benefits

- **Context Isolation**: Each sub-agent starts fresh, avoiding context overflow
- **Efficient Handoffs**: Only compacted summaries pass between phases
- **Parallel Execution**: Independent tasks can run concurrently
- **Cost Optimization**: Use cheaper models (Haiku) for validation tasks

## Quick Start

### 1. Choose a Template

| Template                                            | Use When                                  |
| --------------------------------------------------- | ----------------------------------------- |
| [researcher](templates/researcher.md)               | Finding existing code, checking conflicts |
| [writer](templates/writer.md)                       | Implementing code with TDD                |
| [validator](templates/validator.md)                 | Running quality checks                    |
| [parallel-executor](templates/parallel-executor.md) | Running independent checks concurrently   |

### 2. Select a Permission Profile

| Profile                                | Tools                           | Use For               |
| -------------------------------------- | ------------------------------- | --------------------- |
| [read-only](profiles/read-only.md)     | Read, Grep, Glob                | Code review, analysis |
| [research](profiles/research.md)       | + WebFetch, WebSearch, context7 | Documentation lookup  |
| [writer](profiles/writer.md)           | + Write, Edit, Bash             | Implementation        |
| [full-access](profiles/full-access.md) | All tools + Task                | Orchestration         |

### 3. Use the Handoff Protocol

See [protocols/handoff.md](protocols/handoff.md) for the request/response format.

```json
{
  "task_id": "code-001",
  "phase": "research",
  "context": {
    "feature": "user-authentication",
    "relevant_files": ["src/lib/auth.ts"]
  },
  "instructions": "Find existing auth patterns",
  "expected_output": "structured_findings"
}
```

### 4. Invoke via Task Tool

```typescript
// Example: Spawn a researcher sub-agent
await Task({
  subagent_type: "general-purpose",
  description: "Research auth patterns",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: RESEARCH_PROFILE,
  model: "sonnet",
});
```

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator (lightweight, full-access)                    │
├─────────────────────────────────────────────────────────────┤
│  Spawns sub-agents via Task tool                            │
│  Receives compacted handoffs                                │
│  Aggregates results                                         │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ (isolated)  │ ───► │ (isolated)  │ ───► │ (isolated)  │
│ ~15% ctx    │      │ ~25% ctx    │      │ ~10% ctx    │
└─────────────┘      └─────────────┘      └─────────────┘
     returns              returns              returns
  context_summary      files_changed           PASS/FAIL
```

## Directory Structure

```
.claude/sub-agents/
├── README.md                    # This file
├── QUICK-REFERENCE.md           # One-page cheat sheet
├── templates/
│   ├── researcher.md            # Research sub-agent template
│   ├── writer.md                # Implementation sub-agent template
│   ├── validator.md             # QA sub-agent template
│   └── parallel-executor.md     # Parallel task runner template
├── profiles/
│   ├── read-only.md             # Read, Grep, Glob only
│   ├── research.md              # + WebFetch, WebSearch
│   ├── writer.md                # + Write, Edit, Bash
│   └── full-access.md           # All tools including Task
├── protocols/
│   ├── handoff.md               # Request/response format
│   └── orchestration.md         # Orchestration patterns
└── check/                       # Check-agent sub-agents
    ├── README.md                # Check sub-agent overview
    ├── build-checker.md         # Build verification
    ├── type-checker.md          # TypeScript type check
    ├── lint-checker.md          # ESLint check
    ├── test-runner.md           # Test execution + coverage
    └── security-scanner.md      # Security pattern check
```

## When to Use Sub-Agents

### Use Sub-Agents When

- Task has 3+ distinct phases (research, implement, validate)
- Context is approaching limits
- Tasks can run in parallel
- Different model costs are appropriate per phase

### Don't Use Sub-Agents When

- Task is simple and quick (single file edit)
- Context is low and won't overflow
- All work is tightly coupled and needs shared context

## Orchestration Patterns

See [protocols/orchestration.md](protocols/orchestration.md) for detailed patterns:

1. **Sequential Chain**: researcher → writer → validator
2. **Parallel Executor**: multiple validators concurrently
3. **Conditional Branch**: different paths based on analysis

## Related Documentation

- [Agent Rules](../rules/agents.md) - Delegation patterns
- [CLAUDE.md](../../CLAUDE.md) - Overall system architecture
- [Task Tool](https://docs.anthropic.com/claude-code) - Claude Code documentation
