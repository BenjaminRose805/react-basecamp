# Tasks: Workflow Updates

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-07

## Progress

- [ ] Phase 1: Workflow Updates (0/4)
- [ ] Phase 2: Documentation (0/2)
- [ ] Phase 3: Validation (0/4)

**Total:** 0/10 tasks complete

---

## Phase 1: Workflow Updates

Update workflow definitions to use optimized agents.

- [ ] **T001** [US1] Update implement workflow
  - Use code-agent orchestrator
  - Use ui-agent orchestrator
  - Add context compaction between stages
  - File: `.claude/workflows/implement.md`

- [ ] **T002** [US2] Update ship workflow
  - Use check-agent with parallel checks
  - Document performance expectations
  - Add context compaction
  - File: `.claude/workflows/ship.md`

- [ ] **T003** [US3] Update review workflow
  - Use parallel check-agent
  - Pass check summary to pr-agent
  - File: `.claude/workflows/review.md`

- [ ] **T004** [US4] Create full-feature workflow
  - Orchestrate plan → implement → ship
  - Add approval gate after plan
  - Document context flow
  - File: `.claude/workflows/full-feature.md`

---

## Phase 2: Documentation

Update documentation to reflect new architecture.

- [ ] **T005** [US5] Update workflow documentation
  - Add sub-agent flow diagrams
  - Document context handoffs
  - Include performance expectations
  - File: `.claude/workflows/README.md`

- [ ] **T006** [US5] Update CLAUDE.md
  - Reference updated workflows
  - Update architecture diagram
  - Add performance metrics
  - File: `CLAUDE.md`

---

## Phase 3: Validation

Verify all workflows work with optimized agents.

- [ ] **T007** [US1] Test implement workflow
  - Run /build with test feature
  - Verify code-agent and ui-agent orchestration
  - Verify context compaction
  - File: N/A (manual testing)

- [ ] **T008** [US2] Test ship workflow
  - Run /ship
  - Verify parallel check execution
  - Measure timing (target: 2x faster)
  - File: N/A (manual testing)

- [ ] **T009** [US3] Test review workflow
  - Run /pr review [number]
  - Verify parallel checks
  - Verify verdict generation
  - File: N/A (manual testing)

- [ ] **T010** [US4] Test full-feature workflow (if implemented)
  - Run /feature [name]
  - Verify all stages complete
  - Measure total timing
  - File: N/A (manual testing)

---

## Task Dependencies

```text
(All agent specs complete)
         │
         ▼
T001 ──┬── T002 ──┬── T003 ──► T004
       │          │
       └──────────┴──────────► T005 ──► T006
                                   │
                                   ▼
                              T007 ──► T008 ──► T009 ──► T010
```

**Legend:**

- T001-T003 can run in parallel
- T004 depends on T001-T003 completion
- T007-T010 are sequential validation

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks   |
| ----- | ---------------- |
| 1     | T001, T002, T003 |

### Estimated Effort

| Phase            | Tasks  | Effort       |
| ---------------- | ------ | ------------ |
| Workflow Updates | 4      | ~60 min      |
| Documentation    | 2      | ~30 min      |
| Validation       | 4      | ~30 min      |
| **Total**        | **10** | **~2 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] implement.md updated with orchestrator usage
2. [ ] ship.md updated with parallel checks
3. [ ] review.md updated with parallel checks
4. [ ] full-feature.md created
5. [ ] Workflow README.md updated
6. [ ] CLAUDE.md updated
7. [ ] All workflows tested and working
8. [ ] Performance improvements verified (≥30% faster)
