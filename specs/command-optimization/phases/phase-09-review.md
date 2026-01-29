# Phase 9: /review Command

## Source Files

- `specs/command-optimization/review-optimization.md` (full file)

## Deliverables

| File                         | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `.claude/commands/review.md` | Add --files=path1,path2 flag                   |
| `.claude/commands/review.md` | Add --from-implement flag                      |
| `.claude/commands/review.md` | Ensure ship_allowed integrates with /ship gate |

## Design Command

```
/design review-improvements
```

## After Design

```
/implement
/review
/ship
```
