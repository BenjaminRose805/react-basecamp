# /review Command Optimization

**Phase 2 Analysis** | **Date:** 2026-01-28

---

## 1. Relationship to /implement

### Current State

| Aspect          | Current                         | Issue                                   |
| --------------- | ------------------------------- | --------------------------------------- |
| Scope detection | Reviews all uncommitted changes | No awareness of what /implement changed |
| Manifest file   | None                            | No structured output from /implement    |
| Targeted review | Not supported                   | Can't scope to only changed files       |

### Should /review auto-detect what /implement changed?

**YES** - This would significantly improve efficiency.

From `implement-analysis.md`, /implement's writer outputs:

```json
{
  "files_created": [{ "path": "...", "purpose": "..." }],
  "files_modified": [{ "path": "...", "changes": "..." }],
  "tests_written": [{ "path": "...", "test_count": N }]
}
```

This output is lost after execution. If persisted, /review could consume it.

### Proposed: Manifest File

**Location:** `.claude/state/implement-manifest.json`

```json
{
  "version": "1.0",
  "feature": "user-auth",
  "spec_path": "specs/user-auth/",
  "timestamp": "2026-01-28T10:00:00Z",
  "head_commit": "abc123",
  "files": {
    "created": ["src/lib/auth.ts", "src/components/LoginForm.tsx"],
    "modified": ["src/server/routers/index.ts"],
    "tests": ["src/__tests__/auth.test.ts"]
  },
  "task_completion": {
    "T001": "complete",
    "T002": "complete",
    "T003": "in_progress"
  }
}
```

### /review consuming manifest

```bash
# New flag
/review --from-implement    # Auto-scope to files from implement-manifest.json

# Behavior:
# 1. Read .claude/state/implement-manifest.json
# 2. Scope review to files.created + files.modified + files.tests
# 3. Run all loops on those files only
# 4. Store results with manifest reference
```

### Can /review scope to only changed files?

**Not currently.** Proposed new flags:

| Flag               | Description                          |
| ------------------ | ------------------------------------ |
| `--files <glob>`   | Review specific files matching glob  |
| `--staged-only`    | Review only staged changes           |
| `--from-implement` | Review files from implement manifest |

---

## 2. Relationship to /ship

### Current Integration

From `ship-analysis.md`:

```text
/ship reads .claude/state/loop-state.json
├── Validates ship_allowed === true
├── Checks head_commit matches current HEAD
└── BLOCKS if stale or not allowed
```

### Is /review automatically run before /ship?

**NO** - `/ship` only reads existing state. It blocks with "Re-run /review" if:

- No loop-state.json exists
- head_commit doesn't match current HEAD
- ship_allowed is false

### Should /review be automatic before /ship?

**Recommendation: OPTIONAL via flag**

```bash
/ship                  # Current: read state only, block if stale
/ship --with-review    # NEW: auto-run /review --free if state stale
/ship --force          # Existing: bypass gate (emergency)
```

Rationale:

- Don't force review (slow for quick fixes)
- Offer convenience for standard workflow
- `--with-review` runs `--free` by default (fast checks only)

### How does /ship know review passed?

**Via state file schema:**

```json
// .claude/state/loop-state.json
{
  "ship_allowed": true,
  "head_commit": "abc123",
  "blockers": [],
  "loops": {
    "loop1_tier1": { "status": "pass" },
    "loop1_tier2": { "status": "pass" },
    "loop2_claude": { "status": "pass", "findings": [] },
    "loop3_coderabbit": { "status": "skip" }
  }
}
```

**This is already well-designed.** The integration is solid.

---

## 3. Relationship to /reconcile

### Current Data Flow

From `reconcile-analysis.md`:

```text
/review (creates)  ──────────────────►  /reconcile (consumes)
    │                                        │
    ├── loop-state.json                      ├── Reads loop findings
    ├── claude-review-results.json           ├── Reads Claude findings
    └── (or PR comments via gh CLI)          └── Creates fix tasks
```

### Separation of Concerns

| Command      | Responsibility                                |
| ------------ | --------------------------------------------- |
| `/review`    | Find issues, categorize, report pass/fail     |
| `/reconcile` | Analyze findings, create actionable fix tasks |

**This is correctly separated.** No overlap detected.

### Does /review output feed into /reconcile?

**YES** - Via auto-detection:

```bash
/reconcile                   # Auto-detects source
/reconcile --source claude   # claude-review-results.json
/reconcile --source local    # loop-state.json
```

### Gap: Review severity inconsistency

| /review severity | /reconcile interpretation |
| ---------------- | ------------------------- |
| CRITICAL         | critical                  |
| MAJOR            | major                     |
| MINOR            | minor                     |

**These align.** No changes needed.

### Gap: Circular workflow clarity

```text
/implement → /review (issues found) → /reconcile → /implement (fix)
                                            ↓
                                    Creates: specs/reconcile-{timestamp}/tasks.md
```

The `/reconcile` output goes to a **different** directory than the original spec. This is intentional (avoid polluting original spec) but could use documentation.

---

## 4. Output Format Comparison

### How do other commands format output?

| Command    | Output Format   | State Files       | Structured JSON |
| ---------- | --------------- | ----------------- | --------------- |
| /start     | ASCII stages    | start-status.json | Partial         |
| /design    | Markdown specs  | None              | No              |
| /implement | Task checkboxes | None              | No              |
| /review    | ASCII tables    | **3 files**       | **Yes**         |
| /ship      | ASCII stages    | Reads only        | No              |
| /reconcile | Markdown tasks  | None              | No              |

**/review has the MOST MATURE state management** across all commands.

### Should /review produce structured output?

**Already does.** Three state files:

1. `loop-state.json` - Machine-readable loop results
2. `claude-review-results.json` - Structured findings
3. `rate-limit-state.json` - Rate tracking

### Proposed: Unified output flag

```bash
/review --json    # Output JSON to stdout instead of ASCII
/review --quiet   # Only output blockers, suppress minor findings
```

### Severity levels consistent with other commands?

From `cross-command-analysis.md`, /review uses:

- CRITICAL (blocks)
- MAJOR (warns)
- MINOR (FYI)

Other commands don't have formal severity levels. **/review should be the model** for other commands to adopt.

---

## 5. Incremental Execution

### Current State

| Flag        | Loops Executed |
| ----------- | -------------- |
| (none)      | All loops      |
| `--free`    | L1-T1 + L1-T2  |
| `--claude`  | L1 + L2        |
| `--skip-cr` | L1 + L2        |

### Missing Granularity

From `review-analysis.md`, these flags are missing:

| Missing Flag      | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `--lint-only`     | Run only lint check                      |
| `--types-only`    | Run only typecheck                       |
| `--security-only` | Run only L1-T2 secret scan + L2 security |
| `--test-only`     | Run only test execution                  |
| `--build-only`    | Run only build check                     |

### Proposed: Check-type flags

```bash
# Individual checks
/review --lint        # ESLint only
/review --types       # TypeScript only
/review --security    # Secrets + security patterns
/review --tests       # Test execution only
/review --build       # Build check only

# Combinations
/review --quick       # Alias for --lint --types (fastest)
/review --free        # Keep existing (L1 full)
/review --full        # All loops (default)
```

### Implementation approach

Add to `review-config.yaml`:

```yaml
check_aliases:
  quick: [lint, types]
  free: [lint, types, format, secrets, build, tests]
  full: [lint, types, format, secrets, build, tests, claude, coderabbit]
```

---

## Deliverables

### 1. Proposed File Changes

| File                                  | Change Type | Description                                 |
| ------------------------------------- | ----------- | ------------------------------------------- |
| `.claude/commands/review.md`          | MODIFY      | Add new flags documentation                 |
| `.claude/skills/code-review/SKILL.md` | MODIFY      | Add check-type flags, manifest support      |
| `.claude/agents/code-agent.md`        | MODIFY      | Write implement-manifest.json on completion |
| `.claude/agents/ui-agent.md`          | MODIFY      | Write implement-manifest.json on completion |
| `.claude/commands/ship.md`            | MODIFY      | Add `--with-review` flag                    |

### 2. Unified Patterns Adopted

| Pattern             | From Command           | Adopted By /review        |
| ------------------- | ---------------------- | ------------------------- |
| State file location | /review (already)      | `.claude/state/` standard |
| Severity levels     | /review (already)      | CRITICAL/MAJOR/MINOR      |
| Preview format      | cross-command template | Standardize ASCII box     |
| Progress indicators | cross-command template | `✓●○✗⊘` standard          |
| Checkpoint schema   | cross-command template | Add resume capability     |

### 3. /review-Specific Optimizations

#### 3.1 Add manifest consumption

```markdown
## Usage (updated)

/review # All uncommitted changes
/review --from-implement # Files from implement manifest only
/review --files "src/\*\*" # Specific files by glob
/review --staged-only # Only staged changes
```

#### 3.2 Add check-type flags

```markdown
## Check Selection

/review --quick # Lint + types only (fastest)
/review --security # Security checks only
/review --lint # ESLint only
/review --types # TypeScript only
/review --tests # Tests only
/review --build # Build only
```

#### 3.3 Add output modes

```markdown
## Output Modes

/review --json # Machine-readable JSON output
/review --quiet # Only blockers, suppress minor
/review --summary # One-line per finding
/review --verbose # Full details (default)
```

#### 3.4 Add /ship integration

```markdown
## /ship Integration

/review results are checked by /ship gate:

- ship_allowed must be true
- head_commit must match current HEAD

Optional: /ship --with-review auto-runs /review --free if stale
```

#### 3.5 Show rate limit in preview

```markdown
## Preview (updated)

┌─────────────────────────────────────────────────────────────────┐
│ /review │
├─────────────────────────────────────────────────────────────────┤
│ Scope: 5 files changed (3 backend, 2 frontend) │
│ CodeRabbit: 5/8 reviews used this hour │ ← NEW
│ │
│ STAGE 1: FAST CHECKS │
│ ... │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.6 Consolidate documentation

**Current:** Split between `review.md` and `code-review/SKILL.md`

**Proposed:**

- `review.md` - User-facing command documentation
- `code-review/SKILL.md` - Implementation details (4-loop architecture)
- Add cross-reference in `review.md`:

```markdown
## Implementation Details

See `.claude/skills/code-review/SKILL.md` for:

- 4-loop architecture
- Loop configuration
- State file schemas
```

---

## Summary

### Priority Changes

| Priority   | Change                                        | Impact                 | Effort |
| ---------- | --------------------------------------------- | ---------------------- | ------ |
| **HIGH**   | Add `--files <glob>` flag                     | Targeted reviews       | 4h     |
| **HIGH**   | Add `--from-implement` flag                   | /implement integration | 4h     |
| **HIGH**   | Add check-type flags (`--lint`, `--security`) | Granular control       | 4h     |
| **MEDIUM** | Show rate limit in preview                    | UX improvement         | 1h     |
| **MEDIUM** | Add `--json` output mode                      | Automation support     | 2h     |
| **MEDIUM** | Add `--summary` output mode                   | Reduce verbosity       | 2h     |
| **LOW**    | Add `/ship --with-review`                     | Convenience            | 2h     |
| **LOW**    | Consolidate docs with cross-refs              | Clarity                | 1h     |

### Integration Summary

| Integration          | Current State            | After Optimization                    |
| -------------------- | ------------------------ | ------------------------------------- |
| /review → /ship      | State files read by gate | Same + optional auto-review           |
| /review → /reconcile | Findings consumed        | Same (no changes needed)              |
| /implement → /review | No connection            | Manifest file enables targeted review |

### Key Insight

**/review is the most mature command** in terms of:

- State file management
- Incremental execution (loop-level flags)
- Structured output (JSON files)
- Integration with other commands

Other commands should adopt /review's patterns, while /review gains:

- File-level scoping (`--files`, `--from-implement`)
- Check-level granularity (`--lint`, `--security`)
- Output modes (`--json`, `--summary`)
