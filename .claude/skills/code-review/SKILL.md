---
name: code-review
description: Execute local code review with 4-loop progressive validation.
---

# Code Review Skill

Run comprehensive code review using a layered 4-loop architecture that balances speed, cost, and thoroughness.

## Overview

The 4-loop review system provides progressive validation gates:

### Loop Architecture

| Loop              | Type                     | Duration   | Cost         | Purpose                                            |
| ----------------- | ------------------------ | ---------- | ------------ | -------------------------------------------------- |
| **Loop 1 Tier 1** | Fast mechanical          | <30s       | Free         | Catch syntax errors (lint, typecheck, format)      |
| **Loop 1 Tier 2** | Comprehensive mechanical | <2min      | Free         | Catch security/build/test failures                 |
| **Loop 2**        | Claude Opus AI           | <3min      | API cost     | Deep code quality, architecture, security analysis |
| **Loop 3**        | CodeRabbit CLI           | <3min      | Rate-limited | Second opinion, specialized patterns               |
| **Loop 4**        | Async PR review          | Background | Free/Paid    | Safety net for missed issues                       |

### Progressive Gates

```
Code Changes
    ↓
Loop 1-T1: Lint/Types/Format ─[FAIL]→ BLOCK (fix syntax first)
    ↓ [PASS]
Loop 1-T2: Secrets/Build/Test ─[FAIL]→ BLOCK (fix security/build)
    ↓ [PASS]
Loop 2: Claude Opus Review ─[CRITICAL]→ BLOCK (fix critical issues)
    ↓ [PASS/MAJOR/MINOR]
Loop 3: CodeRabbit CLI ─[RATE LIMITED]→ SKIP (continue)
    ↓ [PASS/SKIP]
Ship Gate: Check combined results → ALLOW/BLOCK
```

## Usage

### Run All Loops (Default)

```bash
/review
# or
/review --all
```

Executes all 4 loops in sequence, stopping early if blocking issues found.

### Run Free Checks Only

```bash
/review --free
```

Runs only Loop 1 (tier 1 + tier 2). Use for fast iteration before committing.

### Run Free + Claude Review

```bash
/review --claude
```

Runs Loop 1 + Loop 2, skipping CodeRabbit. Use when you want AI review but want to preserve CodeRabbit rate limit.

### Skip CodeRabbit

```bash
/review --skip-cr
```

Runs all loops except Loop 3 (CodeRabbit). Use when rate limit is low or CodeRabbit is unavailable.

## Configuration

### Review Config File

Location: `.claude/config/review-config.yaml`

```yaml
# Loop 1 Configuration
loop1:
  tier1_timeout: 30 # seconds
  tier2_timeout: 120 # seconds
  parallel_tier1: true # Run lint/types/format in parallel
  fail_fast_tier2: true # Stop on first tier 2 failure

# Loop 2 Configuration
loop2:
  enabled: true
  model: opus # opus | sonnet | haiku
  spawn_fresh_context: true # Use sub-agent with clean context
  include_specs: true # Include specs/ files in context
  include_commits: 5 # Number of recent commits to include

# Loop 3 Configuration
loop3:
  enabled: true
  rate_limit_per_hour: 8 # Max CodeRabbit reviews per hour
  skip_on_rate_limit: true # Skip instead of blocking
  block_on_new_issues: false # false = warn only, true = block ship

# Blocking Rules
blocking:
  critical_blocks_ship: true # Critical findings block ship
  major_blocks_ship: false # Major findings warn only
  minor_blocks_ship: false # Minor findings FYI only
  secrets_block_ship: true # Detected secrets always block
  build_failure_blocks_ship: true # Build failures always block
  test_failure_blocks_ship: true # Test failures always block

# Output
output:
  show_progress_spinners: true
  show_elapsed_time: true
  unified_report: true # Combine findings from all loops
  save_logs: true

# Paths
paths:
  state_dir: .claude/state
  log_dir: .claude/logs
  config_dir: .claude/config
```

### Customizing Configuration

**Example: Disable Claude review, keep CodeRabbit only:**

```yaml
loop2:
  enabled: false
loop3:
  enabled: true
  rate_limit_per_hour: 8
```

**Example: Block on major findings:**

```yaml
blocking:
  critical_blocks_ship: true
  major_blocks_ship: true # Changed from false
  minor_blocks_ship: false
```

**Example: Reduce timeouts for faster feedback:**

```yaml
loop1:
  tier1_timeout: 20 # Reduced from 30s
  tier2_timeout: 90 # Reduced from 120s
```

## Understanding Results

### Unified Report Format

After all loops complete, you'll see a unified findings table:

```
┌─────────────┬──────────┬─────────┬────────────────────────────────────────┐
│ Loop        │ Status   │ Time    │ Finding                                │
├─────────────┼──────────┼─────────┼────────────────────────────────────────┤
│ L1-Tier1    │ PASS     │ 15s     │ Lint: 0 errors, Typecheck: 0 errors    │
│ L1-Tier2    │ PASS     │ 87s     │ Secrets: 0, Build: ✓, Tests: 82.5%    │
│ L2-Claude   │ WARN     │ 145s    │ 3 findings: 0 critical, 2 major, 1 minor│
│ L3-CodeRbt  │ SKIP     │ 0s      │ Rate limited (5/8 used this hour)      │
├─────────────┼──────────┼─────────┼────────────────────────────────────────┤
│ Ship Gate   │ ALLOWED  │         │ No blocking issues found               │
└─────────────┴──────────┴─────────┴────────────────────────────────────────┘

MAJOR (2):
  • src/components/Form.tsx:89
    Missing error boundary for async data fetching
    Fix: Wrap async component in <ErrorBoundary>

  • src/lib/cache.ts:23
    Race condition in concurrent cache updates
    Fix: Add mutex lock or atomic update pattern

MINOR (1):
  • src/hooks/useAuth.ts:67
    Missing JSDoc comment for exported hook
    Fix: Add /** Hook description */
```

### Severity Levels

| Severity     | Description                             | Ship Impact        | Example                                               |
| ------------ | --------------------------------------- | ------------------ | ----------------------------------------------------- |
| **Critical** | Security holes, data loss risks         | **BLOCKS SHIP**    | SQL injection, exposed secrets, auth bypass           |
| **Major**    | Bugs, performance issues, poor patterns | Warns, allows ship | Race conditions, missing error handling, memory leaks |
| **Minor**    | Style, docs, nitpicks                   | FYI only           | Missing comments, unused imports, naming conventions  |

### Ship Decision Logic

The ship gate checks the following conditions:

1. **Loop 1 Tier 1 FAIL** → BLOCK (must pass lint/typecheck/format)
2. **Loop 1 Tier 2 FAIL** → BLOCK (must pass secrets/build/tests)
3. **Loop 2 Critical findings** → BLOCK (must fix critical issues)
4. **Loop 2 Major findings** → WARN (can ship, but consider fixing)
5. **Loop 3 SKIP** → Continue (no impact on ship gate)
6. **All PASS** → ALLOW

### State Files

Review results are persisted to state files for integration with other commands:

**`.claude/state/loop-state.json`**

```json
{
  "version": "1.0",
  "branch": "feature/xyz",
  "head_commit": "abc123",
  "timestamp": "2026-01-28T10:30:00Z",
  "loops": {
    "loop1_tier1": { "status": "pass", "elapsed_ms": 15420, "details": {...} },
    "loop1_tier2": { "status": "pass", "elapsed_ms": 87340, "details": {...} },
    "loop2_claude": { "status": "pass", "elapsed_ms": 145000, "findings": [...] },
    "loop3_coderabbit": { "status": "skip", "reason": "rate_limit_exceeded" }
  },
  "ship_allowed": true,
  "blockers": []
}
```

**`.claude/state/claude-review-results.json`**

```json
{
  "timestamp": "2026-01-28T10:34:07Z",
  "findings": [
    {
      "severity": "major",
      "category": "architecture",
      "file": "src/components/Form.tsx",
      "line": 89,
      "message": "Missing error boundary for async data fetching",
      "fix": "Wrap async component in <ErrorBoundary>"
    }
  ]
}
```

**`.claude/state/rate-limit-state.json`**

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

## Integration with Other Commands

### /reconcile Integration

The `/reconcile` command can read review findings from multiple sources:

```bash
# Load findings from Claude review
/reconcile --source claude

# Load findings from combined loop state
/reconcile --source local

# Load findings from PR review comments
/reconcile --source pr

# Auto-detect best source
/reconcile
```

**Source Detection Priority:**

1. Check `claude-review-results.json` for Loop 2 findings
2. Check `loop-state.json` for combined loop results
3. Fetch PR comments from GitHub API
4. If none found, report no feedback to reconcile

### /ship Integration

The `/ship` command reads `loop-state.json` to enforce ship gate:

```javascript
// .claude/scripts/hooks/pre-ship-check.cjs
const state = readState(".claude/state/loop-state.json");

if (!state.ship_allowed) {
  console.error("Ship blocked by review findings:");
  state.blockers.forEach((b) => console.error(`  - ${b}`));
  process.exit(1);
}

// Also check if state is stale
const currentCommit = execSync("git rev-parse HEAD").toString().trim();
if (state.head_commit !== currentCommit) {
  console.error("Review state is stale. Re-run /review after new commits.");
  process.exit(1);
}
```

### /implement Integration

Fix issues automatically by reading state files:

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Fix code review issues",
  prompt: `
    Read .claude/state/claude-review-results.json and fix all CRITICAL and MAJOR findings.
    For each finding, apply the suggested fix and add tests if needed.
  `,
  model: "sonnet",
});
```

## Troubleshooting

### Loop 3 Always Skipped

**Symptom:** CodeRabbit review never runs, always shows "SKIP"

**Diagnosis:** Check rate limit state:

```bash
cat .claude/state/rate-limit-state.json
```

**Solutions:**

- If rate limited: Wait until next hour bucket
- If `--skip-cr` flag used: Remove flag
- If CodeRabbit not installed: Run `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`
- If not authenticated: Run `coderabbit auth login`

### Ship Blocked After Passing Review

**Symptom:** Review shows "ALLOWED" but `/ship` blocks

**Diagnosis:** State may be stale due to new commits

**Solution:**

```bash
# Check current commit vs review state commit
git rev-parse HEAD
cat .claude/state/loop-state.json | grep head_commit

# If different, re-run review
/review
```

### Claude Review Timeout

**Symptom:** Loop 2 hangs or times out after 5 minutes

**Diagnosis:** Large diff or complex codebase causing Claude to exceed timeout

**Solutions:**

- Increase timeout in config:
  ```yaml
  loop2:
    timeout: 600 # 10 minutes instead of default 5
  ```
- Split changes into smaller commits
- Use `--free` flag to skip Claude review temporarily

### False Positive Secrets Detected

**Symptom:** Secret scanner flags fake secrets in tests or examples

**Diagnosis:** Scanner pattern matches test fixtures

**Solutions:**

- Add file to exclusion list (loop 1 tier 2 config)
- Use `.env.example` naming convention (auto-excluded)
- Add comment above fake secret: `# Example API key for testing`

### Missing pnpm Scripts

**Symptom:** Loop 1 fails with "script not found"

**Diagnosis:** Required scripts not defined in package.json

**Solution:** Add missing scripts to package.json:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "build": "next build"
  }
}
```

### State File Corruption

**Symptom:** Review crashes with JSON parse error

**Diagnosis:** State file corrupted (incomplete write)

**Solution:**

```bash
# Remove corrupted state files
rm .claude/state/loop-state.json
rm .claude/state/claude-review-results.json
rm .claude/state/rate-limit-state.json

# Re-run review to regenerate
/review
```

## Quality Gates

| Check             | Requirement    | Blocking  | Loop  |
| ----------------- | -------------- | --------- | ----- |
| Lint              | 0 errors       | Yes       | L1-T1 |
| Typecheck         | 0 errors       | Yes       | L1-T1 |
| Format            | All files pass | Yes       | L1-T1 |
| Secrets           | 0 matches      | Yes       | L1-T2 |
| Build             | Exit code 0    | Yes       | L1-T2 |
| Tests             | Exit code 0    | Yes       | L1-T2 |
| Critical findings | 0 issues       | Yes       | L2    |
| Major findings    | Any            | No (warn) | L2    |
| Minor findings    | Any            | No (FYI)  | L2/L3 |
