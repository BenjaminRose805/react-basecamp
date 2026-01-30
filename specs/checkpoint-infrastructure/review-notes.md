# Checkpoint Infrastructure - Spec Review Notes

**Date:** 2026-01-29
**Status:** Pending decisions

---

## Recommended Spec Changes

| #   | Question                                  | Change                                                                                                                                                                                | Effort | Decision     |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------ |
| 7   | Stale checkpoints from abandoned runs     | Add `head_commit` to base checkpoint schema for stale detection                                                                                                                       | Low    | **ACCEPTED** |
| 8   | Corrupted JSON returns null silently      | `loadCheckpoint()` warns on corrupt JSON instead of silent null                                                                                                                       | Low    | **ACCEPTED** |
| 9   | Two sources of truth for handoff schema   | Option B: Extend existing `handoff.md` (add `mode` field, rename `previous_findings` → `previous_summary`, add enforcement section). No new file. T004 becomes "extend" not "create". | Medium | **ACCEPTED** |
| 14  | Duplicate `getStateDir()` implementations | Extract `getStateDir()` to `utils.cjs`, update ship hook                                                                                                                              | Low    | **ACCEPTED** |

## Items Fine As-Is (No Changes Needed)

| #   | Question                              | Rationale                                                                                                                      |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | What problem does this solve today?   | Foundation infrastructure; zero user impact until commands integrate. Ship it, but make first consumer the next PR.            |
| 2   | Which commands benefit most?          | `/implement` by wide margin. Longest-running, most painful to restart.                                                         |
| 3   | Is this dead code?                    | Yes, until commands integrate. Justified because it's the #1 dependency in the priority matrix.                                |
| 4   | What's the resume experience?         | Checkpoint-manager is a library, not a feature. Resume UX is per-command work (Phase 2).                                       |
| 5   | Concurrent sessions                   | Last-write-wins. Low practical risk (single-developer, different features = different files). Document the limitation.         |
| 6   | 500-token heuristic accuracy          | Conservative (over-counts for code). Fine for prose summaries. Document margin of error.                                       |
| 10  | Is integrations.json premature?       | Yes, but it's 8 lines of JSON. Low cost to include. First thing to cut if trimming scope.                                      |
| 11  | Token counter validation              | Heuristic is a guardrail, not a billing meter. Ship with approximation, swap implementation later if needed.                   |
| 12  | version:1 without migration           | Useful even without migration code. Check version === 1 on load, return null + warn if not. No migration framework needed now. |
| 13  | Ship just scripts, defer docs/config? | Minimal viable PR is 2 scripts + tests. But all 5 files are low-effort. Ship all unless trimming scope.                        |

---

## Detailed Walkthrough

### Change #7: Add `head_commit` to base checkpoint schema

**Problem:** If you start `/implement auth-feature`, abandon it, and later run `/implement auth-feature --resume`, it picks up a stale checkpoint from a potentially different codebase state. No warning.

**Current spec:** The `gate` object has `head_commit` but only for `/ship`. Base checkpoint schema has no commit tracking.

**Proposed change:** Add `head_commit` field to the base `UnifiedCheckpoint` schema (not just inside `gate`). `saveCheckpoint()` auto-captures `git rev-parse HEAD`. `loadCheckpoint()` compares stored commit against current HEAD and logs a warning if different. Does NOT block — just warns.

**Impact on files:**

- `checkpoint-schema.md` — add `head_commit` to base interface
- `checkpoint-manager.cjs` — `saveCheckpoint()` captures HEAD, `loadCheckpoint()` compares
- `design.md` — update interface definition

**Effort:** ~15 lines of code + doc updates.

---

### Change #8: Warn on corrupt checkpoint JSON

**Problem:** `loadCheckpoint()` returns `null` for both "file doesn't exist" (normal) and "file exists but is corrupt JSON" (data loss). The user never knows a checkpoint was lost.

**Current spec:** Silent-fail pattern — try-catch returns null.

**Proposed change:** Distinguish two cases:

1. File doesn't exist → return `null` silently (expected)
2. File exists but JSON.parse fails → `logError()` warning, then return `null`

Still follows silent-fail (no thrown exceptions, no blocking). Just adds visibility.

**Impact on files:**

- `checkpoint-manager.cjs` — add `fs.existsSync()` check before parse attempt
- `design.md` — document the two cases

**Effort:** ~5 lines of code.

---

### Change #9: Extend existing handoff.md vs. new file

**Problem:** `.claude/sub-agents/protocols/handoff.md` already defines the handoff request/response protocol. Creating `.claude/protocols/handoff-schema.md` risks two sources of truth that can diverge.

**Current spec:** Create new file at `.claude/protocols/handoff-schema.md` that references the existing file.

**Option A (current):** New file references old. Risk: two files to maintain, reference can go stale.

**Option B (proposed):** Extend existing `.claude/sub-agents/protocols/handoff.md` with new sections:

- Enhanced `SubAgentHandoff` interface (adds `mode` field)
- Token enforcement rules (≤500 tokens for `previous_summary`)
- Usage examples for research→write and write→validate handoffs

**Option C:** Move everything to `.claude/protocols/handoff-schema.md`, delete old file, update all references.

**Impact of Option B:**

- No new file created (modify existing instead)
- `tasks.md` T004 changes from "create" to "extend"
- `requirements.md` R4 changes target path
- Reduces file count from 5 to 4

**Trade-off:** Option B is cleaner (one source of truth) but modifies an existing file that other things reference. Option A is safer (no existing file changes) but creates maintenance burden.

---

### Change #14: Extract getStateDir() to utils.cjs

**Problem:** `user-prompt-ship.cjs` defines `getStateDir()` locally (lines 23-26). `checkpoint-manager.cjs` needs the identical function. Two implementations of the same path logic.

**Current spec:** No mention of this refactor.

**Proposed change:**

1. Add `getStateDir()` to `.claude/scripts/lib/utils.cjs`
2. Update `user-prompt-ship.cjs` to import from utils.cjs
3. Have `checkpoint-manager.cjs` import from utils.cjs

**Function:**

```javascript
function getStateDir() {
  const gitRoot = getGitRoot() || process.cwd();
  return path.join(gitRoot, ".claude", "state");
}
```

**Impact on files:**

- `utils.cjs` — add function + export
- `user-prompt-ship.cjs` — replace local function with import
- `checkpoint-manager.cjs` — import from utils.cjs
- `tasks.md` — add as T000 or fold into T002

**Effort:** ~10 lines changed across 2 existing files.
