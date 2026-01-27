# Plan Agent Sub-Agents

Sub-agents for the plan-agent orchestrator with parallel analysis support.

## Overview

```text
plan-agent (orchestrator, Opus)
│
├─────────────────┬─────────────────┐
│                 │                 │
▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ requirement  │ │ dependency   │ │ task         │
│ analyzer     │ │ analyzer     │ │ decomposer   │
│ (Opus)       │ │ (Opus)       │ │ (Opus)       │
└──────────────┘ └──────────────┘ └──────────────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ Aggregate        │
                │ Summaries        │
                └──────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ plan-writer      │
                │ (Sonnet)         │
                └──────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ plan-validator   │
                │ (Haiku)          │
                └──────────────────┘
```

## Sub-Agents

### Parallel Analyzers (Phase 1)

| Sub-Agent                                       | Model | Purpose                                    |
| ----------------------------------------------- | ----- | ------------------------------------------ |
| [requirement-analyzer](requirement-analyzer.md) | Opus  | Parse requirements, convert to EARS format |
| [dependency-analyzer](dependency-analyzer.md)   | Opus  | Find related code, identify conflicts      |
| [task-decomposer](task-decomposer.md)           | Opus  | Break requirements into phased tasks       |

### Sequential Writers (Phase 2)

| Sub-Agent                     | Model  | Purpose              |
| ----------------------------- | ------ | -------------------- |
| [plan-writer](plan-writer.md) | Sonnet | Write spec documents |

### Validators (Phase 3)

| Sub-Agent                           | Model | Purpose             |
| ----------------------------------- | ----- | ------------------- |
| [plan-validator](plan-validator.md) | Haiku | Verify completeness |

## Execution Flow

### Full Flow (/plan [feature])

```text
User: /plan user-authentication
    │
    ▼
Orchestrator: Spawn parallel analyzers
    │
    ├── Task(requirement-analyzer, run_in_background: true)
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
Task(plan-writer, analysis_summary)
    │
    └── Creates: specs/user-auth/requirements.md
    └── Creates: specs/user-auth/design.md
    └── Creates: specs/user-auth/tasks.md
    │
    ▼
Task(plan-validator, spec_files, model: haiku)
    │
    └── Returns: { passed: true/false, checks: {...} }
    │
    ▼
User: "Spec created at specs/user-auth/. Ready for review."
```

### Research Only (/plan research [feature])

```text
Orchestrator: Spawn parallel analyzers
    ├── Task(requirement-analyzer)
    ├── Task(dependency-analyzer)
    └── Task(task-decomposer)
    │
    ▼
Report: Combined analysis summary
```

### Write Only (/plan write [feature])

```text
Orchestrator: (assumes analysis done)
    │
    ▼
Task(plan-writer)
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
Task(plan-validator)
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
    description: "Analyze requirements",
    prompt: JSON.stringify({
      task_id: "plan-req-001",
      phase: "analyze-requirements",
      context: { feature, source_docs },
      instructions: "Parse and convert to EARS format",
      expected_output: "structured_requirements",
    }),
    allowed_tools: RESEARCH_PROFILE,
    model: "opus",
    run_in_background: true,
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Analyze dependencies",
    prompt: JSON.stringify({
      task_id: "plan-dep-001",
      phase: "analyze-dependencies",
      context: { feature, relevant_dirs },
      instructions: "Find related code and dependencies",
      expected_output: "dependency_analysis",
    }),
    allowed_tools: RESEARCH_PROFILE,
    model: "opus",
    run_in_background: true,
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Decompose tasks",
    prompt: JSON.stringify({
      task_id: "plan-task-001",
      phase: "decompose-tasks",
      context: { feature },
      instructions: "Break into implementation tasks",
      expected_output: "task_decomposition",
    }),
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
  description: "Write spec documents",
  prompt: JSON.stringify({
    task_id: "plan-write-001",
    phase: "write",
    context: {
      feature,
      spec_path: `specs/${feature}/`,
      analysis_summary: analysisSummary,
    },
    instructions: "Create spec documents",
    expected_output: "files_created",
  }),
  allowed_tools: WRITER_PROFILE,
  model: "sonnet",
});
```

## Legacy Compatibility

The `plan-researcher` sub-agent is an alias for running all three analyzers sequentially. For new code, use the parallel analyzers directly.

| Legacy          | New Equivalent                                               |
| --------------- | ------------------------------------------------------------ |
| plan-researcher | requirement-analyzer + dependency-analyzer + task-decomposer |
| plan-qa         | plan-validator                                               |

## Related Documentation

- [Plan Agent](../../agents/plan-agent.md) - Orchestrator documentation
- [Handoff Protocol](../protocols/handoff.md) - Request/response format
- [Orchestration Patterns](../protocols/orchestration.md) - Parallel execution patterns
