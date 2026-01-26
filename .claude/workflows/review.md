---
name: review
description: PR review workflow with quality checks
---

# Review Workflow

Review a pull request with quality verification.

## Steps

```
check-agent (verify PR branch)
    ↓
pr-agent (review PR)
```

## Used By

- `/pr review` command

## Execution

### Step 1: Quality Verification

Delegate to `check-agent`:

1. Checkout PR branch
2. Run build check
3. Run type check
4. Run lint check
5. Run tests
6. Run security scan

**Gate:** Document all failures but continue to review.

### Step 2: Code Review

Delegate to `pr-agent`:

1. Analyze all changed files
2. Check for security issues
3. Check for correctness
4. Check for style/patterns
5. Provide verdict

## Input

```
pr_number: number  # PR number to review
```

## Output

```markdown
## PR Review: #123

**Title:** feat: add prompt manager

### Quality Checks (on PR branch)

| Check    | Status | Details       |
| -------- | ------ | ------------- |
| Build    | PASS   | Compiled      |
| Types    | PASS   | 0 errors      |
| Lint     | PASS   | 0 errors      |
| Tests    | PASS   | 45/45         |
| Security | WARN   | 1 console.log |

### Code Review

| #   | Severity | Issue                     | Location                   |
| --- | -------- | ------------------------- | -------------------------- |
| 1   | MEDIUM   | console.log in production | src/lib/api.ts:25          |
| 2   | LOW      | Could memoize callback    | src/components/List.tsx:15 |

### Verdict: APPROVE with suggestions

**Summary:**

- Implementation looks correct
- Tests are comprehensive
- One console.log should be removed

**Blocking Issues:** 0
**Suggestions:** 2
```

## Error Handling

| Error                 | Handling                              |
| --------------------- | ------------------------------------- |
| PR not found          | Report error with PR URL              |
| Branch checkout fails | Report error, review from diff only   |
| Check fails           | Include in report, may block approval |

## Severity Levels

| Severity | Meaning                 | Blocking |
| -------- | ----------------------- | -------- |
| CRITICAL | Security/data issue     | Yes      |
| HIGH     | Bug or major issue      | Yes      |
| MEDIUM   | Should fix before merge | No       |
| LOW      | Nice to have            | No       |

## Review Checklist

1. **Security**
   - No hardcoded secrets
   - Input validation present
   - No XSS vulnerabilities

2. **Correctness**
   - Logic is correct
   - Edge cases handled
   - Error handling present

3. **Style**
   - Follows project patterns
   - Clean code principles
   - No unnecessary complexity

4. **Tests**
   - Adequate coverage
   - Meaningful assertions
   - Edge cases tested
