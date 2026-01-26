# Permission Profile: research

Read operations plus web access for documentation lookup.

## Description

Extends read-only with web fetching and documentation search capabilities. Used for thorough research that may require looking up external documentation or API references.

## Allowed Tools

```yaml
# Everything from read-only
- Read # Read file contents
- Grep # Search file contents
- Glob # Find files by pattern

# LSP read operations
- mcp__cclsp__find_definition # Go to definition
- mcp__cclsp__find_references # Find all references
- mcp__cclsp__get_hover # Get type/doc info
- mcp__cclsp__find_workspace_symbols # Search symbols
- mcp__cclsp__get_diagnostics # Get type errors
- mcp__cclsp__find_implementation # Find implementations
- mcp__cclsp__prepare_call_hierarchy # Prepare call analysis
- mcp__cclsp__get_incoming_calls # Who calls this?
- mcp__cclsp__get_outgoing_calls # What does this call?

# Web access (NEW)
- WebFetch # Fetch web pages
- WebSearch # Search the web

# Documentation lookup (NEW)
- mcp__context7__resolve-library-id # Find library IDs
- mcp__context7__query-docs # Query library docs
```

## Explicitly Denied

```yaml
- Write # No file creation
- Edit # No file modification
- Bash # No command execution
- Task # No sub-agent spawning
- mcp__cclsp__rename_symbol # No refactoring
```

## Use Cases

| Use Case                   | Description                              |
| -------------------------- | ---------------------------------------- |
| API research               | Look up library APIs before implementing |
| Pattern discovery          | Find how others solved similar problems  |
| Conflict detection         | Search for existing implementations      |
| Documentation verification | Verify API usage is correct              |

## Task Tool Usage

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Research existing patterns",
  prompt: handoffRequest,
  allowed_tools: [
    "Read",
    "Grep",
    "Glob",
    "WebFetch",
    "WebSearch",
    "mcp__cclsp__find_definition",
    "mcp__cclsp__find_references",
    "mcp__cclsp__get_hover",
    "mcp__cclsp__find_workspace_symbols",
    "mcp__cclsp__get_diagnostics",
    "mcp__context7__resolve-library-id",
    "mcp__context7__query-docs",
  ],
  model: "sonnet",
});
```

## Web Access Guidelines

When using web access:

1. **Prefer context7** over general web search for library docs
2. **Verify URLs** are from trusted sources (official docs, GitHub)
3. **Don't fetch** authenticated/private resources
4. **Summarize findings** rather than copying large content

## Security Rationale

- **No writes**: Cannot modify codebase
- **No commands**: Cannot execute arbitrary code
- **Web is read-only**: Can fetch but not post
- **Trusted for research**: Safe to explore but not modify
