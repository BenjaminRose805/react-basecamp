# /pr - Create Pull Request

Create well-structured pull requests with comprehensive descriptions.

## Usage

```
/pr                        # Create PR from current branch
/pr draft                  # Create as draft PR
/pr [base]                 # Create PR against specific base branch
```

## Instructions

When this command is invoked:

### Step 1: Verify Branch State

```bash
git status
git branch --show-current
git log origin/main..HEAD --oneline
```

Check:

- No uncommitted changes (warn if present)
- Not on main/master branch
- Has commits ahead of base

### Step 2: Ensure Remote is Updated

```bash
git push -u origin $(git branch --show-current)
```

### Step 3: Analyze All Commits

**IMPORTANT:** Review ALL commits in the PR, not just the latest.

```bash
git log origin/main..HEAD --pretty=format:"%h %s"
git diff origin/main..HEAD --stat
```

Understand the full scope of changes.

### Step 4: Check for Related Context

Look for:

- Spec files (`specs/*.md`) related to the feature
- Related issues or tickets mentioned in commits
- Test files added/modified

### Step 5: Draft PR Description

```markdown
## Summary

<2-4 bullet points describing what this PR does>

- Add [feature/fix]
- Update [component/module]
- Refactor [area] for [reason]

## Changes

<Brief description of key changes by area>

### [Area 1]

- Change description

### [Area 2]

- Change description

## Test Plan

- [ ] Unit tests pass (`pnpm test:run`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Manual testing: [describe steps]
- [ ] Tested on: [browsers/devices if UI]

## Related

- Spec: `specs/[feature].md` (if applicable)
- Fixes #[issue] (if applicable)
- Depends on #[PR] (if applicable)

---

Generated with [Claude Code](https://claude.ai/code)
```

### Step 6: Create PR

```bash
gh pr create --title "<type>: <description>" --body "$(cat <<'EOF'
## Summary
...

## Test Plan
...

Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

For draft PRs:

```bash
gh pr create --draft --title "..." --body "..."
```

### Step 6.5: Link to Linear Issue (Optional)

If Linear MCP available:

1. Extract feature from branch: `feature/prompt-manager` → `prompt-manager`
2. Search: `list_issues(query: "{feature}")`
3. If found:
   - `update_issue(id, state: "In Review")`
   - `create_comment(issueId, "PR created: {pr_url}")`
4. Add `Fixes LIN-XXX` to PR description if not present

**Fallback:** Continue without linking.

### Step 7: Report PR URL

Output the created PR URL for easy access.

## PR Title Format

Follow conventional commit format:

- `feat: add user authentication`
- `fix: resolve memory leak in worker`
- `refactor: simplify routing logic`

## MCP Servers

```text
github         # PR creation and management
linear         # Link PR to issue (optional)
```

**Optional linear tools:**

- `update_issue` - Link PR, update status to "In Review"
- `list_issues` - Find issue matching branch/feature
- `create_comment` - Add PR link as comment

## Checklist Before Creating

- [ ] All commits are meaningful (no WIP commits)
- [ ] Tests pass locally
- [ ] No console.log statements
- [ ] No hardcoded secrets
- [ ] Branch is up to date with base

## After Completion

Suggest:

- Share PR URL with reviewers
- Monitor CI checks
- Address review feedback with `/code` then `/commit`
