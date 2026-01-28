# Design: .claude/ Directory Cleanup

## Overview

This design implements a phased cleanup approach to safely remove legacy code from the `.claude/` directory. The critical constraint is that hook files cannot be deleted while they are still registered in `settings.json`, requiring a specific execution order.

## Architecture

### Phased Execution Strategy

The cleanup follows a strict 4-phase approach to prevent breaking the system:

```
Phase A: Update settings.json (remove hook registrations)
    ↓
Phase B: Delete files and directories
    ↓
Phase C: Update CLAUDE.md (remove command references)
    ↓
Phase D: Clean up empty directories
```

### Phase A: Hook Registration Cleanup

**Goal**: Remove all references to deprecated hooks from `settings.json` before deleting the hook files.

**Critical Constraint**: Hook files that are registered in `settings.json` cannot be safely deleted until their registrations are removed.

**Files Modified**:

- `.claude/settings.json`

**Hook Registrations to Remove**:

1. `pre-tool-use-doc-warning.cjs`
2. `pre-tool-use-dev-tip.cjs`
3. `pre-tool-use-task-enforcement.cjs`
4. `post-tool-use-console-check.cjs`
5. `post-tool-use-eslint.cjs`
6. `post-tool-use-prettier.cjs`
7. `post-tool-use-typecheck.cjs`
8. `post-tool-use-vitest.cjs`
9. `post-tool-use-pr-created.cjs`
10. `stop-console-check.cjs`
11. `suggest-compact.cjs`
12. `pre-compact.cjs`
13. `compaction-tracker.cjs`
14. `start-spec-dashboard.cjs`

**Implementation**:

- Read `settings.json`
- Remove each hook from the appropriate array (preToolUse, postToolUse, stop, etc.)
- Write updated `settings.json`
- Verify no references to deleted hooks remain

### Phase B: File and Directory Deletion

**Goal**: Remove all deprecated files and directories.

**Categories**:

1. **Command Files** (3 files)
   - `.claude/commands/guide.md`
   - `.claude/commands/mode.md`
   - `.claude/commands/plan.md`

2. **Deprecated Directories** (5 directories)
   - `.claude/agents/archived/`
   - `.claude/workflows/`
   - `.claude/examples/`
   - `.claude/tests/`
   - `.claude/sub-agents/profiles/`

3. **Sub-agent Templates** (5 files)
   - `.claude/sub-agents/code-analyzer.md`
   - `.claude/sub-agents/git-content-generator.md`
   - `.claude/sub-agents/parallel-executor.md`
   - `.claude/sub-agents/quality-checker.md`
   - `.claude/sub-agents/spec-analyzer.md`

4. **Documentation Files** (8 files)
   - `.claude/sub-agents/code/README.md`
   - `.claude/sub-agents/docs/README.md`
   - `.claude/sub-agents/eval/README.md`
   - `.claude/sub-agents/plan/README.md`
   - `.claude/sub-agents/ui/README.md`
   - `.claude/sub-agents/workflows/README.md`
   - `.claude/sub-agents/QUICK-REFERENCE.md`
   - `.claude/sub-agents/README.md`

5. **Script Files** (2 scripts + 5 lib files = 7 files)
   - `.claude/scripts/install-tools.cjs`
   - `.claude/scripts/measure-tokens.cjs`
   - `.claude/scripts/lib/free-checks.cjs`
   - `.claude/scripts/lib/rate-limit-tracker.cjs`
   - `.claude/scripts/lib/claude-reviewer.cjs`
   - `.claude/scripts/lib/loop-controller.cjs`
   - `.claude/scripts/lib/secret-scanner.cjs`

6. **Hook Files** (14 files - deleted AFTER settings.json update)
   - `.claude/hooks/pre-tool-use-doc-warning.cjs`
   - `.claude/hooks/pre-tool-use-dev-tip.cjs`
   - `.claude/hooks/pre-tool-use-task-enforcement.cjs`
   - `.claude/hooks/post-tool-use-console-check.cjs`
   - `.claude/hooks/post-tool-use-eslint.cjs`
   - `.claude/hooks/post-tool-use-prettier.cjs`
   - `.claude/hooks/post-tool-use-typecheck.cjs`
   - `.claude/hooks/post-tool-use-vitest.cjs`
   - `.claude/hooks/post-tool-use-pr-created.cjs`
   - `.claude/hooks/stop-console-check.cjs`
   - `.claude/hooks/suggest-compact.cjs`
   - `.claude/hooks/pre-compact.cjs`
   - `.claude/hooks/compaction-tracker.cjs`
   - `.claude/hooks/start-spec-dashboard.cjs`

7. **Documentation** (5 files)
   - `.claude/docs/commands.md`
   - `.claude/docs/conditional-mcp-servers.md`
   - `.claude/docs/context-loading.md`
   - `.claude/docs/rules/hooks.md`
   - `.claude/docs/rules/performance.md`

8. **Sub-agent Library** (2 files)
   - `.claude/sub-agents/lib/inject-rules.cjs`
   - `.claude/sub-agents/lib/README.md`

**Total Files to Delete**: 44 files + 5 directories

### Phase C: CLAUDE.md Update

**Goal**: Remove references to deleted commands from the project documentation.

**File Modified**:

- `/home/benjamin/basecamp/react-basecamp-feature-agent-optimization/CLAUDE.md`

**Changes**:

- Update command table to remove `/guide` and `/mode` rows
- Keep only 7 commands: /start, /research, /design, /reconcile, /implement, /review, /ship

**Before**:

```markdown
| Command      | Agent                      |
| ------------ | -------------------------- |
| `/start`     | git-agent                  |
| `/design`    | plan-agent                 |
| `/reconcile` | plan-agent                 |
| `/research`  | plan-agent                 |
| `/implement` | code/ui/docs/eval (routes) |
| `/ship`      | git-agent + check-agent    |
| `/guide`     | (informational)            |
| `/mode`      | dev/basic switch           |
```

**After**:

```markdown
| Command      | Agent                      |
| ------------ | -------------------------- |
| `/start`     | git-agent                  |
| `/research`  | plan-agent                 |
| `/design`    | plan-agent                 |
| `/reconcile` | plan-agent                 |
| `/implement` | code/ui/docs/eval (routes) |
| `/review`    | check-agent                |
| `/ship`      | git-agent + check-agent    |
```

### Phase D: Empty Directory Cleanup

**Goal**: Remove any empty directories left behind after file deletion.

**Approach**:

- Recursively find empty directories in `.claude/`
- Delete them from deepest to shallowest
- Common candidates: `hooks/`, `scripts/lib/`, `sub-agents/workflows/`, etc.

**Implementation**:

```bash
find .claude -type d -empty -delete
```

## Preservation Strategy

### Files to KEEP

**Commands** (7 files):

- start.md
- research.md
- design.md
- reconcile.md
- implement.md
- review.md
- ship.md

**Agents** (7 files):

- git-agent.md
- plan-agent.md
- code-agent.md
- ui-agent.md
- docs-agent.md
- eval-agent.md
- check-agent.md

**Core Scripts** (3 files):

- scripts/lib/utils.cjs
- scripts/lib/security-patterns.cjs
- scripts/lib/package-manager.cjs

**Core Hooks** (10 files):

- hooks/session-start.cjs
- hooks/session-end.cjs
- hooks/user-prompt-start.cjs
- hooks/user-prompt-ship.cjs
- hooks/user-prompt-review.cjs
- hooks/command-mode-detect.cjs
- hooks/pre-tool-use-bash.cjs
- hooks/pre-tool-use-file.cjs
- hooks/pre-tool-use-git-push.cjs
- hooks/post-tool-use.cjs

**Sub-agent Templates** (3 files):

- sub-agents/domain-researcher.md
- sub-agents/domain-writer.md
- sub-agents/quality-validator.md

**Sub-agent Protocols** (2 files):

- sub-agents/orchestration.md
- sub-agents/handoff.md

**Sub-agent Library** (1 file):

- sub-agents/lib/sizing-heuristics.md

**Sub-agent Git** (2 files):

- sub-agents/git/git-executor.md
- sub-agents/git/pr-reviewer.md

**Sub-agent Check** (2 files):

- sub-agents/check/code-validator.md
- sub-agents/check/security-scanner.md

**Config Files** (4 files):

- settings.json (will be modified in Phase A)
- settings.local.json
- cclsp.json
- package-manager.json

**Directories**:

- state/
- logs/

**Documentation**:

- All files in docs/rules/ except hooks.md and performance.md

## Risk Mitigation

### Critical Risks

1. **Deleting hooks before updating settings.json**
   - Mitigation: Enforce Phase A completion before Phase B
   - Verification: Check settings.json has no references to deleted hooks

2. **Accidentally deleting preserved files**
   - Mitigation: Explicit KEEP list validation before deletion
   - Verification: Git diff review before commit

3. **Breaking core command functionality**
   - Mitigation: Only delete deprecated commands (/guide, /mode, /plan)
   - Verification: Test each of the 7 core commands after cleanup

4. **Orphaned directory structures**
   - Mitigation: Phase D cleanup of empty directories
   - Verification: Find command to locate remaining empty dirs

### Verification Steps

After each phase:

- Run `git status` to review changes
- Verify no unintended files in deletion list
- Check for broken symlinks or references
- Confirm core commands still work

## Implementation Order

1. Execute Phase A (settings.json update)
2. Verify settings.json has no references to deleted hooks
3. Execute Phase B (file/directory deletion)
4. Verify all intended files deleted, all preserved files intact
5. Execute Phase C (CLAUDE.md update)
6. Verify command table is correct
7. Execute Phase D (empty directory cleanup)
8. Final verification: git diff review

## Expected Outcomes

- Cleaner, more maintainable `.claude/` directory structure
- Reduced cognitive load for developers
- Faster command discovery (only 7 commands)
- No legacy code confusion
- Simplified hook system (10 core hooks instead of 24)
- Smaller git repository size
- Faster Claude Code initialization
