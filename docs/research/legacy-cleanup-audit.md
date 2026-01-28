# Research: Legacy Code Cleanup Audit

> **Type:** Research Notes
> **Date:** 2026-01-28
> **Status:** Complete
> **Next Step:** `/design legacy-cleanup` to create implementation specs

## Overview

Comprehensive audit of `.claude/` directory identifying all removable legacy code, deprecated functions, dead code, and MCP server reference mismatches.

## Research Methodology

**6-Phase Audit:**

1. Keyword Search (deprecated, legacy, TODO, etc.)
2. Structural Analysis (unused exports, duplicates)
3. Hooks Audit (registered vs unregistered)
4. Reference Analysis (cross-reference all components)
5. Impact Assessment (safe vs breaking)
6. MCP Server Audit (installed vs referenced)

## Key Findings

### Summary Statistics

| Category             | Count | Priority   |
| -------------------- | ----- | ---------- |
| Dead code files      | 2     | HIGH       |
| Orphaned modules     | 1     | MEDIUM     |
| Deprecated exports   | 3     | LOW        |
| Doc mismatches       | 2     | MEDIUM     |
| MCP reference issues | 3     | LOW-MEDIUM |
| Archived agents      | 4     | Done ✅    |

### Files to Remove (Zero Impact)

| File                                           | Reason                                     | Evidence                                      |
| ---------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `.claude/scripts/hooks/user-prompt-submit.cjs` | Dead code - reads stdin, immediately exits | Lines 34-36: "ZERO INJECTION" comments        |
| `.claude/scripts/hooks/evaluate-session.cjs`   | Never executes - undefined env var         | Depends on CLAUDE_TRANSCRIPT_PATH (never set) |
| `.claude/scripts/lib/parse-coderabbit.cjs`     | Orphaned - never imported                  | Grep: 0 references to exports                 |

### Files to Update

| File                                             | Change                          | Line(s)     |
| ------------------------------------------------ | ------------------------------- | ----------- |
| `.claude/scripts/hooks/user-prompt-review.cjs`   | Fix `.json` → `.yaml` reference | 171         |
| `.claude/scripts/setup-package-manager.cjs`      | Remove unused `log` import      | 27          |
| `.claude/scripts/lib/utils.cjs`                  | Remove `grepFile` export        | 503         |
| `.claude/agents/ui-agent.md`                     | Note figma MCP is optional      | MCP section |
| `.claude/scripts/hooks/start-spec-dashboard.cjs` | Remove spec-workflow references | Multiple    |
| `.claude/scripts/hooks/session-end.cjs`          | Remove spec-workflow cleanup    | Multiple    |

### Deprecated Exports (Keep for Now)

| File               | Export                  | Replacement         | Action                 |
| ------------------ | ----------------------- | ------------------- | ---------------------- |
| `utils.cjs`        | `log()`                 | `logError()`        | Add removal date       |
| `utils.cjs`        | `output()`              | `logContext()`      | Add removal date       |
| `inject-rules.cjs` | `plan-researcher` alias | `domain-researcher` | Add deprecation notice |
| `inject-rules.cjs` | `plan-writer` alias     | `domain-writer`     | Add deprecation notice |

### MCP Server Status

**Installed (5):** `cclsp`, `next-devtools`, `playwright`, `context7`, `shadcn`

**All `mcp__*` tool references are valid** - 43+ references checked.

**Intentionally Removed:**

- `vitest` → `pnpm test` CLI
- `github` → `gh` CLI
- `spec-workflow` → File-based specs

**Referenced but Not Installed:**

- `figma` in `ui-agent.md` (should be marked optional)

### Hook Audit Results

**26 hooks registered** across 6 trigger types. All registered hooks have corresponding files.

**Dead Code Paths:**

- `user-prompt-submit.cjs` - Does nothing
- `evaluate-session.cjs` - Never executes

**Duplicate Logic (Intentional):**

- `post-tool-use-console-check.cjs` + `stop-console-check.cjs` (different lifecycle stages)
- `suggest-compact.cjs` + `compaction-tracker.cjs` (shared sanitizeSessionId)

### Archived Agents (Already Handled)

| Agent         | Replacement            | Status      |
| ------------- | ---------------------- | ----------- |
| debug-agent   | investigator sub-agent | ✅ Archived |
| pr-agent      | git-agent              | ✅ Archived |
| help-agent    | /help command          | ✅ Archived |
| context-agent | /context command       | ✅ Archived |

## Recommended Implementation Phases

### Phase 1: Safe Removals (Immediate)

1. Delete `user-prompt-submit.cjs`
2. Delete `evaluate-session.cjs`
3. Delete `parse-coderabbit.cjs`
4. Remove `grepFile` export from utils.cjs
5. Update settings.json to remove deleted hooks

### Phase 2: Documentation Fixes

6. Fix review-config reference (.json → .yaml)
7. Remove unused `log` import from setup-package-manager.cjs
8. Add "optional" note to figma MCP in ui-agent.md
9. Remove spec-workflow references from hooks

### Phase 3: Deprecation Timeline (Future)

10. Add removal dates to deprecated function comments
11. Add deprecation notice to plan-\* aliases
12. Plan removal after 2-month grace period

## Risk Assessment

| Risk                        | Level | Mitigation                               |
| --------------------------- | ----- | ---------------------------------------- |
| Breaking existing workflows | LOW   | All removals verified as unused          |
| Hook system disruption      | LOW   | Update settings.json alongside deletions |
| MCP tool failures           | NONE  | All references are valid                 |

## Testing Requirements

Before implementation:

- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Verify `/start`, `/design`, `/implement`, `/ship` work

After implementation:

- [ ] Same checks pass
- [ ] No hook errors in stderr
- [ ] Commands still function

## Success Metrics

- **Files Removed:** 3
- **Lines of Dead Code Removed:** ~400
- **Breaking Changes:** 0
- **MCP Reference Errors:** 0

## Open Questions

None - all findings have clear remediation paths.

## References

- `.claude/agents/archived/README.md` - Migration guide for archived agents
- `.claude/mcp-configs/conditional-mcp-servers.md` - MCP removal documentation
- `.claude/settings.json` - Hook registrations

---

**Ready for:** `/design legacy-cleanup`
