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

The `context_summary` field is **critical** for efficient handoffs between phases. This is the primary mechanism for context compaction - keeping handoffs small preserves context budget.

### Maximum Length

- **500 tokens** (~400 words) maximum
- Use bullet points for multiple items
- Prioritize actionable information
- If summary exceeds limit, cut the least essential items

### What to INCLUDE

Essential information for the next phase:

| Include                  | Why                                    |
| ------------------------ | -------------------------------------- |
| Key file paths           | Next phase needs to know where to look |
| Pattern names to follow  | Ensures consistency                    |
| Decisions made           | PROCEED/STOP/CLARIFY with brief reason |
| Constraints discovered   | Prevents violations                    |
| Specific recommendations | Actionable next steps                  |
| Error types (if STOP)    | Enables targeted fixes                 |

### What to EXCLUDE

Information that wastes context:

| Exclude                     | Why                                |
| --------------------------- | ---------------------------------- |
| Search queries used         | Process detail, not results        |
| Intermediate thinking steps | Reasoning is done                  |
| Full file contents          | Next phase can read files directly |
| Error messages (resolved)   | Already handled                    |
| Alternative approaches      | Decision made, don't need history  |
| Grep/glob patterns tried    | Implementation detail              |
| Line-by-line analysis       | Summarize findings instead         |

### Good Examples

**Research → Write handoff:**

```
"context_summary": "Auth utilities exist in src/lib/auth.ts using JWT with httpOnly cookies. Extend with loginUser/logoutUser. Follow existing validateToken pattern. No conflicts found. Recommend: add tests to auth.test.ts."
```

**Write → Validate handoff:**

```
"context_summary": "Created auth router at src/server/routers/auth.ts with login/logout mutations. Extended src/lib/auth.ts with signToken/verifyToken. 6 tests in auth.test.ts covering success/failure paths. All passing locally."
```

**Validate → Complete handoff:**

```
"context_summary": "All checks passed. Types: OK. Lint: OK (1 warning about unused import, non-blocking). Tests: 6/6 passing, 87% coverage. Security: No issues. Ready for commit."
```

### Bad Examples

**Too verbose (process-focused):**

```
"context_summary": "I searched for 'auth' and found several files. First I looked at src/lib/auth.ts which contains 150 lines of code including imports from jsonwebtoken and cookie packages. The file exports validateToken which takes a token string parameter and returns a boolean. I also checked src/hooks/useAuth.ts but that's just a React hook wrapper..."
```

**Includes raw data:**

```
"context_summary": "Found this code:
export function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, user: decoded };
  } catch {
    return { valid: false, user: null };
  }
}
You should follow this pattern..."
```

**Missing actionable info:**

```
"context_summary": "Looked at auth files. Some patterns exist. Probably okay to proceed."
```

### Estimation Guide

| Summary Length  | Approximate Tokens |
| --------------- | ------------------ |
| 1-2 sentences   | ~50 tokens         |
| 5 bullet points | ~150 tokens        |
| Full paragraph  | ~200 tokens        |
| 400 words max   | 500 tokens         |

### Quality Checklist

Before finalizing context_summary:

- [ ] Under 500 tokens?
- [ ] Contains file paths for next phase?
- [ ] Includes pattern/convention to follow?
- [ ] States decision (PROCEED/STOP/CLARIFY)?
- [ ] Actionable for next phase?
- [ ] No raw code or full file contents?
- [ ] No search queries or process details?

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
