# Eval Agent Sub-Agents

Sub-agents for the eval-agent orchestrator.

## Overview

```text
eval-agent (orchestrator, Opus)
├── domain-researcher (mode=eval, Opus)
│   └── Identify LLM touchpoints, define dimensions
├── domain-writer (mode=eval, Sonnet)
│   └── Write test cases and graders
└── quality-validator (Haiku)
    └── Run dry runs, verify coverage
```

## Sub-Agents

Uses consolidated templates from `.claude/sub-agents/templates/`:

| Template          | Mode   | Model  | Purpose                  |
| ----------------- | ------ | ------ | ------------------------ |
| domain-researcher | eval   | Opus   | Identify LLM touchpoints |
| domain-writer     | eval   | Sonnet | Write cases and graders  |
| quality-validator | (none) | Haiku  | Run dry runs, verify     |

## Execution Flow

```text
domain-researcher ──► domain-writer ──► quality-validator
   (mode=eval)        (mode=eval)             │
     │                    │                    │
     │                    │                    │
  PROCEED/STOP        Write evals          PASS/FAIL
  + context_summary    + files            + coverage
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
  description: "Research eval dimensions for [feature]",
  prompt: `You are domain-researcher (mode=eval). ${JSON.stringify(handoffRequest)}`,
  allowed_tools: RESEARCH_PROFILE,
  model: "opus",
});
```
