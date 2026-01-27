# Sub-Agent System

Infrastructure for delegating work to isolated sub-agents via Claude Code's Task tool.

---

## CRITICAL: How Commands Must Use This System

> **When executing a command (`/plan`, `/implement`, etc.), you MUST:**
>
> 1. **Read the agent file** in `.claude/agents/` (e.g., `plan-agent.md`, `code-agent.md`)
> 2. **Follow the CRITICAL EXECUTION REQUIREMENT** in that file
> 3. **Use the Task tool** to spawn sub-agents - NEVER execute directly
> 4. **Reference this documentation** for handoff protocols and templates
>
> **If you execute Read, Write, Edit, Bash, or MCP tools directly instead of
> spawning sub-agents via Task, you are executing INCORRECTLY.**
>
> Quick reference: [QUICK-REFERENCE.md](QUICK-REFERENCE.md)

---

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
├── plan/                        # Plan-agent sub-agents
│   ├── README.md                # Plan sub-agent overview
│   ├── plan-researcher.md       # Requirements analysis
│   ├── plan-writer.md           # Spec document writing
│   └── plan-validator.md        # Spec completeness check
├── code/                        # Code-agent sub-agents
│   ├── README.md                # Code sub-agent overview
│   ├── code-researcher.md       # Pattern finding
│   ├── code-writer.md           # TDD implementation
│   └── code-validator.md        # Quality checks
├── ui/                          # UI-agent sub-agents
│   ├── README.md                # UI sub-agent overview
│   ├── ui-researcher.md         # Component research
│   ├── ui-builder.md            # Component building
│   └── ui-validator.md          # A11y and test checks
├── docs/                        # Docs-agent sub-agents
│   ├── README.md                # Docs sub-agent overview
│   ├── docs-researcher.md       # Documentation gaps
│   ├── docs-writer.md           # Documentation writing
│   └── docs-validator.md        # Accuracy verification
├── eval/                        # Eval-agent sub-agents
│   ├── README.md                # Eval sub-agent overview
│   ├── eval-researcher.md       # LLM touchpoint analysis
│   ├── eval-writer.md           # Cases and graders
│   └── eval-validator.md        # Dry runs and coverage
├── check/                       # Check-agent sub-agents
│   ├── README.md                # Check sub-agent overview
│   ├── build-checker.md         # Build verification
│   ├── type-checker.md          # TypeScript type check
│   ├── lint-checker.md          # ESLint check
│   ├── test-runner.md           # Test execution + coverage
│   └── security-scanner.md      # Security pattern check
├── git/                         # Git-agent sub-agents
│   ├── README.md                # Git sub-agent overview
│   ├── change-analyzer.md       # Commit message suggestion
│   ├── pr-analyzer.md           # PR description generation
│   ├── pr-reviewer.md           # Code review
│   └── git-executor.md          # CLI command execution
└── workflows/                   # Workflow-specific sub-agents
    ├── README.md                # Workflow sub-agent overview
    ├── investigator.md          # Bug diagnosis (fix workflow)
    ├── refactor-analyzer.md     # Safe refactoring (refactor workflow)
    └── security-triager.md      # Vulnerability triage (security workflow)
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
