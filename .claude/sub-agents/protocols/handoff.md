# Handoff Protocol

Structured communication format between orchestrators and sub-agents.

## Overview

The handoff protocol defines how context passes between phases. Each handoff contains:

1. **Task identification** - What work is being done
2. **Context** - Minimal necessary information
3. **Instructions** - What the sub-agent should do
4. **Expected output** - What format to return

## Request Schema

Orchestrator → Sub-Agent

```json
{
  "task_id": "string (required)",
  "phase": "research | write | validate | parallel (required)",
  "context": {
    "feature": "string (required) - Feature being worked on",
    "spec_path": "string | null - Path to spec if exists",
    "relevant_files": ["string - Files to examine"],
    "constraints": ["string - Requirements to meet"],
    "previous_findings": "string | null - Summary from previous phase"
  },
  "instructions": "string (required) - What to do",
  "expected_output": "structured_findings | files_changed | validation_result | aggregated_results"
}
```

### Request Fields

| Field                       | Type   | Required | Description                                      |
| --------------------------- | ------ | -------- | ------------------------------------------------ |
| `task_id`                   | string | Yes      | Unique identifier for tracking                   |
| `phase`                     | enum   | Yes      | Current phase (research/write/validate/parallel) |
| `context.feature`           | string | Yes      | Feature name being worked on                     |
| `context.spec_path`         | string | No       | Path to specification if exists                  |
| `context.relevant_files`    | array  | No       | Files to examine or modify                       |
| `context.constraints`       | array  | No       | Requirements or restrictions                     |
| `context.previous_findings` | string | No       | Summary from previous phase                      |
| `instructions`              | string | Yes      | Specific task for sub-agent                      |
| `expected_output`           | enum   | Yes      | Output format expected                           |

## Response Schema

Sub-Agent → Orchestrator

```json
{
  "task_id": "string (required)",
  "phase": "string (required)",
  "status": "complete | partial | blocked (required)",
  "decision": "PROCEED | STOP | CLARIFY (required)",
  "findings": {
    "type": "object - Phase-specific data"
  },
  "context_summary": "string (required, max 500 tokens)",
  "tokens_used": "number (optional)",
  "issues": ["string - Any problems encountered"]
}
```

### Response Fields

| Field             | Type   | Required | Description                                     |
| ----------------- | ------ | -------- | ----------------------------------------------- |
| `task_id`         | string | Yes      | Echo of request task_id                         |
| `phase`           | string | Yes      | Echo of request phase                           |
| `status`          | enum   | Yes      | Completion status                               |
| `decision`        | enum   | Yes      | Recommendation for orchestrator                 |
| `findings`        | object | Yes      | Phase-specific results                          |
| `context_summary` | string | Yes      | Compact summary for next phase (max 500 tokens) |
| `tokens_used`     | number | No       | Approximate tokens consumed                     |
| `issues`          | array  | No       | Problems or warnings                            |

## Decision Values

| Decision  | Meaning                    | Orchestrator Action           |
| --------- | -------------------------- | ----------------------------- |
| `PROCEED` | Work complete, no blockers | Continue to next phase        |
| `STOP`    | Critical issue found       | Halt workflow, report to user |
| `CLARIFY` | Need more information      | Prompt user for input         |

### Decision Guidelines

**Use PROCEED when:**

- Research found no conflicts
- Implementation complete and tests pass
- Validation checks all pass

**Use STOP when:**

- Duplicate implementation exists
- Breaking change would occur
- Security vulnerability found
- Tests failing and can't fix

**Use CLARIFY when:**

- Requirements ambiguous
- Multiple valid approaches
- Need user preference

## Phase-Specific Findings

### Research Phase Findings

```json
{
  "existing_implementations": [
    {
      "file": "string",
      "description": "string",
      "relevance": "high | medium | low"
    }
  ],
  "conflicts": [
    {
      "type": "naming | pattern | dependency",
      "description": "string",
      "severity": "critical | warning | info"
    }
  ],
  "patterns_found": [
    {
      "file": "string",
      "pattern": "string",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"]
}
```

### Write Phase Findings

```json
{
  "files_created": [
    {
      "path": "string",
      "purpose": "string"
    }
  ],
  "files_modified": [
    {
      "path": "string",
      "changes": "string"
    }
  ],
  "tests_written": [
    {
      "path": "string",
      "test_count": "number",
      "coverage_areas": ["string"]
    }
  ],
  "implementation_notes": ["string"]
}
```

### Validate Phase Findings

```json
{
  "checks": {
    "types": {
      "passed": "boolean",
      "errors": ["string"],
      "warnings": ["string"]
    },
    "lint": {
      "passed": "boolean",
      "errors": ["string"],
      "warnings": ["string"]
    },
    "tests": {
      "passed": "boolean",
      "total": "number",
      "passed_count": "number",
      "failed_count": "number",
      "coverage": "number",
      "failures": ["string"]
    },
    "security": {
      "passed": "boolean",
      "issues": ["string"]
    }
  },
  "overall_passed": "boolean",
  "blocking_issues": ["string"],
  "warnings": ["string"]
}
```

### Parallel Phase Findings

```json
{
  "results": [
    {
      "task_id": "string",
      "type": "string",
      "passed": "boolean",
      "summary": "string",
      "details": "object"
    }
  ],
  "aggregation": {
    "total": "number",
    "passed": "number",
    "failed": "number",
    "rule": "string",
    "overall_passed": "boolean"
  }
}
```

## Context Summary Guidelines

The `context_summary` field is critical for efficient handoffs.

### Rules

1. **Max 500 tokens** - Keep it compact
2. **Include essentials** - Files, patterns, decisions
3. **Skip raw data** - Summarize, don't copy
4. **Focus on next phase** - What does the next sub-agent need?

### Good Example

```
"context_summary": "Existing auth at src/lib/auth.ts (session-based). Follow src/server/routers/user.ts pattern for new router. No naming conflicts. Recommend extending auth.ts with JWT, creating auth router."
```

### Bad Example

```
"context_summary": "I searched through the codebase and found several files. The first file I looked at was src/lib/auth.ts which contains the following code: [500 lines of code]. Then I looked at..."
```

## Examples

### Complete Research → Write Handoff

**Research Request:**

```json
{
  "task_id": "auth-001",
  "phase": "research",
  "context": {
    "feature": "jwt-authentication",
    "spec_path": "specs/auth/requirements.md",
    "relevant_files": ["src/lib/", "src/server/routers/"],
    "constraints": ["no breaking changes", "follow existing patterns"]
  },
  "instructions": "Find existing auth code and patterns for the new JWT feature",
  "expected_output": "structured_findings"
}
```

**Research Response:**

```json
{
  "task_id": "auth-001",
  "phase": "research",
  "status": "complete",
  "decision": "PROCEED",
  "findings": {
    "existing_implementations": [
      {
        "file": "src/lib/auth.ts",
        "description": "Basic session utils",
        "relevance": "high"
      }
    ],
    "conflicts": [],
    "patterns_found": [
      {
        "file": "src/server/routers/user.ts",
        "pattern": "tRPC router with Zod",
        "recommendation": "Follow this"
      }
    ],
    "recommendations": ["Extend auth.ts", "Create auth router"]
  },
  "context_summary": "Existing auth at src/lib/auth.ts (sessions). Pattern: src/server/routers/user.ts. No conflicts. Extend auth.ts with JWT, create auth router.",
  "tokens_used": 847,
  "issues": []
}
```

**Write Request (using research summary):**

```json
{
  "task_id": "auth-001",
  "phase": "write",
  "context": {
    "feature": "jwt-authentication",
    "spec_path": "specs/auth/requirements.md",
    "relevant_files": ["src/lib/auth.ts", "src/server/routers/user.ts"],
    "constraints": ["TDD", "30 line functions"],
    "previous_findings": "Existing auth at src/lib/auth.ts (sessions). Pattern: src/server/routers/user.ts. No conflicts. Extend auth.ts with JWT, create auth router."
  },
  "instructions": "Implement JWT authentication with login/logout using TDD",
  "expected_output": "files_changed"
}
```

## Token Budget

| Phase    | Typical Input | Typical Output | Total |
| -------- | ------------- | -------------- | ----- |
| Research | 200-500       | 500-1000       | ~1500 |
| Write    | 500-1000      | 500-1500       | ~2500 |
| Validate | 300-500       | 300-800        | ~1300 |

Key insight: context_summary passes ~100 tokens between phases instead of ~10000 tokens of raw context.
