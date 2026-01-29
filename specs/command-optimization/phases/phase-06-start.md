# Phase 6: /start Command

## Source Files

- `specs/command-optimization/start-optimization.md` (full file)

## Deliverables

| File                                         | Description                              |
| -------------------------------------------- | ---------------------------------------- |
| `.claude/commands/start.md`                  | Move start-status.json to .claude/state/ |
| `.claude/commands/start.md`                  | Add --dry-run flag                       |
| `.claude/scripts/validate-start-prereqs.cjs` | Pre-validate prerequisites for --dry-run |
| `.claude/commands/start.md`                  | Use unified preview template             |

## Design Command

```
/design start-improvements
```

## After Design

```
/implement
/review
/ship
```
