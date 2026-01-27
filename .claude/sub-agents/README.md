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

**Key Achievement:** Reduced from 37 domain-specific sub-agents to **11 consolidated templates** (63% reduction) through parameterized modes and dynamic sizing.

### Benefits

- **Context Isolation**: Each sub-agent starts fresh, avoiding context overflow
- **Efficient Handoffs**: Only compacted summaries pass between phases
- **Parallel Execution**: Independent tasks can run concurrently
- **Cost Optimization**: Use cheaper models (Haiku) for validation tasks
- **Dynamic Sizing**: 1-7 sub-agents per task based on complexity heuristics

## Quick Start

### 1. Choose a Template

**Consolidated Templates (7)** - Support multiple domains via mode parameter:

| Template                                                    | Use When                            | Modes                                      |
| ----------------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| [domain-researcher](templates/domain-researcher.md)         | Finding code, patterns, conflicts   | plan, code, ui, docs, eval                 |
| [domain-writer](templates/domain-writer.md)                 | Implementing with TDD               | plan, code, ui, docs, eval                 |
| [quality-validator](templates/quality-validator.md)         | Post-implementation QA              | plan, code, ui, docs, eval                 |
| [quality-checker](templates/quality-checker.md)             | Individual quality checks           | build, types, lint, tests                  |
| [spec-analyzer](templates/spec-analyzer.md)                 | Analyzing specs and requirements    | requirements, dependencies, task-decompose |
| [git-content-generator](templates/git-content-generator.md) | Generating git messages/PR content  | commit, pr                                 |
| [code-analyzer](templates/code-analyzer.md)                 | Analyzing code for bugs/refactoring | investigate, refactor, security-triage     |

**Unique Templates (4)** - Specialized, cannot be consolidated:

| Template                                            | Use When                            |
| --------------------------------------------------- | ----------------------------------- |
| [parallel-executor](templates/parallel-executor.md) | Running independent checks in batch |
| [git-executor](git/git-executor.md)                 | Executing git/gh commands safely    |
| [pr-reviewer](git/pr-reviewer.md)                   | Code review and feedback            |
| [security-scanner](check/security-scanner.md)       | OWASP security pattern scanning     |

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

**7 Consolidated + 4 Unique = 11 Total Templates**

```text
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator (lightweight, full-access)                    │
├─────────────────────────────────────────────────────────────┤
│  Analyzes task complexity                                   │
│  Selects templates + modes                                  │
│  Spawns 1-7 sub-agents dynamically                          │
│  Aggregates results                                         │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ mode=code   │ ───► │ mode=code   │ ───► │ mode=code   │
│ (isolated)  │      │ (isolated)  │      │ (isolated)  │
│ ~15% ctx    │      │ ~25% ctx    │      │ ~10% ctx    │
└─────────────┘      └─────────────┘      └─────────────┘
     returns              returns              returns
  context_summary      files_changed           PASS/FAIL
```

**Dynamic Sizing Examples:**

| Task Complexity | Sub-Agents Spawned | Pattern                          |
| --------------- | ------------------ | -------------------------------- |
| Simple edit     | 1                  | writer only                      |
| Standard CRUD   | 3                  | researcher → writer → validator  |
| Complex feature | 5                  | spec-analyzer → research → write |
| Full workflow   | 7                  | All phases + parallel checks     |

See [lib/sizing-heuristics.md](lib/sizing-heuristics.md) for decision tree.

## Directory Structure

```
.claude/sub-agents/
├── README.md                      # This file
├── QUICK-REFERENCE.md             # One-page cheat sheet
├── templates/                     # 11 consolidated templates
│   ├── domain-researcher.md       # Research (modes: plan|code|ui|docs|eval)
│   ├── domain-writer.md           # Implementation (modes: plan|code|ui|docs|eval)
│   ├── quality-validator.md       # Post-implementation QA
│   ├── quality-checker.md         # Individual checks (modes: build|types|lint|tests)
│   ├── spec-analyzer.md           # Spec analysis (modes: requirements|dependencies|decompose)
│   ├── git-content-generator.md   # Git content (modes: commit|pr)
│   ├── code-analyzer.md           # Code analysis (modes: investigate|refactor|security)
│   ├── parallel-executor.md       # Parallel task runner (unique)
├── profiles/
│   ├── read-only.md               # Read, Grep, Glob only
│   ├── research.md                # + WebFetch, WebSearch
│   ├── writer.md                  # + Write, Edit, Bash
│   └── full-access.md             # All tools including Task
├── protocols/
│   ├── handoff.md                 # Request/response format
│   └── orchestration.md           # Orchestration patterns
├── lib/
│   └── sizing-heuristics.md       # Dynamic sizing decision tree
├── git/                           # Unique git sub-agents
│   ├── README.md
│   ├── git-executor.md            # CLI execution (unique)
│   └── pr-reviewer.md             # Code review (unique)
├── check/                         # Unique quality sub-agents
│   ├── README.md
│   └── security-scanner.md        # OWASP scanning (unique)
├── plan/                          # Plan-agent orchestration
│   └── README.md                  # References consolidated templates
├── code/                          # Code-agent orchestration
│   └── README.md                  # References consolidated templates
├── ui/                            # UI-agent orchestration
│   └── README.md                  # References consolidated templates
├── docs/                          # Docs-agent orchestration
│   └── README.md                  # References consolidated templates
└── eval/                          # Eval-agent orchestration
    └── README.md                  # References consolidated templates
```

**Note:** Domain subdirectories (plan/, code/, ui/, docs/, eval/) now contain only README.md files that reference the consolidated templates with appropriate mode parameters.

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

## Dynamic Sizing

The orchestrator analyzes task complexity and spawns 1-7 sub-agents accordingly:

**Sizing Heuristics:**

| Factor                | Weight | Impact                         |
| --------------------- | ------ | ------------------------------ |
| Files affected        | High   | 1-2 files → 1-3 agents         |
| Domain complexity     | Medium | Simple CRUD → 3, Complex → 5-7 |
| Has spec?             | Medium | No spec → +1 analyzer          |
| Parallelizable phases | High   | Independent checks → +N agents |
| Context budget        | High   | Low budget → fewer agents      |

**Token Savings:** 63% reduction from 37 domain-specific to 11 consolidated templates.

See [lib/sizing-heuristics.md](lib/sizing-heuristics.md) for complete decision tree.

## Orchestration Patterns

See [protocols/orchestration.md](protocols/orchestration.md) for detailed patterns:

1. **Sequential Chain**: researcher → writer → validator
2. **Parallel Executor**: multiple validators concurrently
3. **Conditional Branch**: different paths based on analysis

## Related Documentation

- [Agent Rules](../rules/agents.md) - Delegation patterns
- [CLAUDE.md](../../CLAUDE.md) - Overall system architecture
- [Task Tool](https://docs.anthropic.com/claude-code) - Claude Code documentation
