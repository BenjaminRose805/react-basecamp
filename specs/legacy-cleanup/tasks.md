# Legacy Cleanup - Tasks

## Overview

Step-by-step implementation tasks for removing dead code and cleaning up the codebase. Each task includes a structured prompt for execution.

## Phase 1: Remove Dead Hook Scripts

### T1: Delete user-prompt-submit.cjs

- [ ] 1. Delete user-prompt-submit.cjs hook file
  - _Prompt: Role: File cleanup executor | Task: Delete the file `.claude/scripts/hooks/user-prompt-submit.cjs` which is confirmed dead code with no references | Restrictions: Do not modify any other files. Only delete this specific file. | Success: File is deleted and git shows the deletion._
  - **Implements**: REQ-001
  - **Validation**: `ls .claude/scripts/hooks/user-prompt-submit.cjs` returns "No such file"

### T2: Delete evaluate-session.cjs

- [ ] 2. Delete evaluate-session.cjs hook file
  - _Prompt: Role: File cleanup executor | Task: Delete the file `.claude/scripts/hooks/evaluate-session.cjs` which never executes because CLAUDE_TRANSCRIPT_PATH is never set | Restrictions: Do not modify any other files. Only delete this specific file. | Success: File is deleted and git shows the deletion._
  - **Implements**: REQ-001
  - **Validation**: `ls .claude/scripts/hooks/evaluate-session.cjs` returns "No such file"

### T3: Verify no references remain to deleted hooks

- [ ] 3. Grep for any remaining references to deleted hooks
  - _Prompt: Role: Reference validator | Task: Search the entire codebase for any references to "user-prompt-submit" or "evaluate-session" excluding git history and node_modules | Restrictions: Use grep or similar search tool. Do not modify any files. | Success: No references found except in settings.json (which will be cleaned in Phase 2)._
  - **Implements**: REQ-001
  - **Validation**: `grep -r "user-prompt-submit\|evaluate-session" . --exclude-dir={node_modules,.git} | grep -v settings.json` returns empty

## Phase 2: Remove Orphaned Library Code

### T4: Delete parse-coderabbit.cjs

- [ ] 4. Delete orphaned parse-coderabbit utility
  - _Prompt: Role: File cleanup executor | Task: Delete the file `.claude/scripts/lib/parse-coderabbit.cjs` which is orphaned with no imports or references | Restrictions: Do not modify any other files. Only delete this specific file. | Success: File is deleted and no import errors occur._
  - **Implements**: REQ-002
  - **Validation**: `ls .claude/scripts/lib/parse-coderabbit.cjs` returns "No such file" and `grep -r "parse-coderabbit" . --exclude-dir={node_modules,.git}` returns empty

## Phase 3: Update Hook Registrations

### T5: Remove dead hook registrations from settings.json

- [ ] 5. Update settings.json to remove deleted hook references
  - _Prompt: Role: Configuration editor | Task: Edit `.claude/settings.json` to remove two hook registrations: (1) UserPromptSubmit hook pointing to "node .claude/scripts/hooks/user-prompt-submit.cjs" and (2) Stop hook pointing to "node .claude/scripts/hooks/evaluate-session.cjs" | Restrictions: Only remove these two specific hook entries. Do not modify any other settings. Ensure the resulting JSON is valid. | Success: settings.json is valid JSON, the two hook registrations are removed, and no other settings are modified._
  - **Implements**: REQ-003
  - **Validation**: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf-8'))"` succeeds and hooks are not present

## Phase 4: Fix Minor Issues

### T6: Fix file extension in user-prompt-review.cjs

- [ ] 6. Fix .json to .yaml reference at line 171
  - _Prompt: Role: Bug fix implementer | Task: Edit `.claude/scripts/hooks/user-prompt-review.cjs` at line 171 to change the file extension reference from `.json` to `.yaml` when reading status files | Restrictions: Only modify line 171. Change must be minimal - just the extension. | Success: Line 171 references `.yaml` instead of `.json`._
  - **Implements**: REQ-004
  - **Validation**: `grep -n "\.yaml" .claude/scripts/hooks/user-prompt-review.cjs | grep "171"` returns a match

### T7: Remove unused log import from setup-package-manager.cjs

- [ ] 7. Remove unused import at line 27
  - _Prompt: Role: Code cleanup implementer | Task: Edit `.claude/scripts/setup-package-manager.cjs` to remove the unused `log` import at line 27 | Restrictions: Only remove the import statement or the log property from a destructured import. Do not modify any other code. | Success: Import is removed and file still executes without errors._
  - **Implements**: REQ-005
  - **Validation**: File lints without warnings about unused imports

### T8: Remove unused grepFile export from utils.cjs

- [ ] 8. Remove unused export at line 503
  - _Prompt: Role: Code cleanup implementer | Task: Edit `.claude/scripts/lib/utils.cjs` to remove the `grepFile` export at line 503 which has no external callers | Restrictions: Only remove the grepFile function or export. Ensure all other exports remain functional. | Success: grepFile is not exported and all other utils functions still work._
  - **Implements**: REQ-006
  - **Validation**: `grep -r "grepFile" . --exclude-dir={node_modules,.git} --exclude="utils.cjs"` returns empty

### T9: Update ui-agent.md to clarify figma MCP is optional

- [ ] 9. Update documentation to note figma MCP is optional
  - _Prompt: Role: Documentation updater | Task: Edit `.claude/agents/ui-agent.md` to add a note clarifying that the figma MCP integration is optional and not required for core functionality | Restrictions: Add the note in an appropriate location without removing existing content. Keep the tone consistent with the rest of the document. | Success: Documentation clearly states figma MCP is optional._
  - **Implements**: REQ-007
  - **Validation**: Manual review of ui-agent.md confirms the note is present

### T10: Remove spec-workflow references from hooks

- [ ] 10a. Remove spec-workflow references from start-spec-dashboard.cjs
  - _Prompt: Role: Code cleanup implementer | Task: Edit `.claude/scripts/hooks/start-spec-dashboard.cjs` to remove any references to the obsolete "spec-workflow" which no longer exists | Restrictions: Only remove spec-workflow related code. Ensure the remaining hook functionality still works. | Success: No references to spec-workflow remain and hook executes without errors._
  - **Implements**: REQ-008
  - **Validation**: `grep "spec-workflow" .claude/scripts/hooks/start-spec-dashboard.cjs` returns empty

- [ ] 10b. Remove spec-workflow cleanup from session-end.cjs
  - _Prompt: Role: Code cleanup implementer | Task: Edit `.claude/scripts/hooks/session-end.cjs` to remove the spec-workflow cleanup code which references a workflow that no longer exists | Restrictions: Only remove spec-workflow cleanup code. Ensure other session cleanup functionality remains intact. | Success: No spec-workflow cleanup code remains and hook executes without errors._
  - **Implements**: REQ-008
  - **Validation**: `grep "spec-workflow" .claude/scripts/hooks/session-end.cjs` returns empty

## Phase 5: Validation and Quality Checks

### T11: Run full quality checks

- [ ] 11. Run linting and typechecking
  - _Prompt: Role: Quality assurance validator | Task: Run `pnpm lint` and `pnpm typecheck` to ensure all changes pass quality checks | Restrictions: Do not modify any code to make tests pass. If checks fail, report the failures for manual review. | Success: Both commands complete with zero errors._
  - **Implements**: REQ-009
  - **Validation**: Exit codes are 0 for both commands

- [ ] 12. Run test suite
  - _Prompt: Role: Quality assurance validator | Task: Run `pnpm test` to ensure no runtime errors were introduced | Restrictions: Do not modify any code to make tests pass. If tests fail, report the failures for manual review. | Success: All tests pass._
  - **Implements**: REQ-009
  - **Validation**: Exit code is 0

## Phase 6: Commit Changes

### T12: Commit cleanup changes

- [ ] 13. Create git commit for cleanup
  - _Prompt: Role: Git commit creator | Task: Stage all changes from this cleanup task and create a commit with the message "chore: remove dead code and clean up legacy scripts\n\nRemoves:\n- user-prompt-submit.cjs (dead code)\n- evaluate-session.cjs (never executes)\n- parse-coderabbit.cjs (orphaned)\n\nFixes:\n- settings.json hook registrations\n- user-prompt-review.cjs file extension\n- Unused imports and exports\n- Obsolete spec-workflow references\n- Documentation clarity" | Restrictions: Include all modified and deleted files. Use the exact commit message provided. | Success: Commit is created with all changes and appears in git log._
  - **Implements**: REQ-010
  - **Validation**: `git log -1` shows the commit with correct message

## Task Dependencies

```
T1, T2, T4 → T3 (verify deletions)
T3 → T5 (update settings.json)
T5 → T6, T7, T8, T9, T10 (minor fixes)
T6, T7, T8, T9, T10 → T11 (quality checks)
T11 → T12 (commit)
```

## Rollback Plan

If any task fails:

1. **T1-T5**: `git checkout HEAD -- <file-path>` to restore deleted files
2. **T6-T10**: `git diff <file-path>` to review changes, then `git checkout HEAD -- <file-path>` to revert
3. **T11**: Fix reported issues before proceeding
4. **T12**: `git reset HEAD~1` to undo commit

## Estimated Effort

- Phase 1-2: 5 minutes (file deletions)
- Phase 3: 3 minutes (settings update)
- Phase 4: 10 minutes (minor fixes)
- Phase 5: 5 minutes (validation)
- Phase 6: 2 minutes (commit)

**Total**: ~25 minutes
