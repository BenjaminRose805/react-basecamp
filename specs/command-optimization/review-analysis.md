# /review Command Analysis

## 1. Command Flow

### What triggers the review?

The `/review` command is triggered directly by the user with the following usage patterns:

```bash
/review           # Review all uncommitted changes
/review --all     # Same as default
/review --free    # Loop 1 only (free, no AI)
/review --claude  # Loop 1 + 2, skip CodeRabbit
/review --skip-cr # Skip CodeRabbit
```

### The 4-Loop System

The review uses a **progressive validation architecture** with 4 loops:

| Loop      | Type                     | Duration   | Cost         | Purpose                                       |
| --------- | ------------------------ | ---------- | ------------ | --------------------------------------------- |
| Loop 1-T1 | Fast mechanical          | <30s       | Free         | Catch syntax errors (lint, typecheck, format) |
| Loop 1-T2 | Comprehensive mechanical | <2min      | Free         | Catch security/build/test failures            |
| Loop 2    | Claude Opus AI           | <3min      | API cost     | Deep code quality, architecture, security     |
| Loop 3    | CodeRabbit CLI           | <3min      | Rate-limited | Second opinion, specialized patterns          |
| Loop 4    | Async PR review          | Background | Free/Paid    | Safety net for missed issues                  |

**Progressive gates flow:**

```
Code Changes
    ↓
Loop 1-T1: Lint/Types/Format ─[FAIL]→ BLOCK
    ↓ [PASS]
Loop 1-T2: Secrets/Build/Test ─[FAIL]→ BLOCK
    ↓ [PASS]
Loop 2: Claude Opus Review ─[CRITICAL]→ BLOCK
    ↓ [PASS/MAJOR/MINOR]
Loop 3: CodeRabbit CLI ─[RATE LIMITED]→ SKIP
    ↓ [PASS/SKIP]
Ship Gate: ALLOW/BLOCK
```

### Sub-agents Spawned

Three sub-agents are spawned during review execution:

| Sub-agent         | Model  | Purpose                                      |
| ----------------- | ------ | -------------------------------------------- |
| review-researcher | haiku  | Analyze uncommitted changes, prepare context |
| review-executor   | sonnet | Run lint, typecheck, CodeRabbit              |
| review-reporter   | haiku  | Format and present results                   |

---

## 2. Review Scope

### Files Reviewed

- **All uncommitted changes** (both staged and unstaged)
- Uses `git diff --stat` for change summary
- Identifies scope: backend | frontend | docs | mixed

**Current limitation:** No support for reviewing specific files only.

### Checks Performed

| Loop  | Checks                                              |
| ----- | --------------------------------------------------- |
| L1-T1 | ESLint, TypeScript type checking, Prettier format   |
| L1-T2 | Secret detection, build validation, test execution  |
| L2    | Architecture patterns, code quality, security holes |
| L3    | CodeRabbit specialized patterns                     |

### Security Review

**YES** - Security is included via:

1. **Loop 1-T2**: Automated secret detection (hardcoded keys, passwords, URLs with credentials)
2. **Loop 2**: Claude Opus deep security analysis
3. **security-patterns skill**: OWASP Top 10 checklist when invoked by check-agent

Security checks from `security-patterns/SKILL.md`:

- Secret detection (API keys, passwords)
- Console.log leakage
- Input validation (Zod schemas)
- SQL injection prevention
- XSS prevention (dangerouslySetInnerHTML)
- Authentication verification
- Error message sanitization
- OWASP Top 10 compliance
- Dependency audit (`pnpm audit`)
- AI-specific: prompt injection, LLM output validation

---

## 3. Inputs/Outputs

### Arguments/Flags Supported

| Flag        | Description                      |
| ----------- | -------------------------------- |
| (none)      | Run all loops                    |
| `--all`     | Same as default                  |
| `--free`    | Loop 1 only (tier 1 + tier 2)    |
| `--claude`  | Loop 1 + Loop 2, skip CodeRabbit |
| `--skip-cr` | All loops except CodeRabbit      |

### Output Format

**Console output:** ASCII tables with:

- Loop status (PASS/FAIL/SKIP/WARN)
- Elapsed time per loop
- Categorized findings with file:line references
- Suggested fixes

**State files persisted:**

1. **`.claude/state/loop-state.json`**
   - Branch, commit, timestamp
   - Loop results with status and findings
   - `ship_allowed` boolean
   - `blockers` array

2. **`.claude/state/claude-review-results.json`**
   - Detailed findings from Claude review
   - Severity, category, file, line, message, fix

3. **`.claude/state/rate-limit-state.json`**
   - CodeRabbit rate limit tracking
   - Bucket counts per hour

### Severity Categorization

| Severity     | Ship Impact   | Examples                                    |
| ------------ | ------------- | ------------------------------------------- |
| **CRITICAL** | BLOCKS SHIP   | SQL injection, exposed secrets, auth bypass |
| **MAJOR**    | Warns, allows | Race conditions, missing error handling     |
| **MINOR**    | FYI only      | Missing comments, naming conventions        |

---

## 4. Integration

### /review → /ship Relationship

- **YES**, `/ship` reads `loop-state.json` to enforce ship gate
- Ships blocked if `ship_allowed: false`
- Staleness check: `head_commit` must match current HEAD
- If state stale after new commits, `/ship` errors with "Re-run /review"

```javascript
// From SKILL.md - pre-ship-check hook
if (!state.ship_allowed) {
  state.blockers.forEach((b) => console.error(`  - ${b}`));
  process.exit(1);
}
```

### /review → /reconcile Relationship

- **YES**, `/reconcile` can read review findings
- Source detection priority:
  1. `claude-review-results.json` (Loop 2 findings)
  2. `loop-state.json` (combined loop results)
  3. PR comments from GitHub API

Usage:

```bash
/reconcile --source claude   # Load Claude findings
/reconcile --source local    # Load loop-state
/reconcile --source pr       # Load PR comments
/reconcile                   # Auto-detect
```

### Is /review run automatically before /ship?

**Unclear from docs.** The integration exists via state files, but it's not explicit whether `/ship` auto-runs `/review` or just reads existing state. The staleness check suggests `/review` should be run manually before `/ship`.

---

## 5. Incremental Execution

### Review Specific Files Only?

**NO** - Not currently supported. The command always reviews "all uncommitted changes."

### Run Specific Check Types Only?

**PARTIAL** - Via flags:

| Flag        | Loops Executed     |
| ----------- | ------------------ |
| `--free`    | L1-T1 + L1-T2 only |
| `--claude`  | L1 + L2, skip L3   |
| `--skip-cr` | L1 + L2, skip L3   |

**Missing granularity:**

- No `--lint-only` flag
- No `--security-only` flag
- No `--test-only` flag

---

## 6. Optimization Opportunities

### Is review output actionable?

**YES** - Output includes:

- File path and line number
- Clear issue description
- Suggested fix

Example:

```
• src/components/Form.tsx:89
  Missing error boundary for async data fetching
  Fix: Wrap async component in <ErrorBoundary>
```

### Is it too verbose?

**Configurable** - Via `review-config.yaml`:

```yaml
output:
  unified_report: true # Combine findings from all loops
```

The unified report condenses findings but may still be verbose for large changesets.

### Summary vs Detailed Mode

**Not explicitly implemented.** Options exist:

- `--free` is effectively a "quick check" mode
- No `--summary` or `--verbose` flags

### Identified Improvement Areas

| Area                        | Current State                      | Opportunity                                         |
| --------------------------- | ---------------------------------- | --------------------------------------------------- |
| **File-specific review**    | Reviews all uncommitted changes    | Add `--files <glob>` or `--staged-only`             |
| **Check-type flags**        | Only loop-level flags              | Add `--security-only`, `--lint-only`, `--test-only` |
| **Caching**                 | No caching between reviews         | Cache unchanged file results                        |
| **Summary mode**            | Always full output                 | Add `--summary` for condensed view                  |
| **Security integration**    | Separate skill, unclear invocation | Clarify when security-patterns is used              |
| **Auto-review before ship** | Manual step required               | Consider auto-running if state stale                |
| **Parallel execution**      | Loops run sequentially             | L1-T1 checks could run in parallel                  |

### Structural Observations

1. **Dual Documentation**: Review logic split between `review.md` (command) and `code-review/SKILL.md` (skill). The 4-loop architecture is detailed in the skill but not referenced in the command.

2. **Agent Mismatch**: Command says "Load `.claude/agents/plan-agent.md`" but spawns `review-*` sub-agents. Unclear if plan-agent wraps these.

3. **Security Patterns Disconnection**: The `security-patterns/SKILL.md` lists check-agent usage but unclear how it integrates with Loop 2 Claude review.

4. **Rate Limit Opacity**: Rate limit state is tracked but not surfaced in preview. Users don't know remaining reviews before starting.

---

## Summary

The `/review` command implements a sophisticated 4-loop progressive validation system. It integrates well with `/ship` (via state files) and `/reconcile` (via findings). Security is comprehensively covered across multiple loops.

**Key gaps:**

- No file-specific reviews
- Limited check-type granularity
- No summary/verbose modes
- Documentation fragmentation between command and skill files
