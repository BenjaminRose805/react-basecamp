# Tasks: Code Agent 3-Agent Pattern

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-02

## Progress

- [ ] Phase 1: Sub-Agent Definitions (0/4)
- [ ] Phase 2: Orchestrator Update (0/3)
- [ ] Phase 3: Integration (0/2)
- [ ] Phase 4: Validation (0/4)

**Total:** 0/13 tasks complete

---

## Phase 1: Sub-Agent Definitions

Create the specialized sub-agent definition files.

- [ ] **T001** [US1] Create code-researcher sub-agent
  - Create `.claude/sub-agents/code/` directory
  - Define role, profile (research), input/output format
  - Document decision criteria
  - Include examples of findings format
  - File: `.claude/sub-agents/code/code-researcher.md`

- [ ] **T002** [US2] Create code-writer sub-agent
  - Define role, profile (writer), input/output format
  - Document TDD behavior
  - Include retry handling
  - Reference tdd-workflow skill
  - File: `.claude/sub-agents/code/code-writer.md`

- [ ] **T003** [US3] Create code-qa sub-agent
  - Define role, profile (validator), input/output format
  - Document all check types (types, lint, tests, security)
  - Specify haiku model for cost optimization
  - Include parallel execution option
  - File: `.claude/sub-agents/code/code-qa.md`

- [ ] **T004** [US1-3] Create code sub-agents README
  - Document the 3-agent pattern
  - Include workflow diagram
  - Reference each sub-agent
  - File: `.claude/sub-agents/code/README.md`

---

## Phase 2: Orchestrator Update

Update the main code-agent to orchestration role.

- [ ] **T005** [US4] Update code-agent to orchestrator
  - Change from monolithic to orchestrator role
  - Define sub-agent spawning logic
  - Document handoff flow
  - Maintain backward compatible commands
  - File: `.claude/agents/code-agent.md`

- [ ] **T006** [US4] Implement handoff creation logic
  - Document how to create research handoff
  - Document how to pass context_summary to writer
  - Document how to pass files_changed to QA
  - File: `.claude/agents/code-agent.md` (workflow section)

- [ ] **T007** [US4] Implement error handling logic
  - Document STOP handling (halt workflow)
  - Document CLARIFY handling (prompt user)
  - Document retry logic (max 2 attempts)
  - File: `.claude/agents/code-agent.md` (error section)

---

## Phase 3: Integration

Connect sub-agents with skills and existing infrastructure.

- [ ] **T008** [US2] Reference TDD workflow in code-writer
  - Ensure code-writer references tdd-workflow skill
  - Verify RED-GREEN-REFACTOR pattern documented
  - File: `.claude/sub-agents/code/code-writer.md`

- [ ] **T009** [US3] Reference QA checks in code-qa
  - Ensure code-qa references qa-checks skill
  - Document specific commands (pnpm typecheck, pnpm lint, etc.)
  - File: `.claude/sub-agents/code/code-qa.md`

---

## Phase 4: Validation

Verify the new architecture works correctly.

- [ ] **T010** [US4] Test full workflow
  - Invoke `/code [test-feature]`
  - Verify all 3 sub-agents spawn
  - Verify handoffs contain context_summary (not full context)
  - Verify final result quality matches monolithic
  - File: N/A (manual testing)

- [ ] **T011** [US5] Test backward compatibility
  - Test `/code [feature]` (full flow)
  - Test `/code research [feature]`
  - Test `/code implement [feature]`
  - Test `/code validate [feature]`
  - Verify all commands work as documented
  - File: N/A (manual testing)

- [ ] **T012** [US4] Test error handling
  - Simulate research STOP (conflict)
  - Simulate research CLARIFY (ambiguous)
  - Simulate QA STOP (validation failure)
  - Verify retry logic (max 2 attempts)
  - File: N/A (manual testing)

- [ ] **T013** [NFR-1] Measure context efficiency
  - Run same feature with monolithic (measure tokens)
  - Run same feature with sub-agents (measure tokens)
  - Verify at least 25% context savings
  - Document findings
  - File: N/A (measurement)

---

## Task Dependencies

```text
(01-infrastructure complete)
         │
         ▼
T001 ──┬── T002 ──┬── T003 ──► T004
       │          │
       └──────────┴──────────► T005 ──► T006 ──► T007
                                   │
                                   ├──► T008
                                   └──► T009
                                         │
                                         ▼
                              T010 ──► T011 ──► T012 ──► T013
```

**Legend:**

- Requires 01-infrastructure to be complete first
- T001-T003 (sub-agents) can run in parallel
- T005-T007 (orchestrator) are sequential
- T008-T009 (integration) can run in parallel after T005
- T010-T013 (validation) are sequential

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks   |
| ----- | ---------------- |
| 1     | T001, T002, T003 |
| 3     | T008, T009       |

### Estimated Effort

| Phase                 | Tasks  | Effort       |
| --------------------- | ------ | ------------ |
| Sub-Agent Definitions | 4      | ~45 min      |
| Orchestrator Update   | 3      | ~30 min      |
| Integration           | 2      | ~15 min      |
| Validation            | 4      | ~30 min      |
| **Total**             | **13** | **~2 hours** |

### Rollback Checkpoint

After T004 (sub-agents complete), assess:

- IF sub-agent definitions unclear → revise before orchestrator
- IF handoff format insufficient → update protocol

After T007 (orchestrator complete), assess:

- IF orchestration logic flawed → revise before testing
- IF error handling incomplete → add more cases

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] `.claude/sub-agents/code/` directory exists
2. [ ] code-researcher.md defines research sub-agent
3. [ ] code-writer.md defines implementation sub-agent
4. [ ] code-qa.md defines validation sub-agent
5. [ ] code-agent.md updated to orchestrator role
6. [ ] Handoff flow documented (research → writer → qa)
7. [ ] Error handling documented (STOP, CLARIFY, retry)
8. [ ] Full workflow tested and working
9. [ ] Backward compatibility verified
10. [ ] Context savings measured (≥25%)
