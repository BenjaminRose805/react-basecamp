# /ship - Ship Feature

Complete shipping workflow from verification to PR.

## Usage

```
/ship
```

## Examples

```bash
/ship                   # Verify, commit, and create PR
```

## Workflow

Routes to: `ship` workflow

```
check-agent (BUILD → TYPES → LINT → TESTS → SECURITY)
    ↓
git-agent (commit if needed)
    ↓
pr-agent (create PR)
```

## What Happens

1. **Quality Verification** (check-agent)
   - Build check
   - Type check
   - Lint check
   - Tests with coverage
   - Security scan

2. **Git Operations** (git-agent)
   - Check for uncommitted changes
   - Create commit with conventional format
   - Push to remote

3. **PR Creation** (pr-agent)
   - Create PR with summary
   - Link to Linear if available
   - Return PR URL

## Prerequisites

- Implementation complete (`/build` or `/code`)
- On feature branch (not main)

## Output

```
SHIPPED!
========

Quality:
  Build:    PASS
  Types:    PASS
  Tests:    PASS (85% coverage)
  Security: PASS

Commit:
  abc1234 feat: add prompt manager

PR:
  https://github.com/owner/repo/pull/123
  Status: Open, CI running

Next:
  1. Wait for CI
  2. Request review
  3. Merge when approved
```

## If Checks Fail

- Fix issues reported
- Run `/ship` again

## Individual Steps

If you need more control:

```bash
/check        # Verify only
/git commit   # Commit only
/pr create    # Create PR only
```

$ARGUMENTS
