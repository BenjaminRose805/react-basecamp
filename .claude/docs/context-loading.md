# Context Loading Optimization

Documentation for the lazy-loading context system that reduces initial token consumption.

## Overview

The context loading system uses a **lazy-loading** strategy to minimize token usage:

- **Session start**: Only load essential context (~2,400 tokens)
- **Role-specific**: Load relevant rules when sub-agents spawn
- **On-demand**: Full CLAUDE.md available via MCP resource

### Token Budgets

| Phase         | Budget  | Actual | Status |
| ------------- | ------- | ------ | ------ |
| Session start | <5,000  | ~2,400 | ✓      |
| Orchestrator  | <10,000 | ~5,100 | ✓      |
| Sub-agent     | <5,000  | ~2,200 | ✓      |
| Full context  | N/A     | ~8,600 | N/A    |

## How It Works

### 1. Session Start (UserPromptSubmit Hook)

**Location**: `.claude/scripts/hooks/user-prompt-submit.cjs`

**What it loads**:

- Mini CLAUDE.md (~2,400 tokens) - Condensed command reference
- Git status
- TODO.md
- CONTEXT.md

**Why**: Most sessions are conversational or use basic commands. No need for full architecture docs.

### 2. Sub-Agent Spawn (inject-rules.cjs)

**Location**: `.claude/scripts/inject-rules.cjs`

**Triggered by**: Task tool invocations with `subagent_type` parameter

**What it loads**:

- Role-specific rules only (not entire CLAUDE.md)
- Example: code-writer gets agents.md, methodology.md, coding-style.md, patterns.md, testing.md (~2,200 tokens)

**Why**: Sub-agents only need rules relevant to their role, not full architecture.

### 3. On-Demand (MCP Resource)

**Location**: `claude-docs://full-context` MCP resource (defined in settings.json)

**What it provides**:

- Complete CLAUDE.md (~8,600 tokens)
- Available via ReadMcpResourceTool

**Why**: Orchestrators or users can explicitly request full context when needed.

## Role-to-Rules Mapping

Defined in `.claude/scripts/inject-rules.cjs`:

| Role              | Rules Loaded                                         | ~Tokens |
| ----------------- | ---------------------------------------------------- | ------- |
| code-writer       | agents, methodology, coding-style, patterns, testing | ~2,200  |
| quality-validator | agents, methodology, coding-style, testing           | ~1,800  |
| code-researcher   | agents, methodology, patterns                        | ~1,500  |
| ui-builder        | agents, methodology, coding-style, patterns, testing | ~2,200  |
| git-executor      | agents, git-workflow                                 | ~1,200  |
| security-scanner  | agents, security                                     | ~1,100  |
| orchestrator      | agents (others use Task handoff)                     | ~2,700  |

**Note**: All roles get `agents.md` because it defines the delegation pattern.

## File Structure

```
.claude/
├── CLAUDE.md                      # Mini version (~2,400 tokens)
├── rules/                         # Granular rule files
│   ├── agents.md                  # ~2,700 tokens
│   ├── methodology.md             # ~1,300 tokens
│   ├── coding-style.md            # ~800 tokens
│   ├── git-workflow.md            # ~900 tokens
│   ├── hooks.md                   # ~1,400 tokens
│   ├── patterns.md                # ~1,200 tokens
│   ├── performance.md             # ~800 tokens
│   ├── security.md                # ~1,000 tokens
│   └── testing.md                 # ~1,100 tokens
├── scripts/
│   ├── inject-rules.cjs           # Role-to-rules mapping
│   └── measure-tokens.cjs         # Token measurement
└── docs/
    └── context-loading.md         # This file

CLAUDE.md (root)                   # Full version (~8,600 tokens)
```

## Measuring Tokens

Run the measurement script:

```bash
node .claude/scripts/measure-tokens.cjs
```

**Output**:

- CLAUDE.md before/after comparison
- Individual rule file sizes
- Role bundle sizes
- Summary against budgets

## Troubleshooting

### Issue: Sub-agent doesn't have enough context

**Symptom**: Sub-agent asks questions already answered in CLAUDE.md

**Solution**:

1. Check if role-to-rules mapping includes relevant rules
2. If missing, update mapping in `inject-rules.cjs`
3. Alternatively, orchestrator can pass context via handoff

### Issue: Token budget exceeded

**Symptom**: Context window warnings, performance degradation

**Solution**:

1. Run `measure-tokens.cjs` to identify large files
2. Split large rule files into smaller focused files
3. Review role-to-rules mapping for over-inclusion

### Issue: Full context needed

**Symptom**: User asks for complete architecture overview

**Solution**:

1. Direct user to root CLAUDE.md
2. Or use MCP resource: `ReadMcpResourceTool({ server: "claude-docs", uri: "claude-docs://full-context" })`

## Design Decisions

### Why two CLAUDE.md files?

- **Root CLAUDE.md**: Complete architecture (8,600 tokens) - for human reference and on-demand access
- **.claude/CLAUDE.md**: Mini version (2,400 tokens) - for session start efficiency

### Why not load full CLAUDE.md on session start?

- Most sessions are simple (questions, single commands)
- Loading full context wastes tokens for conversational sessions
- Sub-agents get role-specific rules automatically
- Full context available on-demand via MCP

### Why rule files instead of inline?

- **Granularity**: Load only what's needed
- **Maintainability**: Easier to update individual concerns
- **Composition**: Mix and match for different roles
- **Measurement**: Track token consumption per concern

## Future Optimizations

1. **Dynamic rule loading**: Load rules mid-session based on tool usage patterns
2. **Compression**: Use abbreviations or shorthand for frequently repeated patterns
3. **Caching**: Cache rule bundles to avoid re-reading files
4. **Analytics**: Track which rules are most/least used per role
