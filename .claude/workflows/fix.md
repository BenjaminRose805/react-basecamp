---
name: fix
description: Bug investigation and fix workflow with dynamic agent routing
---

# Fix Workflow

Investigates bugs, identifies root cause, routes to appropriate agent for fix, and verifies.

## Trigger

- `/fix [issue]` command

## Stages

```text
INVESTIGATE (investigator sub-agent, Opus)
    ↓
    ├── backend → code-agent
    ├── frontend → ui-agent
    └── unclear → Ask user
    ↓
VERIFY (check-agent, parallel Haiku)
```

## Stage 1: INVESTIGATE

**Sub-agent:** `investigator` (Opus)
**Profile:** research (read-only + search)

### Tasks

1. Search codebase for issue-related terms
2. Check `git log` for recent changes to affected areas
3. Identify affected files
4. Diagnose root cause
5. Classify: backend OR frontend OR unclear

### Output

```json
{
  "classification": "backend | frontend | unclear",
  "affected_files": ["src/lib/auth.ts", "src/server/routers/user.ts"],
  "root_cause": "Session timeout not being refreshed on API calls",
  "context_summary": "max 500 tokens for next stage"
}
```

**Gate:** Classification must be "backend" or "frontend" to proceed. If "unclear", ask user.

---

## Stage 2: FIX

Route based on Stage 1 classification:

### Backend Classification → code-agent

```text
code-agent
├── code-researcher (Opus) - gather additional context
├── code-writer (Sonnet) - implement fix with TDD
└── code-validator (Haiku) - verify fix
```

### Frontend Classification → ui-agent

```text
ui-agent
├── ui-researcher (Opus) - gather additional context
├── ui-builder (Sonnet) - implement fix with tests
└── ui-validator (Haiku) - verify fix
```

### Unclear Classification → Ask User

```text
Cannot determine if issue is backend or frontend.

Affected files:
- src/lib/utils.ts
- src/components/Header.tsx

Which should I focus on?
1. Backend (code-agent)
2. Frontend (ui-agent)
3. Both (implement workflow)
```

**Gate:** Agent must return PASS before proceeding to verify.

---

## Stage 3: VERIFY

**Agent:** check-agent (parallel sub-agents)

### Sub-agents (all Haiku, parallel)

| Sub-agent        | Check                        |
| ---------------- | ---------------------------- |
| type-checker     | TypeScript compilation       |
| lint-checker     | ESLint rules                 |
| test-runner      | All tests pass + coverage    |
| security-scanner | Only if security-related fix |

### Output

```markdown
## Verification: PASS

| Check    | Status | Details        |
| -------- | ------ | -------------- |
| Types    | PASS   | 0 errors       |
| Lint     | PASS   | 0 errors       |
| Tests    | PASS   | 47/47, 82% cov |
| Security | PASS   | No new vulns   |
```

### Retry Logic

- **PASS** → Report success, suggest `/ship`
- **FAIL** → Retry Stage 2 (max 2 retries)
- **FAIL after retries** → Report issues, escalate to user

---

## Input

```
issue: string  # Description of bug or issue
```

## Output

```markdown
## Fix Complete

### Investigation

- **Root Cause:** Session timeout not refreshed
- **Classification:** Backend
- **Affected Files:** src/lib/auth.ts

### Fix Applied

- [x] Updated session refresh logic
- [x] Added unit test for timeout scenario
- [x] Verified with integration test

### Quality

| Check | Status |
| ----- | ------ |
| Types | PASS   |
| Tests | PASS   |
| Lint  | PASS   |

**Ready for:** `/check` → `/ship`
```

## Error Handling

| Error                  | Handling                              |
| ---------------------- | ------------------------------------- |
| Investigation fails    | Report findings, ask for more context |
| Classification unclear | Ask user to choose backend/frontend   |
| Fix agent fails        | Retry with additional context         |
| Verify fails 3x        | Stop, report detailed issues          |

## Context Flow

```text
┌────────────────┐     context_summary    ┌────────────────┐
│  Investigator  │ ─────────────────────► │   Fix Agent    │
│  (Opus)        │       ~500 tokens      │  (code/ui)     │
└────────────────┘                        └────────────────┘
                                                  │
                                           files_changed
                                                  │
                                                  ▼
                                          ┌────────────────┐
                                          │  check-agent   │
                                          │  (parallel)    │
                                          └────────────────┘
```

## Notes

- Investigator uses read-only profile - no file modifications
- Fix stage follows standard agent phases (research → implement → validate)
- Verify stage reuses check-agent's parallel execution
- Each stage operates in isolated context
