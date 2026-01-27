# Workflow Sub-Agents

Sub-agents used by workflow orchestrators (not tied to a specific agent).

## Overview

These sub-agents support the expanded workflow system. They are invoked by workflow orchestrators to perform specialized analysis and triage tasks.

```text
Workflows
├── fix workflow
│   └── investigator (Opus)
│       └── Bug diagnosis, classify for routing
├── refactor workflow
│   └── refactor-analyzer (Opus)
│       └── Safe transformation planning
└── security workflow
    └── security-triager (Opus)
        └── Vulnerability prioritization
```

## Sub-Agents

| Sub-Agent                                   | Model | Workflow | Purpose                                                    |
| ------------------------------------------- | ----- | -------- | ---------------------------------------------------------- |
| [investigator](./investigator.md)           | Opus  | fix      | Bug diagnosis, root cause analysis, route to code/ui agent |
| [refactor-analyzer](./refactor-analyzer.md) | Opus  | refactor | Identify safe refactoring transformations                  |
| [security-triager](./security-triager.md)   | Opus  | security | Prioritize vulnerabilities, plan remediation               |

## Model Selection

All workflow sub-agents use **Opus** because they require:

- Deep analytical reasoning
- Complex classification decisions
- Risk assessment
- Multi-factor prioritization

## Workflow Integration

### Fix Workflow

```text
/fix [issue]
    │
    ├─► investigator (Opus)
    │   ├─ Search codebase
    │   ├─ Trace execution
    │   ├─ Identify root cause
    │   └─ Classify: backend | frontend | unclear
    │
    ├─► Route to appropriate agent
    │   ├─ backend → code-agent
    │   └─ frontend → ui-agent
    │
    └─► check-agent (verify fix)
```

### Refactor Workflow

```text
/refactor [scope]
    │
    ├─► check-agent (establish baseline)
    │   └─ Record: tests passing, coverage
    │
    ├─► refactor-analyzer (Opus)
    │   ├─ Map dependencies
    │   ├─ Identify transformations
    │   ├─ Assess risks
    │   └─ Plan execution order
    │
    ├─► Route to appropriate agent
    │   ├─ backend scope → code-agent
    │   └─ frontend scope → ui-agent
    │
    └─► check-agent (verify baseline maintained)
```

### Security Workflow

```text
/security [scope]
    │
    ├─► check-agent (security-scanner only)
    │   └─ Collect: dependency vulns, code issues, secrets
    │
    ├─► security-triager (Opus)
    │   ├─ Prioritize by severity
    │   ├─ Assess exploitability
    │   ├─ Plan remediation phases
    │   └─ Route issues to agents
    │
    ├─► Fix phases (based on triage)
    │   ├─ code-agent → backend/config issues
    │   ├─ ui-agent → frontend issues
    │   └─ git-agent → dependency updates
    │
    └─► check-agent (re-audit)
```

## Permission Profiles

All workflow sub-agents use the **research** profile:

```yaml
allowed_tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - WebSearch
  - mcp__cclsp__find_definition
  - mcp__cclsp__find_references
  - mcp__cclsp__get_hover
  - mcp__cclsp__find_workspace_symbols
```

They are **read-only** - they analyze and plan but do not modify code.

## Handoff Protocol

All sub-agents follow the standard [handoff protocol](../protocols/handoff.md):

### Input

```json
{
  "task_id": "unique-id",
  "phase": "investigate | analyze | triage",
  "context": {
    /* workflow-specific */
  },
  "instructions": "what to analyze",
  "expected_output": "result type"
}
```

### Output

```json
{
  "task_id": "same-id",
  "phase": "same-phase",
  "status": "complete | partial | blocked",
  "decision": "PROCEED | STOP | CLARIFY",
  /* analysis-specific results */
  "context_summary": "max 500 tokens for next phase"
}
```

## Context Compaction

Workflow orchestrators maintain minimal state:

```typescript
{
  state: {
    investigation_summary: string | null,  // From investigator
    classification: string | null,         // backend | frontend
    refactor_plan: string | null,          // From refactor-analyzer
    security_plan: string | null,          // From security-triager
  }
}
```

**DISCARD:** Full evidence, detailed findings, intermediate analysis.

## Adding New Workflow Sub-Agents

When adding a new workflow sub-agent:

1. Create `{name}.md` in this directory
2. Follow the template structure:
   - Role description
   - Model selection (with reasoning)
   - Permission profile
   - Input/output schemas
   - Behavior rules
   - Examples
3. Update this README
4. Add to workflow documentation
