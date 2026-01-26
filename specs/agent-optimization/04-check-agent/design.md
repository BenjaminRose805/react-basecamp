# Design: Check Agent Parallelization

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-04

## Overview

This design transforms the sequential check-agent into a parallel executor that spawns independent check sub-agents concurrently. Build must run first (dependencies), but types, lint, tests, and security can all run in parallel.

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  check-agent (sequential)                                   │
├─────────────────────────────────────────────────────────────┤
│  BUILD    (~10s) ─┐                                         │
│  TYPES    (~15s) ─┼─► Total: ~60s sequential                │
│  LINT     (~10s) ─┤                                         │
│  TESTS    (~20s) ─┤                                         │
│  SECURITY (~5s)  ─┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```text
┌─────────────────────────────────────────────────────────────┐
│  check-agent (orchestrator)                                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  BUILD (~10s) - Must complete first                         │
└─────────────────────────────────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ type-checker│ │ lint-checker│ │ test-runner │ │security-scan│
│   (~15s)    │ │   (~10s)    │ │   (~20s)    │ │    (~5s)    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  Aggregate Results  │
                    │  Total: ~30s        │
                    │  (vs ~60s seq)      │
                    └─────────────────────┘
```

---

## Component Design

### 1. Check-Agent Orchestrator

**File:** `.claude/agents/check-agent.md` (updated)

```markdown
# Agent: check-agent (Orchestrator)

## Role

Orchestrate quality checks through parallel sub-agent execution.

## Sub-Agents

- build-checker: Compilation check (blocking)
- type-checker: TypeScript type check (parallel)
- lint-checker: ESLint check (parallel)
- test-runner: Vitest execution (parallel)
- security-scanner: Security patterns (parallel)

## Workflow

### Full Check (/check)

1. Spawn build-checker (blocking)
2. If build passes: spawn types, lint, tests, security in parallel
3. Wait for all to complete
4. Aggregate results
5. Report unified status

### Scoped Check (/check [type])

1. Spawn specific checker only
2. Report result
```

### 2. Build Checker Sub-Agent

**File:** `.claude/sub-agents/check/build-checker.md`

```markdown
# Sub-Agent: build-checker

## Role

Verify project builds successfully.

## Command

pnpm build

## Output

{
"check": "build",
"passed": boolean,
"duration_ms": number,
"errors": [{ "message": string }]
}

## Model

haiku
```

### 3. Type Checker Sub-Agent

**File:** `.claude/sub-agents/check/type-checker.md`

```markdown
# Sub-Agent: type-checker

## Role

Verify TypeScript types are correct.

## Command

pnpm typecheck

## Output

{
"check": "types",
"passed": boolean,
"duration_ms": number,
"errors": [{
"file": string,
"line": number,
"message": string,
"code": string
}]
}

## Model

haiku
```

### 4. Lint Checker Sub-Agent

**File:** `.claude/sub-agents/check/lint-checker.md`

```markdown
# Sub-Agent: lint-checker

## Role

Verify code follows lint rules.

## Command

pnpm lint

## Output

{
"check": "lint",
"passed": boolean,
"duration_ms": number,
"errors": [{
"file": string,
"line": number,
"rule": string,
"severity": "error" | "warning",
"message": string
}]
}

## Model

haiku
```

### 5. Test Runner Sub-Agent

**File:** `.claude/sub-agents/check/test-runner.md`

```markdown
# Sub-Agent: test-runner

## Role

Execute tests and report results.

## Command

pnpm test:run

## Output

{
"check": "tests",
"passed": boolean,
"duration_ms": number,
"total": number,
"passed_count": number,
"failed_count": number,
"coverage": { "lines": number, "branches": number },
"failures": [{
"test": string,
"file": string,
"error": string
}]
}

## Model

haiku
```

### 6. Security Scanner Sub-Agent

**File:** `.claude/sub-agents/check/security-scanner.md`

```markdown
# Sub-Agent: security-scanner

## Role

Check for security issues in code.

## Checks

1. console.log statements in src/
2. Hardcoded secrets (API keys, passwords)
3. TODO/FIXME comments in production paths
4. .env files accidentally committed

## Commands

grep -r "console.log" src/
grep -rE "(api[_-]?key|password|secret)" --include="\*.ts" src/

## Output

{
"check": "security",
"passed": boolean,
"duration_ms": number,
"issues": [{
"type": "console.log" | "secret" | "todo" | "env",
"file": string,
"line": number,
"severity": "high" | "medium" | "low"
}]
}

## Model

haiku
```

---

## Data Flow

### Parallel Execution Flow

```text
User: /check
    │
    ▼
Orchestrator: Start build (blocking)
    │
    ├── Task(build-checker) ──► Wait for result
    │
    ▼
Build passed? ──► No ──► Report FAIL, stop
    │
    Yes
    │
    ▼
Orchestrator: Spawn parallel checkers
    │
    ├── Task(type-checker, run_in_background: true)
    ├── Task(lint-checker, run_in_background: true)
    ├── Task(test-runner, run_in_background: true)
    └── Task(security-scanner, run_in_background: true)
    │
    ▼
Wait for all to complete (TaskOutput for each)
    │
    ▼
Aggregate results:
{
  "status": "PASS" | "FAIL",
  "checks": {
    "build": { "passed": true, "duration_ms": 10000 },
    "types": { "passed": true, "duration_ms": 15000 },
    "lint": { "passed": true, "duration_ms": 10000 },
    "tests": { "passed": true, "duration_ms": 20000, "coverage": {...} },
    "security": { "passed": true, "duration_ms": 5000 }
  },
  "total_duration_ms": 30000
}
    │
    ▼
User: "All checks passed (30s)"
```

### Aggregated Report Format

```text
┌─────────────────────────────────────────────────────────────┐
│  QUALITY CHECK RESULTS                                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ Build      PASS   10.2s                                  │
│  ✓ Types      PASS   15.1s                                  │
│  ✓ Lint       PASS   10.0s                                  │
│  ✓ Tests      PASS   20.3s   (85% coverage, 42/42 passed)   │
│  ✓ Security   PASS    5.1s                                  │
├─────────────────────────────────────────────────────────────┤
│  TOTAL: PASS  30.3s (parallel)                              │
└─────────────────────────────────────────────────────────────┘
```

### Failure Report Format

```text
┌─────────────────────────────────────────────────────────────┐
│  QUALITY CHECK RESULTS                                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ Build      PASS   10.2s                                  │
│  ✗ Types      FAIL   15.1s                                  │
│    └─ src/lib/auth.ts:42 - Type 'string' not assignable     │
│  ✓ Lint       PASS   10.0s                                  │
│  ✗ Tests      FAIL   20.3s   (2 failures)                   │
│    └─ auth.test.ts: "should validate token" - expected true │
│  ✓ Security   PASS    5.1s                                  │
├─────────────────────────────────────────────────────────────┤
│  TOTAL: FAIL  30.3s (2 checks failed)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Analysis

| Scenario        | Sequential | Parallel | Improvement       |
| --------------- | ---------- | -------- | ----------------- |
| All pass        | 60s        | 30s      | **2x faster**     |
| Build fails     | 10s        | 10s      | Same (early exit) |
| One check fails | 60s        | 30s      | **2x faster**     |
| All fail        | 60s        | 30s      | **2x faster**     |

Key insight: Parallel execution time = build + max(types, lint, tests, security)

---

## Dependencies

| Component         | Version  | Purpose                   |
| ----------------- | -------- | ------------------------- |
| 01-infrastructure | Required | Parallel executor pattern |
| qa-checks skill   | Current  | Check procedures          |
| Task tool         | Built-in | Background execution      |
