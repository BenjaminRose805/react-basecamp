# /build - Full Implementation

Implement both backend and UI for a feature.

## Usage

```
/build [feature]
```

## Examples

```bash
/build prompt-manager     # Implement backend + UI
/build user-settings      # Full implementation
```

## Workflow

Routes to: `implement` workflow

```
code-agent (RESEARCH → IMPLEMENT → VALIDATE)
    ↓
ui-agent (RESEARCH → BUILD → VALIDATE)
```

## What Happens

1. **Backend** (code-agent)
   - Research existing code
   - TDD implementation
   - Quality validation

2. **Frontend** (ui-agent)
   - Research existing components
   - Build UI with tests
   - Accessibility validation

## Prerequisites

- Spec must exist at `.spec-workflow/specs/{feature}/`
- Run `/plan {feature}` first if no spec exists

## Output

```
Backend: PASS (X tasks, Y tests)
Frontend: PASS (X tasks, Y tests)
Coverage: 85%
```

## After /build

1. Run `/check` for full quality verification
2. Run `/ship` to create PR

## Individual Agents

Use separate commands if you only need one:

- `/code {feature}` - Backend only
- `/ui {feature}` - UI only

$ARGUMENTS
