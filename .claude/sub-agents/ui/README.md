# UI Agent Sub-Agents

Sub-agents for the ui-agent orchestrator.

## Overview

```text
ui-agent (orchestrator, Opus)
├── ui-researcher (Opus)
│   └── Find components, check design specs
├── ui-builder (Sonnet)
│   └── Build components with TDD
└── ui-validator (Haiku)
    └── Run tests, accessibility checks
```

## Sub-Agents

| Sub-Agent                         | Model  | Purpose                        |
| --------------------------------- | ------ | ------------------------------ |
| [ui-researcher](ui-researcher.md) | Opus   | Find components, check designs |
| [ui-builder](ui-builder.md)       | Sonnet | Build components with TDD      |
| [ui-validator](ui-validator.md)   | Haiku  | Run tests, a11y checks         |

## Execution Flow

```text
ui-researcher ──► ui-builder ──► ui-validator
     │                │               │
     │                │               │
  PROCEED/STOP    TDD cycle       PASS/FAIL
  + context_summary  + files      + issues
```

## Invocation

```typescript
// From ui-agent orchestrator
const researchResult = await Task({
  subagent_type: "general-purpose",
  description: "Research UI patterns",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: RESEARCH_PROFILE,
  model: "opus",
});
```
