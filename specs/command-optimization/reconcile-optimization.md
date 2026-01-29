# /reconcile Command Optimization

**Phase 2** | **Date:** 2026-01-28

---

## 1. Relationship to /review

### Current State

| Aspect        | /review                                         | /reconcile                             |
| ------------- | ----------------------------------------------- | -------------------------------------- |
| Purpose       | Find issues                                     | Plan fixes for issues                  |
| Output        | `loop-state.json`, `claude-review-results.json` | `specs/reconcile-{timestamp}/tasks.md` |
| Triggers next | /reconcile (if issues) OR /ship (if clean)      | /implement                             |

### Overlap Analysis

**No overlap** - responsibilities are clearly separated:

```
/review → Detects problems → State files
                ↓
/reconcile → Reads state files → Creates fix plan
                ↓
/implement → Executes fix plan
```

### Should /reconcile consume /review output?

**YES - Already does.** The integration is correct:

1. `/reconcile --source claude` reads `claude-review-results.json`
2. `/reconcile --source local` reads `loop-state.json`
3. `/reconcile --source pr` reads GitHub PR comments

### Gap: Source Selection UX

The auto-detection is good, but users can't see what source was selected:

```
CURRENT:
/reconcile
→ [silently picks source]
→ runs both phases

PROPOSED:
/reconcile
→ "Detected source: claude (12 findings)"
→ [Enter] Proceed  [S] Switch source  [Esc] Cancel
```

### Recommendation

**Keep current separation.** Add source detection preview to show what will be analyzed.

---

## 2. Relationship to /design

### Current State

| Command    | Creates                              | Location                       |
| ---------- | ------------------------------------ | ------------------------------ |
| /design    | requirements.md, design.md, tasks.md | `specs/{feature}/`             |
| /reconcile | tasks.md                             | `specs/reconcile-{timestamp}/` |

### Should /reconcile update the original spec?

**Trade-offs:**

| Approach               | Pros                                  | Cons                                           |
| ---------------------- | ------------------------------------- | ---------------------------------------------- |
| **Update original**    | Single source of truth, easy to track | May overwrite approved spec, confusing history |
| **Separate directory** | Clean separation, preserves original  | Disconnected from original, duplicate specs    |
| **Append to original** | Best of both, maintains context       | Original spec grows unbounded                  |

### Recommendation: Hybrid Approach

**Create reconciliation tasks in a linked location with clear references:**

```markdown
# specs/reconcile-{timestamp}/tasks.md

> **Reconciliation For:** specs/user-auth/ (original spec)
> **Source:** claude-review-results.json (12 findings)
> **Created:** 2026-01-28T10:30:00Z

## Fix Tasks

- [ ] 1. Fix SQL injection in login handler
  - _Original: specs/user-auth/tasks.md#T003_
  - _Finding: claude-review-results.json#F7_
    ...
```

**Also add backlink to original spec:**

```markdown
# specs/user-auth/tasks.md (append)

---

## Reconciliation History

| Date       | Source | Tasks | Link                                                           |
| ---------- | ------ | ----- | -------------------------------------------------------------- |
| 2026-01-28 | claude | 5     | [reconcile-20260128-1030](../reconcile-20260128-1030/tasks.md) |
```

### How does user know what changed?

**Current:** User must compare files manually.

**Proposed:** Add `--diff` flag to show changes:

```bash
/reconcile --diff   # Show what would be added to original spec
```

---

## 3. Sub-Agent Consistency

### Template Mode Gap (CRITICAL)

The domain-researcher and domain-writer templates define:

```yaml
mode: plan | code | ui | docs | eval
```

But `/reconcile` uses `mode=reconcile` which is **not documented** in the templates.

### Comparison with Other Modes

| Mode          | domain-researcher | domain-writer | Documented? |
| ------------- | ----------------- | ------------- | ----------- |
| plan          | Yes               | Yes           | Yes         |
| code          | Yes               | Yes           | Yes         |
| ui            | Yes               | Yes           | Yes         |
| docs          | Yes               | Yes           | Yes         |
| eval          | Yes               | Yes           | Yes         |
| **reconcile** | **Used**          | **Used**      | **NO**      |
| research      | Used by /research | N/A           | **NO**      |

### Cross-Command Analysis Confirmed

From cross-command-analysis.md:

> "Mode `reconcile` not defined in templates"
> "Mode `research` not defined in template"

### Recommendation: Add Missing Modes to Templates

**domain-researcher.md additions:**

```yaml
mode: plan | code | ui | docs | eval | reconcile | research
```

**mode: reconcile**

```typescript
// Search locations
.claude/state/          // Review state files
gh api                  // PR comments

// Look for
- Finding severity (critical/major/minor)
- File and line references
- Patterns across findings
- Actionable vs informational
```

**mode: research**

```typescript
// Search locations
(topic-specific)

// Look for
- Existing implementations
- Code patterns
- Documentation
- External references
```

**domain-writer.md additions:**

```yaml
mode: plan | code | ui | docs | eval | reconcile
```

**mode: reconcile**

```typescript
// File structure
specs/reconcile-{timestamp}/tasks.md

// Format
- Task per critical/major finding
- Reference to original finding
- Acceptance criteria
- NO implementation code
```

---

## 4. Incremental Execution

### Current State Comparison

| Command        | Incremental? | Flags Available                   |
| -------------- | ------------ | --------------------------------- |
| /design        | No           | None                              |
| /review        | Partial      | `--free`, `--claude`, `--skip-cr` |
| /implement     | No           | None                              |
| **/reconcile** | **No**       | **None**                          |

### Cross-Command Analysis Finding

From cross-command-analysis.md:

> "Critical Gap: Only /review has meaningful incremental execution. 6/7 commands are all-or-nothing."

### Proposed Flags for /reconcile

| Flag             | Description                                      | Use Case                          |
| ---------------- | ------------------------------------------------ | --------------------------------- |
| `--analyze-only` | Run Phase 1, show findings, stop                 | Inspect before planning           |
| `--plan-only`    | Skip Phase 1, run Phase 2 with existing analysis | Re-plan with different parameters |
| `--dry-run`      | Show what would be done without creating files   | Safety/preview                    |

### Implementation

**--analyze-only:**

```
/reconcile --analyze-only

Source: claude (12 findings)

ANALYSIS RESULTS
────────────────────────────────────────
Critical (2):
  • SQL injection in src/server/auth.ts:45
  • Missing auth check in src/api/users.ts:89

Major (5):
  • Missing error handling (3 files)
  • Race condition in src/lib/cache.ts

Minor (5):
  • Naming conventions (2 files)
  • Missing comments (3 files)

To create fix plan: /reconcile --plan-only
```

**--plan-only:**

```
/reconcile --plan-only

Using cached analysis from: .claude/state/reconcile-analysis.json
Creating: specs/reconcile-{timestamp}/tasks.md

[task creation continues]
```

### Checkpoint File

Add `.claude/state/reconcile-checkpoint.json`:

```json
{
  "command": "reconcile",
  "source": "claude",
  "started_at": "2026-01-28T10:30:00Z",
  "state": {
    "current_phase": "analyze",
    "completed_phases": [],
    "pending_phases": ["analyze", "plan"]
  },
  "phases": {
    "analyze": {
      "status": "complete",
      "context_summary": "12 findings: 2 critical (SQL injection, auth bypass), 5 major, 5 minor. Files: auth.ts, users.ts, cache.ts...",
      "findings_count": { "critical": 2, "major": 5, "minor": 5 }
    }
  }
}
```

---

## 5. Output Actionability

### Current State

| Aspect                    | Status  | Notes                                 |
| ------------------------- | ------- | ------------------------------------- |
| Format matches /implement | Yes     | tasks.md with checkboxes              |
| Has acceptance criteria   | Yes     | Each task has criteria                |
| Has source references     | Partial | file:line OR PR URL                   |
| Links to original spec    | **No**  | Missing                               |
| Task IDs                  | **No**  | Missing (can't target specific tasks) |

### Comparison with /design Output

| Element             | /design tasks.md | /reconcile tasks.md |
| ------------------- | ---------------- | ------------------- |
| Task IDs (T001)     | Yes              | **No**              |
| \_Prompt field      | Yes              | **No**              |
| Phase grouping      | Yes              | **No**              |
| Requirement links   | Yes              | **No**              |
| Acceptance criteria | Yes              | Yes                 |

### Recommendation: Align with /design Format

**Current /reconcile output:**

```markdown
## Fix Tasks

- [ ] Fix SQL injection in login handler
  - File: src/server/auth.ts:45
  - Severity: Critical
  - Fix: Use parameterized queries
```

**Proposed aligned format:**

```markdown
## Fix Tasks

### Phase 1: Critical Fixes

- [ ] T001. Fix SQL injection in login handler
  - _Prompt: Role: Backend Developer | Task: Replace string concatenation with parameterized query in login handler | Finding: F7 from claude-review | Success: SQL injection test passes, no raw SQL concatenation_
  - _Original: specs/user-auth/tasks.md#T003_
  - Severity: Critical
  - File: src/server/auth.ts:45

- [ ] T002. Add authentication check to user list endpoint
  - _Prompt: Role: Backend Developer | Task: Add auth middleware to GET /users endpoint | Finding: F3 from claude-review | Success: Unauthenticated request returns 401_
  - Severity: Critical
  - File: src/api/users.ts:89

### Phase 2: Major Fixes

...
```

### Benefits

1. **Task IDs**: `/implement --task=T001` becomes possible
2. **\_Prompt field**: Direct instruction for implementer
3. **Phase grouping**: Clear priority order
4. **Traceability**: Links to original spec and findings

---

## Deliverables

### 1. Proposed File Changes

| File                                                | Change Type      | Description                                                      |
| --------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| `.claude/commands/reconcile.md`                     | Modify           | Add `--analyze-only`, `--plan-only`, `--dry-run`, `--diff` flags |
| `.claude/sub-agents/templates/domain-researcher.md` | Modify           | Add `mode: reconcile` and `mode: research` documentation         |
| `.claude/sub-agents/templates/domain-writer.md`     | Modify           | Add `mode: reconcile` documentation                              |
| `.claude/agents/plan-agent.md`                      | Modify           | Update reconcile flow to support incremental execution           |
| `.claude/state/reconcile-checkpoint.json`           | Create (runtime) | Checkpoint schema for phase resume                               |

### 2. Unified Patterns Adopted

| Pattern                     | Source                          | Adoption in /reconcile                    |
| --------------------------- | ------------------------------- | ----------------------------------------- |
| Task ID format (T001)       | /design                         | Add to reconcile tasks.md output          |
| \_Prompt field              | /design                         | Add to each fix task                      |
| Phase grouping              | /design                         | Group by Critical → Major → Minor         |
| Checkpoint file             | cross-command-analysis proposal | `.claude/state/reconcile-checkpoint.json` |
| `--dry-run` flag            | cross-command-analysis proposal | Show what would be created                |
| State file location         | All commands                    | Use `.claude/state/` consistently         |
| context_summary ~500 tokens | All sub-agents                  | Already used, enforce validation          |

### 3. /reconcile-Specific Optimizations

| Optimization                        | Priority | Effort | Impact                           |
| ----------------------------------- | -------- | ------ | -------------------------------- |
| Add `--analyze-only` flag           | High     | Low    | User can inspect before planning |
| Add reconcile mode to templates     | High     | Low    | Documentation completeness       |
| Add Task IDs and \_Prompt to output | High     | Medium | /implement compatibility         |
| Add original spec backlink          | Medium   | Low    | Traceability                     |
| Add `--diff` flag                   | Medium   | Medium | Change visibility                |
| Add checkpoint file                 | Medium   | Medium | Resume capability                |
| Add source detection preview        | Low      | Low    | UX improvement                   |
| Consistent output naming            | Low      | Low    | Clarity (timestamp → semantic)   |

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)

1. **Add reconcile mode to domain-researcher.md** - Document mode=reconcile behavior
2. **Add reconcile mode to domain-writer.md** - Document mode=reconcile behavior
3. **Add original spec reference to output** - Header with link to original spec

### Phase 2: Core Improvements (4-6 hours)

4. **Add `--analyze-only` flag** - Show analysis, stop before planning
5. **Add Task IDs and \_Prompt to output** - Align with /design format
6. **Add checkpoint file** - `.claude/state/reconcile-checkpoint.json`

### Phase 3: Advanced Features (1 day)

7. **Add `--plan-only` flag** - Use cached analysis
8. **Add `--dry-run` flag** - Preview without file creation
9. **Add `--diff` flag** - Show changes vs original spec
10. **Add source detection preview** - Show source before confirmation

---

## Summary

### Current /reconcile Status

- Clear 2-phase workflow
- Good integration with /review
- Actionable output format
- **BUT**: Missing template docs, no incremental execution, output format differs from /design

### After Optimization

- Template modes documented (consistency with other commands)
- Incremental execution via `--analyze-only` and `--plan-only`
- Output format aligned with /design (Task IDs, \_Prompt, phases)
- Checkpoint file for resume capability
- Clear traceability to original spec and findings
