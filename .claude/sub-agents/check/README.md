# Check Sub-Agents

Quality verification sub-agents for parallel execution.

## Overview

The check-agent orchestrates these sub-agents to run quality checks in parallel:

```text
check-agent (orchestrator)
         |
         v
   BUILD (blocking)
         |
         +--------+--------+--------+
         |        |        |        |
         v        v        v        v
      TYPES    LINT    TESTS  SECURITY
      (~15s)  (~10s)  (~20s)   (~5s)
         |        |        |        |
         +--------+--------+--------+
                    |
                    v
            AGGREGATE RESULTS
            Total: ~30s (vs ~60s sequential)
```

## Sub-Agents

| File                  | Purpose                  | Model | Blocking |
| --------------------- | ------------------------ | ----- | -------- |
| `build-checker.md`    | Verify compilation       | haiku | Yes      |
| `type-checker.md`     | TypeScript type check    | haiku | No       |
| `lint-checker.md`     | ESLint check             | haiku | No       |
| `test-runner.md`      | Test execution, coverage | haiku | No       |
| `security-scanner.md` | Security patterns        | haiku | No       |

## Execution Pattern

1. **Build first** - Must succeed before parallel checks
2. **Parallel checks** - Types, lint, tests, security run concurrently
3. **Aggregate** - Combine all results into unified report

## Invoking Sub-Agents

```typescript
// From check-agent orchestrator:

// 1. Run build (blocking)
const buildResult = await Task({
  subagent_type: "general-purpose",
  description: "Build check",
  prompt: buildCheckerPrompt,
  model: "haiku",
  allowed_tools: ["Bash"],
});

// 2. If build passes, spawn parallel checks
const [types, lint, tests, security] = await Promise.all([
  Task({
    subagent_type: "general-purpose",
    description: "Type check",
    prompt: typeCheckerPrompt,
    model: "haiku",
    run_in_background: true,
    allowed_tools: ["Bash"],
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Lint check",
    prompt: lintCheckerPrompt,
    model: "haiku",
    run_in_background: true,
    allowed_tools: ["Bash"],
  }),
  // ... tests, security
]);
```

## Output Schema

Each sub-agent returns a JSON response:

```json
{
  "check": "types | lint | tests | security | build",
  "passed": true | false,
  "duration_ms": 15000,
  "errors": [...],
  "warnings": [...]
}
```

## Quality Gates

| Check    | Pass Criteria              |
| -------- | -------------------------- |
| Build    | Exit code 0                |
| Types    | 0 TypeScript errors        |
| Lint     | 0 ESLint errors            |
| Tests    | All pass, coverage >= 70%  |
| Security | No secrets, no console.log |

## Performance Target

| Metric     | Sequential | Parallel | Improvement  |
| ---------- | ---------- | -------- | ------------ |
| All pass   | ~60s       | ~30s     | 2x faster    |
| Any fail   | ~60s       | ~30s     | 2x faster    |
| Build fail | ~10s       | ~10s     | Same (early) |
