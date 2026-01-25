---
name: implement
description: Full implementation workflow combining backend and UI
---

# Implement Workflow

Complete feature implementation combining code-agent and ui-agent.

## Steps

```
code-agent (RESEARCH → IMPLEMENT → VALIDATE)
    ↓
ui-agent (RESEARCH → BUILD → VALIDATE)
```

## Used By

- `/build` command

## Execution

### Step 1: Backend Implementation

Delegate to `code-agent`:

1. **RESEARCH** - Find existing code, check conflicts
2. **IMPLEMENT** - TDD implementation of backend
3. **VALIDATE** - Types, tests, lint checks

**Gate:** code-agent must return PASS before proceeding.

### Step 2: UI Implementation

Delegate to `ui-agent`:

1. **RESEARCH** - Find existing components, check shadcn
2. **BUILD** - Component implementation with tests
3. **VALIDATE** - Types, tests, accessibility

**Gate:** ui-agent must return PASS to complete.

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

**Ready for:** `/check` → `/pr create`
```

## Error Handling

| Error           | Handling                                    |
| --------------- | ------------------------------------------- |
| code-agent FAIL | Stop, report issues, suggest `/code` to fix |
| ui-agent FAIL   | Stop, report issues, suggest `/ui` to fix   |
| Missing spec    | Stop, suggest `/plan` first                 |

## Notes

- Both agents share the same spec
- Implementation logs are created for each task
- Runs sequentially (backend before UI)
- Can run individual agents via `/code` or `/ui` if only one is needed
