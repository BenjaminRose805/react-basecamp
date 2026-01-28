# Design Document: 4-Loop Review System

## 1. Architecture Overview

### 1.1 System Context

The 4-loop review system replaces single-tool code review with a layered, progressive validation strategy that balances speed, cost, and thoroughness.

```
┌─────────────────────────────────────────────────────────────────┐
│                        /review Command                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────────────┐
│              user-prompt-review.cjs (Orchestrator)              │
│  - Parse flags (--free, --claude, --skip-cr, --all)            │
│  - Load review-config.yaml                                      │
│  - Initialize loop-controller.cjs                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 v
        ┌────────┴────────┐
        │ Loop Controller │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┬────────────┬────────────┐
    v            v            v            v            v
┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────────┐
│Loop 1 │  │Loop 1 │  │Loop 2 │  │Loop 3 │  │  State    │
│Tier 1 │─▶│Tier 2 │─▶│Claude │─▶│CodeRbt│─▶│Persistence│
│<30s   │  │<2min  │  │Opus   │  │(RL)   │  │           │
└───────┘  └───────┘  └───────┘  └───────┘  └───────────┘
   │          │          │          │             │
   └──────────┴──────────┴──────────┴─────────────┘
                         │
                         v
                ┌────────────────┐
                │ Unified Report │
                │  Ship Gate     │
                └────────────────┘
```

### 1.2 Loop Progression Flow

**Decision Points:**

1. Loop 1 Tier 1 fail → **STOP** (fix lint/types/format)
2. Loop 1 Tier 2 fail → **STOP** (fix secrets/build/tests)
3. Loop 2 critical → **BLOCK SHIP** (fix Claude findings)
4. Loop 3 rate limit → **SKIP** (proceed to ship)
5. Loop 3 new issues → **WARN** or **BLOCK** (configurable)
6. All pass → **ALLOW SHIP**

### 1.3 Data Flow

```
Input: Git diff, staged files, branch context
  ↓
Loop 1 Tier 1: Parallel execution
  ├→ pnpm lint → exit code, stdout/stderr
  ├→ pnpm typecheck → exit code, stdout/stderr
  └→ pnpm format:check → exit code, stdout/stderr
  ↓
Loop 1 Tier 2: Sequential with early exit
  ├→ secret-scanner.cjs → matched patterns[]
  ├→ pnpm build → exit code, stdout/stderr
  └→ pnpm test → exit code, coverage%
  ↓
Loop 2: Claude sub-agent
  Input: { diff, fileTree, commits, specs, reviewerPersona }
  Output: { findings: [{ severity, category, file, line, message, fix }] }
  ↓
Loop 3: CodeRabbit CLI (conditional)
  Check: rate-limit-state.json, --skip-cr flag
  Input: git diff | coderabbit review
  Output: { issues: [{ severity, file, line, message }] }
  ↓
State Persistence:
  loop-state.json (combined status)
  claude-review-results.json (Loop 2 details)
  rate-limit-state.json (Loop 3 quota)
  ↓
Output: Unified findings report + ship gate decision
```

## 2. Component Design

### 2.1 Loop Controller (loop-controller.cjs)

**Purpose:** Orchestrate loop execution, manage state transitions, enforce gates.

**Key Functions:**

```javascript
class LoopController {
  constructor(config, stateDir) {}

  async executeLoop1Tier1() {
    // Parallel: lint, typecheck, format
    // Return: { status: 'pass'|'fail', details: {...}, elapsed: ms }
  }

  async executeLoop1Tier2() {
    // Sequential: secrets, build, test
    // Early exit on first failure
    // Return: { status: 'pass'|'fail', details: {...}, elapsed: ms }
  }

  async executeLoop2() {
    // Spawn Claude Opus sub-agent via Task tool
    // Return: { status: 'pass'|'fail'|'skip', findings: [...], elapsed: ms }
  }

  async executeLoop3() {
    // Check rate limit, spawn CodeRabbit
    // Return: { status: 'pass'|'fail'|'skip', findings: [...], elapsed: ms }
  }

  getShipDecision() {
    // Read loop-state.json
    // Apply blocking rules from config
    // Return: { allowed: boolean, blockers: [...] }
  }

  saveState(loopResults) {
    // Atomic write to loop-state.json
  }

  invalidateState() {
    // Called when new commits detected
  }
}
```

**State Schema (loop-state.json):**

```json
{
  "version": "1.0",
  "branch": "feature/xyz",
  "head_commit": "abc123",
  "timestamp": "2026-01-28T10:30:00Z",
  "loops": {
    "loop1_tier1": {
      "status": "pass",
      "elapsed_ms": 15420,
      "details": {
        "lint": { "status": "pass", "warnings": 0 },
        "typecheck": { "status": "pass", "errors": 0 },
        "format": { "status": "pass", "files_checked": 42 }
      }
    },
    "loop1_tier2": {
      "status": "pass",
      "elapsed_ms": 87340,
      "details": {
        "secrets": { "status": "pass", "patterns_checked": 7, "matches": 0 },
        "build": { "status": "pass" },
        "test": { "status": "pass", "coverage": 82.5 }
      }
    },
    "loop2_claude": {
      "status": "pass",
      "elapsed_ms": 145000,
      "findings": [
        {
          "severity": "minor",
          "category": "docs",
          "file": "src/components/Button.tsx",
          "line": 12,
          "message": "Missing JSDoc for exported component",
          "fix": "Add /** Component description */"
        }
      ]
    },
    "loop3_coderabbit": {
      "status": "skip",
      "reason": "rate_limit_exceeded",
      "elapsed_ms": 0
    }
  },
  "ship_allowed": true,
  "blockers": []
}
```

### 2.2 Free Checks Runner (free-checks.cjs)

**Purpose:** Execute Loop 1 tier 1 and tier 2 mechanical checks.

**Key Functions:**

```javascript
async function runTier1Checks() {
  // Parallel execution using Promise.all
  const [lintResult, typecheckResult, formatResult] = await Promise.all([
    execPnpmScript("lint"),
    execPnpmScript("typecheck"),
    execPnpmScript("format:check"),
  ]);

  return {
    status: allPassed ? "pass" : "fail",
    details: {
      lint: lintResult,
      typecheck: typecheckResult,
      format: formatResult,
    },
  };
}

async function runTier2Checks() {
  // Sequential with early exit
  const secretsResult = await runSecretScanner();
  if (secretsResult.status === "fail") {
    return { status: "fail", details: { secrets: secretsResult } };
  }

  const buildResult = await execPnpmScript("build");
  if (buildResult.exitCode !== 0) {
    return {
      status: "fail",
      details: { secrets: secretsResult, build: buildResult },
    };
  }

  const testResult = await execPnpmScript("test");
  return {
    status: testResult.exitCode === 0 ? "pass" : "fail",
    details: { secrets: secretsResult, build: buildResult, test: testResult },
  };
}

async function execPnpmScript(scriptName) {
  // Execute pnpm run {scriptName}
  // Capture stdout, stderr, exit code
  // Return normalized result object
}
```

**Error Handling:**

- Missing script → log warning, treat as skip
- Script timeout (tier 1: 30s, tier 2: 2min) → treat as fail
- Process crash → log error, treat as fail

### 2.3 Secret Scanner (secret-scanner.cjs)

**Purpose:** Detect hardcoded secrets in staged files.

**Patterns (7 types):**

```javascript
const SECRET_PATTERNS = [
  {
    name: "Generic API Key",
    regex:
      /(?:api[_-]?key|apikey|api[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: "critical",
  },
  {
    name: "Private Key",
    regex: /-----BEGIN\s+(?:RSA|EC|OPENSSH|DSA)\s+PRIVATE\s+KEY-----/gi,
    severity: "critical",
  },
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: "critical",
  },
  {
    name: "GitHub Token",
    regex: /gh[oprsu]_[A-Za-z0-9_]{36,}/g,
    severity: "critical",
  },
  {
    name: "Database URL",
    regex: /(?:postgres|mysql|mongodb):\/\/[^\s"']+/gi,
    severity: "high",
  },
  {
    name: "JWT Secret",
    regex: /(?:jwt[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: "critical",
  },
  {
    name: "OAuth Client Secret",
    regex:
      /(?:client[_-]?secret|oauth[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: "critical",
  },
];

async function scanFiles(files) {
  const matches = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    for (const pattern of SECRET_PATTERNS) {
      const lineMatches = findMatches(content, pattern);
      matches.push(...lineMatches.map((m) => ({ file, ...m })));
    }
  }
  return {
    status: matches.length > 0 ? "fail" : "pass",
    matches,
  };
}
```

**Exclusions:**

- `.env.example` files
- Test fixtures with fake secrets
- Comments with example secrets

### 2.4 Claude Reviewer (claude-reviewer.cjs)

**Purpose:** Spawn Claude Opus sub-agent with reviewer persona.

**Key Functions:**

```javascript
async function runClaudeReview(context) {
  const reviewPrompt = buildReviewPrompt(context);

  // Spawn sub-agent via Task tool
  const taskResult = await Task({
    subagent_type: "general-purpose",
    model: "opus",
    description: "Code review with Claude Opus",
    prompt: reviewPrompt,
  });

  const findings = parseClaudeOutput(taskResult.output);

  await fs.writeFile(
    ".claude/state/claude-review-results.json",
    JSON.stringify(findings, null, 2)
  );

  return {
    status: hasCriticalFindings(findings) ? "fail" : "pass",
    findings,
  };
}

function buildReviewPrompt(context) {
  return `
You are a senior code reviewer with expertise in ${context.tech_stack}.

CONTEXT:
- Diff: ${context.diff}
- Files changed: ${context.files}
- Recent commits: ${context.commits}
- Spec files: ${context.specs}

REVIEW FOCUS:
1. Code Quality: complexity, readability, maintainability
2. Architecture: patterns, separation of concerns, SOLID principles
3. Security: input validation, auth checks, data exposure
4. Testing: coverage, edge cases, integration points
5. Documentation: JSDoc, README updates, inline comments

OUTPUT FORMAT (JSON):
{
  "findings": [
    {
      "severity": "critical|major|minor",
      "category": "quality|architecture|security|testing|docs",
      "file": "path/to/file.ts",
      "line": 42,
      "message": "Clear description of issue",
      "fix": "Actionable suggestion for resolution"
    }
  ]
}

BLOCKING RULES:
- Critical severity = block ship
- Major severity = warn but allow ship
- Minor severity = FYI only
`;
}
```

**Context Loading:**

- Use Git tool to get staged diff
- Use Glob to get file tree for changed directories
- Use Read to load spec files from specs/ matching feature name
- Extract last 5 commits for branch context

### 2.5 Rate Limit Tracker (rate-limit-tracker.cjs)

**Purpose:** Track CodeRabbit API usage, enforce hourly quota.

**Key Functions:**

```javascript
class RateLimitTracker {
  constructor(stateFile, limit = 8) {
    this.stateFile = stateFile; // .claude/state/rate-limit-state.json
    this.limit = limit; // reviews per hour
  }

  async canExecute() {
    const state = await this.loadState();
    const currentHour = this.getCurrentHourBucket();
    const hourlyUsage = state.buckets[currentHour] || 0;
    return hourlyUsage < this.limit;
  }

  async recordExecution() {
    const state = await this.loadState();
    const currentHour = this.getCurrentHourBucket();
    state.buckets[currentHour] = (state.buckets[currentHour] || 0) + 1;
    state.total_executions++;
    state.last_execution = new Date().toISOString();
    await this.saveState(state);
  }

  async getRemainingQuota() {
    const state = await this.loadState();
    const currentHour = this.getCurrentHourBucket();
    const used = state.buckets[currentHour] || 0;
    return this.limit - used;
  }

  getCurrentHourBucket() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  }

  async cleanupOldBuckets() {
    // Remove buckets older than 2 hours
    const state = await this.loadState();
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    state.buckets = Object.fromEntries(
      Object.entries(state.buckets).filter(([bucket, _]) => {
        const bucketTime = this.parseBucketTime(bucket);
        return bucketTime > cutoff;
      })
    );
    await this.saveState(state);
  }
}
```

**State Schema (rate-limit-state.json):**

```json
{
  "version": "1.0",
  "limit_per_hour": 8,
  "buckets": {
    "2026-1-28-10": 3,
    "2026-1-28-11": 5
  },
  "total_executions": 127,
  "last_execution": "2026-01-28T11:45:00Z"
}
```

### 2.6 Configuration (review-config.yaml)

**Purpose:** Centralize configurable parameters for all loops.

**Schema:**

```yaml
# Loop 1 Configuration
loop1:
  tier1_timeout: 30 # seconds
  tier2_timeout: 120 # seconds
  parallel_tier1: true
  fail_fast_tier2: true

# Loop 2 Configuration
loop2:
  enabled: true
  model: opus # opus | sonnet | haiku
  spawn_fresh_context: true
  include_specs: true
  include_commits: 5

# Loop 3 Configuration
loop3:
  enabled: true
  rate_limit_per_hour: 8
  skip_on_rate_limit: true
  block_on_new_issues: false # false = warn only

# Blocking Rules
blocking:
  critical_blocks_ship: true
  major_blocks_ship: false
  minor_blocks_ship: false
  secrets_block_ship: true
  build_failure_blocks_ship: true
  test_failure_blocks_ship: true

# Output
output:
  show_progress_spinners: true
  show_elapsed_time: true
  unified_report: true
  save_logs: true

# Paths
paths:
  state_dir: .claude/state
  log_dir: .claude/logs
  config_dir: .claude/config
```

## 3. Integration Points

### 3.1 Command Updates

**user-prompt-review.cjs:**

- Parse flags: `--free`, `--claude`, `--skip-cr`, `--all`
- Load `review-config.yaml`
- Instantiate `LoopController`
- Execute loops based on flags
- Display unified report
- Return exit code (0 = pass, 1 = fail)

**reconcile.md:**
Add source detection logic:

```javascript
async function detectReconcileSource() {
  if (await fs.exists('.claude/state/claude-review-results.json')) {
    const results = JSON.parse(await fs.readFile('...');
    if (results.findings.length > 0) return 'claude';
  }

  if (await fs.exists('.claude/state/loop-state.json')) {
    const state = JSON.parse(await fs.readFile('...');
    if (!state.ship_allowed) return 'local';
  }

  const prComments = await fetchPRComments();
  if (prComments.length > 0) return 'pr';

  return null;
}
```

**review.md:**
Update skill description to document 4 loops and flags.

### 3.2 Ship Gate Integration

**.claude/scripts/hooks/pre-ship-check.cjs:**

```javascript
async function checkShipAllowed() {
  const stateFile = ".claude/state/loop-state.json";
  if (!(await fs.exists(stateFile))) {
    console.warn("No review state found. Run /review first.");
    return false;
  }

  const state = JSON.parse(await fs.readFile(stateFile));

  // Check if state is stale (head commit changed)
  const currentCommit = execSync("git rev-parse HEAD").toString().trim();
  if (state.head_commit !== currentCommit) {
    console.error("Review state is stale. Re-run /review after new commits.");
    return false;
  }

  if (!state.ship_allowed) {
    console.error("Ship blocked by review findings:");
    state.blockers.forEach((b) => console.error(`  - ${b}`));
    return false;
  }

  return true;
}
```

## 4. Error Handling Strategy

### 4.1 Graceful Degradation

**Loop 1 Failures:**

- Missing pnpm script → Skip check, log warning, continue
- Timeout → Treat as fail, block progression
- Process crash → Log error, treat as fail

**Loop 2 Failures:**

- Claude API error → Retry 3x with backoff, then skip
- Parse error → Log raw output, treat as skip
- Timeout (5min) → Kill sub-agent, treat as skip

**Loop 3 Failures:**

- Rate limit exceeded → Skip, log reason, continue
- CodeRabbit CLI missing → Skip, log warning, continue
- API error → Skip, log error, continue

### 4.2 State Corruption Recovery

**Atomic Writes:**

```javascript
async function atomicWrite(file, data) {
  const tempFile = `${file}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
  await fs.rename(tempFile, file); // Atomic on POSIX systems
}
```

**State Validation:**

```javascript
async function loadState(file) {
  try {
    const content = await fs.readFile(file, "utf-8");
    const state = JSON.parse(content);
    validateStateSchema(state);
    return state;
  } catch (error) {
    console.warn(`Invalid state file ${file}, resetting...`);
    return getDefaultState();
  }
}
```

### 4.3 Logging

**Log Format (.claude/logs/review-{timestamp}.log):**

```
2026-01-28T10:30:00Z [INFO] Review started (branch: feature/xyz)
2026-01-28T10:30:00Z [INFO] Loop 1 Tier 1: Starting parallel checks...
2026-01-28T10:30:15Z [INFO] Loop 1 Tier 1: lint PASS (0 warnings)
2026-01-28T10:30:15Z [INFO] Loop 1 Tier 1: typecheck PASS (0 errors)
2026-01-28T10:30:15Z [INFO] Loop 1 Tier 1: format PASS (42 files)
2026-01-28T10:30:15Z [INFO] Loop 1 Tier 1: PASS (15.4s)
2026-01-28T10:30:15Z [INFO] Loop 1 Tier 2: Starting sequential checks...
2026-01-28T10:30:16Z [INFO] Loop 1 Tier 2: secrets PASS (0 matches)
2026-01-28T10:30:45Z [INFO] Loop 1 Tier 2: build PASS
2026-01-28T10:31:42Z [INFO] Loop 1 Tier 2: test PASS (82.5% coverage)
2026-01-28T10:31:42Z [INFO] Loop 1 Tier 2: PASS (87.3s)
2026-01-28T10:31:42Z [INFO] Loop 2: Spawning Claude Opus reviewer...
2026-01-28T10:34:07Z [INFO] Loop 2: PASS (145s, 3 minor findings)
2026-01-28T10:34:07Z [INFO] Loop 3: Checking rate limit...
2026-01-28T10:34:07Z [WARN] Loop 3: SKIP (rate limit: 5/8 used this hour, --skip-cr flag)
2026-01-28T10:34:07Z [INFO] Review complete: SHIP ALLOWED
```

## 5. Performance Considerations

### 5.1 Optimization Strategies

**Parallel Execution:**

- Loop 1 Tier 1: Run lint, typecheck, format in parallel (3x speedup)
- Use worker threads for secret scanning large files

**Caching:**

- Cache typecheck results per file (TypeScript incremental builds)
- Cache test results for unchanged test files
- Skip Loop 2/3 if Loop 1 state unchanged and recent (<1hr)

**Incremental Checks:**

- Only scan secrets in staged files (not entire repo)
- Only run tests affected by changed files (if configured)
- Only include changed files in Claude context

### 5.2 Timeout Management

| Loop  | Timeout | Action on Timeout       |
| ----- | ------- | ----------------------- |
| L1-T1 | 30s     | Fail, block progression |
| L1-T2 | 2min    | Fail, block progression |
| L2    | 5min    | Skip, log warning       |
| L3    | 3min    | Skip, log warning       |

## 6. Security Considerations

**Secret Scanner:**

- Use constant-time comparison for secret validation
- Redact matched secrets in logs (show only first 4 chars)
- Never write matched secrets to state files

**State Files:**

- Store in `.claude/state/` (gitignored)
- Use file permissions 0600 (owner read/write only)
- Validate JSON schema on load to prevent injection

**Claude Context:**

- Sanitize file paths before passing to sub-agent
- Limit diff size to prevent prompt injection (max 10k lines)
- Filter out `.env` files from context

## 7. Testing Strategy

### 7.1 Unit Tests

**free-checks.cjs:**

- Test parallel execution of tier 1 checks
- Test early exit on tier 2 failures
- Test timeout handling
- Mock pnpm script execution

**secret-scanner.cjs:**

- Test each of 7 secret patterns with positive cases
- Test false positive filtering (.env.example)
- Test multi-file scanning
- Test line number accuracy

**rate-limit-tracker.cjs:**

- Test hourly bucket calculation
- Test quota enforcement
- Test bucket cleanup
- Test state persistence

### 7.2 Integration Tests

**Loop Flow:**

- Test full 4-loop execution with passing code
- Test early exit on Loop 1 failure
- Test Loop 3 skip on rate limit
- Test state invalidation on new commit

**Ship Gate:**

- Test ship block on critical findings
- Test ship allow after all loops pass
- Test stale state detection

### 7.3 E2E Tests

**Scenarios:**

1. Clean code → All loops pass → Ship allowed
2. Lint errors → Loop 1 fail → Ship blocked
3. Secrets detected → Loop 1 fail → Ship blocked
4. Claude critical finding → Loop 2 fail → Ship blocked
5. Rate limit hit → Loop 3 skip → Ship allowed (if L2 passed)
6. PR feedback → Reconcile → Re-run Loop 1

## 8. Deployment Plan

**Phase 1: Core Infrastructure (T001-T003)**

- Deploy secret-scanner.cjs
- Deploy free-checks.cjs (tier 1+2)
- Test in isolation

**Phase 2: Claude Integration (T004-T006)**

- Deploy claude-reviewer.cjs
- Test with real diffs
- Tune reviewer prompt

**Phase 3: Orchestration (T007-T010)**

- Deploy loop-controller.cjs
- Deploy rate-limit-tracker.cjs
- Test full 4-loop flow

**Phase 4: Command Updates (T011-T017)**

- Update user-prompt-review.cjs
- Update reconcile.md
- Add ship gate check

**Phase 5: Documentation (T018-T020)**

- Deploy review-config.yaml with defaults
- Update code-review/SKILL.md
- Create migration guide

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Draft
