# Cross-Command Analysis

**Phase 1 Analysis** | **Date:** 2026-01-28

---

## 1. Pattern Consistency Matrix

| Command    | Preview?      | Progress?    | Sub-agents?                 | Incremental?       | State File?                   |
| ---------- | ------------- | ------------ | --------------------------- | ------------------ | ----------------------------- |
| /start     | Yes (doc)     | Yes (doc)    | Yes (3 Haiku)               | No                 | Partial (`start-status.json`) |
| /design    | Yes (doc)     | Yes (doc)    | Yes (Opus×3, Sonnet, Haiku) | No                 | No                            |
| /research  | Yes (doc)     | Unclear      | Yes (Opus)                  | N/A (single phase) | No                            |
| /reconcile | Yes (skill)   | Unclear      | Yes (Opus, Sonnet)          | No                 | No                            |
| /implement | Yes (routing) | Yes (skill)  | Yes (Opus, Sonnet, Haiku)   | No                 | No                            |
| /review    | Unclear       | Yes (loops)  | Yes (Haiku×2, Sonnet)       | Partial (flags)    | Yes (3 files)                 |
| /ship      | Yes (doc)     | Yes (stages) | Yes (Sonnet, Haiku)         | No                 | Reads only                    |

### Summary

| Pattern               | Commands With | Commands Without      | Adoption Rate |
| --------------------- | ------------- | --------------------- | ------------- |
| Preview documented    | 6/7           | /review unclear       | 86%           |
| Progress documented   | 5/7           | /research, /reconcile | 71%           |
| Sub-agents used       | 7/7           | -                     | 100%          |
| Incremental execution | 1/7 (partial) | 6/7                   | 14%           |
| State file writes     | 2/7           | 5/7                   | 29%           |

**Critical Gap**: Only `/review` has meaningful incremental execution. 6/7 commands are all-or-nothing.

---

## 2. Sub-Agent Spawning Consistency

### Task() Call Pattern

All 7 commands use the **identical** Task tool pattern:

```typescript
Task({
  subagent_type: "general-purpose",
  description: "...",
  prompt: `...`,
  model: "opus" | "sonnet" | "haiku",
});
```

**Consistency Score: 100%**

### Handoff Object Structure

| Command    | Handoff Format                | Structured?               |
| ---------- | ----------------------------- | ------------------------- |
| /start     | Implicit (stage outputs)      | No formal schema          |
| /design    | context_summary (~500 tokens) | Yes (documented)          |
| /research  | context_summary (implied)     | Partially                 |
| /reconcile | context_summary (~500 tokens) | Yes                       |
| /implement | context_summary (~500 tokens) | Yes (documented)          |
| /review    | Loop state JSON               | Yes (different structure) |
| /ship      | Phase outputs                 | No formal schema          |

**Handoff Structures Identified:**

1. **context_summary pattern** (design, research, reconcile, implement)
   - Max 500 tokens per sub-agent
   - Plain text summary
   - Passed from phase to phase

2. **Structured JSON pattern** (review)
   - `loop-state.json` with explicit schema
   - `claude-review-results.json` for findings
   - Most mature state management

3. **Implicit outputs** (start, ship)
   - Stage outputs passed internally
   - No formal schema documentation

### Model Selection Consistency

| Phase Type        | Model  | Commands Using                               |
| ----------------- | ------ | -------------------------------------------- |
| Research/Analysis | Opus   | design, research, reconcile, implement       |
| Writing/Execution | Sonnet | design, reconcile, implement, review, ship   |
| Validation/Simple | Haiku  | start (all), design, implement, review, ship |

**Consistency Score: 95%** - Model selection is well-aligned across commands.

**Anomaly**: /start uses Haiku for all 3 stages (appropriate for simple git ops).

### Parallel Execution

| Command | Uses run_in_background? | Phases Parallelized          |
| ------- | ----------------------- | ---------------------------- |
| /design | Yes                     | Research phase (3 analyzers) |
| /review | No                      | Loops run sequentially       |
| Others  | No                      | All sequential               |

**Opportunity**: More commands could benefit from parallel sub-agent execution.

---

## 3. Information Flow Map

```
/start -> creates worktree, branch, start-status.json
   |
   v
/research -> reads codebase, creates research-notes.md (location unclear)
   |         [NO HANDOFF TO /design - BROKEN]
   |
   v
/design -> reads codebase (NOT research-notes.md), creates specs/{feature}/*.md
   |        - requirements.md (EARS format)
   |        - design.md (architecture)
   |        - tasks.md (implementation steps)
   |
   v
/implement -> reads specs/{feature}/*.md, creates/modifies src/**
   |           - routes to code-agent | ui-agent | docs-agent | eval-agent
   |           - follows TDD/EDD workflow
   |           - [NO checkpoint.json - BROKEN]
   |
   v
/review -> reads git diff, creates .claude/state/loop-state.json
   |        - creates .claude/state/claude-review-results.json
   |        - sets ship_allowed flag
   |
   +-----> /reconcile (if issues found)
   |           -> reads loop-state.json OR claude-review-results.json OR PR comments
   |           -> creates specs/reconcile-{timestamp}/tasks.md
   |           -> [FEEDS BACK TO /implement]
   |
   v
/ship -> reads .claude/state/loop-state.json (gate check)
         - creates commit, pushes, creates PR
         - monitors CI and CodeRabbit
```

### Broken Handoffs Identified

| From       | To         | Issue                                                                    |
| ---------- | ---------- | ------------------------------------------------------------------------ |
| /research  | /design    | No detection of existing research-notes.md; /design always re-researches |
| /design    | /implement | No checkpoint; /implement can't resume from partial completion           |
| /implement | /review    | No task completion state; can't verify which tasks were done             |
| /reconcile | /implement | Different directory structure (reconcile-{timestamp} vs original spec)   |

### State File Locations

| File                        | Location             | Created By | Read By           |
| --------------------------- | -------------------- | ---------- | ----------------- |
| start-status.json           | `{worktree}/` (root) | /start     | -                 |
| research-notes.md           | Unclear              | /research  | - (not read)      |
| specs/{feature}/\*.md       | `specs/`             | /design    | /implement        |
| specs/reconcile-\*/tasks.md | `specs/`             | /reconcile | /implement        |
| loop-state.json             | `.claude/state/`     | /review    | /ship, /reconcile |
| claude-review-results.json  | `.claude/state/`     | /review    | /reconcile        |
| rate-limit-state.json       | `.claude/state/`     | /review    | /review           |

**Inconsistency**: start-status.json is in root, not `.claude/state/`

---

## 4. Unified Templates Needed

### 4.1 Preview Template (All Commands)

**Current State**: 6/7 commands document ASCII box previews, but format varies.

**Proposed Unified Template:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ /{command} - {Description}                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CONTEXT                                                              │
│   Working Dir: {path}                                                │
│   Branch: {branch_name}                                              │
│   Gate: {gate_status} (if applicable)                                │
│                                                                      │
│ STAGES                                                               │
│   {n}. {STAGE_NAME} ({sub-agent} / {Model})                          │
│      → {brief description}                                           │
│   ...                                                                │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel  [?] Help                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Commands Needing Update:**

- /review (preview unclear)
- All commands (standardize format)

### 4.2 Progress Output Template (All Commands)

**Current State**: Mixed progress indicators across commands.

**Proposed Unified Template:**

```
/{command} - {Description}

Stage 1/N: {STAGE_NAME}
  ● Running: {sub-agent} ({Model})
  ├── {current_action}...
  └── Elapsed: {time}

[==============================] 33% | Stage 1/3 | 1m 23s elapsed

Stage Status:
  ✓ Stage 1: {name} (completed in {time})
  ● Stage 2: {name} (in progress)
  ○ Stage 3: {name} (pending)
```

**Indicators:**

- `✓` Complete
- `●` Running
- `○` Pending
- `✗` Failed
- `⊘` Skipped

### 4.3 Error Reporting Template (All Commands)

**Current State**: Error formats vary significantly.

**Proposed Unified Template:**

```
┌─ ERROR ──────────────────────────────────────────────────────────────┐
│ Stage: {stage_name}                                                  │
│ Sub-agent: {sub-agent_name} ({Model})                                │
├──────────────────────────────────────────────────────────────────────┤
│ Error: {error_message}                                               │
│ File: {file_path}:{line_number} (if applicable)                      │
├──────────────────────────────────────────────────────────────────────┤
│ Recovery Options:                                                    │
│   1. {option_1}                                                      │
│   2. {option_2}                                                      │
│                                                                      │
│ To resume: /{command} --resume                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Sub-Agent Handoff Template (All Agents)

**Current State**: context_summary documented but not enforced.

**Proposed Unified Schema:**

```typescript
interface SubAgentHandoff {
  // Identity
  task_id: string; // Unique ID for tracking
  phase: string; // research | write | validate
  mode: string; // plan | code | ui | docs | eval | reconcile | research

  // Context (from previous phase or command)
  context: {
    feature: string; // Feature name
    spec_path: string | null; // Path to spec files
    relevant_files: string[]; // Files to consider
    constraints: string[]; // Known constraints
    previous_summary?: string; // context_summary from previous phase (≤500 tokens)
  };

  // Instructions
  instructions: string; // What to do
  expected_output:
    | "structured_findings"
    | "files_changed"
    | "validation_result"
    | "context_summary";
}
```

**Enforcement Mechanism:**

- Add token counting in orchestrator
- Reject handoffs exceeding 500 tokens for context_summary
- Log warnings for missing required fields

### 4.5 Checkpoint/State File Schema (All Commands)

**Current State**: Only /review has meaningful state files.

**Proposed Unified Schema:**

```typescript
// .claude/state/{command}-checkpoint.json
interface CommandCheckpoint {
  // Identity
  command: string; // start | design | research | reconcile | implement | review | ship
  feature: string; // Feature being worked on
  version: number; // Schema version

  // Timing
  started_at: string; // ISO timestamp
  updated_at: string; // Last update

  // Progress
  state: {
    current_phase: string; // Current phase name
    completed_phases: string[]; // Completed phase names
    pending_phases: string[]; // Remaining phases
    current_task?: string; // Current task ID (for /implement)
  };

  // Phase data (accumulated)
  phases: {
    [phase_name: string]: {
      started_at: string;
      completed_at?: string;
      status: "pending" | "in_progress" | "complete" | "failed" | "skipped";
      context_summary?: string; // Output summary (≤500 tokens)
      files_created?: string[]; // Files created
      files_modified?: string[]; // Files modified
      error?: string; // Error message if failed
    };
  };

  // Gate status (for /ship integration)
  gate?: {
    ship_allowed: boolean;
    blockers: string[];
    head_commit: string;
  };
}
```

**Commands Requiring Checkpoint:**

| Command    | Phases to Track                     | Resume Capability                 |
| ---------- | ----------------------------------- | --------------------------------- |
| /start     | validate, setup, verify             | Resume from last successful stage |
| /design    | research, write, validate           | Resume from incomplete phase      |
| /research  | investigate                         | Single phase (no resume needed)   |
| /reconcile | analyze, plan                       | Resume from analyze               |
| /implement | research, write, validate × N tasks | Resume from specific task         |
| /review    | L1-T1, L1-T2, L2, L3                | Resume from failed loop           |
| /ship      | validate, commit, pr, monitor       | Resume from commit/pr             |

---

## 5. Priority Recommendations

### Tier 1: High Impact, Low Effort (Quick Wins)

| #   | Optimization                                        | Affected Commands     | Effort  | Impact                |
| --- | --------------------------------------------------- | --------------------- | ------- | --------------------- |
| 1   | Standardize state file location to `.claude/state/` | /start                | 1 hour  | Consistency           |
| 2   | Add `research` mode to domain-researcher template   | /research, /reconcile | 1 hour  | Fixes undefined mode  |
| 3   | Document research-notes.md output path              | /research             | 30 min  | Clarity               |
| 4   | Add context_summary token validation                | All                   | 2 hours | Prevent context bloat |
| 5   | Unify preview box format                            | All                   | 2 hours | UX consistency        |

### Tier 2: High Impact, Medium Effort

| #   | Optimization                                    | Affected Commands          | Effort  | Impact                       |
| --- | ----------------------------------------------- | -------------------------- | ------- | ---------------------------- |
| 6   | Implement checkpoint.json for all commands      | All                        | 1 day   | Resume capability            |
| 7   | Add `--phase` flag for phase-specific execution | /design, /implement, /ship | 1 day   | Incremental execution        |
| 8   | Connect /research output to /design input       | /research, /design         | 4 hours | Eliminate duplicate research |
| 9   | Add `--dry-run` flag to all commands            | All                        | 4 hours | Safety/debugging             |
| 10  | Create unified progress component               | All                        | 4 hours | UX consistency               |

### Tier 3: High Impact, High Effort

| #   | Optimization                                       | Affected Commands        | Effort   | Impact                     |
| --- | -------------------------------------------------- | ------------------------ | -------- | -------------------------- |
| 11  | Implement task-by-task execution                   | /implement               | 2-3 days | Major workflow improvement |
| 12  | Add commit/PR message preview with edit            | /ship                    | 1 day    | User control               |
| 13  | Add `--task=T001` flag for specific task execution | /implement               | 1 day    | Granular control           |
| 14  | Parallel sub-agent execution where possible        | /design, /review         | 1 day    | Performance                |
| 15  | Extract shared orchestrator template               | code/ui/docs/eval agents | 1 day    | DRY, maintainability       |

### Tier 4: Medium Impact, Medium Effort

| #   | Optimization                                | Affected Commands | Effort  | Impact           |
| --- | ------------------------------------------- | ----------------- | ------- | ---------------- |
| 16  | Add `--summary` vs `--verbose` output modes | /review           | 4 hours | UX               |
| 17  | Add `--files` flag for specific file review | /review           | 4 hours | Targeted reviews |
| 18  | Add `--commit-only` and `--pr-only` flags   | /ship             | 4 hours | Flexibility      |
| 19  | Create spec.json machine-readable format    | /design           | 4 hours | Automation       |
| 20  | Add summary.md auto-generation              | /design           | 2 hours | Quick review     |

### Dependency Order

```
Phase 1 (Foundation):
├── #1: State file location
├── #2: Research mode definition
├── #5: Preview format
└── #6: Checkpoint schema
    │
    v
Phase 2 (Core Features):
├── #7: --phase flag (depends on #6)
├── #8: Research→Design handoff
├── #9: --dry-run flag
└── #10: Progress component
    │
    v
Phase 3 (Advanced):
├── #11: Task-by-task execution (depends on #6, #7)
├── #12: Message preview (depends on #6)
├── #13: --task flag (depends on #11)
└── #15: Shared orchestrator template
```

---

## Appendix: Command-Specific Issues Summary

### /start

- State file in wrong location (root vs `.claude/state/`)
- No checkpoints between stages
- Missing `--dry-run` flag

### /design

- Templates verbose (~360 lines)
- No checkpoint for phase resume
- Missing summary.md for quick review

### /research

- Mode `research` not defined in template
- Output location unclear
- No handoff to /design

### /reconcile

- Mode `reconcile` not defined in templates
- Output naming inconsistent (timestamp vs PR number)
- No link back to original spec

### /implement

- **CRITICAL**: No task-by-task execution
- No checkpoint file
- Task completion not tracked persistently

### /review

- Preview not clearly documented
- No file-specific review support
- Documentation split between command and skill

### /ship

- All-or-nothing (no granular sub-commands)
- No commit/PR message preview
- No pause between phases
