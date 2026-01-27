---
name: refactor
description: Safe code restructuring with baseline verification
---

# Refactor Workflow

Safely restructure code while preserving behavior through baseline testing.

## Trigger

- `/refactor [scope]` command

## Stages

```text
BASELINE (check-agent - capture passing tests)
    ↓
ANALYZE (refactor-analyzer sub-agent, Opus)
    ↓
REFACTOR (code-agent OR ui-agent)
    ↓
VERIFY (check-agent - same tests pass)
```

## Stage 1: BASELINE

**Agent:** check-agent (parallel sub-agents)

### Purpose

Establish a passing baseline BEFORE making any changes. This ensures:

- All existing tests pass
- Coverage is captured
- Types are valid

### Sub-agents (Haiku, parallel)

| Sub-agent    | Check                                      |
| ------------ | ------------------------------------------ |
| type-checker | TypeScript compilation - must pass         |
| test-runner  | Run tests, capture passing list + coverage |

### Output

```json
{
  "baseline_state": {
    "tests_passing": 47,
    "test_names": ["auth.test.ts", "user.test.ts", ...],
    "coverage": 82,
    "types_valid": true
  }
}
```

**Gate:** ALL tests must pass. If tests fail, stop and suggest `/fix` first.

---

## Stage 2: ANALYZE

**Sub-agent:** `refactor-analyzer` (Opus)
**Profile:** research (read-only)

### Tasks

1. Analyze scope for refactoring opportunities
2. Identify safe transformations
3. Plan refactoring steps (ordered by risk)
4. Identify potential risks

### Output

```json
{
  "transformations": [
    {
      "type": "extract_function",
      "from": "src/lib/auth.ts:45-78",
      "to": "src/lib/session.ts",
      "risk": "low"
    },
    {
      "type": "rename_symbol",
      "symbol": "handleAuth",
      "new_name": "authenticateUser",
      "affected_files": 5,
      "risk": "medium"
    }
  ],
  "risks": [
    "rename affects 5 files across codebase",
    "extracted function has side effects to consider"
  ],
  "context_summary": "max 500 tokens for refactor stage"
}
```

**Gate:** At least one transformation identified. If none, report "no refactoring needed".

---

## Stage 3: REFACTOR

Route based on scope:

### Backend Scope → code-agent

For files in:

- `src/server/`
- `src/lib/` (non-UI utilities)
- `prisma/`
- API routes

### Frontend Scope → ui-agent

For files in:

- `src/components/`
- `src/app/` (pages)
- `src/hooks/`

### Mixed Scope → Sequential

```text
code-agent (backend files) → ui-agent (frontend files)
```

### Constraint

**DO NOT change behavior, only structure.**

- Extract functions/components
- Rename for clarity
- Reorganize file structure
- Remove duplication
- Improve typing

**DO NOT:**

- Add new features
- Fix bugs (use `/fix` instead)
- Change API contracts
- Modify test expectations

---

## Stage 4: VERIFY

**Agent:** check-agent (parallel sub-agents)

### Verification Criteria

| Check    | Requirement                   |
| -------- | ----------------------------- |
| Tests    | ALL baseline tests still pass |
| Coverage | >= baseline coverage          |
| Types    | No new type errors            |
| Lint     | No new lint errors            |

### Output

```markdown
## Verification: PASS

| Check    | Baseline | After    | Status |
| -------- | -------- | -------- | ------ |
| Tests    | 47/47    | 47/47    | PASS   |
| Coverage | 82%      | 84%      | PASS   |
| Types    | 0 errors | 0 errors | PASS   |
| Lint     | 0 errors | 0 errors | PASS   |
```

### Failure Handling

- **PASS** → Report success, show before/after summary
- **FAIL** → Rollback changes, report which tests/types broke

---

## Input

```
scope: string  # Files, directories, or feature to refactor
```

## Output

```markdown
## Refactor Complete

### Scope

- `src/lib/auth.ts` → `src/lib/auth/` (module extraction)

### Transformations Applied

1. ✓ Extract `validateSession` to `src/lib/auth/session.ts`
2. ✓ Extract `refreshToken` to `src/lib/auth/token.ts`
3. ✓ Rename `handleAuth` → `authenticateUser` (5 files)
4. ✓ Add barrel export `src/lib/auth/index.ts`

### Quality Preserved

| Metric   | Before | After | Delta |
| -------- | ------ | ----- | ----- |
| Tests    | 47     | 47    | 0     |
| Coverage | 82%    | 84%   | +2%   |
| Types    | ✓      | ✓     | -     |

**Ready for:** `/check` → `/ship`
```

## Error Handling

| Error               | Handling                                    |
| ------------------- | ------------------------------------------- |
| Baseline tests fail | Stop, suggest `/fix` first                  |
| No transformations  | Report "no refactoring opportunities found" |
| Verify fails        | Rollback all changes, report broken tests   |
| Risk too high       | Ask user for confirmation                   |

## Context Flow

```text
┌────────────────┐     baseline_state     ┌────────────────┐
│  check-agent   │ ─────────────────────► │  refactor-     │
│  (baseline)    │       ~200 tokens      │  analyzer      │
└────────────────┘                        └────────────────┘
                                                  │
                                           context_summary
                                                  │
                                                  ▼
                                          ┌────────────────┐
                                          │   code/ui      │
                                          │   agent        │
                                          └────────────────┘
                                                  │
                                           files_changed
                                                  │
                                                  ▼
                                          ┌────────────────┐
                                          │  check-agent   │
                                          │  (verify)      │
                                          └────────────────┘
```

## Notes

- Baseline capture is mandatory - ensures safety
- Refactor-analyzer uses read-only profile
- All changes must be behavior-preserving
- Verification compares against captured baseline
- Automatic rollback on failure (git checkout)
