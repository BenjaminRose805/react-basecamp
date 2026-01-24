# /worktree - Parallel Development with Git Worktrees

Manage git worktrees for working on multiple features simultaneously without stashing or switching branches.

## Why Worktrees?

Git worktrees allow you to have multiple branches checked out at the same time in different directories. This enables:

- **Parallel development**: Work on feature A while feature B's tests run
- **Quick context switches**: No stashing, no losing state
- **Code comparison**: Have two versions side-by-side
- **Review while coding**: Review a PR in one worktree while implementing in another

## Usage

```
/worktree                       # List all worktrees
/worktree add <feature>         # Create new worktree for feature
/worktree remove <feature>      # Remove worktree (keeps branch)
/worktree status                # Show status of all worktrees
/worktree switch <feature>      # Tell Claude to work in different worktree
```

## Directory Structure

Worktrees are created as siblings to the main repo:

```
~/basecamp/
├── react-basecamp/              # Main worktree (main branch)
├── react-basecamp--prompt-mgr/  # Worktree for prompt-manager
├── react-basecamp--workflow/    # Worktree for workflow feature
└── docs/                        # Design docs (shared)
```

## Instructions

### /worktree (no args) - List Worktrees

```bash
echo "=== Active Worktrees ==="
git worktree list

echo ""
echo "=== Current Worktree ==="
pwd
git branch --show-current
```

Output:

```
WORKTREES
=========
Main:     /home/user/basecamp/react-basecamp (main)
Active:
  - react-basecamp--prompt-mgr  → feature/prompt-manager
  - react-basecamp--workflow    → feature/workflow-engine

Current:  react-basecamp (main)
```

### /worktree add <feature> - Create Worktree

```bash
FEATURE="$1"
WORKTREE_DIR="../react-basecamp--${FEATURE}"

# Ensure we're in the main repo
if [ ! -d ".git" ]; then
    echo "ERROR: Run this from the main repository"
    exit 1
fi

# Create branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/feature/${FEATURE}; then
    git branch feature/${FEATURE} main
fi

# Create worktree
git worktree add "${WORKTREE_DIR}" feature/${FEATURE}

echo "Created worktree at: ${WORKTREE_DIR}"
echo ""
echo "To work in this worktree:"
echo "  cd ${WORKTREE_DIR}"
echo "  # Or tell Claude: /worktree switch ${FEATURE}"
echo ""
echo "Installing dependencies..."
cd "${WORKTREE_DIR}" && pnpm install
```

### /worktree remove <feature> - Remove Worktree

```bash
FEATURE="$1"
WORKTREE_DIR="../react-basecamp--${FEATURE}"

# Check for uncommitted changes
cd "${WORKTREE_DIR}"
if [ -n "$(git status --porcelain)" ]; then
    echo "WARNING: Uncommitted changes in worktree"
    echo "Commit or discard changes first"
    git status --short
    exit 1
fi

# Return to main repo
cd -

# Remove worktree
git worktree remove "${WORKTREE_DIR}"

echo "Removed worktree: ${WORKTREE_DIR}"
echo "Branch feature/${FEATURE} still exists"
echo ""
echo "To delete the branch too:"
echo "  git branch -d feature/${FEATURE}"
```

### /worktree status - Status of All Worktrees

```bash
echo "=== Worktree Status ==="
for wt in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
    echo ""
    echo "📁 ${wt}"
    cd "${wt}"
    echo "   Branch: $(git branch --show-current)"
    echo "   Status: $(git status --short | wc -l) uncommitted files"
    echo "   Last:   $(git log --oneline -1)"
done
```

Output:

```
WORKTREE STATUS
===============

📁 /home/user/basecamp/react-basecamp
   Branch: main
   Status: Clean
   Last:   abc1234 chore: update deps

📁 /home/user/basecamp/react-basecamp--prompt-mgr
   Branch: feature/prompt-manager
   Status: 3 uncommitted files
   Last:   def5678 feat: add prompt validation

📁 /home/user/basecamp/react-basecamp--workflow
   Branch: feature/workflow-engine
   Status: Clean
   Last:   ghi9012 test: add workflow tests
```

### /worktree switch <feature> - Switch Claude's Context

This tells Claude to work in a different worktree:

```bash
FEATURE="$1"
WORKTREE_DIR="../react-basecamp--${FEATURE}"

if [ ! -d "${WORKTREE_DIR}" ]; then
    echo "Worktree doesn't exist. Create it first:"
    echo "  /worktree add ${FEATURE}"
    exit 1
fi

echo "Switching to worktree: ${WORKTREE_DIR}"
cd "${WORKTREE_DIR}"

echo ""
echo "Now working in: $(pwd)"
echo "Branch: $(git branch --show-current)"
echo ""
echo "Available commands work normally:"
echo "  /status, /code, /test, /commit, /pr, etc."
```

## Workflow Examples

### Parallel Feature Development

```bash
# Terminal 1: Main feature
/worktree add prompt-manager
cd ../react-basecamp--prompt-mgr
/distill prompt-manager
/code prompt-manager

# Terminal 2: Quick bug fix (in main repo)
cd ../react-basecamp
/branch start fix/auth-bug
/code fix/auth-bug
/pr
```

### Review While Coding

```bash
# Worktree 1: Your feature
/worktree add my-feature
cd ../react-basecamp--my-feature
/code my-feature

# Worktree 2: Reviewing PR
/worktree add pr-review
git fetch origin pull/123/head:pr-123
git checkout pr-123
/review
```

### Testing Across Versions

```bash
# Main worktree: Current code
pnpm test:run

# Create worktree at specific commit
git worktree add ../react-basecamp--before-refactor abc1234

# Compare behavior
cd ../react-basecamp--before-refactor
pnpm test:run
```

## Best Practices

1. **One feature per worktree**: Don't mix concerns
2. **Keep main worktree clean**: Use for PRs and main branch only
3. **Clean up regularly**: Remove worktrees when PRs are merged
4. **Share node_modules**: Each worktree needs its own `pnpm install`
5. **Use consistent naming**: `react-basecamp--<feature-name>`

## Integration with Claude Sessions

When working with worktrees in Claude:

```
# In your prompt or at start of session:
"I'm working in the prompt-manager worktree at ../react-basecamp--prompt-mgr"

# Or use the switch command:
/worktree switch prompt-manager
```

Claude will then understand file paths relative to that worktree.

## Cleanup

### After PR is Merged

```bash
# Remove worktree
/worktree remove prompt-manager

# Delete the branch
git branch -d feature/prompt-manager

# Clean up remote tracking
git fetch --prune
```

### Weekly Cleanup

```bash
# List all worktrees
/worktree

# For each merged feature:
/worktree remove <feature>
git branch -d feature/<feature>
```

## Troubleshooting

### "fatal: <path> is already checked out"

A branch can only be checked out in one worktree. Either:

1. Switch branches in the existing worktree
2. Remove the existing worktree first

### Shared Dependencies

Each worktree is independent. After creating:

```bash
cd ../react-basecamp--<feature>
pnpm install
```

### IDE Support

Most IDEs support worktrees:

- **VS Code**: Open each worktree as a separate window
- **WebStorm**: Open as separate project
- **Cursor**: Same as VS Code
