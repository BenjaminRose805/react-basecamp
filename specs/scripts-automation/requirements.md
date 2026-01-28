# Scripts Automation Requirements

## Overview

This document defines requirements for the scripts automation system using EARS (Easy Approach to Requirements Syntax) format. The system provides 31 reusable scripts organized into 7 categories, plus 4 shared library utilities.

---

## 1. Library Utilities

### 1.1 Git Utilities (git-utils.cjs)

**REQ-LIB-001**: When executing any git command, the system shall use `git-utils.cjs` wrapper functions to ensure consistent error handling and output parsing.

**REQ-LIB-002**: The git utilities shall provide these functions:

- `execGit(args)` - Execute git command with parsed output
- `getCurrentBranch()` - Return current branch name
- `getRemoteUrl()` - Return origin remote URL
- `parseStatus()` - Return structured status object
- `parseDiff(options)` - Return structured diff object

**REQ-LIB-003**: When a git command fails, the system shall return `{ success: false, error: string, exitCode: number }`.

### 1.2 Check Utilities (check-utils.cjs)

**REQ-LIB-004**: When parsing test output, the system shall extract pass/fail counts, duration, and failure details into structured JSON.

**REQ-LIB-005**: When parsing lint output, the system shall extract error/warning counts by rule and file location.

**REQ-LIB-006**: The check utilities shall provide these functions:

- `parseVitestOutput(output)` - Parse Vitest JSON output
- `parseEslintOutput(output)` - Parse ESLint JSON output
- `parseTscOutput(output)` - Parse TypeScript compiler output
- `aggregateResults(results[])` - Combine multiple check results

### 1.3 State Utilities (state-utils.cjs)

**REQ-LIB-007**: When reading/writing state files, the system shall use atomic file operations to prevent corruption.

**REQ-LIB-008**: The state utilities shall provide these functions:

- `readState(filename)` - Read and parse JSON state file
- `writeState(filename, data)` - Write JSON state atomically
- `updateState(filename, updates)` - Merge updates into existing state
- `clearState(filename)` - Remove state file

**REQ-LIB-009**: State files shall be stored in `.claude/state/` directory with `.json` extension.

### 1.4 ASCII Utilities (ascii-utils.cjs)

**REQ-LIB-010**: When rendering preview boxes, the system shall use consistent box-drawing characters and alignment.

**REQ-LIB-011**: The ASCII utilities shall provide these functions:

- `box(title, content, options)` - Render bordered box
- `table(headers, rows)` - Render ASCII table
- `progress(current, total, label)` - Render progress bar
- `tree(items)` - Render tree structure

---

## 2. Git Scripts

### 2.1 Branch Creation (git/create-branch.cjs)

**REQ-GIT-001**: When creating a branch, the system shall sync with upstream main before creating the new branch.

**REQ-GIT-002**: The system shall validate branch names against pattern: `^(feature|fix|chore|docs)/[a-z0-9-]+$`.

**REQ-GIT-003**: When branch creation succeeds, the system shall output:

```json
{ "success": true, "branch": "feature/name", "basedOn": "main" }
```

### 2.2 Status (git/get-status.cjs)

**REQ-GIT-004**: When queried, the system shall return parsed git status as:

```json
{
  "branch": "string",
  "ahead": 0,
  "behind": 0,
  "staged": ["file1"],
  "unstaged": ["file2"],
  "untracked": ["file3"],
  "clean": false
}
```

### 2.3 Commit Preparation (git/prepare-commit.cjs)

**REQ-GIT-005**: When preparing a commit, the system shall analyze staged changes and suggest conventional commit message.

**REQ-GIT-006**: The system shall detect commit type from file paths:

- `src/` changes → `feat:` or `fix:`
- `test/` changes → `test:`
- `docs/` or `*.md` → `docs:`
- Config files → `chore:`

### 2.4 PR Creation (git/create-pr.cjs)

**REQ-GIT-007**: When creating a PR, the system shall validate:

- Branch is pushed to origin
- Branch has commits ahead of base
- No merge conflicts with base

**REQ-GIT-008**: The system shall use `gh pr create` with structured title/body.

### 2.5 PR Comments (git/get-pr-comments.cjs)

**REQ-GIT-009**: When fetching PR comments, the system shall unify:

- GitHub review comments
- CodeRabbit review comments
- General PR comments

**REQ-GIT-010**: Output format shall be:

```json
{
  "comments": [
    {
      "author": "string",
      "body": "string",
      "path": "file",
      "line": 10,
      "type": "review|coderabbit|general"
    }
  ]
}
```

### 2.6 CI Polling (git/poll-ci.cjs)

**REQ-GIT-011**: When polling CI, the system shall check GitHub Actions status with configurable timeout (default: 10 minutes).

**REQ-GIT-012**: The system shall return:

```json
{ "status": "pending|success|failure", "checks": [], "duration": 120 }
```

### 2.7 Sync Main (git/sync-main.cjs)

**REQ-GIT-013**: When syncing with main, the system shall:

1. Fetch origin/main
2. Attempt rebase (preferred) or merge
3. Report conflicts if any

### 2.8 Cleanup Branches (git/cleanup-branches.cjs)

**REQ-GIT-014**: When cleaning up, the system shall only delete branches that are fully merged into main.

**REQ-GIT-015**: The system shall never delete `main`, `master`, or `develop` branches.

---

## 3. Check Scripts

### 3.1 QA Suite (check/run-qa-suite.cjs)

**REQ-CHK-001**: When running QA, the system shall execute in order:

1. TypeScript type checking
2. ESLint linting
3. Unit tests (Vitest)
4. Build verification

**REQ-CHK-002**: The system shall aggregate results as:

```json
{
  "passed": true,
  "duration": 45000,
  "results": {
    "typecheck": { "passed": true, "errors": 0 },
    "lint": { "passed": true, "errors": 0, "warnings": 2 },
    "test": { "passed": true, "total": 50, "passed": 50 },
    "build": { "passed": true }
  }
}
```

### 3.2 Security Scan (check/security-scan.cjs)

**REQ-CHK-003**: When scanning for security issues, the system shall check:

- `pnpm audit` for dependency vulnerabilities
- Hardcoded secrets patterns in code
- Unsafe patterns (eval, dangerouslySetInnerHTML)

### 3.3 Coverage Check (check/coverage-check.cjs)

**REQ-CHK-004**: When checking coverage, the system shall parse Vitest coverage output and compare against thresholds.

**REQ-CHK-005**: Default thresholds shall be: lines=80%, branches=70%, functions=80%.

### 3.4 Find Tests (check/find-tests.cjs)

**REQ-CHK-006**: When discovering tests, the system shall find all `*.test.ts`, `*.test.tsx`, `*.spec.ts` files.

**REQ-CHK-007**: The system shall return tests grouped by directory with metadata.

---

## 4. Research Scripts

### 4.1 Find Implementations (research/find-implementations.cjs)

**REQ-RES-001**: When searching for implementations, the system shall search by:

- Function/class name
- File pattern
- Import statement

### 4.2 Find Patterns (research/find-patterns.cjs)

**REQ-RES-002**: When discovering patterns, the system shall support modes:

- `hook` - Find React hook patterns
- `component` - Find component patterns
- `api` - Find API route patterns
- `test` - Find test patterns

### 4.3 Query Specs (research/query-specs.cjs)

**REQ-RES-003**: When querying specs, the system shall return:

```json
{
  "specs": [
    {
      "name": "feature",
      "status": "approved|draft|implementing",
      "path": "specs/feature/"
    }
  ]
}
```

### 4.4 Analyze Dependencies (research/analyze-dependencies.cjs)

**REQ-RES-004**: When analyzing dependencies, the system shall report:

- Direct dependencies and versions
- Outdated packages
- Unused dependencies
- Duplicate packages

---

## 5. State Scripts

### 5.1 Loop State (state/loop-state.cjs)

**REQ-STA-001**: When managing loop state, the system shall track:

- Current loop number (1-4)
- Findings per loop
- Resolution status

### 5.2 Review Results (state/review-results.cjs)

**REQ-STA-002**: When aggregating reviews, the system shall combine findings from:

- Fast checks (loop 1)
- Deep checks (loop 2)
- CodeRabbit (loop 3)
- Manual review (loop 4)

### 5.3 Session Context (state/session-context.cjs)

**REQ-STA-003**: When managing session, the system shall persist:

- Current feature/spec
- Active branch
- Pending tasks
- Last command

---

## 6. Preview Scripts

### 6.1 Generate Preview (preview/generate.cjs)

**REQ-PRV-001**: When generating preview, the system shall render ASCII box with:

- Title bar
- Structured content sections
- Action buttons/options

### 6.2 Templates (preview/templates.cjs)

**REQ-PRV-002**: The system shall provide templates for:

- Commit preview
- PR preview
- QA results
- Review findings

### 6.3 Progress Display (preview/progress.cjs)

**REQ-PRV-003**: When displaying progress, the system shall show:

- Current stage name
- Progress bar (if known)
- Elapsed time
- Status indicators

---

## 7. CodeRabbit Scripts

### 7.1 Local Review (coderabbit/run-local.cjs)

**REQ-CR-001**: When running local review, the system shall:

1. Check rate limit state
2. Execute `coderabbit review` CLI
3. Update rate limit state
4. Parse and return findings

**REQ-CR-002**: The system shall respect rate limits: max 5 reviews per hour.

### 7.2 Fetch PR Review (coderabbit/fetch-pr-review.cjs)

**REQ-CR-003**: When fetching PR review, the system shall get CodeRabbit comments from GitHub PR.

### 7.3 Parse Findings (coderabbit/parse-findings.cjs)

**REQ-CR-004**: When parsing, the system shall categorize findings:

- `critical` - Must fix before merge
- `warning` - Should fix
- `suggestion` - Nice to have
- `nitpick` - Style/preference

### 7.4 Format Report (coderabbit/format-report.cjs)

**REQ-CR-005**: When formatting, the system shall output Markdown report grouped by severity.

### 7.5 Rate Limit (coderabbit/rate-limit.cjs)

**REQ-CR-006**: When checking rate limit, the system shall return:

```json
{ "allowed": true, "remaining": 3, "resetsAt": "ISO timestamp" }
```

---

## 8. Review Scripts

### 8.1 Unified Review (review/unified-review.cjs)

**REQ-REV-001**: When orchestrating review, the system shall execute 4-loop system:

1. Loop 1 Tier 1: Fast automated checks
2. Loop 1 Tier 2: Deep automated checks
3. Loop 2: CodeRabbit review
4. Loop 3: LLM self-review
5. Loop 4: Final validation

**REQ-REV-002**: The system shall exit early if critical issues found in any loop.

### 8.2 Loop 1 Fast (review/loop1-fast.cjs)

**REQ-REV-003**: Fast checks shall complete in under 30 seconds and include:

- Lint (ESLint)
- Type check (tsc)
- Format check (Prettier)

### 8.3 Loop 1 Deep (review/loop1-deep.cjs)

**REQ-REV-004**: Deep checks shall include:

- Unit tests
- Security scan
- Coverage check

### 8.4 Aggregate (review/aggregate.cjs)

**REQ-REV-005**: When aggregating, the system shall:

- Deduplicate findings by file+line
- Sort by severity
- Generate summary statistics

---

## Acceptance Criteria

### AC-001: Consistent API

All scripts shall export `execute(input, options)` returning `{ success, data?, error? }`.

### AC-002: Error Handling

All scripts shall use try/catch with graceful degradation (fail open with warning).

### AC-003: Output Streams

- stdout: JSON for Claude context
- stderr: Human-readable messages
- Exit codes: 0=success, 1=error, 2=blocked

### AC-004: Documentation

Each script shall include JSDoc header with input/output schemas.

### AC-005: Testing

Each script shall have corresponding test file with 80%+ coverage.
