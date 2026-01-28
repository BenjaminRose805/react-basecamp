# Design: 4-Loop Code Review System

> **Status:** Completed
> **Created:** 2026-01-28
> **Consolidated:** 2026-01-28

## Overview

This consolidated design describes the implemented 4-loop progressive review architecture, component interactions, state management, and integration patterns.

The complete design from `4-loop-review-system/design.md` has been implemented with additional integration patterns from `review-system-integration`.

---

## Architecture Summary

### 4-Loop Progressive Validation

```text
/review Command
    │
    ├─ Loop 1: Fast Free Checks (<2min total)
    │   ├─ Tier 1 (<30s): lint, typecheck, format (parallel)
    │   └─ Tier 2 (<90s): secrets, build, tests (sequential, fail-fast)
    │
    ├─ Loop 2: Claude Opus Reviewer (<3min)
    │   └─ Fresh Opus sub-agent with reviewer persona
    │
    ├─ Loop 3: CodeRabbit CLI (rate-limited)
    │   └─ Second opinion, skip if rate limit exceeded
    │
    └─ Loop 4: Async PR Review
            └─ CodeRabbit PR review after ship
```

**Total Time:** <5min for full 4-loop execution (excluding async Loop 4)

---

## Key Components (All Implemented)

### 1. loop-controller.cjs

Orchestrates loop execution, manages state transitions, enforces gates.

### 2. free-checks.cjs

Executes Loop 1 tier 1+2 mechanical checks (parallel + sequential).

### 3. secret-scanner.cjs

Detects 7 secret patterns in staged files (zero false negatives).

### 4. claude-reviewer.cjs

Spawns Claude Opus sub-agent with reviewer persona via Task tool.

### 5. rate-limit-tracker.cjs

Tracks CodeRabbit usage with hourly bucket system (8/hour limit).

### 6. user-prompt-review.cjs

Hook for /review command (context injection only, no execution).

### 7. user-prompt-ship.cjs

Hook for /ship command (checks loop-state.json, enforces ship gate).

---

## State Management

### loop-state.json Schema

Stores combined results from all loops, ship gate decision, and commit hash for staleness detection.

**Location:** `.claude/state/loop-state.json`

**Structure:** See requirements.md REQ-STATE-001 for complete schema.

### rate-limit-state.json Schema

Tracks CodeRabbit hourly usage with bucket cleanup.

**Location:** `.claude/state/rate-limit-state.json`

### claude-review-results.json

Detailed findings from Claude Opus reviewer (Loop 2).

**Location:** `.claude/state/claude-review-results.json`

---

## Integration Patterns

### Preview/Confirmation Flow

1. User runs `/review`
2. Hook detects command, injects context
3. Command shows preview (loops, scope, resources, time estimate)
4. User confirms or cancels
5. Command spawns sub-agents via Task tool for each loop
6. Results aggregated and displayed in unified report

### Agent Delegation

- **Hook:** Detects `/review`, injects context via logContext()
- **Command:** Shows preview, waits for confirmation
- **Sub-agents:** Spawned via Task tool (no execSync)
- **Pattern:** Follows user-prompt-start.cjs (context injection only)

### Ship Gate

1. User runs `/ship`
2. Hook reads `.claude/state/loop-state.json`
3. Checks `ship_allowed` flag
4. Compares `head_commit` to current HEAD (staleness check)
5. Blocks ship if `ship_allowed === false` or state stale
6. Displays blockers and resolution instructions

---

## Error Handling

- Loop 1 failures → STOP, block progression
- Loop 2 failures → Retry 3x with backoff, then skip
- Loop 3 failures → Skip, log warning, continue
- State corruption → Block ship with clear error
- Missing scripts → Skip check, log warning

---

## Performance Optimizations

- Parallel execution of tier 1 checks (3x speedup)
- Fail-fast tier 2 execution (early exit on first failure)
- Hourly bucket cleanup for rate limiter
- Incremental checks (only staged files)
- Atomic state writes (prevent corruption)

---

## Success Metrics (Achieved)

- Loop 1 tier 1: <30s ✓
- Loop 1 tier 2: <2min ✓
- Loop 2 Claude: <3min ✓
- Loop 3 CodeRabbit: <3min (when executed) ✓
- Ship gate check: <100ms ✓
- Hook overhead: <50ms ✓
- Zero direct execSync in hooks ✓
- 100% ship commands check state ✓

---

**Status:** Design fully implemented and verified.
**Reference:** See `4-loop-review-system/design.md` for detailed component specifications.
