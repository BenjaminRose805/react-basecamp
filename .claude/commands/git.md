# /git - Git Operations

Git commands and branch management.

## Usage

```
/git                    # Show status
/git branch <name>      # Create feature/<name>
/git switch <branch>    # Switch to branch
/git sync               # Sync with main
/git commit             # Create commit
/git worktree <action>  # Manage worktrees
/git cleanup            # Delete merged branches
```

## Examples

```bash
/git                           # Current status
/git branch prompt-manager     # Create feature/prompt-manager
/git switch main               # Switch to main
/git sync                      # Rebase on main
/git commit                    # Commit changes
/git worktree add auth         # Create worktree
/git cleanup                   # Delete merged
```

## Agent

Routes to: `git-agent`

## Subcommands

### status (default)

Show current git state:

- Current branch and tracking
- Uncommitted changes
- Recent commits

### branch

Create and switch to new branch:

```bash
/git branch <name>         # Creates feature/<name>
/git branch fix/<name>     # Creates fix/<name>
```

Branch types: feature/, fix/, refactor/, docs/

### switch

Switch to existing branch:

```bash
/git switch main
/git switch feature/auth
```

### sync

Sync current branch with main:

```bash
git fetch origin
git rebase origin/main
```

### commit

Create conventional commit:

- Stage specific files
- Format: `<type>: <description>`
- Includes Co-Authored-By

### worktree

Manage git worktrees for parallel development:

```bash
/git worktree add <name>    # Create worktree
/git worktree remove <name> # Remove worktree
/git worktree list          # List worktrees
```

### cleanup

Delete merged branches:

```bash
git branch --merged main | grep -v main | xargs git branch -d
```

## Safety Rules

- Never force push to main
- Never use --no-verify
- Always stage specific files
- Always use conventional commits

$ARGUMENTS
