# Sub-Agent Quick Reference

One-page cheat sheet for sub-agent infrastructure.

## Templates

| Template                                            | Profile          | Model  | Use For                        |
| --------------------------------------------------- | ---------------- | ------ | ------------------------------ |
| [researcher](templates/researcher.md)               | research         | sonnet | Find patterns, check conflicts |
| [writer](templates/writer.md)                       | writer           | sonnet | Implement with TDD             |
| [validator](templates/validator.md)                 | read-only + Bash | haiku  | Run quality checks             |
| [parallel-executor](templates/parallel-executor.md) | full-access      | sonnet | Coordinate parallel tasks      |

## Permission Profiles

| Profile                                | Tools                                    |
| -------------------------------------- | ---------------------------------------- |
| [read-only](profiles/read-only.md)     | Read, Grep, Glob, mcp**cclsp**\*         |
| [research](profiles/research.md)       | + WebFetch, WebSearch, mcp**context7**\* |
| [writer](profiles/writer.md)           | + Write, Edit, Bash                      |
| [full-access](profiles/full-access.md) | All tools + Task                         |

## Handoff Format

### Request (Orchestrator → Sub-Agent)

```json
{
  "task_id": "feature-001",
  "phase": "research | write | validate",
  "context": {
    "feature": "user-auth",
    "spec_path": "specs/auth/requirements.md",
    "relevant_files": ["src/lib/auth.ts"],
    "previous_findings": "context from previous phase"
  },
  "instructions": "What to do",
  "expected_output": "structured_findings | files_changed | validation_result"
}
```

### Response (Sub-Agent → Orchestrator)

```json
{
  "task_id": "feature-001",
  "phase": "research",
  "status": "complete | partial | blocked",
  "decision": "PROCEED | STOP | CLARIFY",
  "findings": { ... },
  "context_summary": "max 500 tokens for next phase",
  "issues": []
}
```

## Decision Values

| Decision  | Meaning        | Action                 |
| --------- | -------------- | ---------------------- |
| `PROCEED` | No blockers    | Continue to next phase |
| `STOP`    | Critical issue | Halt, report to user   |
| `CLARIFY` | Need info      | Prompt user for input  |

## Invocation Patterns

### Spawn Researcher

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Research patterns",
  prompt: JSON.stringify({
    task_id: "auth-001",
    phase: "research",
    context: { feature: "auth", relevant_files: ["src/"] },
    instructions: "Find existing auth code",
    expected_output: "structured_findings",
  }),
  allowed_tools: [
    "Read",
    "Grep",
    "Glob",
    "WebFetch",
    "mcp__cclsp__*",
    "mcp__context7__*",
  ],
  model: "sonnet",
});
```

### Spawn Writer

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Implement feature",
  prompt: JSON.stringify({
    task_id: "auth-001",
    phase: "write",
    context: {
      feature: "auth",
      previous_findings: researchResult.context_summary,
    },
    instructions: "Implement JWT auth with TDD",
    expected_output: "files_changed",
  }),
  allowed_tools: [
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Grep",
    "Glob",
    "mcp__cclsp__*",
  ],
  model: "sonnet",
});
```

### Spawn Validator

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Validate implementation",
  prompt: JSON.stringify({
    task_id: "auth-001",
    phase: "validate",
    context: {
      feature: "auth",
      files_changed: ["src/lib/auth.ts", "src/server/routers/auth.ts"],
      previous_findings: writeResult.context_summary,
    },
    instructions: "Run typecheck, lint, tests",
    expected_output: "validation_result",
  }),
  allowed_tools: ["Read", "Grep", "Glob", "Bash", "mcp__cclsp__*"],
  model: "haiku",
});
```

### Parallel Validators

```typescript
// Make multiple Task calls in single message
await Promise.all([
  Task({ description: "Typecheck", prompt: typecheckHandoff, model: "haiku" }),
  Task({ description: "Lint", prompt: lintHandoff, model: "haiku" }),
  Task({ description: "Test", prompt: testHandoff, model: "haiku" }),
  Task({ description: "Security", prompt: securityHandoff, model: "haiku" }),
]);
```

## Sequential Chain Pattern

```text
Orchestrator
    │
    ├── Task(researcher) → context_summary
    │
    ├── Task(writer, prev_summary) → files_changed
    │
    └── Task(validator, files) → PASS/FAIL
```

## Context Savings

| Approach   | Context Used               |
| ---------- | -------------------------- |
| Monolithic | 100% (risk of overflow)    |
| Sub-agents | ~50% (each phase isolated) |

Key: `context_summary` passes ~100 tokens instead of ~10000 raw tokens.

## Model Selection

| Task           | Model  | Reason          |
| -------------- | ------ | --------------- |
| Research       | Sonnet | Comprehension   |
| Implementation | Sonnet | Code generation |
| Validation     | Haiku  | Checklist work  |
| Orchestration  | Sonnet | Coordination    |

## Common Issues

| Issue             | Solution                            |
| ----------------- | ----------------------------------- |
| Sub-agent timeout | Simplify handoff, reduce scope      |
| STOP returned     | Check issues array, fix or ask user |
| CLARIFY returned  | Prompt user with questions          |
| Context overflow  | Split into more sub-agents          |

## Links

- [README](README.md) - Full documentation
- [Handoff Protocol](protocols/handoff.md) - Complete schemas
- [Orchestration Patterns](protocols/orchestration.md) - Flow patterns
- [Agent Rules](../rules/agents.md) - When to use sub-agents
