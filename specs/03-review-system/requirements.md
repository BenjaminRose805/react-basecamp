# Requirements: 4-Loop Code Review System

> **Status:** Completed
> **Created:** 2026-01-28
> **Consolidated:** 2026-01-28

## Overview

This consolidated specification covers the complete 4-loop progressive code review system, including fast free checks, Claude Opus reviewer, rate-limited CodeRabbit CLI, async PR review, and proper integration with command workflows. All requirements from the following specs have been merged and completed:

- 4-loop-review-system (Core 4-loop architecture and implementation)
- review-system-integration (Preview/confirmation, delegation patterns, ship gate)
- local-code-review (CodeRabbit CLI integration and rate limiting)

---

## System Purpose

Provide fast, comprehensive, cost-effective code quality gates before commits and PRs through a layered validation strategy that balances speed, thoroughness, and resource usage.

---

## Core Requirements

### Loop 1: Fast Free Mechanical Checks (Tier 1+2) ✓ COMPLETED

**Loop 1 Tier 1 (<30s): Parallel Fast Checks**

- **REQ-L1-T1-001:** THE SYSTEM SHALL execute lint, typecheck, and format checks in parallel in under 30 seconds.
- **REQ-L1-T1-002:** WHEN any tier 1 check fails, THE SYSTEM SHALL block progression to tier 2 and display specific failure details.
- **REQ-L1-T1-003:** THE SYSTEM SHALL run checks in parallel to minimize total execution time (40%+ reduction vs sequential).

**Loop 1 Tier 2 (<2min): Sequential Deeper Checks**

- **REQ-L1-T2-001:** WHEN tier 1 passes, THE SYSTEM SHALL execute secrets scan, build, and unit tests in under 2 minutes.
- **REQ-L1-T2-002:** THE SYSTEM SHALL scan for 7 secret patterns: API keys, private keys, AWS credentials, GitHub tokens, database URLs, JWT secrets, OAuth secrets.
- **REQ-L1-T2-003:** WHEN secrets are detected, THE SYSTEM SHALL halt immediately and display matched patterns with file locations (redacted).
- **REQ-L1-T2-004:** WHEN tier 2 fails, THE SYSTEM SHALL block ship operations and log failure to loop state.
- **REQ-L1-T2-005:** THE SYSTEM SHALL execute tier 2 checks sequentially with early exit on first failure (fail-fast).

**Acceptance Criteria:**

- Tier 1 completes in <30s on typical codebase (up to 50k LOC)
- Tier 2 completes in <2min on typical build
- Secrets scanner has zero false negatives on 7 patterns
- Build/test failures show actionable error context
- Loop state reflects tier 1+2 combined status

---

### Loop 2: Claude Opus Reviewer Agent ✓ COMPLETED

**REQ-L2-001:** WHEN tier 1+2 pass, THE SYSTEM SHALL spawn a Claude Opus sub-agent with fresh context and reviewer persona.

**REQ-L2-002:** THE Claude reviewer SHALL analyze:

- Code quality (complexity, readability, maintainability)
- Architecture patterns (separation of concerns, SOLID principles)
- Security issues (input validation, auth checks, data exposure)
- Test coverage (edge cases, integration points)
- Documentation completeness (JSDoc, README, inline comments)

**REQ-L2-003:** THE SYSTEM SHALL provide the Claude reviewer with:

- Git diff context (staged changes)
- File tree for changed directories
- Recent commits (last 5)
- Spec files matching feature name (if available)

**REQ-L2-004:** WHEN Claude review completes, THE SYSTEM SHALL save results to `claude-review-results.json` with findings categorized by severity (critical/major/minor).

**REQ-L2-005:** WHEN Claude finds critical issues, THE SYSTEM SHALL block ship operations.

**REQ-L2-006:** THE SYSTEM SHALL spawn Claude reviewer using Task tool (not execSync).

**Acceptance Criteria:**

- Opus agent uses >95% different tokens than parent session (isolated context)
- Reviewer persona enforces patterns from `.claude/docs/`
- Results include actionable fixes for each finding
- Critical findings auto-block with clear resolution path
- Claude review completes in <3min for diffs up to 2000 lines

---

### Loop 3: CodeRabbit CLI (Rate-Limited) ✓ COMPLETED

**REQ-L3-001:** WHEN Loop 2 passes and rate limit allows, THE SYSTEM SHALL run CodeRabbit CLI as second opinion.

**REQ-L3-002:** THE SYSTEM SHALL track CodeRabbit usage with 2-8 reviews/hour limit in `rate-limit-state.json`.

**REQ-L3-003:** WHEN rate limit is exceeded, THE SYSTEM SHALL skip Loop 3 and proceed to ship decision.

**REQ-L3-004:** WHEN CodeRabbit is skipped, THE SYSTEM SHALL log skip reason and display warning to user.

**REQ-L3-005:** WHEN CodeRabbit finds new issues not caught by Claude, THE SYSTEM SHALL append to review results and optionally block ship (configurable).

**REQ-L3-006:** THE SYSTEM SHALL use hourly bucket tracking for rate limits (cleanup old buckets after 2 hours).

**Acceptance Criteria:**

- Rate limit tracker persists across sessions
- Skipped runs don't consume quota
- CodeRabbit results merged with Claude results
- User sees unified findings report
- Loop 3 completes in <3min when executed

---

### Loop 4: Async PR Review (Safety Net) ✓ COMPLETED

**REQ-L4-001:** WHEN a PR is created, THE SYSTEM SHALL enable asynchronous CodeRabbit PR review.

**REQ-L4-002:** WHEN PR review finds issues, THE SYSTEM SHALL support `/reconcile --source pr` to fetch and apply feedback.

**REQ-L4-003:** THE reconcile operation SHALL loop PR feedback back to Loop 1 for re-validation.

**Acceptance Criteria:**

- PR reviews run async without blocking merge
- Reconcile fetches PR comments and inline suggestions
- Fixed issues re-enter Loop 1 for full validation

---

## Integration Requirements

### Preview and Confirmation Flow ✓ COMPLETED

**REQ-PREVIEW-001:** WHEN user runs `/review`, THE SYSTEM SHALL show a preview of planned review execution before proceeding.

**REQ-PREVIEW-002:** THE preview SHALL display:

- Which loops will execute (1-4)
- Scope (files/patterns to review)
- Resource requirements (sub-agent count, model tier)
- Estimated time

**REQ-PREVIEW-003:** THE SYSTEM SHALL wait for user confirmation before executing any loops.

**REQ-PREVIEW-004:** THE user MAY cancel before execution begins.

---

### Agent Delegation Pattern ✓ COMPLETED

**REQ-DELEGATE-001:** WHEN `/review` executes, THE SYSTEM SHALL delegate to sub-agents via Task tool, NOT execute loops directly using execSync.

**REQ-DELEGATE-002:** THE hook SHALL use logContext() to inject review context only (no business logic execution).

**REQ-DELEGATE-003:** THE command file SHALL handle preview/confirmation logic.

**REQ-DELEGATE-004:** THE command SHALL spawn sub-agents using Task tool for each loop.

**REQ-DELEGATE-005:** THE pattern SHALL follow user-prompt-start.cjs (context injection only, no direct execution).

---

### Ship Gate Enforcement ✓ COMPLETED

**REQ-SHIP-001:** WHEN user runs `/ship`, THE SYSTEM SHALL check `loop-state.json` for `ship_allowed` flag before proceeding.

**REQ-SHIP-002:** THE ship hook SHALL verify `ship_allowed === true` before git operations.

**REQ-SHIP-003:** THE ship hook SHALL run before `/ship` command execution.

**REQ-SHIP-004:** THE ship hook SHALL be registered in `.claude/settings.json`.

**REQ-SHIP-005:** WHEN `ship_allowed === false`, THE SYSTEM SHALL:

- Block /ship command execution
- Display "Ship gate: BLOCKED" message
- Show which loop failed
- Display blocker summary from state file
- Suggest running /review to resolve issues

---

### Stale State Detection ✓ COMPLETED

**REQ-STALE-001:** WHEN `loop-state.json` `head_commit` differs from current HEAD, THE SYSTEM SHALL warn about stale review state.

**REQ-STALE-002:** THE ship hook SHALL compare `state.head_commit` to `git rev-parse HEAD`.

**REQ-STALE-003:** THE warning SHALL include both commit hashes for comparison.

**REQ-STALE-004:** THE SYSTEM SHALL block ship when state is stale.

**REQ-STALE-005:** THE user SHALL be prompted to run `/review` on current HEAD.

---

## State Management

### Loop State Persistence ✓ COMPLETED

**REQ-STATE-001:** THE SYSTEM SHALL persist loop state to `.claude/state/loop-state.json` with schema:

```json
{
  "version": "1.0",
  "branch": "feature/xyz",
  "head_commit": "abc123",
  "timestamp": "ISO8601",
  "loops": {
    "loop1_tier1": { "status": "pass|fail", "timestamp": "ISO8601", "details": {} },
    "loop1_tier2": { "status": "pass|fail", "timestamp": "ISO8601", "details": {} },
    "loop2_claude": { "status": "pass|fail|skip", "timestamp": "ISO8601", "findings": [] },
    "loop3_coderabbit": { "status": "pass|fail|skip", "timestamp": "ISO8601", "findings": [] }
  },
  "ship_allowed": true|false,
  "blockers": []
}
```

**REQ-STATE-002:** THE SYSTEM SHALL invalidate loop state when new commits are made to the current branch.

**REQ-STATE-003:** THE SYSTEM SHALL persist rate limit state to `.claude/state/rate-limit-state.json` with hourly bucket tracking.

**REQ-STATE-004:** THE SYSTEM SHALL use atomic writes to prevent state corruption on interrupt.

---

## Configuration

### Review Configuration ✓ COMPLETED

**REQ-CONFIG-001:** THE SYSTEM SHALL read configuration from `.claude/config/review-config.yaml` with defaults:

```yaml
loop1:
  tier1_timeout: 30
  tier2_timeout: 120
  parallel: true
  fail_fast: true

loop2:
  model: opus
  enable_claude: true
  spawn_fresh_context: true

loop3:
  enable_coderabbit: true
  rate_limit: 8 # per hour
  skip_on_limit: true
  block_on_new_issues: false

blocking:
  critical_blocks_ship: true
  major_blocks_ship: false
  secrets_block_ship: true
  build_failure_blocks_ship: true
  test_failure_blocks_ship: true
```

**REQ-CONFIG-002:** WHEN configuration file is missing, THE SYSTEM SHALL use embedded defaults and log warning.

---

## Command Line Interface

### /review Flags ✓ COMPLETED

**REQ-CLI-001:** THE `/review` command SHALL support flags:

- `--free` (run Loop 1 only: fast mechanical checks)
- `--claude` (run Loop 1+2: add Claude Opus reviewer)
- `--skip-cr` (skip Loop 3 even if rate allows)
- `--all` (run all loops, default)

**REQ-CLI-002:** THE `/review` command SHALL display loop progress with spinners and elapsed time per loop.

**REQ-CLI-003:** WHEN all loops complete, THE SYSTEM SHALL display unified findings table.

---

### /reconcile Integration ✓ COMPLETED

**REQ-CLI-004:** THE `/reconcile` command SHALL support sources:

- `--source claude` (from claude-review-results.json)
- `--source local` (from loop-state.json combined)
- `--source pr` (from GitHub PR review comments)
- Auto-detect if no source specified

**REQ-CLI-005:** THE `/reconcile` command SHALL parse CodeRabbit comments and create fix tasks in `specs/pr-{N}-reconciliation/tasks.md`.

---

### /ship Integration ✓ COMPLETED

**REQ-CLI-006:** THE `/ship` command SHALL read `loop-state.json` and block if `ship_allowed: false`.

**REQ-CLI-007:** THE `/ship` command SHALL display resolution instructions for blocking issues.

---

## Output and Reporting

### Unified Findings Report ✓ COMPLETED

**REQ-OUTPUT-001:** THE SYSTEM SHALL display loop progress with spinners and elapsed time per loop.

**REQ-OUTPUT-002:** WHEN all loops complete, THE SYSTEM SHALL display unified findings table:

```
┌─────────┬──────────┬──────────────────────────────────┐
│ Loop    │ Severity │ Finding                          │
├─────────┼──────────┼──────────────────────────────────┤
│ Loop 1  │ Error    │ ESLint: no-unused-vars (3 files) │
│ Loop 2  │ Critical │ Unvalidated user input (auth.ts) │
│ Loop 3  │ Major    │ Missing error boundary (App.tsx) │
└─────────┴──────────┴──────────────────────────────────┘
```

**REQ-OUTPUT-003:** WHEN ship is blocked, THE SYSTEM SHALL display resolution instructions for blocking issues.

**REQ-OUTPUT-004:** THE SYSTEM SHALL save detailed logs to `.claude/logs/review-{timestamp}.log`.

---

## Non-Functional Requirements

### Performance ✓ ACHIEVED

- **NFR-PERF-001:** Loop 1 tier 1 completes in <30s for codebases up to 50k LOC
- **NFR-PERF-002:** Loop 1 tier 2 completes in <2min for codebases up to 50k LOC
- **NFR-PERF-003:** Loop 2 Claude review completes in <3min for diffs up to 2000 lines
- **NFR-PERF-004:** Ship gate check completes in <100ms
- **NFR-PERF-005:** Hook execution overhead is <50ms

### Reliability ✓ ACHIEVED

- **NFR-RELIABLE-001:** THE SYSTEM SHALL gracefully handle tool failures (missing pnpm scripts, CodeRabbit API errors)
- **NFR-RELIABLE-002:** State files SHALL use atomic writes to prevent corruption
- **NFR-RELIABLE-003:** Missing loop-state.json SHALL be treated as ship_allowed=false
- **NFR-RELIABLE-004:** Corrupted state file SHALL block ship with clear error

### Maintainability ✓ ACHIEVED

- **NFR-MAINTAIN-001:** All loops SHALL log execution details to `.claude/logs/review-{timestamp}.log`
- **NFR-MAINTAIN-002:** State file schema SHALL be documented in code-review/SKILL.md
- **NFR-MAINTAIN-003:** Hook registration SHALL be centralized in settings.json
- **NFR-MAINTAIN-004:** Error messages SHALL reference relevant documentation

---

## Constraints

1. **CONSTRAINT-001:** Loop 3 CodeRabbit usage is hard-capped at 8 reviews/hour (API limit)
2. **CONSTRAINT-002:** Loop 2 Claude review requires active Anthropic API subscription
3. **CONSTRAINT-003:** All loops must respect existing git state (staged vs unstaged changes)
4. **CONSTRAINT-004:** System must not modify user code without explicit `/reconcile` command
5. **CONSTRAINT-005:** Must maintain backward compatibility with existing /review invocations
6. **CONSTRAINT-006:** State file location: `.claude/state/loop-state.json`
7. **CONSTRAINT-007:** Hook location: `.claude/scripts/hooks/`

---

## Assumptions

1. **ASSUME-001:** User has pnpm installed with configured lint/typecheck/test scripts
2. **ASSUME-002:** CodeRabbit CLI is configured with valid credentials (optional)
3. **ASSUME-003:** Claude Code CLI has Opus model access
4. **ASSUME-004:** Codebase uses git for version control
5. **ASSUME-005:** User understands preview/confirmation flow

---

## Dependencies

All dependencies satisfied:

| Dependency                          | Type     | Status   |
| ----------------------------------- | -------- | -------- |
| Task tool (Claude Code built-in)    | Internal | Ready    |
| Sub-agent infrastructure            | Internal | Complete |
| pnpm/npm/yarn/bun                   | External | Ready    |
| CodeRabbit CLI (optional)           | External | Ready    |
| GitHub CLI (gh, optional)           | External | Ready    |
| Git 2.0+                            | External | Ready    |
| `.claude/config/review-config.yaml` | Internal | Complete |
| `.claude/scripts/lib/` libraries    | Internal | Complete |
| Hooks system                        | Internal | Ready    |

---

## Out of Scope

- Automatic code fixes without user approval
- Integration with external monitoring tools (Sentry, DataDog)
- Custom review rules beyond configuration file
- Parallel execution within loops (loops run sequentially)
- Cross-repository review coordination
- Review state synchronization across team members

---

**Status:** All requirements implemented and verified.
**Achievement:** 4-loop progressive validation, <3min total execution, proper delegation, ship gate enforcement.
