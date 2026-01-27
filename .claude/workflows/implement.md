---
name: implement
description: Full implementation workflow combining backend and UI
---

# Implement Workflow

Complete feature implementation combining code-agent and ui-agent with Opus orchestrators.

## Trigger

- `/implement [feature]` (when full-stack detected)

## Stages

```text
code-agent orchestrator (Opus)
├── code-researcher (Opus) - find patterns
├── code-writer (Sonnet) - implement TDD
└── code-validator (Haiku) - verify
    ↓
(context compaction)
    ↓
ui-agent orchestrator (Opus)
├── ui-researcher (Opus) - find components
├── ui-builder (Sonnet) - build UI
└── ui-validator (Haiku) - verify
```

## Stage 1: Backend Implementation

**Orchestrator:** code-agent (Opus)

Invoke code-agent orchestrator:

1. **RESEARCH** - code-researcher finds existing patterns, API contracts
2. **IMPLEMENT** - code-writer implements with TDD
3. **VALIDATE** - code-validator runs types, tests, lint

**Output:**

```json
{
  "files_changed": ["src/server/routers/...", "src/lib/..."],
  "api_contracts": ["createUser", "getUser"],
  "context_summary": "max 500 tokens for ui-agent"
}
```

**Gate:** code-agent must return PASS before proceeding.

---

## Context Compaction (Stage 1 → Stage 2)

**KEEP:**

- `files_changed` - List of backend files created
- `api_contracts` - API endpoints for frontend to consume
- `context_summary` - Max 500 token summary

**DISCARD:**

- Full file contents
- Test details
- Research findings
- Intermediate errors

---

## Stage 2: UI Implementation

**Orchestrator:** ui-agent (Opus)

Invoke ui-agent orchestrator with backend context:

1. **RESEARCH** - ui-researcher finds existing components, shadcn primitives
2. **BUILD** - ui-builder creates components, connects to API
3. **VALIDATE** - ui-validator runs types, tests, accessibility

**Input from Stage 1:**

```json
{
  "backend_context": "context_summary from code-agent",
  "api_contracts": ["endpoints to consume"]
}
```

**Output:**

```json
{
  "files_changed": ["src/components/...", "src/app/..."],
  "context_summary": "max 500 tokens"
}
```

**Gate:** ui-agent must return PASS to complete.

---

## Stage 3: Report

Aggregate results from both stages:

```json
{
  "all_files_changed": ["backend files", "frontend files"],
  "total_tests": 23,
  "coverage": 85
}
```

## Input

```
feature: string  # Feature name from spec
```

## Output

```markdown
## Implementation Complete

### Backend

- [x] Prisma model created
- [x] tRPC router implemented
- [x] Integration tests passing

### Frontend

- [x] Components built
- [x] Component tests passing
- [x] Accessibility verified

### Quality

| Check | Status              |
| ----- | ------------------- |
| Types | PASS                |
| Tests | PASS (92% coverage) |
| Lint  | PASS                |

**Ready for:** `/check` → `/ship`
```

## Context Flow

```text
┌────────────────┐                      ┌────────────────┐
│  code-agent    │ ──────────────────── │   ui-agent     │
│  (Opus orch)   │   files_changed,     │  (Opus orch)   │
│                │   api_contracts,     │                │
│  Backend impl  │   context_summary    │  Frontend impl │
└────────────────┘                      └────────────────┘
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │    Report      │
                                        │  all_files     │
                                        └────────────────┘
```

## Error Handling

| Error           | Handling                                         |
| --------------- | ------------------------------------------------ |
| code-agent FAIL | Stop, report issues, fix and re-run `/implement` |
| ui-agent FAIL   | Stop, report issues, fix and re-run `/implement` |
| Missing spec    | Stop, suggest `/plan` first                      |

## Performance Target

| Metric  | Current | Optimized | Improvement |
| ------- | ------- | --------- | ----------- |
| Time    | ~20 min | ~15 min   | 25% faster  |
| Context | 80k tok | 50k tok   | 37% less    |

## Notes

- Both agents use Opus orchestrators for coordination
- Context compaction between stages prevents overflow
- Implementation logs created for each task
- Runs sequentially (backend before UI)
- Routes to appropriate agents based on spec content
