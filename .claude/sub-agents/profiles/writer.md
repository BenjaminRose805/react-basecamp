# Permission Profile: writer

Full file operations and build commands for implementation.

## Description

The implementation profile. Sub-agents can read, write, edit files, and run build commands. Used for actual code implementation following TDD methodology.

## Allowed Tools

```yaml
# File operations
- Read # Read file contents
- Write # Create new files
- Edit # Modify existing files
- Grep # Search file contents
- Glob # Find files by pattern

# Command execution
- Bash # Run shell commands

# LSP full operations
- mcp__cclsp__find_definition # Go to definition
- mcp__cclsp__find_references # Find all references
- mcp__cclsp__get_hover # Get type/doc info
- mcp__cclsp__find_workspace_symbols # Search symbols
- mcp__cclsp__get_diagnostics # Get type errors
- mcp__cclsp__find_implementation # Find implementations
- mcp__cclsp__rename_symbol # Rename across files
- mcp__cclsp__prepare_call_hierarchy # Prepare call analysis
- mcp__cclsp__get_incoming_calls # Who calls this?
- mcp__cclsp__get_outgoing_calls # What does this call?
```

## Explicitly Denied

```yaml
- Task # No sub-agent spawning
- WebFetch # No web access (use research profile)
- WebSearch # No web search (use research profile)
- mcp__context7__* # No docs lookup (research should be done)
```

## Use Cases

| Use Case            | Description                       |
| ------------------- | --------------------------------- |
| Code implementation | Write new features following TDD  |
| Test writing        | Create test files for new code    |
| Refactoring         | Rename symbols, extract functions |
| Build verification  | Run typecheck, lint, tests        |

## Allowed Bash Commands

```bash
# Build and validation
pnpm typecheck                        # Type checking
pnpm lint                             # Linting
pnpm test:run                         # Run tests
pnpm build                            # Production build

# Package operations
pnpm install                          # Install dependencies
pnpm add <package>                    # Add dependency

# Git (read-only)
git status                            # Check status
git diff                              # View changes
```

## Blocked Bash Commands

```bash
# Destructive operations
rm -rf /                              # System destruction
rm -rf ~                              # Home destruction
git push --force                      # Force push

# Network operations
curl                                  # Use WebFetch instead
wget                                  # Use WebFetch instead

# System modifications
sudo                                  # No root access
chmod 777                             # No permission changes
```

## Task Tool Usage

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Implement feature with TDD",
  prompt: handoffRequest,
  allowed_tools: [
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Grep",
    "Glob",
    "mcp__cclsp__find_definition",
    "mcp__cclsp__find_references",
    "mcp__cclsp__get_hover",
    "mcp__cclsp__find_workspace_symbols",
    "mcp__cclsp__get_diagnostics",
    "mcp__cclsp__rename_symbol",
  ],
  model: "sonnet",
});
```

## Security Rationale

- **No spawning**: Cannot escalate to full-access
- **No web**: Must use pre-researched information
- **Bash limited**: Dangerous commands blocked by hooks
- **Write monitored**: Sensitive files protected by hooks

## Implementation Guidelines

1. **Test first**: Write failing test before implementation
2. **Minimal code**: Only what's needed to pass tests
3. **Verify builds**: Run typecheck after changes
4. **No secrets**: Never write credentials to files
