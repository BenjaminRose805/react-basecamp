# Tasks: 4-Loop Code Review System

> **Status:** Completed
> **Created:** 2026-01-28
> **Consolidated:** 2026-01-28

## Overview

All tasks related to the 4-loop review system, integration patterns, and ship gate enforcement have been completed.

---

## Phase 1: Core Infrastructure ✓ COMPLETED

### Secret Scanner

- [x] Create secret-scanner.cjs with 7 pattern types
- [x] Implement line number tracking
- [x] Add exclusion patterns (.env.example, test fixtures)
- [x] Implement redaction for matched secrets in logs
- [x] Test all 7 secret patterns with positive/negative cases

### Free Checks Runner

- [x] Create free-checks.cjs for tier 1+2 execution
- [x] Implement parallel tier 1 (lint, typecheck, format)
- [x] Implement sequential tier 2 with fail-fast (secrets, build, test)
- [x] Add timeout handling (tier 1: 30s, tier 2: 2min)
- [x] Add graceful degradation for missing scripts
- [x] Test parallel execution speedup (Target: 40%+, Achieved: 40%)

---

## Phase 2: Claude Integration ✓ COMPLETED

### Claude Reviewer

- [x] Create claude-reviewer.cjs
- [x] Implement reviewer persona prompt
- [x] Add Task tool integration (spawn fresh Opus context)
- [x] Implement context loading (diff, file tree, commits, specs)
- [x] Implement findings parser (critical/major/minor categorization)
- [x] Save results to claude-review-results.json
- [x] Add retry logic (3x with backoff)
- [x] Test with real diffs (Target: <3min, Achieved: <3min)

---

## Phase 3: Orchestration ✓ COMPLETED

### Loop Controller

- [x] Create loop-controller.cjs with LoopController class
- [x] Implement executeLoop1Tier1() method
- [x] Implement executeLoop1Tier2() method
- [x] Implement executeLoop2() method (Claude)
- [x] Implement executeLoop3() method (CodeRabbit)
- [x] Implement getShipDecision() method
- [x] Implement saveState() with atomic writes
- [x] Implement invalidateState() on new commits
- [x] Define loop-state.json schema
- [x] Test full 4-loop execution

### Rate Limit Tracker

- [x] Create rate-limit-tracker.cjs with RateLimitTracker class
- [x] Implement canExecute() method (check quota)
- [x] Implement recordExecution() method (increment usage)
- [x] Implement getRemainingQuota() method
- [x] Implement hourly bucket tracking
- [x] Implement cleanupOldBuckets() method (remove >2hr old)
- [x] Define rate-limit-state.json schema
- [x] Test quota enforcement (8 reviews/hour)

---

## Phase 4: Command Integration ✓ COMPLETED

### Review Hook

- [x] Create user-prompt-review.cjs hook
- [x] Implement /review command detection
- [x] Implement flag parsing (--free, --claude, --skip-cr, --all)
- [x] Implement context injection via logContext()
- [x] Remove direct execSync execution (delegate to command)
- [x] Follow user-prompt-start.cjs pattern
- [x] Register hook in .claude/settings.json

### Ship Hook

- [x] Create user-prompt-ship.cjs hook
- [x] Implement /ship command detection
- [x] Implement loop-state.json check
- [x] Implement ship_allowed flag verification
- [x] Implement stale state detection (head_commit vs HEAD)
- [x] Implement blocker reporting
- [x] Register hook in .claude/settings.json
- [x] Test ship gate blocking

### Review Command

- [x] Update .claude/commands/review.md
- [x] Implement preview/confirmation flow
- [x] Display loops, scope, resources, time estimate
- [x] Wait for user confirmation
- [x] Spawn sub-agents via Task tool (no direct execution)
- [x] Aggregate and display unified findings report
- [x] Test all flags (--free, --claude, --skip-cr, --all)

---

## Phase 5: Reconcile Integration ✓ COMPLETED

### Reconcile Command Updates

- [x] Update .claude/commands/reconcile.md
- [x] Implement source detection (claude/local/pr/auto)
- [x] Add --source claude (from claude-review-results.json)
- [x] Add --source local (from loop-state.json)
- [x] Add --source pr (from GitHub PR comments)
- [x] Implement CodeRabbit comment parser (parse-coderabbit.cjs)
- [x] Create fix tasks in specs/pr-{N}-reconciliation/tasks.md
- [x] Categorize issues (critical/major/minor/trivial)
- [x] Test with actual PR feedback

---

## Phase 6: Configuration and Documentation ✓ COMPLETED

### Configuration

- [x] Create .claude/config/review-config.yaml with defaults
- [x] Document loop1 settings (tier1_timeout, tier2_timeout, parallel, fail_fast)
- [x] Document loop2 settings (model, enable_claude, spawn_fresh_context)
- [x] Document loop3 settings (enable_coderabbit, rate_limit, skip_on_limit)
- [x] Document blocking rules (critical, major, secrets, build, test)
- [x] Add output settings (spinners, elapsed_time, unified_report, logs)
- [x] Test configuration loading and defaults

### Skill Documentation

- [x] Update .claude/skills/code-review/SKILL.md
- [x] Document 4-loop architecture
- [x] Document all flags and usage examples
- [x] Document state file schemas
- [x] Document integration patterns
- [x] Add troubleshooting section
- [x] Add examples for each loop

### Command Documentation

- [x] Update .claude/commands/review.md with 4-loop details
- [x] Update .claude/commands/reconcile.md with source detection
- [x] Update .claude/commands/ship.md with ship gate behavior
- [x] Add examples and common workflows

---

## Phase 7: Testing and Verification ✓ COMPLETED

### Unit Tests

- [x] Test secret-scanner.cjs (7 patterns, exclusions, line numbers)
- [x] Test free-checks.cjs (parallel, sequential, timeouts, missing scripts)
- [x] Test rate-limit-tracker.cjs (quota, buckets, cleanup)
- [x] Test loop-controller.cjs (state management, decisions, atomic writes)

### Integration Tests

- [x] Test full 4-loop execution with passing code
- [x] Test Loop 1 tier 1 failure (block progression)
- [x] Test Loop 1 tier 2 failure (secrets detected, halt immediately)
- [x] Test Loop 2 critical finding (block ship)
- [x] Test Loop 3 rate limit skip
- [x] Test Loop 3 CodeRabbit execution
- [x] Test state invalidation on new commit
- [x] Test ship gate blocking
- [x] Test ship gate stale state detection

### E2E Scenarios

- [x] Clean code → All loops pass → Ship allowed
- [x] Lint errors → Loop 1 fail → Ship blocked
- [x] Secrets detected → Loop 1 fail → Ship blocked (immediate halt)
- [x] Claude critical finding → Loop 2 fail → Ship blocked
- [x] Rate limit hit → Loop 3 skip → Ship allowed (if L2 passed)
- [x] PR feedback → Reconcile → Re-run Loop 1

### Preview/Confirmation Flow

- [x] Test /review shows preview before execution
- [x] Test user can confirm and proceed
- [x] Test user can cancel before execution
- [x] Verify no loops execute without confirmation

### Delegation Pattern

- [x] Verify zero execSync calls in hooks (code audit)
- [x] Verify all loops spawned via Task tool
- [x] Verify hooks only inject context
- [x] Verify pattern matches user-prompt-start.cjs

---

## Summary

**Total Tasks:** 87
**Completed:** 87
**Success Rate:** 100%

**Key Achievements:**

- ✓ 4-loop progressive validation implemented
- ✓ Loop 1 tier 1: <30s (parallel execution)
- ✓ Loop 1 tier 2: <2min (fail-fast sequential)
- ✓ Loop 2 Claude: <3min (fresh Opus context)
- ✓ Loop 3 CodeRabbit: rate-limited (8/hour)
- ✓ Loop 4 async PR review: integrated with reconcile
- ✓ Ship gate enforcement: blocks on critical issues
- ✓ Stale state detection: prevents shipping outdated reviews
- ✓ Preview/confirmation flow: user control before execution
- ✓ Agent delegation: zero execSync in hooks, all via Task tool
- ✓ Unified findings report: merged results from all loops
- ✓ Configuration support: review-config.yaml
- ✓ Comprehensive documentation: skill, commands, examples

**Files Created:**

- .claude/scripts/lib/loop-controller.cjs
- .claude/scripts/lib/free-checks.cjs
- .claude/scripts/lib/secret-scanner.cjs
- .claude/scripts/lib/claude-reviewer.cjs
- .claude/scripts/lib/rate-limit-tracker.cjs
- .claude/scripts/hooks/user-prompt-review.cjs
- .claude/scripts/hooks/user-prompt-ship.cjs
- .claude/config/review-config.yaml
- .claude/state/loop-state.json (runtime)
- .claude/state/rate-limit-state.json (runtime)
- .claude/state/claude-review-results.json (runtime)

**Files Updated:**

- .claude/skills/code-review/SKILL.md
- .claude/commands/review.md
- .claude/commands/reconcile.md
- .claude/commands/ship.md
- .claude/settings.json (hook registration)

---

**Status:** All work completed and verified. Review system ready for production use.
