# Command Optimization Phases

## Usage

From any worktree, reference the phase file:

```
Read specs/command-optimization/phases/phase-01-foundation.md and execute
```

## Execution Order

| Phase | File                      | /start                   | Worktree                                |
| ----- | ------------------------- | ------------------------ | --------------------------------------- |
| 1     | `phase-01-foundation.md`  | `foundation`             | `react-basecamp-foundation`             |
| 2     | `phase-02-templates.md`   | `templates`              | `react-basecamp-templates`              |
| 3     | `phase-03-implement.md`   | `implement-optimization` | `react-basecamp-implement-optimization` |
| 4     | `phase-04-design.md`      | `design-optimization`    | `react-basecamp-design-optimization`    |
| 5     | `phase-05-ship.md`        | `ship-optimization`      | `react-basecamp-ship-optimization`      |
| 6     | `phase-06-start.md`       | `start-optimization`     | `react-basecamp-start-optimization`     |
| 7     | `phase-07-research.md`    | `research-optimization`  | `react-basecamp-research-optimization`  |
| 8     | `phase-08-reconcile.md`   | `reconcile-optimization` | `react-basecamp-reconcile-optimization` |
| 9     | `phase-09-review.md`      | `review-optimization`    | `react-basecamp-review-optimization`    |
| 10    | `phase-10-shared.md`      | `shared-refactoring`     | `react-basecamp-shared-refactoring`     |
| 11    | `phase-11-integration.md` | -                        | main                                    |

## Critical Path

Do these first (in order):

1. Phase 1: Foundation
2. Phase 2: Templates
3. Phase 3: /implement

Then parallelize phases 4-10.

Phase 11 is last.

## Workflow Per Phase

```bash
# 1. From main, create worktree
/start {name}
cd ../react-basecamp-{name}

# 2. Run design with phase file
Read specs/command-optimization/phases/phase-{N}-{name}.md and execute

# 3. Implement, review, ship
/implement
/review
/ship

# 4. Cleanup (from main)
cd ~/basecamp/react-basecamp
git worktree remove ../react-basecamp-{name} --force
```
