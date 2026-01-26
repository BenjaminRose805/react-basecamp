# Tasks: UI Agent 3-Agent Pattern

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-03

## Progress

- [ ] Phase 1: Sub-Agent Definitions (0/4)
- [ ] Phase 2: Orchestrator Update (0/2)
- [ ] Phase 3: Validation (0/3)

**Total:** 0/9 tasks complete

---

## Phase 1: Sub-Agent Definitions

- [ ] **T001** [US1] Create ui-researcher sub-agent
  - Create `.claude/sub-agents/ui/` directory
  - Define shadcn, figma, component search behavior
  - File: `.claude/sub-agents/ui/ui-researcher.md`

- [ ] **T002** [US2] Create ui-builder sub-agent
  - Define component building behavior
  - Reference frontend-patterns skill
  - Include shadcn CLI usage
  - File: `.claude/sub-agents/ui/ui-builder.md`

- [ ] **T003** [US3] Create ui-qa sub-agent
  - Define type, test, accessibility checks
  - Specify haiku model
  - Include playwright visual testing option
  - File: `.claude/sub-agents/ui/ui-qa.md`

- [ ] **T004** [US1-3] Create ui sub-agents README
  - Document the 3-agent pattern for UI
  - File: `.claude/sub-agents/ui/README.md`

---

## Phase 2: Orchestrator Update

- [ ] **T005** [US4] Update ui-agent to orchestrator
  - Change from monolithic to orchestrator
  - Define sub-agent spawning
  - Maintain backward compatible commands
  - File: `.claude/agents/ui-agent.md`

- [ ] **T006** [US4] Document error handling
  - STOP, CLARIFY, retry logic
  - File: `.claude/agents/ui-agent.md`

---

## Phase 3: Validation

- [ ] **T007** [US4] Test full workflow
  - Invoke `/ui [test-component]`
  - Verify all 3 sub-agents spawn
  - File: N/A (manual testing)

- [ ] **T008** [US4] Test with shadcn integration
  - Verify shadcn registry lookup works
  - Verify shadcn add command works
  - File: N/A (manual testing)

- [ ] **T009** [NFR-1] Measure context efficiency
  - Compare monolithic vs sub-agent context usage
  - Target: ≥20% savings
  - File: N/A (measurement)

---

## Task Dependencies

```text
(01-infrastructure complete)
         │
         ▼
T001 ──┬── T002 ──┬── T003 ──► T004
       │          │
       └──────────┴──────────► T005 ──► T006
                                   │
                                   ▼
                              T007 ──► T008 ──► T009
```

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] `.claude/sub-agents/ui/` directory exists
2. [ ] ui-researcher.md defines research sub-agent
3. [ ] ui-builder.md defines build sub-agent
4. [ ] ui-qa.md defines validation sub-agent
5. [ ] ui-agent.md updated to orchestrator
6. [ ] Full workflow tested
7. [ ] Context savings measured (≥20%)
