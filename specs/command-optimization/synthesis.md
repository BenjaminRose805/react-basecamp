# Cross-Command Synthesis

**Phase 2 Synthesis** | **Date:** 2026-01-28

---

## 1. Unified Templates Identified

### 1.1 Preview Template

**Commands Requesting:** All 7 commands

**Proposed Single Implementation:** `.claude/skills/preview/templates/command-preview.md`

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /{command} - {Description}                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CONTEXT                                                              │
│   Working Dir: {path}                                                │
│   Branch: {branch_name}                       (if applicable)        │
│   Feature: {feature_name}                     (if applicable)        │
│   Gate: {✅ APPROVED | 🚫 BLOCKED}            (if applicable)        │
│   Checkpoint: {none | resume from phase X}    (if applicable)        │
│                                                                      │
│ STAGES                                                               │
│   {n}. {STAGE_NAME} ({sub-agent} / {Model})                          │
│      → {brief description}                                           │
│   ...                                                                │
│                                                                      │
│ OUTPUT                                                               │
│   {output_path}/                              (if applicable)        │
│     ├── {file_1}                                                     │
│     └── {file_2}                                                     │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel  [?] Help                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Command-Specific Sections:**

| Command    | Additional Sections                   |
| ---------- | ------------------------------------- |
| /start     | PREREQUISITES (pre-validation checks) |
| /design    | OUTPUT (spec files to create)         |
| /research  | SCOPE (search areas)                  |
| /reconcile | SOURCE (detected source type)         |
| /implement | PROGRESS (task completion status)     |
| /review    | RATE LIMIT (CodeRabbit remaining)     |
| /ship      | COMMIT PREVIEW, PR PREVIEW (content)  |

---

### 1.2 Progress Template

**Commands Requesting:** All 7 commands

**Proposed Single Implementation:** `.claude/skills/progress/templates/stage-progress.md`

```text
/{command} - {Description}

Stage {n}/{total}: {STAGE_NAME}
  ● Running: {sub-agent} ({Model})
  ├── {current_action}...
  └── Elapsed: {time}

[============================] {percent}% | Stage {n}/{total} | {elapsed} elapsed

Stage Status:
  ✓ Stage 1: {name} ({duration})
  ✓ Stage 2: {name} ({duration})
  ● Stage 3: {name} (in progress)
  ○ Stage 4: {name} (pending)
```

**Status Indicators (Standardized):**

| Indicator | Meaning  |
| --------- | -------- |
| `✓`       | Complete |
| `●`       | Running  |
| `○`       | Pending  |
| `✗`       | Failed   |
| `⊘`       | Skipped  |

---

### 1.3 Error Template

**Commands Requesting:** /start, /design, /implement, /ship

**Proposed Single Implementation:** `.claude/skills/preview/templates/error-report.md`

```text
┌─ ERROR ──────────────────────────────────────────────────────────────┐
│ Stage: {stage_name}                                                  │
│ Sub-agent: {sub-agent_name} ({Model})                                │
├──────────────────────────────────────────────────────────────────────┤
│ Error: {error_message}                                               │
│ File: {file_path}:{line_number}             (if applicable)          │
├──────────────────────────────────────────────────────────────────────┤
│ Recovery Options:                                                    │
│   1. {option_1}                                                      │
│   2. {option_2}                                                      │
│                                                                      │
│ Checkpoint saved to: .claude/state/{command}-checkpoint.json         │
│ To resume: /{command} --resume                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 1.4 Sub-Agent Handoff Schema

**Commands Requesting:** All commands using Task()

**Proposed Single Implementation:** `.claude/protocols/handoff-schema.md`

```typescript
interface SubAgentHandoff {
  // Identity
  task_id: string; // Unique ID for tracking
  phase: string; // research | write | validate | analyze | plan
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

**Enforcement:** Add token counting validation in orchestrators. Reject context_summary > 500 tokens.

---

### 1.5 Implementation Orchestrator Template

**Commands Requesting:** /implement (code-agent, ui-agent, docs-agent, eval-agent)

**Proposed Single Implementation:** `.claude/agents/templates/implementation-orchestrator.md`

```markdown
# Implementation Orchestrator Template

## Model Assignment

{agent-name} (orchestrator, Opus)
│
│ (dynamic sizing based on context)
│
├── agentCount == 1:
│ └─► domain-writer (mode={domain}, Sonnet)
│
├── agentCount == 2:
│ ├─► domain-researcher (mode={domain}, Opus)
│ └─► domain-writer (mode={domain}, Sonnet)
│
└── agentCount >= 3:
├─► domain-researcher (mode={domain}, Opus)
├─► domain-writer (mode={domain}, Sonnet)
└─► quality-validator (Haiku)

## Variables

| Variable       | Description                                  |
| -------------- | -------------------------------------------- |
| {agent-name}   | code-agent, ui-agent, docs-agent, eval-agent |
| {domain}       | backend, frontend, docs, eval                |
| {phase-2-name} | IMPLEMENT, BUILD, WRITE, CREATE              |
| {methodology}  | TDD, TDD, None, EDD                          |
```

**Savings:** ~600 lines across 4 agent files (85% reduction in duplication)

---

### 1.6 Spec Output Templates

**Commands Requesting:** /design

**Proposed Implementation:** `specs/templates/`

| Template         | Current Lines | Proposed Lines | Savings |
| ---------------- | ------------- | -------------- | ------- |
| requirements.md  | 125           | 55             | 56%     |
| design.md        | 128           | 70             | 45%     |
| tasks.md         | 108           | 45             | 58%     |
| meta.yaml (new)  | 0             | 10             | -       |
| summary.md (new) | 0             | 25             | -       |
| spec.json (new)  | 0             | 30             | -       |
| **Total**        | **361**       | **235**        | **35%** |

**New Files:**

1. **summary.md** - Quick human review (~25 lines)
2. **meta.yaml** - Shared metadata (status, created, updated)
3. **spec.json** - Machine-readable for /implement

---

## 2. Shared Scripts Identified

### 2.1 Existing Scripts to Extend

| Script                  | Location               | Current Owner | Extensions Needed                    |
| ----------------------- | ---------------------- | ------------- | ------------------------------------ |
| `lib/git-utils.cjs`     | `.claude/scripts/lib/` | /start        | Add worktree path computation helper |
| `lib/utils.cjs`         | `.claude/scripts/lib/` | /start        | Add token counting utility           |
| `environment-check.cjs` | `.claude/scripts/`     | /start        | Output to `.claude/state/`           |

### 2.2 New Scripts Proposed

| Script                       | Proposed Location      | Requested By | Purpose                                  |
| ---------------------------- | ---------------------- | ------------ | ---------------------------------------- |
| `validate-start-prereqs.cjs` | `.claude/scripts/`     | /start       | Pre-validate prerequisites for --dry-run |
| `checkpoint-manager.cjs`     | `.claude/scripts/lib/` | All          | Read/write/validate checkpoint files     |
| `token-counter.cjs`          | `.claude/scripts/lib/` | All          | Validate context_summary ≤500 tokens     |
| `task-parser.cjs`            | `.claude/scripts/lib/` | /implement   | Parse tasks.md into structured format    |

### 2.3 Checkpoint Manager Interface

**Location:** `.claude/scripts/lib/checkpoint-manager.cjs`

```javascript
/**
 * Unified checkpoint management for all commands
 */
module.exports = {
  /**
   * Load checkpoint for a command/feature
   * @param {string} command - Command name (start, design, implement, etc.)
   * @param {string} feature - Feature name (optional for some commands)
   * @returns {Checkpoint|null}
   */
  loadCheckpoint(command, feature = null) {},

  /**
   * Save checkpoint state
   * @param {Checkpoint} checkpoint
   */
  saveCheckpoint(checkpoint) {},

  /**
   * Update specific phase in checkpoint
   * @param {string} command
   * @param {string} feature
   * @param {string} phase
   * @param {PhaseData} data
   */
  updatePhase(command, feature, phase, data) {},

  /**
   * Mark checkpoint as complete
   * @param {string} command
   * @param {string} feature
   */
  completeCheckpoint(command, feature) {},

  /**
   * Get resume point from checkpoint
   * @param {string} command
   * @param {string} feature
   * @returns {string|null} Phase name to resume from
   */
  getResumePoint(command, feature) {},
};
```

### 2.4 Task Parser Interface

**Location:** `.claude/scripts/lib/task-parser.cjs`

```javascript
/**
 * Parse tasks.md into structured format for /implement
 */
module.exports = {
  /**
   * Parse tasks.md file
   * @param {string} tasksPath - Path to tasks.md
   * @returns {ParsedTasks}
   */
  parseTasks(tasksPath) {},

  /**
   * Get task by ID
   * @param {ParsedTasks} tasks
   * @param {string} taskId - e.g., "T001"
   * @returns {Task|null}
   */
  getTask(tasks, taskId) {},

  /**
   * Get tasks by phase
   * @param {ParsedTasks} tasks
   * @param {number} phase
   * @returns {Task[]}
   */
  getTasksByPhase(tasks, phase) {},

  /**
   * Update task status in markdown file
   * @param {string} tasksPath
   * @param {string} taskId
   * @param {boolean} complete
   */
  updateTaskCheckbox(tasksPath, taskId, complete) {},
};
```

---

## 3. Checkpoint/State Schema

### 3.1 Unified Checkpoint Schema

**Location:** `.claude/state/{command}-checkpoint.json` or `.claude/state/{command}-{feature}.json`

```typescript
interface UnifiedCheckpoint {
  // Identity
  command:
    | "start"
    | "design"
    | "research"
    | "reconcile"
    | "implement"
    | "review"
    | "ship";
  feature: string; // Feature name (may be empty for some commands)
  version: 1; // Schema version

  // Timing
  started_at: string; // ISO timestamp
  updated_at: string; // Last update timestamp

  // Progress
  state: {
    current_phase: string; // Current phase name
    completed_phases: string[]; // Completed phase names
    pending_phases: string[]; // Remaining phases
    current_task?: string; // Task ID for /implement (T001)
  };

  // Phase-specific data
  phases: {
    [phase_name: string]: {
      status: "pending" | "in_progress" | "complete" | "failed" | "skipped";
      started_at?: string;
      completed_at?: string;
      context_summary?: string; // Output summary (≤500 tokens)
      files_created?: string[]; // Files created in this phase
      files_modified?: string[]; // Files modified
      error?: string; // Error message if failed
      // Phase-specific fields...
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

### 3.2 Command-Specific Checkpoint Variations

| Command    | Key                               | Phases                                   | Special Fields                     |
| ---------- | --------------------------------- | ---------------------------------------- | ---------------------------------- |
| /start     | `start-checkpoint.json`           | validate, setup, verify                  | `worktree.path`, `worktree.branch` |
| /design    | `design-{feature}.json`           | research, write, validate                | `sub_agents[]`, `files_created[]`  |
| /research  | `research-{feature}.json`         | investigate                              | `decision`, `findings_count`       |
| /reconcile | `reconcile-checkpoint.json`       | analyze, plan                            | `source`, `findings_count`         |
| /implement | `implement-{feature}.json`        | per-task tracking                        | `tasks{}`, `routing.agents[]`      |
| /review    | Already exists: `loop-state.json` | L1-T1, L1-T2, L2, L3, L4                 | `ship_allowed`, `loops{}`          |
| /ship      | `ship-checkpoint.json`            | gate, preview, commit, push, pr, monitor | `commit_hash`, `pr_url`            |

### 3.3 State File Location Standardization

**Current State:**

| Command    | File                  | Location         | Issue          |
| ---------- | --------------------- | ---------------- | -------------- |
| /start     | start-status.json     | `{root}/`        | Wrong location |
| /design    | None                  | -                | Missing        |
| /research  | research-notes.md     | Unclear          | Unclear        |
| /reconcile | None                  | -                | Missing        |
| /implement | None                  | -                | Missing        |
| /review    | loop-state.json, etc. | `.claude/state/` | Correct        |
| /ship      | None (reads only)     | -                | Missing write  |

**Proposed Standardization:**

All state files in `.claude/state/`:

```
.claude/state/
├── start-checkpoint.json
├── start-status.json                    # Move from root
├── design-{feature}.json
├── research-{feature}.json
├── reconcile-checkpoint.json
├── implement-{feature}.json
├── implement-output.json                # Files changed manifest
├── loop-state.json                      # Existing
├── claude-review-results.json           # Existing
├── rate-limit-state.json                # Existing
└── ship-checkpoint.json
```

---

## 4. Implementation Priority

### 4.1 Priority Matrix

**Scoring:**

- **Impact**: How many commands benefit (1-7) + severity of gap
- **Effort**: Hours to implement (L=1-4h, M=4-8h, H=8-16h, XH=16+h)
- **Dependencies**: What must come first

| #   | Optimization                                    | Impact       | Effort | Deps   | Priority Score |
| --- | ----------------------------------------------- | ------------ | ------ | ------ | -------------- |
| 1   | Unified checkpoint schema + manager             | 7 commands   | M      | None   | **P0**         |
| 2   | /implement --task flag                          | Critical gap | H      | #1     | **P0**         |
| 3   | /implement checkpoint + resume                  | Critical gap | H      | #1, #2 | **P0**         |
| 4   | Add `research` + `reconcile` modes to templates | 2 commands   | L      | None   | **P1**         |
| 5   | Move start-status.json to .claude/state/        | 1 command    | L      | None   | **P1**         |
| 6   | Unified preview template                        | 7 commands   | M      | None   | **P1**         |
| 7   | Unified progress template                       | 7 commands   | M      | None   | **P1**         |
| 8   | /design --phase flag + checkpoint               | High value   | M      | #1     | **P1**         |
| 9   | /ship content preview phase                     | High value   | M      | None   | **P1**         |
| 10  | /ship --commit-only flag                        | High value   | L      | #9     | **P2**         |
| 11  | /ship checkpoint + resume                       | High value   | M      | #1, #9 | **P2**         |
| 12  | /research → /design handoff                     | 2 commands   | M      | None   | **P2**         |
| 13  | Shared orchestrator template                    | 4 agents     | H      | None   | **P2**         |
| 14  | /review --files flag                            | 1 command    | M      | None   | **P2**         |
| 15  | /review --from-implement                        | 2 commands   | M      | None   | **P2**         |
| 16  | summary.md auto-generation                      | 1 command    | L      | None   | **P2**         |
| 17  | spec.json machine-readable                      | 2 commands   | M      | None   | **P2**         |
| 18  | /reconcile --analyze-only flag                  | 1 command    | L      | None   | **P3**         |
| 19  | Unified error template                          | 4 commands   | L      | None   | **P3**         |
| 20  | Token counting validation                       | All          | L      | None   | **P3**         |
| 21  | --dry-run flag (all commands)                   | 7 commands   | M      | #6     | **P3**         |
| 22  | /ship [E] Edit interaction                      | 1 command    | M      | #9     | **P4**         |
| 23  | /check standalone command                       | 1 command    | M      | None   | **P4**         |
| 24  | Spec template trimming                          | 1 command    | L      | None   | **P4**         |

### 4.2 Dependency Graph

```
                    ┌─────────────────────────────┐
                    │ #1: Checkpoint Schema       │
                    │     (Foundation)            │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ #2: /implement  │     │ #8: /design     │     │ #11: /ship      │
│     --task      │     │     --phase     │     │     checkpoint  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       │                       │
┌─────────────────┐              │                       │
│ #3: /implement  │              │                       │
│     checkpoint  │              │                       │
└─────────────────┘              │                       │
                                 │                       │
                    ┌────────────┴───────────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ #21: --dry-run  │
          │     (all)       │
          └─────────────────┘

Independent (can start immediately):
├── #4: Template modes (research, reconcile)
├── #5: start-status.json location
├── #6: Unified preview template
├── #7: Unified progress template
├── #9: /ship content preview
├── #12: /research → /design handoff
├── #13: Shared orchestrator template
├── #14: /review --files
└── #15: /review --from-implement
```

---

## 5. Migration Plan

### Phase 1: Foundation (Week 1)

**Goal:** Establish shared infrastructure that all commands will use.

| Day | Task                                        | Files Changed                                       |
| --- | ------------------------------------------- | --------------------------------------------------- |
| 1   | Create checkpoint-manager.cjs               | `.claude/scripts/lib/checkpoint-manager.cjs`        |
| 1   | Define unified checkpoint schema            | `.claude/protocols/checkpoint-schema.md`            |
| 2   | Create unified preview template             | `.claude/skills/preview/templates/`                 |
| 2   | Create unified progress template            | `.claude/skills/progress/templates/`                |
| 3   | Add `research` mode to domain-researcher.md | `.claude/sub-agents/templates/domain-researcher.md` |
| 3   | Add `reconcile` mode to templates           | `.claude/sub-agents/templates/*.md`                 |
| 4   | Move start-status.json location             | `.claude/commands/start.md`, scripts                |
| 4   | Create unified error template               | `.claude/skills/preview/templates/error-report.md`  |
| 5   | Create token-counter.cjs                    | `.claude/scripts/lib/token-counter.cjs`             |
| 5   | Integration testing                         | All updated files                                   |

**Deliverables:**

- [ ] checkpoint-manager.cjs working
- [ ] Preview/progress templates standardized
- [ ] All template modes documented
- [ ] State file location consistent

---

### Phase 2: Individual Command Updates (Weeks 2-3)

**Goal:** Apply optimizations to each command.

#### Week 2: Critical Commands (/implement, /design, /ship)

| Day | Command    | Changes                                              |
| --- | ---------- | ---------------------------------------------------- |
| 1-2 | /implement | Add task-parser.cjs, --task flag, checkpoint support |
| 3   | /implement | Add --phase flag, --resume flag                      |
| 4   | /design    | Add --phase flag, checkpoint support                 |
| 5   | /design    | Add summary.md generation                            |

#### Week 3: Remaining Commands

| Day | Command    | Changes                                        |
| --- | ---------- | ---------------------------------------------- |
| 1   | /ship      | Add content preview phase (commit, PR)         |
| 2   | /ship      | Add --commit-only, checkpoint, --resume        |
| 3   | /research  | Add research.json output, structured format    |
| 3   | /research  | Add --scope flag                               |
| 4   | /reconcile | Add --analyze-only flag                        |
| 4   | /review    | Add --files flag, --from-implement             |
| 5   | /start     | Add --dry-run flag, validate-start-prereqs.cjs |

**Deliverables:**

- [ ] /implement has task-by-task execution
- [ ] /design has phase-based execution
- [ ] /ship has content preview
- [ ] All commands have checkpoint support
- [ ] All commands have --dry-run option

---

### Phase 3: Integration & Polish (Week 4)

**Goal:** Ensure all commands work together seamlessly.

| Day | Task                   | Description                                                    |
| --- | ---------------------- | -------------------------------------------------------------- |
| 1   | Cross-command handoffs | Verify /research → /design → /implement flow                   |
| 2   | Cross-command handoffs | Verify /implement → /review → /reconcile flow                  |
| 2   | Cross-command handoffs | Verify /review → /ship gate integration                        |
| 3   | Shared orchestrator    | Create implementation-orchestrator.md template                 |
| 3   | Shared orchestrator    | Refactor code/ui/docs/eval agents                              |
| 4   | spec.json + summary.md | Create templates, update /design                               |
| 5   | End-to-end testing     | Full workflow: /start → /design → /implement → /review → /ship |

**Deliverables:**

- [ ] All cross-command handoffs verified
- [ ] Shared orchestrator template working
- [ ] Agent files reduced by ~600 lines
- [ ] Full workflow documented and tested

---

### Phase 4: Documentation & Cleanup (Week 5)

| Day | Task                                         |
| --- | -------------------------------------------- |
| 1   | Update CLAUDE.md with new flags              |
| 2   | Move troubleshooting docs to `.claude/docs/` |
| 3   | Create migration guide for existing users    |
| 4   | Remove deprecated patterns                   |
| 5   | Final review and release notes               |

---

## Summary

### Key Metrics

| Metric                              | Before     | After      |
| ----------------------------------- | ---------- | ---------- |
| Commands with incremental execution | 1/7 (14%)  | 7/7 (100%) |
| Commands with checkpoint support    | 1/7 (14%)  | 7/7 (100%) |
| Agent code duplication              | ~700 lines | ~100 lines |
| Spec template verbosity             | 361 lines  | 235 lines  |
| State file location consistency     | 29%        | 100%       |
| Template mode documentation         | 71%        | 100%       |
| Content preview before commit       | No         | Yes        |
| Task-by-task execution              | No         | Yes        |

### Critical Path

1. **Checkpoint infrastructure** (#1) - Enables everything else
2. **/implement task execution** (#2, #3) - Highest impact gap
3. **/ship content preview** (#9) - User control before irreversible actions
4. **Cross-command handoffs** (#12, #15) - Eliminates duplicate work

### Total Estimated Effort

| Phase                  | Effort        |
| ---------------------- | ------------- |
| Phase 1: Foundation    | ~20 hours     |
| Phase 2: Commands      | ~40 hours     |
| Phase 3: Integration   | ~20 hours     |
| Phase 4: Documentation | ~10 hours     |
| **Total**              | **~90 hours** |

### Files Summary

**New Files (14):**

- `.claude/scripts/lib/checkpoint-manager.cjs`
- `.claude/scripts/lib/token-counter.cjs`
- `.claude/scripts/lib/task-parser.cjs`
- `.claude/scripts/validate-start-prereqs.cjs`
- `.claude/protocols/checkpoint-schema.md`
- `.claude/protocols/handoff-schema.md`
- `.claude/skills/preview/templates/command-preview.md`
- `.claude/skills/preview/templates/error-report.md`
- `.claude/skills/progress/templates/stage-progress.md`
- `.claude/agents/templates/implementation-orchestrator.md`
- `.claude/sub-agents/git/git-previewer.md`
- `specs/templates/summary.md`
- `specs/templates/meta.yaml`
- `specs/templates/spec.json`

**Modified Files (15+):**

- `.claude/commands/*.md` (7 files)
- `.claude/agents/*.md` (5 files)
- `.claude/sub-agents/templates/*.md` (2 files)
- `.claude/skills/preview/SKILL.md`
- `.claude/scripts/environment-check.cjs`

---

## 6. External Integrations

### 6.1 Linear Integration (Native GitHub Automation)

**Purpose:** Auto-manage Linear issues through GitHub's native integration.

**Key Insight:** Linear's GitHub integration handles most automation natively. We only need MCP for issue creation.

#### 6.1.1 How Native Automation Works

**Auto-linking:** Include issue ID in branch name or PR title:

```
Branch: feature/BAS-6-foundation
PR Title: feat: checkpoint infrastructure (BAS-6)
```

**Magic Words:** Include in PR description to auto-close:

```
closes BAS-6
fixes BAS-6
```

**Workflow Automation:** Configure in Linear Team Settings → Workflow:

- PR opened → Issue moves to "In Progress"
- PR merged → Issue moves to "Done"
- PR closed (not merged) → Issue moves back to "Backlog"

#### 6.1.2 What Commands Need to Do

| Command    | Action                            | Method                                  |
| ---------- | --------------------------------- | --------------------------------------- |
| /start     | Use Linear branch name            | `git checkout -b feature/BAS-X-{name}`  |
| /design    | Create issue via MCP              | `mcp__linear-server__create_issue`      |
| /design    | Store identifier in spec.json     | Write to file                           |
| /implement | Nothing                           | Native automation handles status        |
| /ship      | Include `closes BAS-X` in PR body | PR template                             |
| /ship      | Nothing else                      | Native automation handles status + link |

#### 6.1.3 Linear MCP Usage (Minimal)

Only use MCP for:

1. **Creating issues** (`mcp__linear-server__create_issue`)
2. **Finding issues** (`mcp__linear-server__get_issue`)

**No custom linear-client.cjs needed** - use MCP directly.

#### 6.1.4 Branch Naming Convention

```
feature/{ISSUE-ID}-{feature-name}
```

Examples:

- `feature/BAS-6-foundation`
- `feature/BAS-7-templates`

This auto-links PRs to Linear issues.

#### 6.1.5 PR Template for /ship

```markdown
## Summary

{description}

## Linear

closes {ISSUE-ID}

## Test plan

- [ ] ...
```

#### 6.1.6 Spec.json Extension

Add to `specs/{feature}/spec.json`:

```json
{
  "name": "feature-name",
  "status": "approved",
  "linear": {
    "identifier": "BAS-6",
    "url": "https://linear.app/react-basecamp/issue/BAS-6"
  }
}
```

#### 6.1.7 Linear Team Workflow Settings

Configure these automations in Linear (Settings → Team → Workflow):

| Trigger   | Action                |
| --------- | --------------------- |
| PR opened | Move to "In Progress" |
| PR merged | Move to "Done"        |
| PR closed | Move to "Backlog"     |

---

### 6.2 Vercel Integration

**Purpose:** Integrate deployment status into /ship workflow.

**Deployment Flow:**

```
/ship (push) → PR created → Vercel preview deploys
            → CI checks pass
            → Vercel preview ready ✓
            → Merge → Vercel production deploys
```

#### 6.2.1 Vercel Status Checks

Since Vercel is already connected, it automatically:

1. Creates preview deployments on PR
2. Reports status via GitHub checks
3. Deploys to production on merge to main

**No new Vercel API calls needed** - just read GitHub check status.

#### 6.2.2 /ship Integration

Update `/ship` to wait for Vercel checks:

```javascript
// In ship workflow, after PR creation
const checks = await waitForChecks(prNumber, {
  required: ["Vercel", "CI"],
  timeout: 300000, // 5 minutes
});

if (!checks.vercel.success) {
  console.log("⚠️  Vercel preview deployment failed");
  console.log(`   Preview: ${checks.vercel.url}`);
  // Ask user to continue or abort
}
```

#### 6.2.3 Preview Template Extension

Add Vercel status to `/ship` preview:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /ship - Ship Changes                                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ DEPLOYMENT STATUS                                                    │
│   Vercel Preview: {pending | building | ready | failed}              │
│   Preview URL: {url}                                                 │
│   Production: {will deploy on merge}                                 │
│                                                                      │
│ CHECKS                                                               │
│   ✓ CI                                                               │
│   ● Vercel (building...)                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### 6.2.4 State Schema Extension

Add to `.claude/state/ship-checkpoint.json`:

```typescript
interface ShipCheckpointVercel {
  vercel?: {
    preview_url?: string; // Preview deployment URL
    preview_status: "pending" | "building" | "ready" | "failed";
    production_url?: string; // Production URL (after merge)
    deployment_id?: string; // Vercel deployment ID
  };
}
```

---

### 6.3 Integration Priority

| Integration               | Phase   | Effort | Impact                      |
| ------------------------- | ------- | ------ | --------------------------- |
| Linear GitHub integration | Setup   | L      | One-time in Linear settings |
| Branch naming convention  | Phase 1 | L      | Auto-links PRs              |
| /design → create issue    | Phase 4 | L      | Issue tracking starts       |
| /ship PR template         | Phase 5 | L      | Auto-closes issues          |
| Vercel check waiting      | Phase 5 | L      | Deployment confidence       |

**Removed:** No custom linear-client.cjs needed. Native automation handles status updates.

---

### 6.4 Configuration

#### 6.4.1 Linear GitHub Integration Setup (One-Time)

1. Go to Linear Settings → Integrations → GitHub
2. Connect your GitHub repo
3. Enable "Link pull requests" and "Link commits"
4. Go to Team Settings → Workflow → Automations
5. Add automations:
   - When PR is opened → Move to "In Progress"
   - When PR is merged → Move to "Done"

#### 6.4.2 Integrations Config File

Add to `.claude/config/integrations.json`:

```json
{
  "linear": {
    "enabled": true,
    "team": "Basecamp",
    "branch_prefix": "feature",
    "use_native_automation": true
  },
  "vercel": {
    "enabled": true,
    "wait_for_preview": true,
    "preview_timeout_ms": 300000,
    "require_preview_success": false
  }
}
```
