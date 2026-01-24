# Hooks System

Documentation for the Claude Code hooks system in react-basecamp.

## Overview

Hooks are shell commands that execute automatically at specific lifecycle events. Unlike CLAUDE.md instructions (which are suggestions), hooks are **guaranteed to execute**.

## Hook Types

| Event          | When It Fires             | Use For                          |
| -------------- | ------------------------- | -------------------------------- |
| `SessionStart` | New session begins        | Load context, detect environment |
| `Stop`         | Session ends              | Persist state, cleanup           |
| `PreCompact`   | Before context compaction | Save important state             |
| `PreToolUse`   | Before tool execution     | Validation, reminders            |
| `PostToolUse`  | After tool execution      | Verification, formatting         |

## Configuration

Hooks are defined in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "node .claude/scripts/hooks/session-start.cjs",
        "description": "Load previous context"
      }
    ],
    "PreToolUse": [
      {
        "event": "Bash",
        "pattern": "^git commit",
        "command": "pnpm run lint && pnpm run typecheck",
        "description": "Quality check before commit"
      }
    ],
    "PostToolUse": [
      {
        "event": "Edit",
        "pattern": "\\.ts$",
        "command": "npx tsc --noEmit",
        "description": "Type-check after editing"
      }
    ]
  }
}
```

## Event-Specific Hooks

### PreToolUse / PostToolUse

These hooks can filter by tool and file pattern:

```json
{
  "event": "Edit",
  "pattern": "\\.tsx?$",
  "command": "npx eslint --fix \"$CLAUDE_FILE\"",
  "description": "Lint TypeScript files"
}
```

**Available events:**

- `Bash` - Shell command execution
- `Edit` - File editing
- `Write` - File creation
- `Read` - File reading (rarely used)

**Pattern matching:**

- Uses regex matching
- For Bash: matches against the command
- For Edit/Write/Read: matches against file path

## Environment Variables

Available in hook scripts:

| Variable             | Description               | Available In |
| -------------------- | ------------------------- | ------------ |
| `CLAUDE_FILE`        | File being edited/written | Edit, Write  |
| `CLAUDE_TOOL_OUTPUT` | Output from tool          | PostToolUse  |
| `CLAUDE_SESSION_ID`  | Current session ID        | All          |

## Current Hooks

### SessionStart

```javascript
// .claude/scripts/hooks/session-start.cjs
// Loads previous context, detects package manager
```

- Checks for recent session files
- Detects and logs package manager
- Notifies of available context to load

### Stop

```javascript
// .claude/scripts/hooks/session-end.cjs
// Persists session state for next session

// .claude/scripts/hooks/evaluate-session.cjs
// Extracts patterns for continuous learning
```

- Creates daily session file
- Evaluates for extractable patterns
- Final console.log check on modified files

### PreCompact

```javascript
// .claude/scripts/hooks/pre-compact.cjs
// Saves state before context compaction
```

- Preserves important context
- Creates checkpoint

### PreToolUse

| Trigger                | Action                             |
| ---------------------- | ---------------------------------- |
| `git commit`           | Run lint + typecheck               |
| `git push`             | Reminder about tests/PR            |
| Dev server commands    | Suggest tmux                       |
| Long-running commands  | Suggest tmux                       |
| Writing .md/.txt files | Warn about doc location            |
| Edit/Write any file    | Suggest compaction (after 50+ ops) |

### PostToolUse

| Trigger               | Action                   |
| --------------------- | ------------------------ |
| Edit `.ts(x)`         | Type-check with tsc      |
| Edit `.ts(x)/.js(x)`  | ESLint fix               |
| Edit various files    | Prettier format          |
| Edit `src/**/*.ts(x)` | Run related Vitest tests |
| Edit `.ts(x)/.js(x)`  | Warn about console.log   |
| `gh pr create`        | Log PR URL               |

## Writing Custom Hooks

### Simple Inline Hook

```json
{
  "event": "Bash",
  "pattern": "^npm publish",
  "command": "node -e \"console.error('[Hook] Publishing to npm...')\"",
  "description": "Publish reminder"
}
```

### Script-Based Hook

```javascript
// .claude/scripts/hooks/my-hook.cjs
const fs = require("fs");

const file = process.env.CLAUDE_FILE;
if (file && fs.existsSync(file)) {
  const content = fs.readFileSync(file, "utf8");
  // Custom logic here
  if (content.includes("TODO")) {
    console.error("[Hook] WARNING: File contains TODOs");
  }
}
```

```json
{
  "event": "Edit",
  "pattern": ".*",
  "command": "node .claude/scripts/hooks/my-hook.cjs",
  "description": "Check for TODOs"
}
```

### Best Practices

1. **Keep hooks fast** - They run on every matching operation
2. **Use stderr for output** - `console.error()` displays to user
3. **Exit 0 for success** - Non-zero may block operation
4. **Use .cjs extension** - Project uses ES modules, scripts need CommonJS
5. **Handle missing files** - Check existence before reading

## Hook Output

- Output to `stderr` is shown to the user
- Output to `stdout` is captured but not displayed
- Use `[Hook]` prefix for consistent formatting

```javascript
console.error("[Hook] WARNING: Issue detected");
console.error("[Hook] TIP: Consider doing X");
```

## Debugging Hooks

Test hooks directly:

```bash
# Test session start
node .claude/scripts/hooks/session-start.cjs

# Test with environment variable
CLAUDE_FILE=src/example.ts node .claude/scripts/hooks/my-hook.cjs
```

## Related

- `.claude/settings.json` - Hook configuration
- `.claude/scripts/hooks/` - Hook scripts
- `.claude/scripts/lib/` - Shared utilities
