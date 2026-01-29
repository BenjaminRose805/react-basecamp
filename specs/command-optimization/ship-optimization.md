# /ship Command Optimization

**Phase 2** | **Date:** 2026-01-28

---

## 1. Cross-Command Comparison

### Incremental Execution Comparison

| Command    | Incremental Support | Mechanism                         |
| ---------- | ------------------- | --------------------------------- |
| /start     | No                  | All 3 stages run sequentially     |
| /design    | No                  | No phase flags, no checkpoints    |
| /research  | N/A                 | Single-phase command              |
| /reconcile | No                  | No phase flags                    |
| /implement | No (CRITICAL)       | No task-by-task, no checkpoints   |
| /review    | **Partial**         | `--free`, `--claude`, `--skip-cr` |
| /ship      | No                  | All-or-nothing commit→PR          |

**Key Finding**: /review is the ONLY command with any incremental execution (via loop-level flags). All other commands, including /ship, are monolithic.

### Preview/Confirmation Comparison

| Command    | Preview Documented | Content Preview | Edit Option |
| ---------- | ------------------ | --------------- | ----------- |
| /start     | Yes (ASCII box)    | No              | No          |
| /design    | Yes (ASCII box)    | No              | No          |
| /research  | Yes (ASCII box)    | No              | No          |
| /reconcile | Yes (skill-based)  | No              | No          |
| /implement | Yes (routing)      | No              | No          |
| /review    | Unclear            | No              | No          |
| /ship      | Yes (ASCII box)    | **No**          | **No**      |

**Key Finding**: NO command previews generated content (commit messages, PR descriptions, design docs) before creation. This is a systemic gap, but most impactful for /ship where content is immediately pushed to git/GitHub.

### State File Comparison

| Command    | State Files Written | Location          | Purpose                         |
| ---------- | ------------------- | ----------------- | ------------------------------- |
| /start     | 1 (partial)         | `{root}/` (wrong) | Environment status              |
| /design    | 0                   | -                 | -                               |
| /research  | 0                   | -                 | -                               |
| /reconcile | 0                   | -                 | -                               |
| /implement | 0                   | -                 | -                               |
| /review    | **3**               | `.claude/state/`  | Loop state, results, rate limit |
| /ship      | 0 (reads only)      | -                 | Reads loop-state.json           |

**Key Finding**: /review has the most mature state management. /ship should adopt similar patterns for checkpoint/resume capability.

### Sub-Agent Consistency

| Command    | Orchestrator | Sub-Agent Pattern       | Models Used         |
| ---------- | ------------ | ----------------------- | ------------------- |
| /start     | git-agent    | 3× Haiku                | Haiku only          |
| /design    | plan-agent   | Opus×3 → Sonnet → Haiku | Opus, Sonnet, Haiku |
| /implement | code/ui/docs | Opus → Sonnet → Haiku   | Opus, Sonnet, Haiku |
| /review    | -            | Haiku×2, Sonnet         | Haiku, Sonnet       |
| /ship      | git-agent    | Sonnet → Haiku          | Sonnet, Haiku       |

**Finding**: /ship follows the correct sub-agent spawning pattern. Model selection is appropriate (Sonnet for analysis/commit generation, Haiku for execution/polling).

---

## 2. Proposed Changes

### 2.1 Command File Updates

#### `.claude/commands/ship.md`

| Change                   | Description                                     | Priority |
| ------------------------ | ----------------------------------------------- | -------- |
| Add `--commit-only` flag | Stop after commit, don't create PR              | HIGH     |
| Add `--pr-only` flag     | Create PR from existing pushed branch           | HIGH     |
| Add `--step` flag        | Pause between phases for review                 | MEDIUM   |
| Add `--dry-run` flag     | Show what would happen without executing        | MEDIUM   |
| Add commit preview phase | Show generated commit message before committing | HIGH     |
| Add PR preview phase     | Show generated PR description before creating   | HIGH     |
| Add `--edit` flag        | Open editor for commit/PR message               | LOW      |

#### `.claude/agents/git-agent.md`

| Change                 | Description                               | Priority |
| ---------------------- | ----------------------------------------- | -------- |
| Add checkpoint support | Write ship-checkpoint.json between phases | HIGH     |
| Add preview sub-agent  | New preview phase before commit/PR        | HIGH     |
| Document phase outputs | Explicit JSON schemas for each phase      | MEDIUM   |

### 2.2 New Files

#### `.claude/state/ship-checkpoint.json` (Schema)

```json
{
  "command": "ship",
  "feature": "user-auth",
  "branch": "feature/user-auth",
  "started_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:05:00Z",
  "phases": {
    "gate": {
      "status": "complete",
      "completed_at": "2026-01-28T10:00:05Z",
      "result": "APPROVED"
    },
    "commit": {
      "status": "complete",
      "completed_at": "2026-01-28T10:02:00Z",
      "commit_hash": "abc1234",
      "message": "feat: add user authentication",
      "files_changed": 5
    },
    "push": {
      "status": "complete",
      "completed_at": "2026-01-28T10:02:10Z"
    },
    "pr": {
      "status": "in_progress",
      "pr_number": null,
      "pr_url": null
    },
    "monitor": {
      "status": "pending",
      "ci_status": null,
      "coderabbit_status": null
    }
  },
  "resume_from": "pr"
}
```

#### `.claude/sub-agents/git/git-previewer.md` (New Sub-Agent)

```markdown
# Sub-Agent: git-previewer

Generate and display commit/PR content for user review before execution.

## Model

**sonnet** - Requires quality content generation

## Input

- git diff, git log for context
- Previous phase context_summary

## Output

- Generated commit message
- Generated PR title/body
- User confirmation (proceed/edit/cancel)
```

### 2.3 Skill Updates

#### `.claude/skills/preview/SKILL.md`

| Change                   | Description                             | Priority |
| ------------------------ | --------------------------------------- | -------- |
| Add content preview mode | Preview generated text, not just stages | HIGH     |
| Add edit interaction     | `[E] Edit` option with editor support   | LOW      |

---

## 3. Unified Patterns Adopted

### 3.1 Checkpoint Schema (From Cross-Command Analysis)

Adopting the unified checkpoint schema from `cross-command-analysis.md`:

```typescript
interface ShipCheckpoint {
  command: "ship";
  feature: string;
  version: 1;

  started_at: string;
  updated_at: string;

  state: {
    current_phase: "gate" | "preview" | "commit" | "push" | "pr" | "monitor";
    completed_phases: string[];
    pending_phases: string[];
  };

  phases: {
    gate: PhaseResult;
    preview?: PreviewResult;
    commit?: CommitResult;
    push?: PushResult;
    pr?: PRResult;
    monitor?: MonitorResult;
  };

  gate: {
    ship_allowed: boolean;
    blockers: string[];
    head_commit: string;
  };
}
```

### 3.2 Preview Template (Unified Format)

Adopting the unified preview format:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /ship - Commit, Push, Create PR                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CONTEXT                                                              │
│   Working Dir: /home/user/project                                    │
│   Branch: feature/user-auth                                          │
│   Gate: ✅ APPROVED                                                  │
│                                                                      │
│ STAGES                                                               │
│   0. VALIDATE GATE (hook)                                            │
│      → Check review state from loop-state.json                       │
│   1. PREVIEW (git-previewer / Sonnet)                                │
│      → Generate commit message and PR description                    │
│   2. COMMIT (git-writer / Sonnet)                                    │
│      → Stage, commit, push changes                                   │
│   3. CREATE PR (git-executor / Haiku)                                │
│      → Create PR, monitor CI/CodeRabbit                              │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel  [?] Help                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Progress Template (Unified Format)

```text
/ship - Commit, Push, Create PR

Stage 2/4: PREVIEW
  ● Running: git-previewer (Sonnet)
  ├── Analyzing diff...
  └── Elapsed: 5s

[====================          ] 50% | Stage 2/4 | 15s elapsed

Stage Status:
  ✓ Stage 0: VALIDATE GATE (0.5s)
  ✓ Stage 1: PREVIEW (8s)
  ● Stage 2: COMMIT (in progress)
  ○ Stage 3: CREATE PR (pending)
```

### 3.4 Error Template (Unified Format)

```text
┌─ ERROR ──────────────────────────────────────────────────────────────┐
│ Stage: COMMIT                                                        │
│ Sub-agent: git-writer (Sonnet)                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Error: Push rejected - remote contains work you do not have locally  │
├──────────────────────────────────────────────────────────────────────┤
│ Recovery Options:                                                    │
│   1. Run: git pull --rebase origin feature/user-auth                 │
│   2. Run: /ship --resume (after resolving)                           │
│                                                                      │
│ Checkpoint saved to: .claude/state/ship-checkpoint.json              │
│ To resume: /ship --resume                                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. /ship-Specific Optimizations

### 4.1 Incremental Phase Architecture

**New Phase Structure:**

```text
/ship [flags]
    │
    ├─► Phase 0: VALIDATE GATE (existing)
    │   └─ Hook: user-prompt-ship.cjs
    │   └─ Check: .claude/state/loop-state.json
    │   └─ BLOCKED → Stop | APPROVED → Continue
    │
    ├─► Phase 1: PREVIEW (NEW)
    │   └─ Sub-agent: git-previewer (Sonnet)
    │   └─ Generate: commit message, PR title, PR body
    │   └─ Display: content preview
    │   └─ User: [Enter] Proceed | [E] Edit | [Esc] Cancel
    │   └─ Write: ship-checkpoint.json
    │
    ├─► Phase 2: COMMIT (with checkpoint)
    │   └─ Sub-agent: git-writer (Sonnet)
    │   └─ Execute: git add, git commit
    │   └─ Write: ship-checkpoint.json (commit_hash)
    │   └─ [--commit-only] → Stop here
    │
    ├─► Phase 3: PUSH (with checkpoint)
    │   └─ Sub-agent: git-writer (Sonnet)
    │   └─ Execute: git push -u origin <branch>
    │   └─ Write: ship-checkpoint.json (pushed: true)
    │
    ├─► Phase 4: CREATE PR (with checkpoint)
    │   └─ Sub-agent: git-executor (Haiku)
    │   └─ Execute: gh pr create
    │   └─ Write: ship-checkpoint.json (pr_number, pr_url)
    │   └─ [--pr-only] → Start from here (if already pushed)
    │
    └─► Phase 5: MONITOR (existing)
        └─ Sub-agent: git-executor (Haiku)
        └─ Poll: CI status, CodeRabbit reviews
        └─ Outcome: SHIPPED | HAS_COMMENTS | CI_FAILED
        └─ Write: ship-checkpoint.json (final status)
```

### 4.2 New Flags

| Flag             | Behavior                     | Phases Executed                 |
| ---------------- | ---------------------------- | ------------------------------- |
| (none)           | Full flow                    | 0 → 1 → 2 → 3 → 4 → 5           |
| `--commit-only`  | Commit without PR            | 0 → 1 → 2                       |
| `--push-only`    | Push existing commit         | 0 → 3                           |
| `--pr-only`      | Create PR from pushed branch | 0 → 1 → 4 → 5                   |
| `--step`         | Pause after each phase       | 0 → [pause] → 1 → [pause] → ... |
| `--resume`       | Resume from checkpoint       | checkpoint.resume_from → end    |
| `--dry-run`      | Preview only, no execution   | 0 → 1 (display only)            |
| `--skip-preview` | Skip content preview         | 0 → 2 → 3 → 4 → 5               |
| `--force`        | Bypass gate (emergency)      | All phases, no gate check       |

### 4.3 Content Preview Implementation

**Commit Message Preview:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ COMMIT PREVIEW                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ feat: add user authentication                                       │
│                                                                     │
│ - Add login form component with validation                          │
│ - Add auth API routes (login, logout, register)                     │
│ - Add session management with JWT tokens                            │
│                                                                     │
│ Co-Authored-By: Claude <noreply@anthropic.com>                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Files to commit:                                                    │
│   M  src/components/LoginForm.tsx       (+150, -0)                  │
│   M  src/server/routers/auth.ts         (+200, -10)                 │
│   A  src/lib/auth.ts                    (+80, -0)                   │
│   A  src/lib/__tests__/auth.test.ts     (+120, -0)                  │
├─────────────────────────────────────────────────────────────────────┤
│ [Enter] Proceed  [E] Edit  [Esc] Cancel                             │
└─────────────────────────────────────────────────────────────────────┘
```

**PR Description Preview:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ PR PREVIEW                                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Title: feat: add user authentication                                │
│                                                                     │
│ ## Summary                                                          │
│                                                                     │
│ - Add login form component with email/password validation           │
│ - Add auth API routes (login, logout, register)                     │
│ - Add session management with JWT tokens                            │
│                                                                     │
│ ## Test Plan                                                        │
│                                                                     │
│ - [x] Unit tests for auth utilities (100% coverage)                 │
│ - [x] Type checks pass                                              │
│ - [x] Lint checks pass                                              │
│ - [ ] Manual testing: login flow                                    │
│                                                                     │
│ 🤖 Generated with Claude Code                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Enter] Create PR  [E] Edit  [Esc] Cancel                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4 Resume Capability

**Resume Flow:**

```text
/ship --resume
    │
    ├─► Read: .claude/state/ship-checkpoint.json
    │
    ├─► Check: resume_from phase
    │   └─ "commit" → Resume at Phase 2
    │   └─ "push" → Resume at Phase 3
    │   └─ "pr" → Resume at Phase 4
    │   └─ "monitor" → Resume at Phase 5
    │
    ├─► Display: Resume preview
    │   └─ "Resuming /ship from Phase 3 (PUSH)"
    │   └─ "Completed phases: GATE, PREVIEW, COMMIT"
    │   └─ "Remaining phases: PUSH, CREATE PR, MONITOR"
    │
    └─► Execute: Remaining phases
```

**Resume Preview:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│ /ship --resume                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ CHECKPOINT DETECTED                                                 │
│   Started: 2026-01-28T10:00:00Z                                     │
│   Last Updated: 2026-01-28T10:02:00Z                                │
│   Resume From: PUSH (Phase 3)                                       │
│                                                                     │
│ COMPLETED                                                           │
│   ✓ GATE: APPROVED                                                  │
│   ✓ PREVIEW: Reviewed                                               │
│   ✓ COMMIT: abc1234 - feat: add user authentication                 │
│                                                                     │
│ REMAINING                                                           │
│   ○ PUSH                                                            │
│   ○ CREATE PR                                                       │
│   ○ MONITOR                                                         │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ [Enter] Resume  [R] Restart from beginning  [Esc] Cancel            │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Integration with /review

**Current State**: /ship reads `loop-state.json` via hook. Gate blocks if review missing or stale.

**Proposed Enhancement**: No changes needed - the current gate integration is well-designed.

**Optional Enhancement** (LOW priority):

```text
/ship --with-review
    │
    ├─► Check: Is loop-state.json current?
    │   └─ YES → Skip to GATE
    │   └─ NO → Auto-run /review --free first
    │
    └─► Continue with /ship phases
```

### 4.6 check-agent Reusability

**Current State**: check-agent exists but is NOT invoked by /ship. Quality checks happen via:

1. /review (4-loop system) - pre-ship
2. CI pipeline - post-PR

**Proposed Enhancement**: Create standalone `/check` command

```text
# New command: /check
/check
    │
    └─► Invoke check-agent
        └─ quality-runner (Haiku)
        └─ Runs: build, types, lint, tests, security
        └─ Returns: PASS/FAIL with details
```

**Usage scenarios:**

- `/check` - Run all checks locally
- `/check --quick` - Build + types only
- `/check --security` - Security scan only

This allows:

- Using check-agent independently of /ship
- Adding `--with-checks` flag to /ship if desired
- Quick validation without full /review loop

---

## 5. Implementation Plan

### Priority Order

| Priority | Change                                  | Effort | Files Modified                                 |
| -------- | --------------------------------------- | ------ | ---------------------------------------------- |
| **P1**   | Add content preview phase (commit + PR) | 4h     | ship.md, git-agent.md, new: git-previewer.md   |
| **P1**   | Add checkpoint file support             | 2h     | git-agent.md, new: ship-checkpoint.json schema |
| **P1**   | Add `--commit-only` flag                | 2h     | ship.md                                        |
| **P2**   | Add `--pr-only` flag                    | 2h     | ship.md                                        |
| **P2**   | Add `--resume` flag                     | 4h     | ship.md, git-agent.md                          |
| **P2**   | Add `--step` flag                       | 2h     | ship.md                                        |
| **P3**   | Add `--dry-run` flag                    | 2h     | ship.md                                        |
| **P3**   | Create `/check` command                 | 4h     | new: check.md, check-agent.md updates          |
| **P4**   | Add `[E] Edit` interaction              | 4h     | preview skill, git-previewer.md                |

### Dependencies

```text
Phase 1 (Foundation):
├── Add checkpoint schema (P1)
└── Add preview sub-agent (P1)
    │
    v
Phase 2 (Incremental):
├── --commit-only (P1) depends on checkpoint
├── --pr-only (P2) depends on checkpoint
└── --resume (P2) depends on checkpoint
    │
    v
Phase 3 (Polish):
├── --step (P2) depends on preview
├── --dry-run (P3) depends on preview
└── [E] Edit (P4) depends on preview
    │
    v
Phase 4 (Extended):
└── /check command (P3) - independent
```

---

## 6. Summary

### Key Optimizations

| Dimension             | Before                         | After                                   |
| --------------------- | ------------------------------ | --------------------------------------- |
| Incremental Execution | None (all-or-nothing)          | 6 granular phases with flags            |
| Content Preview       | None                           | Commit message + PR description preview |
| Resume Capability     | None                           | Checkpoint-based resume                 |
| User Control          | Initial preview + merge prompt | Preview at every major decision point   |
| check-agent Reuse     | Not exposed                    | New `/check` command                    |

### Unified Patterns Applied

1. **Checkpoint Schema**: Adopted cross-command unified format
2. **Preview Template**: Adopted unified ASCII box format with `[Enter]/[Esc]/[?]`
3. **Progress Template**: Adopted unified stage indicators (✓ ● ○ ✗ ⊘)
4. **Error Template**: Adopted unified recovery options format
5. **Sub-Agent Handoff**: Existing pattern is already compliant

### Estimated Total Effort

| Category          | Effort        |
| ----------------- | ------------- |
| P1 (Critical)     | ~8 hours      |
| P2 (Important)    | ~8 hours      |
| P3 (Nice-to-have) | ~6 hours      |
| P4 (Polish)       | ~4 hours      |
| **Total**         | **~26 hours** |

### Files Changed Summary

| File                                      | Change Type                        |
| ----------------------------------------- | ---------------------------------- |
| `.claude/commands/ship.md`                | Major update (flags, phases)       |
| `.claude/agents/git-agent.md`             | Major update (checkpoint, preview) |
| `.claude/sub-agents/git/git-previewer.md` | **New file**                       |
| `.claude/state/ship-checkpoint.json`      | **New schema**                     |
| `.claude/commands/check.md`               | **New file** (optional)            |
| `.claude/skills/preview/SKILL.md`         | Minor update (content preview)     |
