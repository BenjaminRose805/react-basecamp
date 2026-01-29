# Phase 5: /ship Command

## Source Files

- `specs/command-optimization/ship-optimization.md` (full file)

## Deliverables

| File                       | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| `.claude/commands/ship.md` | Add content preview phase (commit message, PR title/body) |
| `.claude/commands/ship.md` | Add --commit-only flag (commit without PR)                |
| `.claude/commands/ship.md` | Add --pr-only flag (PR without merge)                     |
| `.claude/commands/ship.md` | Add --push-only flag (push without PR)                    |
| `.claude/commands/ship.md` | Integrate checkpoint-manager tracking states              |
| `.claude/commands/ship.md` | Add confirmation prompts before irreversible actions      |

## Design Command

```
/design ship-incremental-execution
```

## After Design

```
/implement
/review
/ship
```
