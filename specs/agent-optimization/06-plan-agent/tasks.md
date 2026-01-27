# Tasks: Plan Agent Optimization

> **Status:** In Progress
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-06

## Progress

- [x] Phase 1: Sub-Agent Definitions (6/6)
- [x] Phase 2: Orchestrator Update (2/2)
- [ ] Phase 3: Validation (0/3)

**Total:** 8/11 tasks complete

---

## Phase 1: Sub-Agent Definitions

- [x] **T001** [US1] Create plan sub-agents directory
  - Create `.claude/sub-agents/plan/` directory
  - File: `.claude/sub-agents/plan/`
  - **Done:** Directory created with README.md

- [x] **T002** [US1, US2] Create requirement-analyzer sub-agent
  - Define EARS parsing behavior
  - Include ambiguity detection
  - File: `.claude/sub-agents/plan/requirement-analyzer.md`
  - **Done:** Created with EARS format reference, ambiguity detection, context_summary output

- [x] **T003** [US1, US2] Create dependency-analyzer sub-agent
  - Define codebase search behavior
  - Include conflict detection
  - File: `.claude/sub-agents/plan/dependency-analyzer.md`
  - **Done:** Created with codebase search, conflict detection, integration points

- [x] **T004** [US1, US2] Create task-decomposer sub-agent
  - Define task breakdown behavior
  - Include phase grouping
  - File: `.claude/sub-agents/plan/task-decomposer.md`
  - **Done:** Created with phased task structure, effort estimation, dependency graph

- [x] **T005** [US3] Create plan-writer sub-agent
  - Define spec file creation behavior
  - Reference EARS and RFC 2119
  - File: `.claude/sub-agents/plan/plan-writer.md`
  - **Done:** Pre-existing, updated with analysis_summary input

- [x] **T006** [US4] Create plan-validator sub-agent (plan-qa)
  - Define validation checklist
  - Specify haiku model
  - File: `.claude/sub-agents/plan/plan-validator.md`
  - **Done:** Pre-existing, uses haiku model, comprehensive checklist

---

## Phase 2: Orchestrator Update

- [x] **T007** [US1, US5] Update plan-agent to orchestrator
  - Implement parallel analyzer spawning
  - Implement aggregation
  - Support subcommands
  - File: `.claude/agents/plan-agent.md`
  - **Done:** Full orchestration workflow documented with parallel analysis, context compaction

- [x] **T008** [US5] Document subcommand support
  - /plan research
  - /plan write
  - /plan validate
  - File: `.claude/agents/plan-agent.md`
  - **Done:** Subcommands documented in Orchestration Workflow section

---

## Phase 3: Validation

- [ ] **T009** [US1] Test parallel analysis
  - Run /plan [test-feature]
  - Verify parallel execution
  - Measure timing improvement
  - Target: ≥2x faster
  - File: N/A (manual testing)

- [ ] **T010** [US4] Test spec validation
  - Create spec with intentional gaps
  - Verify plan-qa catches issues
  - File: N/A (manual testing)

- [ ] **T011** [NFR-2] Measure context efficiency
  - Compare monolithic vs sub-agent
  - Target: ≥20% savings
  - File: N/A (measurement)

---

## Task Dependencies

```text
(01-infrastructure + 05-context-compaction complete)
         │
         ▼
T001 ──► T002 ─┐
         T003 ─┤
         T004 ─┼──► T005 ──► T006 ──► T007 ──► T008
               │
               └─────────────────────► T009 ──► T010 ──► T011
```

**Legend:**

- T002-T004 (analyzers) can run in parallel
- T005-T006 (writer, qa) are sequential

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] `.claude/sub-agents/plan/` directory exists
2. [x] 3 analyzer sub-agents defined (requirement-analyzer, dependency-analyzer, task-decomposer)
3. [x] plan-writer sub-agent defined
4. [x] plan-validator sub-agent defined (haiku)
5. [x] plan-agent.md updated to orchestrator
6. [x] Subcommands documented (/plan research|write|validate)
7. [ ] Parallel analysis verified (≥2x faster) - **Manual testing required**
8. [ ] Context savings measured (≥20%) - **Manual measurement required**
