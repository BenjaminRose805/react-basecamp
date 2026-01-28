# Requirements Specification: 4-Loop Review System

## 1. Overview

This document specifies the requirements for a layered code review system that replaces single-tool CodeRabbit checks with a 4-loop progressive validation strategy.

**Purpose:** Provide fast, comprehensive, cost-effective code quality gates before commits and PRs.

**Scope:** `.claude/scripts/hooks/`, `.claude/commands/`, `.claude/skills/code-review/`, `.claude/config/`

## 2. Functional Requirements

### 2.1 Loop 1: Fast Free Mechanical Checks (Tier 1)

**REQ-L1-T1-001:** When a user runs `/review`, the system shall execute tier 1 checks (lint, typecheck, format) in under 30 seconds.

**REQ-L1-T1-002:** When any tier 1 check fails, the system shall block progression to tier 2 and display specific failure details.

**REQ-L1-T1-003:** While executing tier 1 checks, the system shall run checks in parallel to minimize total execution time.

**Acceptance Criteria:**

- All 3 checks complete in <30s on typical codebase
- Failures show exact file, line, rule violated
- Parallel execution reduces time by 40%+ vs sequential

### 2.2 Loop 1: Free Mechanical Checks (Tier 2)

**REQ-L1-T2-001:** When tier 1 passes, the system shall execute tier 2 checks (secrets scan, build, unit tests) in under 2 minutes.

**REQ-L1-T2-002:** The system shall scan for 7 secret patterns: API keys, private keys, AWS credentials, GitHub tokens, database URLs, JWT secrets, OAuth secrets.

**REQ-L1-T2-003:** When secrets are detected, the system shall halt immediately and display matched patterns with file locations.

**REQ-L1-T2-004:** When tier 2 fails, the system shall block ship operations and log failure to loop state.

**Acceptance Criteria:**

- Tier 2 completes in <2min on typical build
- Secrets scanner has zero false negatives on 7 patterns
- Build/test failures show actionable error context
- Loop state reflects tier 1+2 combined status

### 2.3 Loop 2: Claude Opus Reviewer Agent

**REQ-L2-001:** When tier 1+2 pass, the system shall spawn a Claude Opus sub-agent with fresh context and reviewer persona.

**REQ-L2-002:** The Claude reviewer shall analyze: code quality, architecture patterns, security issues, test coverage, documentation completeness.

**REQ-L2-003:** The system shall provide the Claude reviewer with: diff context, file tree, recent commits, spec files (if available).

**REQ-L2-004:** When Claude review completes, the system shall save results to `claude-review-results.json` with findings categorized by severity (critical/major/minor).

**REQ-L2-005:** When Claude finds critical issues, the system shall block ship operations.

**Acceptance Criteria:**

- Opus agent uses >95% different tokens than parent session
- Reviewer persona enforces patterns from `.claude/docs/`
- Results include actionable fixes for each finding
- Critical findings auto-block with clear resolution path

### 2.4 Loop 3: CodeRabbit CLI (Rate-Limited Fallback)

**REQ-L3-001:** When Loop 2 passes and rate limit allows, the system shall run CodeRabbit CLI as second opinion.

**REQ-L3-002:** The system shall track CodeRabbit usage (2-8 reviews/hour limit) in `rate-limit-state.json`.

**REQ-L3-003:** When rate limit is exceeded, the system shall skip Loop 3 and proceed to ship.

**REQ-L3-004:** When CodeRabbit is skipped, the system shall log skip reason and display warning to user.

**REQ-L3-005:** When CodeRabbit finds new issues not caught by Claude, the system shall append to review results and optionally block ship.

**Acceptance Criteria:**

- Rate limit tracker persists across sessions
- Skipped runs don't consume quota
- CodeRabbit results merged with Claude results
- User sees unified findings report

### 2.5 Loop 4: Async PR Review (Safety Net)

**REQ-L4-001:** When a PR is created, the system shall enable asynchronous CodeRabbit PR review.

**REQ-L4-002:** When PR review finds issues, the system shall support `/reconcile --source pr` to fetch and apply feedback.

**REQ-L4-003:** The reconcile operation shall loop PR feedback back to Loop 1 for re-validation.

**Acceptance Criteria:**

- PR reviews run async without blocking merge
- Reconcile fetches PR comments and inline suggestions
- Fixed issues re-enter Loop 1 for full validation

## 3. Cross-Cutting Requirements

### 3.1 State Management

**REQ-STATE-001:** The system shall persist loop state to `.claude/state/loop-state.json` with schema:

```json
{
  "loop1_tier1": { "status": "pass|fail", "timestamp": "ISO8601", "details": {} },
  "loop1_tier2": { "status": "pass|fail", "timestamp": "ISO8601", "details": {} },
  "loop2_claude": { "status": "pass|fail|skip", "timestamp": "ISO8601", "findings": [] },
  "loop3_coderabbit": { "status": "pass|fail|skip", "timestamp": "ISO8601", "findings": [] },
  "ship_allowed": true|false
}
```

**REQ-STATE-002:** The system shall invalidate loop state when new commits are made to the current branch.

**REQ-STATE-003:** The system shall persist rate limit state to `.claude/state/rate-limit-state.json` with hourly bucket tracking.

### 3.2 Configuration

**REQ-CONFIG-001:** The system shall read configuration from `.claude/config/review-config.yaml` with defaults:

```yaml
loop1:
  tier1_timeout: 30
  tier2_timeout: 120
  parallel: true
loop2:
  model: opus
  enable_claude: true
loop3:
  enable_coderabbit: true
  rate_limit: 8 # per hour
  skip_on_limit: true
  block_on_new_issues: false
blocking:
  critical_blocks_ship: true
  major_blocks_ship: false
```

**REQ-CONFIG-002:** When configuration file is missing, the system shall use embedded defaults and log warning.

### 3.3 Command Line Interface

**REQ-CLI-001:** The `/review` command shall support flags:

- `--free` (run Loop 1 only)
- `--claude` (run Loop 1+2)
- `--skip-cr` (skip Loop 3 even if rate allows)
- `--all` (run all loops, default)

**REQ-CLI-002:** The `/reconcile` command shall support sources:

- `--source claude` (from claude-review-results.json)
- `--source local` (from loop-state.json combined)
- `--source pr` (from GitHub PR review comments)
- Auto-detect if no source specified

**REQ-CLI-003:** The `/ship` command shall read `loop-state.json` and block if `ship_allowed: false`.

### 3.4 Output & Reporting

**REQ-OUTPUT-001:** The system shall display loop progress with spinners and elapsed time per loop.

**REQ-OUTPUT-002:** When all loops complete, the system shall display unified findings table:

```
┌─────────┬──────────┬──────────────────────────────────┐
│ Loop    │ Severity │ Finding                          │
├─────────┼──────────┼──────────────────────────────────┤
│ Loop 1  │ Error    │ ESLint: no-unused-vars (3 files) │
│ Loop 2  │ Critical │ Unvalidated user input (auth.ts) │
│ Loop 3  │ Major    │ Missing error boundary (App.tsx) │
└─────────┴──────────┴──────────────────────────────────┘
```

**REQ-OUTPUT-003:** When ship is blocked, the system shall display resolution instructions for blocking issues.

## 4. Non-Functional Requirements

**REQ-PERF-001:** Loop 1 tier 1 shall complete in <30s for codebases up to 50k LOC.

**REQ-PERF-002:** Loop 1 tier 2 shall complete in <2min for codebases up to 50k LOC.

**REQ-PERF-003:** Loop 2 Claude review shall complete in <3min for diffs up to 2000 lines.

**REQ-RELIABLE-001:** The system shall gracefully handle tool failures (missing pnpm scripts, CodeRabbit API errors) and continue to next loop.

**REQ-RELIABLE-002:** State files shall use atomic writes to prevent corruption on interrupt.

**REQ-MAINTAIN-001:** All loops shall log execution details to `.claude/logs/review-{timestamp}.log` for debugging.

## 5. Constraints

**CONSTRAINT-001:** Loop 3 CodeRabbit usage is hard-capped at 8 reviews/hour (API limit).

**CONSTRAINT-002:** Loop 2 Claude review requires active Anthropic API subscription (unlimited usage).

**CONSTRAINT-003:** All loops must respect existing git state (staged vs unstaged changes).

**CONSTRAINT-004:** System must not modify user code without explicit `/reconcile` command.

## 6. Assumptions

**ASSUME-001:** User has pnpm installed with configured lint/typecheck/test scripts.

**ASSUME-002:** CodeRabbit CLI is configured with valid credentials.

**ASSUME-003:** Claude Code CLI has Opus model access.

**ASSUME-004:** Codebase uses git for version control.

## 7. Traceability Matrix

| Requirement    | Design Section | Test Case     | Implementation File    |
| -------------- | -------------- | ------------- | ---------------------- |
| REQ-L1-T1-001  | 3.2.1          | TC-L1-001     | free-checks.cjs        |
| REQ-L1-T2-002  | 3.2.2          | TC-L1-002     | secret-scanner.cjs     |
| REQ-L2-001     | 3.3            | TC-L2-001     | claude-reviewer.cjs    |
| REQ-L3-001     | 3.4            | TC-L3-001     | loop-controller.cjs    |
| REQ-STATE-001  | 3.1            | TC-STATE-001  | loop-controller.cjs    |
| REQ-CONFIG-001 | 3.1            | TC-CONFIG-001 | review-config.yaml     |
| REQ-CLI-001    | 4.1            | TC-CLI-001    | user-prompt-review.cjs |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Draft
