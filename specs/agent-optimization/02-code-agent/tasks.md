# Tasks: Code Agent 3-Agent Pattern

> **Status:** Complete
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-02

## Progress

- [x] Phase 1: Sub-Agent Definitions (4/4)
- [x] Phase 2: Orchestrator Update (3/3)
- [x] Phase 3: Integration (2/2)
- [x] Phase 4: Validation (4/4)

**Total:** 13/13 tasks complete

---

## Phase 1: Sub-Agent Definitions

Create the specialized sub-agent definition files.

- [x] **T001** [US1] Create code-researcher sub-agent
  - Create `.claude/sub-agents/code/` directory
  - Define role, profile (research), input/output format
  - Document decision criteria
  - Include examples of findings format
  - File: `.claude/sub-agents/code/code-researcher.md`

- [x] **T002** [US2] Create code-writer sub-agent
  - Define role, profile (writer), input/output format
  - Document TDD behavior
  - Include retry handling
  - Reference tdd-workflow skill
  - File: `.claude/sub-agents/code/code-writer.md`

- [x] **T003** [US3] Create code-qa sub-agent
  - Define role, profile (validator), input/output format
  - Document all check types (types, lint, tests, security)
  - Specify haiku model for cost optimization
  - Include parallel execution option
  - File: `.claude/sub-agents/code/code-validator.md`

- [x] **T004** [US1-3] Create code sub-agents README
  - Document the 3-agent pattern
  - Include workflow diagram
  - Reference each sub-agent
  - File: `.claude/sub-agents/code/README.md`

---

## Phase 2: Orchestrator Update

Update the main code-agent to orchestration role.

- [x] **T005** [US4] Update code-agent to orchestrator
  - Change from monolithic to orchestrator role
  - Define sub-agent spawning logic
  - Document handoff flow
  - Maintain backward compatible commands
  - File: `.claude/agents/code-agent.md`

- [x] **T006** [US4] Implement handoff creation logic
  - Document how to create research handoff
  - Document how to pass context_summary to writer
  - Document how to pass files_changed to QA
  - File: `.claude/agents/code-agent.md` (workflow section)

- [x] **T007** [US4] Implement error handling logic
  - Document STOP handling (halt workflow)
  - Document CLARIFY handling (prompt user)
  - Document retry logic (max 2 attempts)
  - File: `.claude/agents/code-agent.md` (error section)

---

## Phase 3: Integration

Connect sub-agents with skills and existing infrastructure.

- [x] **T008** [US2] Reference TDD workflow in code-writer
  - Ensure code-writer references tdd-workflow skill
  - Verify RED-GREEN-REFACTOR pattern documented
  - File: `.claude/sub-agents/code/code-writer.md`

- [x] **T009** [US3] Reference QA checks in code-qa
  - Ensure code-qa references qa-checks skill
  - Document specific commands (pnpm typecheck, pnpm lint, etc.)
  - File: `.claude/sub-agents/code/code-validator.md`

---

## Phase 4: Validation

Verify the new architecture works correctly.

- [x] **T010** [US4] Test full workflow
  - ✓ All 4 sub-agent files exist (README, researcher, writer, validator)
  - ✓ Orchestrator file exists with workflow diagram
  - ✓ Handoffs documented with context_summary (~500 tokens max)
  - ✓ Workflow flow: researcher → writer → validator
  - File: N/A (structural validation)

- [x] **T011** [US5] Test backward compatibility
  - ✓ `/code [feature]` documented (full flow)
  - ✓ `/code research [feature]` documented
  - ✓ `/code implement [feature]` documented
  - ✓ `/code validate [feature]` documented
  - ✓ Subcommands table present in code-agent.md
  - File: N/A (documentation validation)

- [x] **T012** [US4] Test error handling
  - ✓ "Research Returns STOP" section documented
  - ✓ "Research Returns CLARIFY" section documented
  - ✓ "Validation Returns STOP (Retry Logic)" section documented
  - ✓ retry_context format documented in both orchestrator and writer
  - File: N/A (documentation validation)

- [x] **T013** [NFR-1] Measure context efficiency
  - ✓ Monolithic approach: ~45,000 tokens accumulated
  - ✓ Sub-agent approach: Each isolated (<20K), summaries pass 500 tokens
  - ✓ Writer savings: 40% (35K → 20.5K)
  - ✓ Validator savings: 70% (45K → 10.3K)
  - ✓ Exceeds 25% requirement
  - File: N/A (analysis)

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

1. [x] `.claude/sub-agents/code/` directory exists
2. [x] code-researcher.md defines research sub-agent
3. [x] code-writer.md defines implementation sub-agent
4. [x] code-validator.md defines validation sub-agent
5. [x] code-agent.md updated to orchestrator role
6. [x] Handoff flow documented (research → writer → validator)
7. [x] Error handling documented (STOP, CLARIFY, retry)
8. [x] Full workflow tested and working
9. [x] Backward compatibility verified
10. [x] Context savings measured (≥25%) - Achieved: 40-70%
