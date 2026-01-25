# /context - Working Mode

Switch between different working modes.

## Usage

```
/context            # Show current mode
/context dev        # Switch to dev mode
/context review     # Switch to review mode
/context research   # Switch to research mode
```

## Examples

```bash
/context            # What mode am I in?
/context dev        # Ready to code
/context review     # Ready to review
/context research   # Ready to explore
```

## Agent

Routes to: `context-agent`

## Modes

### dev (Development)

**Focus:** Active implementation

**Behavior:**

- Code first, verify later
- TDD workflow enabled
- Atomic commits expected
- Prefer Edit/Write/Bash tools

**When to use:**

- Implementing features
- Fixing bugs
- Writing code

### review (Review)

**Focus:** Quality assurance

**Behavior:**

- Security first
- Thorough analysis
- Prefer Read/Grep tools
- No code changes without verification

**When to use:**

- Reviewing PRs
- Auditing code
- Security checks

### research (Research)

**Focus:** Exploration

**Behavior:**

- Read first, no modifications
- Document findings
- Ask before changing

**When to use:**

- Understanding codebase
- Investigating options
- Learning new areas

## Mode-Command Alignment

| Mode     | Primary Commands          |
| -------- | ------------------------- |
| dev      | /code, /ui, /build, /ship |
| review   | /check, /pr review        |
| research | /help, /debug             |

## Automatic Detection

The system may suggest mode switches:

```
💡 Switch to dev mode for implementation?
Run: /context dev
```

## Output

```
Current Mode: dev

Focus: Active implementation
Tools: Edit, Write, Bash, Task agents

Switch with:
  /context review   - For quality checks
  /context research - For exploration
```

$ARGUMENTS
