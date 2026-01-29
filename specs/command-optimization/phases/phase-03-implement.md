# Phase 3: /implement Command

## Source Files

- `specs/command-optimization/implement-optimization.md` (full file)
- `specs/command-optimization/synthesis.md` section 2.4 (Task Parser Interface)

## Deliverables

| File                                  | Description                                |
| ------------------------------------- | ------------------------------------------ |
| `.claude/scripts/lib/task-parser.cjs` | Parse tasks.md per synthesis section 2.4   |
| `.claude/commands/implement.md`       | Add --task=T001 flag support               |
| `.claude/commands/implement.md`       | Add --phase=N flag support                 |
| `.claude/commands/implement.md`       | Integrate checkpoint-manager with --resume |
| `.claude/commands/implement.md`       | Use unified preview template               |

## Design Command

```
/design implement-incremental-execution
```

## After Design

```
/implement
/review
/ship
```
