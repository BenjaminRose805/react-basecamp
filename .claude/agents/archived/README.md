# Archived Agents

Agents deprecated in 08-architecture-v2 (Agent Consolidation).

## Overview

These agents have been deprecated as part of the architecture revision that consolidates 11 agents down to 7, simplifies the user interface, and improves workflow orchestration.

## Deprecated Agents

| Agent                               | Reason                            | Replacement                              |
| ----------------------------------- | --------------------------------- | ---------------------------------------- |
| [debug-agent](./debug-agent.md)     | Investigation is a workflow phase | `investigator` sub-agent in fix workflow |
| [pr-agent](./pr-agent.md)           | PRs are version control           | Absorbed into `git-agent`                |
| [help-agent](./help-agent.md)       | Not agent work                    | Built-in `/help` command                 |
| [context-agent](./context-agent.md) | Not agent work                    | Built-in `/context` command              |

## Migration Guide

### debug-agent → fix workflow

**Before:**

```bash
/debug login timeout issue
```

**After:**

```bash
/fix login timeout issue
```

The fix workflow uses the `investigator` sub-agent (Opus) to:

1. Search codebase for issue-related terms
2. Trace execution paths
3. Identify root cause
4. Classify as backend or frontend
5. Route to appropriate agent (code-agent or ui-agent)
6. Verify the fix with check-agent

See: [.claude/sub-agents/workflows/investigator.md](../../sub-agents/workflows/investigator.md)

### pr-agent → git-agent

**Before:**

```bash
/pr                  # Create PR
/pr create           # Create PR
/pr draft            # Create draft PR
/pr merge            # Merge PR
/pr review 123       # Review PR #123
```

**After:**

```bash
/git pr              # Create PR
/git pr              # Create PR
/git pr draft        # Create draft PR
/git pr merge        # Merge PR
/git pr review 123   # Review PR #123
```

The git-agent now uses specialized sub-agents:

- `change-analyzer` (Sonnet) - Analyze diffs, suggest commit messages
- `pr-analyzer` (Sonnet) - Generate PR descriptions
- `pr-reviewer` (Opus) - Thorough code review
- `git-executor` (Haiku) - Execute git/gh CLI commands

See: [.claude/agents/git-agent.md](../git-agent.md)

### help-agent → /help command

**No change required.** The `/help` command works the same way:

```bash
/help                          # General help
/help what should I do next?   # Context-aware suggestion
/help how does TDD work?       # Concept explanation
```

The difference is internal: `/help` now executes directly without routing through an agent, reducing overhead.

### context-agent → /context command

**No change required.** The `/context` command works the same way:

```bash
/context             # Show current mode
/context dev         # Switch to development mode
/context review      # Switch to review mode
/context research    # Switch to research mode
```

The difference is internal: `/context` now executes directly without routing through an agent, reducing overhead.

## Why These Changes?

### Agent Consolidation

The original 11 agents had overlapping responsibilities:

- pr-agent and git-agent both dealt with version control
- debug-agent was essentially a specialized workflow, not a domain agent
- help-agent and context-agent were simple utilities, not complex orchestrators

### User Interface Simplification

Users now have 6 core commands:

- `/start` - Start work (git-agent)
- `/plan` - Create spec (plan-agent)
- `/implement` - Build feature (routing-agent)
- `/ship` - Push & PR (git-agent + check-agent)
- `/guide` - Status & help
- `/mode` - Switch dev/basic mode

### Better Model Utilization

The sub-agent architecture allows:

- Opus for investigation and analysis
- Sonnet for implementation
- Haiku for validation

This optimizes cost while improving quality.

## Backward Compatibility

For a transition period, the old commands may still work but will show deprecation warnings. Eventually, they will be removed.

If you have scripts or automation using the old commands, update them to use the new equivalents.
