# Task Breakdown: 4-Loop Review System

## Overview

This document defines 20 implementation tasks organized into 6 phases. Each task includes a structured prompt using the Role-Task-Restrictions-Success (RTRS) format for sub-agent execution.

**Critical Path:** T001 → T002 → T003 → T004 → T007 → T009 → T014 → T016 → T020

**Estimated Total Effort:** 16-20 hours (1 developer)

---

## Phase 1: Free Checks Infrastructure

### T001: Implement Secret Scanner

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** None
**Files:** `.claude/scripts/lib/secret-scanner.cjs` (new)

**\_Prompt:**

```
Role: You are a security-focused JavaScript developer implementing a secrets detection tool.

Task: Create `.claude/scripts/lib/secret-scanner.cjs` that scans staged Git files for 7 hardcoded secret patterns:
1. Generic API keys (api_key, apikey, api_secret)
2. Private keys (PEM format)
3. AWS access keys (AKIA...)
4. GitHub tokens (ghp_, gho_, ghs_, ghr_, ghu_)
5. Database URLs (postgres://, mysql://, mongodb://)
6. JWT secrets (jwt_secret)
7. OAuth client secrets (client_secret, oauth_secret)

Requirements:
- Export async function `scanFiles(files: string[]): Promise<ScanResult>`
- Return `{ status: 'pass'|'fail', matches: Match[] }` where Match = `{ file, line, pattern, severity, preview }`
- Exclude `.env.example`, test fixtures (`*.test.ts`, `*.spec.ts`), and comment-only matches
- Redact matched secrets in output (show only first 4 characters)
- Use case-insensitive regex for pattern matching
- Include line numbers and 20-char context preview for each match

Restrictions:
- Do NOT modify any files outside `.claude/scripts/lib/`
- Do NOT add external dependencies (use only Node.js built-ins)
- Do NOT write secrets to logs or state files (redact all matches)

Success Criteria:
- All 7 patterns correctly detect secrets in test cases
- False positives filtered (env examples, comments, test fixtures)
- Execution completes in <5s for 100 files
- Output includes actionable file:line references
```

**Validation:**

```bash
# Create test file with fake secrets
echo "const API_KEY = 'sk_live_abc123def456ghi789';" > test-secrets.js
node .claude/scripts/lib/secret-scanner.cjs test-secrets.js
# Expected: 1 match detected, redacted output
```

---

### T002: Implement Free Checks Tier 1

**Complexity:** Small
**Estimated Time:** 1 hour
**Dependencies:** None
**Files:** `.claude/scripts/lib/free-checks.cjs` (new)

**\_Prompt:**

```
Role: You are a DevOps engineer implementing parallel CI checks.

Task: Create `.claude/scripts/lib/free-checks.cjs` with function `runTier1Checks()` that executes 3 checks in parallel:
1. `pnpm lint` (ESLint)
2. `pnpm typecheck` (TypeScript)
3. `pnpm format:check` (Prettier)

Requirements:
- Export async function `runTier1Checks(): Promise<Tier1Result>`
- Execute checks in parallel using `Promise.all()`
- Return `{ status: 'pass'|'fail', elapsed_ms: number, details: { lint, typecheck, format } }`
- Each detail includes: `{ status: 'pass'|'fail', stdout, stderr, exit_code }`
- Timeout individual checks at 30 seconds
- Capture stdout/stderr for failed checks
- If ANY check fails, overall status is 'fail'

Restrictions:
- Do NOT use external libraries (only Node.js child_process)
- Do NOT modify package.json or pnpm scripts
- Do NOT run checks sequentially (must be parallel)

Success Criteria:
- All 3 checks run in parallel (observable via timestamps)
- Completes in <30s for typical codebase
- Failed checks show exact error output
- Successful execution returns structured result object
```

**Validation:**

```bash
node -e "require('./.claude/scripts/lib/free-checks.cjs').runTier1Checks().then(console.log)"
# Expected: { status: 'pass', elapsed_ms: ~15000, details: {...} }
```

---

### T003: Implement Free Checks Tier 2

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T001, T002
**Files:** `.claude/scripts/lib/free-checks.cjs` (update)

**\_Prompt:**

```
Role: You are a DevOps engineer implementing sequential CI checks with early exit.

Task: Update `.claude/scripts/lib/free-checks.cjs` to add function `runTier2Checks()` that executes 3 checks sequentially:
1. Secret scan (using secret-scanner.cjs from T001)
2. `pnpm build`
3. `pnpm test`

Requirements:
- Export async function `runTier2Checks(): Promise<Tier2Result>`
- Execute checks SEQUENTIALLY (not parallel)
- EARLY EXIT: Stop at first failure, skip remaining checks
- Return `{ status: 'pass'|'fail', elapsed_ms: number, details: { secrets, build, test } }`
- Secrets detail: `{ status, matches: [] }` from secret-scanner.cjs
- Build/test details: `{ status, stdout, stderr, exit_code }`
- Timeout tier 2 at 120 seconds total
- Get staged files using: `git diff --cached --name-only --diff-filter=ACM`

Restrictions:
- Do NOT run checks in parallel (must be sequential)
- Do NOT continue after first failure (must exit early)
- Do NOT modify secret-scanner.cjs

Success Criteria:
- Checks run sequentially (secrets → build → test)
- Early exit on first failure (remaining checks skipped)
- Completes in <2min for typical codebase
- Secrets scan only checks staged files (not entire repo)
```

**Validation:**

```bash
# Stage file with secret
git add test-secrets.js
node -e "require('./.claude/scripts/lib/free-checks.cjs').runTier2Checks().then(console.log)"
# Expected: Early exit with secrets failure, build/test not run
```

---

## Phase 2: Claude Reviewer Agent

### T004: Implement Claude Reviewer Prompt Builder

**Complexity:** Medium
**Estimated Time:** 2 hours
**Dependencies:** None
**Files:** `.claude/scripts/lib/claude-reviewer.cjs` (new)

**\_Prompt:**

```
Role: You are an AI prompt engineer designing a code review agent.

Task: Create `.claude/scripts/lib/claude-reviewer.cjs` with function `buildReviewPrompt(context)` that constructs a detailed prompt for Claude Opus reviewer persona.

Requirements:
- Export function `buildReviewPrompt(context): string`
- Context object includes: `{ diff, files, commits, specs, tech_stack }`
- Prompt must instruct reviewer to analyze:
  1. Code quality (complexity, readability, maintainability)
  2. Architecture (patterns, separation of concerns, SOLID)
  3. Security (input validation, auth, data exposure)
  4. Testing (coverage, edge cases, integration)
  5. Documentation (JSDoc, README, inline comments)
- Output format: JSON with findings array
- Finding schema: `{ severity: 'critical'|'major'|'minor', category, file, line, message, fix }`
- Include blocking rules: critical = block ship, major = warn, minor = FYI
- Persona: "Senior code reviewer with expertise in ${tech_stack}"

Restrictions:
- Do NOT implement sub-agent spawning (that's T005)
- Do NOT hard-code file paths (use context parameters)
- Prompt must be <8000 tokens after context injection

Success Criteria:
- Prompt clearly defines 5 review areas
- JSON output schema is unambiguous
- Blocking rules are explicit
- Persona establishes senior expertise level
```

**Validation:**

```bash
node -e "const {buildReviewPrompt} = require('./.claude/scripts/lib/claude-reviewer.cjs'); console.log(buildReviewPrompt({tech_stack: 'React', diff: 'sample', files: [], commits: [], specs: []}))"
# Expected: Multi-paragraph prompt with JSON schema and blocking rules
```

---

### T005: Implement Claude Reviewer Sub-Agent Spawner

**Complexity:** Large
**Estimated Time:** 2.5 hours
**Dependencies:** T004
**Files:** `.claude/scripts/lib/claude-reviewer.cjs` (update)

**\_Prompt:**

```
Role: You are a systems integration developer connecting AI agents.

Task: Update `.claude/scripts/lib/claude-reviewer.cjs` to add function `runClaudeReview(context)` that spawns a Claude Opus sub-agent using the Task tool.

Requirements:
- Export async function `runClaudeReview(context): Promise<ReviewResult>`
- Build prompt using `buildReviewPrompt(context)` from T004
- Spawn sub-agent using Task tool: `Task({ subagent_type: 'general-purpose', model: 'opus', description: 'Code review', prompt })`
- Parse JSON output from sub-agent (handle both markdown-wrapped and raw JSON)
- Save results to `.claude/state/claude-review-results.json` using atomic write
- Return `{ status: 'pass'|'fail', findings: [], elapsed_ms: number }`
- Status = 'fail' if ANY finding has severity 'critical'
- Timeout at 5 minutes, return 'skip' status on timeout
- Handle parsing errors gracefully (log error, return 'skip')

Restrictions:
- Do NOT use external HTTP clients (use Task tool only)
- Do NOT modify buildReviewPrompt function
- Do NOT skip atomic write for state file

Success Criteria:
- Sub-agent receives complete context in prompt
- JSON parsing handles both wrapped and raw formats
- Critical findings correctly trigger 'fail' status
- Results persisted to state file before return
- Timeout doesn't crash parent process
```

**Validation:**

```bash
# Create sample context
node -e "require('./.claude/scripts/lib/claude-reviewer.cjs').runClaudeReview({tech_stack:'React',diff:'...',files:[],commits:[],specs:[]}).then(console.log)"
# Expected: { status: 'pass'|'fail', findings: [...], elapsed_ms: ~120000 }
```

---

### T006: Implement Claude Review Context Loader

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T005
**Files:** `.claude/scripts/lib/claude-reviewer.cjs` (update)

**\_Prompt:**

```
Role: You are a Git automation developer preparing code review context.

Task: Update `.claude/scripts/lib/claude-reviewer.cjs` to add function `loadReviewContext()` that gathers context for Claude reviewer.

Requirements:
- Export async function `loadReviewContext(): Promise<Context>`
- Gather context using Git commands:
  1. Diff: `git diff --cached` (staged changes)
  2. Files: `git diff --cached --name-only` (changed file list)
  3. Commits: `git log -5 --oneline` (recent 5 commits)
  4. Specs: Search `specs/` directory for markdown files matching branch name
  5. Tech stack: Parse package.json dependencies (detect React, Next.js, etc.)
- Truncate diff to max 10k lines (prevent prompt overflow)
- Exclude binary files from diff
- Return `{ diff, files, commits, specs, tech_stack }`

Restrictions:
- Do NOT use external Git libraries (use child_process.execSync)
- Do NOT include unstaged changes (only staged/cached)
- Do NOT load entire file contents (diff only)

Success Criteria:
- Context includes all 5 required fields
- Diff limited to 10k lines (prevents token overflow)
- Spec files auto-detected from branch name (e.g., feature/xyz → specs/xyz/)
- Tech stack correctly identifies framework (React, Vue, Angular, etc.)
```

**Validation:**

```bash
# Stage some changes
git add src/components/Button.tsx
node -e "require('./.claude/scripts/lib/claude-reviewer.cjs').loadReviewContext().then(console.log)"
# Expected: { diff: '...', files: ['src/components/Button.tsx'], commits: [...], specs: [...], tech_stack: 'React' }
```

---

## Phase 3: Loop Orchestration

### T007: Implement Loop Controller Core

**Complexity:** Large
**Estimated Time:** 3 hours
**Dependencies:** T002, T003, T005
**Files:** `.claude/scripts/lib/loop-controller.cjs` (new)

**\_Prompt:**

```
Role: You are a workflow orchestration engineer building a state machine.

Task: Create `.claude/scripts/lib/loop-controller.cjs` with class `LoopController` that orchestrates 4-loop execution.

Requirements:
- Export class `LoopController` with constructor `(config, stateDir)`
- Implement methods:
  1. `async executeLoop1Tier1()` → calls free-checks.runTier1Checks()
  2. `async executeLoop1Tier2()` → calls free-checks.runTier2Checks()
  3. `async executeLoop2()` → calls claude-reviewer.runClaudeReview()
  4. `async executeLoop3()` → placeholder (T008 implements CodeRabbit)
  5. `async executeAll(flags)` → runs loops based on flags (--free, --claude, --skip-cr, --all)
  6. `getShipDecision()` → reads state, applies blocking rules, returns { allowed, blockers }
  7. `saveState(results)` → atomic write to loop-state.json
  8. `invalidateState()` → delete state when head commit changes
- Gate logic: L1-T1 fail → stop, L1-T2 fail → stop, L2 critical → block ship, L3 skip on rate limit
- Track elapsed time for each loop
- Config schema: `{ loop1: { tier1_timeout, tier2_timeout }, loop2: { enabled, model }, blocking: { critical_blocks_ship, ... } }`

Restrictions:
- Do NOT implement rate limiting here (that's T009)
- Do NOT implement CodeRabbit integration here (that's T008)
- Do NOT use external state management libraries

Success Criteria:
- Each loop method returns normalized result: `{ status, elapsed_ms, details }`
- Gate logic correctly blocks progression on failures
- State persisted after each loop completes
- Ship decision considers all blocking rules from config
```

**Validation:**

```bash
node -e "const {LoopController} = require('./.claude/scripts/lib/loop-controller.cjs'); const lc = new LoopController({}, '.claude/state'); lc.executeLoop1Tier1().then(console.log)"
# Expected: { status: 'pass', elapsed_ms: ~15000, details: {...} }
```

---

### T008: Implement CodeRabbit Integration

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T007
**Files:** `.claude/scripts/lib/loop-controller.cjs` (update)

**\_Prompt:**

```
Role: You are a CI/CD integration developer connecting external code review tools.

Task: Update `.claude/scripts/lib/loop-controller.cjs` to implement `executeLoop3()` method that runs CodeRabbit CLI.

Requirements:
- Update `async executeLoop3()` method
- Check rate limit using rate-limit-tracker.cjs (T009 creates this, assume it exists)
- If rate limit exceeded, return `{ status: 'skip', reason: 'rate_limit_exceeded', elapsed_ms: 0 }`
- If --skip-cr flag set, return `{ status: 'skip', reason: 'flag_skip', elapsed_ms: 0 }`
- Execute: `git diff --cached | coderabbit review --stdin`
- Parse CodeRabbit JSON output (issues array)
- Record execution in rate-limit-tracker
- Merge findings with Loop 2 results (deduplicate by file:line)
- Return `{ status: 'pass'|'fail'|'skip', findings: [], elapsed_ms: number }`
- Status = 'fail' if new critical issues found (not in Loop 2 results)
- Timeout at 3 minutes

Restrictions:
- Do NOT implement rate-limit-tracker.cjs here (that's T009)
- Do NOT modify CodeRabbit CLI config
- Do NOT run if Loop 2 failed (gate already closed)

Success Criteria:
- Rate limit checked before execution
- CodeRabbit only runs if quota available
- Findings deduplicated against Loop 2 results
- Execution recorded in rate limit tracker
- Timeout doesn't crash process
```

**Validation:**

```bash
# Assumes CodeRabbit CLI configured
git add src/components/Button.tsx
node -e "const {LoopController} = require('./.claude/scripts/lib/loop-controller.cjs'); const lc = new LoopController({}, '.claude/state'); lc.executeLoop3().then(console.log)"
# Expected: { status: 'pass'|'skip', findings: [...], elapsed_ms: ~45000 }
```

---

### T009: Implement Rate Limit Tracker

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** None
**Files:** `.claude/scripts/lib/rate-limit-tracker.cjs` (new)

**\_Prompt:**

```
Role: You are a quota management developer implementing API rate limiting.

Task: Create `.claude/scripts/lib/rate-limit-tracker.cjs` with class `RateLimitTracker` that enforces hourly quotas.

Requirements:
- Export class `RateLimitTracker` with constructor `(stateFile, limitPerHour = 8)`
- Implement methods:
  1. `async canExecute(): boolean` → check if quota available in current hour
  2. `async recordExecution()` → increment usage in current hour bucket
  3. `async getRemainingQuota(): number` → return available executions this hour
  4. `getCurrentHourBucket(): string` → return 'YYYY-M-D-H' bucket key
  5. `async cleanupOldBuckets()` → remove buckets older than 2 hours
- State schema: `{ version, limit_per_hour, buckets: { 'YYYY-M-D-H': count }, total_executions, last_execution }`
- Use atomic writes for state file
- Auto-cleanup old buckets on each recordExecution call

Restrictions:
- Do NOT use external date libraries (use Date built-in)
- Do NOT allow negative quota (min 0)
- Do NOT lose state on concurrent writes (use atomic writes)

Success Criteria:
- Hourly buckets correctly partition usage
- Quota enforced (canExecute returns false when limit reached)
- Old buckets cleaned up automatically
- State persists across process restarts
- Concurrent writes don't corrupt state
```

**Validation:**

```bash
node -e "const {RateLimitTracker} = require('./.claude/scripts/lib/rate-limit-tracker.cjs'); const rlt = new RateLimitTracker('.claude/state/rate-limit-state.json', 8); rlt.canExecute().then(can => { console.log('Can execute:', can); if(can) rlt.recordExecution(); })"
# Expected: Can execute: true (first run), then quota decrements
```

---

### T010: Implement Loop State Persistence

**Complexity:** Small
**Estimated Time:** 1 hour
**Dependencies:** T007
**Files:** `.claude/scripts/lib/loop-controller.cjs` (update)

**\_Prompt:**

```
Role: You are a data persistence developer implementing state management.

Task: Update `.claude/scripts/lib/loop-controller.cjs` to implement state persistence methods with atomic writes and validation.

Requirements:
- Update `saveState(results)` method:
  1. Combine results from all loops into unified state object
  2. Add metadata: version, branch, head_commit, timestamp
  3. Calculate ship_allowed based on blocking rules
  4. List blockers array if ship not allowed
  5. Use atomic write (write to .tmp, then rename)
  6. Write to `.claude/state/loop-state.json`
- Update `invalidateState()` method:
  1. Check if head_commit in state matches current commit
  2. If mismatch, delete loop-state.json
  3. Log invalidation reason
- Add `async loadState(): State | null` method:
  1. Load loop-state.json if exists
  2. Validate JSON schema
  3. Return null if invalid or missing
- State schema matches design.md section 2.1

Restrictions:
- Do NOT use external state libraries
- Do NOT skip atomic write (prevents corruption)
- Do NOT allow invalid state to persist (validate on load)

Success Criteria:
- State file written atomically (no partial writes)
- Invalid state triggers reset (returns null on load)
- State invalidated when new commits detected
- Ship decision correctly computed from blocking rules
```

**Validation:**

```bash
# Make commit, then check state invalidation
git add test.txt && git commit -m "test"
node -e "const {LoopController} = require('./.claude/scripts/lib/loop-controller.cjs'); const lc = new LoopController({}, '.claude/state'); lc.invalidateState(); console.log('State invalidated')"
# Expected: loop-state.json deleted if head changed
```

---

## Phase 4: /reconcile Updates

### T011: Add Reconcile Source Detection

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T007, T009
**Files:** `.claude/commands/reconcile.md` (update)

**\_Prompt:**

```
Role: You are a command integration developer adding new functionality to existing commands.

Task: Update `.claude/commands/reconcile.md` to add auto-detection of reconcile sources (claude, local, pr).

Requirements:
- Add new flags: `--source claude|local|pr`
- If no --source flag, auto-detect:
  1. Check `.claude/state/claude-review-results.json` → if findings exist, return 'claude'
  2. Check `.claude/state/loop-state.json` → if ship_allowed=false, return 'local'
  3. Check GitHub PR comments (using gh cli) → if comments exist, return 'pr'
  4. If none found, error: "No reconcile source detected"
- Update command description to document 3 sources:
  - `claude`: Findings from Loop 2 Claude reviewer
  - `local`: Combined findings from loop-state.json (all loops)
  - `pr`: GitHub PR review comments (asynchronous Loop 4)
- Add examples for each source

Restrictions:
- Do NOT implement the actual reconcile logic (that's T012)
- Do NOT modify plan-agent.md (reconcile delegates to plan-agent)
- Do NOT remove existing reconcile functionality

Success Criteria:
- Auto-detection logic clearly documented
- Examples show usage for all 3 sources
- --source flag overrides auto-detection
- Error message helpful when no source found
```

**Validation:**

```bash
# Check updated documentation
cat .claude/commands/reconcile.md | grep -A5 "source"
# Expected: Documentation for --source flag with 3 options
```

---

### T012: Implement Claude Source Reconcile

**Complexity:** Medium
**Estimated Time:** 2 hours
**Dependencies:** T011
**Files:** `.claude/commands/reconcile.md` (update)

**\_Prompt:**

```
Role: You are a command integration developer implementing feedback loops.

Task: Update `.claude/commands/reconcile.md` to implement reconcile from claude-review-results.json.

Requirements:
- When source = 'claude':
  1. Load `.claude/state/claude-review-results.json`
  2. Parse findings array
  3. For each finding with severity 'critical' or 'major':
     - Display: file, line, message, fix suggestion
     - Prompt user: "Apply suggested fix? (y/n/skip)"
     - If 'y': Apply fix using Edit tool
     - If 'n': Add to manual fix list
     - If 'skip': Skip to next finding
  4. After all fixes applied, invalidate loop state (trigger re-review)
  5. Display summary: "Applied X fixes, Y manual, Z skipped"
- Suggested fixes must be parsed from finding.fix field
- Manual fix list saved to `.claude/state/manual-fixes.md` for user reference

Restrictions:
- Do NOT auto-apply fixes without user confirmation
- Do NOT modify files for 'minor' severity findings (FYI only)
- Do NOT skip loop state invalidation (must re-review after fixes)

Success Criteria:
- User prompted for each critical/major finding
- Fixes applied correctly using Edit tool
- Manual fixes documented in manual-fixes.md
- Loop state invalidated after reconcile
- Summary displayed at end
```

**Validation:**

```bash
# Simulate Claude findings
echo '{"findings":[{"severity":"critical","file":"src/app.ts","line":10,"message":"SQL injection","fix":"Use parameterized query"}]}' > .claude/state/claude-review-results.json
# Run reconcile (in Claude Code)
/reconcile --source claude
# Expected: User prompted to apply fix, file edited, loop state invalidated
```

---

### T013: Implement PR Source Reconcile

**Complexity:** Large
**Estimated Time:** 2.5 hours
**Dependencies:** T012
**Files:** `.claude/commands/reconcile.md` (update)

**\_Prompt:**

```
Role: You are a GitHub integration developer implementing PR feedback loops.

Task: Update `.claude/commands/reconcile.md` to implement reconcile from GitHub PR review comments.

Requirements:
- When source = 'pr':
  1. Detect current PR using: `gh pr view --json number,url`
  2. Fetch PR review comments: `gh api repos/{owner}/{repo}/pulls/{pr}/comments`
  3. Parse comments array, filter for:
     - Review comments (not issue comments)
     - Comments on changed lines (ignore resolved threads)
     - Comments with actionable feedback (contain keywords: "fix", "change", "update", "add", "remove")
  4. Display comments grouped by file
  5. For each comment:
     - Show: file, line, comment body, author
     - Prompt user: "Address this comment? (y/n/skip)"
     - If 'y': Spawn sub-agent to apply fix (context: file, line, comment)
     - If 'n': Add to manual list
  6. After all addressed, invalidate loop state (re-run Loop 1)
  7. Add comment to PR: "Addressed X review comments via /reconcile"
- Sub-agent prompt template: "Fix {file}:{line} based on review comment: {body}"

Restrictions:
- Do NOT modify files without user confirmation
- Do NOT address comments on unchanged files (out of scope)
- Do NOT skip PR comment after fixes (notify reviewers)

Success Criteria:
- PR correctly detected using gh cli
- Comments filtered to actionable feedback only
- Sub-agent spawned with sufficient context
- PR comment added after reconcile
- Loop state invalidated (triggers Loop 1 re-run)
```

**Validation:**

```bash
# Assumes PR exists with review comments
gh pr view --json number
# Run reconcile (in Claude Code)
/reconcile --source pr
# Expected: Comments fetched, user prompted, fixes applied, PR commented
```

---

## Phase 5: /review Updates

### T014: Refactor Review Hook Orchestrator

**Complexity:** Large
**Estimated Time:** 2.5 hours
**Dependencies:** T007, T009, T010
**Files:** `.claude/scripts/hooks/user-prompt-review.cjs` (update)

**\_Prompt:**

```
Role: You are a command refactoring specialist modernizing an existing hook.

Task: Refactor `.claude/scripts/hooks/user-prompt-review.cjs` to use LoopController from T007 instead of direct CodeRabbit invocation.

Requirements:
- Replace existing CodeRabbit logic with LoopController
- Load config from `.claude/config/review-config.yaml` (use defaults if missing)
- Parse flags from argv: `--free`, `--claude`, `--skip-cr`, `--all` (default)
- Map flags to loop execution:
  - `--free` → executeLoop1Tier1() + executeLoop1Tier2()
  - `--claude` → executeLoop1() + executeLoop2()
  - `--all` → executeLoop1() + executeLoop2() + executeLoop3()
  - `--skip-cr` → skip executeLoop3() even if rate allows
- Instantiate LoopController with config and state dir
- Execute loops via `loopController.executeAll(flags)`
- Display unified report (see T016)
- Check ship decision via `loopController.getShipDecision()`
- Exit with code 0 if ship allowed, 1 if blocked

Restrictions:
- Do NOT remove existing hook structure (maintain compatibility)
- Do NOT change hook name (keep user-prompt-review.cjs)
- Do NOT skip config loading (always attempt, use defaults if missing)

Success Criteria:
- LoopController replaces all direct CodeRabbit calls
- Flags correctly control loop execution
- Config loaded from yaml with fallback to defaults
- Exit code reflects ship decision
- Existing hook trigger mechanism unchanged
```

**Validation:**

```bash
# Test flag variations
node .claude/scripts/hooks/user-prompt-review.cjs --free
# Expected: Only Loop 1 runs
node .claude/scripts/hooks/user-prompt-review.cjs --claude
# Expected: Loop 1 + Loop 2 run
node .claude/scripts/hooks/user-prompt-review.cjs --all
# Expected: All loops run (unless rate limited)
```

---

### T015: Add Review Configuration File

**Complexity:** Small
**Estimated Time:** 0.5 hours
**Dependencies:** T014
**Files:** `.claude/config/review-config.yaml` (new)

**\_Prompt:**

```
Role: You are a configuration management specialist creating a YAML config file.

Task: Create `.claude/config/review-config.yaml` with default configuration for 4-loop review system.

Requirements:
- Use YAML format with comments explaining each option
- Include all sections from design.md section 2.6:
  - loop1: tier1_timeout, tier2_timeout, parallel_tier1, fail_fast_tier2
  - loop2: enabled, model, spawn_fresh_context, include_specs, include_commits
  - loop3: enabled, rate_limit_per_hour, skip_on_rate_limit, block_on_new_issues
  - blocking: critical_blocks_ship, major_blocks_ship, minor_blocks_ship, secrets_block_ship, build_failure_blocks_ship, test_failure_blocks_ship
  - output: show_progress_spinners, show_elapsed_time, unified_report, save_logs
  - paths: state_dir, log_dir, config_dir
- Use sensible defaults:
  - Timeouts: 30s tier1, 120s tier2
  - Loop 2: enabled, opus model
  - Loop 3: enabled, 8/hr limit, skip on rate limit, warn only on new issues
  - Blocking: critical blocks, major/minor don't block
  - Output: all enabled
  - Paths: standard .claude/ directories
- Add header comment with version and last updated

Restrictions:
- Do NOT use JSON format (must be YAML)
- Do NOT omit comments (every option needs explanation)
- Do NOT use non-standard YAML features

Success Criteria:
- Valid YAML syntax (parses without errors)
- All options documented with inline comments
- Defaults match design.md specifications
- File includes version and update metadata
```

**Validation:**

```bash
# Validate YAML syntax
pnpm add -D js-yaml
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('.claude/config/review-config.yaml', 'utf8')))"
# Expected: Parsed config object with all sections
```

---

### T016: Implement Unified Report Display

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T014
**Files:** `.claude/scripts/hooks/user-prompt-review.cjs` (update)

**\_Prompt:**

```
Role: You are a CLI UI developer creating readable terminal output.

Task: Update `.claude/scripts/hooks/user-prompt-review.cjs` to display unified findings report after all loops complete.

Requirements:
- Add function `displayUnifiedReport(loopResults)`:
  1. Extract findings from all loops (L1 errors, L2 findings, L3 issues)
  2. Deduplicate by file:line (prefer higher severity)
  3. Sort by severity (critical → major → minor → info)
  4. Display table with columns: Loop | Severity | File:Line | Message
  5. Use box-drawing characters for table borders (┌─┐│├─┤└─┘)
  6. Color-code severity: red=critical, yellow=major, blue=minor, gray=info
  7. Show elapsed time for each loop
  8. Show total findings count by severity
  9. Show ship decision with blockers list if blocked
- Table example from requirements.md section 3.4
- Use ANSI escape codes for colors (no external libraries)

Restrictions:
- Do NOT use external table libraries (use box-drawing chars)
- Do NOT skip deduplication (same issue from multiple loops = 1 row)
- Do NOT omit elapsed time (helps identify slow loops)

Success Criteria:
- Report displays all findings in single table
- Findings deduplicated correctly
- Color coding aids quick severity identification
- Elapsed times help optimize performance
- Ship decision clearly communicated
```

**Validation:**

```bash
# Run review with known issues
node .claude/scripts/hooks/user-prompt-review.cjs --all
# Expected: Formatted table with findings, colored by severity, elapsed times shown
```

---

### T017: Add Review Progress Indicators

**Complexity:** Small
**Estimated Time:** 1 hour
**Dependencies:** T016
**Files:** `.claude/scripts/hooks/user-prompt-review.cjs` (update)

**\_Prompt:**

```
Role: You are a CLI UX developer adding progress feedback.

Task: Update `.claude/scripts/hooks/user-prompt-review.cjs` to show real-time progress during loop execution.

Requirements:
- Add spinner animation for each loop:
  - Loop 1 Tier 1: "⠋ Running lint, typecheck, format... (Xs)"
  - Loop 1 Tier 2: "⠋ Scanning secrets, building, testing... (Xs)"
  - Loop 2: "⠋ Claude Opus reviewing code... (Xs)"
  - Loop 3: "⠋ CodeRabbit second opinion... (Xs)"
- Update spinner every 200ms with elapsed time
- Show checkmark ✓ on pass, cross ✗ on fail, dash – on skip
- Display final status with elapsed time:
  - "✓ Loop 1 Tier 1 passed (15.4s)"
  - "✗ Loop 1 Tier 2 failed (8.2s)"
  - "– Loop 3 skipped (rate limit)"
- Use `process.stdout.write()` with `\r` for in-place updates
- Clear spinner line before displaying final status

Restrictions:
- Do NOT use external spinner libraries (implement simple animation)
- Do NOT block on spinner updates (use setInterval)
- Do NOT leave spinner artifacts (clear line on completion)

Success Criteria:
- Spinner animates smoothly (8 frames: ⠋⠙⠹⠸⠼⠴⠦⠧)
- Elapsed time updates every second
- Final status replaces spinner cleanly
- No leftover characters or broken lines
```

**Validation:**

```bash
# Run review and observe progress
node .claude/scripts/hooks/user-prompt-review.cjs --all
# Expected: Animated spinners during execution, clean final status lines
```

---

## Phase 6: Configuration & Docs

### T018: Update code-review Skill Documentation

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** T014, T015, T016, T017
**Files:** `.claude/skills/code-review/SKILL.md` (update)

**\_Prompt:**

```
Role: You are a technical documentation writer updating user-facing docs.

Task: Update `.claude/skills/code-review/SKILL.md` to document the new 4-loop review system.

Requirements:
- Update "How It Works" section:
  - Replace single CodeRabbit mention with 4-loop architecture
  - Describe each loop with timing estimates
  - Explain gate logic (L1 blocks L2, critical blocks ship, etc.)
  - Document rate limiting for Loop 3
- Update "Usage" section:
  - Add flag documentation: --free, --claude, --skip-cr, --all
  - Add examples for each flag combination
  - Document /reconcile integration with 3 sources
- Add "Configuration" section:
  - Document review-config.yaml location and schema
  - Explain blocking rules customization
  - Show example config modifications
- Add "Understanding Results" section:
  - Explain unified report table
  - Define severity levels (critical, major, minor)
  - Explain ship decision logic
  - Document state files location
- Update "Troubleshooting" section:
  - Add: "Loop 3 always skipped" → check rate-limit-state.json
  - Add: "Ship blocked after passing review" → check stale state
  - Add: "Claude review timeout" → increase loop2.timeout in config

Restrictions:
- Do NOT remove existing content (only add/update)
- Do NOT include implementation details (user-facing only)
- Do NOT use jargon without definitions

Success Criteria:
- 4-loop architecture clearly explained
- All flags documented with examples
- Configuration options fully specified
- Troubleshooting covers common issues
- Document flows logically for new users
```

**Validation:**

```bash
# Check updated documentation structure
cat .claude/skills/code-review/SKILL.md | grep -E "^##"
# Expected: Sections for How It Works, Usage, Configuration, Understanding Results, Troubleshooting
```

---

### T019: Create Migration Guide

**Complexity:** Small
**Estimated Time:** 1 hour
**Dependencies:** T018
**Files:** `specs/4-loop-review-system/MIGRATION.md` (new)

**\_Prompt:**

```
Role: You are a technical writer creating a migration guide for existing users.

Task: Create `specs/4-loop-review-system/MIGRATION.md` with migration steps from old single-tool review to new 4-loop system.

Requirements:
- Structure:
  1. Introduction: What's changing and why
  2. Breaking Changes: List anything that no longer works
  3. Migration Steps: Step-by-step upgrade process
  4. New Features: What's now possible
  5. Configuration: How to customize new system
  6. Rollback: How to revert if needed
- Breaking changes to document:
  - Old CodeRabbit-only review removed
  - New state files in .claude/state/
  - New flags for /review command
  - /reconcile now requires --source flag (or auto-detects)
- Migration steps:
  1. Update .gitignore (add .claude/state/)
  2. Create .claude/config/review-config.yaml
  3. Run /review --all to initialize state
  4. Check ship gate works (/ship should read state)
  5. Test reconcile with each source
- Rollback: Revert to commit before merge, delete state files

Restrictions:
- Do NOT assume users have read design.md (explain everything)
- Do NOT skip rollback instructions (users need safety net)
- Do NOT use "simply" or "just" (avoid minimizing complexity)

Success Criteria:
- Migration steps are sequential and testable
- Breaking changes explicitly called out
- Rollback procedure is clear and safe
- New features highlighted with examples
```

**Validation:**

```bash
# Check migration guide exists and has required sections
cat specs/4-loop-review-system/MIGRATION.md | grep -E "^#"
# Expected: Headers for Introduction, Breaking Changes, Migration Steps, New Features, Configuration, Rollback
```

---

### T020: Create Testing Checklist

**Complexity:** Medium
**Estimated Time:** 1.5 hours
**Dependencies:** All previous tasks
**Files:** `specs/4-loop-review-system/TESTING.md` (new)

**\_Prompt:**

```
Role: You are a QA engineer creating a comprehensive test plan.

Task: Create `specs/4-loop-review-system/TESTING.md` with manual testing checklist for 4-loop review system.

Requirements:
- Structure:
  1. Unit Tests: List test cases for each lib file
  2. Integration Tests: Loop flow scenarios
  3. E2E Tests: Complete workflows (design → implement → review → ship)
  4. Manual Test Cases: Step-by-step validation
  5. Performance Tests: Timing benchmarks
  6. Regression Tests: Ensure old features still work
- Manual test cases (20+):
  - TC-001: Clean code passes all loops
  - TC-002: Lint error blocks at Loop 1 Tier 1
  - TC-003: Secrets block at Loop 1 Tier 2
  - TC-004: Build failure blocks at Loop 1 Tier 2
  - TC-005: Test failure blocks at Loop 1 Tier 2
  - TC-006: Claude critical finding blocks ship
  - TC-007: Claude major finding warns but allows ship
  - TC-008: CodeRabbit skipped when rate limited
  - TC-009: /review --free runs Loop 1 only
  - TC-010: /review --claude runs Loop 1+2
  - TC-011: /review --skip-cr skips Loop 3
  - TC-012: /reconcile --source claude applies fixes
  - TC-013: /reconcile --source pr fetches comments
  - TC-014: /ship reads state and blocks correctly
  - TC-015: New commit invalidates state
  - TC-016: Unified report displays all findings
  - TC-017: Progress spinners animate correctly
  - TC-018: Config customization works
  - TC-019: Rate limit state persists across runs
  - TC-020: Atomic writes prevent state corruption
- Each test case format:
```

### TC-XXX: Test Name

**Prerequisites:** ...
**Steps:** 1. ... 2. ... 3. ...
**Expected Result:** ...
**Actual Result:** [PASS|FAIL]

```

Restrictions:
- Do NOT write automated test code (checklist only)
- Do NOT skip prerequisites (tests must be reproducible)
- Do NOT assume clean state (include setup steps)

Success Criteria:
- All 20+ test cases clearly documented
- Each test case has prerequisites, steps, expected result
- Test cases cover happy path, error paths, edge cases
- Checklist is executable by any developer
```

**Validation:**

```bash
# Count test cases in checklist
grep -c "^### TC-" specs/4-loop-review-system/TESTING.md
# Expected: 20 or more
```

---

## Task Dependencies Graph

```
T001 ────┐
         ├─→ T003 ───┐
T002 ────┘           │
                      ├─→ T007 ───┐
T004 ─→ T005 ─→ T006 ┘            │
                                   ├─→ T014 ─→ T016 ─→ T017 ─→ T018 ─→ T019 ─→ T020
T009 ─────────────────────────────┤
                                   │
T007 ─────────────────→ T008 ─────┘
                        │
                        └─→ T010

T011 ─→ T012 ─→ T013 (parallel to main path)
T015 (parallel to T016)
```

---

## Complexity Summary

| Complexity | Count | Tasks                                                      |
| ---------- | ----- | ---------------------------------------------------------- |
| Small      | 5     | T002, T010, T015, T017, T019                               |
| Medium     | 10    | T001, T003, T004, T006, T008, T009, T011, T016, T018, T020 |
| Large      | 5     | T005, T007, T013, T014                                     |

**Total Estimated Time:** 32.5 hours (1 developer, assuming 8hr/day = 4 days)

---

## Execution Recommendations

1. **Phase 1 (Day 1):** T001-T003 (foundation)
2. **Phase 2 (Day 1-2):** T004-T006 (Claude integration)
3. **Phase 3 (Day 2):** T007-T010 (orchestration)
4. **Phase 4 (Day 3):** T011-T013 (reconcile) - can parallelize with Phase 5
5. **Phase 5 (Day 3):** T014-T017 (UI/UX)
6. **Phase 6 (Day 4):** T018-T020 (docs and testing)

**Critical Path:** Complete tasks in dependency order. T007 is the largest blocker (requires T002, T003, T005).

**Parallelization:** Phase 4 (reconcile) can be developed in parallel with Phase 5 (review UI) by different developers.

**Testing Strategy:** Write validation tests for each task immediately after completion. Run full manual test checklist (T020) at end of Phase 6.

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Ready for Implementation
