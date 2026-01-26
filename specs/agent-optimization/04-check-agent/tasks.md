# Tasks: Check Agent Parallelization

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-04

## Progress

- [ ] Phase 1: Sub-Agent Definitions (0/6)
- [ ] Phase 2: Orchestrator Update (0/2)
- [ ] Phase 3: Validation (0/4)

**Total:** 0/12 tasks complete

---

## Phase 1: Sub-Agent Definitions

- [ ] **T001** [US1] Create check sub-agents directory
  - Create `.claude/sub-agents/check/` directory
  - File: `.claude/sub-agents/check/`

- [ ] **T002** [US1] Create build-checker sub-agent
  - Define build check behavior
  - Command: `pnpm build`
  - File: `.claude/sub-agents/check/build-checker.md`

- [ ] **T003** [US2] Create type-checker sub-agent
  - Define type check behavior
  - Command: `pnpm typecheck`
  - Specify haiku model
  - File: `.claude/sub-agents/check/type-checker.md`

- [ ] **T004** [US3] Create lint-checker sub-agent
  - Define lint check behavior
  - Command: `pnpm lint`
  - Specify haiku model
  - File: `.claude/sub-agents/check/lint-checker.md`

- [ ] **T005** [US4] Create test-runner sub-agent
  - Define test run behavior
  - Command: `pnpm test:run`
  - Include coverage reporting
  - Specify haiku model
  - File: `.claude/sub-agents/check/test-runner.md`

- [ ] **T006** [US5] Create security-scanner sub-agent
  - Define security check patterns
  - Include console.log, secrets, TODO checks
  - Specify haiku model
  - File: `.claude/sub-agents/check/security-scanner.md`

---

## Phase 2: Orchestrator Update

- [ ] **T007** [US1, US6] Update check-agent to orchestrator
  - Change from sequential to parallel orchestration
  - Implement build-first pattern
  - Support scoped checks (/check [type])
  - File: `.claude/agents/check-agent.md`

- [ ] **T008** [US1] Implement result aggregation
  - Document aggregation logic
  - Define unified report format
  - Include timing information
  - File: `.claude/agents/check-agent.md`

---

## Phase 3: Validation

- [ ] **T009** [US1] Test parallel execution
  - Run `/check` with all checks
  - Verify parallel spawning (run_in_background)
  - Verify aggregated report
  - File: N/A (manual testing)

- [ ] **T010** [US6] Test scoped checks
  - Test `/check build`
  - Test `/check types`
  - Test `/check lint`
  - Test `/check tests`
  - Test `/check security`
  - File: N/A (manual testing)

- [ ] **T011** [NFR-1] Measure performance improvement
  - Time sequential execution (current)
  - Time parallel execution (new)
  - Target: ≥2x speedup
  - File: N/A (measurement)

- [ ] **T012** [NFR-2] Verify cost optimization
  - Confirm all sub-agents use haiku model
  - Compare cost to sequential execution
  - File: N/A (verification)

---

## Task Dependencies

```text
(01-infrastructure complete)
         │
         ▼
T001 ──► T002 ─┐
         T003 ─┤
         T004 ─┼──► T007 ──► T008
         T005 ─┤         │
         T006 ─┘         ▼
                    T009 ──► T010 ──► T011 ──► T012
```

**Legend:**

- T002-T006 (sub-agents) can run in parallel after T001
- T009-T012 (validation) are sequential

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks               |
| ----- | ---------------------------- |
| 1     | T002, T003, T004, T005, T006 |

### Estimated Effort

| Phase                 | Tasks  | Effort      |
| --------------------- | ------ | ----------- |
| Sub-Agent Definitions | 6      | ~30 min     |
| Orchestrator Update   | 2      | ~20 min     |
| Validation            | 4      | ~20 min     |
| **Total**             | **12** | **~70 min** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] `.claude/sub-agents/check/` directory exists
2. [ ] All 5 checker sub-agents defined
3. [ ] check-agent.md updated to parallel orchestration
4. [ ] Scoped checks work (/check [type])
5. [ ] Performance improvement measured (≥2x)
6. [ ] All sub-agents use haiku model
