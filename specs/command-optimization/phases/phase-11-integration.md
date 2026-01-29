# Phase 11: Final Integration

## No Worktree Needed

Run from main repo.

## Task 1: Update CLAUDE.md

Document new command flags:

- `/implement`: --task=T001, --phase=N, --resume
- `/design`: --phase=research|write|validate, --resume
- `/ship`: --commit-only, --pr-only, --push-only, --resume
- `/start`: --dry-run
- `/research`: --scope=path
- `/review`: --files=path1,path2, --from-implement
- `/reconcile`: --analyze-only

## Task 2: E2E Test

```
/start e2e-test
```

Then test full workflow:

```
/design → /implement --task=T001 → /review → /ship --commit-only
```

## Cleanup

Remove all worktrees and branches:

```bash
git worktree list
# Remove each with: git worktree remove ../react-basecamp-{name} --force
# Delete branches with: git branch -D feature/{name}
```
