# Docs Agent Sub-Agents

Sub-agents for the docs-agent orchestrator.

## Overview

```text
docs-agent (orchestrator, Opus)
├── docs-researcher (Opus)
│   └── Find existing docs, gather code context
├── docs-writer (Sonnet)
│   └── Write documentation
└── docs-validator (Haiku)
    └── Verify accuracy, check links
```

## Sub-Agents

| Sub-Agent                             | Model  | Purpose                   |
| ------------------------------------- | ------ | ------------------------- |
| [docs-researcher](docs-researcher.md) | Opus   | Find gaps, gather context |
| [docs-writer](docs-writer.md)         | Sonnet | Write documentation       |
| [docs-validator](docs-validator.md)   | Haiku  | Verify accuracy, links    |

## Execution Flow

```text
docs-researcher ──► docs-writer ──► docs-validator
     │                  │                │
     │                  │                │
  PROCEED/STOP      Write docs       PASS/FAIL
  + context_summary  + files         + issues
```

## Invocation

```typescript
// From docs-agent orchestrator
const researchResult = await Task({
  subagent_type: "general-purpose",
  description: "Research for documentation",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: RESEARCH_PROFILE,
  model: "opus",
});
```
