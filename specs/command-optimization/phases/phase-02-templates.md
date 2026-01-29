# Phase 2: Templates

## Source Files

Read these sections from `specs/command-optimization/synthesis.md`:

- Section 1.1: Preview Template
- Section 1.2: Progress Template
- Section 1.3: Error Template
- Section 1.6: Spec Output Templates

## Deliverables

| File                                                  | Description                             |
| ----------------------------------------------------- | --------------------------------------- |
| `.claude/skills/preview/templates/command-preview.md` | Unified preview format per section 1.1  |
| `.claude/skills/progress/templates/stage-progress.md` | Unified progress format per section 1.2 |
| `.claude/skills/preview/templates/error-report.md`    | Unified error format per section 1.3    |
| `specs/templates/requirements.md`                     | Trimmed to 55 lines                     |
| `specs/templates/design.md`                           | Trimmed to 70 lines                     |
| `specs/templates/tasks.md`                            | Trimmed to 45 lines                     |
| `specs/templates/summary.md`                          | New, 25 lines for quick human review    |
| `specs/templates/meta.yaml`                           | New, 10 lines shared metadata           |
| `specs/templates/spec.json`                           | New, 30 lines machine-readable schema   |

## Design Command

```
/design unified-templates
```

## After Design

```
/implement
/review
/ship
```
