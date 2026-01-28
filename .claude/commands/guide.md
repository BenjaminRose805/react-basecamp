# /guide - Status and Help

Show current status, progress through the development flow, and available commands.

## Usage

```bash
/guide    # Show status and help
```

## Examples

```bash
/guide    # Where am I? What's next?
```

## What It Shows

1. **Current Status**: Feature name, branch
2. **Progress**: Where you are in the flow
3. **Suggested Action**: What to do next
4. **Commands**: Available commands with descriptions

## Display

```text
┌─────────────────────────────────────────────────────────────────┐
│  Guide                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CURRENT STATUS                                                 │
│  Feature: user-authentication                                   │
│  Branch: feature/user-authentication                            │
│                                                                 │
│  PROGRESS                                                       │
│  ✓ /start     Worktree created                                  │
│  ✓ /plan      Spec approved                                     │
│  ✓ /implement Complete (12/12 tasks)                            │
│  ◉ /ship      Waiting for CodeRabbit                            │
│                                                                 │
│  SUGGESTED ACTION                                               │
│  CodeRabbit left 3 comments. Run /plan to reconcile.            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  COMMANDS                                                       │
│  /start     Begin new feature (worktree + branch)               │
│  /plan      Design spec or reconcile PR feedback                │
│  /implement Build approved spec                                 │
│  /ship      Commit + PR + CI + CodeRabbit                       │
│  /guide     This help                                           │
│  /mode      Switch modes (current: dev)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Progress States

### Start Phase

| State       | Display                         |
| ----------- | ------------------------------- |
| Not started | `○ /start     Not started`      |
| Complete    | `✓ /start     Worktree created` |

### Plan Phase

| State             | Display                          |
| ----------------- | -------------------------------- |
| Not started       | `○ /plan      Not started`       |
| In progress       | `● /plan      Writing spec...`   |
| Awaiting approval | `◉ /plan      Awaiting approval` |
| Approved          | `✓ /plan      Spec approved`     |

### Implement Phase

| State       | Display                                 |
| ----------- | --------------------------------------- |
| Not started | `○ /implement Not started`              |
| In progress | `● /implement Building (3/12 tasks)...` |
| Complete    | `✓ /implement Complete (12/12 tasks)`   |
| Failed      | `✗ /implement Failed at task 7`         |

### Ship Phase

| State              | Display                               |
| ------------------ | ------------------------------------- |
| Not started        | `○ /ship      Not started`            |
| Committing         | `● /ship      Creating commit...`     |
| Creating PR        | `● /ship      Creating PR...`         |
| Waiting for CI     | `◉ /ship      Waiting for CI`         |
| CI Failed          | `✗ /ship      CI failed`              |
| Waiting CodeRabbit | `◉ /ship      Waiting for CodeRabbit` |
| Has CR Comments    | `◉ /ship      CodeRabbit: 3 comments` |
| Ready to merge     | `✓ /ship      Ready to merge`         |
| Merged             | `✓ /ship      Merged to main`         |

## Suggested Actions

Based on current state, suggest next action:

| Current State           | Suggested Action                                      |
| ----------------------- | ----------------------------------------------------- |
| Just started worktree   | "Run /plan to design your feature"                    |
| Spec awaiting approval  | "Review and approve spec, then /implement"            |
| Spec approved           | "Run /implement to build"                             |
| Implementation complete | "Run /ship to create PR"                              |
| Waiting for CI          | "CI running, please wait..."                          |
| CI failed               | "CI failed. Run /plan to fix the issue."              |
| CodeRabbit has comments | "CodeRabbit left N comments. Run /plan to reconcile." |
| Ready to merge          | "PR approved! Merge when ready."                      |

## No Preview

This command is informational only - no preview needed.

## Mode Behavior

Works the same in both `dev` and `basic` modes.

## Additional Information

### When No Feature Active

```text
┌─────────────────────────────────────────────────────────────────┐
│  Guide                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CURRENT STATUS                                                 │
│  No active feature. On branch: main                             │
│                                                                 │
│  SUGGESTED ACTION                                               │
│  Run /start to begin a new feature.                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  COMMANDS                                                       │
│  /start     Begin new feature (worktree + branch)               │
│  /plan      Design spec or reconcile PR feedback                │
│  /implement Build approved spec                                 │
│  /ship      Commit + PR + CI + CodeRabbit                       │
│  /guide     This help                                           │
│  /mode      Switch modes (current: dev)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### With Pending CodeRabbit Comments

```text
PROGRESS
✓ /start     Worktree created
✓ /plan      Spec approved
✓ /implement Complete (12/12 tasks)
◉ /ship      CodeRabbit: 3 comments

PENDING CODERABBIT ISSUES
1. [Security] Use bcrypt, not SHA256 for password hashing
2. [Performance] Add index on email column
3. [Style] Use early returns in validatePassword()

SUGGESTED ACTION
Run /plan to reconcile these issues.
```

$ARGUMENTS
