# Tasks: Cleanup & Consolidation

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-10

## Progress

- [ ] Phase 1: Commit Staging (4 tasks)
- [ ] Phase 2: Remove Stale Files (2 tasks)
- [ ] Phase 3: Rewrite Critical Files (2 tasks)
- [ ] Phase 4: Update Rules (5 tasks)
- [ ] Phase 5: Update Workflows (2 tasks)
- [ ] Phase 6: Update Docs (4 tasks)
- [ ] Phase 7: Verification (3 tasks)

**Total:** 0/22 tasks complete

---

## Phase 1: Commit Staging

Review and commit the 66 uncommitted changes in logical groups.

- [ ] **T001** [REQ-5.2] Review deleted command files
  - Review: build.md, check.md, code.md, context.md, debug.md, docs.md, eval.md, git.md, help.md, pr.md, ui.md
  - Verify these should be deleted (absorbed into new commands)
  - Stage deletions
  - Commit: "chore: remove deprecated command files"

- [ ] **T002** [REQ-5.2] Review new command files
  - Review: guide.md, implement.md, mode.md, start.md
  - Verify content is correct and complete
  - Stage additions
  - Commit: "feat: add new command definitions"

- [ ] **T003** [REQ-5.2] Review new skills and sub-agents
  - Review: skills/preview/, skills/progress/, skills/routing/
  - Review: sub-agents/code/, sub-agents/docs/, sub-agents/eval/, sub-agents/git/, sub-agents/plan/, sub-agents/ui/, sub-agents/workflows/
  - Stage additions
  - Commit: "feat: add skills and sub-agent definitions"

- [ ] **T004** [REQ-5.2] Review updated agents and workflows
  - Review changes to: agents/_.md, workflows/_.md
  - Verify archived agents are in archived/
  - Stage updates
  - Commit: "refactor: update agents and workflows for new architecture"

---

## Phase 2: Remove Stale Files

Remove entirely stale files that cannot be salvaged.

- [ ] **T005** [REQ-5.1] Remove stale contexts directory
  - Delete: `.claude/contexts/dev.md`
  - Delete: `.claude/contexts/research.md`
  - Delete: `.claude/contexts/review.md`
  - Delete directory if empty
  - Commit: "chore: remove deprecated contexts directory"

- [ ] **T006** [REQ-5.3] Rewrite agents README
  - Delete current content of `.claude/agents/README.md`
  - Write new content with:
    - Current 7-agent architecture
    - Sub-agent references
    - Model assignments
  - Commit: "docs: rewrite agents README for current architecture"

---

## Phase 3: Rewrite Critical Files

Files requiring significant rewrites.

- [ ] **T007** [REQ-6.1] Update DEVELOPER_WORKFLOW.md - Part 1
  - Replace all `/code` → describe as internal routing to code-agent
  - Replace all `/ui` → describe as internal routing to ui-agent
  - Replace all `/branch` → `/start` for creation, `/ship` for push
  - Replace all `/pr` → `/ship`
  - File: `docs/DEVELOPER_WORKFLOW.md`

- [ ] **T008** [REQ-6.1] Update DEVELOPER_WORKFLOW.md - Part 2
  - Replace all `/debug` → `/plan` (reconcile mode)
  - Replace all `spec-workflow` MCP references → file-based specs
  - Update command reference tables
  - Update example workflows
  - File: `docs/DEVELOPER_WORKFLOW.md`
  - Commit: "docs: update DEVELOPER_WORKFLOW.md for new command structure"

---

## Phase 4: Update Rules

Update rule files with targeted fixes.

- [ ] **T009** [REQ-4.2] Fix model assignments in agents.md
  - Line 128-135: Change `*-researcher` from Sonnet to Opus
  - Verify all model assignments match CLAUDE.md
  - File: `.claude/rules/agents.md`
  - Commit: "fix: correct model assignments in agents.md"

- [ ] **T010** [REQ-1.2] Update methodology.md
  - Line 26: Replace `/distill or /spec` → `/plan`
  - Lines 122-139: Update `/eval research`, `/eval write`, `/eval qa` to describe internal phases
  - File: `.claude/rules/methodology.md`
  - Commit: "docs: update methodology.md command references"

- [ ] **T011** [REQ-1.1, REQ-1.4] Update git-workflow.md
  - Line 84: Replace `/review` command reference
  - Lines 114-146: Update `/spec`, `/test`, `/code`, `/security`, `/review` references
  - File: `.claude/rules/git-workflow.md`
  - Commit: "docs: update git-workflow.md command references"

- [ ] **T012** [REQ-1.2] Update testing.md
  - Line 209: Remove or replace `/debug` reference
  - File: `.claude/rules/testing.md`
  - Commit: "docs: remove /debug reference from testing.md"

- [ ] **T013** [REQ-1.2] Update performance.md
  - Line 127: Remove or replace `/debug` reference
  - File: `.claude/rules/performance.md`
  - Commit: "docs: remove /debug reference from performance.md"

---

## Phase 5: Update Workflows

Update workflow files for consistency.

- [ ] **T014** [REQ-4.3] Update workflows README
  - Align all command names with CLAUDE.md
  - Replace `/build` → `/implement`
  - Update workflow trigger documentation
  - File: `.claude/workflows/README.md`
  - Commit: "docs: align workflow README with current commands"

- [ ] **T015** [REQ-1.3] Update implement workflow
  - Line 12: Replace `/build [feature]` → `/implement [feature]`
  - Verify all internal references are consistent
  - File: `.claude/workflows/implement.md`
  - Commit: "docs: fix implement workflow trigger"

---

## Phase 6: Update Docs

Update documentation files.

- [ ] **T016** [REQ-6.2] Update MCP_SETUP.md
  - Remove `spec-workflow` MCP server setup instructions
  - Remove `vitest` MCP server setup instructions
  - Remove `github` MCP server setup instructions
  - Add note about CLI replacements (pnpm test, gh CLI)
  - File: `docs/MCP_SETUP.md`
  - Commit: "docs: remove deprecated MCP servers from setup guide"

- [ ] **T017** [REQ-6.3] Update CONTRIBUTING.md
  - Line 207: Replace `/context` → `/mode`
  - Update command list to match CLAUDE.md
  - File: `CONTRIBUTING.md`
  - Commit: "docs: update CONTRIBUTING.md with current commands"

- [ ] **T018** [REQ-6.4] Update PULL_REQUEST_TEMPLATE.md
  - Line 24: Replace `/verify` reference
  - Update any other stale command references
  - File: `.github/PULL_REQUEST_TEMPLATE.md`
  - Commit: "docs: update PR template with current commands"

- [ ] **T019** [REQ-4.1] Update MCP_TOOL_GAPS.md
  - Replace all `code-qa` → `code-validator`
  - Replace all `ui-qa` → `ui-validator`
  - Replace all `*-qa` → `*-validator`
  - File: `docs/MCP_TOOL_GAPS.md`
  - Commit: "docs: standardize sub-agent naming in MCP_TOOL_GAPS.md"

---

## Phase 7: Verification

Verify all cleanup is complete.

- [ ] **T020** [NFR-3] Run stale reference searches
  - Search for `/context` (should be 0 outside archived)
  - Search for `/debug` (should be 0 outside archived)
  - Search for `/build` (should be 0 outside archived/specs)
  - Search for `spec-workflow` (should be 0)
  - Search for `code-qa` (should be 0 outside specs)
  - Document any remaining references

- [ ] **T021** [NFR-3] Verify file consistency
  - Verify CLAUDE.md matches actual file structure
  - Verify all agents referenced in CLAUDE.md exist
  - Verify all workflows referenced in CLAUDE.md exist
  - Verify all skills referenced in CLAUDE.md exist

- [ ] **T022** Update specs README
  - Add spec 10 to the spec list
  - Mark spec 10 as complete
  - Update progress summary
  - File: `specs/agent-optimization/README.md`
  - Commit: "docs: add spec 10 to README and mark complete"

---

## Task Dependencies

```text
Phase 1 (Commit Staging) - Must be first
T001 ─┬─ T002 ─┬─ T003 ─┬─ T004
      │        │        │
      └────────┴────────┘
         │         (can run in parallel after review)
         ▼
Phase 2 (Remove Stale Files)
T005 ──► T006
         │
         ▼
Phase 3 (Rewrite Critical Files)
T007 ──► T008
         │
         ▼
Phase 4 (Update Rules)
T009 ─┬─ T010 ─┬─ T011 ─┬─ T012 ─┬─ T013
      │        │        │        │
      └────────┴────────┴────────┘
         │              (can run in parallel)
         ▼
Phase 5 (Update Workflows)
T014 ─┬─ T015
      │
      └───┘    (can run in parallel)
         │
         ▼
Phase 6 (Update Docs)
T016 ─┬─ T017 ─┬─ T018 ─┬─ T019
      │        │        │
      └────────┴────────┘
         │         (can run in parallel)
         ▼
Phase 7 (Verification)
T020 ──► T021 ──► T022
```

---

## Parallel Execution Opportunities

| Phase | Parallel Tasks                   |
| ----- | -------------------------------- |
| 1     | T001-T004 (after initial review) |
| 4     | T009-T013                        |
| 5     | T014-T015                        |
| 6     | T016-T019                        |

---

## Estimated Effort

| Phase                  | Tasks  | Effort       |
| ---------------------- | ------ | ------------ |
| Commit Staging         | 4      | ~30 min      |
| Remove Stale Files     | 2      | ~20 min      |
| Rewrite Critical Files | 2      | ~60 min      |
| Update Rules           | 5      | ~30 min      |
| Update Workflows       | 2      | ~15 min      |
| Update Docs            | 4      | ~45 min      |
| Verification           | 3      | ~20 min      |
| **Total**              | **22** | **~4 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] All 66 uncommitted changes are committed in logical groups
2. [ ] `.claude/contexts/` directory is removed
3. [ ] `.claude/agents/README.md` accurately reflects 7-agent architecture
4. [ ] `docs/DEVELOPER_WORKFLOW.md` has no stale command references
5. [ ] All rule files updated with correct commands
6. [ ] All workflow files use `/implement` not `/build`
7. [ ] `docs/MCP_SETUP.md` has no deprecated MCP servers
8. [ ] Verification searches return 0 stale references
9. [ ] CLAUDE.md matches actual file structure

---

## Stale Reference Verification Commands

Run these after cleanup to verify success:

```bash
# Commands that should return 0 results outside archived/specs
echo "=== /context ===" && grep -r "/context" .claude/ docs/ --include="*.md" | grep -v archived | grep -v "context7" | wc -l
echo "=== /debug ===" && grep -r "/debug" .claude/ docs/ --include="*.md" | grep -v archived | wc -l
echo "=== /build ===" && grep -r '"/build' .claude/ docs/ --include="*.md" | grep -v archived | grep -v specs | wc -l
echo "=== spec-workflow ===" && grep -r "spec-workflow" . --include="*.md" | wc -l
echo "=== code-qa ===" && grep -r "code-qa" .claude/ docs/ --include="*.md" | wc -l

# All should output 0
```

---
