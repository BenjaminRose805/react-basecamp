# /start - Begin Work

Begin work on a new feature by verifying your development environment and creating a worktree and branch.

## Usage

```
/start                    # Prompt for feature name
/start [feature-name]     # Create worktree for feature
/start --full             # Run full environment verification
/start --security         # Include security audit in verification
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

1. **DEPENDENCIES**: Verify pnpm, node, and git installation and versions
2. **TOOLING**: Check package.json scripts and quality tools
3. **VERIFICATION**: Run lint, typecheck, tests (optional: security audit with --security flag)
4. **GIT SETUP**: Create worktree and branch for feature
5. **REPORT**: Output environment status and next steps

## Flags

| Flag         | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| `--full`     | Run full verification (lint, typecheck, tests) before setup   |
| `--security` | Include security audit (trufflehog, gitleaks) in verification |

## Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /start user-authentication                                     │
├─────────────────────────────────────────────────────────────────┤
│  Creating new workspace for: user-authentication                │
│                                                                 │
│  PHASES                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. DEPENDENCIES                                             ││
│  │    ✓ Check pnpm installation and version                   ││
│  │    ✓ Check node installation and version                   ││
│  │    ✓ Check git installation and version                    ││
│  │                                                             ││
│  │ 2. TOOLING                                                  ││
│  │    ✓ Verify package.json scripts                           ││
│  │    ✓ Check quality tools configuration                     ││
│  │                                                             ││
│  │ 3. VERIFICATION (--full flag)                              ││
│  │    → Run lint check                                         ││
│  │    → Run typecheck                                          ││
│  │    → Run tests                                              ││
│  │    → Run security audit (--security flag)                   ││
│  │                                                             ││
│  │ 4. GIT SETUP                                                ││
│  │    Path: ../project-user-authentication                     ││
│  │    Branch: feature/user-authentication                      ││
│  │                                                             ││
│  │ 5. REPORT                                                   ││
│  │    → Environment status                                     ││
│  │    → Next steps                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Enter] Run  [e] Edit name  [Esc] Cancel                       │
└─────────────────────────────────────────────────────────────────┘
```

## Execution

On user confirmation:

```bash
git worktree add ../project-{feature-name} -b feature/{feature-name}
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
✓ Worktree created at ../project-user-authentication
✓ Branch feature/user-authentication created

STATUS: ready
Results saved to: start-status.json

Please restart your session in the new directory:
  cd ../project-user-authentication

Then run /plan to begin designing.
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
✓ Worktree created at ../project-user-authentication
✓ Branch feature/user-authentication created

STATUS: issues
Results saved to: start-status.json

⚠ Environment has issues but worktree was created.
Please review start-status.json for details.

You can proceed, but consider fixing issues first:
  cd ../project-user-authentication
  Review: cat start-status.json

Then run /plan when ready.
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

| Scenario                | Handling                           |
| ----------------------- | ---------------------------------- |
| Worktree path exists    | Suggest different name or cleanup  |
| Branch already exists   | Ask to use existing or rename      |
| Git not initialized     | Error: Not a git repository        |
| Dirty working directory | Warn, ask to stash or commit first |

## After /start

1. Restart session in new worktree directory
2. Run `/plan` to design your feature
3. Run `/guide` to see available commands
