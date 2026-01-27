# Design: Cleanup & Consolidation

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-10

## Overview

This design document outlines the approach for cleaning up stale references and consolidating documentation after the agent optimization upgrade.

---

## Analysis Summary

### Current State

| Category                    | Issue Count | Severity |
| --------------------------- | ----------- | -------- |
| Uncommitted file changes    | 66 files    | High     |
| Stale command references    | 200+        | High     |
| Stale agent references      | 30+         | Medium   |
| Stale MCP server references | 20+         | Medium   |
| Naming inconsistencies      | 50+         | Low      |
| Orphaned files              | 4 files     | Medium   |

### Files Requiring Changes

#### HIGH PRIORITY - Full Rewrite/Removal

| File                           | Action       | Reason                           |
| ------------------------------ | ------------ | -------------------------------- |
| `.claude/contexts/dev.md`      | Remove       | 100% stale content               |
| `.claude/contexts/research.md` | Remove       | 100% stale content               |
| `.claude/contexts/review.md`   | Remove       | 100% stale content               |
| `.claude/agents/README.md`     | Rewrite      | References wrong agent structure |
| `docs/DEVELOPER_WORKFLOW.md`   | Major update | 100+ stale command references    |

#### MEDIUM PRIORITY - Targeted Updates

| File                             | Changes Needed                                        |
| -------------------------------- | ----------------------------------------------------- |
| `docs/MCP_SETUP.md`              | Remove spec-workflow, vitest, github MCP refs         |
| `CONTRIBUTING.md`                | Update /context to /mode, fix command list            |
| `.claude/rules/methodology.md`   | Update /distill, /spec, /eval references              |
| `.claude/rules/agents.md`        | Fix model assignments (Sonnet → Opus for researchers) |
| `.claude/rules/git-workflow.md`  | Update all deprecated command references              |
| `.claude/rules/testing.md`       | Remove /debug reference                               |
| `.claude/rules/performance.md`   | Remove /debug reference                               |
| `.claude/workflows/README.md`    | Align command names with CLAUDE.md                    |
| `.claude/workflows/implement.md` | Fix trigger from /build to /implement                 |

#### LOW PRIORITY - Minor Updates

| File                                | Changes Needed                              |
| ----------------------------------- | ------------------------------------------- |
| `.github/PULL_REQUEST_TEMPLATE.md`  | Update /verify, /security refs              |
| `docs/INTEGRATIONS.md`              | Update /verify reference                    |
| `docs/MCP_TOOL_GAPS.md`             | Update qa → validator naming                |
| `.claude/agents/archived/README.md` | Update command references (historical note) |

---

## Command Mapping Reference

Use this mapping when updating references:

| Old Command       | New Command          | Notes                             |
| ----------------- | -------------------- | --------------------------------- |
| `/context`        | `/mode`              | Direct replacement                |
| `/debug`          | `/plan` (reconcile)  | Investigation absorbed            |
| `/help`           | `/guide`             | Direct replacement                |
| `/build`          | `/implement`         | Direct replacement                |
| `/check`          | Part of `/implement` | Absorbed, remove user-facing refs |
| `/code [feature]` | `/implement`         | Routes to code-agent              |
| `/ui [feature]`   | `/implement`         | Routes to ui-agent                |
| `/docs [feature]` | `/implement`         | Routes to docs-agent              |
| `/eval [feature]` | `/implement`         | Routes to eval-agent              |
| `/pr`             | `/ship`              | PR creation absorbed              |
| `/branch`         | `/start`             | Worktree creation                 |
| `/verify`         | Part of `/implement` | Final verification phase          |
| `/distill`        | `/plan`              | Spec creation                     |
| `/spec`           | `/plan`              | Spec creation                     |

---

## Sub-Agent Naming Standardization

| Old Name (in docs) | Correct Name (in implementation) |
| ------------------ | -------------------------------- |
| `code-qa`          | `code-validator`                 |
| `ui-qa`            | `ui-validator`                   |
| `eval-qa`          | `eval-validator`                 |
| `docs-qa`          | `docs-validator`                 |
| `plan-qa`          | `plan-validator`                 |

---

## Model Assignment Correction

The `rules/agents.md` file incorrectly shows:

```markdown
# WRONG

| \*-researcher | Sonnet | Read-heavy, needs good comprehension |
```

Should be:

```markdown
# CORRECT

| \*-researcher | Opus | Deep analysis, pattern recognition |
```

This matches CLAUDE.md and spec 08 design.

---

## Cleanup Approach

### Phase 1: Commit Staging (Immediate)

Stage and review the 66 uncommitted changes. Group into logical commits:

- Deleted old commands
- New commands
- New skills
- New sub-agents
- Updated agents
- Updated workflows
- Updated CLAUDE.md

### Phase 2: Remove Stale Files

Remove the entirely stale contexts directory:

```bash
rm -rf .claude/contexts/
```

### Phase 3: Rewrite Critical Files

1. `.claude/agents/README.md` - Full rewrite with current architecture
2. `docs/DEVELOPER_WORKFLOW.md` - Systematic replacement of all stale refs

### Phase 4: Targeted Updates

Update files with specific stale references using search-and-replace patterns.

### Phase 5: Verification

Run verification searches to ensure no stale references remain:

```bash
# Should return 0 results outside archived/
grep -r "/context" .claude/ --include="*.md" | grep -v archived
grep -r "/debug" .claude/ --include="*.md" | grep -v archived
grep -r "spec-workflow" . --include="*.md"
grep -r "vitest" .claude/ --include="*.md"
grep -r "github" .claude/ --include="*.md" | grep -v "github.com"
```

---

## File-by-File Change Details

### `.claude/contexts/` (REMOVE)

**Action:** Delete entire directory

**Reason:** All 3 files reference entirely deprecated commands:

- `dev.md`: /code, /context, /verify
- `research.md`: /code, /distill, /context
- `review.md`: /context, /verify

**Replacement:** The `/mode` command handles context switching. No separate context files needed.

---

### `.claude/agents/README.md` (REWRITE)

**Current Content Issues:**

- References `distill-researcher`, `distill-spec-writer`, `distill-qa`
- References `/distill` command
- Wrong agent listing

**New Content Should Include:**

- Current 7 agents with descriptions
- Current sub-agent architecture
- Reference to sub-agents/README.md for details

---

### `docs/DEVELOPER_WORKFLOW.md` (MAJOR UPDATE)

**Issues Found (200+ references):**

- `/code` appears 50+ times
- `/ui` appears 20+ times
- `/branch` appears 30+ times
- `/pr` appears 10+ times
- `/debug` appears 4 times
- `spec-workflow` appears 8 times

**Approach:**

1. Replace workflow examples with new commands
2. Update command reference table
3. Update agent interaction sections
4. Update MCP server sections

---

### `.claude/rules/agents.md` (UPDATE)

**Line 128-135 (Model Assignment Table):**

```markdown
# Current (WRONG)

| \*-researcher | Sonnet | Read-heavy, needs good comprehension |

# Should be

| \*-researcher | Opus | Deep analysis, pattern recognition |
```

---

### `.claude/rules/methodology.md` (UPDATE)

**Line 26:**

```markdown
# Current

1. /distill or /spec

# Should be

1. /plan
```

**Lines 122-139:**
Remove `/eval research`, `/eval write`, `/eval qa` references - these are internal phases now.

---

### `.claude/workflows/implement.md` (UPDATE)

**Line 12:**

```markdown
# Current

/build [feature]

# Should be

/implement [feature]
```

---

## Verification Checklist

After all changes, verify:

- [ ] `grep -r "/context" .claude/ docs/ | grep -v archived` returns 0 results
- [ ] `grep -r "/debug" .claude/ docs/ | grep -v archived` returns 0 results
- [ ] `grep -r "/build" .claude/ docs/ | grep -v archived` returns 0 results (or only internal refs)
- [ ] `grep -r "spec-workflow" .` returns 0 results
- [ ] `grep -r "code-qa" .` returns 0 results (except specs/ historical)
- [ ] All 66 uncommitted changes are staged and committed
- [ ] No broken markdown links
- [ ] CLAUDE.md architecture diagram matches actual files

---

## Risk Assessment

| Risk                        | Likelihood | Impact | Mitigation                        |
| --------------------------- | ---------- | ------ | --------------------------------- |
| Missing a stale reference   | Medium     | Low    | Verification grep searches        |
| Breaking existing workflows | Low        | High   | This is doc-only, no code changes |
| Losing historical context   | Low        | Medium | Keep archived/ folder intact      |

---
