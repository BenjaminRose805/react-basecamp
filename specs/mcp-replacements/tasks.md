# Tasks: MCP Server Replacements

> **Status:** Implemented
> **Created:** 2026-01-26
> **Spec ID:** mcp-replacements

## Progress

- [x] Phase 1: Setup (2/2)
- [x] Phase 2: Remove MCP Servers (4/4)
- [x] Phase 3: Documentation - GitHub (2/2)
- [x] Phase 4: Documentation - Vitest (2/2)
- [x] Phase 5: Documentation - Spec Workflow (2/2)
- [x] Phase 6: Documentation - Conditional (2/2)
- [x] Phase 7: Validation (5/5)

**Total:** 19/19 tasks complete

**Documentation targets:**

- Skills: `git-operations`, `pr-operations`, `qa-checks`, `tdd-workflow`, `research`
- Docs: `.claude/docs/conditional-mcp-servers.md`
- CLAUDE.md: MCP table update only

---

## Phase 1: Setup

Foundation tasks that must complete before any implementation.

- [x] **T001** [P] Verify `gh` CLI is installed and authenticated
  - Run: `gh auth status`
  - Expected: Shows authenticated GitHub account
  - If fails: Run `gh auth login` first
  - File: N/A (external dependency)

- [x] **T002** [P] Create backup of current MCP configuration
  - Run: `cp .mcp.json .mcp.json.backup`
  - Expected: Backup file exists for rollback
  - File: `.mcp.json.backup`

---

## Phase 2: Remove MCP Servers [US1, US2, US4]

Remove replaceable MCP servers from configuration.

- [x] **T003** [US1] Remove `github` server from `.mcp.json`
  - Edit `.mcp.json` to remove the `github` server entry
  - Verify JSON is valid after edit
  - File: `.mcp.json`

- [x] **T004** [US2] Remove `vitest` server from `.mcp.json`
  - Edit `.mcp.json` to remove the `vitest` server entry
  - Verify JSON is valid after edit
  - File: `.mcp.json`

- [x] **T005** [US4] Remove `spec-workflow` server from `.mcp.json`
  - Edit `.mcp.json` to remove the `spec-workflow` server entry
  - Verify JSON is valid after edit
  - File: `.mcp.json`

- [x] **T006** Verify Claude Code starts without errors
  - Restart Claude Code session
  - Check for MCP connection errors in startup
  - Verify remaining MCP servers connect successfully
  - File: N/A (manual verification)

---

## Phase 3: Documentation - GitHub Replacement [US1]

Document `gh` CLI commands in the skill files that agents use.

- [x] **T007** [US1] Update git-operations skill with CLI commands
  - Add `gh` CLI equivalents for git operations
  - Include branch, commit, status commands
  - Add auth verification instructions
  - File: `.claude/skills/git-operations/SKILL.md`

- [x] **T008** [US1] [P] Update pr-operations skill with CLI commands
  - Add `gh` CLI equivalents for PR operations
  - Include create, merge, review, status, comments commands
  - File: `.claude/skills/pr-operations/SKILL.md`

---

## Phase 4: Documentation - Vitest Replacement [US2]

Document test CLI commands in the skill files that agents use.

- [x] **T009** [US2] Update qa-checks skill with test CLI commands
  - Add vitest CLI commands for test operations
  - Document list/run/coverage commands
  - Include output parsing guidance
  - File: `.claude/skills/qa-checks/SKILL.md`

- [x] **T010** [US2] [P] Update tdd-workflow skill with test CLI commands
  - Ensure TDD workflow references correct CLI commands
  - Document red-green-refactor with CLI
  - File: `.claude/skills/tdd-workflow/SKILL.md`

---

## Phase 5: Documentation - Spec Workflow Replacement [US4]

Document file-based spec workflow in the research skill (used by plan-agent).

- [x] **T011** [US4] Update research skill with spec workflow
  - Document `specs/{feature}/` directory structure
  - Document requirements.md, design.md, tasks.md format
  - Document status workflow (Draft → Approved → Implemented)
  - Include template references
  - File: `.claude/skills/research/SKILL.md`

- [x] **T012** [US4] [P] Ensure spec templates exist
  - Verify `specs/spec-template.md` exists or create templates
  - Create `specs/templates/` with requirements.md, design.md, tasks.md templates
  - Templates include EARS and RFC 2119 keywords reference
  - File: `specs/templates/`

---

## Phase 6: Documentation - Conditional MCP Servers [US3]

Document when to keep or remove conditional MCP servers.

- [x] **T013** [US3] Create conditional MCP servers guide
  - Document next-devtools criteria (Next.js 16+ MCP)
  - Document context7 criteria (frequent doc lookup)
  - Document shadcn criteria (component discovery)
  - Include alternatives for each
  - File: `.claude/docs/conditional-mcp-servers.md`

- [x] **T014** [US3] [P] Update MCP Servers table in CLAUDE.md
  - Remove github, vitest, spec-workflow from server list
  - Update tool counts (8 → 5)
  - Mark remaining servers as Essential/Conditional
  - Updated agent definitions with CLI tools column
  - File: `CLAUDE.md`

---

## Phase 7: Validation [US5]

Verify all replacements work correctly.

- [x] **T015** [US5] [P] Test GitHub CLI operations
  - Run: `gh pr list` ✓
  - Run: `gh issue list` ✓
  - Run: `gh repo view` ✓
  - Verify all return expected output
  - File: N/A (manual testing)

- [x] **T016** [US5] [P] Test Vitest CLI operations
  - Run: `pnpm test:run src/` ✓ (4 tests passed)
  - Run: `pnpm test:coverage src/` ✓ (coverage report generated)
  - Verify test results are readable ✓
  - File: N/A (manual testing)

- [x] **T017** [US5] [P] Test cclsp MCP still works
  - Use `find_definition` on a known symbol ✓
  - Use `find_references` on a known symbol
  - Verify results are returned ✓
  - File: N/A (MCP tool testing)

- [x] **T018** [US5] [P] Test playwright MCP still works
  - Use `browser_navigate` to load a page ✓ (example.com)
  - Use `browser_snapshot` to capture state ✓
  - Verify accessibility tree is returned ✓
  - File: N/A (MCP tool testing)

- [x] **T019** [US5] Document any issues found
  - No issues found - all replacements working
  - Backup preserved at `.mcp.json.backup`
  - File: N/A (no issues to document)

---

## Task Dependencies

```text
T001 ──┐
       ├──► T003 ─┐
T002 ──┘    T004 ─┼──► T006 ──► T007 ──► T015
            T005 ─┘         │
                            ├──► T009 ──► T016
                            │
                            ├──► T011 ──► T017
                            │
                            ├──► T013 ──► T018
                            │
                            └──► T014 ──► T019
```

**Legend:**

- T001, T002 can run in parallel (setup)
- T003, T004, T005 can run in parallel after setup
- T006 blocks all documentation tasks
- T015-T018 can run in parallel (validation)
- T019 depends on all validation tasks

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks         |
| ----- | ---------------------- |
| 1     | T001, T002             |
| 2     | T003, T004, T005       |
| 3     | T008 (with T007)       |
| 4     | T010 (with T009)       |
| 5     | T012 (with T011)       |
| 6     | T013, T014             |
| 7     | T015, T016, T017, T018 |

### Estimated Effort

| Phase              | Tasks  | Effort      |
| ------------------ | ------ | ----------- |
| Setup              | 2      | ~2 min      |
| Remove MCP         | 4      | ~5 min      |
| GitHub Docs        | 2      | ~15 min     |
| Vitest Docs        | 2      | ~10 min     |
| Spec Workflow Docs | 2      | ~10 min     |
| Conditional Docs   | 2      | ~10 min     |
| Validation         | 5      | ~10 min     |
| **Total**          | **19** | **~62 min** |

### Rollback Checkpoint

After T006 (verify startup), assess:

- If startup fails → rollback with `cp .mcp.json.backup .mcp.json`
- If startup succeeds → proceed with documentation

---

## Completion Criteria

All tasks are complete when:

1. [x] `.mcp.json` has 5 servers (github, vitest, spec-workflow removed)
2. [x] Claude Code starts without MCP errors
3. [x] `git-operations` and `pr-operations` skills have GitHub CLI commands
4. [x] `qa-checks` and `tdd-workflow` skills have Vitest CLI commands
5. [x] `research` skill has file-based spec workflow guide
6. [x] `.claude/docs/conditional-mcp-servers.md` exists
7. [x] CLAUDE.md MCP table updated (5 servers)
8. [x] All validation tests pass
9. [x] Backup file preserved for potential rollback
