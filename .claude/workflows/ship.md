---
name: ship
description: Quality verification to PR creation workflow
---

# Ship Workflow

Complete shipping workflow from verification to PR using check-agent (parallel checks) and git-agent (commit + PR).

## Trigger

- `/ship` command

## Stages

```text
check-agent orchestrator (Opus)
├── build-checker (Haiku) ──┐
├── type-checker (Haiku) ───┤
├── lint-checker (Haiku) ───┼── parallel (after build)
├── test-runner (Haiku) ────┤
└── security-scanner (Haiku)┘
    ↓
(context compaction)
    ↓
git-agent orchestrator (Opus)
├── change-analyzer (Sonnet) - generate commit message
├── pr-analyzer (Sonnet) - generate PR description
└── git-executor (Haiku) - execute git/gh CLI
```

## Stage 1: Quality Checks

**Orchestrator:** check-agent (Opus)

Run parallel quality checks:

| Sub-agent        | Model | Check                  |
| ---------------- | ----- | ---------------------- |
| build-checker    | Haiku | Compile, no errors     |
| type-checker     | Haiku | TypeScript strict      |
| lint-checker     | Haiku | ESLint rules           |
| test-runner      | Haiku | Vitest + coverage      |
| security-scanner | Haiku | Vulnerabilities, OWASP |

**Execution Order:**

1. build-checker first (dependencies for others)
2. type-checker, lint-checker, test-runner, security-scanner in parallel

**Output:**

```json
{
  "checks": {
    "build": { "status": "PASS", "time": "2.1s" },
    "types": { "status": "PASS", "errors": 0 },
    "lint": { "status": "PASS", "warnings": 2 },
    "tests": { "status": "PASS", "passed": 45, "coverage": 85 },
    "security": { "status": "PASS", "vulns": 0 }
  },
  "summary": "All checks passed"
}
```

**Gate:** All checks must PASS before proceeding.

---

## Context Compaction (Stage 1 → Stage 2)

**KEEP:**

- `check_summary` - Brief summary of all check results
- `files_changed` - From git status (staged + unstaged)

**DISCARD:**

- Full test output
- Lint details
- Build logs
- Security scan details

---

## Stage 2: Git Operations + PR

**Orchestrator:** git-agent (Opus)

Git-agent handles both commit and PR creation (absorbed pr-agent):

### Sub-agents

| Sub-agent       | Model  | Purpose                          |
| --------------- | ------ | -------------------------------- |
| change-analyzer | Sonnet | Analyze diff, suggest commit msg |
| pr-analyzer     | Sonnet | Generate PR description          |
| git-executor    | Haiku  | Execute git/gh CLI commands      |

### Operations

1. **Stage files** - git add specific files
2. **Create commit** - conventional format with Co-Author
3. **Push branch** - git push -u origin
4. **Create PR** - gh pr create with template

**Output:**

```json
{
  "commit": {
    "hash": "abc1234",
    "message": "feat: add prompt manager"
  },
  "pr": {
    "url": "https://github.com/owner/repo/pull/123",
    "number": 123
  }
}
```

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

## Context Flow

```text
┌────────────────┐                      ┌────────────────┐
│  check-agent   │ ──────────────────── │   git-agent    │
│  (Opus orch)   │   check_summary,     │  (Opus orch)   │
│                │   files_changed      │                │
│  5 parallel    │   ~200 tokens        │  commit + PR   │
│  checkers      │                      │                │
└────────────────┘                      └────────────────┘
```

## Error Handling

| Error               | Handling                                         |
| ------------------- | ------------------------------------------------ |
| Check fails         | Stop, report issues, suggest `/implement` to fix |
| Uncommitted changes | Prompt for commit message                        |
| Push fails          | Report error, suggest resolution                 |
| PR creation fails   | Report error, provide manual steps               |

## Performance Target

| Metric     | Current | Optimized | Improvement |
| ---------- | ------- | --------- | ----------- |
| Check time | ~60s    | ~30s      | 50% faster  |
| Total time | ~5 min  | ~3 min    | 40% faster  |
| Context    | 30k tok | 20k tok   | 33% less    |

## Notes

- check-agent runs 5 parallel sub-agents (Haiku)
- git-agent handles both commit AND PR (absorbed pr-agent)
- Context compaction between stages
- Links to Linear issues automatically
- Can be run after `/implement` or manual implementation
