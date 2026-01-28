# Orchestration Patterns

Patterns for coordinating sub-agents in workflows.

## Overview

Orchestration patterns define how sub-agents are spawned, sequenced, and aggregated. Choose the right pattern based on task dependencies.

## Pattern 1: Sequential Chain

For dependent phases where each builds on the previous.

```text
Orchestrator
    │
    ├── Task(researcher) ────► returns context_summary
    │
    ├── Task(writer, prev_summary) ────► returns files_changed
    │
    └── Task(validator, files) ────► returns PASS/FAIL
```

### When to Use

- Phases depend on each other
- Each phase needs output from previous
- Standard research → write → validate flow

### Pseudocode

```typescript
async function sequentialChain(feature: string, specPath: string) {
  // Phase 1: Research
  const researchHandoff = {
    task_id: `${feature}-research`,
    phase: "research",
    context: {
      feature,
      spec_path: specPath,
      relevant_files: ["src/"],
      constraints: ["check for conflicts"],
    },
    instructions: "Find existing patterns and conflicts",
    expected_output: "structured_findings",
  };

  const research = await Task({
    subagent_type: "general-purpose",
    description: `Research ${feature}`,
    prompt: JSON.stringify(researchHandoff),
    allowed_tools: RESEARCH_PROFILE,
    model: "sonnet",
  });

  const researchResult = JSON.parse(research);

  // Check decision
  if (researchResult.decision === "STOP") {
    return {
      status: "stopped",
      reason: researchResult.issues.join(", "),
      phase: "research",
    };
  }

  if (researchResult.decision === "CLARIFY") {
    return {
      status: "needs_clarification",
      questions: researchResult.issues,
      phase: "research",
    };
  }

  // Phase 2: Write (receives compacted context)
  const writeHandoff = {
    task_id: `${feature}-write`,
    phase: "write",
    context: {
      feature,
      spec_path: specPath,
      relevant_files: researchResult.findings.patterns_found.map((p) => p.file),
      constraints: ["TDD", "30 line functions"],
      previous_findings: researchResult.context_summary, // COMPACT!
    },
    instructions: "Implement feature using TDD",
    expected_output: "files_changed",
  };

  const write = await Task({
    subagent_type: "general-purpose",
    description: `Implement ${feature}`,
    prompt: JSON.stringify(writeHandoff),
    allowed_tools: WRITER_PROFILE,
    model: "sonnet",
  });

  const writeResult = JSON.parse(write);

  if (writeResult.decision === "STOP") {
    return {
      status: "stopped",
      reason: writeResult.issues.join(", "),
      phase: "write",
    };
  }

  // Phase 3: Validate (receives compacted context)
  const validateHandoff = {
    task_id: `${feature}-validate`,
    phase: "validate",
    context: {
      feature,
      files_changed: [
        ...writeResult.findings.files_created.map((f) => f.path),
        ...writeResult.findings.files_modified.map((f) => f.path),
      ],
      tests_written: writeResult.findings.tests_written.map((t) => t.path),
      constraints: ["coverage > 70%"],
      previous_findings: writeResult.context_summary, // COMPACT!
    },
    instructions: "Run all quality checks",
    expected_output: "validation_result",
  };

  const validate = await Task({
    subagent_type: "general-purpose",
    description: `Validate ${feature}`,
    prompt: JSON.stringify(validateHandoff),
    allowed_tools: [...READ_ONLY_PROFILE, "Bash"],
    model: "haiku", // Cheaper for checklist work
  });

  const validateResult = JSON.parse(validate);

  return {
    status: validateResult.decision === "PROCEED" ? "success" : "failed",
    findings: validateResult.findings,
    context_summary: validateResult.context_summary,
  };
}
```

### Context Savings

| Phase    | Monolithic          | Sequential Chain     | Savings |
| -------- | ------------------- | -------------------- | ------- |
| Research | 15K tokens          | 15K tokens           | 0%      |
| Write    | 35K (research+impl) | 20K (summary+impl)   | 43%     |
| Validate | 45K (all)           | 10K (summary+checks) | 78%     |

## Pattern 2: Parallel Executor

For independent tasks that can run concurrently.

```text
Orchestrator
    │
    ├── Task(typecheck) ────┐
    ├── Task(lint) ─────────┼──► aggregate results
    ├── Task(test) ─────────┤
    └── Task(security) ─────┘
```

### When to Use

- Tasks are independent
- No dependencies between tasks
- Want faster execution

### Pseudocode

```typescript
async function parallelExecutor(
  feature: string,
  files: string[],
  aggregation: "all_must_pass" | "any_pass" | "majority_pass"
) {
  // Define parallel tasks
  const tasks = [
    {
      id: "typecheck",
      type: "typecheck",
      handoff: {
        task_id: `${feature}-typecheck`,
        phase: "validate",
        context: { feature, files_changed: files },
        instructions: "Run pnpm typecheck",
        expected_output: "validation_result",
      },
    },
    {
      id: "lint",
      type: "lint",
      handoff: {
        task_id: `${feature}-lint`,
        phase: "validate",
        context: { feature, files_changed: files },
        instructions: "Run pnpm lint",
        expected_output: "validation_result",
      },
    },
    {
      id: "test",
      type: "test",
      handoff: {
        task_id: `${feature}-test`,
        phase: "validate",
        context: { feature, files_changed: files },
        instructions: "Run pnpm test:run --coverage",
        expected_output: "validation_result",
      },
    },
    {
      id: "security",
      type: "security",
      handoff: {
        task_id: `${feature}-security`,
        phase: "validate",
        context: { feature, files_changed: files },
        instructions: "Check for security issues",
        expected_output: "validation_result",
      },
    },
  ];

  // Spawn ALL tasks in parallel (single message, multiple Task calls)
  // In actual usage, make multiple Task calls in the same message
  const results = await Promise.all(
    tasks.map((task) =>
      Task({
        subagent_type: "general-purpose",
        description: `Run ${task.type}`,
        prompt: JSON.stringify(task.handoff),
        allowed_tools: [...READ_ONLY_PROFILE, "Bash"],
        model: "haiku",
        run_in_background: true,
      })
    )
  );

  // Parse results
  const parsed = results.map((r, i) => ({
    ...tasks[i],
    result: JSON.parse(r),
  }));

  // Aggregate based on rule
  const passed = parsed.filter((p) => p.result.decision === "PROCEED").length;
  const total = parsed.length;

  let overall_passed: boolean;
  switch (aggregation) {
    case "all_must_pass":
      overall_passed = passed === total;
      break;
    case "any_pass":
      overall_passed = passed > 0;
      break;
    case "majority_pass":
      overall_passed = passed > total / 2;
      break;
  }

  return {
    decision: overall_passed ? "PROCEED" : "STOP",
    findings: {
      results: parsed.map((p) => ({
        task_id: p.id,
        type: p.type,
        passed: p.result.decision === "PROCEED",
        summary: p.result.context_summary,
        details: p.result.findings,
      })),
      aggregation: {
        total,
        passed,
        failed: total - passed,
        rule: aggregation,
        overall_passed,
      },
    },
    issues: parsed
      .filter((p) => p.result.decision !== "PROCEED")
      .flatMap((p) => p.result.issues),
  };
}
```

### Performance Benefits

| Approach    | Time (4 checks at 15s each) |
| ----------- | --------------------------- |
| Sequential  | 60s                         |
| Parallel    | 15s (max of all)            |
| **Speedup** | **4x**                      |

## Pattern 3: Conditional Branch

For workflows that vary based on analysis.

```text
Orchestrator
    │
    ├── Task(analyzer)
    │       │
    │       └── returns: complexity
    │
    ├── if simple:
    │   └── Task(quick-writer)
    │
    └── if complex:
        ├── Task(researcher)
        ├── Task(architect)
        └── Task(writer)
```

### When to Use

- Different paths based on analysis
- Want to optimize for simple cases
- Complex cases need more phases

### Pseudocode

```typescript
async function conditionalBranch(feature: string, specPath: string) {
  // Phase 1: Analyze complexity
  const analysisHandoff = {
    task_id: `${feature}-analyze`,
    phase: "research",
    context: {
      feature,
      spec_path: specPath,
    },
    instructions:
      "Analyze complexity: count files affected, dependencies, risk",
    expected_output: "structured_findings",
  };

  const analysis = await Task({
    subagent_type: "general-purpose",
    description: `Analyze ${feature}`,
    prompt: JSON.stringify(analysisHandoff),
    allowed_tools: READ_ONLY_PROFILE,
    model: "haiku", // Quick analysis
  });

  const analysisResult = JSON.parse(analysis);

  // Determine complexity
  const complexity = determineComplexity(analysisResult);

  // Branch based on complexity
  if (complexity === "simple") {
    // Simple path: direct implementation
    return await simpleImplementation(feature, specPath, analysisResult);
  } else {
    // Complex path: full research → architect → write
    return await complexImplementation(feature, specPath, analysisResult);
  }
}

function determineComplexity(analysis: AnalysisResult): "simple" | "complex" {
  const { files_affected, dependencies, risk_level } = analysis.findings;

  if (files_affected <= 2 && dependencies <= 1 && risk_level === "low") {
    return "simple";
  }
  return "complex";
}

async function simpleImplementation(feature, specPath, analysis) {
  // Single writer phase
  const writeHandoff = {
    task_id: `${feature}-write`,
    phase: "write",
    context: {
      feature,
      spec_path: specPath,
      previous_findings: analysis.context_summary,
    },
    instructions: "Quick implementation - single file change",
    expected_output: "files_changed",
  };

  return await Task({
    subagent_type: "general-purpose",
    description: `Quick implement ${feature}`,
    prompt: JSON.stringify(writeHandoff),
    allowed_tools: WRITER_PROFILE,
    model: "sonnet",
  });
}

async function complexImplementation(feature, specPath, analysis) {
  // Full sequential chain
  return await sequentialChain(feature, specPath);
}
```

## Error Handling

### Retry Strategy

```typescript
async function withRetry(
  taskFn: () => Promise<SubAgentResult>,
  maxRetries: number = 2
): Promise<SubAgentResult> {
  let lastResult: SubAgentResult;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await taskFn();

    if (lastResult.decision === "PROCEED") {
      return lastResult;
    }

    if (lastResult.decision === "STOP" && attempt < maxRetries) {
      // Retry with issues as additional context
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      continue;
    }

    if (lastResult.decision === "CLARIFY") {
      // Don't retry CLARIFY, need user input
      break;
    }
  }

  return lastResult;
}
```

### Timeout Handling

```typescript
async function withTimeout(
  taskFn: () => Promise<SubAgentResult>,
  timeoutMs: number = 300000 // 5 minutes
): Promise<SubAgentResult> {
  const timeoutPromise = new Promise<SubAgentResult>((_, reject) => {
    setTimeout(() => reject(new Error("Sub-agent timeout")), timeoutMs);
  });

  try {
    return await Promise.race([taskFn(), timeoutPromise]);
  } catch (error) {
    return {
      task_id: "timeout",
      phase: "unknown",
      status: "blocked",
      decision: "STOP",
      findings: {},
      context_summary: `Sub-agent timed out after ${timeoutMs}ms`,
      issues: ["Timeout - consider breaking into smaller tasks"],
    };
  }
}
```

## Orchestrator Memory Rules

Orchestrators must aggressively discard context to stay within budget. After each sub-agent returns, extract only the essentials.

### After Each Sub-Agent Return

1. **Extract** the `context_summary` (max 500 tokens)
2. **Extract** the `decision` (PROCEED/STOP/CLARIFY)
3. **Extract** essential data (files_changed, blocking_issues)
4. **DISCARD** the raw response - do not retain full findings

### State Structure

The orchestrator should maintain a minimal state object:

```typescript
interface OrchestratorState {
  task: {
    id: string;
    feature: string;
    spec_path: string | null;
  };
  progress: {
    current_phase: "research" | "write" | "validate";
    completed_phases: string[];
    // COMPACT: Only summaries, not raw outputs
    research_summary: string | null; // max 500 tokens
    write_summary: string | null; // max 500 tokens
    files_changed: string[]; // just paths, not contents
  };
  decisions: {
    research: "PROCEED" | "STOP" | "CLARIFY" | "pending";
    write: "PROCEED" | "STOP" | "pending";
    validate: "PROCEED" | "STOP" | "pending";
  };
}
```

### What to RETAIN

| Retain          | Size        | Purpose            |
| --------------- | ----------- | ------------------ |
| context_summary | ≤500 tokens | Pass to next phase |
| decision        | 1 word      | Control flow       |
| files_changed   | Paths only  | Scope validation   |
| blocking_issues | Brief list  | Error reporting    |

### What to DISCARD

| Discard                           | Why                            |
| --------------------------------- | ------------------------------ |
| findings.existing_implementations | Research is done               |
| findings.patterns_found           | Already summarized             |
| findings.checks (detailed)        | Pass/fail captured in summary  |
| Raw grep/search outputs           | Never retain intermediate data |
| Full sub-agent response           | Only need extracted fields     |
| Alternative approaches            | Decision made                  |

### Example: Sequential Chain Memory

```typescript
async function orchestrateFeature(feature: string) {
  // Initialize minimal state
  const state: OrchestratorState = {
    task: { id: `${feature}-${Date.now()}`, feature, spec_path: null },
    progress: {
      current_phase: "research",
      completed_phases: [],
      research_summary: null,
      write_summary: null,
      files_changed: [],
    },
    decisions: {
      research: "pending",
      write: "pending",
      validate: "pending",
    },
  };

  // Phase 1: Research
  const researchResult = await runResearchSubAgent(feature);

  // EXTRACT only what we need
  state.decisions.research = researchResult.decision;
  state.progress.research_summary = researchResult.context_summary;
  state.progress.completed_phases.push("research");
  state.progress.current_phase = "write";
  // DISCARD: researchResult.findings (not stored)

  if (researchResult.decision !== "PROCEED") {
    return handleNonProceed(researchResult);
  }

  // Phase 2: Write (receives ONLY the summary)
  const writeResult = await runWriteSubAgent(
    feature,
    state.progress.research_summary // 500 tokens, not 10K
  );

  // EXTRACT
  state.decisions.write = writeResult.decision;
  state.progress.write_summary = writeResult.context_summary;
  state.progress.files_changed = extractFilePaths(writeResult);
  state.progress.completed_phases.push("write");
  state.progress.current_phase = "validate";
  // DISCARD: writeResult.findings

  // Phase 3: Validate (receives ONLY paths and summary)
  const validateResult = await runValidateSubAgent(
    state.progress.files_changed,
    state.progress.write_summary // 500 tokens
  );

  return {
    decision: validateResult.decision,
    summary: validateResult.context_summary,
    files: state.progress.files_changed,
  };
}
```

### Memory Savings

| Phase    | Without Rules    | With Rules        | Savings |
| -------- | ---------------- | ----------------- | ------- |
| Research | 15K tokens       | 500 tokens        | 97%     |
| Write    | +20K (35K total) | +500 (1K total)   | 97%     |
| Validate | +15K (50K total) | +500 (1.5K total) | 97%     |

**Total orchestrator context for 3-phase workflow: ~1.5K tokens vs ~50K tokens**

### Anti-Patterns

**DON'T store raw findings:**

```typescript
// BAD: Retains full findings
state.researchFindings = researchResult.findings;
```

**DON'T pass full responses:**

```typescript
// BAD: Passing entire research result
const writeResult = await runWrite({ previousPhase: researchResult });
```

**DON'T accumulate context:**

```typescript
// BAD: Building up context across phases
state.allContext +=
  researchResult.context_summary + writeResult.context_summary;
```

---

## Best Practices

1. **Always use compact handoffs** - Pass context_summary, not raw data
2. **Use appropriate models** - Haiku for validation, Sonnet for implementation
3. **Parallelize when possible** - Independent tasks should run concurrently
4. **Handle all decision values** - PROCEED, STOP, CLARIFY
5. **Implement retry logic** - Transient failures can be retried
6. **Set timeouts** - Don't wait forever for stuck sub-agents
7. **Log everything** - Track sub-agent invocations for debugging
8. **Discard aggressively** - Only retain context_summary from sub-agents
9. **Never accumulate** - Each phase gets fresh context with minimal carryover
