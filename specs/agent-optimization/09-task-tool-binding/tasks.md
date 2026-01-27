# Tasks: Task Tool Binding

> **Status:** In Progress
> **Created:** 2026-01-26
> **Updated:** 2026-01-26
> **Spec ID:** agent-opt-09

## Progress

- [x] Phase 1: Create New Commands (4/4) - start, implement, guide, mode
- [x] Phase 2: Update Existing Commands (2/2) - plan, ship
- [x] Phase 3: Delete Old Commands (11/11) - removed deprecated commands
- [x] Phase 4: Update Agent Files (7/7) - add CRITICAL EXECUTION REQUIREMENT
- [x] Phase 5: Update CLAUDE.md (1/1) - new 6-command structure
- [x] Phase 6: Update Skills (3/3) - preview, progress, routing
- [ ] Phase 7: Validation (0/5) - test full flow

**Total:** 28/33 tasks complete

---

## Phase 1: Create New Commands

Create the 4 new command files.

- [x] **T001** Create start command ✓
  - Create `.claude/commands/start.md`
  - Prompt for feature name if not provided
  - Show preview (worktree path, branch name, next steps)
  - Execute: `git worktree add ../project-{name} -b feature/{name}`
  - Output: Restart instructions + suggest `/plan`

- [x] **T002** Create implement command ✓
  - Create `.claude/commands/implement.md`
  - Check for approved spec (error if none)
  - Show preview (all stages, agents, sub-agents, TDD phases)
  - Route to appropriate agents based on spec content
  - Include final verification (build, types, lint, tests, security)
  - Show progress during execution
  - Output: Files created + verification results

- [x] **T003** Create guide command ✓
  - Create `.claude/commands/guide.md`
  - Show current feature and branch
  - Show progress (start → plan → implement → ship)
  - Show suggested next action
  - List available commands
  - No preview needed (informational only)

- [x] **T004** Create mode command ✓
  - Create `.claude/commands/mode.md`
  - Show current mode when no argument
  - Switch to `basic` mode (disable orchestration, previews)
  - Switch to `dev` mode (enable orchestration, previews)
  - Immediate effect, no preview needed

---

## Phase 2: Update Existing Commands

Update plan and ship commands with new functionality.

- [x] **T005** Update plan command ✓
  - Update `.claude/commands/plan.md`
  - Remove arguments (conversational, not one-shot)
  - Add mode detection (define vs reconcile)
  - Define mode: Ask questions → preview → generate spec → ask approval
  - Reconcile mode: Detect CodeRabbit comments → preview → create fix plan
  - Show preview before spec generation
  - Show progress during execution
  - Ask for user approval of spec

- [x] **T006** Update ship command ✓
  - Update `.claude/commands/ship.md`
  - Show preview (commit, PR, CI, CodeRabbit stages)
  - Stage 1: Commit (change-analyzer → git-executor)
  - Stage 2: Create PR (pr-analyzer → git-executor)
  - Stage 3: Wait for CI (poll GitHub Actions)
  - Stage 4: Wait for CodeRabbit (poll for comments)
  - Handle outcomes:
    - Clean → offer to merge
    - Comments → recommend `/plan` to reconcile
    - CI fail → recommend `/plan` to fix
    - Rate limit → offer wait or force merge
  - Second ship: Post `@coderabbitai resolve`, commit, push, re-review

---

## Phase 3: Delete Old Commands

Delete deprecated commands (git history preserves them if needed).

- [x] **T007** Delete build.md ✓ (Replaced by /implement)
- [x] **T008** Delete code.md ✓ (Absorbed into /implement routing)
- [x] **T009** Delete ui.md ✓ (Absorbed into /implement routing)
- [x] **T010** Delete docs.md ✓ (Absorbed into /implement routing)
- [x] **T011** Delete eval.md ✓ (Absorbed into /implement routing)
- [x] **T012** Delete check.md ✓ (Absorbed into /implement)
- [x] **T013** Delete git.md ✓ (Absorbed into /start and /ship)
- [x] **T014** Delete pr.md ✓ (Absorbed into /ship)
- [x] **T015** Delete debug.md ✓ (Absorbed into /plan)
- [x] **T016** Delete help.md ✓ (Renamed to /guide)
- [x] **T017** Delete context.md ✓ (Renamed to /mode)

---

## Phase 4: Update Agent Files

Add CRITICAL EXECUTION REQUIREMENT to all agent files.

- [x] **T018** Update plan-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Read, Edit, Bash)
  - Include required Task() pattern
  - File: `.claude/agents/plan-agent.md`

- [x] **T019** Update code-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Read, Edit, Bash)
  - Include required Task() pattern
  - Include TDD sequencing (red → green)
  - File: `.claude/agents/code-agent.md`

- [x] **T020** Update ui-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Read, Edit, Bash)
  - Include required Task() pattern
  - File: `.claude/agents/ui-agent.md`

- [x] **T021** Update docs-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Read, Edit, Bash)
  - Include required Task() pattern
  - File: `.claude/agents/docs-agent.md`

- [x] **T022** Update eval-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Read, Edit, Bash)
  - Include required Task() pattern
  - File: `.claude/agents/eval-agent.md`

- [x] **T023** Update check-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct Bash for pnpm commands)
  - Include parallel Task() pattern
  - File: `.claude/agents/check-agent.md`

- [x] **T024** Update git-agent.md ✓
  - Add CRITICAL EXECUTION REQUIREMENT block at top of Instructions
  - Include anti-patterns (direct git/gh commands)
  - Include required Task() pattern
  - File: `.claude/agents/git-agent.md`

---

## Phase 5: Update CLAUDE.md

Update main documentation with new command structure.

- [x] **T025** Update CLAUDE.md ✓
  - Replace "Core Commands (5)" with new 6-command structure
  - Remove "Optional Power Commands" section
  - Update command table:
    - `/start` - Begin work (worktree + branch)
    - `/plan` - Design spec or reconcile PR feedback
    - `/implement` - Build approved spec
    - `/ship` - Commit + PR + CI + CodeRabbit
    - `/guide` - Status, help, orientation
    - `/mode` - Switch working modes
  - Update "Standard Development Flow" section
  - Update "Quick Flows" section
  - Add "Git is Invisible" note
  - Remove references to archived commands
  - Update command routing documentation

---

## Phase 6: Update Skills

Update skills (internal procedures agents invoke). Skills are NOT user commands.

**Reminder:** Commands (6) are for users. Skills are for agents.

- [x] **T026** Update preview skill ✓
  - Update `.claude/skills/preview/`
  - Define preview display format
  - Define user actions: [Enter] Run, [e] Edit, [?] Details, [Esc] Cancel
  - Integrate with all action commands (start, plan, implement, ship)
  - Skip in basic mode

- [x] **T027** Update progress skill ✓
  - Update `.claude/skills/progress/`
  - Define progress display format
  - Show stage status (running, complete, pending)
  - Show sub-agent completion times
  - Show current work description
  - Show overall progress bar

- [x] **T027b** Update routing skill ✓
  - Update `.claude/skills/routing/`
  - Detect spec type from content (backend, frontend, docs, eval, mixed)
  - Route to appropriate agent(s)
  - Invoked by `/implement` command

---

## Phase 7: Validation

Test the complete flow works correctly.

- [ ] **T028** Test /start flow
  - Run `/start test-feature`
  - Verify preview shows worktree + branch
  - Confirm execution
  - Verify worktree created
  - Verify restart instructions shown

- [ ] **T029** Test /plan → /implement flow
  - Run `/plan`
  - Verify conversational questioning
  - Verify preview shown before spec generation
  - Approve spec
  - Run `/implement`
  - Verify preview shows all stages
  - Verify TDD execution (red → green)
  - Verify final verification runs
  - Verify completion report

- [ ] **T030** Test /ship flow
  - Run `/ship`
  - Verify preview shows all stages
  - Verify commit created
  - Verify PR created
  - Verify CI monitoring works
  - Verify CodeRabbit monitoring works

- [ ] **T031** Test /plan reconcile mode
  - Simulate CodeRabbit comments on PR
  - Run `/plan`
  - Verify reconcile mode detected
  - Verify issues listed
  - Verify fix plan created
  - Run `/implement`
  - Run `/ship` (second time)
  - Verify `@coderabbitai resolve` posted

- [ ] **T032** Test /mode basic
  - Run `/mode basic`
  - Verify mode switched
  - Run `/plan`
  - Verify no preview shown
  - Verify direct tool use allowed
  - Run `/mode dev`
  - Verify mode restored

---

## Task Dependencies

```text
Phase 1 (Create New Commands)
T001 ─┬─ T002 ─┬─ T003 ─┬─ T004
      │        │        │
      └────────┴────────┘
              │    (can run in parallel)
              ▼
Phase 2 (Update Existing Commands)
T005 ─┬─ T006
      │
      └────────
              │    (can run in parallel)
              ▼
Phase 3 (Delete Old Commands)
T007 ─┬─ T008 ─┬─ ... ─┬─ T017
      │        │       │
      └────────┴───────┘
              │    (can run in parallel)
              ▼
Phase 4 (Update Agent Files)
T018 ─┬─ T019 ─┬─ ... ─┬─ T024
      │        │       │
      └────────┴───────┘
              │    (can run in parallel)
              ▼
Phase 5 (Update CLAUDE.md)
T025
              │
              ▼
Phase 6 (Update Skills)
T026 ─┬─ T027
      │
      └────────
              │    (can run in parallel)
              ▼
Phase 7 (Validation)
T028 ──► T029 ──► T030 ──► T031 ──► T032
```

---

## Parallel Execution Opportunities

| Phase | Parallel Tasks         |
| ----- | ---------------------- |
| 1     | T001, T002, T003, T004 |
| 2     | T005, T006             |
| 3     | T007-T017 (deleted)    |
| 4     | T018-T024 (all 7)      |
| 6     | T026, T027, T027b      |

---

## Estimated Effort

| Phase                    | Tasks  | Effort          |
| ------------------------ | ------ | --------------- |
| Create New Commands      | 4      | ~45 min         |
| Update Existing Commands | 2      | ~30 min         |
| Delete Old Commands      | 11     | ~5 min          |
| Update Agent Files       | 7      | ~25 min         |
| Update CLAUDE.md         | 1      | ~20 min         |
| Update Skills            | 3      | ~40 min         |
| Validation               | 5      | ~45 min         |
| **Total**                | **33** | **~3.75 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] 4 new command files created (start, implement, guide, mode)
2. [x] 2 existing command files updated (plan, ship)
3. [x] 11 old command files deleted (git history preserves)
4. [x] 7 agent files have CRITICAL EXECUTION REQUIREMENT blocks
5. [x] CLAUDE.md updated with 6-command structure
6. [x] Preview skill shows execution plan before action commands
7. [x] Progress skill shows real-time execution progress
8. [ ] Full flow works: `/start` → `/plan` → `/implement` → `/ship`
9. [ ] Reconcile flow works: CodeRabbit comments → `/plan` → `/implement` → `/ship`
10. [ ] Basic mode works: `/mode basic` disables orchestration
11. [ ] Previews show: [Enter] Run, [e] Edit, [?] Details, [Esc] Cancel
12. [ ] Git operations invisible to user (except restart instruction)
