---
name: review
description: PR review workflow with quality checks
---

# Review Workflow

Review a pull request with parallel quality verification and comprehensive code review.

## Trigger

- `/review [PR#]` command

## Stages

```text
git-agent (checkout PR branch)
    ↓
check-agent orchestrator (Opus)
├── build-checker (Haiku) ──┐
├── type-checker (Haiku) ───┤
├── lint-checker (Haiku) ───┼── parallel
├── test-runner (Haiku) ────┤
└── security-scanner (Haiku)┘
    ↓
(context compaction)
    ↓
git-agent orchestrator (Opus)
└── pr-reviewer (Opus) - thorough code review
```

## Stage 1: Checkout

**Orchestrator:** git-agent (Opus)

1. Fetch PR branch: `gh pr checkout [number]`
2. Verify branch is up to date
3. Report PR metadata (title, author, files changed)

**Output:**

```json
{
  "pr_number": 123,
  "branch": "feature/add-auth",
  "files_changed": 5,
  "additions": 250,
  "deletions": 30
}
```

---

## Stage 2: Quality Checks

**Orchestrator:** check-agent (Opus)

Run parallel quality checks on PR branch:

| Sub-agent        | Model | Check                  |
| ---------------- | ----- | ---------------------- |
| build-checker    | Haiku | Compile, no errors     |
| type-checker     | Haiku | TypeScript strict      |
| lint-checker     | Haiku | ESLint rules           |
| test-runner      | Haiku | Vitest + coverage      |
| security-scanner | Haiku | Vulnerabilities, OWASP |

**Output:**

```json
{
  "checks": {
    "build": { "status": "PASS" },
    "types": { "status": "PASS", "errors": 0 },
    "lint": { "status": "WARN", "warnings": 2 },
    "tests": { "status": "PASS", "passed": 45, "coverage": 85 },
    "security": { "status": "WARN", "issues": 1 }
  },
  "check_summary": "Build/types/tests pass. 2 lint warnings, 1 security note."
}
```

**Gate:** Document failures but continue to review.

---

## Context Compaction (Stage 2 → Stage 3)

**KEEP:**

- `check_summary` - Brief summary of check results
- `pr_metadata` - Number, branch, files changed
- `diff_summary` - High-level changes (not full diff)

**DISCARD:**

- Full test output
- Build logs
- Detailed security scan

---

## Stage 3: Code Review

**Orchestrator:** git-agent (Opus)

**Sub-agent:** pr-reviewer (Opus)

Thorough code review with check context:

1. Analyze all changed files
2. Check for security issues
3. Check for correctness
4. Check for style/patterns
5. Provide verdict

**Input:**

```json
{
  "pr_metadata": { "number": 123, "files_changed": 5 },
  "check_summary": "from Stage 2"
}
```

**Output:**

```json
{
  "verdict": "APPROVE | REQUEST_CHANGES | COMMENT",
  "blocking_issues": [],
  "suggestions": [...],
  "summary": "..."
}
```

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

## Context Flow

```text
┌────────────────┐     pr_metadata       ┌────────────────┐
│  git-agent     │ ───────────────────── │  check-agent   │
│  (checkout)    │                       │  (parallel)    │
└────────────────┘                       └────────────────┘
                                                │
                                         check_summary
                                                │
                                                ▼
                                         ┌────────────────┐
                                         │  git-agent     │
                                         │  (pr-reviewer) │
                                         └────────────────┘
```

## Error Handling

| Error                 | Handling                              |
| --------------------- | ------------------------------------- |
| PR not found          | Report error with PR URL              |
| Branch checkout fails | Report error, review from diff only   |
| Check fails           | Include in report, may block approval |

## Performance Target

| Metric     | Current | Optimized | Improvement |
| ---------- | ------- | --------- | ----------- |
| Check time | ~60s    | ~30s      | 50% faster  |
| Total time | ~8 min  | ~5 min    | 37% faster  |
| Context    | 40k tok | 25k tok   | 37% less    |

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

## Notes

- git-agent handles checkout AND review (absorbed pr-agent)
- pr-reviewer is an Opus sub-agent for thorough analysis
- check-agent runs 5 parallel checkers (all Haiku)
- Context compaction passes summary to reviewer, not full logs
