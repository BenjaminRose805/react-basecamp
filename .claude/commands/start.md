# /start - Begin Work

Begin work on a new feature by verifying your development environment and creating a worktree and branch.

## MANDATORY: Preview and Agent Delegation

> **Before executing /start:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/git-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Usage

```
/start                    # Prompt for feature name
/start [feature-name]     # Create worktree for feature
/start --full             # Run full environment verification
/start --security         # Include security audit in verification
/start --force            # Bypass dirty working directory check
/start --yes              # Skip confirmation prompts (CI mode)
```

## Examples

```bash
/start                        # "What feature are you starting?"
/start user-authentication    # Create worktree for user-auth
/start prompt-manager         # Create worktree for prompt-manager
/start --full                 # Full verification before worktree creation
/start auth-system --security # Verify environment with security audit
```

## What Happens

1. **VALIDATE**: Check dirty state, branch existence, critical dependencies
2. **DEPENDENCIES**: Verify pnpm, node, and git installation and versions
3. **TOOLING**: Check package.json scripts and quality tools
4. **VERIFICATION**: Run lint, typecheck, tests (optional: security audit with --security flag)
5. **GIT SETUP**: Create worktree and branch for feature
6. **REPORT**: Output environment status and next steps

## Flags

| Flag         | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| `--full`     | Run full verification (lint, typecheck, tests) before setup |
| `--security` | Include security audit (pnpm audit) in verification         |
| `--force`    | Bypass dirty working directory check                        |
| `--yes`      | Skip confirmation prompts (auto-enabled in CI environments) |

## Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /start user-authentication                                     │
├─────────────────────────────────────────────────────────────────┤
│  Working Dir: /home/user/my-app                                 │
│  Target Branch: feature/user-authentication                     │
│  Worktree Path: ../my-app--user-authentication                  │
│                                                                 │
│  STAGES                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 0. VALIDATE STATE                           Haiku           ││
│  │    └─ Check dirty working directory                         ││
│  │    └─ Check branch existence                                ││
│  │    └─ Check critical dependencies                           ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 1. SETUP WORKTREE                           Haiku           ││
│  │    └─ git worktree add ../my-app--user-authentication       ││
│  │    └─ git checkout -b feature/user-authentication           ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2. VERIFY ENVIRONMENT                       Haiku           ││
│  │    └─ Run environment checks                                ││
│  │    └─ Report status                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Enter] Run  [Esc] Cancel                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Progress Display

```text
┌─────────────────────────────────────────────────────────────────┐
│  /start user-authentication                      [RUNNING]     │
├─────────────────────────────────────────────────────────────────┤
│  STAGE 0: VALIDATE STATE                         ✓ [0.5s]      │
│  ├─ Check dirty working directory                ✓             │
│  ├─ Check branch existence                       ✓             │
│  └─ Check critical dependencies                  ✓             │
│                                                                 │
│  STAGE 1: SETUP WORKTREE                         ● [RUNNING]   │
│  ├─ Compute path: ../my-app--user-auth           ✓             │
│  ├─ Create worktree                              ●             │
│  └─ Verify branch created                        ○             │
│                                                                 │
│  STAGE 2: VERIFY ENVIRONMENT                     ○ [PENDING]   │
│                                                                 │
│  Progress: ████████░░░░░░░░░░░░ 40%              Elapsed: 2.3s │
└─────────────────────────────────────────────────────────────────┘
```

**Status Indicators:**

- `✓` Complete - Task finished successfully
- `●` Running - Task currently executing
- `○` Pending - Task waiting to start

**Progress Bar:**

- Updates as each stage completes
- Shows elapsed time since start
- Real-time updates during execution

## Worktree Path Naming Convention

Worktrees are created in the parent directory using a standardized naming pattern:

**Pattern:** `../<repo>--<feature>`

- `<repo>`: Base name of the current repository directory
- `<feature>`: Feature name (after `feature/` prefix is stripped)
- Separator: Two hyphens `--`

**Examples:**

| Current Directory        | Branch Name               | Worktree Path                     |
| ------------------------ | ------------------------- | --------------------------------- |
| `/home/user/my-app`      | `feature/login`           | `../my-app--login`                |
| `/home/user/my-app`      | `feature/user-auth`       | `../my-app--user-auth`            |
| `/home/user/project-api` | `feature/graphql-support` | `../project-api--graphql-support` |

**Why this pattern:**

- Keeps worktrees outside main repo (avoids nesting issues)
- Clearly identifies which repo the worktree belongs to
- Easy to find and clean up (`ls .. | grep "repo-name--"`)
- Prevents conflicts with other directories

## Sub-Agents

| Stage | Agent                | Model | Purpose                             |
| ----- | -------------------- | ----- | ----------------------------------- |
| 0     | git-validator        | Haiku | Validate state, check prerequisites |
| 1     | git-worktree-creator | Haiku | Create worktree and branch          |
| 2     | git-environment      | Haiku | Verify environment, generate report |

## Task Tool Examples

### Stage 0: Validate State

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Validate git state before worktree creation",
  prompt: `Validate prerequisites for /start command:
1. Check if working directory is clean (git status)
2. Check if branch feature/${featureName} already exists
3. Check if worktree path ${worktreePath} already exists
4. Check critical dependencies (node, pnpm, git)

Return: { clean, branch_exists, path_exists, blockers[] }`,
  model: "haiku",
});
```

### Stage 1: Setup Worktree

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Create git worktree and feature branch",
  prompt: `Create worktree for feature ${featureName}:
1. Compute worktree path: ${worktreePath}
2. Run: git worktree add ${worktreePath} -b feature/${featureName}
3. Verify worktree was created successfully
4. Verify branch was created

Return: { worktree_path, branch_name, success }`,
  model: "haiku",
});
```

### Stage 2: Verify Environment

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Run environment verification in new worktree",
  prompt: `Run environment checks in ${worktreePath}:
1. Change to worktree directory
2. Run environment-check.cjs with appropriate flags
3. Parse results
4. Generate user-friendly report with next steps

Return: { status, report, next_steps }`,
  model: "haiku",
});
```

## Output

### Success Case

```text
ENVIRONMENT VERIFICATION
✓ pnpm 9.15.4
✓ node v22.13.1
✓ git 2.48.1

TOOLING CHECKS
✓ Package scripts verified
✓ Quality tools configured

WORKTREE SETUP
✓ Worktree created at ../my-app--user-authentication
✓ Branch feature/user-authentication created

STATUS: ready
Results saved to: start-status.json

Please restart your session in the new directory:
  cd ../my-app--user-authentication

Then run /design to begin planning.
```

### Failure Case

```text
ENVIRONMENT VERIFICATION
✓ pnpm 9.15.4
✓ node v22.13.1
✓ git 2.48.1

TOOLING CHECKS
✗ Lint check failed (3 errors)
✗ Type check failed (1 error)
✓ Tests passed

WORKTREE SETUP
✓ Worktree created at ../my-app--user-authentication
✓ Branch feature/user-authentication created

STATUS: issues
Results saved to: start-status.json

⚠ Environment has issues but worktree was created.
Please review start-status.json for details.

You can proceed, but consider fixing issues first:
  cd ../my-app--user-authentication
  Review: cat start-status.json

Then run /design when ready.
```

## Git Operations (Hidden)

This command handles git internally:

- Creates git worktree
- Creates feature branch
- User never runs git commands

## Mode Behavior

| Mode  | Preview | Execution |
| ----- | ------- | --------- |
| dev   | Yes     | Yes       |
| basic | No      | Yes       |

## Error Handling

| Scenario                      | Handling                                            |
| ----------------------------- | --------------------------------------------------- |
| Dirty working directory       | Block with file list, suggest stash or --force      |
| Branch already exists         | Error with branch info, ask for different name      |
| Worktree path exists          | Error with suggestion to cleanup or choose new name |
| Missing critical dependencies | Block with list of missing deps (node, pnpm, git)   |
| Git not initialized           | Error: Not a git repository                         |

## Troubleshooting

### Common Issues and Solutions

#### "Dirty working directory"

**Problem:** You have uncommitted changes in your working directory.

**Solution:**

```bash
# Option 1: Commit your changes
git add .
git commit -m "WIP: save current work"

# Option 2: Stash your changes
git stash push -m "WIP before starting new feature"

# Option 3: Use --force flag (if you're sure)
/start feature-name --force
```

#### "Branch already exists"

**Problem:** A branch with the name `feature/your-feature` already exists.

**Solution:**

```bash
# Option 1: Choose a different feature name
/start feature-name-v2

# Option 2: Delete the existing branch (if safe)
git branch -d feature/your-feature-name

# Option 3: Check out existing branch instead
git worktree add ../repo--feature-name feature/your-feature-name
```

#### "Worktree path already exists"

**Problem:** The computed worktree path `../repo--feature` already exists.

**Solution:**

```bash
# Option 1: Remove the existing directory (if safe)
rm -rf ../repo--feature-name

# Option 2: List existing worktrees and clean up
git worktree list
git worktree remove ../repo--feature-name

# Option 3: Choose a different feature name
/start feature-name-v2
```

#### "Missing dependencies"

**Problem:** Critical dependencies (Node.js, pnpm, git) are not installed or not in PATH.

**Solution:**

```bash
# Check what's missing
node --version   # Should be 18+
pnpm --version   # Should be installed
git --version    # Should be 2.0+

# Install missing tools
# Node.js: https://nodejs.org
# pnpm: npm install -g pnpm
# git: https://git-scm.com
```

#### "Environment check failed"

**Problem:** Lint, typecheck, or tests failed during verification.

**Solution:**

```bash
# Review the specific errors
cat start-status.json

# Fix the issues
pnpm lint     # Fix linting errors
pnpm typecheck # Fix type errors
pnpm test     # Fix failing tests

# Or proceed anyway (worktree is still created)
cd ../repo--feature-name
```

#### "Network timeout during tool checks"

**Problem:** gh or coderabbit auth checks timed out.

**Solution:**

```bash
# Check your network connection
ping github.com

# Re-authenticate if needed
gh auth login
coderabbit auth login

# Or skip auth checks (they're non-blocking)
# The worktree will still be created
```

## Branch Naming for Nested Specs

When working with nested specs, branch names use dash-separated format:

**Naming Convention:**

| Spec Path              | Branch Name            |
| ---------------------- | ---------------------- |
| `specs/basecamp/auth/` | `design-basecamp-auth` |
| `specs/api/v2/users/`  | `design-api-v2-users`  |
| `specs/my-feature/`    | `design-my-feature`    |

**Pattern:** `design-{project}-{feature}` or `design-{feature}`

Branch names use dash-separated format; the CI workflow resolves these to the corresponding directory structure in the `specs/` directory.

## After /start

1. Restart session in new worktree directory
2. Run `/design` to plan your feature
3. Run `/guide` to see available commands
