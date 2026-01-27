# /mode - Switch Working Mode

Switch between different working modes that affect how commands execute.

## Usage

```
/mode            # Show current mode
/mode dev        # Switch to dev mode (full orchestration)
/mode basic      # Switch to basic mode (direct tools)
```

## Examples

```bash
/mode            # What mode am I in?
/mode dev        # Enable full orchestration
/mode basic      # Enable direct tool use
```

## Modes

### dev (Default)

Full orchestration with sub-agents and previews.

```text
Current mode: dev

  Sub-agent orchestration: ENABLED
  Previews: ENABLED
  Direct tool use: Via sub-agents only

This is the recommended mode for feature development.
```

**Behavior:**

- Shows preview before all action commands
- Uses Task tool to spawn sub-agents
- Full progress display during execution
- Context-efficient (isolated sub-agent contexts)

**Use When:**

- Implementing features
- Following the standard flow
- Working on complex tasks
- Want automatic TDD enforcement

### basic

Direct tool access, skip orchestration.

```text
Current mode: basic

  Sub-agent orchestration: DISABLED
  Previews: DISABLED
  Direct tool use: ENABLED

This mode gives you direct control over all tools.
```

**Behavior:**

- Skips preview display
- No sub-agent spawning
- Direct Read/Edit/Write/Bash access
- Still follows spec if one exists
- Still runs verification at end

**Use When:**

- Making quick fixes
- Debugging issues
- Need direct tool control
- Experienced with the codebase

## Switching Modes

### To dev mode

```bash
/mode dev
```

Output:

```text
Switched to dev mode.

  Sub-agent orchestration: ENABLED
  Previews: ENABLED
  Direct tool use: Via sub-agents only

Full orchestration restored. Commands will show previews.
```

### To basic mode

```bash
/mode basic
```

Output:

```text
Switched to basic mode.

  Sub-agent orchestration: DISABLED
  Previews: DISABLED
  Direct tool use: ENABLED

Direct tool access enabled. Previews will be skipped.
Run /mode dev to restore full orchestration.
```

## Mode Effects on Commands

| Command      | dev mode                       | basic mode                 |
| ------------ | ------------------------------ | -------------------------- |
| `/start`     | Preview → Execute              | Execute directly           |
| `/plan`      | Preview → Sub-agents → Approve | Direct execution → Approve |
| `/implement` | Preview → Sub-agents → Verify  | Direct execution → Verify  |
| `/ship`      | Preview → Sub-agents → Wait    | Direct execution → Wait    |
| `/guide`     | Same                           | Same                       |
| `/mode`      | Same                           | Same                       |

## Mode Persistence

- Mode persists for the session
- Default mode is `dev`
- Mode resets to `dev` on new session

## No Preview

This command executes immediately - no preview needed.

## Comparison

| Feature                 | dev           | basic                 |
| ----------------------- | ------------- | --------------------- |
| Preview before action   | ✓             | ✗                     |
| Sub-agent orchestration | ✓             | ✗                     |
| Progress display        | ✓             | ✓ (simple)            |
| Direct tool use         | ✗             | ✓                     |
| TDD enforcement         | ✓             | ✓                     |
| Final verification      | ✓             | ✓                     |
| Context isolation       | ✓ (efficient) | ✗ (uses more context) |
| Spec following          | ✓             | ✓                     |

## Recommendation

Use `dev` mode (default) for:

- Normal development workflow
- Learning the system
- Complex multi-file changes
- When you want guidance

Use `basic` mode for:

- Quick one-off fixes
- Experienced developers
- When you need precise control
- Debugging orchestration issues

$ARGUMENTS
