# Eval Agent Sub-Agents

Sub-agents for the eval-agent orchestrator.

## Overview

```text
eval-agent (orchestrator, Opus)
├── eval-researcher (Opus)
│   └── Identify LLM touchpoints, define dimensions
├── eval-writer (Sonnet)
│   └── Write test cases and graders
└── eval-validator (Haiku)
    └── Run dry runs, verify coverage
```

## Sub-Agents

| Sub-Agent                             | Model  | Purpose                  |
| ------------------------------------- | ------ | ------------------------ |
| [eval-researcher](eval-researcher.md) | Opus   | Identify LLM touchpoints |
| [eval-writer](eval-writer.md)         | Sonnet | Write cases and graders  |
| [eval-validator](eval-validator.md)   | Haiku  | Run dry runs, verify     |

## Execution Flow

```text
eval-researcher ──► eval-writer ──► eval-validator
     │                  │                │
     │                  │                │
  PROCEED/STOP      Write evals      PASS/FAIL
  + context_summary  + files         + coverage
```

## When to Use

Use EDD for features with:

- LLM/AI integration
- Non-deterministic outputs
- Agent behaviors
- Prompt engineering

Skip EDD for:

- CRUD operations
- Deterministic logic
- Standard UI components

## Invocation

```typescript
// From eval-agent orchestrator
const researchResult = await Task({
  subagent_type: "general-purpose",
  description: "Research eval dimensions",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: RESEARCH_PROFILE,
  model: "opus",
});
```
