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

## /start Flow

```text
/start [feature-name]
    │
    ├─► 0. VALIDATE (Hook)
    │   ├─ Check dirty working directory
    │   ├─ Check branch existence
    │   ├─ Check worktree path availability
    │   └─ Check critical dependencies
    │
    ├─► 1. SETUP WORKTREE (Haiku)
    │   ├─ Compute path: ../<repo>--<feature>
    │   ├─ git worktree add <path> -b feature/<name>
    │   └─ Verify worktree created
    │
    └─► 2. VERIFY ENVIRONMENT (Haiku)
        ├─ Run environment-check.cjs in worktree
        ├─ Parse results
        └─ Report next steps
```

### Sub-Agents for /start

The `/start` command uses three specialized sub-agents to ensure safe and reliable worktree creation:

#### 1. git-validator (Stage 0)

**Purpose:** Validate prerequisites before worktree creation to prevent errors and conflicts.

**Input Schema:**

```typescript
{
  featureName: string; // Feature name (e.g., "api-auth")
  worktreePath: string; // Computed worktree path (e.g., "../repo--api-auth")
}
```

**Output Schema:**

```typescript
{
  clean: boolean;              // Working directory is clean
  branch_exists: boolean;      // Feature branch already exists
  path_exists: boolean;        // Worktree path already exists
  blockers: string[];          // List of issues preventing worktree creation
}
```

**Tools Used:**

- Bash (git commands: `git status`, `git branch`, `ls`)

**Validation Checks:**

1. Working directory is clean (no uncommitted changes)
2. Feature branch doesn't already exist
3. Target worktree path is available
4. Critical dependencies present (node, pnpm, git)

---

#### 2. git-worktree-creator (Stage 1)

**Purpose:** Create git worktree and feature branch in a clean, isolated environment.

**Input Schema:**

```typescript
{
  featureName: string; // Feature name (e.g., "api-auth")
  worktreePath: string; // Target worktree path (e.g., "../repo--api-auth")
}
```

**Output Schema:**

```typescript
{
  worktree_path: string; // Absolute path to created worktree
  branch_name: string; // Created branch name (e.g., "feature/api-auth")
  success: boolean; // Operation succeeded
}
```

**Tools Used:**

- Bash (git commands: `git worktree add`, `git worktree list`, `git branch`)

**Operations:**

1. Compute worktree path (sibling directory pattern)
2. Create worktree with new feature branch
3. Verify worktree creation
4. Verify branch creation

---

#### 3. git-environment (Stage 2)

**Purpose:** Run environment verification in new worktree and report results to user.

**Input Schema:**

```typescript
{
  worktreePath: string; // Path to created worktree
  flags: {
    full: boolean; // Run comprehensive checks
    security: boolean; // Include security scans
  }
}
```

**Output Schema:**

```typescript
{
  status: string;         // "ready" | "issues" | "error"
  report: string;         // Human-readable verification report
  next_steps: string[];   // Actionable next steps for user
}
```

**Tools Used:**

- Bash (`node environment-check.cjs`)

**Verification Steps:**

1. Change to worktree directory
2. Run environment-check.cjs with flags
3. Parse JSON results
4. Generate user-friendly report
5. Save detailed results to start-status.json

---

| Stage | Agent                | Model | Purpose                             |
| ----- | -------------------- | ----- | ----------------------------------- |
| 0     | git-validator        | Haiku | Validate state, check prerequisites |
| 1     | git-worktree-creator | Haiku | Create worktree and branch          |
| 2     | git-environment      | Haiku | Verify environment, generate report |

### Task Tool Examples for /start

#### Stage 0: Validate State

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Validate git state before worktree creation",
  prompt: `Validate prerequisites for /start command:
1. Check if working directory is clean (git status)
2. Check if branch feature/${featureName} already exists
3. Check if worktree path ${worktreePath} already exists
4. Check critical dependencies (node, pnpm, git)

Commands:
- git status --porcelain
- git branch --list feature/${featureName}
- ls ${worktreePath} 2>/dev/null

Return: { clean, branch_exists, path_exists, blockers[] }`,
  model: "haiku",
});
```

#### Stage 1: Setup Worktree

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Create git worktree and feature branch",
  prompt: `Create worktree for feature ${featureName}:
1. Compute worktree path: ${worktreePath}
2. Run: git worktree add ${worktreePath} -b feature/${featureName}
3. Verify worktree was created successfully
4. Verify branch was created

Commands:
- git worktree add ${worktreePath} -b feature/${featureName}
- git worktree list
- git branch --list feature/${featureName}

Return: { worktree_path, branch_name, success }`,
  model: "haiku",
});
```

#### Stage 2: Verify Environment

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Run environment verification in new worktree",
  prompt: `Run environment checks in ${worktreePath}:
1. Change to worktree directory
2. Run environment-check.cjs with appropriate flags
3. Parse results
4. Generate user-friendly report with next steps

Commands:
- cd ${worktreePath}
- node .claude/scripts/environment-check.cjs ${flags}

Return: { status, report, next_steps }`,
  model: "haiku",
});
```

## Skills Used

- **git-operations** - Git commands, branching, worktrees
- **pr-operations** - PR lifecycle, CI monitoring, reviews

## /ship Flow

```text
/ship
  │
  ├─► 0. Respect Gate: Check context for gate result
  │
  ├─► 1. PRUNE ARTIFACTS — see prune-agent.md
  │   ├─ prune-scanner (Haiku) — read-only scan
  │   ├─ PREVIEW → AskUserQuestion: Prune / Skip / Cancel
  │   └─ prune-executor (Sonnet) — execute if confirmed
  │
  ├─► 2. git-writer (Sonnet)
  │   └─ git diff, git log
  │   └─ Generate commit message
  │   └─ git add, git commit, git push
  │
  └─► 3. git-executor (Haiku)
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
> // Stage 1: Prune — scan, preview, confirm, execute
>> // See prune-agent.md for full workflow details.
>> // 1a. Scan (read-only)
> Task({
>   subagent_type: "general-purpose",
>   description: "Scan for prunable artifacts",
>   prompt: `Read .claude/agents/prune-agent.md. Execute Stage 1 (SCAN) only.
> Return: { to_delete[], to_trim[], safe_skips[] }`,
>   model: "haiku",
> });
> // 1b. Preview + Confirm (orchestrator renders preview, calls AskUserQuestion)
> // 1c. Execute (only if user selected "Prune")
> Task({
>   subagent_type: "general-purpose",
>   description: "Execute approved prune operations",
>   prompt: `Read .claude/agents/prune-agent.md. Execute Stage 3 (EXECUTE).
> Approved deletions: ${JSON.stringify(scan_results.to_delete)}
> Approved trims: ${JSON.stringify(scan_results.to_trim)}
> Return: { removed[], trimmed[], errors[] }`,
>   model: "sonnet",
> });
>
> // Stage 2: Commit
> Task({
>   subagent_type: "general-purpose",
>   description: "Analyze and commit changes",
>   prompt: `Analyze git diff, generate conventional commit message, commit and push.
> Run: git diff, git status, git add <files>, git commit -m "...", git push
> Return: { commit_hash, message, files_changed }`,
>   model: "sonnet",
> });
>
> // Stage 3: PR + Monitor
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
