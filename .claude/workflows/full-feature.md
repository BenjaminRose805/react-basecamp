---
name: full-feature
description: Complete feature development from planning to PR
---

# Full Feature Workflow

Complete end-to-end feature development.

## Steps

```
plan-agent (ANALYZE → CREATE → VALIDATE)
    ↓
implement workflow (code-agent → ui-agent)
    ↓
ship workflow (check-agent → git-agent → pr-agent)
```

## Used By

Reserved for future orchestration.

## Execution

### Phase 1: Planning

Delegate to `plan-agent`:

1. Analyze requirements
2. Research existing code
3. Create spec with tasks
4. Get user approval

**Gate:** Spec must be approved in dashboard.

### Phase 2: Implementation

Run `implement` workflow:

1. Backend implementation (code-agent)
2. UI implementation (ui-agent)

**Gate:** Both agents must return PASS.

### Phase 3: Shipping

Run `ship` workflow:

1. Quality verification (check-agent)
2. Git operations (git-agent)
3. PR creation (pr-agent)

## Input

```
feature: string      # Feature name or description
design_doc?: string  # Path to design doc for distill
```

## Output

```markdown
## Feature Complete: prompt-manager

### Planning

- Spec: `.spec-workflow/specs/prompt-manager/`
- Tasks: 8 created
- Linear: LIN-123

### Implementation

| Phase   | Status | Details           |
| ------- | ------ | ----------------- |
| Backend | PASS   | 5 tasks, 15 tests |
| UI      | PASS   | 3 tasks, 8 tests  |

### Quality

| Check    | Status              |
| -------- | ------------------- |
| Types    | PASS                |
| Tests    | PASS (90% coverage) |
| Lint     | PASS                |
| Security | PASS                |

### Pull Request

**URL:** https://github.com/owner/repo/pull/123
**Status:** Open, CI running

### Timeline

- Planning: 10 min
- Backend: 25 min
- UI: 15 min
- Shipping: 5 min
- Total: 55 min
```

## Error Handling

| Error                | Handling                       |
| -------------------- | ------------------------------ |
| Spec not approved    | Wait for approval, remind user |
| Implementation fails | Stop, report issues            |
| Quality fails        | Stop at ship phase             |

## Notes

- This is the "happy path" automation
- Each phase can be run individually
- User approval required at planning phase
- Designed for straightforward features
- Complex features should use individual commands
