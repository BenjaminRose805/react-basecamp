# Tasks: Sub-Agent Infrastructure

> **Status:** In Progress
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-01

## Progress

- [x] Phase 1: Directory Setup (3/3)
- [x] Phase 2: Templates (4/4)
- [x] Phase 3: Profiles (4/4)
- [x] Phase 4: Protocols (2/2)
- [x] Phase 5: Documentation (2/2)
- [ ] Phase 6: Validation (0/4)

**Total:** 15/19 tasks complete

---

## Phase 1: Directory Setup

Create the sub-agents directory structure.

- [x] **T001** [US1] Create sub-agents directory structure
  - Create `.claude/sub-agents/` directory
  - Create `templates/`, `profiles/`, `protocols/` subdirectories
  - File: `.claude/sub-agents/`

- [x] **T002** [US1] Create sub-agents README
  - Document sub-agent system overview
  - Include quick start guide
  - Reference templates, profiles, protocols
  - File: `.claude/sub-agents/README.md`

- [x] **T003** [US1] Update CLAUDE.md with sub-agent reference
  - Add sub-agents section to architecture overview
  - Link to `.claude/sub-agents/README.md`
  - File: `CLAUDE.md`

---

## Phase 2: Templates

Create sub-agent templates for each role.

- [x] **T004** [US1] Create researcher template
  - Define role, allowed tools, input/output format
  - Include behavior rules and examples
  - Document decision criteria (PROCEED/STOP/CLARIFY)
  - File: `.claude/sub-agents/templates/researcher.md`

- [x] **T005** [US1] Create writer template
  - Define role, allowed tools, input/output format
  - Include TDD behavior rules
  - Document file change reporting format
  - File: `.claude/sub-agents/templates/writer.md`

- [x] **T006** [US1] Create validator template
  - Define role, allowed tools, input/output format
  - Include check execution rules
  - Document aggregation and reporting format
  - File: `.claude/sub-agents/templates/validator.md`

- [x] **T007** [US1] Create parallel-executor template
  - Define orchestration role
  - Include parallel spawning pattern
  - Document result aggregation strategy
  - File: `.claude/sub-agents/templates/parallel-executor.md`

---

## Phase 3: Profiles

Create tool permission profiles.

- [x] **T008** [US3] Create read-only profile
  - List allowed tools: Read, Grep, Glob, cclsp read operations
  - Document use cases
  - File: `.claude/sub-agents/profiles/read-only.md`

- [x] **T009** [US3] Create research profile
  - List allowed tools: read-only + WebFetch, WebSearch, context7
  - Document use cases
  - File: `.claude/sub-agents/profiles/research.md`

- [x] **T010** [US3] Create writer profile
  - List allowed tools: Read, Write, Edit, Bash, Grep, Glob, cclsp
  - Document use cases
  - File: `.claude/sub-agents/profiles/writer.md`

- [x] **T011** [US3] Create full-access profile
  - List allowed tools: All tools including Task
  - Document use cases (orchestrators only)
  - File: `.claude/sub-agents/profiles/full-access.md`

---

## Phase 4: Protocols

Create handoff and orchestration protocols.

- [x] **T012** [US2] Create handoff protocol
  - Define request JSON schema
  - Define response JSON schema
  - Document decision values (PROCEED/STOP/CLARIFY)
  - Include context_summary guidelines (max 500 tokens)
  - Include examples for each phase type
  - File: `.claude/sub-agents/protocols/handoff.md`

- [x] **T013** [US4] Create orchestration patterns
  - Document sequential chain pattern with pseudocode
  - Document parallel executor pattern with pseudocode
  - Document conditional branch pattern with pseudocode
  - Include error handling strategies
  - File: `.claude/sub-agents/protocols/orchestration.md`

---

## Phase 5: Documentation

Update existing documentation to reference sub-agents.

- [x] **T014** [US1-5] Update agents rule file
  - Add sub-agent delegation section
  - Document when to use sub-agents vs direct work
  - Reference templates and protocols
  - File: `.claude/rules/agents.md`

- [x] **T015** [US1-5] Create sub-agent quick reference
  - One-page summary of templates, profiles, protocols
  - Include common invocation patterns
  - File: `.claude/sub-agents/QUICK-REFERENCE.md`

---

## Phase 6: Validation

Verify infrastructure works correctly.

- [ ] **T016** [US5] Test researcher sub-agent invocation
  - Create test handoff request
  - Invoke via Task tool with research profile
  - Verify response matches schema
  - Verify context isolation (sub-agent doesn't see conversation history)
  - File: N/A (manual testing)

- [ ] **T017** [US5] Test writer sub-agent invocation
  - Create test handoff with context_summary
  - Invoke via Task tool with writer profile
  - Verify receives only handoff, not full context
  - File: N/A (manual testing)

- [ ] **T018** [US5] Test parallel execution
  - Invoke multiple sub-agents with run_in_background
  - Verify all complete
  - Verify results can be aggregated
  - File: N/A (manual testing)

- [ ] **T019** [US2] Test handoff compaction
  - Measure context_summary token count
  - Verify < 500 tokens
  - Verify sufficient information for next phase
  - File: N/A (manual testing)

---

## Task Dependencies

```text
T001 ──► T002 ──► T003
    │
    ├──► T004 ─┐
    ├──► T005 ─┼──► T014
    ├──► T006 ─┤
    └──► T007 ─┘
    │
    ├──► T008 ─┐
    ├──► T009 ─┼──► T015
    ├──► T010 ─┤
    └──► T011 ─┘
    │
    ├──► T012 ──► T016
    └──► T013 ──► T017
                    │
                    ├──► T018
                    └──► T019
```

**Legend:**

- T001 must complete before all others (directory setup)
- T004-T007 (templates) can run in parallel
- T008-T011 (profiles) can run in parallel
- T012-T013 (protocols) can run in parallel
- T016-T019 (validation) depend on all documentation

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks         |
| ----- | ---------------------- |
| 2     | T004, T005, T006, T007 |
| 3     | T008, T009, T010, T011 |
| 4     | T012, T013             |
| 6     | T016, T017, T018, T019 |

### Estimated Effort

| Phase           | Tasks  | Effort       |
| --------------- | ------ | ------------ |
| Directory Setup | 3      | ~10 min      |
| Templates       | 4      | ~30 min      |
| Profiles        | 4      | ~15 min      |
| Protocols       | 2      | ~30 min      |
| Documentation   | 2      | ~15 min      |
| Validation      | 4      | ~20 min      |
| **Total**       | **19** | **~2 hours** |

### Rollback Checkpoint

After T003 (CLAUDE.md update), assess:

- IF directory structure incorrect → remove and recreate
- IF documentation unclear → revise before templates

After T013 (protocols complete), assess:

- IF handoff schema insufficient → revise before validation
- IF orchestration patterns unclear → add more examples

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] `.claude/sub-agents/` directory exists with all subdirectories
2. [x] All 4 templates created and documented
3. [x] All 4 profiles created with tool lists
4. [x] Handoff protocol defined with JSON schemas
5. [x] Orchestration patterns documented with pseudocode
6. [x] CLAUDE.md references sub-agent system
7. [ ] Sub-agent invocation tested and working
8. [ ] Context isolation verified
9. [ ] Handoff compaction verified (< 500 tokens)
