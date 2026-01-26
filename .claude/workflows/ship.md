---
name: ship
description: Quality verification to PR creation workflow
---

# Ship Workflow

Complete shipping workflow from verification to PR.

## Steps

```
check-agent (BUILD → TYPES → LINT → TESTS → SECURITY)
    ↓
git-agent (commit if needed)
    ↓
pr-agent (create PR)
```

## Used By

- `/ship` command

## Execution

### Step 1: Quality Verification

Delegate to `check-agent`:

1. Run build check
2. Run type check
3. Run lint check
4. Run tests with coverage
5. Run security scan

**Gate:** All checks must PASS before proceeding.

### Step 2: Git Operations

Delegate to `git-agent`:

1. Check for uncommitted changes
2. Create commit if needed
3. Push branch to remote

**Gate:** Branch must be pushed.

### Step 3: PR Creation

Delegate to `pr-agent`:

1. Create PR with summary
2. Link to Linear issue if available
3. Return PR URL

## Input

```
scope?: string  # Optional scope to limit checks
```

## Output

```markdown
## Shipped!

### Quality Checks

| Check    | Status | Details        |
| -------- | ------ | -------------- |
| Build    | PASS   | Compiled       |
| Types    | PASS   | 0 errors       |
| Lint     | PASS   | 0 errors       |
| Tests    | PASS   | 45/45, 85% cov |
| Security | PASS   | No issues      |

### Commit

**Hash:** abc1234
**Message:** feat: add prompt manager

### Pull Request

**URL:** https://github.com/owner/repo/pull/123
**Status:** Open, CI running

### Next Steps

1. Wait for CI to pass
2. Request review
3. Merge when approved
```

## Error Handling

| Error               | Handling                                    |
| ------------------- | ------------------------------------------- |
| Check fails         | Stop, report issues, suggest `/code` to fix |
| Uncommitted changes | Prompt for commit message                   |
| Push fails          | Report error, suggest resolution            |
| PR creation fails   | Report error, provide manual steps          |

## Notes

- Runs all quality gates before shipping
- Creates commit with conventional format
- Links to Linear issues automatically
- Can be run after `/build` or manual implementation
