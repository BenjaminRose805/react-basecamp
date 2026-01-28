# Legacy Cleanup - Design

## Overview

This document outlines the architecture and approach for removing dead code, unused imports, and orphaned scripts from the react-basecamp-feature-agent-optimization codebase.

## Design Principles

1. **Safety First**: Validate all changes don't break existing functionality
2. **Atomic Changes**: Group related changes together, commit separately
3. **Documentation**: Update all affected documentation
4. **Verification**: Test after each phase

## Architecture

### Current State

```
.claude/
├── scripts/
│   ├── hooks/
│   │   ├── user-prompt-submit.cjs      # DEAD CODE
│   │   ├── evaluate-session.cjs        # NEVER EXECUTES
│   │   ├── user-prompt-review.cjs      # HAS BUG
│   │   ├── start-spec-dashboard.cjs    # HAS OBSOLETE REFS
│   │   └── session-end.cjs             # HAS OBSOLETE REFS
│   ├── lib/
│   │   ├── parse-coderabbit.cjs        # ORPHANED
│   │   └── utils.cjs                   # HAS UNUSED EXPORT
│   └── setup-package-manager.cjs       # HAS UNUSED IMPORT
├── agents/
│   └── ui-agent.md                     # NEEDS CLARIFICATION
└── settings.json                       # HAS DEAD HOOK REFS
```

### Target State

```
.claude/
├── scripts/
│   ├── hooks/
│   │   ├── user-prompt-review.cjs      # FIXED
│   │   ├── start-spec-dashboard.cjs    # CLEANED
│   │   └── session-end.cjs             # CLEANED
│   ├── lib/
│   │   └── utils.cjs                   # CLEANED
│   └── setup-package-manager.cjs       # CLEANED
├── agents/
│   └── ui-agent.md                     # UPDATED
└── settings.json                       # FIXED
```

## Implementation Phases

### Phase 1: Remove Dead Hook Scripts

**Rationale**: These files are completely unused and safe to delete.

**Files to Delete:**

1. `.claude/scripts/hooks/user-prompt-submit.cjs` - Dead code
2. `.claude/scripts/hooks/evaluate-session.cjs` - Never executes (CLAUDE_TRANSCRIPT_PATH never set)

**Risk**: Low - No references found in codebase

**Validation**: Grep for any remaining references after deletion

### Phase 2: Remove Orphaned Library Code

**Rationale**: No imports or callers exist for this utility.

**Files to Delete:**

1. `.claude/scripts/lib/parse-coderabbit.cjs` - Orphaned utility

**Risk**: Low - No imports found

**Validation**: Grep for any imports or require() statements

### Phase 3: Update Hook Registrations

**Rationale**: Prevent settings.json from referencing deleted files.

**Changes:**

- Remove UserPromptSubmit hook: `node .claude/scripts/hooks/user-prompt-submit.cjs`
- Remove Stop hook: `node .claude/scripts/hooks/evaluate-session.cjs`

**Risk**: Medium - Settings.json structure must remain valid

**Validation**: Parse settings.json to ensure valid JSON

### Phase 4: Fix Minor Issues

**Rationale**: Clean up low-impact issues while we're doing the cleanup.

**Changes:**

1. **File Extension Fix** (`.claude/scripts/hooks/user-prompt-review.cjs:171`)
   - Change: `.json` → `.yaml`
   - Reason: Status files use YAML format

2. **Remove Unused Import** (`.claude/scripts/setup-package-manager.cjs:27`)
   - Remove: `log` import from utils
   - Reason: Import is unused

3. **Remove Unused Export** (`.claude/scripts/lib/utils.cjs:503`)
   - Remove: `grepFile` export
   - Reason: No external callers

4. **Update Documentation** (`.claude/agents/ui-agent.md`)
   - Add: Note that figma MCP is optional
   - Reason: Clarify requirements

5. **Remove Obsolete Refs** (`.claude/scripts/hooks/start-spec-dashboard.cjs`)
   - Remove: spec-workflow references
   - Reason: Workflow no longer exists

6. **Remove Obsolete Refs** (`.claude/scripts/hooks/session-end.cjs`)
   - Remove: spec-workflow cleanup code
   - Reason: Workflow no longer exists

**Risk**: Low - Minor changes with low impact

**Validation**: Lint and typecheck pass

## Rollback Strategy

All changes are reversible via git:

```bash
# Rollback specific file deletion
git checkout HEAD -- <file-path>

# Rollback entire cleanup
git reset --hard <commit-before-cleanup>
```

## Testing Strategy

### Per-Phase Validation

1. **After file deletions**: Run grep to ensure no references
2. **After settings.json update**: Parse JSON for validity
3. **After code changes**: Run linting and typechecking
4. **Final validation**: Full test suite

### Validation Commands

```bash
# Check for references
pnpm exec grep -r "user-prompt-submit" .
pnpm exec grep -r "evaluate-session" .
pnpm exec grep -r "parse-coderabbit" .

# Validate settings.json
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf-8'))"

# Quality checks
pnpm lint
pnpm typecheck
pnpm test
```

## Risk Assessment

| Phase   | Risk Level | Mitigation                            |
| ------- | ---------- | ------------------------------------- |
| Phase 1 | Low        | Validated no references exist         |
| Phase 2 | Low        | Validated no imports exist            |
| Phase 3 | Medium     | Validate JSON structure after changes |
| Phase 4 | Low        | Minor changes, easy to rollback       |

## Dependencies

- **Git**: Clean working directory required
- **pnpm**: For running validation commands
- **Node.js**: For JSON validation

## Success Metrics

- [ ] All dead code files removed
- [ ] All hook registrations updated
- [ ] All minor issues fixed
- [ ] All tests passing
- [ ] Linting and typechecking passing
- [ ] No broken references in codebase
