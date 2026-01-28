# Scripts Automation Tasks

## Overview

35 tasks organized into 4 implementation phases. Each task includes a `_Prompt` field for agent delegation.

---

## Phase 1: Library Utilities (4 tasks)

Foundation libraries required by all other scripts.

### Task 1.1: Create git-utils.cjs

- [ ] **Create `.claude/scripts/lib/git-utils.cjs`**

**Description**: Git command wrapper library with consistent error handling and output parsing.

**Functions to implement**:

- `execGit(args: string[]): Promise<ExecResult>` - Execute git command
- `getCurrentBranch(): Promise<string>` - Get current branch name
- `getRemoteUrl(): Promise<string>` - Get origin URL
- `parseStatus(): Promise<GitStatus>` - Parse `git status --porcelain`
- `parseDiff(options): Promise<DiffResult>` - Parse diff output
- `getAheadBehind(): Promise<{ahead: number, behind: number}>` - Compare with upstream

**Acceptance Criteria**:

- All functions handle errors gracefully
- Returns structured JSON objects
- 100% test coverage

**\_Prompt**: |
Create `.claude/scripts/lib/git-utils.cjs` with the following:

1. Read existing io-utils.cjs in .claude/scripts/lib for patterns
2. Implement execGit using child_process.execSync with error handling
3. Implement getCurrentBranch, getRemoteUrl, parseStatus, parseDiff, getAheadBehind
4. Each function returns { success, data, error } format
5. Create test file at `.claude/scripts/lib/__tests__/git-utils.test.cjs`
6. Export all functions via module.exports

---

### Task 1.2: Create check-utils.cjs

- [ ] **Create `.claude/scripts/lib/check-utils.cjs`**

**Description**: Test and lint output parsing utilities.

**Functions to implement**:

- `parseVitestOutput(output: string): TestResult` - Parse Vitest JSON reporter
- `parseEslintOutput(output: string): LintResult` - Parse ESLint JSON output
- `parseTscOutput(output: string): TypeCheckResult` - Parse tsc output
- `aggregateResults(results: CheckResult[]): AggregateResult` - Combine results

**Acceptance Criteria**:

- Correctly parses all output formats
- Extracts error counts, file locations, messages
- 100% test coverage

**\_Prompt**: |
Create `.claude/scripts/lib/check-utils.cjs` with the following:

1. Implement parseVitestOutput to extract pass/fail/skip counts and failure details
2. Implement parseEslintOutput to extract errors/warnings by rule and file
3. Implement parseTscOutput to extract type errors with file:line format
4. Implement aggregateResults to combine multiple check results
5. Create test file with sample outputs from each tool
6. Handle malformed output gracefully (return partial results)

---

### Task 1.3: Create state-utils.cjs

- [ ] **Create `.claude/scripts/lib/state-utils.cjs`**

**Description**: Atomic state file CRUD operations.

**Functions to implement**:

- `getStatePath(filename: string): string` - Resolve state file path
- `readState(filename: string): Promise<object>` - Read and parse state
- `writeState(filename: string, data: object): Promise<void>` - Atomic write
- `updateState(filename: string, updates: object): Promise<object>` - Merge update
- `clearState(filename: string): Promise<void>` - Delete state file
- `ensureStateDir(): Promise<void>` - Create .claude/state if needed

**Acceptance Criteria**:

- Uses atomic writes (write to temp, rename)
- Creates .claude/state directory if missing
- Handles concurrent access safely
- 100% test coverage

**\_Prompt**: |
Create `.claude/scripts/lib/state-utils.cjs` with the following:

1. State files live in `.claude/state/` directory
2. Implement atomic writes using fs.writeFileSync to temp file, then fs.renameSync
3. readState returns {} if file doesn't exist (no error)
4. updateState does deep merge with existing state
5. Handle JSON parse errors gracefully
6. Create test file covering all edge cases

---

### Task 1.4: Create ascii-utils.cjs

- [ ] **Create `.claude/scripts/lib/ascii-utils.cjs`**

**Description**: ASCII box rendering for preview displays.

**Functions to implement**:

- `box(title: string, content: string[], options): string` - Render bordered box
- `table(headers: string[], rows: string[][]): string` - Render ASCII table
- `progress(current: number, total: number, label: string): string` - Progress bar
- `tree(items: TreeItem[]): string` - Render tree structure
- `wrap(text: string, width: number): string[]` - Word wrap text

**Acceptance Criteria**:

- Consistent box-drawing characters (Unicode)
- Proper alignment and padding
- Configurable width
- 100% test coverage

**\_Prompt**: |
Create `.claude/scripts/lib/ascii-utils.cjs` with the following:

1. Use Unicode box characters: ┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴ ┼
2. box() renders title bar with content sections
3. table() auto-sizes columns based on content
4. progress() shows [████░░░░░░] 40% format
5. tree() shows ├── and └── connectors
6. Default width is 60 characters, configurable
7. Create comprehensive test file

---

## Phase 2: High Priority Scripts (8 tasks)

Core scripts enabling basic agent workflows.

### Task 2.1: Create git/get-status.cjs

- [ ] **Create `.claude/scripts/git/get-status.cjs`**

**Description**: Parsed git status as structured JSON.

**Input**: None required
**Output**:

```json
{
  "success": true,
  "data": {
    "branch": "feature/name",
    "upstream": "origin/feature/name",
    "ahead": 2,
    "behind": 0,
    "staged": [{ "path": "file.ts", "status": "modified" }],
    "unstaged": [],
    "untracked": ["new-file.ts"],
    "clean": false
  }
}
```

**\_Prompt**: |
Create `.claude/scripts/git/get-status.cjs`:

1. Import git-utils.cjs for parseStatus and getAheadBehind
2. Export execute(input, options) function
3. Combine parseStatus and getAheadBehind results
4. Add CLI wrapper for direct execution
5. Create test file mocking git commands

---

### Task 2.2: Create git/create-branch.cjs

- [ ] **Create `.claude/scripts/git/create-branch.cjs`**

**Description**: Create branch with upstream sync.

**Input**: `{ "name": "feature/new-thing", "base": "main" }`
**Output**: `{ "success": true, "data": { "branch": "feature/new-thing", "basedOn": "main" } }`

**Validation**:

- Branch name matches pattern `^(feature|fix|chore|docs)/[a-z0-9-]+$`
- Syncs with origin/base before creating

**\_Prompt**: |
Create `.claude/scripts/git/create-branch.cjs`:

1. Validate branch name against allowed pattern
2. Fetch and pull base branch (default: main)
3. Create new branch from base
4. Push new branch to origin with -u
5. Return structured result with branch info
6. Handle errors: branch exists, network issues, invalid name

---

### Task 2.3: Create git/prepare-commit.cjs

- [ ] **Create `.claude/scripts/git/prepare-commit.cjs`**

**Description**: Analyze staged changes and suggest commit message.

**Input**: `{ "analyze": true }` (optional)
**Output**:

```json
{
  "success": true,
  "data": {
    "suggestedType": "feat",
    "scope": "auth",
    "summary": "add login validation",
    "body": ["- Added email format check", "- Added password strength check"],
    "files": [...],
    "breaking": false
  }
}
```

**\_Prompt**: |
Create `.claude/scripts/git/prepare-commit.cjs`:

1. Get staged files via git diff --cached --name-status
2. Detect commit type from file paths:
   - src/components/ → feat or fix
   - src/lib/ → feat, fix, or refactor
   - tests/ or _.test._ → test
   - \*.md, docs/ → docs
   - config files → chore
3. Extract scope from primary directory
4. Generate summary from file names
5. Detect breaking changes (API changes, major refactors)

---

### Task 2.4: Create check/run-qa-suite.cjs

- [ ] **Create `.claude/scripts/check/run-qa-suite.cjs`**

**Description**: Run full QA suite with structured output.

**Input**: `{ "quick": false, "fix": false }`
**Output**:

```json
{
  "success": true,
  "data": {
    "passed": true,
    "duration": 45000,
    "results": {
      "typecheck": { "passed": true, "errors": 0 },
      "lint": { "passed": true, "errors": 0, "warnings": 3 },
      "test": { "passed": true, "total": 50, "passed": 50, "failed": 0 },
      "build": { "passed": true }
    }
  }
}
```

**\_Prompt**: |
Create `.claude/scripts/check/run-qa-suite.cjs`:

1. Import check-utils.cjs for output parsing
2. Run in sequence: pnpm typecheck, pnpm lint, pnpm test, pnpm build
3. Parse each output using check-utils
4. Quick mode skips build
5. Fix mode runs lint with --fix
6. Aggregate all results into single response
7. Set success=false if any check fails

---

### Task 2.5: Create state/session-context.cjs

- [ ] **Create `.claude/scripts/state/session-context.cjs`**

**Description**: Session state management for agents.

**Input**:

- `{ "action": "get" }` - Read current session
- `{ "action": "set", "data": {...} }` - Update session
- `{ "action": "clear" }` - Reset session

**Output**: Session context object

**\_Prompt**: |
Create `.claude/scripts/state/session-context.cjs`:

1. Use state-utils.cjs for file operations
2. State file: .claude/state/session-context.json
3. Session schema: { feature, spec, branch, phase, tasks, lastCommand, updatedAt }
4. "get" returns current or empty object
5. "set" merges new data with existing
6. "clear" removes the file
7. Always update updatedAt on set

---

### Task 2.6: Create preview/generate.cjs

- [ ] **Create `.claude/scripts/preview/generate.cjs`**

**Description**: Generate ASCII preview boxes.

**Input**:

```json
{
  "template": "custom",
  "title": "Commit Preview",
  "sections": [
    {
      "heading": "Changes",
      "content": ["file1.ts", "file2.ts"],
      "style": "list"
    }
  ],
  "actions": [
    { "key": "y", "label": "Confirm" },
    { "key": "n", "label": "Cancel" }
  ]
}
```

**\_Prompt**: |
Create `.claude/scripts/preview/generate.cjs`:

1. Use ascii-utils.cjs for rendering
2. Support templates: commit, pr, qa, review, custom
3. Sections support styles: normal, code, list, table
4. Actions render as [y] Confirm [n] Cancel
5. Output to stderr for user visibility
6. Return rendered string in data for logging

---

### Task 2.7: Create review/loop1-fast.cjs

- [ ] **Create `.claude/scripts/review/loop1-fast.cjs`**

**Description**: Execute Tier 1 fast automated checks.

**Input**: `{ "fix": false }`
**Output**:

```json
{
  "success": true,
  "data": {
    "tier": 1,
    "name": "Fast Checks",
    "passed": true,
    "checks": ["lint", "typecheck", "format"],
    "findings": [],
    "duration": 12000
  }
}
```

**\_Prompt**: |
Create `.claude/scripts/review/loop1-fast.cjs`:

1. Run lint (ESLint), typecheck (tsc), format check (prettier --check)
2. Target: complete in under 30 seconds
3. Convert any failures to Finding objects
4. Finding: { id, severity, message, file, line, source }
5. Return structured result for aggregation

---

### Task 2.8: Create review/unified-review.cjs

- [ ] **Create `.claude/scripts/review/unified-review.cjs`**

**Description**: Orchestrate the 4-loop review system.

**Input**: `{ "skipLoops": [], "stopOnCritical": true }`
**Output**: Unified review result with all loops

**\_Prompt**: |
Create `.claude/scripts/review/unified-review.cjs`:

1. Execute loops in order:
   - Loop 1 Tier 1: Call loop1-fast.cjs
   - Loop 1 Tier 2: Call loop1-deep.cjs
   - Loop 2: Call coderabbit/run-local.cjs (if available)
   - Loop 3: Reserved for LLM self-review (skip for now)
   - Loop 4: Final validation
2. Exit early if critical issues and stopOnCritical=true
3. Update loop-state.cjs after each loop
4. Aggregate all findings via aggregate.cjs
5. Return comprehensive result

---

## Phase 3: Medium Priority Scripts (11 tasks)

Complete git workflow and research capabilities.

### Task 3.1: Create git/create-pr.cjs

- [ ] **Create `.claude/scripts/git/create-pr.cjs`**

**Description**: Create PR with validation.

**Input**:

```json
{
  "title": "feat: add login validation",
  "body": "## Summary\n...",
  "base": "main",
  "draft": false,
  "labels": ["enhancement"]
}
```

**\_Prompt**: |
Create `.claude/scripts/git/create-pr.cjs`:

1. Validate: branch pushed, has commits ahead, no conflicts
2. Use `gh pr create` with provided options
3. Parse and return PR URL and number
4. Handle errors: not pushed, conflicts, auth issues

---

### Task 3.2: Create git/get-pr-comments.cjs

- [ ] **Create `.claude/scripts/git/get-pr-comments.cjs`**

**Description**: Fetch unified PR comments.

**Input**: `{ "pr": 123 }` or `{ "pr": "current" }`

**\_Prompt**: |
Create `.claude/scripts/git/get-pr-comments.cjs`:

1. Use `gh pr view` and `gh api` for comments
2. Detect comment source: github, coderabbit, bot
3. Unify into standard format with file/line info
4. Sort by timestamp

---

### Task 3.3: Create git/poll-ci.cjs

- [ ] **Create `.claude/scripts/git/poll-ci.cjs`**

**Description**: Poll CI status with timeout.

**Input**: `{ "pr": 123, "timeout": 600000, "interval": 30000 }`

**\_Prompt**: |
Create `.claude/scripts/git/poll-ci.cjs`:

1. Use `gh pr checks` to get status
2. Poll at interval until complete or timeout
3. Return final status with check details
4. Handle: all pass, some fail, timeout

---

### Task 3.4: Create git/sync-main.cjs

- [ ] **Create `.claude/scripts/git/sync-main.cjs`**

**Description**: Sync branch with main via rebase or merge.

**Input**: `{ "strategy": "rebase" | "merge" }`

**\_Prompt**: |
Create `.claude/scripts/git/sync-main.cjs`:

1. Fetch origin/main
2. Attempt rebase (preferred) or merge based on strategy
3. Detect and report conflicts
4. Return success status and any conflict files

---

### Task 3.5: Create check/security-scan.cjs

- [ ] **Create `.claude/scripts/check/security-scan.cjs`**

**Description**: Security scan with JSON output.

**\_Prompt**: |
Create `.claude/scripts/check/security-scan.cjs`:

1. Run `pnpm audit --json`
2. Grep for hardcoded secrets patterns (API_KEY, password, etc.)
3. Grep for unsafe patterns (eval, dangerouslySetInnerHTML)
4. Return findings with severity levels

---

### Task 3.6: Create check/coverage-check.cjs

- [ ] **Create `.claude/scripts/check/coverage-check.cjs`**

**Description**: Coverage parsing and threshold checking.

**Input**: `{ "thresholds": { "lines": 80, "branches": 70, "functions": 80 } }`

**\_Prompt**: |
Create `.claude/scripts/check/coverage-check.cjs`:

1. Run `pnpm test --coverage --json`
2. Parse coverage report
3. Compare against thresholds
4. Return pass/fail with actual vs required

---

### Task 3.7: Create research/find-implementations.cjs

- [ ] **Create `.claude/scripts/research/find-implementations.cjs`**

**Description**: Search for code implementations.

**Input**: `{ "query": "useAuth", "type": "hook", "include": ["src/**"] }`

**\_Prompt**: |
Create `.claude/scripts/research/find-implementations.cjs`:

1. Use ripgrep for fast searching
2. Support type filters: function, class, component, hook
3. Return matches with file, line, preview
4. Limit results (default 20)

---

### Task 3.8: Create research/find-patterns.cjs

- [ ] **Create `.claude/scripts/research/find-patterns.cjs`**

**Description**: Discover patterns by mode.

**Input**: `{ "mode": "hook", "limit": 10 }`

**\_Prompt**: |
Create `.claude/scripts/research/find-patterns.cjs`:

1. Modes: hook, component, api, test, util
2. Each mode has specific search patterns
3. Return examples with code snippets
4. Group by directory/category

---

### Task 3.9: Create state/loop-state.cjs

- [ ] **Create `.claude/scripts/state/loop-state.cjs`**

**Description**: Review loop state management.

**Input**:

- `{ "action": "init", "feature": "name" }`
- `{ "action": "update", "loop": 1, "status": "passed", "findings": [] }`
- `{ "action": "get" }`

**\_Prompt**: |
Create `.claude/scripts/state/loop-state.cjs`:

1. Track currentLoop, feature, startedAt
2. Store findings per loop
3. Support init, update, get, reset actions
4. Calculate aggregate stats

---

### Task 3.10: Create state/review-results.cjs

- [ ] **Create `.claude/scripts/state/review-results.cjs`**

**Description**: Review results aggregation and persistence.

**\_Prompt**: |
Create `.claude/scripts/state/review-results.cjs`:

1. Aggregate findings from all loops
2. Deduplicate by file+line+message
3. Track resolution status
4. Generate summary statistics

---

### Task 3.11: Create review/loop1-deep.cjs

- [ ] **Create `.claude/scripts/review/loop1-deep.cjs`**

**Description**: Execute Tier 2 deep automated checks.

**\_Prompt**: |
Create `.claude/scripts/review/loop1-deep.cjs`:

1. Run unit tests (Vitest)
2. Run security scan
3. Run coverage check
4. Convert failures to Finding objects
5. Return structured result

---

## Phase 4: Lower Priority Scripts (12 tasks)

Complete remaining functionality.

### Task 4.1: Create git/cleanup-branches.cjs

- [ ] **Create `.claude/scripts/git/cleanup-branches.cjs`**

**\_Prompt**: |
Create `.claude/scripts/git/cleanup-branches.cjs`:

1. List branches merged into main
2. Exclude protected: main, master, develop
3. Delete merged branches (local and remote)
4. Return deleted branch names

---

### Task 4.2: Create check/find-tests.cjs

- [ ] **Create `.claude/scripts/check/find-tests.cjs`**

**\_Prompt**: |
Create `.claude/scripts/check/find-tests.cjs`:

1. Find _.test.ts, _.test.tsx, \*.spec.ts files
2. Group by directory
3. Extract test names via regex
4. Return structured test inventory

---

### Task 4.3: Create research/query-specs.cjs

- [ ] **Create `.claude/scripts/research/query-specs.cjs`**

**\_Prompt**: |
Create `.claude/scripts/research/query-specs.cjs`:

1. Scan specs/ directory
2. Detect spec status from content/files
3. Return list with name, status, path

---

### Task 4.4: Create research/analyze-dependencies.cjs

- [ ] **Create `.claude/scripts/research/analyze-dependencies.cjs`**

**\_Prompt**: |
Create `.claude/scripts/research/analyze-dependencies.cjs`:

1. Parse package.json dependencies
2. Check for outdated via `pnpm outdated --json`
3. Detect unused with depcheck
4. Return dependency report

---

### Task 4.5: Create preview/templates.cjs

- [ ] **Create `.claude/scripts/preview/templates.cjs`**

**\_Prompt**: |
Create `.claude/scripts/preview/templates.cjs`:

1. Export template functions for common previews
2. commitPreview(data) - staged files, message
3. prPreview(data) - title, body, checks
4. qaPreview(data) - check results
5. reviewPreview(data) - findings summary

---

### Task 4.6: Create preview/progress.cjs

- [ ] **Create `.claude/scripts/preview/progress.cjs`**

**\_Prompt**: |
Create `.claude/scripts/preview/progress.cjs`:

1. Render live progress display
2. Show stage name, progress bar, elapsed time
3. Support spinner for indeterminate progress
4. Status indicators: pending, running, done, failed

---

### Task 4.7: Create coderabbit/run-local.cjs

- [ ] **Create `.claude/scripts/coderabbit/run-local.cjs`**

**\_Prompt**: |
Create `.claude/scripts/coderabbit/run-local.cjs`:

1. Check rate limit via rate-limit.cjs
2. Execute `coderabbit review` CLI
3. Update rate limit state
4. Parse output via parse-findings.cjs
5. Handle rate limit exceeded gracefully

---

### Task 4.8: Create coderabbit/fetch-pr-review.cjs

- [ ] **Create `.claude/scripts/coderabbit/fetch-pr-review.cjs`**

**\_Prompt**: |
Create `.claude/scripts/coderabbit/fetch-pr-review.cjs`:

1. Get PR comments from CodeRabbit bot
2. Use `gh api` to fetch comments
3. Filter by author containing "coderabbit"
4. Return structured comment list

---

### Task 4.9: Create coderabbit/parse-findings.cjs

- [ ] **Create `.claude/scripts/coderabbit/parse-findings.cjs`**

**\_Prompt**: |
Create `.claude/scripts/coderabbit/parse-findings.cjs`:

1. Parse CodeRabbit output format
2. Categorize: critical, warning, suggestion, nitpick
3. Extract file, line, message, suggestion
4. Return structured findings array

---

### Task 4.10: Create coderabbit/format-report.cjs

- [ ] **Create `.claude/scripts/coderabbit/format-report.cjs`**

**\_Prompt**: |
Create `.claude/scripts/coderabbit/format-report.cjs`:

1. Format findings as Markdown report
2. Group by severity
3. Include file links and code snippets
4. Generate summary stats header

---

### Task 4.11: Create coderabbit/rate-limit.cjs

- [ ] **Create `.claude/scripts/coderabbit/rate-limit.cjs`**

**\_Prompt**: |
Create `.claude/scripts/coderabbit/rate-limit.cjs`:

1. Track review count per hour
2. Limit: 5 reviews per hour
3. Actions: check, record, reset
4. Return allowed, remaining, resetsAt

---

### Task 4.12: Create review/aggregate.cjs

- [ ] **Create `.claude/scripts/review/aggregate.cjs`**

**\_Prompt**: |
Create `.claude/scripts/review/aggregate.cjs`:

1. Combine findings from all loops
2. Deduplicate by file+line+message hash
3. Sort by severity (critical first)
4. Generate summary: total, by severity, blocking

---

## Summary

| Phase     | Tasks  | Priority | Est. Hours |
| --------- | ------ | -------- | ---------- |
| 1         | 4      | Critical | 7          |
| 2         | 8      | High     | 16         |
| 3         | 11     | Medium   | 19         |
| 4         | 12     | Low      | 17         |
| **Total** | **35** |          | **59**     |

## Dependencies

```
Phase 1 (Libs)
    │
    ├── git-utils ────────┬── Phase 2-4 git scripts
    │                     │
    ├── check-utils ──────┼── Phase 2-4 check scripts
    │                     │
    ├── state-utils ──────┼── Phase 2-4 state scripts
    │                     │
    └── ascii-utils ──────┴── Phase 2-4 preview scripts
```
