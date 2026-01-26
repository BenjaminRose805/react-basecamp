# Permission Profile: read-only

Read and search operations only. No modifications allowed.

## Description

The most restrictive profile. Sub-agents with this profile can read files, search code, and use LSP for navigation, but cannot modify anything.

## Allowed Tools

```yaml
# Core read operations
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
```

## Explicitly Denied

```yaml
- Write # No file creation
- Edit # No file modification
- Bash # No command execution
- Task # No sub-agent spawning
- WebFetch # No web access
- WebSearch # No web search
- mcp__cclsp__rename_symbol # No refactoring
```

## Use Cases

| Use Case          | Description                               |
| ----------------- | ----------------------------------------- |
| Code review       | Analyze code without risk of modification |
| Security audit    | Scan for vulnerabilities read-only        |
| Pattern analysis  | Find patterns across codebase             |
| Impact assessment | Check what uses a function                |

## Task Tool Usage

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Analyze code patterns",
  prompt: handoffRequest,
  allowed_tools: [
    "Read",
    "Grep",
    "Glob",
    "mcp__cclsp__find_definition",
    "mcp__cclsp__find_references",
    "mcp__cclsp__get_hover",
    "mcp__cclsp__find_workspace_symbols",
    "mcp__cclsp__get_diagnostics",
  ],
  model: "haiku",
});
```

## Security Rationale

- **No writes**: Cannot introduce bugs or vulnerabilities
- **No commands**: Cannot execute arbitrary code
- **No spawning**: Cannot escalate permissions via sub-agents
- **Safe for untrusted analysis**: Even if prompt-injected, cannot cause harm
