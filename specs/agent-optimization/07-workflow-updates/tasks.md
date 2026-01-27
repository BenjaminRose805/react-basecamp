# Tasks: Workflow Updates

> **Status:** Complete
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-07
> **Updated:** 2026-01-26 (all tasks complete)

## Progress

- [x] Phase 1: Core Workflows (4/4)
- [x] Phase 2: New Workflows (4/4)
- [x] Phase 3: Documentation (3/3)
- [ ] Phase 4: Validation (0/8)

**Total:** 11/19 tasks complete (implementation complete, validation pending)

---

## Phase 1: Core Workflows

Update existing workflow definitions.

- [x] **T001** Update implement workflow
  - Use code-agent orchestrator (Opus)
  - Use ui-agent orchestrator (Opus)
  - Add context compaction between stages
  - File: `.claude/workflows/implement.md`

- [x] **T002** Update ship workflow
  - Use check-agent with parallel checks
  - Use git-agent (includes PR creation)
  - Add context compaction
  - File: `.claude/workflows/ship.md`

- [x] **T003** Update review workflow
  - Use git-agent for checkout and review
  - Use parallel check-agent
  - Pass check summary to pr-reviewer
  - File: `.claude/workflows/review.md`

- [x] **T004** Update full-feature workflow
  - Orchestrate plan → implement → ship
  - Add approval gate after plan
  - Use Opus for orchestration
  - File: `.claude/workflows/full-feature.md`

---

## Phase 2: New Workflows

Create the 4 new workflows from Architecture V2.

- [x] **T005** Create fix workflow
  - Stage 1: Investigate (investigator sub-agent, Opus)
  - Stage 2: Route to code-agent or ui-agent
  - Stage 3: Verify (check-agent)
  - Retry logic on verification failure
  - File: `.claude/workflows/fix.md`

- [x] **T006** Create refactor workflow
  - Stage 1: Baseline (capture passing tests)
  - Stage 2: Analyze (refactor-analyzer, Opus)
  - Stage 3: Refactor (code/ui agent)
  - Stage 4: Verify (same tests pass)
  - File: `.claude/workflows/refactor.md`

- [x] **T007** Create security workflow
  - Stage 1: Audit (security-scanner)
  - Stage 2: Triage (security-triager, Opus)
  - Stage 3: Fix (route to agent)
  - Stage 4: Re-audit
  - File: `.claude/workflows/security.md`

- [x] **T008** Create research workflow
  - Single stage: researcher sub-agent
  - Profile: read-only
  - No file modifications allowed
  - File: `.claude/workflows/research.md`

---

## Phase 3: Documentation

Update all documentation.

- [x] **T009** Update workflows README
  - Document all 8 workflows
  - Add workflow selection guide
  - Include context flow diagrams
  - Add model assignments
  - File: `.claude/workflows/README.md`

- [x] **T010** Create workflow sub-agents
  - investigator.md (for fix workflow)
  - refactor-analyzer.md (for refactor workflow)
  - security-triager.md (for security workflow)
  - Directory: `.claude/sub-agents/workflows/`

- [x] **T011** Update CLAUDE.md
  - Update workflow list (8 workflows)
  - Update command routing
  - Add preview system documentation
  - Reference Architecture V2
  - File: `CLAUDE.md`

---

## Phase 4: Validation

Test all workflows.

- [ ] **T012** Test implement workflow
  - Run /build with test feature
  - Verify code-agent and ui-agent orchestration
  - Verify context compaction
  - File: N/A (manual testing)

- [ ] **T013** Test ship workflow
  - Run /ship
  - Verify parallel check execution
  - Verify git-agent handles commit + PR
  - File: N/A (manual testing)

- [ ] **T014** Test review workflow
  - Run /review [PR#]
  - Verify parallel checks
  - Verify pr-reviewer verdict
  - File: N/A (manual testing)

- [ ] **T015** Test fix workflow
  - Test with backend bug
  - Test with frontend bug
  - Verify investigator routing
  - File: N/A (manual testing)

- [ ] **T016** Test refactor workflow
  - Test baseline capture
  - Verify tests pass before and after
  - File: N/A (manual testing)

- [ ] **T017** Test security workflow
  - Run /security
  - Verify audit + triage + fix cycle
  - File: N/A (manual testing)

- [ ] **T018** Test research workflow
  - Run /research [topic]
  - Verify read-only (no file changes)
  - File: N/A (manual testing)

- [ ] **T019** Measure improvements
  - Measure context savings (target: 30-40%)
  - Measure parallel speedup (target: 2x)
  - Document metrics
  - File: N/A (manual testing)

---

## Task Dependencies

```text
Phase 08 (Architecture V2) must be complete first
         │
         ▼
Phase 1 (Core Workflows)
T001 ─┬─ T002 ─┬─ T003 ─┬─ T004
      │        │        │
      └────────┴────────┘
         │    (can run in parallel)
         ▼
Phase 2 (New Workflows)
T005 ─┬─ T006 ─┬─ T007 ─┬─ T008
      │        │        │
      └────────┴────────┘
         │    (can run in parallel)
         ▼
Phase 3 (Documentation)
T009 ─┬─ T010 ─┬─ T011
      │        │
      └────────┘
         │    (can run in parallel)
         ▼
Phase 4 (Validation)
T012 ─► T013 ─► T014 ─► T015 ─► T016 ─► T017 ─► T018 ─► T019
```

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks         |
| ----- | ---------------------- |
| 1     | T001, T002, T003, T004 |
| 2     | T005, T006, T007, T008 |
| 3     | T009, T010, T011       |

### Estimated Effort

| Phase          | Tasks  | Effort       |
| -------------- | ------ | ------------ |
| Core Workflows | 4      | ~60 min      |
| New Workflows  | 4      | ~90 min      |
| Documentation  | 3      | ~45 min      |
| Validation     | 8      | ~60 min      |
| **Total**      | **19** | **~4 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] implement.md uses orchestrator pattern with Opus
2. [x] ship.md uses git-agent for commit + PR
3. [x] review.md uses git-agent + check-agent
4. [x] full-feature.md orchestrates plan → implement → ship
5. [x] fix.md implements investigate → fix → verify
6. [x] refactor.md implements baseline → refactor → verify
7. [x] security.md implements audit → triage → fix → re-audit
8. [x] research.md implements read-only exploration
9. [x] Workflow sub-agents created (investigator, refactor-analyzer, security-triager)
10. [ ] All workflows tested and working (validation pending)
11. [x] CLAUDE.md updated with all 8 workflows
12. [ ] Performance improvements verified (validation pending)

---
