# /pr - Pull Request Management

Create and manage pull requests.

## Usage

```
/pr                     # Create PR (default)
/pr create              # Create PR
/pr draft               # Create draft PR
/pr merge               # Merge current PR
/pr review <number>     # Review PR #number
```

## Examples

```bash
/pr                     # Create PR from current branch
/pr draft               # Create WIP PR
/pr merge               # Merge after CI passes
/pr review 123          # Review PR #123
```

## Agent

Routes to: `pr-agent`

## Subcommands

### create (default)

Create PR from current branch:

- Summarize changes
- Link Linear issues
- Set up for review

### draft

Create draft PR for early feedback:

- Mark as work in progress
- Include TODO list

### merge

Merge after CI passes:

- Wait for CI
- Squash merge (default)
- Clean up branch

Merge strategies:

- `--squash` (default) - Clean history
- `--merge` - Preserve commits
- `--rebase` - Linear history

### review

Review existing PR:

- Run quality checks on PR branch
- Analyze changes
- Provide verdict

## PR Format

```markdown
## Summary

- Bullet point 1
- Bullet point 2

## Test Plan

- [ ] Unit tests pass
- [ ] Manual testing done

🤖 Generated with Claude Code
```

## Prerequisites

For create/draft:

- Run `/check` first
- Branch must be pushed

For merge:

- CI must pass
- Required approvals obtained

## After /pr create

1. Wait for CI to pass
2. Request review if needed
3. Run `/pr merge` when approved

$ARGUMENTS
