# Code Agent Sub-Agents

Sub-agents for the code-agent orchestrator.

## Overview

```text
code-agent (orchestrator, Opus)
├── code-researcher (Opus)
│   └── Find patterns, check conflicts
├── code-writer (Sonnet)
│   └── Implement with TDD
└── code-validator (Haiku)
    └── Run quality checks
```

## Sub-Agents

| Sub-Agent                             | Model  | Purpose                        |
| ------------------------------------- | ------ | ------------------------------ |
| [code-researcher](code-researcher.md) | Opus   | Find patterns, check conflicts |
| [code-writer](code-writer.md)         | Sonnet | Implement with TDD             |
| [code-validator](code-validator.md)   | Haiku  | Run quality checks             |

## Execution Flow

```text
code-researcher ──► code-writer ──► code-validator
     │                   │                │
     │                   │                │
  PROCEED/STOP      TDD cycle        PASS/FAIL
  + context_summary  + files         + issues
```

## Invocation

```typescript
// From code-agent orchestrator
const researchResult = await Task({
  subagent_type: "general-purpose",
  description: "Research for implementation",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: RESEARCH_PROFILE,
  model: "opus",
});
```
