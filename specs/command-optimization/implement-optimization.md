# /implement Command Optimization

**Phase 2 Analysis** | **Date:** 2026-01-28

---

## Executive Summary

The `/implement` command is the most complex command in the system, routing specs to 4 specialized agents (code, ui, docs, eval). Cross-command analysis reveals it has the **lowest incremental execution capability** despite having the **highest number of discrete tasks**.

**Critical Priority:** Task-by-task execution with checkpoint persistence.

---

## 1. Task-Level Execution (CRITICAL)

### How Other Commands Handle Incremental Execution

| Command    | Incremental Support | Mechanism                         | State File                    |
| ---------- | ------------------- | --------------------------------- | ----------------------------- |
| /start     | None                | All-or-nothing                    | `start-status.json` (partial) |
| /design    | None                | No --phase flag                   | None                          |
| /research  | N/A                 | Single phase                      | None                          |
| /reconcile | None                | No task tracking                  | None                          |
| /review    | **Partial**         | `--free`, `--claude`, `--skip-cr` | `loop-state.json` (mature)    |
| /ship      | None                | All-or-nothing                    | Reads only                    |
| /implement | **None**            | No flags, no checkpoints          | None                          |

**Key Finding:** Only `/review` has meaningful incremental execution. `/implement` should adopt `/review`'s state file pattern.

### Proposed: `--task=T001` Flag

```bash
# Current (all-or-nothing)
/implement

# Proposed (granular)
/implement --task=T001           # Run single task
/implement --task=T001,T002,T003 # Run specific tasks
/implement --task=T001-T005      # Run task range
```

**Implementation Requirements:**

1. **Task ID Assignment in tasks.md**

   ```markdown
   ## Phase 1: Database Schema

   - [ ] **T001** Create User model in Prisma schema
   - [ ] **T002** Generate and run migration
   - [ ] **T003** Write User model tests
   ```

2. **Task Parsing Logic**

   ```typescript
   interface ParsedTask {
     id: string; // T001
     phase: number; // 1
     description: string; // "Create User model in Prisma schema"
     status: "pending" | "in_progress" | "complete" | "skipped" | "failed";
     dependencies?: string[]; // ["T001"] for T002
   }

   function parseTasks(tasksPath: string): ParsedTask[] {
     // Read tasks.md
     // Extract tasks with T### pattern
     // Parse checkbox status
     // Return structured array
   }
   ```

### Proposed: `--phase=1` Flag

```bash
# Run only phase 1 tasks
/implement --phase=1

# Run phases 1 and 2
/implement --phase=1,2

# Run from phase 2 onwards
/implement --phase=2+
```

**Phase Detection:**

- Phases are identified by `## Phase N:` headers in tasks.md
- Each task is associated with its containing phase
- Phase execution respects task dependencies

### Proposed: Checkpoint File

**Location:** `.claude/state/implement-checkpoint.json`

**Schema (aligned with cross-command-analysis proposal):**

```json
{
  "command": "implement",
  "feature": "user-auth",
  "spec_path": "specs/user-auth/",
  "version": 1,

  "started_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:15:00Z",

  "routing": {
    "detected_type": "full-stack",
    "agents": ["code-agent", "ui-agent"],
    "current_agent": "code-agent"
  },

  "state": {
    "current_phase": 2,
    "current_task": "T004",
    "completed_phases": [1],
    "pending_phases": [2, 3, 4]
  },

  "tasks": {
    "T001": {
      "status": "complete",
      "started_at": "2026-01-28T10:01:00Z",
      "completed_at": "2026-01-28T10:03:00Z",
      "files_created": ["prisma/schema.prisma"],
      "context_summary": "Created User model with id, email, passwordHash fields"
    },
    "T002": {
      "status": "complete",
      "started_at": "2026-01-28T10:03:30Z",
      "completed_at": "2026-01-28T10:05:00Z",
      "files_created": ["prisma/migrations/20260128_add_user/"]
    },
    "T003": {
      "status": "complete",
      "started_at": "2026-01-28T10:05:30Z",
      "completed_at": "2026-01-28T10:08:00Z",
      "files_created": ["src/lib/__tests__/user.test.ts"],
      "test_results": { "passed": 5, "failed": 0, "coverage": 92 }
    },
    "T004": {
      "status": "in_progress",
      "started_at": "2026-01-28T10:08:30Z",
      "last_error": null
    },
    "T005": { "status": "pending" },
    "T006": { "status": "pending" }
  },

  "validation": {
    "last_run": "2026-01-28T10:08:00Z",
    "types": { "passed": true, "errors": 0 },
    "lint": { "passed": true, "errors": 0 },
    "tests": { "passed": true, "total": 5, "coverage": 92 }
  },

  "gate": {
    "ready_for_review": false,
    "blockers": ["T004-T006 pending"]
  }
}
```

### tasks.md Checkboxes as Source of Truth

**Current Problem:** Checkboxes exist but are ignored on re-run.

**Proposed Behavior:**

| Scenario                               | Behavior                   |
| -------------------------------------- | -------------------------- |
| Checkbox `[x]` + checkpoint "complete" | Skip task                  |
| Checkbox `[x]` + no checkpoint         | Skip task (trust markdown) |
| Checkbox `[ ]` + checkpoint "complete" | **Conflict** - ask user    |
| Checkbox `[ ]` + checkpoint "failed"   | Retry task                 |
| `--force` flag                         | Ignore checkboxes, run all |

**Sync Strategy:**

1. Checkpoint is primary source of truth for current session
2. tasks.md checkboxes are updated in real-time as tasks complete
3. On `/implement` start, reconcile checkpoint with tasks.md

### Additional Flags

```bash
/implement --resume              # Continue from checkpoint
/implement --skip=T003           # Skip specific task(s)
/implement --mark-done=T003      # Mark complete without executing
/implement --reset               # Clear checkpoint, start fresh
/implement --dry-run             # Show what would execute
/implement --status              # Show current checkpoint state
```

---

## 2. Agent Consistency

### Current State: Duplicated Orchestration

All 4 agents (code, ui, docs, eval) contain **identical** orchestration logic:

| Duplicated Element         | Lines per Agent | Total Duplication |
| -------------------------- | --------------- | ----------------- |
| 3-phase flow documentation | ~50             | 200 lines         |
| Dynamic sizing logic       | ~30             | 120 lines         |
| Task() spawning examples   | ~40             | 160 lines         |
| Error handling (retry)     | ~25             | 100 lines         |
| Context compaction rules   | ~30             | 120 lines         |
| **Total**                  | **~175**        | **~700 lines**    |

### Proposed: Shared Orchestrator Template

**New File:** `.claude/agents/templates/implementation-orchestrator.md`

````markdown
# Implementation Orchestrator Template

## Model Assignment

```text
{agent-name} (orchestrator, Opus)
│
│ (dynamic sizing based on context)
│
├── agentCount == 1:
│   └─► domain-writer (mode={domain}, Sonnet)
│
├── agentCount == 2:
│   ├─► domain-researcher (mode={domain}, Opus)
│   └─► domain-writer (mode={domain}, Sonnet)
│
└── agentCount >= 3:
    ├─► domain-researcher (mode={domain}, Opus)
    ├─► domain-writer (mode={domain}, Sonnet)
    └─► quality-validator (Haiku)
```
````

## Orchestration Workflow

```text
/implement routes to {agent-name} (for {domain} tasks)
    │
    ├── Load checkpoint (or create new)
    │
    ├── For each pending task:
    │   │
    │   ├── Task(domain-researcher, model: opus)
    │   │     └── Returns: decision, context_summary (~500 tokens)
    │   │
    │   ├── IF decision == STOP: Save checkpoint, halt
    │   ├── IF decision == CLARIFY: Ask user, re-run
    │   │
    │   ├── Task(domain-writer, model: sonnet)
    │   │     └── Receives: context_summary from researcher
    │   │     └── Returns: files_changed, context_summary
    │   │
    │   ├── Task(quality-validator, model: haiku)
    │   │     └── Receives: files_changed from writer
    │   │     └── Returns: PASS or FAIL with issues
    │   │
    │   ├── IF validation FAIL: Retry writer (max 2)
    │   │
    │   └── Update checkpoint: mark task complete
    │
    └── All tasks complete → ready for /review
```

## Variables

| Variable         | Description                                  |
| ---------------- | -------------------------------------------- |
| `{agent-name}`   | code-agent, ui-agent, docs-agent, eval-agent |
| `{domain}`       | backend, frontend, docs, eval                |
| `{phase-2-name}` | IMPLEMENT, BUILD, WRITE, CREATE              |
| `{methodology}`  | TDD, TDD, None, EDD                          |

````

### Refactored Agent Files

**code-agent.md (after):**

```markdown
---
name: code-agent
description: Backend implementation using TDD methodology
template: implementation-orchestrator
---

# Code Agent

Extends: [implementation-orchestrator](./templates/implementation-orchestrator.md)

## Configuration

| Variable | Value |
| -------- | ----- |
| domain | backend |
| phase-2-name | IMPLEMENT |
| methodology | TDD |

## Domain-Specific Skills

- **tdd-workflow** - Red-Green-Refactor cycle
- **backend-patterns** - tRPC, Prisma, API patterns

## Domain-Specific MCP Servers

- cclsp, context7, next-devtools

## Domain-Specific Instructions

[Backend-specific details only - orchestration is inherited]
````

**Savings:** ~600 lines across 4 agent files (85% reduction in duplication)

---

## 3. Spec Consumption

### Current State: /implement Reads 3 Files

| File                              | Size           | Used For                    |
| --------------------------------- | -------------- | --------------------------- |
| `specs/{feature}/requirements.md` | ~125 lines     | Context (rarely referenced) |
| `specs/{feature}/design.md`       | ~128 lines     | Routing, architecture       |
| `specs/{feature}/tasks.md`        | ~108 lines     | Task list (primary)         |
| **Total**                         | **~361 lines** | Full context load           |

### Proposed: Read tasks.md + summary.md Only

From `/design` optimization, a `summary.md` is proposed:

```markdown
# {Feature} Summary

> **Status:** Approved
> **Created:** 2026-01-28
> **Tasks:** 0/12 complete

## What

JWT-based authentication with login/logout/session management.

## Key Decisions

- JWT tokens stored in httpOnly cookies
- bcrypt for password hashing
- 24-hour token expiration

## Architecture Summary

- Prisma User model with email/passwordHash
- tRPC auth router with login/logout mutations
- Session context provider for React
```

**New /implement Flow:**

```text
/implement
    │
    ├── Read specs/{feature}/tasks.md      (always - task list)
    │
    ├── Read specs/{feature}/summary.md    (always - context)
    │
    ├── Read specs/{feature}/design.md     (only for routing detection)
    │
    └── Read specs/{feature}/requirements.md  (NEVER - not needed)
```

**Context Reduction:** ~361 → ~158 lines (56% reduction)

### Proposed: Machine-Readable Task Format

Extend `tasks.md` with structured metadata:

```markdown
---
feature: user-auth
total_tasks: 12
phases: 4
status: in_progress
---

## Phase 1: Database Schema (Tasks T001-T003)

- [ ] **T001** Create User model in Prisma schema
  - _Files:_ `prisma/schema.prisma`
  - _Tests:_ None (schema only)
  - _Depends:_ None

- [ ] **T002** Generate and run migration
  - _Files:_ `prisma/migrations/*`
  - _Tests:_ None
  - _Depends:_ T001

- [ ] **T003** Write User model tests
  - _Files:_ `src/lib/__tests__/user.test.ts`
  - _Tests:_ Self
  - _Depends:_ T002
```

This allows `/implement` to:

1. Parse task metadata programmatically
2. Build dependency graph
3. Execute in correct order
4. Track file outputs per task

---

## 4. Progress Reporting

### Current Preview (from implement.md)

```text
┌─────────────────────────────────────────────────────────────────┐
│  /implement                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Spec: specs/user-authentication/ (approved)                    │
│  Tasks: 12 across 4 phases                                      │
│  TDD: Enabled (red → green → refactor)                          │
│                                                                 │
│  STAGE 1: DATABASE SCHEMA                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: code-agent                                           ││
│  │ ... (task details)                                          ││
│  └─────────────────────────────────────────────────────────────┘│
```

### Proposed: Task-Level Progress

```text
┌─────────────────────────────────────────────────────────────────┐
│  /implement                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Spec: specs/user-auth/ (approved)                              │
│  Progress: 3/12 tasks complete (25%)                            │
│  Current: T004 - Create auth router                             │
│                                                                 │
│  PHASE 1: DATABASE SCHEMA                       [3/3 COMPLETE]  │
│    ✓ T001 Create User model                           [0:42]    │
│    ✓ T002 Generate migration                          [0:31]    │
│    ✓ T003 Write User tests                            [1:15]    │
│                                                                 │
│  PHASE 2: AUTH MUTATIONS                        [0/3 PENDING]   │
│    ● T004 Create auth router                      [RUNNING]     │
│      └── domain-writer (Sonnet) - Writing tests...              │
│    ○ T005 Implement login mutation                              │
│    ○ T006 Implement logout mutation                             │
│                                                                 │
│  PHASE 3: SESSION MANAGEMENT                    [0/3 PENDING]   │
│  PHASE 4: FINAL VERIFICATION                    [0/3 PENDING]   │
│                                                                 │
│  ████████░░░░░░░░░░░░░░░░░░░░░░ 25% | T004 | 2m 28s elapsed     │
├─────────────────────────────────────────────────────────────────┤
│  [Enter] Continue  [P] Pause  [S] Skip T004  [Esc] Cancel       │
└─────────────────────────────────────────────────────────────────┘
```

### Real-Time Checkbox Updates

**Proposed Behavior:**

1. When task completes successfully:
   - Update checkpoint: `tasks.T004.status = "complete"`
   - Edit tasks.md: `- [ ] **T004**` → `- [x] **T004**`
   - Commit message: "checkpoint: complete T004"

2. User can see progress in real-time by:
   - Watching `/implement` output
   - Opening `tasks.md` in another window
   - Running `/implement --status`

### Progress Skill Integration

From cross-command-analysis, a unified progress component is proposed:

```text
/{command} - {Description}

Stage 1/N: {STAGE_NAME}
  ● Running: {sub-agent} ({Model})
  ├── {current_action}...
  └── Elapsed: {time}

[==============================] 33% | Stage 1/3 | 1m 23s elapsed
```

**Adaptation for /implement:**

- Replace "Stage" with "Task"
- Show phase grouping
- Include checkpoint indicator

---

## 5. Handoff to /review

### Current State

No explicit handoff mechanism. User runs `/review` manually after `/implement` finishes.

### Proposed: files-changed.json Manifest

**Location:** `.claude/state/implement-output.json`

```json
{
  "feature": "user-auth",
  "completed_at": "2026-01-28T10:30:00Z",
  "spec_path": "specs/user-auth/",

  "summary": {
    "tasks_completed": 12,
    "files_created": 8,
    "files_modified": 3,
    "tests_written": 24,
    "coverage": 87
  },

  "files": {
    "created": [
      { "path": "prisma/schema.prisma", "task": "T001" },
      { "path": "src/server/routers/auth.ts", "task": "T004" },
      { "path": "src/server/routers/auth.test.ts", "task": "T004" },
      { "path": "src/components/LoginForm.tsx", "task": "T007" }
    ],
    "modified": [
      { "path": "prisma/schema.prisma", "task": "T002", "type": "migration" },
      { "path": "src/server/routers/_app.ts", "task": "T004", "type": "import" }
    ]
  },

  "tests": {
    "total": 24,
    "passed": 24,
    "failed": 0,
    "coverage_by_file": {
      "src/server/routers/auth.ts": 92,
      "src/lib/auth.ts": 88,
      "src/components/LoginForm.tsx": 85
    }
  },

  "ready_for_review": true,
  "recommended_review_scope": "backend" | "frontend" | "full"
}
```

### /review Integration

`/review` can optionally read this manifest:

```bash
# Current behavior (review all uncommitted)
/review

# New behavior (review only /implement output)
/review --from-implement

# Or auto-detect
/review  # Detects implement-output.json, asks if user wants scoped review
```

**Benefits:**

1. `/review` knows exactly what changed
2. Can prioritize review of new files over modified
3. Can skip files not in manifest
4. Provides task traceability

---

## Deliverables Summary

### 1. Proposed File Changes

| File                                                      | Change Type | Description                                              |
| --------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `.claude/commands/implement.md`                           | Modify      | Add flag documentation (--task, --phase, --resume, etc.) |
| `.claude/agents/code-agent.md`                            | Modify      | Reference shared template, remove duplication            |
| `.claude/agents/ui-agent.md`                              | Modify      | Reference shared template, remove duplication            |
| `.claude/agents/docs-agent.md`                            | Modify      | Reference shared template, remove duplication            |
| `.claude/agents/eval-agent.md`                            | Modify      | Reference shared template, remove duplication            |
| `.claude/agents/templates/implementation-orchestrator.md` | **Create**  | Shared orchestration template                            |
| `.claude/skills/implement-checkpoint/SKILL.md`            | **Create**  | Checkpoint management skill                              |
| `specs/templates/tasks.md`                                | Modify      | Add task ID format, metadata frontmatter                 |

### 2. Proposed State Files

| File                                      | Purpose                | Created By | Read By             |
| ----------------------------------------- | ---------------------- | ---------- | ------------------- |
| `.claude/state/implement-checkpoint.json` | Task progress tracking | /implement | /implement, /status |
| `.claude/state/implement-output.json`     | Files changed manifest | /implement | /review             |

### 3. Unified Patterns Adopted

| Pattern                        | Source                 | Adopted For               |
| ------------------------------ | ---------------------- | ------------------------- |
| State file in `.claude/state/` | /review                | /implement checkpoint     |
| context_summary ≤500 tokens    | cross-command          | Already compliant         |
| Checkpoint schema              | cross-command-analysis | implement-checkpoint.json |
| Progress indicators (✓●○✗⊘)    | cross-command-analysis | Task progress display     |
| Preview box format             | cross-command-analysis | Already compliant         |

### 4. /implement-Specific Optimizations

| Optimization                         | Priority     | Effort  | Impact                            |
| ------------------------------------ | ------------ | ------- | --------------------------------- |
| Add `--task=T001` flag               | **Critical** | 1 day   | Enables granular execution        |
| Add `--phase=1` flag                 | **Critical** | 4 hours | Enables phase-specific runs       |
| Create checkpoint.json               | **Critical** | 1 day   | Enables resume, progress tracking |
| Add `--resume` flag                  | **High**     | 4 hours | Crash recovery                    |
| Shared orchestrator template         | **High**     | 1 day   | 85% code reduction                |
| Read summary.md instead of all files | **Medium**   | 2 hours | 56% context reduction             |
| Create implement-output.json         | **Medium**   | 4 hours | Better /review handoff            |
| Real-time checkbox updates           | **Medium**   | 2 hours | Visual progress                   |
| Task ID format in tasks.md           | **Medium**   | 1 hour  | Enable --task flag                |
| Add `--dry-run` flag                 | **Low**      | 2 hours | Safety/debugging                  |
| Add `--status` flag                  | **Low**      | 1 hour  | Progress inspection               |

---

## Implementation Order

```text
Phase 1: Foundation (Day 1)
├── Add task ID format to tasks.md template
├── Create implement-checkpoint.json schema
├── Create implement-checkpoint skill
└── Modify /implement to read/write checkpoint

Phase 2: Flags (Day 2)
├── Add --task=T001 flag
├── Add --phase=1 flag
├── Add --resume flag
└── Add --status flag

Phase 3: Agent Consolidation (Day 3)
├── Create implementation-orchestrator.md template
├── Refactor code-agent.md
├── Refactor ui-agent.md
├── Refactor docs-agent.md
└── Refactor eval-agent.md

Phase 4: Integration (Day 4)
├── Create implement-output.json manifest
├── Modify /review to optionally read manifest
├── Add real-time checkbox updates
└── Add --dry-run flag
```

---

## Success Criteria

| Metric                 | Current    | Target                         |
| ---------------------- | ---------- | ------------------------------ |
| Run single task        | Impossible | `/implement --task=T001` works |
| Resume after failure   | Start over | `/implement --resume` works    |
| Agent code duplication | ~700 lines | <100 lines                     |
| Spec context loaded    | ~361 lines | <160 lines                     |
| Checkpoint persistence | None       | Full task state saved          |
| /review handoff        | Manual     | Automatic via manifest         |
