# Tasks: Split /plan into Three Commands

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** split-plan-commands

## Progress

- [ ] Phase 1: Create Command Files (0/3)
- [ ] Phase 2: Update Agent Files (0/2)
- [ ] Phase 3: Update Command Detection (0/2)
- [ ] Phase 4: Update Documentation (0/2)
- [ ] Phase 5: Testing and Validation (0/4)

**Total:** 0/13 tasks complete

---

## Phase 1: Create Command Files

Create three new command files in `.claude/commands/` directory following the structure of existing `plan.md`.

- [ ] **T001** [REQ-1.1, REQ-1.2] Create /design command file
  - Create `.claude/commands/design.md`
  - Include command description: "Conversational spec creation"
  - Add MANDATORY preview and delegation block
  - Add Task examples for domain-researcher, domain-writer, quality-validator
  - Add preview display format (3 phases: RESEARCH, WRITE, VALIDATE)
  - Specify output: `specs/{feature}/requirements.md`, `design.md`, `tasks.md`
  - Include $ARGUMENTS placeholder
  - File: `.claude/commands/design.md`
  - **\_Prompt**: Role: Technical Writer | Task: Create /design command file at .claude/commands/design.md following the structure of plan.md. Include preview block with 3 phases (RESEARCH with domain-researcher/Opus, WRITE with domain-writer/Sonnet, VALIDATE with quality-validator/Haiku). Add Task tool examples showing how to spawn each sub-agent. Specify output as specs/{feature}/ directory with requirements.md, design.md, tasks.md files. | Restrictions: Follow exact format of plan.md, use $ARGUMENTS placeholder, include MANDATORY preview block | Success: File created with correct structure, preview displays 3 phases, Task examples show proper sub-agent spawning

- [ ] **T002** [REQ-2.1, REQ-2.2, REQ-2.3] Create /reconcile command file
  - Create `.claude/commands/reconcile.md`
  - Include command description: "Handle code review feedback (local git or GitHub PR)"
  - Add MANDATORY preview and delegation block
  - Add Task examples for domain-researcher (mode=reconcile), domain-writer (mode=reconcile)
  - Add preview display format (2 phases: ANALYZE, PLAN)
  - Specify output: `specs/pr-{N}-reconciliation/tasks.md`
  - Document two modes: no args (git diff), with PR number (gh pr view)
  - Include $ARGUMENTS placeholder
  - File: `.claude/commands/reconcile.md`
  - **\_Prompt**: Role: Technical Writer | Task: Create /reconcile command file at .claude/commands/reconcile.md for PR feedback reconciliation. Include preview block with 2 phases (ANALYZE with domain-researcher mode=reconcile/Opus, PLAN with domain-writer mode=reconcile/Sonnet). Add Task examples for both phases. Document two usage modes: /reconcile (uses git diff for local changes) and /reconcile [PR-number] (uses gh pr view for GitHub PR). Specify output as specs/pr-{N}-reconciliation/tasks.md. Note that this command designs fixes but does NOT implement them. | Restrictions: Follow plan.md format, include both usage modes in description, use $ARGUMENTS placeholder | Success: File created with correct structure, both usage modes documented, preview shows 2 phases, emphasizes design-only (no implementation)

- [ ] **T003** [REQ-3.1, REQ-3.2, REQ-3.3] Create /research command file
  - Create `.claude/commands/research.md`
  - Include command description: "Exploratory investigation without spec creation"
  - Add MANDATORY preview and delegation block
  - Add Task example for domain-researcher (mode=research)
  - Add preview display format (1 phase: INVESTIGATE)
  - Specify output: `research-notes.md` (not formal spec files)
  - Include $ARGUMENTS placeholder
  - File: `.claude/commands/research.md`
  - **\_Prompt**: Role: Technical Writer | Task: Create /research command file at .claude/commands/research.md for exploratory investigation. Include preview block with 1 phase (INVESTIGATE with domain-researcher mode=research/Opus). Add Task example showing how to spawn researcher sub-agent with iterative exploration support. Specify output as research-notes.md containing findings, code references, recommendations, and open questions. Emphasize that NO formal spec files (requirements.md, design.md, tasks.md) are created. | Restrictions: Follow plan.md format, single-phase preview, use $ARGUMENTS placeholder, emphasize lightweight/exploratory nature | Success: File created with correct structure, preview shows 1 phase, clearly states no formal specs created, output is research-notes.md only

---

## Phase 2: Update Agent Files

Modify `plan-agent.md` to support routing based on command context.

- [ ] **T004** [REQ-1.2, REQ-2.4, REQ-3.2] Add command routing to plan-agent.md
  - Open `.claude/agents/plan-agent.md`
  - Add command detection logic at top of orchestration workflow section
  - Route based on command name:
    - `/design` → Full spec creation (research + write + validate)
    - `/reconcile` → PR feedback analysis (analyze + plan tasks)
    - `/research` → Exploratory investigation (investigate only)
  - Update model assignment section to reflect command-based routing
  - Keep existing sub-agent templates unchanged
  - File: `.claude/agents/plan-agent.md`
  - **\_Prompt**: Role: Backend Developer | Task: Update plan-agent.md to add command routing logic. At the top of "Orchestration Workflow" section, add command detection that checks the triggering command (/design, /reconcile, or /research). For /design, use existing full flow (research + write + validate). For /reconcile, use 2-phase flow (analyze feedback with domain-researcher mode=reconcile, plan fixes with domain-writer mode=reconcile). For /research, use 1-phase flow (investigate with domain-researcher mode=research, output research-notes.md). Update "Model Assignment" section to show command-based routing. Do NOT modify sub-agent templates. | Restrictions: Preserve all existing orchestration logic, only add routing layer, do not change sub-agent spawn patterns | Success: Command routing added, /design uses existing flow, /reconcile has 2-phase flow, /research has 1-phase flow, sub-agents unchanged

- [ ] **T005** [REQ-4.1, REQ-4.2] Remove mode detection from plan-agent.md
  - Open `.claude/agents/plan-agent.md`
  - Remove references to "Define mode" and "Reconcile mode"
  - Remove CodeRabbit comment detection logic
  - Remove "Mode Detection" section if it exists as standalone
  - Update documentation to reflect explicit command routing instead of mode detection
  - File: `.claude/agents/plan-agent.md`
  - **\_Prompt**: Role: Backend Developer | Task: Remove mode detection logic from plan-agent.md. Search for and remove all references to "Define mode", "Reconcile mode", and CodeRabbit comment detection. Remove any standalone "Mode Detection" section. Update any documentation that mentions mode detection to instead reference command-based routing (/design, /reconcile, /research). Ensure removal does not break existing orchestration logic. | Restrictions: Only remove mode detection, preserve all other functionality, ensure command routing from T004 remains intact | Success: No mode detection references remain, CodeRabbit detection removed, documentation updated to reference commands not modes, orchestration logic still functional

---

## Phase 3: Update Command Detection

Update the command detection hook to recognize new commands.

- [ ] **T006** [REQ-1.1, REQ-2.1, REQ-3.1] Add new command patterns to command-mode-detect.cjs
  - Open `.claude/scripts/hooks/command-mode-detect.cjs`
  - Locate COMMAND_PATTERNS array (around line 27)
  - Add three new entries:
    ```javascript
    { pattern: /^\/design\b/i, command: 'design', agents: ['plan-agent'] },
    { pattern: /^\/reconcile\b/i, command: 'reconcile', agents: ['plan-agent'] },
    { pattern: /^\/research\b/i, command: 'research', agents: ['plan-agent'] },
    ```
  - Verify agents field is array format (not string)
  - File: `.claude/scripts/hooks/command-mode-detect.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Add new command patterns to COMMAND_PATTERNS array in command-mode-detect.cjs around line 27. Add three entries for /design, /reconcile, and /research commands, each routing to 'plan-agent'. Use array format for agents field: agents: ['plan-agent']. Follow the same pattern as existing entries. Ensure regex pattern uses /^\/command\b/i format for word boundary matching. | Restrictions: Only add new entries, do not modify existing patterns, use array format for agents field, follow existing code style | Success: Three new patterns added, agents field is array, regex uses word boundaries, code follows existing style

- [ ] **T007** [REQ-4.1, REQ-4.3] Remove /plan pattern (optional - for full deprecation)
  - Open `.claude/scripts/hooks/command-mode-detect.cjs`
  - Locate /plan pattern in COMMAND_PATTERNS array
  - Comment out or remove the /plan pattern entry
  - Add comment explaining deprecation: "// /plan deprecated in favor of /design, /reconcile, /research"
  - File: `.claude/scripts/hooks/command-mode-detect.cjs`
  - **\_Prompt**: Role: Backend Developer | Task: Deprecate /plan command pattern in command-mode-detect.cjs. Find the /plan pattern entry in COMMAND_PATTERNS array and comment it out (or remove if instructed). Add a comment above explaining: "// /plan deprecated in favor of /design, /reconcile, /research". Alternatively, if backward compatibility is desired, keep the pattern but update the comment to indicate it's an alias for /design. | Restrictions: Ask user preference on full removal vs. backward compatibility before proceeding, document choice clearly | Success: /plan pattern removed or commented with deprecation note, comment explains new commands, decision documented

---

## Phase 4: Update Documentation

Update user-facing documentation to reflect new commands.

- [ ] **T008** [NFR-3, REQ-1.1, REQ-2.1, REQ-3.1] Update CLAUDE.md command table
  - Open `CLAUDE.md`
  - Locate the Commands table section
  - Replace `/plan | plan-agent` row with three new rows:
    ```markdown
    | /design | plan-agent |
    | /reconcile | plan-agent |
    | /research | plan-agent |
    ```
  - Update Core Rule section if it references /plan
  - Update any examples that use /plan to use /design instead
  - File: `CLAUDE.md`
  - **\_Prompt**: Role: Technical Writer | Task: Update CLAUDE.md to replace /plan with new commands. In the Commands table, replace the /plan row with three rows: /design (plan-agent), /reconcile (plan-agent), /research (plan-agent). Update any references to /plan in the Core Rule section or examples to use /design instead. If there are usage examples showing /plan [feature], change them to /design [feature]. Preserve all other documentation content. | Restrictions: Only update command references, do not change core rules or other documentation structure, maintain markdown formatting | Success: Command table shows three new commands, /plan removed, examples updated to use /design, formatting preserved

- [ ] **T009** [NFR-3] Update command previews in new command files
  - Review `.claude/commands/design.md` preview section
  - Review `.claude/commands/reconcile.md` preview section
  - Review `.claude/commands/research.md` preview section
  - Verify preview formatting is consistent with other commands
  - Verify sub-agent names and models are correct
  - Verify phase names are descriptive and accurate
  - Files: `.claude/commands/design.md`, `.claude/commands/reconcile.md`, `.claude/commands/research.md`
  - **\_Prompt**: Role: Technical Writer | Task: Review and verify preview sections in design.md, reconcile.md, and research.md command files. Check that: (1) Preview formatting matches plan.md style with box drawing characters, (2) Sub-agent names are correct (domain-researcher, domain-writer, quality-validator), (3) Model assignments are correct (Opus for researcher, Sonnet for writer, Haiku for validator), (4) Phase names are descriptive (RESEARCH/WRITE/VALIDATE for design, ANALYZE/PLAN for reconcile, INVESTIGATE for research), (5) [Enter] Run [Esc] Cancel footer is present. Fix any inconsistencies found. | Restrictions: Maintain consistent formatting across all three files, follow plan.md preview style exactly, do not change command functionality | Success: All three previews formatted consistently, correct sub-agent names and models, descriptive phase names, footer present

---

## Phase 5: Testing and Validation

Test each new command to ensure proper functionality.

- [ ] **T010** [REQ-1.2, REQ-1.3, REQ-1.5, REQ-1.6] Test /design command
  - Run: `/design test-feature`
  - Verify: Preview displays with 3 phases (RESEARCH, WRITE, VALIDATE)
  - Verify: Sub-agents spawn via Task tool (domain-researcher, domain-writer, quality-validator)
  - Verify: Files created in `specs/test-feature/`: requirements.md, design.md, tasks.md
  - Verify: requirements.md uses EARS format
  - Verify: tasks.md includes \_Prompt fields
  - Verify: Error handling for ambiguities and validation failures
  - File: N/A (manual testing)
  - **\_Prompt**: Role: QA Engineer | Task: Test /design command end-to-end. Run /design test-feature and verify: (1) Preview shows 3 phases with correct sub-agents and models, (2) Confirmation prompt appears ([Enter]/[Esc]), (3) Sub-agents spawn using Task tool (check that Read/Grep/Glob/Edit/Write are NOT called directly from orchestrator), (4) Three files created: specs/test-feature/requirements.md, design.md, tasks.md, (5) requirements.md follows EARS format (WHEN/WHILE/IF-THEN patterns), (6) tasks.md has \_Prompt fields for each task, (7) Error handling works (test by providing ambiguous requirements). Document any issues found. | Restrictions: Test in isolated environment, do not modify production code, report all failures with reproduction steps | Success: Preview displays correctly, sub-agents spawn via Task tool, three files created with correct formats, error handling works, no direct tool execution from orchestrator

- [ ] **T011** [REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.6, REQ-2.7] Test /reconcile command
  - Run: `/reconcile` (test git diff mode)
  - Verify: Analyzes local uncommitted changes
  - Run: `/reconcile 123` (test PR mode, requires actual PR)
  - Verify: Fetches PR comments using gh pr view
  - Verify: Preview displays with 2 phases (ANALYZE, PLAN)
  - Verify: Sub-agents spawn via Task tool (domain-researcher mode=reconcile, domain-writer mode=reconcile)
  - Verify: File created: `specs/pr-123-reconciliation/tasks.md`
  - Verify: tasks.md categorizes issues by severity (critical, major, minor, trivial)
  - Verify: Error handling for missing PR, no git changes, gh CLI not installed
  - File: N/A (manual testing)
  - **\_Prompt**: Role: QA Engineer | Task: Test /reconcile command in both modes. (1) Test git diff mode: Make local uncommitted changes, run /reconcile, verify it analyzes those changes. (2) Test PR mode: Run /reconcile with a valid PR number (e.g., /reconcile 11), verify it fetches PR feedback via gh pr view. For both modes, verify: Preview shows 2 phases (ANALYZE, PLAN), sub-agents spawn via Task tool with mode=reconcile, output file created in specs/pr-{N}-reconciliation/tasks.md, issues categorized by severity, \_Prompt fields present, tasks designed but NOT implemented. Test error cases: no PR found, no local changes, gh CLI not installed/authenticated. Document findings. | Restrictions: Do NOT actually implement fixes, verify command only designs tasks, test error handling thoroughly, report all issues with steps to reproduce | Success: Both modes work (git diff and PR), preview displays correctly, sub-agents spawn via Task tool, tasks.md created with categorized issues, error handling works for all error cases, no implementation executed

- [ ] **T012** [REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.6] Test /research command
  - Run: `/research authentication-patterns`
  - Verify: Preview displays with 1 phase (INVESTIGATE)
  - Verify: Sub-agent spawns via Task tool (domain-researcher mode=research)
  - Verify: File created: `research-notes.md`
  - Verify: research-notes.md contains: findings, code references, recommendations, open questions
  - Verify: NO formal spec files created (requirements.md, design.md, tasks.md should NOT exist)
  - Verify: Supports iterative exploration with follow-up questions
  - File: N/A (manual testing)
  - **\_Prompt**: Role: QA Engineer | Task: Test /research command for exploratory investigation. Run /research authentication-patterns (or any topic in codebase). Verify: (1) Preview shows 1 phase (INVESTIGATE) with domain-researcher/Opus, (2) Sub-agent spawns via Task tool with mode=research, (3) research-notes.md file created with findings, (4) File contains code references, recommendations, and open questions, (5) NO requirements.md, design.md, or tasks.md files created, (6) Test iterative exploration by asking follow-up questions during research phase. Document whether follow-up questions are supported and how they work. | Restrictions: Test lightweight/exploratory nature, verify no formal specs created, test in real codebase context, document any limitations in follow-up question support | Success: Preview shows 1 phase, sub-agent spawns via Task tool, research-notes.md created with expected sections, NO formal spec files exist, iterative exploration works (or limitations documented)

- [ ] **T013** Validate hook configuration and documentation consistency
  - Run: `node .claude/scripts/hooks/command-mode-detect.cjs` (verify no errors)
  - Verify: COMMAND_PATTERNS includes /design, /reconcile, /research
  - Verify: All command files exist: design.md, reconcile.md, research.md
  - Verify: CLAUDE.md command table matches COMMAND_PATTERNS
  - Run: `npx markdownlint-cli2 "**/*.md"` (check for linting errors in new files)
  - File: N/A (validation testing)
  - **\_Prompt**: Role: QA Engineer | Task: Validate configuration and documentation consistency. (1) Run command-mode-detect.cjs and verify it executes without errors, (2) Check COMMAND_PATTERNS array includes all three new commands with correct agents field (array format), (3) Verify all three command files exist in .claude/commands/, (4) Compare CLAUDE.md command table with COMMAND_PATTERNS to ensure they match, (5) Run markdownlint on all modified markdown files to catch formatting issues, (6) Verify $ARGUMENTS placeholder is present in all new command files. Document any inconsistencies found. | Restrictions: Do not modify files during validation, only report issues, provide specific file paths and line numbers for any problems | Success: Hook runs without errors, COMMAND_PATTERNS correct, all files exist, documentation matches implementation, no linting errors, $ARGUMENTS placeholders present

---

## Task Dependencies

```text
T001 (design.md)        T002 (reconcile.md)        T003 (research.md)
       |                        |                         |
       +------------------------+-------------------------+
                                |
                                v
                T004 (add routing to plan-agent.md)
                                |
                                v
                T005 (remove mode detection)
                                |
                                v
                T006 (add patterns to hook)
                                |
                                v
                T007 (remove /plan pattern)
                                |
                                v
                T008 (update CLAUDE.md)
                                |
                                v
                T009 (verify previews)
                                |
                                v
          +---------------------+---------------------+
          |                     |                     |
          v                     v                     v
    T010 (/design)        T011 (/reconcile)    T012 (/research)
          |                     |                     |
          +---------------------+---------------------+
                                |
                                v
                        T013 (validate all)
```

**Legend:**

- T001-T003 can be executed in parallel (all create command files)
- T004 depends on T001-T003 (routing requires command files to exist)
- T005 depends on T004 (remove old mode detection after new routing is in place)
- T006 depends on T005 (update hook after agent routing is finalized)
- T007 depends on T006 (deprecate /plan after new commands are registered)
- T008-T009 can be executed in parallel (both documentation updates)
- T010-T012 can be executed in parallel (all testing tasks)
- T013 depends on T010-T012 (final validation after all tests pass)

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks                |
| ----- | ----------------------------- |
| 1     | T001, T002, T003              |
| 4     | T008, T009 (after T007)       |
| 5     | T010, T011, T012 (after T009) |

### Estimated Effort

| Phase     | Tasks  | Effort      |
| --------- | ------ | ----------- |
| Phase 1   | 3      | ~15 min     |
| Phase 2   | 2      | ~20 min     |
| Phase 3   | 2      | ~10 min     |
| Phase 4   | 2      | ~10 min     |
| Phase 5   | 4      | ~30 min     |
| **Total** | **13** | **~85 min** |

### Rollback Checkpoint

After T007 (command detection updated), assess:

- IF testing in T010-T012 reveals critical issues → rollback T006-T007, fix issues in T004-T005, re-apply T006-T007
- IF testing succeeds → proceed with documentation updates and final validation

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] Three command files exist: `.claude/commands/design.md`, `.claude/commands/reconcile.md`, `.claude/commands/research.md`
2. [ ] `plan-agent.md` routes based on command name (/design, /reconcile, /research)
3. [ ] Mode detection logic removed from `plan-agent.md`
4. [ ] COMMAND_PATTERNS in `command-mode-detect.cjs` includes all three new commands
5. [ ] CLAUDE.md command table lists /design, /reconcile, /research instead of /plan
6. [ ] All three commands tested successfully with expected outputs
7. [ ] Error handling verified for all error scenarios
8. [ ] No markdown linting errors in new files
9. [ ] Documentation is consistent across all files
10. [ ] Sub-agents spawn via Task tool (no direct execution from orchestrator)
11. [ ] /design creates requirements.md, design.md, tasks.md in EARS format
12. [ ] /reconcile creates tasks.md with categorized issues (no implementation)
13. [ ] /research creates research-notes.md (no formal specs)

---
