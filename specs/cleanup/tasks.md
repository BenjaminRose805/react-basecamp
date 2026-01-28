# Tasks: .claude/ Directory Cleanup

## Phase A: Update Hook Registrations in settings.json

### Task A1: Read current settings.json

- [ ] Read `.claude/settings.json` to understand current hook registrations
- \_Prompt: Read the settings.json file and identify all hook registrations that reference the 14 hooks marked for deletion.

### Task A2: Remove deprecated hook registrations

- [ ] Edit `settings.json` to remove all 14 deprecated hook registrations
- [ ] Remove from preToolUse array: pre-tool-use-doc-warning.cjs, pre-tool-use-dev-tip.cjs, pre-tool-use-task-enforcement.cjs
- [ ] Remove from postToolUse array: post-tool-use-console-check.cjs, post-tool-use-eslint.cjs, post-tool-use-prettier.cjs, post-tool-use-typecheck.cjs, post-tool-use-vitest.cjs, post-tool-use-pr-created.cjs
- [ ] Remove from stop array: stop-console-check.cjs
- [ ] Remove from other arrays: suggest-compact.cjs, pre-compact.cjs, compaction-tracker.cjs, start-spec-dashboard.cjs
- \_Prompt: Edit settings.json to remove all registrations for the 14 hooks marked for deletion. Ensure the JSON remains valid and well-formatted.

### Task A3: Verify settings.json has no references to deleted hooks

- [ ] Read updated `settings.json` and confirm no references to the 14 hooks remain
- [ ] Validate JSON syntax
- \_Prompt: Verify that settings.json contains no references to any of the 14 hooks marked for deletion and that the JSON is valid.

---

## Phase B: Delete Files and Directories

### Task B1: Delete deprecated command files

- [ ] Delete `.claude/commands/guide.md`
- [ ] Delete `.claude/commands/mode.md`
- [ ] Delete `.claude/commands/plan.md`
- \_Prompt: Delete the three deprecated command files: guide.md, mode.md, and plan.md from .claude/commands/

### Task B2: Delete deprecated directories

- [ ] Delete `.claude/agents/archived/` (entire directory)
- [ ] Delete `.claude/workflows/` (entire directory)
- [ ] Delete `.claude/examples/` (entire directory)
- [ ] Delete `.claude/tests/` (entire directory)
- [ ] Delete `.claude/sub-agents/profiles/` (entire directory)
- \_Prompt: Delete the five deprecated directories: agents/archived/, workflows/, examples/, tests/, and sub-agents/profiles/

### Task B3: Delete deprecated sub-agent templates

- [ ] Delete `.claude/sub-agents/code-analyzer.md`
- [ ] Delete `.claude/sub-agents/git-content-generator.md`
- [ ] Delete `.claude/sub-agents/parallel-executor.md`
- [ ] Delete `.claude/sub-agents/quality-checker.md`
- [ ] Delete `.claude/sub-agents/spec-analyzer.md`
- \_Prompt: Delete the five deprecated sub-agent template files from .claude/sub-agents/

### Task B4: Delete deprecated documentation files

- [ ] Delete `.claude/sub-agents/code/README.md`
- [ ] Delete `.claude/sub-agents/docs/README.md`
- [ ] Delete `.claude/sub-agents/eval/README.md`
- [ ] Delete `.claude/sub-agents/plan/README.md`
- [ ] Delete `.claude/sub-agents/ui/README.md`
- [ ] Delete `.claude/sub-agents/workflows/README.md`
- [ ] Delete `.claude/sub-agents/QUICK-REFERENCE.md`
- [ ] Delete `.claude/sub-agents/README.md`
- \_Prompt: Delete all eight deprecated README and documentation files from .claude/sub-agents/

### Task B5: Delete deprecated script files

- [ ] Delete `.claude/scripts/install-tools.cjs`
- [ ] Delete `.claude/scripts/measure-tokens.cjs`
- [ ] Delete `.claude/scripts/lib/free-checks.cjs`
- [ ] Delete `.claude/scripts/lib/rate-limit-tracker.cjs`
- [ ] Delete `.claude/scripts/lib/claude-reviewer.cjs`
- [ ] Delete `.claude/scripts/lib/loop-controller.cjs`
- [ ] Delete `.claude/scripts/lib/secret-scanner.cjs`
- \_Prompt: Delete the seven deprecated script files from .claude/scripts/ and .claude/scripts/lib/

### Task B6: Delete deprecated hook files (AFTER settings.json update)

- [ ] Delete `.claude/hooks/pre-tool-use-doc-warning.cjs`
- [ ] Delete `.claude/hooks/pre-tool-use-dev-tip.cjs`
- [ ] Delete `.claude/hooks/pre-tool-use-task-enforcement.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-console-check.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-eslint.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-prettier.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-typecheck.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-vitest.cjs`
- [ ] Delete `.claude/hooks/post-tool-use-pr-created.cjs`
- [ ] Delete `.claude/hooks/stop-console-check.cjs`
- [ ] Delete `.claude/hooks/suggest-compact.cjs`
- [ ] Delete `.claude/hooks/pre-compact.cjs`
- [ ] Delete `.claude/hooks/compaction-tracker.cjs`
- [ ] Delete `.claude/hooks/start-spec-dashboard.cjs`
- \_Prompt: Delete all 14 deprecated hook files from .claude/hooks/. IMPORTANT: Only execute this task AFTER Phase A is complete and settings.json has been updated.

### Task B7: Delete deprecated documentation

- [ ] Delete `.claude/docs/commands.md`
- [ ] Delete `.claude/docs/conditional-mcp-servers.md`
- [ ] Delete `.claude/docs/context-loading.md`
- [ ] Delete `.claude/docs/rules/hooks.md`
- [ ] Delete `.claude/docs/rules/performance.md`
- \_Prompt: Delete the five deprecated documentation files from .claude/docs/

### Task B8: Delete deprecated sub-agent library files

- [ ] Delete `.claude/sub-agents/lib/inject-rules.cjs`
- [ ] Delete `.claude/sub-agents/lib/README.md`
- \_Prompt: Delete the two deprecated files from .claude/sub-agents/lib/

### Task B9: Verify all intended files deleted

- [ ] Run git status to review deletions
- [ ] Confirm 44 files deleted
- [ ] Confirm 5 directories deleted
- [ ] Verify no preserved files were accidentally deleted
- \_Prompt: Run git status and verify that exactly 44 files and 5 directories were deleted, and that no preserved files were accidentally removed.

---

## Phase C: Update CLAUDE.md

### Task C1: Read current CLAUDE.md

- [ ] Read `/home/benjamin/basecamp/react-basecamp-feature-agent-optimization/CLAUDE.md`
- [ ] Identify the command table section
- \_Prompt: Read CLAUDE.md and locate the command table to prepare for updates.

### Task C2: Update command table to remove /guide and /mode

- [ ] Edit CLAUDE.md to remove the /guide row from command table
- [ ] Edit CLAUDE.md to remove the /mode row from command table
- [ ] Ensure command table shows only 7 commands in this order: /start, /research, /design, /reconcile, /implement, /review, /ship
- [ ] Preserve all other content in CLAUDE.md
- \_Prompt: Edit the command table in CLAUDE.md to remove /guide and /mode, keeping only the 7 core commands.

### Task C3: Verify CLAUDE.md updates

- [ ] Read updated CLAUDE.md
- [ ] Confirm command table has exactly 7 rows
- [ ] Confirm no other unintended changes
- \_Prompt: Verify that CLAUDE.md now shows exactly 7 commands in the command table and no other content was modified.

---

## Phase D: Clean Up Empty Directories

### Task D1: Find empty directories

- [ ] Use find command to locate empty directories in `.claude/`
- [ ] List all empty directories for review
- \_Prompt: Find all empty directories in the .claude/ directory tree and list them for review.

### Task D2: Delete empty directories

- [ ] Delete all empty directories found in Task D1
- [ ] Verify directories removed
- \_Prompt: Delete all empty directories found in the .claude/ directory tree.

### Task D3: Final verification

- [ ] Run git status to review all changes
- [ ] Confirm no empty directories remain
- [ ] Verify .claude/ structure is clean
- \_Prompt: Run git status and verify that the .claude/ directory is clean with no empty directories remaining.

---

## Final Verification Tasks

### Task V1: Verify preserved files intact

- [ ] Confirm all 7 command files exist (start, research, design, reconcile, implement, review, ship)
- [ ] Confirm all 7 agent files exist
- [ ] Confirm all 10 core hooks exist
- [ ] Confirm all 3 core scripts exist (utils.cjs, security-patterns.cjs, package-manager.cjs)
- [ ] Confirm all 3 sub-agent templates exist (domain-researcher, domain-writer, quality-validator)
- [ ] Confirm config files exist (settings.json, settings.local.json, cclsp.json, package-manager.json)
- \_Prompt: Verify that all preserved files are still present and intact after the cleanup.

### Task V2: Verify settings.json integrity

- [ ] Read settings.json and validate JSON syntax
- [ ] Confirm no references to deleted hooks
- [ ] Confirm all preserved hooks are still registered
- \_Prompt: Verify that settings.json is valid JSON and contains only references to the 10 preserved hooks.

### Task V3: Git diff review

- [ ] Review complete git diff
- [ ] Verify only intended files deleted
- [ ] Verify only intended modifications to settings.json and CLAUDE.md
- [ ] Confirm no accidental changes
- \_Prompt: Review the complete git diff to ensure only intended changes were made.

### Task V4: Test core commands

- [ ] Verify /start command documentation exists
- [ ] Verify /research command documentation exists
- [ ] Verify /design command documentation exists
- [ ] Verify /reconcile command documentation exists
- [ ] Verify /implement command documentation exists
- [ ] Verify /review command documentation exists
- [ ] Verify /ship command documentation exists
- \_Prompt: Verify that all 7 core command documentation files are present and accessible.

---

## Summary

**Total Tasks**: 24

- Phase A: 3 tasks (settings.json update)
- Phase B: 9 tasks (file/directory deletion)
- Phase C: 3 tasks (CLAUDE.md update)
- Phase D: 3 tasks (empty directory cleanup)
- Final Verification: 4 tasks

**Estimated Files to Delete**: 44 files + 5 directories
**Files to Preserve**: 39+ files
**Critical Dependencies**: Phase A MUST complete before Phase B Task B6

**Execution Order**:

1. Complete ALL Phase A tasks first
2. Complete ALL Phase B tasks (B6 depends on A completion)
3. Complete ALL Phase C tasks
4. Complete ALL Phase D tasks
5. Complete ALL Final Verification tasks
