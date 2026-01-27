# /start - Begin Work

Begin work on a new feature by creating a worktree and branch.

## Usage

```
/start                    # Prompt for feature name
/start [feature-name]     # Create worktree for feature
```

## Examples

```bash
/start                        # "What feature are you starting?"
/start user-authentication    # Create worktree for user-auth
/start prompt-manager         # Create worktree for prompt-manager
```

## What Happens

1. **Prompt** (if needed): Ask for feature name
2. **Preview**: Show worktree path and branch name
3. **Execute**: Create worktree and branch
4. **Output**: Restart instructions + suggest `/plan`

## Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /start user-authentication                                     │
├─────────────────────────────────────────────────────────────────┤
│  Creating new workspace for: user-authentication                │
│                                                                 │
│  ACTIONS                                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. CREATE WORKTREE                                          ││
│  │    Path: ../project-user-authentication                     ││
│  │    Branch: feature/user-authentication                      ││
│  │                                                             ││
│  │ 2. NEXT STEPS                                               ││
│  │    → Restart session in new worktree                        ││
│  │    → Run /plan to begin designing                           ││
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

```text
✓ Worktree created at ../project-user-authentication
✓ Branch feature/user-authentication created

Please restart your session in the new directory:
  cd ../project-user-authentication

Then run /plan to begin designing.
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

$ARGUMENTS
