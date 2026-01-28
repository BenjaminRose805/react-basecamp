# Testing Checklist: 4-Loop Review System

## Overview

This document provides a comprehensive testing checklist for validating the 4-loop review system. Each test case includes prerequisites, steps, expected results, and space for actual results.

**Testing Scope:**

- Loop 1 Tier 1 (fast mechanical checks)
- Loop 1 Tier 2 (comprehensive mechanical checks)
- Loop 2 (Claude Opus reviewer)
- Loop 3 (CodeRabbit CLI rate-limited)
- Loop 4 (async PR review)
- State management and persistence
- Ship gate enforcement
- Command flags and configuration

**Test Status Legend:**

- `[PASS]` - Test passed as expected
- `[FAIL]` - Test failed, issue found
- `[SKIP]` - Test skipped (not applicable, blocked, or deferred)
- `[PENDING]` - Test not yet executed

---

## Loop 1: Mechanical Checks

### TC-001: Clean Code Passes All Loops

**Prerequisites:**

- Clean working directory with no uncommitted changes
- All pnpm scripts configured (lint, typecheck, format:check, test, build)
- No linting errors, type errors, or test failures

**Steps:**

1. Run `/review --all`
2. Observe loop progression: L1-T1 → L1-T2 → L2 → L3 → Ship Gate
3. Check final unified report

**Expected Result:**

- Loop 1 Tier 1: PASS (lint, typecheck, format all pass)
- Loop 1 Tier 2: PASS (secrets, build, tests all pass)
- Loop 2: PASS (Claude review finds 0 critical issues)
- Loop 3: PASS or SKIP (CodeRabbit runs if rate allows)
- Ship Gate: ALLOWED
- State file `loop-state.json` created with `ship_allowed: true`

**Actual Result:** `[PENDING]`

---

### TC-002: Lint Error Blocks at Loop 1 Tier 1

**Prerequisites:**

- Introduce lint error (e.g., unused variable, no-console violation)

**Steps:**

1. Add code: `const unused = 42;` without using it
2. Run `/review --all`
3. Observe that execution stops after Loop 1 Tier 1

**Expected Result:**

- Loop 1 Tier 1: FAIL (lint shows specific error)
- Loop 1 Tier 2: SKIPPED (blocked by tier 1 failure)
- Loop 2: SKIPPED
- Loop 3: SKIPPED
- Ship Gate: BLOCKED
- Error message shows file, line, and rule violated
- `loop-state.json` has `ship_allowed: false` with lint blocker

**Actual Result:** `[PENDING]`

---

### TC-003: Secrets Block at Loop 1 Tier 2

**Prerequisites:**

- Pass Loop 1 Tier 1
- Introduce hardcoded secret in staged file

**Steps:**

1. Add code: `const apiKey = "EXAMPLE_KEY_1234567890abcdefghijklmnopqrstuv";`
2. Stage the file: `git add <file>`
3. Run `/review --all`
4. Observe that execution stops after Loop 1 Tier 2

**Expected Result:**

- Loop 1 Tier 1: PASS
- Loop 1 Tier 2: FAIL (secrets scanner detects API key)
- Loop 2: SKIPPED
- Loop 3: SKIPPED
- Ship Gate: BLOCKED
- Error shows matched secret pattern, file, and line (with first 4 chars only)
- `loop-state.json` has `ship_allowed: false` with secrets blocker

**Actual Result:** `[PENDING]`

---

### TC-004: Build Failure Blocks at Loop 1 Tier 2

**Prerequisites:**

- Pass Loop 1 Tier 1
- No secrets detected
- Introduce build error (e.g., syntax error that TypeScript misses)

**Steps:**

1. Add invalid code that causes build to fail but doesn't fail typecheck
2. Run `/review --all`
3. Observe that execution stops after build check in Loop 1 Tier 2

**Expected Result:**

- Loop 1 Tier 1: PASS
- Loop 1 Tier 2: FAIL (build step fails)
- Loop 2: SKIPPED
- Loop 3: SKIPPED
- Ship Gate: BLOCKED
- Error shows build output with failure reason
- `loop-state.json` has `ship_allowed: false` with build blocker

**Actual Result:** `[PENDING]`

---

### TC-005: Test Failure Blocks at Loop 1 Tier 2

**Prerequisites:**

- Pass Loop 1 Tier 1
- No secrets detected
- Build succeeds
- Introduce failing test

**Steps:**

1. Add failing test: `expect(true).toBe(false)`
2. Run `/review --all`
3. Observe that execution stops after test check in Loop 1 Tier 2

**Expected Result:**

- Loop 1 Tier 1: PASS
- Loop 1 Tier 2: FAIL (tests fail)
- Loop 2: SKIPPED
- Loop 3: SKIPPED
- Ship Gate: BLOCKED
- Error shows which tests failed and assertion details
- `loop-state.json` has `ship_allowed: false` with test blocker

**Actual Result:** `[PENDING]`

---

## Loop 2: Claude Opus Review

### TC-006: Claude Critical Finding Blocks Ship

**Prerequisites:**

- Pass Loop 1 (tier 1 + tier 2)
- Introduce code with obvious security flaw (e.g., SQL injection)

**Steps:**

1. Add code: `db.query("SELECT * FROM users WHERE id = " + userId)`
2. Run `/review --all`
3. Observe Loop 2 Claude review

**Expected Result:**

- Loop 1: PASS
- Loop 2: FAIL (Claude detects SQL injection as critical)
- Loop 3: Runs (if rate allows)
- Ship Gate: BLOCKED
- `claude-review-results.json` contains finding with severity: "critical"
- `loop-state.json` has `ship_allowed: false` with critical finding blocker
- Report shows actionable fix suggestion

**Actual Result:** `[PENDING]`

---

### TC-007: Claude Major Finding Warns But Allows Ship

**Prerequisites:**

- Pass Loop 1
- Introduce code with performance or architectural issue (non-critical)

**Steps:**

1. Add code with missing error boundary or race condition
2. Ensure no critical security issues
3. Run `/review --all`

**Expected Result:**

- Loop 1: PASS
- Loop 2: PASS with warnings (Claude detects major issue)
- Loop 3: Runs (if rate allows)
- Ship Gate: ALLOWED (major findings don't block by default)
- `claude-review-results.json` contains finding with severity: "major"
- `loop-state.json` has `ship_allowed: true` (major doesn't block)
- Report shows warning with suggestion but allows ship

**Actual Result:** `[PENDING]`

---

### TC-008: CodeRabbit Skipped When Rate Limited

**Prerequisites:**

- Pass Loop 1 and Loop 2
- Exhaust CodeRabbit rate limit (run 8 reviews in current hour)

**Steps:**

1. Check rate limit state: `cat .claude/state/rate-limit-state.json`
2. Confirm current hour bucket is at limit (8/8 used)
3. Run `/review --all`

**Expected Result:**

- Loop 1: PASS
- Loop 2: PASS
- Loop 3: SKIP (rate limit exceeded)
- Ship Gate: Decision based on Loop 1+2 results only
- `loop-state.json` loop3 status is "skip" with reason: "rate_limit_exceeded"
- Report shows warning: "CodeRabbit skipped (rate limited 8/8 used this hour)"
- No CodeRabbit API call made

**Actual Result:** `[PENDING]`

---

## Command Flags

### TC-009: /review --free Runs Loop 1 Only

**Prerequisites:**

- Clean code that passes Loop 1

**Steps:**

1. Run `/review --free`
2. Observe execution

**Expected Result:**

- Loop 1 Tier 1: Executes (lint, typecheck, format)
- Loop 1 Tier 2: Executes (secrets, build, tests)
- Loop 2: NOT executed
- Loop 3: NOT executed
- Total time: <2 minutes
- `loop-state.json` only contains loop1_tier1 and loop1_tier2 results
- Ship Gate: Based on Loop 1 results only

**Actual Result:** `[PENDING]`

---

### TC-010: /review --claude Runs Loop 1+2

**Prerequisites:**

- Clean code that passes Loop 1 and Loop 2

**Steps:**

1. Run `/review --claude`
2. Observe execution

**Expected Result:**

- Loop 1 Tier 1: Executes
- Loop 1 Tier 2: Executes
- Loop 2: Executes (Claude Opus review)
- Loop 3: NOT executed
- Total time: <3 minutes
- `loop-state.json` contains loop1 and loop2 results, no loop3
- `claude-review-results.json` created
- Ship Gate: Based on Loop 1+2 results

**Actual Result:** `[PENDING]`

---

### TC-011: /review --skip-cr Skips Loop 3

**Prerequisites:**

- Clean code that passes all loops
- CodeRabbit rate limit not exhausted

**Steps:**

1. Run `/review --skip-cr`
2. Observe execution

**Expected Result:**

- Loop 1: Executes
- Loop 2: Executes
- Loop 3: NOT executed (explicitly skipped via flag)
- `loop-state.json` loop3 status is "skip" with reason: "flag_skip_cr"
- No rate limit consumption
- Ship Gate: Based on Loop 1+2 results

**Actual Result:** `[PENDING]`

---

## /reconcile Integration

### TC-012: /reconcile --source claude Loads Findings

**Prerequisites:**

- Run `/review --all` and have Claude findings in `claude-review-results.json`

**Steps:**

1. Verify `claude-review-results.json` exists with findings
2. Run `/reconcile --source claude`
3. Observe loaded findings

**Expected Result:**

- Reconcile reads `claude-review-results.json`
- Displays Claude findings in categorized format
- Offers to spawn sub-agent to fix issues
- Does not read `loop-state.json` or fetch PR comments

**Actual Result:** `[PENDING]`

---

### TC-013: /reconcile --source pr Fetches PR Comments

**Prerequisites:**

- Create PR with `/ship`
- PR has CodeRabbit or human review comments

**Steps:**

1. Create PR: `/ship`
2. Wait for PR review comments to be posted
3. Run `/reconcile --source pr`

**Expected Result:**

- Reconcile fetches PR comments via GitHub API
- Parses inline comments and suggestions
- Displays findings in standardized format
- Offers to apply suggestions and loop back to Loop 1

**Actual Result:** `[PENDING]`

---

## /ship Integration

### TC-014: /ship Reads State and Blocks Correctly

**Prerequisites:**

- Run `/review --all` with code that has critical findings

**Steps:**

1. Introduce critical issue (e.g., exposed secret)
2. Run `/review --all` (should block)
3. Run `/ship`

**Expected Result:**

- `/ship` reads `loop-state.json`
- Detects `ship_allowed: false`
- Blocks ship operation
- Displays blocker reasons from `loop-state.json`
- Error message: "Ship blocked by review findings: [list of blockers]"
- Exit code: 1 (failure)

**Actual Result:** `[PENDING]`

---

### TC-015: New Commit Invalidates State

**Prerequisites:**

- Run `/review --all` with clean code (ship allowed)
- State file has `ship_allowed: true`

**Steps:**

1. Run `/review --all` (passes)
2. Make a new commit (any change)
3. Run `/ship` without re-running `/review`

**Expected Result:**

- `/ship` reads `loop-state.json`
- Compares `head_commit` in state with `git rev-parse HEAD`
- Detects mismatch (new commit made)
- Blocks ship
- Error message: "Review state is stale. Re-run /review after new commits."
- Exit code: 1 (failure)

**Actual Result:** `[PENDING]`

---

## Output and Reporting

### TC-016: Unified Report Displays All Findings

**Prerequisites:**

- Run `/review --all` with code that triggers findings in multiple loops

**Steps:**

1. Introduce minor lint warning (Loop 1)
2. Introduce major issue for Claude to catch (Loop 2)
3. Ensure CodeRabbit runs (Loop 3)
4. Run `/review --all`
5. Observe final report

**Expected Result:**

- Unified report table displays all findings from all loops
- Findings grouped by severity (critical, major, minor)
- Each finding shows: loop, file, line, message, fix suggestion
- Clear indication of ship gate decision (ALLOWED or BLOCKED)
- Total execution time displayed
- Report is readable and actionable

**Actual Result:** `[PENDING]`

---

### TC-017: Progress Spinners Animate Correctly

**Prerequisites:**

- Terminal supports ANSI escape codes

**Steps:**

1. Run `/review --all`
2. Observe progress indicators during execution

**Expected Result:**

- Spinner displays for each loop while executing
- Spinner shows loop name and status (e.g., "Loop 1 Tier 1: Running...")
- Spinner updates to show completion (e.g., "Loop 1 Tier 1: PASS (15s)")
- Elapsed time shown for each loop
- No visual glitches or broken output

**Actual Result:** `[PENDING]`

---

## Configuration

### TC-018: Config Customization Works

**Prerequisites:**

- Create `.claude/config/review-config.yaml` with custom settings

**Steps:**

1. Create config file with custom timeouts:
   ```yaml
   loop1:
     tier1_timeout: 20 # Reduced from default 30
     tier2_timeout: 90 # Reduced from default 120
   blocking:
     major_blocks_ship: true # Changed from default false
   ```
2. Run `/review --all`

**Expected Result:**

- Loop 1 Tier 1 timeout enforced at 20 seconds (not default 30)
- Loop 1 Tier 2 timeout enforced at 90 seconds (not default 120)
- Major findings now block ship (instead of just warning)
- Config values override embedded defaults
- No errors loading config file

**Actual Result:** `[PENDING]`

---

## Rate Limit Management

### TC-019: Rate Limit State Persists Across Runs

**Prerequisites:**

- Clean rate limit state

**Steps:**

1. Delete rate limit state: `rm .claude/state/rate-limit-state.json`
2. Run `/review --all` (Loop 3 should execute, count: 1)
3. Immediately run `/review --all` again (count: 2)
4. Check state file: `cat .claude/state/rate-limit-state.json`

**Expected Result:**

- First review: Loop 3 executes, state shows 1/8 used
- Second review: Loop 3 executes, state shows 2/8 used
- State file persists between runs
- Hourly bucket correctly calculated
- No quota leakage (count accurate)

**Actual Result:** `[PENDING]`

---

## State Persistence

### TC-020: Atomic Writes Prevent State Corruption

**Prerequisites:**

- Running review system

**Steps:**

1. Start `/review --all`
2. During Loop 2 execution (long-running), kill process (Ctrl+C)
3. Check state files for corruption
4. Restart `/review --all`

**Expected Result:**

- State files either:
  - Contain valid JSON from last completed loop, OR
  - Do not exist (temp file cleaned up)
- No partial writes with invalid JSON
- No `.tmp` files left behind
- Restarted review starts from beginning (no incomplete state)
- System recovers gracefully

**Actual Result:** `[PENDING]`

---

## Advanced Scenarios

### TC-021: Loop 1 Parallel Execution Speedup

**Prerequisites:**

- Measure sequential vs parallel execution

**Steps:**

1. Configure sequential execution:
   ```yaml
   loop1:
     parallel_tier1: false
   ```
2. Run `/review --free` and measure Loop 1 Tier 1 time
3. Configure parallel execution:
   ```yaml
   loop1:
     parallel_tier1: true
   ```
4. Run `/review --free` again and measure Loop 1 Tier 1 time

**Expected Result:**

- Parallel execution reduces Loop 1 Tier 1 time by 40%+ vs sequential
- All checks still execute correctly
- No race conditions or output interleaving issues

**Actual Result:** `[PENDING]`

---

### TC-022: Loop 1 Tier 2 Early Exit on Secrets

**Prerequisites:**

- Introduce secret in code

**Steps:**

1. Add hardcoded secret
2. Run `/review --free`
3. Observe that build and test checks are skipped

**Expected Result:**

- Loop 1 Tier 2: Secrets check runs first
- Secrets check: FAIL (secret detected)
- Build check: SKIPPED (early exit due to secrets failure)
- Test check: SKIPPED (early exit due to secrets failure)
- Total Loop 1 Tier 2 time: <5 seconds (no expensive build/test)

**Actual Result:** `[PENDING]`

---

### TC-023: Secret Scanner False Positive Handling

**Prerequisites:**

- Add fake secret in test fixture or example file

**Steps:**

1. Create `.env.example` with `API_KEY=fake_test_key_1234567890`
2. Run `/review --free`

**Expected Result:**

- Secret scanner ignores `.env.example` files (auto-excluded)
- Loop 1 Tier 2: PASS (secrets check passes)
- No false positive error

**Actual Result:** `[PENDING]`

---

### TC-024: Claude Review with Specs Context

**Prerequisites:**

- Project has spec files in `specs/` directory
- Feature branch with changes related to a spec

**Steps:**

1. Create spec file: `specs/my-feature/requirements.md`
2. Implement code for the feature
3. Run `/review --claude`
4. Check if Claude reviewer mentions spec compliance

**Expected Result:**

- Loop 2 loads spec files from `specs/` matching feature context
- Claude review references spec requirements
- Findings mention spec compliance or deviations
- `claude-review-results.json` shows spec-aware feedback

**Actual Result:** `[PENDING]`

---

### TC-025: Ship Gate with Only Loop 1 (--free Flag)

**Prerequisites:**

- Run review with `--free` flag only

**Steps:**

1. Run `/review --free` (Loop 1 only, passes)
2. Run `/ship`

**Expected Result:**

- Ship gate reads `loop-state.json`
- Only Loop 1 results present in state
- Ship decision based solely on Loop 1 results (no Loop 2/3)
- If Loop 1 passed: Ship ALLOWED
- No error about missing Loop 2/3 results

**Actual Result:** `[PENDING]`

---

### TC-026: Config File Missing Uses Defaults

**Prerequisites:**

- No config file exists

**Steps:**

1. Delete config file: `rm .claude/config/review-config.yaml`
2. Run `/review --all`

**Expected Result:**

- System logs warning: "No config file found, using defaults"
- Review executes with embedded default configuration:
  - Loop 1 tier 1 timeout: 30s
  - Loop 1 tier 2 timeout: 120s
  - Loop 2 enabled: true, model: opus
  - Loop 3 enabled: true, rate limit: 8/hr
  - Critical blocks ship: true, major blocks ship: false
- No errors or crashes

**Actual Result:** `[PENDING]`

---

### TC-027: Multiple Secret Patterns Detected

**Prerequisites:**

- Introduce multiple secret types in code

**Steps:**

1. Add multiple secrets:
   ```javascript
   const apiKey = "EXAMPLE_STRIPE_KEY_REPLACE_ME";
   const awsKey = "AKIAIOSFODNN7EXAMPLE";
   const dbUrl = "postgres://user:pass@host/db";
   ```
2. Run `/review --free`

**Expected Result:**

- Secret scanner detects all 3 secret types
- Loop 1 Tier 2: FAIL
- Error report lists all matched patterns:
  - Generic API Key (line X)
  - AWS Access Key (line Y)
  - Database URL (line Z)
- Each match shows file, line, pattern name, severity

**Actual Result:** `[PENDING]`

---

### TC-028: Ship Allowed After Fixing Critical Issues

**Prerequisites:**

- Previously blocked ship due to critical issues

**Steps:**

1. Run `/review --all` with critical issue (blocks ship)
2. Fix critical issue
3. Run `/review --all` again
4. Run `/ship`

**Expected Result:**

- First review: Ship BLOCKED (`ship_allowed: false`)
- Second review: Ship ALLOWED (`ship_allowed: true`)
- `/ship` succeeds without blocking
- State file updated with new head_commit
- Blockers list cleared in state

**Actual Result:** `[PENDING]`

---

### TC-029: CodeRabbit Adds New Issues After Claude Pass

**Prerequisites:**

- Code that passes Claude review but CodeRabbit finds issues

**Steps:**

1. Add code with subtle issue Claude misses but CodeRabbit catches
2. Run `/review --all`
3. Observe Loop 3 findings

**Expected Result:**

- Loop 1: PASS
- Loop 2: PASS (Claude finds no critical issues)
- Loop 3: Runs and finds new issues
- Unified report combines Claude + CodeRabbit findings
- Ship decision based on config `block_on_new_issues`:
  - If `false` (default): WARN but ALLOW ship
  - If `true`: BLOCK ship

**Actual Result:** `[PENDING]`

---

### TC-030: Log Files Created and Contain Details

**Prerequisites:**

- Config has `save_logs: true`

**Steps:**

1. Run `/review --all`
2. Check logs directory: `ls .claude/logs/`
3. Open most recent log file

**Expected Result:**

- Log file created: `.claude/logs/review-{timestamp}.log`
- Log contains timestamped entries for each loop
- Log shows start/end times, durations, results
- Log includes error details if any failures occurred
- Log format is human-readable

**Actual Result:** `[PENDING]`

---

## Summary Template

After executing all test cases, fill in this summary:

```
Total Tests: 30
Passed: __
Failed: __
Skipped: __
Pending: __

Pass Rate: __%

Critical Failures: [List TC-XXX that must be fixed]
Minor Issues: [List TC-XXX that are nice-to-fix]
```

---

**Testing Checklist Version:** 1.0
**Last Updated:** 2026-01-28
**Spec Version:** 4-loop-review-system v1.0
**Tester:** \***\*\_\*\***
**Test Date:** \***\*\_\*\***
