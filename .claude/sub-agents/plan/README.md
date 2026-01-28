# Plan Agent Sub-Agents

Sub-agents for the plan-agent orchestrator with parallel analysis support.

## Overview

```text
plan-agent (orchestrator, Opus)
│
├─────────────────────┬─────────────────────┬─────────────────────┐
│                     │                     │                     │
▼                     ▼                     ▼                     ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ domain-researcher│ │ domain-researcher│ │ domain-researcher│
│ mode=plan:reqs   │ │ mode=plan:deps   │ │ mode=plan:tasks  │
│ (Opus)           │ │ (Opus)           │ │ (Opus)           │
└──────────────────┘ └──────────────────┘ └──────────────────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Aggregate        │
                    │ Summaries        │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ domain-writer    │
                    │ mode=plan        │
                    │ (Sonnet)         │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ quality-validator│
                    │ (Haiku)          │
                    └──────────────────┘
```

## Sub-Agents

Uses consolidated templates from `.claude/sub-agents/templates/`:

### Parallel Analyzers (Phase 1)

| Template          | Mode       | Model | Purpose                                    |
| ----------------- | ---------- | ----- | ------------------------------------------ |
| domain-researcher | plan:reqs  | Opus  | Parse requirements, convert to EARS format |
| domain-researcher | plan:deps  | Opus  | Find related code, identify conflicts      |
| domain-researcher | plan:tasks | Opus  | Break requirements into phased tasks       |

### Sequential Writers (Phase 2)

| Template      | Mode | Model  | Purpose              |
| ------------- | ---- | ------ | -------------------- |
| domain-writer | plan | Sonnet | Write spec documents |

### Validators (Phase 3)

| Template          | Mode   | Model | Purpose             |
| ----------------- | ------ | ----- | ------------------- |
| quality-validator | (none) | Haiku | Verify completeness |

## Execution Flow

### Full Flow (/plan [feature])

```text
User: /plan user-authentication
    │
    ▼
Orchestrator: Spawn parallel analyzers
    │
    ├── Task(domain-researcher mode=plan:reqs, run_in_background: true)
    ├── Task(dependency-analyzer, run_in_background: true)
    └── Task(task-decomposer, run_in_background: true)
    │
    ▼
Wait for all (~5 min max)
    │
    ▼
Aggregate summaries:
{
  "requirements_summary": "...",    ≤500 tokens
  "dependencies_summary": "...",    ≤500 tokens
  "tasks_summary": "..."            ≤500 tokens
}
    │
    ▼
Task(domain-writer mode=plan, analysis_summary)
    │
    └── Creates: specs/user-auth/requirements.md
    └── Creates: specs/user-auth/design.md
    └── Creates: specs/user-auth/tasks.md
    │
    ▼
Task(quality-validator, spec_files, model: haiku)
    │
    └── Returns: { passed: true/false, checks: {...} }
    │
    ▼
User: "Spec created at specs/user-auth/. Ready for review."
```

### Research Only (/plan research [feature])

```text
Orchestrator: Spawn parallel analyzers
    ├── Task(domain-researcher mode=plan:reqs)
    ├── Task(domain-researcher mode=plan:deps)
    └── Task(domain-researcher mode=plan:tasks)
    │
    ▼
Report: Combined analysis summary
```

### Write Only (/plan write [feature])

```text
Orchestrator: (assumes analysis done)
    │
    ▼
Task(domain-writer mode=plan)
    │
    └── Creates spec files
    │
    ▼
Report: Files created
```

### Validate Only (/plan validate [feature])

```text
Orchestrator: (assumes spec exists)
    │
    ▼
Task(quality-validator)
    │
    ▼
Report: PASS/FAIL with issues
```

## Performance Comparison

| Mode      | Sequential | Parallel | Improvement  |
| --------- | ---------- | -------- | ------------ |
| Analysis  | ~12 min    | ~5 min   | ~2.4x faster |
| Full flow | ~23 min    | ~16 min  | ~30% faster  |

## Invocation Examples

### Spawn Parallel Analyzers

```typescript
// Launch all three in parallel
const [reqResult, depResult, taskResult] = await Promise.all([
  Task({
    subagent_type: "general-purpose",
    description: "Research requirements for [feature]",
    prompt: `You are domain-researcher (mode=plan:reqs). ${JSON.stringify({
      task_id: "plan-req-001",
      phase: "analyze-requirements",
      context: { feature, source_docs },
      instructions: "Parse and convert to EARS format",
      expected_output: "structured_requirements",
    })}`,
    allowed_tools: RESEARCH_PROFILE,
    model: "opus",
    run_in_background: true,
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Research dependencies for [feature]",
    prompt: `You are domain-researcher (mode=plan:deps). ${JSON.stringify({
      task_id: "plan-dep-001",
      phase: "analyze-dependencies",
      context: { feature, relevant_dirs },
      instructions: "Find related code and dependencies",
      expected_output: "dependency_analysis",
    })}`,
    allowed_tools: RESEARCH_PROFILE,
    model: "opus",
    run_in_background: true,
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Research task decomposition for [feature]",
    prompt: `You are domain-researcher (mode=plan:tasks). ${JSON.stringify({
      task_id: "plan-task-001",
      phase: "decompose-tasks",
      context: { feature },
      instructions: "Break into implementation tasks",
      expected_output: "task_decomposition",
    })}`,
    allowed_tools: RESEARCH_PROFILE,
    model: "opus",
    run_in_background: true,
  }),
]);
```

### Aggregate and Pass to Writer

```typescript
// Aggregate summaries only (not full findings)
const analysisSummary = {
  requirements_summary: reqResult.context_summary, // ≤500 tokens
  dependencies_summary: depResult.context_summary, // ≤500 tokens
  tasks_summary: taskResult.context_summary, // ≤500 tokens
};

// Pass to writer
const writeResult = await Task({
  subagent_type: "general-purpose",
  description: "Write spec documents for [feature]",
  prompt: `You are domain-writer (mode=plan). ${JSON.stringify({
    task_id: "plan-write-001",
    phase: "write",
    context: {
      feature,
      spec_path: `specs/${feature}/`,
      analysis_summary: analysisSummary,
    },
    instructions: "Create spec documents",
    expected_output: "files_created",
  })}`,
  allowed_tools: WRITER_PROFILE,
  model: "sonnet",
});
```

## Legacy Compatibility

The old analyzer names have been replaced with consolidated templates:

| Legacy               | New Equivalent                      |
| -------------------- | ----------------------------------- |
| requirement-analyzer | domain-researcher (mode=plan:reqs)  |
| dependency-analyzer  | domain-researcher (mode=plan:deps)  |
| task-decomposer      | domain-researcher (mode=plan:tasks) |
| plan-researcher      | domain-researcher (mode=plan)       |
| plan-writer          | domain-writer (mode=plan)           |
| plan-validator       | quality-validator                   |

## Related Documentation

- [Plan Agent](../../agents/plan-agent.md) - Orchestrator documentation
- [Handoff Protocol](../protocols/handoff.md) - Request/response format
- [Orchestration Patterns](../protocols/orchestration.md) - Parallel execution patterns
