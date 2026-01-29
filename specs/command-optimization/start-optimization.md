# /start Command Optimization

**Phase 2 Optimization** | **Date:** 2026-01-28

---

## 1. Preview System

### Comparison with Other Commands

| Command    | Preview Format | Gate Status? | Stage Details? | Key/Action Display |
| ---------- | -------------- | ------------ | -------------- | ------------------ |
| /start     | ASCII box      | No           | Yes (models)   | `[Enter]/[Esc]`    |
| /design    | ASCII box      | No           | Yes (phases)   | `[Enter]/[Esc]`    |
| /implement | ASCII box      | No           | Yes (routing)  | `[Enter]/[Esc]`    |
| /ship      | ASCII box      | **Yes**      | Yes (stages)   | `[Enter]/[Esc]`    |
| /review    | **Unclear**    | N/A          | N/A            | N/A                |

### Best Preview Implementation: /ship

/ship's preview is superior because:

1. Shows **gate status** (APPROVED/BLOCKED) before execution
2. Shows **branch context** clearly
3. Includes **stage models** (Sonnet/Haiku)

### Proposed Preview Format for /start

Adopt /ship's pattern with gate-like status for prerequisites:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /start - Begin Work                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ CONTEXT                                                               │
│   Working Dir: /home/user/my-app                                      │
│   Target Branch: feature/user-authentication                          │
│   Worktree Path: ../my-app--user-authentication                       │
│                                                                       │
│ PREREQUISITES                                                         │
│   ✓ Working directory clean                                           │
│   ✓ Branch name available                                             │
│   ✓ Worktree path available                                           │
│   ✓ Critical dependencies (node, pnpm, git)                           │
│                                                                       │
│ STAGES                                                                │
│   0. VALIDATE STATE (Haiku)                                           │
│      → Verify prerequisites                                           │
│   1. SETUP WORKTREE (Haiku)                                           │
│      → git worktree add ../my-app--user-authentication                │
│   2. VERIFY ENVIRONMENT (Haiku)                                       │
│      → Run environment checks, generate report                        │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel  [D] Dry-run                                │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Improvements:**

1. Add **PREREQUISITES** section (early validation before confirmation)
2. Add **[D] Dry-run** option
3. Show **target branch and worktree path** prominently
4. Follow unified format from cross-command-analysis

---

## 2. Progress Indicators

### Comparison with Other Commands

| Command    | Progress Bar? | Stage Indicators | Elapsed Time? | Completion % |
| ---------- | ------------- | ---------------- | ------------- | ------------ |
| /start     | Yes (doc)     | ✓ ● ○            | Yes           | Yes          |
| /design    | Yes (doc)     | ✓ ● ○            | Yes           | Yes          |
| /implement | Yes (skill)   | ✓ ● ○            | Implied       | Implied      |
| /ship      | Yes (doc)     | ✓ ● ○            | Yes           | Yes          |
| /review    | Loop-based    | ✓ ✗              | Yes           | Loop N/4     |

### Best Progress Implementation: Cross-Command Standard

The cross-command-analysis proposes a unified template. /start already follows this closely.

### Proposed Progress Output for /start

**Stage 0 Progress:**

```text
/start user-authentication                                    [RUNNING]

Stage 0/2: VALIDATE STATE
  ● Running: git-validator (Haiku)
  ├── Checking working directory...
  └── Elapsed: 0.3s

[==========--------------------] 17% | Stage 0/2 | 0.3s elapsed
```

**Stage 1 Progress:**

```text
/start user-authentication                                    [RUNNING]

Stage 1/2: SETUP WORKTREE
  ● Running: git-worktree-creator (Haiku)
  ├── Creating worktree at ../my-app--user-authentication
  └── Elapsed: 1.2s

Stage Status:
  ✓ Stage 0: VALIDATE STATE (0.5s)
  ● Stage 1: SETUP WORKTREE (in progress)
  ○ Stage 2: VERIFY ENVIRONMENT (pending)

[==================------------] 50% | Stage 1/2 | 1.7s elapsed
```

**Stage 2 Progress:**

```text
/start user-authentication                                    [RUNNING]

Stage 2/2: VERIFY ENVIRONMENT
  ● Running: git-environment (Haiku)
  ├── Running environment-check.cjs...
  ├── Checking dependencies...
  └── Elapsed: 3.5s

Stage Status:
  ✓ Stage 0: VALIDATE STATE (0.5s)
  ✓ Stage 1: SETUP WORKTREE (1.2s)
  ● Stage 2: VERIFY ENVIRONMENT (in progress)

[==========================----] 83% | Stage 2/2 | 5.2s elapsed
```

**Key Improvements:**

1. Show **stage N/M** instead of just stage name
2. Show **sub-agent name and model** clearly
3. Include **accumulated stage status** below current action
4. Match cross-command unified format

---

## 3. Output Format

### Comparison with Other Commands

| Command    | Success Format   | Failure Format   | Next Steps? | State File?         |
| ---------- | ---------------- | ---------------- | ----------- | ------------------- |
| /start     | Boxed report     | Boxed report     | Yes         | `start-status.json` |
| /design    | Markdown summary | Issue list       | Yes         | No                  |
| /implement | Files changed    | Error details    | No          | No                  |
| /ship      | PR URL + status  | Error + recovery | Yes         | Reads only          |
| /review    | Loop results     | Blockers list    | Yes         | Multiple JSON       |

### Best Output Implementation: /ship + /review

- **/ship** has clear outcome paths (Clean/Comments/Failed)
- **/review** writes structured JSON for downstream commands

### Proposed Unified Output for /start

**Success Case:**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /start user-authentication                              [COMPLETE]   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ENVIRONMENT VERIFICATION                                              │
│   ✓ pnpm 9.15.4                                                       │
│   ✓ node v22.13.1                                                     │
│   ✓ git 2.48.1                                                        │
│                                                                       │
│ TOOLING CHECKS                                                        │
│   ✓ gh 2.40.0 (authenticated as user)                                 │
│   ✓ coderabbit 1.2.0 (authenticated)                                  │
│                                                                       │
│ WORKTREE SETUP                                                        │
│   ✓ Worktree created at ../my-app--user-authentication                │
│   ✓ Branch feature/user-authentication created                        │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ STATUS: ready                                                         │
│ State: .claude/state/start-status.json                                │
│ Duration: 6.2s                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ NEXT STEPS                                                            │
│   1. cd ../my-app--user-authentication                                │
│   2. Restart your Claude Code session in the new directory            │
│   3. Run /design to begin planning                                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Failure Case:**

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /start user-authentication                               [ISSUES]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ENVIRONMENT VERIFICATION                                              │
│   ✓ pnpm 9.15.4                                                       │
│   ✓ node v22.13.1                                                     │
│   ✓ git 2.48.1                                                        │
│                                                                       │
│ TOOLING CHECKS                                                        │
│   ✗ Lint check failed (3 errors)                                      │
│   ✗ Type check failed (1 error)                                       │
│   ✓ Tests passed                                                      │
│                                                                       │
│ WORKTREE SETUP                                                        │
│   ✓ Worktree created at ../my-app--user-authentication                │
│   ✓ Branch feature/user-authentication created                        │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ STATUS: issues (non-blocking)                                         │
│ State: .claude/state/start-status.json                                │
│ Duration: 8.4s                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ ISSUES FOUND                                                          │
│   1. Lint errors: Run `pnpm lint --fix` to auto-fix                   │
│   2. Type errors: Review .claude/state/start-status.json              │
│                                                                       │
│ RECOVERY OPTIONS                                                      │
│   • Fix issues, then run /design                                      │
│   • Proceed anyway (worktree created successfully)                    │
│                                                                       │
│ NEXT STEPS                                                            │
│   1. cd ../my-app--user-authentication                                │
│   2. Review: cat .claude/state/start-status.json                      │
│   3. Fix issues or proceed with /design                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Improvements:**

1. Add **Duration** in status section
2. Move state file to **`.claude/state/`** (consistency)
3. Add **ISSUES FOUND** section with specific remediation
4. Add **RECOVERY OPTIONS** matching /ship pattern

---

## 4. State Persistence

### Comparison with Other Commands

| Command    | State File(s)                   | Location         | Purpose                          |
| ---------- | ------------------------------- | ---------------- | -------------------------------- |
| /start     | `start-status.json`             | Root             | Env verification                 |
| /design    | None (proposed checkpoint.json) | -                | -                                |
| /implement | None (proposed checkpoint.json) | -                | -                                |
| /ship      | Reads `loop-state.json`         | `.claude/state/` | Gate check                       |
| /review    | 3 JSON files                    | `.claude/state/` | Loop state, results, rate limits |

### Best State Implementation: /review

/review is the gold standard:

- Uses `.claude/state/` directory consistently
- Writes structured JSON with clear schemas
- Enables downstream commands to read state

### Proposed State File for /start

**Location:** `.claude/state/start-status.json`

**Schema:**

```json
{
  "version": 1,
  "command": "start",
  "feature": "user-authentication",
  "timestamp": "2026-01-28T10:30:00Z",
  "duration_ms": 6200,

  "worktree": {
    "path": "../my-app--user-authentication",
    "branch": "feature/user-authentication",
    "created": true
  },

  "environment": {
    "status": "ready",
    "dependencies": {
      "pnpm": { "version": "9.15.4", "status": "ok" },
      "node": { "version": "22.13.1", "status": "ok" },
      "git": { "version": "2.48.1", "status": "ok" }
    },
    "tooling": {
      "gh": { "installed": true, "version": "2.40.0", "authenticated": true },
      "coderabbit": {
        "installed": true,
        "version": "1.2.0",
        "authenticated": true
      }
    },
    "verification": {
      "lint": { "status": "pass", "errors": 0, "warnings": 0 },
      "typecheck": { "status": "pass", "errors": 0 },
      "tests": { "status": "pass", "passed": 42, "failed": 0 }
    }
  },

  "issues": [],

  "next_command": "/design"
}
```

**What /design Should Read:**

```typescript
// In /design orchestrator:
const startStatus = readJSON(".claude/state/start-status.json");

if (startStatus) {
  // Validate we're in the correct worktree
  if (process.cwd() !== path.resolve(startStatus.worktree.path)) {
    warn("Not in expected worktree. Run from: " + startStatus.worktree.path);
  }

  // Warn about environment issues
  if (startStatus.environment.status !== "ready") {
    warn("Environment has issues. Review: cat .claude/state/start-status.json");
  }

  // Use feature name for spec directory
  const specDir = `specs/${startStatus.feature}`;
}
```

---

## 5. Script Usage

### Inline Logic That Could Become Scripts

| Current Logic                | Proposed Script                    | Benefit                                   |
| ---------------------------- | ---------------------------------- | ----------------------------------------- |
| Stage 0: Prerequisite checks | `validate-start-prereqs.cjs`       | Reusable for --dry-run, pre-preview check |
| Worktree path computation    | Add to `lib/git-utils.cjs`         | Already has git utilities                 |
| State file writing           | Already in `environment-check.cjs` | Just change output path                   |

### Scripts from Other Commands to Reuse

| Existing Script                       | Owner  | Reusable For /start?                    |
| ------------------------------------- | ------ | --------------------------------------- |
| `lib/git-utils.cjs`                   | /start | Already used - add worktree path helper |
| `lib/verification-utils.cjs`          | /start | Already used                            |
| `user-prompt-ship.cjs` (gate pattern) | /ship  | Model for prerequisite gate             |

### Proposed New Script: `validate-start-prereqs.cjs`

```javascript
/**
 * Validate /start prerequisites without executing
 * Used for: preview, --dry-run, Stage 0
 */
const { isGitRepo, getGitStatus } = require("./lib/git-utils.cjs");
const { commandExists } = require("./lib/utils.cjs");
const fs = require("fs");
const path = require("path");

function validatePrereqs(featureName, options = {}) {
  const result = {
    valid: true,
    blockers: [],
    warnings: [],
    computed: {},
  };

  // Compute worktree path
  const repoName = path.basename(process.cwd());
  const worktreePath = path.resolve("..", `${repoName}--${featureName}`);
  result.computed.worktreePath = worktreePath;
  result.computed.branchName = `feature/${featureName}`;

  // Check 1: Git repo
  if (!isGitRepo()) {
    result.valid = false;
    result.blockers.push("Not a git repository");
    return result;
  }

  // Check 2: Working directory clean (unless --force)
  if (!options.force) {
    const status = getGitStatus("json");
    if (!status.clean) {
      result.valid = false;
      result.blockers.push("Dirty working directory (use --force to bypass)");
    }
  }

  // Check 3: Branch doesn't exist
  // ... (git branch check)

  // Check 4: Worktree path available
  if (fs.existsSync(worktreePath)) {
    result.valid = false;
    result.blockers.push(`Worktree path exists: ${worktreePath}`);
  }

  // Check 5: Critical dependencies
  ["node", "pnpm", "git"].forEach((dep) => {
    if (!commandExists(dep)) {
      result.valid = false;
      result.blockers.push(`Missing dependency: ${dep}`);
    }
  });

  return result;
}

module.exports = { validatePrereqs };
```

---

## Deliverables Summary

### 1. Proposed File Changes

| File                                         | Change Type | Description                             |
| -------------------------------------------- | ----------- | --------------------------------------- |
| `.claude/commands/start.md`                  | Modify      | Update preview format, add --dry-run    |
| `.claude/scripts/validate-start-prereqs.cjs` | Create      | Extract Stage 0 logic                   |
| `.claude/scripts/environment-check.cjs`      | Modify      | Output to `.claude/state/`              |
| `.claude/docs/troubleshooting/start.md`      | Create      | Move 108 lines of troubleshooting       |
| `.claude/agents/git-agent.md`                | Modify      | Reference new script, update state path |

### 2. Unified Patterns Adopted

| Pattern                               | Source Command | Adoption                               |
| ------------------------------------- | -------------- | -------------------------------------- |
| Gate/prerequisites display in preview | /ship          | Show prerequisite checks before stages |
| State file in `.claude/state/`        | /review        | Move `start-status.json`               |
| ISSUES FOUND + RECOVERY OPTIONS       | /ship          | Add to failure output                  |
| Stage N/M progress format             | Cross-command  | Standardize progress display           |
| `[D] Dry-run` option in preview       | Proposed       | New capability                         |
| Structured JSON state file            | /review        | Add schema version, timestamps         |

### 3. /start-Specific Optimizations

| Optimization                              | Benefit                                    | Priority |
| ----------------------------------------- | ------------------------------------------ | -------- |
| Pre-validate prerequisites before preview | Fast failure, better UX                    | High     |
| Add `--dry-run` flag                      | CI integration, debugging                  | High     |
| Move troubleshooting to docs              | Reduce command file from 402 to ~294 lines | Medium   |
| Add worktree path helper to git-utils     | Reusable, testable                         | Medium   |
| Include `next_command` in state file      | Handoff to /design                         | Medium   |
| Add `duration_ms` to state                | Telemetry/debugging                        | Low      |

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)

1. Move `start-status.json` to `.claude/state/start-status.json`
2. Update state file schema with version and timestamps
3. Move troubleshooting section to `.claude/docs/troubleshooting/start.md`

### Phase 2: Core Improvements (2-4 hours)

4. Create `validate-start-prereqs.cjs` script
5. Update preview to show prerequisites before stages
6. Add `--dry-run` flag using new script
7. Update progress output to show Stage N/M format

### Phase 3: Polish (1-2 hours)

8. Add `next_command` field to state file
9. Update /design to read start state (separate PR)
10. Remove duplicate Task tool examples from command (reference git-agent.md)
