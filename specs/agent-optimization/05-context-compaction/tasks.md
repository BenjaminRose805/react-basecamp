# Tasks: Context Compaction System

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-05

## Progress

- [ ] Phase 1: Handoff Rules (0/2)
- [ ] Phase 2: Orchestrator Patterns (0/2)
- [ ] Phase 3: Hooks Enhancement (0/3)
- [ ] Phase 4: Validation (0/3)

**Total:** 0/10 tasks complete

---

## Phase 1: Handoff Rules

Document and enforce handoff compaction rules.

- [ ] **T001** [US2] Define context_summary guidelines
  - Add compaction rules to handoff protocol
  - Include max length (500 tokens)
  - Include/exclude lists
  - Good/bad examples
  - File: `.claude/sub-agents/protocols/handoff.md`

- [ ] **T002** [US2] Update sub-agent templates with compaction rules
  - Add context_summary guidelines to researcher template
  - Add context_summary guidelines to writer template
  - Add context_summary guidelines to validator template
  - File: `.claude/sub-agents/templates/*.md`

---

## Phase 2: Orchestrator Patterns

Document orchestrator context management.

- [ ] **T003** [US1] Document orchestrator memory rules
  - Define what to retain after sub-agent returns
  - Define what to discard
  - Include state structure example
  - File: `.claude/sub-agents/protocols/orchestration.md`

- [ ] **T004** [US1] Update agent orchestrators with compaction patterns
  - Add memory rules to code-agent.md
  - Add memory rules to ui-agent.md
  - Add memory rules to check-agent.md
  - File: `.claude/agents/*.md`

---

## Phase 3: Hooks Enhancement

Enhance hooks for compaction tracking and suggestions.

- [ ] **T005** [US4] Create compaction tracker hook
  - Log compaction events
  - Track context size before/after
  - Track tool call counts
  - File: `.claude/scripts/hooks/compaction-tracker.cjs`

- [ ] **T006** [US4] Register compaction hook in settings
  - Add to PreCompact hooks in settings.json
  - File: `.claude/settings.json`

- [ ] **T007** [US5] Enhance suggest-compact hook
  - Track tool call count
  - Suggest at 50, 100, 150 calls
  - Non-blocking suggestions
  - File: `.claude/scripts/hooks/suggest-compact.cjs`

---

## Phase 4: Validation

Verify compaction system works correctly.

- [ ] **T008** [US1] Test phase boundary compaction
  - Run workflow with sub-agents
  - Verify context_summary ≤ 500 tokens
  - Verify orchestrator discards raw outputs
  - File: N/A (manual testing)

- [ ] **T009** [US5] Test compaction suggestions
  - Run 50+ tool calls
  - Verify suggestion appears
  - Verify non-blocking behavior
  - File: N/A (manual testing)

- [ ] **T010** [NFR-1] Measure context savings
  - Run same workflow with/without compaction
  - Target: ≥30% context reduction
  - Document findings
  - File: N/A (measurement)

---

## Task Dependencies

```text
(01-infrastructure complete)
         │
         ▼
T001 ──► T002
         │
         ▼
T003 ──► T004
         │
         ▼
T005 ──► T006 ──► T007
                   │
                   ▼
              T008 ──► T009 ──► T010
```

---

## Execution Notes

### Estimated Effort

| Phase                 | Tasks  | Effort      |
| --------------------- | ------ | ----------- |
| Handoff Rules         | 2      | ~20 min     |
| Orchestrator Patterns | 2      | ~20 min     |
| Hooks Enhancement     | 3      | ~30 min     |
| Validation            | 3      | ~20 min     |
| **Total**             | **10** | **~90 min** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] Handoff protocol includes context_summary guidelines
2. [ ] Sub-agent templates document compaction rules
3. [ ] Orchestrator memory rules documented
4. [ ] Agent files include compaction patterns
5. [ ] Compaction tracker hook created and registered
6. [ ] Suggest-compact hook enhanced
7. [ ] Phase boundary compaction verified (≤500 tokens)
8. [ ] Context savings measured (≥30%)
