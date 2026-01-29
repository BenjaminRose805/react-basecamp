# /ship Command Analysis

## 1. Command Flow

### Execution Path

```text
User invokes /ship
        │
        ├─► 0. VALIDATE GATE (Pre-execution)
        │   └─ user-prompt-ship.cjs hook checks .claude/state/loop-state.json
        │   └─ Validates: review exists, commit is current, ship_allowed === true
        │   └─ BLOCKED → Stop and show reason
        │   └─ APPROVED → Continue
        │
        ├─► Preview Display
        │   └─ Show branch, gate status, stages
        │   └─ [Enter] Run  [Esc] Cancel
        │
        ├─► 1. ANALYZE & COMMIT (git-writer / Sonnet)
        │   └─ git diff, git status, git log
        │   └─ Generate conventional commit message
        │   └─ git add <files>, git commit, git push
        │   └─ Return: { commit_hash, message, files_changed }
        │
        └─► 2. CREATE PR & MONITOR (git-executor / Haiku)
            └─ gh pr create --title "..." --body "..."
            └─ Poll CI status (30s interval, 30min timeout)
            └─ Poll CodeRabbit (30s interval, 10min timeout)
            └─ Return: { pr_url, ci_status, coderabbit_status, comments[] }
            │
            └─► Outcome:
                ├─ Clean (CI + CodeRabbit pass) → "Merge now? (yes/no)"
                ├─ Has Comments → "Run /plan to reconcile feedback"
                └─ CI Failed → "Run /plan to investigate and fix"
```

### Phases Summary

| Phase | Name                | Blocking | Description                   |
| ----- | ------------------- | -------- | ----------------------------- |
| 0     | Validate Gate       | Yes      | Hook-based review state check |
| 1     | Analyze & Commit    | Yes      | Diff analysis, commit, push   |
| 2     | Create PR & Monitor | Yes      | PR creation, CI/CR polling    |

### Orchestration

- **Primary Agent**: git-agent (orchestrator)
- **Sub-Agents**:
  - git-writer (Sonnet) - Phase 1
  - git-executor (Haiku) - Phase 2

---

## 2. Sub-Agent Spawning

### git-agent Invocation

From `/ship` command, git-agent is invoked via Task tool after:

1. Preview displayed
2. User confirms with [Enter]
3. Gate validation passed

### Sub-Agent Details

| Sub-Agent    | Model  | Invocation                          | Handoff Content                     |
| ------------ | ------ | ----------------------------------- | ----------------------------------- |
| git-writer   | Sonnet | Task tool with general-purpose type | Diff context, commit instructions   |
| git-executor | Haiku  | Task tool with general-purpose type | Commit hash, PR create instructions |

### Execution Model

- **Sequential** - Phase 1 must complete before Phase 2
- Phase 1 outputs (commit_hash) are required inputs for Phase 2

### Example Handoffs

**Phase 1 (git-writer):**

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze and commit changes",
  prompt: `Analyze git diff, generate conventional commit message, commit and push.
Run: git diff, git status, git add <files>, git commit -m "...", git push
Return: { commit_hash, message, files_changed }`,
  model: "sonnet",
});
```

**Phase 2 (git-executor):**

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Create PR and monitor CI",
  prompt: `Create PR and monitor status.
1. gh pr create --title "..." --body "..."
2. Poll: gh run list --branch X --limit 1 (30s interval, 30min timeout)
3. Poll: gh api repos/.../pulls/N/reviews (30s interval, 10min timeout)
Return: { pr_url, ci_status, coderabbit_status, comments[] }`,
  model: "haiku",
});
```

---

## 3. Quality Checks

### check-agent Relationship to /ship

**CRITICAL FINDING**: check-agent is NOT directly invoked by /ship.

Quality verification happens through:

1. **Pre-ship Gate**: `/review` command runs 4-loop validation, stores state in `.claude/state/loop-state.json`
2. **Ship Gate Hook**: `user-prompt-ship.cjs` validates review state exists and is current
3. **Post-PR CI**: CI pipeline runs checks remotely after PR creation

### check-agent Details (if invoked separately)

| Check    | Command                       | Blocking | Requirement             |
| -------- | ----------------------------- | -------- | ----------------------- |
| Build    | `pnpm build`                  | Yes      | Must compile            |
| Types    | `pnpm typecheck`              | Yes      | 0 errors                |
| Lint     | `pnpm lint`                   | Yes      | 0 errors                |
| Tests    | `pnpm test:run --coverage`    | Yes      | All pass, 70%+ coverage |
| Security | grep for secrets, console.log | Yes      | No issues               |

### check-agent Sub-Agent

- **quality-runner** (Haiku) - Runs all checks sequentially

### Failure Handling

- Build failure: STOP immediately
- Any other failure: Report and block

---

## 4. Inputs/Outputs

### Arguments/Flags

| Flag      | Description                              | Status     |
| --------- | ---------------------------------------- | ---------- |
| `--force` | Bypass ship gate (emergency)             | Documented |
| `--draft` | Create draft PR (in pr-operations skill) | Implied    |
| `--merge` | Auto-merge after CI passes               | Not found  |

**Note**: `$ARGUMENTS` placeholder exists in ship.md but no full flag documentation.

### Files Read

| File                            | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `.claude/state/loop-state.json` | Review state for ship gate          |
| `start-status.json`             | Environment verification (optional) |
| Git working tree                | For diff/status analysis            |

### Files Created

| Output     | Description                             |
| ---------- | --------------------------------------- |
| Git commit | Conventional commit with Co-Authored-By |
| GitHub PR  | Title, body, linked to branch           |

### Commit Message Source

- Generated by git-writer (Sonnet) from:
  - `git diff` analysis
  - `git log --oneline -5` for style matching
  - Conventional commit format
  - Always includes `Co-Authored-By: Claude <noreply@anthropic.com>`

---

## 5. Incremental Execution

### Current State

| Capability                      | Supported | Notes                            |
| ------------------------------- | --------- | -------------------------------- |
| Run ONLY commit (no PR)         | **NO**    | Phases are coupled               |
| Run ONLY checks (no commit)     | **NO**    | Use /review instead              |
| Run ONLY PR creation (no merge) | **YES**   | Default behavior (no auto-merge) |
| `--step` flag                   | **NO**    | Does not exist                   |
| Pause before merge              | **YES**   | "Merge now? (yes/no)" prompt     |

### Flow Rigidity

The /ship command is **all-or-nothing** from commit through PR creation:

1. Once confirmed, commit happens immediately
2. Push follows commit automatically
3. PR creation follows push automatically
4. Only pause point is the final merge prompt

### Missing Incremental Capabilities

- No `--commit-only` to stage and commit without PR
- No `--push-only` to push existing commit
- No `--pr-only` to create PR from already-pushed branch
- No checkpoints between phases

---

## 6. Preview/Confirmation

### Current Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship                                                      │
├─────────────────────────────────────────────────────────────┤
│  Branch: feature/[name]                                     │
│  Gate: ✅ APPROVED (or 🚫 BLOCKED)                          │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 0. VALIDATE GATE                                        ││
│  │ 1. ANALYZE & COMMIT (git-writer / Sonnet)               ││
│  │ 2. CREATE PR & MONITOR (git-executor / Haiku)           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

### Confirmation Points

| Point           | Type        | User Action     |
| --------------- | ----------- | --------------- |
| Initial preview | Blocking    | [Enter] / [Esc] |
| Before commit   | **MISSING** | N/A             |
| Before PR       | **MISSING** | N/A             |
| Before merge    | Blocking    | yes/no prompt   |

### Missing Previews

1. **Commit Message Preview**: User cannot see/edit commit message before it's created
2. **PR Description Preview**: User cannot see/edit PR body before creation
3. **Files Preview**: No preview of which files will be included in commit
4. **Diff Preview**: No inline diff shown (relies on user having run `git diff` themselves)

---

## 7. Optimization Opportunities

### 7.1 Rigidity Issues

| Issue                     | Impact                               |
| ------------------------- | ------------------------------------ |
| No granular sub-commands  | Can't commit without PR              |
| No pause between phases   | No chance to review before PR        |
| No commit message preview | User can't verify/edit before commit |
| No PR description preview | User can't verify/edit before create |

### 7.2 Potential Granular Sub-Commands

```text
/ship --commit-only    # Stage, commit, stop
/ship --push-only      # Push existing commits, stop
/ship --pr-only        # Create PR from pushed branch
/ship --step           # Pause between each phase
/ship --preview        # Show what would happen without executing
```

### 7.3 check-agent Reusability

**Current State**: check-agent exists separately but is NOT integrated into /ship.

**Opportunity**:

- Make check-agent invocable as `/check` command
- Allow /ship to optionally run checks via `--with-checks` flag
- Or require checks to pass (via /review) as current gate does

### 7.4 Preview Enhancements

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship                                                      │
├─────────────────────────────────────────────────────────────┤
│  COMMIT PREVIEW                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ feat: add user authentication                           ││
│  │                                                         ││
│  │ - Add login form component                              ││
│  │ - Add auth API routes                                   ││
│  │                                                         ││
│  │ Files: src/lib/auth.ts (+150, -20)                      ││
│  │        src/components/LoginForm.tsx (+80)               ││
│  │        src/server/routers/auth.ts (+45)                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Commit  [E] Edit  [Esc] Cancel                     │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 Integration Points

| Command | Integration Opportunity                   |
| ------- | ----------------------------------------- |
| /review | Already integrated via ship gate          |
| /check  | Could add `--with-checks` to run pre-ship |
| /start  | Environment status already injected       |
| /plan   | Suggested for reconciling feedback        |

### 7.6 Architectural Observations

1. **Gate System**: Well-designed, uses hooks for validation
2. **Sub-Agent Pattern**: Follows project conventions (orchestrator + sub-agents)
3. **Model Selection**: Appropriate (Sonnet for analysis, Haiku for execution)
4. **Safety Rules**: Documented (no force push, no --no-verify)
5. **Outcome Handling**: Clear paths for success, comments, and failure

### 7.7 Recommended Improvements (Priority Order)

1. **HIGH**: Add commit message preview with edit option
2. **HIGH**: Add PR description preview with edit option
3. **MEDIUM**: Add `--commit-only` flag for staged commits
4. **MEDIUM**: Add `--step` mode for phase-by-phase execution
5. **LOW**: Add `--preview` for dry-run mode
6. **LOW**: Add direct `/check` command using check-agent

---

## Summary

| Dimension             | Current State         | Improvement Needed           |
| --------------------- | --------------------- | ---------------------------- |
| Command Flow          | Well-structured       | Minor                        |
| Sub-Agent Spawning    | Correct pattern       | None                         |
| Quality Checks        | Decoupled via /review | Consider tighter integration |
| Inputs/Outputs        | Basic flags only      | More flags needed            |
| Incremental Execution | Not supported         | **Major**                    |
| Preview/Confirmation  | Basic preview only    | **Major**                    |

**Key Finding**: The /ship command is well-architected but lacks flexibility for incremental execution and content preview. Users cannot review or edit commit messages or PR descriptions before they are created, and there's no way to run partial workflows.
