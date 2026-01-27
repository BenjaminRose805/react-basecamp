# /ship - Ship Feature

Commit, create PR, wait for CI and CodeRabbit.

## Usage

```
/ship                    # Full ship workflow
```

## Examples

```bash
/ship                    # Commit → PR → CI → CodeRabbit
```

## Agent

Routes to: `git-agent`

## What Happens

`/ship` handles everything from commit to PR approval:

1. **COMMIT** - Analyze changes, create conventional commit
2. **CREATE PR** - Generate description, create PR via `gh`
3. **WAIT FOR CI** - Poll GitHub Actions until pass/fail
4. **WAIT FOR CODERABBIT** - Poll for review comments

---

## Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship                                                      │
├─────────────────────────────────────────────────────────────┤
│  Feature: user-authentication                               │
│  Branch: feature/user-authentication                        │
│  Changes: 8 files, +342 -12                                 │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. COMMIT                                               ││
│  │    Agent: git-agent                                     ││
│  │    ├─ change-analyzer (Sonnet) - Generate message       ││
│  │    └─ git-executor (Haiku) - Create commit              ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. CREATE PR                                            ││
│  │    Agent: git-agent                                     ││
│  │    ├─ pr-analyzer (Sonnet) - Generate description       ││
│  │    └─ git-executor (Haiku) - Create PR via gh CLI       ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 3. WAIT FOR CI                                          ││
│  │    □ Monitor GitHub Actions                             ││
│  │    □ Report pass/fail                                   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 4. WAIT FOR CODERABBIT                                  ││
│  │    □ Monitor CodeRabbit review                          ││
│  │    □ Report comments or approval                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [e] Edit  [Esc] Cancel                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Progress

```text
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: COMMIT                               [COMPLETE]   │
│  ├─ ✓ change-analyzer (Sonnet)                 [2.1s]       │
│  │   Message: feat: add user authentication                 │
│  └─ ✓ git-executor (Haiku)                     [0.8s]       │
│      Commit: abc1234                                        │
│                                                             │
│  STAGE 2: CREATE PR                            [COMPLETE]   │
│  ├─ ✓ pr-analyzer (Sonnet)                     [1.5s]       │
│  │   Title: Add user authentication                         │
│  └─ ✓ git-executor (Haiku)                     [1.2s]       │
│      PR: #42                                                │
│                                                             │
│  STAGE 3: WAIT FOR CI                          [RUNNING]    │
│  ├─ ● Monitoring GitHub Actions...             [45s]        │
│  │   Build: PASS | Types: PASS | Tests: RUNNING             │
│                                                             │
│  STAGE 4: WAIT FOR CODERABBIT                  [PENDING]    │
│  └─ ○ Waiting for CI to complete                            │
│                                                             │
│  Progress: ██████████████░░░░░░ 70%                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Stage Details

### Stage 1: Commit

```text
Agent: git-agent

1. change-analyzer (Sonnet)
   - Analyze git diff
   - Detect type (feat, fix, refactor, etc.)
   - Generate conventional commit message
   - Include scope from spec if available

2. git-executor (Haiku)
   - Stage changed files
   - Create commit with generated message
   - Push to remote branch
```

### Stage 2: Create PR

```text
Agent: git-agent

1. pr-analyzer (Sonnet)
   - Analyze all commits on branch (not just latest)
   - Generate PR title (under 70 chars)
   - Generate PR description with:
     - Summary (bullet points)
     - Test plan (checklist)
     - Link to spec if available

2. git-executor (Haiku)
   - Create PR via gh pr create
   - Set base branch to main
   - Add labels if configured
```

### Stage 3: Wait for CI

```text
Poll GitHub Actions status via gh CLI:

gh run list --branch {branch} --limit 1 --json status,conclusion

Poll interval: 30 seconds
Timeout: 30 minutes

Outcomes:
- PASS → Continue to Stage 4
- FAIL → Exit with failure, suggest /plan to fix
```

### Stage 4: Wait for CodeRabbit

```text
Poll for CodeRabbit review via gh CLI:

gh api repos/{owner}/{repo}/pulls/{pr}/reviews
gh api repos/{owner}/{repo}/pulls/{pr}/comments

Poll interval: 30 seconds
Timeout: 10 minutes

Outcomes:
- APPROVED (no comments) → Offer to merge
- HAS COMMENTS → Suggest /plan to reconcile
- RATE LIMITED → Offer wait or force merge
- TIMEOUT → Suggest manual check
```

---

## Outcome Handling

### Clean (CI + CodeRabbit Pass)

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIPPED!                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Commit: abc1234                                            │
│  PR: https://github.com/owner/repo/pull/42                  │
│                                                             │
│  CI: ✓ PASS                                                 │
│  CodeRabbit: ✓ APPROVED (no issues)                         │
│                                                             │
│  PR #42 is ready to merge. Merge now? (yes/no)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CodeRabbit Has Comments

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIPPED (with feedback)                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Commit: abc1234                                            │
│  PR: https://github.com/owner/repo/pull/42                  │
│                                                             │
│  CI: ✓ PASS                                                 │
│  CodeRabbit: ⚠ HAS COMMENTS (3 issues)                      │
│                                                             │
│  Issues:                                                    │
│  1. [Security] Use bcrypt, not SHA256                       │
│  2. [Performance] Add index on email column                 │
│  3. [Style] Use early returns in validatePassword()         │
│                                                             │
│  Run /plan to reconcile these issues.                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CI Failed

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIP FAILED                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Commit: abc1234                                            │
│  PR: https://github.com/owner/repo/pull/42                  │
│                                                             │
│  CI: ✗ FAILED                                               │
│                                                             │
│  Failure:                                                   │
│  - Job: test                                                │
│  - Error: Test "auth.test.ts" failed                        │
│  - Details: Expected 200, got 401                           │
│                                                             │
│  Run /plan to investigate and fix.                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CodeRabbit Rate Limited

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIPPED (review pending)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Commit: abc1234                                            │
│  PR: https://github.com/owner/repo/pull/42                  │
│                                                             │
│  CI: ✓ PASS                                                 │
│  CodeRabbit: ⏳ RATE LIMITED                                 │
│                                                             │
│  CodeRabbit has reached its usage limit.                    │
│                                                             │
│  Options:                                                   │
│  1. wait  - Wait for rate limit to reset (~1 hour)          │
│  2. force - Merge without CodeRabbit review                 │
│                                                             │
│  What would you like to do? (wait/force)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Second Ship (After Reconcile)

When running `/ship` after fixing CodeRabbit comments:

### Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship (fixes for PR #42)                                   │
├─────────────────────────────────────────────────────────────┤
│  PR: #42 (existing)                                         │
│  Fixes: 3 CodeRabbit comments addressed                     │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. RESOLVE THREADS                                      ││
│  │    □ Post @coderabbitai resolve comment                 ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. COMMIT & PUSH                                        ││
│  │    □ Commit fixes                                       ││
│  │    □ Push to PR branch                                  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 3. WAIT FOR RE-REVIEW                                   ││
│  │    □ Wait for CI                                        ││
│  │    □ Wait for CodeRabbit re-review                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [e] Edit  [Esc] Cancel                        │
└─────────────────────────────────────────────────────────────┘
```

### Resolve Threads

Post comment to resolve CodeRabbit threads:

```bash
gh pr comment {pr} --body "@coderabbitai resolve"
```

This tells CodeRabbit to mark all threads as resolved.

---

## Sub-Agents

| Stage     | Sub-Agent       | Model  | Purpose                      |
| --------- | --------------- | ------ | ---------------------------- |
| Commit    | change-analyzer | Sonnet | Analyze changes, gen message |
| Commit    | git-executor    | Haiku  | Execute git commands         |
| Create PR | pr-analyzer     | Sonnet | Generate PR description      |
| Create PR | git-executor    | Haiku  | Execute gh commands          |
| CI/Review | -               | -      | Poll via gh CLI              |

## CLI Tools

```
git            # Commit, push
gh             # PR creation, CI status, CodeRabbit comments
```

## Skills Used

- `preview` - Show execution plan before shipping
- `progress` - Show real-time progress during shipping
- `git-operations` - Git procedures (commit, push)
- `pr-operations` - PR procedures (create, monitor)

## Prerequisites

- Implementation complete (`/implement`)
- On feature branch (not main)
- Clean git state (all changes staged or committed)

## After /ship

### If Clean

```text
Run "yes" to merge the PR.
```

### If Has Comments

```text
Run /plan to reconcile CodeRabbit feedback.
Then run /implement to apply fixes.
Then run /ship again.
```

### If CI Failed

```text
Run /plan to investigate the failure.
Then run /implement to fix.
Then run /ship again.
```

$ARGUMENTS
