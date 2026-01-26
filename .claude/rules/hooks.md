# Hooks System

Documentation for the Claude Code hooks system in react-basecamp.

## Overview

Hooks are shell commands that execute automatically at specific lifecycle events. Unlike CLAUDE.md instructions (which are suggestions), hooks are **guaranteed to execute**.

## Hook Types

| Event              | When It Fires             | Use For                          |
| ------------------ | ------------------------- | -------------------------------- |
| `SessionStart`     | New session begins        | Load context, detect environment |
| `UserPromptSubmit` | Every user prompt         | Context injection                |
| `PreToolUse`       | Before tool execution     | Security blocking, validation    |
| `PostToolUse`      | After tool execution      | Audit logging, verification      |
| `PreCompact`       | Before context compaction | Save important state             |
| `Stop`             | Session ends              | Persist state, cleanup           |

## Exit Codes

| Code | Meaning                               |
| ---- | ------------------------------------- |
| `0`  | Success - allow operation to continue |
| `2`  | Security block - prevent operation    |

**Important:** Exit code 2 is used for security blocking. The operation will be prevented.

## Output Streams

| Stream   | Purpose                            |
| -------- | ---------------------------------- |
| `stdout` | Context injection (adds to Claude) |
| `stderr` | User-visible messages and status   |

**Key Rule:**

- Use `stdout` when you want content added to Claude's context (e.g., git status, TODO items)
- Use `stderr` for messages the user should see (e.g., warnings, errors, status)

## Configuration

Hooks are defined in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/scripts/hooks/session-start.cjs"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/scripts/hooks/pre-tool-use-bash.cjs"
          }
        ]
      }
    ]
  }
}
```

## Current Hooks

### SessionStart

| Hook                       | Purpose                          | Output |
| -------------------------- | -------------------------------- | ------ |
| `session-start.cjs`        | Load context, inject to Claude   | stdout |
| `start-spec-dashboard.cjs` | Start spec-workflow (background) | stderr |

### UserPromptSubmit

| Hook                     | Purpose                    | Output |
| ------------------------ | -------------------------- | ------ |
| `user-prompt-submit.cjs` | Inject git/TODO/CONTEXT.md | stdout |

### PreToolUse

| Hook                    | Matcher     | Purpose                                | Exit Code |
| ----------------------- | ----------- | -------------------------------------- | --------- |
| `pre-tool-use-bash.cjs` | Bash        | Block dangerous commands, quality gate | 2 blocks  |
| `pre-tool-use-file.cjs` | Edit\|Write | Protect sensitive files                | 2 blocks  |
| `suggest-compact.cjs`   | Edit\|Write | Suggest compaction at intervals        | 0 always  |

### PostToolUse

| Hook                | Matcher | Purpose       | Output |
| ------------------- | ------- | ------------- | ------ |
| `post-tool-use.cjs` | (all)   | Audit logging | stderr |

### PreCompact

| Hook              | Purpose                    | Output |
| ----------------- | -------------------------- | ------ |
| `pre-compact.cjs` | Log compaction, save state | stderr |

### Stop

| Hook                   | Purpose                      | Output |
| ---------------------- | ---------------------------- | ------ |
| `session-end.cjs`      | Save session, stop dashboard | stderr |
| `evaluate-session.cjs` | Check for pattern extraction | stderr |

## Security Hooks

### Dangerous Command Blocking (`pre-tool-use-bash.cjs`)

Blocks commands matching these patterns:

- `rm -rf /`, `rm -rf ~`, `rm -rf $HOME` (recursive deletion of dangerous paths)
- Fork bombs (`:(){ :|:& };:`)
- Disk writes (`dd of=/dev/sda`)
- File system formatting (`mkfs.*`)
- Recursive chmod 777 on system paths

**Does NOT block:**

- `rm -rf node_modules` (safe project cleanup)
- `rm -rf ./dist` (safe build cleanup)

### Pre-Commit Quality Gate

When `git commit` is detected:

1. Runs `pnpm lint`
2. Runs `pnpm typecheck`
3. Blocks commit if either fails (exit 2)

### Sensitive File Protection (`pre-tool-use-file.cjs`)

Blocks modification of:

- `.env`, `.env.local`, `.env.production` (secrets)
- `credentials.json`, `secrets.json` (credentials)
- `.pem`, `.key`, `.crt` (certificates)
- `id_rsa`, `id_ed25519`, `authorized_keys` (SSH keys)
- `.git/config`, `.git/hooks/*` (git internals)

**Allowed exceptions:**

- `.env.example`, `.env.sample`, `.env.template`

## Audit Logging

All tool operations are logged to `.claude/logs/post-tool-use.json`:

```json
{
  "timestamp": "2026-01-25T10:30:00.000Z",
  "session_id": "abc123",
  "tool_name": "Edit",
  "tool_input": { "file_path": "src/index.ts" },
  "result_summary": "File edited successfully"
}
```

**Log rotation:** Keeps last 1000 entries.

**Note:** `.claude/logs/` is gitignored.

## Context Injection

### session-start.cjs (SessionStart)

Injects to Claude's context (stdout):

- Recent session files
- Git status (branch, uncommitted count)
- `.claude/CONTEXT.md` (max 1000 chars)
- `TODO.md` (max 500 chars)

### user-prompt-submit.cjs (UserPromptSubmit)

Injects on every prompt (stdout):

- Git status (branch, uncommitted count)
- `.claude/CONTEXT.md` (max 1000 chars)
- `TODO.md` (max 500 chars)

## Shared Utilities

Located in `.claude/scripts/lib/utils.cjs`:

```javascript
const {
  logError, // Output to stderr (visible to user)
  logContext, // Output to stdout (adds to Claude context)
  appendToLog, // Audit logging with rotation
  readStdinJson, // Parse JSON from stdin
  // ... other utilities
} = require("../lib/utils.cjs");
```

## Security Patterns Module

Located in `.claude/scripts/lib/security-patterns.cjs`:

```javascript
const {
  isDangerousCommand, // Returns { blocked, reason }
  isSensitiveFile, // Returns { blocked, reason }
} = require("../lib/security-patterns.cjs");
```

## Writing Custom Hooks

### Security Hook (Blocking)

```javascript
#!/usr/bin/env node
const { readStdinJson, logError } = require("../lib/utils.cjs");

async function main() {
  const input = await readStdinJson();
  const command = input.tool_input?.command || "";

  if (isDangerous(command)) {
    logError("[Hook] BLOCKED: Dangerous operation");
    process.exit(2); // Security block
  }

  process.exit(0); // Allow
}

main();
```

### Context Injection Hook

```javascript
#!/usr/bin/env node
const { logContext } = require("../lib/utils.cjs");

async function main() {
  const context = getProjectContext();

  if (context) {
    logContext(context); // Adds to Claude's context
  }

  process.exit(0);
}

main();
```

### Best Practices

1. **Security hooks exit 2 to block** - Only security issues should block
2. **Use stdout for context injection** - Content goes to Claude
3. **Use stderr for user messages** - Warnings, errors, status
4. **Always exit 0 on non-security errors** - Don't block on failures
5. **Parse JSON from stdin** - Use `readStdinJson()` for tool context
6. **Use .cjs extension** - Project uses ES modules, hooks need CommonJS
7. **Keep hooks fast** - They run on every matching operation

## Debugging Hooks

Test hooks directly:

```bash
# Test with JSON input
echo '{"session_id":"test","tool_input":{"command":"ls -la"}}' | node .claude/scripts/hooks/pre-tool-use-bash.cjs

# Test with file path
echo '{"tool_input":{"file_path":".env"}}' | node .claude/scripts/hooks/pre-tool-use-file.cjs

# Check exit code
echo $?
```

## Related

- `.claude/settings.json` - Hook configuration
- `.claude/scripts/hooks/` - Hook scripts
- `.claude/scripts/lib/` - Shared utilities
- `.claude/logs/` - Audit logs (gitignored)
