# /branch - Git Branch Management

Manage git branches for feature development. Always use this before starting new work.

## Usage

```
/branch                        # Show current branch and status
/branch start <feature>        # Create and switch to feature branch
/branch switch <branch>        # Switch to existing branch
/branch sync                   # Sync current branch with main
/branch list                   # List all branches with status
/branch cleanup                # Delete merged branches
```

## Instructions

### /branch (no args) - Show Status

```bash
echo "=== Branch Status ==="
git branch --show-current
git status --short
git log --oneline -3

echo ""
echo "=== Remote Status ==="
git fetch origin --quiet
git rev-list --left-right --count origin/main...HEAD 2>/dev/null || echo "Not tracking remote"
```

Output:

```
BRANCH STATUS
=============
Current:     feat/prompt-manager
Status:      Clean (no uncommitted changes)
Last Commit: abc1234 feat: add prompt validation

Remote:      2 commits ahead, 0 behind main
```

### /branch start <feature> - Start New Feature

**CRITICAL: This is the first step before any new work.**

```bash
# Ensure clean state
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Uncommitted changes. Commit or stash first."
    exit 1
fi

# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/<feature-name>

echo "Created branch: feature/<feature-name>"
echo "You're ready to start work. Suggested:"
echo "  /distill <feature>  - If design docs exist"
echo "  /spec <feature>     - To write spec from scratch"
```

Branch naming conventions:

| Prefix      | Use For           | Example                  |
| ----------- | ----------------- | ------------------------ |
| `feature/`  | New features      | `feature/prompt-manager` |
| `fix/`      | Bug fixes         | `fix/auth-timeout`       |
| `refactor/` | Code improvements | `refactor/api-cleanup`   |
| `docs/`     | Documentation     | `docs/api-reference`     |
| `test/`     | Test additions    | `test/e2e-coverage`      |
| `chore/`    | Maintenance       | `chore/deps-update`      |

### /branch switch <branch> - Switch Branch

```bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "WARNING: Uncommitted changes detected"
    echo "Options:"
    echo "  1. /commit first"
    echo "  2. git stash"
    echo "  3. Continue anyway (changes will carry over)"
    # Ask user how to proceed
fi

git checkout <branch>
git status --short
```

### /branch sync - Sync with Main

```bash
git fetch origin main
git rebase origin/main

# If conflicts:
echo "Resolve conflicts in these files:"
git diff --name-only --diff-filter=U
```

### /branch list - List All Branches

```bash
echo "=== Local Branches ==="
git branch -vv

echo ""
echo "=== Remote Branches ==="
git branch -r --list 'origin/*' | head -10

echo ""
echo "=== Merged into main (safe to delete) ==="
git branch --merged main | grep -v main
```

### /branch cleanup - Delete Merged Branches

```bash
# Show what will be deleted
echo "These branches are merged and will be deleted:"
git branch --merged main | grep -v main

# Confirm before delete
# Then:
git branch --merged main | grep -v main | xargs git branch -d

# Clean remote tracking
git remote prune origin
```

## Safety Rules

- NEVER delete `main` or `master`
- NEVER force delete (`-D`) without explicit confirmation
- ALWAYS check for uncommitted changes before switching
- ALWAYS sync with main before creating PR
- PREFER rebase over merge for cleaner history

## Integration with Workflow

```
/branch start prompt-manager    # Step 0: Create branch
    ↓
/distill prompt-manager         # Step 1: Create spec
    ↓
/test prompt-manager            # Step 2: Write tests
    ↓
/code prompt-manager            # Step 3: Implement
    ↓
/branch sync                    # Step 4: Sync before PR
    ↓
/verify                         # Step 5: Verify
    ↓
/pr                             # Step 6: Create PR
```

## Common Scenarios

### Starting fresh work

```
/branch start user-auth
/spec user-auth
```

### Switching between features

```
/commit                         # Commit current work
/branch switch feature/other    # Switch to other feature
/status                         # See where you left off
```

### Updating feature with latest main

```
/branch sync                    # Rebase on main
# Resolve any conflicts
/verify                         # Re-verify after rebase
```

## Error Recovery

### Accidentally committed to main

```bash
git checkout main
git reset --soft HEAD~1        # Undo commit, keep changes
git checkout -b feature/oops   # Create proper branch
git commit -m "..."            # Recommit on feature branch
```

### Wrong branch name

```bash
git branch -m old-name new-name
git push origin :old-name
git push -u origin new-name
```
