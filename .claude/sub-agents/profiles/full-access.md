# Permission Profile: full-access

All tools including Task for orchestration.

## Description

The orchestrator profile. Sub-agents with this profile can do everything including spawn other sub-agents. Reserved for top-level orchestrators that coordinate multi-phase workflows.

## Allowed Tools

```yaml
# All file operations
- Read # Read file contents
- Write # Create new files
- Edit # Modify existing files
- Grep # Search file contents
- Glob # Find files by pattern

# Command execution
- Bash # Run shell commands

# Sub-agent spawning
- Task # Spawn sub-agents

# Web access
- WebFetch # Fetch web pages
- WebSearch # Search the web

# All LSP operations
- mcp__cclsp__* # All LSP tools

# All documentation tools
- mcp__context7__* # All docs tools

# All Playwright tools
- mcp__playwright__* # All browser tools

# All Next.js tools
- mcp__next-devtools__* # All Next.js tools

# All shadcn tools
- mcp__shadcn__* # All component tools
```

## Explicitly Denied

Nothing explicitly denied, but hooks still apply:

```yaml
# Still blocked by security hooks
- Dangerous bash commands (rm -rf /, etc.)
- Sensitive file modifications (.env, credentials)
- Force push to main/master
```

## Use Cases

| Use Case               | Description                                |
| ---------------------- | ------------------------------------------ |
| Workflow orchestration | Coordinate researcher → writer → validator |
| Parallel execution     | Spawn multiple validators concurrently     |
| Complex features       | Multi-phase implementations                |
| Cross-cutting changes  | Refactors touching many files              |

## Task Tool Usage

```typescript
await Task({
  subagent_type: "general-purpose",
  description: "Orchestrate feature implementation",
  prompt: handoffRequest,
  allowed_tools: [
    // This sub-agent gets everything
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Task",
    "Grep",
    "Glob",
    "WebFetch",
    "WebSearch",
    "mcp__cclsp__*",
    "mcp__context7__*",
    "mcp__playwright__*",
    "mcp__next-devtools__*",
    "mcp__shadcn__*",
  ],
  model: "sonnet",
});
```

## Orchestration Pattern

```typescript
// Full-access orchestrator spawns limited sub-agents
async function orchestrateFeature(feature: string) {
  // Phase 1: Research (limited profile)
  const research = await Task({
    description: "Research phase",
    prompt: buildResearchHandoff(feature),
    allowed_tools: RESEARCH_PROFILE, // Limited
    model: "sonnet",
  });

  if (research.decision !== "PROCEED") {
    return handleNonProceed(research);
  }

  // Phase 2: Write (limited profile)
  const implementation = await Task({
    description: "Implementation phase",
    prompt: buildWriterHandoff(feature, research.context_summary),
    allowed_tools: WRITER_PROFILE, // Limited
    model: "sonnet",
  });

  // Phase 3: Validate (limited profile)
  const validation = await Task({
    description: "Validation phase",
    prompt: buildValidatorHandoff(implementation),
    allowed_tools: READ_ONLY_PROFILE, // Most limited
    model: "haiku", // Cheaper for checklist
  });

  return validation;
}
```

## Security Rationale

- **Hooks still apply**: System-level protections remain active
- **Audit logging**: All operations logged
- **Principle of delegation**: Orchestrator spawns limited sub-agents
- **Reserved usage**: Only for orchestration, not direct work

## When to Use

| Scenario                  | Profile         |
| ------------------------- | --------------- |
| Direct research           | research        |
| Direct implementation     | writer          |
| Direct validation         | read-only       |
| **Multi-phase workflow**  | **full-access** |
| **Parallel coordination** | **full-access** |

## Anti-Patterns

- **Don't use for simple tasks**: Use specific profiles instead
- **Don't bypass delegation**: Spawn sub-agents with appropriate limits
- **Don't ignore hooks**: Security protections still apply
- **Don't hoard context**: Use compacted handoffs between phases
