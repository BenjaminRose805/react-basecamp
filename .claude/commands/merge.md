# /merge - Merge Pull Request

Merge the current branch's PR after verifying CI passes, then sync local main.

## Usage

```
/merge                     # Squash merge (default)
/merge --merge             # Standard merge commit
/merge --rebase            # Rebase merge
```

## Instructions

When this command is invoked:

### Step 1: Verify Branch State

```bash
git branch --show-current
git status --porcelain
```

Check:

- **Not on main/master** - Cannot merge from main branch
- **No uncommitted changes** - Warn if working directory is dirty

If on main branch, **STOP** with message:

```
Cannot merge: You are already on the main branch.
Switch to a feature branch first.
```

### Step 2: Find Associated PR

```bash
gh pr view --json number,state,title,headRefName,statusCheckRollup
```

If no PR found, **STOP** with message:

```
No pull request found for branch: [branch-name]
Create a PR first with /pr
```

### Step 3: Check CI Pipeline Status (with polling)

Parse the `statusCheckRollup` from Step 2.

Evaluate each check:

- `SUCCESS` or `NEUTRAL` = passing
- `PENDING` or `QUEUED` = still running
- `FAILURE` or `ERROR` = failed

**If checks are still running:**

Poll every 60 seconds until either:

1. All checks pass → Continue to Step 4
2. Any check fails → Stop with failure message
3. 5 minutes elapsed → Stop with timeout message

```bash
# Poll loop (up to 5 iterations, 60s apart)
for i in {1..5}; do
  gh pr view --json statusCheckRollup
  # Check status...
  sleep 60
done
```

**After 5 minutes of polling with checks still pending:**

```
CI pipeline is still running after 5 minutes.

Pending checks:
- [check-name]: PENDING
...

The pipeline may be queued or running long tests.
Run /merge again later to resume checking.
```

**STOP** execution.

**If any checks failed:**

```
CI pipeline failed. Cannot merge.

Failed checks:
- [check-name]: FAILURE

View details: gh pr checks

Fix the issues and push again, then retry /merge.
```

**STOP** execution.

**If all checks passed:** Continue to Step 4.

### Step 4: Merge the PR

Default to squash merge (cleaner history):

```bash
gh pr merge --squash --delete-branch
```

For other merge strategies:

```bash
# Standard merge commit
gh pr merge --merge --delete-branch

# Rebase merge
gh pr merge --rebase --delete-branch
```

The `--delete-branch` flag removes the remote branch after merge.

### Step 5: Sync Local Repository

```bash
# Switch to main branch
git checkout main

# Pull the merged changes
git pull

# Clean up local branch (if it still exists)
git branch -d [branch-name] 2>/dev/null || true
```

### Step 6: Report Success

```
PR #[number] merged successfully!

Title: [pr-title]
Merge type: squash
Branch deleted: [branch-name]

Local repository synced to main.

Current status:
[git log -1 --oneline]
```

## Error Handling

### PR Not Mergeable

If PR has merge conflicts:

```
PR cannot be merged due to conflicts.

Resolve conflicts:
1. git checkout [branch-name]
2. git merge main
3. Resolve conflicts
4. git push
5. Run /merge again
```

### Permission Denied

If user lacks merge permissions:

```
You don't have permission to merge this PR.
Request a maintainer to merge, or check repository settings.
```

### Network/API Errors

```
Failed to merge PR. GitHub API error:
[error-message]

Try again or merge manually:
gh pr merge --squash --delete-branch
```

## MCP Servers

```text
github         # PR status and merge operations
```

**github tools used:**

- `get_pull_request` - Get PR details and status
- `merge_pull_request` - Merge the PR
- `get_pull_request_status` - Check CI status

## Workflow Integration

```
/code [feature]     # Implement feature
    ↓
/verify             # Run local verification
    ↓
/commit             # Commit changes
    ↓
/pr                 # Create pull request
    ↓
[Wait for CI]
    ↓
/merge              # Merge and sync (this command)
    ↓
/branch start       # Start next feature
```

## Options

| Flag       | Description                           |
| ---------- | ------------------------------------- |
| `--squash` | Squash all commits into one (default) |
| `--merge`  | Create a merge commit                 |
| `--rebase` | Rebase commits onto base              |

## Checklist

Before merging:

- [ ] CI pipeline passes
- [ ] PR has been reviewed (if required)
- [ ] No merge conflicts
- [ ] Ready to merge (not draft)

After merging:

- [ ] Local main is updated
- [ ] Feature branch is deleted
- [ ] Ready for next feature
