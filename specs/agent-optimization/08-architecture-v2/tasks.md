# Tasks: Architecture V2

> **Status:** Complete
> **Created:** 2026-01-26
> **Completed:** 2026-01-26
> **Spec ID:** agent-opt-08

## Progress

- [x] Phase 1: Agent Consolidation (5/5)
- [x] Phase 2: Sub-Agent Updates (7/7)
- [x] Phase 3: New Workflows (4/4)
- [x] Phase 4: User Interface (4/4)
- [x] Phase 5: Documentation (3/3)
- [x] Phase 6: Validation (5/5)

**Total:** 28/28 tasks complete

---

## Phase 1: Agent Consolidation

Remove overlapping agents and consolidate into git-agent.

- [ ] **T001** [REQ-1.2] Expand git-agent with PR capabilities
  - Add pr-analyzer sub-agent definition
  - Add pr-reviewer sub-agent definition
  - Add git-executor sub-agent definition
  - Update git-agent.md to orchestrator pattern
  - File: `.claude/agents/git-agent.md`

- [ ] **T002** [REQ-1.2] Create git-agent sub-agents
  - Create change-analyzer.md (Sonnet)
  - Create pr-analyzer.md (Sonnet)
  - Create pr-reviewer.md (Opus)
  - Create git-executor.md (Haiku)
  - Directory: `.claude/sub-agents/git/`

- [ ] **T003** [REQ-1.3] Create investigator sub-agent
  - Create investigator.md for fix workflow
  - Profile: research (read-only + search)
  - Model: Opus
  - File: `.claude/sub-agents/workflows/investigator.md`

- [ ] **T004** [REQ-1.4, REQ-1.5] Remove deprecated agents
  - Delete or archive debug-agent.md
  - Delete or archive pr-agent.md
  - Delete or archive help-agent.md
  - Delete or archive context-agent.md
  - Add migration notes

- [ ] **T005** [REQ-1.3] Create workflow-specific sub-agents
  - Create refactor-analyzer.md (Opus)
  - Create security-triager.md (Opus)
  - Directory: `.claude/sub-agents/workflows/`

---

## Phase 2: Sub-Agent Model Updates

Update all agent specs to use Opus for orchestrators and researchers.

- [x] **T006** Update plan-agent model assignments
  - Orchestrator: Opus
  - plan-researcher: Opus (was implicit)
  - plan-writer: Sonnet
  - plan-validator: Haiku
  - File: `.claude/agents/plan-agent.md`

- [x] **T007** Update code-agent model assignments
  - Orchestrator: Opus
  - code-researcher: Opus
  - code-writer: Sonnet
  - code-validator: Haiku
  - File: `.claude/agents/code-agent.md`

- [x] **T008** Update ui-agent model assignments
  - Orchestrator: Opus
  - ui-researcher: Opus
  - ui-builder: Sonnet
  - ui-validator: Haiku
  - File: `.claude/agents/ui-agent.md`

- [x] **T009** Update docs-agent model assignments
  - Orchestrator: Opus
  - docs-researcher: Opus
  - docs-writer: Sonnet
  - docs-validator: Haiku
  - File: `.claude/agents/docs-agent.md`

- [x] **T010** Update eval-agent model assignments
  - Orchestrator: Opus
  - eval-researcher: Opus
  - eval-writer: Sonnet
  - eval-validator: Haiku
  - File: `.claude/agents/eval-agent.md`

- [x] **T011** Update check-agent model assignments
  - Orchestrator: Opus
  - All checkers: Haiku (already correct)
  - File: `.claude/agents/check-agent.md`

- [x] **T012** Create sub-agent files for all agents
  - plan-agent sub-agents (3 files)
  - code-agent sub-agents (3 files)
  - ui-agent sub-agents (3 files)
  - docs-agent sub-agents (3 files)
  - eval-agent sub-agents (3 files)
  - Directories: `.claude/sub-agents/{agent}/`

---

## Phase 3: New Workflows

Create the 4 new workflow definitions.

- [x] **T013** [REQ-5.2] Create fix workflow
  - Stage 1: Investigate (investigator sub-agent)
  - Stage 2: Fix (route to code/ui based on findings)
  - Stage 3: Verify (check-agent)
  - File: `.claude/workflows/fix.md`

- [x] **T014** [REQ-5.3] Create refactor workflow
  - Stage 1: Baseline (check-agent - capture passing tests)
  - Stage 2: Analyze (refactor-analyzer sub-agent)
  - Stage 3: Refactor (code/ui agent)
  - Stage 4: Verify (check-agent - same tests pass)
  - File: `.claude/workflows/refactor.md`

- [x] **T015** [REQ-5.4] Create security workflow
  - Stage 1: Audit (check-agent security-scanner)
  - Stage 2: Triage (security-triager sub-agent)
  - Stage 3: Fix (route to appropriate agent)
  - Stage 4: Re-audit (check-agent security-scanner)
  - File: `.claude/workflows/security.md`

- [x] **T016** [REQ-5.5] Create research workflow
  - Single stage: researcher sub-agent
  - Profile: read-only
  - No file modifications
  - File: `.claude/workflows/research.md`

---

## Phase 4: User Interface

Implement the 5 core commands, routing, and preview.

- [x] **T017** [REQ-2.1] Create command routing logic
  - Define routing rules for /build
  - Define routing rules for /fix
  - Document in: `.claude/skills/routing/SKILL.md`

- [x] **T018** [REQ-3.1] Design preview system
  - Define preview data structure
  - Define preview display format
  - Define user interaction (proceed/cancel/edit)
  - Document in: `.claude/skills/preview/SKILL.md`

- [x] **T019** [REQ-4.1] Design progress display
  - Define progress data structure
  - Define progress display format
  - Define real-time update mechanism
  - Document in: `.claude/skills/progress/SKILL.md`

- [x] **T020** [REQ-2.4] Document power commands
  - /route - preview only
  - /research - research workflow
  - /refactor - refactor workflow
  - /git - direct git operations
  - Legacy: /code, /ui, /docs, /eval
  - File: `.claude/docs/commands.md`

---

## Phase 5: Documentation

Update all documentation to reflect new architecture.

- [x] **T021** Update specs README
  - Add Phase 08 to spec list
  - Update dependency diagram
  - Update implementation order
  - File: `specs/agent-optimization/README.md`

- [x] **T022** Update workflows README
  - Document all 8 workflows
  - Add workflow selection guide
  - Include context flow diagrams
  - File: `.claude/workflows/README.md`

- [x] **T023** Update CLAUDE.md
  - Update agent list (7 agents)
  - Update command list (5 core + optional)
  - Update workflow list (8 workflows)
  - Update model assignments
  - Add preview system documentation
  - File: `CLAUDE.md`

---

## Phase 6: Validation

Verify all components work correctly.

- [x] **T024** Test agent consolidation
  - Verify git-agent handles PR operations
  - Verify investigator works in fix workflow
  - Verify deprecated agents removed
  - File: `validation-report.md`

- [x] **T025** Test new workflows
  - Test /fix with backend bug
  - Test /fix with frontend bug
  - Test /refactor
  - Test /security
  - Test /research
  - File: `validation-report.md`

- [x] **T026** Test routing layer
  - Test /build routes correctly to code-agent
  - Test /build routes correctly to ui-agent
  - Test /build routes correctly to implement workflow
  - Test /build routes correctly to docs-agent
  - File: `validation-report.md`

- [x] **T027** Test preview system
  - Verify preview displays before execution
  - Verify proceed/cancel/edit work
  - Verify --yes flag skips preview
  - File: `validation-report.md`

- [x] **T028** Measure improvements
  - Measure context savings (target: 30-40%)
  - Measure parallel speedup (target: 2x)
  - Document baseline vs new metrics
  - File: `validation-report.md`

---

## Task Dependencies

```text
Phase 1 (Agent Consolidation)
T001 ──► T002 ──┐
T003 ──────────┼──► T004
T005 ──────────┘
         │
         ▼
Phase 2 (Sub-Agent Updates)
T006 ─┬─ T007 ─┬─ T008 ─┬─ T009 ─┬─ T010 ─┬─ T011 ──► T012
      │        │        │        │        │
      └────────┴────────┴────────┴────────┘
         │                    (can run in parallel)
         ▼
Phase 3 (New Workflows)
T013 ─┬─ T014 ─┬─ T015 ─┬─ T016
      │        │        │
      └────────┴────────┘
         │         (can run in parallel)
         ▼
Phase 4 (User Interface)
T017 ──► T018 ──► T019 ──► T020
         │
         ▼
Phase 5 (Documentation)
T021 ─┬─ T022 ─┬─ T023
      │        │
      └────────┘
         │    (can run in parallel)
         ▼
Phase 6 (Validation)
T024 ──► T025 ──► T026 ──► T027 ──► T028
```

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks   |
| ----- | ---------------- |
| 1     | T001, T003, T005 |
| 2     | T006-T011        |
| 3     | T013-T016        |
| 5     | T021-T023        |

### Estimated Effort

| Phase               | Tasks  | Effort       |
| ------------------- | ------ | ------------ |
| Agent Consolidation | 5      | ~90 min      |
| Sub-Agent Updates   | 7      | ~120 min     |
| New Workflows       | 4      | ~60 min      |
| User Interface      | 4      | ~90 min      |
| Documentation       | 3      | ~45 min      |
| Validation          | 5      | ~60 min      |
| **Total**           | **28** | **~8 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] 7 agents defined (plan, code, ui, docs, eval, check, git)
2. [x] 4 deprecated agents removed (debug, pr, help, context)
3. [x] 27 sub-agents created with correct model assignments
4. [x] 8 workflows defined (implement, fix, refactor, ship, review, full-feature, security, research)
5. [x] Routing layer documented
6. [x] Preview system documented
7. [x] Progress display documented
8. [x] CLAUDE.md updated
9. [x] All workflows tested
10. [x] Performance improvements measured (30%+ context savings, 2x+ speedup)

**See:** [validation-report.md](./validation-report.md) for detailed validation results.

---
