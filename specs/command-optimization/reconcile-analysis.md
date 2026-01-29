# /reconcile Command Analysis

## 1. Command Flow

### Source Detection

The command supports three sources with auto-detection in priority order:

1. **Claude** (`--source claude`): Checks `.claude/state/claude-review-results.json`
   - If file exists and has findings → use 'claude'
2. **Local** (`--source local`): Checks `.claude/state/loop-state.json`
   - If `ship_allowed=false` → use 'local'
3. **PR** (`--source pr`): Checks `gh pr view --json number,url`
   - If PR exists with comments → use 'pr'
4. **Error**: No source found → "No reconcile source detected"

### Execution Path

```text
/reconcile [--source type]
    │
    ▼
Show preview (skill: preview)
    │
    ▼
Wait for confirmation [Enter/Esc]
    │
    ▼
Auto-detect source (or use --source flag)
    │
    ▼
PHASE 1: ANALYZE
    │
    └── Task(domain-researcher mode=reconcile, Opus)
        └── Extract findings from source
        └── Categorize by severity/type
        └── Returns: context_summary (~500 tokens)
    │
    ▼
PHASE 2: PLAN
    │
    └── Task(domain-writer mode=reconcile, Sonnet)
        └── Receives: context_summary from Phase 1
        └── Creates: specs/reconcile-{timestamp}/tasks.md
        └── NO implementation - planning only
    │
    ▼
Report tasks to user
```

### ANALYZE Phase Details

By source type:

| Source | Input File                                 | Analysis Focus                                                        |
| ------ | ------------------------------------------ | --------------------------------------------------------------------- |
| claude | `.claude/state/claude-review-results.json` | Extract severity (critical/major/minor), group by file/category       |
| local  | `.claude/state/loop-state.json`            | Merge findings from all loops (1-4), prioritize by severity+frequency |
| pr     | `gh api .../pulls/{pr}/comments`           | Categorize actionable feedback (fix/change/update/add/remove)         |

### PLAN Phase Details

Creates `specs/reconcile-{timestamp}/tasks.md` containing:

- Prioritized fix tasks with acceptance criteria
- Source references (file:line or PR comment URLs)
- Severity categorization
- One task per critical/major finding

---

## 2. Sub-Agent Spawning

### Phase 1: Domain Researcher

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze [source] findings",
  prompt: `
    You are a domain-researcher sub-agent (mode=reconcile, source=[type]).
    [source-specific instructions]
    Output: context_summary with categorized findings.
  `,
  model: "opus",
});
```

### Phase 2: Domain Writer

```typescript
Task({
  subagent_type: "general-purpose",
  prompt: `
    You are a domain-writer sub-agent (mode=reconcile, source=[type]).
    Context: [context_summary from Phase 1]
    Create specs/reconcile-{timestamp}/tasks.md
    DO NOT implement fixes - only plan them.
  `,
  model: "sonnet",
});
```

### Model Assignment

| Phase   | Sub-Agent         | Model  | Rationale                           |
| ------- | ----------------- | ------ | ----------------------------------- |
| ANALYZE | domain-researcher | Opus   | Complex analysis, categorization    |
| PLAN    | domain-writer     | Sonnet | Structured output, follows patterns |

### Handoff Content

| From    | To      | Content                                                                       |
| ------- | ------- | ----------------------------------------------------------------------------- |
| Phase 1 | Phase 2 | `context_summary` (~500 tokens): categorized issues, severity, files affected |

---

## 3. Inputs/Outputs

### Arguments

| Usage                        | Description                              |
| ---------------------------- | ---------------------------------------- |
| `/reconcile`                 | Auto-detect source (claude → local → pr) |
| `/reconcile --source claude` | Claude reviewer findings (Loop 2)        |
| `/reconcile --source local`  | Combined findings from all loops         |
| `/reconcile --source pr`     | GitHub PR review comments (Loop 4)       |

### Inputs Read

| Source | Files/APIs Read                                                                   |
| ------ | --------------------------------------------------------------------------------- |
| claude | `.claude/state/claude-review-results.json`                                        |
| local  | `.claude/state/loop-state.json`                                                   |
| pr     | `gh pr view --json number,url`, `gh api repos/{owner}/{repo}/pulls/{pr}/comments` |

### Outputs Created

| Source | Output Path                            |
| ------ | -------------------------------------- |
| All    | `specs/reconcile-{timestamp}/tasks.md` |

**Note:** Output uses timestamp, not PR number or feature name. The plan-agent docs show `specs/pr-{N}-reconciliation/tasks.md` but the reconcile command shows `specs/reconcile-{timestamp}/tasks.md` - **inconsistency detected**.

---

## 4. Incremental Execution

### Current State

| Capability                      | Supported? | Notes                             |
| ------------------------------- | ---------- | --------------------------------- |
| Run ONLY analyze phase          | **No**     | Both phases execute automatically |
| Review analysis before planning | **No**     | Handoff is automatic              |
| `--analyze-only` flag           | **No**     | Not implemented                   |
| Pause between phases            | **No**     | Not implemented                   |

### Gap Analysis

The command runs both phases sequentially without user checkpoint:

1. User cannot see analysis results before planning begins
2. User cannot abort after seeing analysis if issues are minor
3. No way to re-run only Phase 2 with different parameters

---

## 5. Integration with /review

### Relationship

```text
/review (creates)  ──────────────────►  /reconcile (consumes)
    │                                        │
    ├── .claude/state/loop-state.json        ├── Reads loop findings
    ├── .claude/state/claude-review-results  ├── Reads Claude findings
    └── (or PR comments via gh CLI)          └── Creates fix tasks
```

### Separation of Concerns

| Command      | Responsibility                                |
| ------------ | --------------------------------------------- |
| `/review`    | Find issues, categorize, report pass/fail     |
| `/reconcile` | Analyze findings, create actionable fix tasks |

### Overlap Analysis

- **Clear separation**: /review finds, /reconcile plans
- **Dependency**: /reconcile requires /review state files to exist
- **No duplication**: Analysis logic differs (finding vs planning)

### Data Flow

```text
/review
    │
    ▼
Loop 1: Build/Test → findings
Loop 2: Claude review → claude-review-results.json
Loop 3: Local analysis → loop-state.json
Loop 4: PR comments → GitHub API
    │
    ▼
/reconcile
    │
    ├── Merges findings from all sources
    ├── Categorizes and prioritizes
    └── Creates tasks.md for /implement
```

---

## 6. Optimization Opportunities

### Current Actionability

| Aspect              | Status | Notes                                         |
| ------------------- | ------ | --------------------------------------------- |
| Output format       | Good   | tasks.md matches /implement expectations      |
| Task structure      | Good   | Has acceptance criteria, severity, references |
| Immediate usability | Good   | `/implement` can consume output directly      |

### Integration Gaps

| Gap                          | Impact | Potential Fix                                  |
| ---------------------------- | ------ | ---------------------------------------------- |
| Doesn't update original spec | Medium | Could add `--update-spec` to modify original   |
| Creates separate directory   | Low    | Avoids polluting original spec                 |
| No link back to original     | Medium | Could reference original spec path in tasks.md |
| Timestamp-based naming       | Low    | PR-based naming might be clearer               |

### Template Gap Discovered

**CRITICAL:** The domain-researcher and domain-writer templates don't define `mode=reconcile`:

```yaml
# domain-researcher.md
mode: plan | code | ui | docs | eval  # Missing: reconcile

# domain-writer.md
mode: plan | code | ui | docs | eval  # Missing: reconcile
```

This means the reconcile mode behavior is only described inline in reconcile.md and plan-agent.md, not in the canonical templates.

### Suggested Improvements

1. **Add `--analyze-only` flag** - Allow Phase 1 only for inspection
2. **Add reconcile mode to templates** - Document mode=reconcile behavior
3. **Consistent output naming** - Align `reconcile-{timestamp}` vs `pr-{N}-reconciliation`
4. **Original spec reference** - Include path to original spec in tasks.md header
5. **Optional spec update** - `--update-spec` flag to modify original instead of new files

---

## Summary

### Strengths

- Clear 2-phase flow (ANALYZE → PLAN)
- Multi-source support (claude, local, pr)
- Smart auto-detection
- Actionable output for /implement
- Good model assignment (Opus for analysis, Sonnet for writing)

### Weaknesses

- No incremental execution (can't stop after analyze)
- Template gap (reconcile mode not documented)
- Output naming inconsistency
- No link back to original spec

### Dependencies

- Requires /review state files or PR comments
- Requires plan-agent.md orchestration
- Uses domain-researcher and domain-writer templates (with undocumented mode)
