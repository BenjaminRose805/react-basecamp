---
name: git-agent
description: Version control and PR management
---

# Git Agent

Version control and PR management.

## Sub-Agents (2 max)

```text
git-agent (orchestrator)
├── git-writer (Sonnet) - Analyze, generate content, execute
└── git-executor (Haiku) - Execute commands, poll status
```

| Agent        | Model  | Purpose                                                        |
| ------------ | ------ | -------------------------------------------------------------- |
| git-writer   | Sonnet | Analyze diff, generate commit/PR content, execute git commands |
| git-executor | Haiku  | Execute gh commands, poll CI/CodeRabbit                        |

## /ship Flow

```text
/ship
  │
  ├─► 1. Respect Gate: Check context for gate result
  │
  ├─► git-writer (Sonnet)
  │   └─ git diff, git log
  │   └─ Generate commit message
  │   └─ git add, git commit, git push
  │
  └─► git-executor (Haiku)
      └─ gh pr create
      └─ Poll CI status (30s interval)
      └─ Poll CodeRabbit (30s interval)
      └─ Return result
```

## Instructions

> **CRITICAL EXECUTION REQUIREMENT**
>
> Use Task tool to spawn sub-agents. DO NOT execute git/gh directly.
>
> ```typescript
> // Stage 1: Commit
> Task({
>   subagent_type: "general-purpose",
>   description: "Analyze and commit changes",
>   prompt: `Analyze git diff, generate conventional commit message, commit and push.
> Run: git diff, git status, git add <files>, git commit -m "...", git push
> Return: { commit_hash, message, files_changed }`,
>   model: "sonnet",
> });
>
> // Stage 2: PR + Monitor
> Task({
>   subagent_type: "general-purpose",
>   description: "Create PR and monitor CI",
>   prompt: `Create PR and monitor status.
> 1. gh pr create --title "..." --body "..."
> 2. Poll: gh run list --branch X --limit 1 (30s interval, 30min timeout)
> 3. Poll: gh api repos/.../pulls/N/reviews (30s interval, 10min timeout)
> Return: { pr_url, ci_status, coderabbit_status, comments[] }`,
>   model: "haiku",
> });
> ```

## Environment Status (Injected by /start)

When a session begins with `/start`, environment verification results are automatically injected by the `user-prompt-start` hook. This provides context about the development environment health.

### Accessing Environment Status

```typescript
// Environment status is available in session context
// Check results.status before proceeding with git operations

if (results.status === "issues") {
  // Warn user about environment issues
  console.warn(
    "Environment verification found issues. See start-status.json for details."
  );
  // Continue with git operations (non-blocking)
}
```

### Status File Location

Detailed verification results are saved to `start-status.json` in the project root:

```bash
cat start-status.json  # View full environment verification report
```

### Error Handling

The agent should check environment status and warn users of issues, but SHOULD NOT block git operations:

- **Status: "ready"** - All checks passed, proceed normally
- **Status: "issues"** - Some checks failed, warn user but continue
- **No status injected** - Session didn't start with `/start`, proceed normally

**Example Warning:**

```text
⚠ Environment verification detected issues:
  - Lint check failed (3 errors)
  - Type check failed (1 error)

You can proceed with git operations, but consider fixing these issues first.
Review details: cat start-status.json
```

## Ship Gate Integration

When invoked via `/ship` command, the `user-prompt-ship.cjs` hook validates review state BEFORE this agent executes.

**Gate Validation (Pre-Execution):**

- Checks `.claude/state/loop-state.json` exists
- Validates commit is current (not stale)
- Verifies `ship_allowed === true`

**Agent Behavior:**

- If context shows "Ship Gate: BLOCKED", DO NOT proceed with git operations
- If context shows "Ship Gate: APPROVED", proceed normally
- Never bypass the gate (respect blocked status)

**State File Reference:**

- Location: `.claude/state/loop-state.json`
- Schema: `{ ship_allowed, head_commit, blockers, loops: {...} }`
- Managed by: code-review skill (4-loop system)

## Safety Rules

- NEVER force push to main
- NEVER use `--no-verify`
- ALWAYS stage specific files (not `git add .`)
- ALWAYS use conventional commits

## Commit Format

```
<type>: <description>

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, refactor, docs, test, chore
