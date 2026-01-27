# Design: Code Agent 3-Agent Pattern

> **Status:** Implemented
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-02

## Overview

This design transforms the monolithic code-agent into an orchestrator that delegates to three specialized sub-agents: code-researcher, code-writer, and code-qa. Each sub-agent operates in an isolated context window, receiving only compacted handoffs from previous phases.

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  code-agent (monolithic)                                    │
├─────────────────────────────────────────────────────────────┤
│  RESEARCH phase                                             │
│  - Grep/Glob searches accumulate in context                 │
│  - Pattern analysis accumulates                             │
│  - ~15,000 tokens                                           │
├─────────────────────────────────────────────────────────────┤
│  IMPLEMENT phase                                            │
│  - Research context still present (bloated)                 │
│  - TDD iterations accumulate                                │
│  - ~20,000 additional tokens                                │
├─────────────────────────────────────────────────────────────┤
│  VALIDATE phase                                             │
│  - All previous context present                             │
│  - Near context limit                                       │
│  - ~10,000 additional tokens                                │
├─────────────────────────────────────────────────────────────┤
│  TOTAL: ~45,000 tokens in single context                    │
│  RISK: Context overflow on complex specs                    │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```text
┌─────────────────────────────────────────────────────────────┐
│  code-agent (orchestrator)                                  │
│  - Lightweight coordination                                 │
│  - Handoff management                                       │
│  - ~2,000 tokens                                            │
└─────────────────────────────────────────────────────────────┘
         │
         ├── handoff request ──►
         │
┌─────────────────────────────────────────────────────────────┐
│  code-researcher (isolated context)                         │
│  - Full research activities                                 │
│  - ~15,000 tokens (isolated)                                │
│  - Returns: context_summary (~500 tokens)                   │
└─────────────────────────────────────────────────────────────┘
         │
         ├── context_summary ──►
         │
┌─────────────────────────────────────────────────────────────┐
│  code-writer (isolated context)                             │
│  - TDD implementation                                       │
│  - ~20,000 tokens (isolated)                                │
│  - Returns: files_changed, context_summary (~300 tokens)    │
└─────────────────────────────────────────────────────────────┘
         │
         ├── files_changed ──►
         │
┌─────────────────────────────────────────────────────────────┐
│  code-qa (isolated context)                                 │
│  - Quality checks                                           │
│  - ~10,000 tokens (isolated)                                │
│  - Returns: PROCEED/STOP                                    │
└─────────────────────────────────────────────────────────────┘

TOTAL: Same work, but each context isolated
BENEFIT: Each sub-agent well under limit, can handle longer specs
```

---

## Component Design

### 1. Code-Agent Orchestrator

The orchestrator is a lightweight coordinator that manages sub-agent invocation and handoff.

**File:** `.claude/agents/code-agent.md` (updated)

**Model:** Opus 4.5 (orchestration requires routing decisions)

```markdown
# Agent: code-agent (Orchestrator)

## Role

Orchestrate code implementation through sub-agent delegation.

## Sub-Agents

- code-researcher: Find existing code, identify conflicts
- code-writer: TDD implementation
- code-qa: Quality verification

## Workflow

### Full Flow (/code [feature])

1. Spawn code-researcher with task
2. If PROCEED: spawn code-writer with context_summary
3. If writer completes: spawn code-qa with files_changed
4. If qa fails: retry writer (max 2)
5. Report final status

### Research Only (/code research [feature])

1. Spawn code-researcher
2. Report findings

### Implement Only (/code implement [feature])

1. Spawn code-writer (assumes research done)
2. Report changes

### Validate Only (/code validate [feature])

1. Spawn code-qa
2. Report results
```

### 2. Code-Researcher Sub-Agent

**File:** `.claude/sub-agents/code/code-researcher.md`

**Model:** Opus 4.5 (research requires connecting patterns across codebase)

```markdown
# Sub-Agent: code-researcher

## Role

Find existing implementations, identify conflicts, gather context for implementation.

## Model

Opus 4.5

## Profile

research (Read, Grep, Glob, WebFetch, WebSearch, mcp**cclsp**_, mcp**context7**_)

## Input Format

{
"task_id": "code-research-{id}",
"phase": "research",
"context": {
"feature": "feature description",
"spec_path": "specs/feature/requirements.md" | null,
"hints": ["possible file locations"],
"constraints": ["project constraints"]
},
"instructions": "Find existing implementations and identify conflicts"
}

## Output Format

{
"task_id": "code-research-{id}",
"phase": "research",
"status": "complete",
"decision": "PROCEED" | "STOP" | "CLARIFY",
"findings": {
"existing_implementations": [
{ "file": "path", "description": "what it does", "relevant_functions": [] }
],
"conflicts": [
{ "type": "naming" | "pattern", "description": "conflict details" }
],
"patterns_found": ["pattern descriptions"],
"recommendations": ["implementation suggestions"]
},
"context_summary": "Compact summary for writer (max 500 tokens)",
"tokens_used": 15000
}

## Behavior

1. Read spec if provided
2. Search for existing implementations:
   - Grep for feature-related terms
   - Check common locations (src/lib, src/features, src/components)
   - Use cclsp to find related symbols
3. Identify conflicts:
   - Naming conflicts with existing code
   - Pattern violations
4. Check external docs if needed (context7)
5. Summarize findings in context_summary
6. Return decision:
   - PROCEED: No blockers, ready to implement
   - STOP: Critical conflict found
   - CLARIFY: Need more information from user
```

### 3. Code-Writer Sub-Agent

**File:** `.claude/sub-agents/code/code-writer.md`

**Model:** Sonnet (code generation follows patterns)

```markdown
# Sub-Agent: code-writer

## Role

Implement functionality following TDD and project patterns.

## Model

Sonnet

## Profile

writer (Read, Write, Edit, Bash, Grep, Glob, mcp**cclsp**\*)

## Input Format

{
"task_id": "code-write-{id}",
"phase": "write",
"context": {
"feature": "feature description",
"spec_path": "specs/feature/requirements.md" | null,
"research_summary": "context_summary from researcher",
"retry_context": null | { "failures": [], "attempt": 2 }
},
"instructions": "Implement the feature using TDD"
}

## Output Format

{
"task_id": "code-write-{id}",
"phase": "write",
"status": "complete" | "partial" | "blocked",
"files_changed": [
{ "path": "src/lib/feature.ts", "action": "created" | "modified" }
],
"tests_written": [
{ "path": "src/lib/feature.test.ts", "count": 5 }
],
"context_summary": "Changes made for QA (max 300 tokens)",
"notes": "Implementation notes"
}

## Behavior

1. Read research_summary (NOT raw research)
2. Read spec if provided
3. Follow TDD:
   a. Write failing tests first
   b. Run tests to confirm failure
   c. Implement minimal code to pass
   d. Refactor if needed
4. Follow coding standards:
   - Max 30 lines per function
   - Immutable patterns
   - Zod validation for inputs
5. Return list of changed files
6. If blocked, explain what's needed

## Constraints

- DO NOT perform research (that's researcher's job)
- DO NOT run full validation (that's QA's job)
- DO run tests during TDD to verify green
```

### 4. Code-QA Sub-Agent

**File:** `.claude/sub-agents/code/code-qa.md`

```markdown
# Sub-Agent: code-qa

## Role

Verify implementation quality through automated checks.

## Profile

validator (Read, Grep, Glob, Bash, mcp**cclsp**\*)

## Model

haiku (checklist-based work, cost optimization)

## Input Format

{
"task_id": "code-qa-{id}",
"phase": "validate",
"context": {
"files_changed": ["src/lib/feature.ts", "src/lib/feature.test.ts"],
"implementation_summary": "context_summary from writer",
"expected_behavior": "what the feature should do"
},
"instructions": "Run all quality checks on changed files"
}

## Output Format

{
"task_id": "code-qa-{id}",
"phase": "validate",
"status": "complete",
"decision": "PROCEED" | "STOP",
"checks": {
"types": { "passed": true, "errors": [] },
"lint": { "passed": true, "errors": [] },
"tests": { "passed": true, "coverage": 85, "failed": [] },
"security": { "passed": true, "issues": [] }
},
"summary": "All checks passed" | "Failures found: ...",
"tokens_used": 8000
}

## Behavior

1. Run type checking:
   - pnpm typecheck (or tsc --noEmit on changed files)
   - Collect any type errors
2. Run linting:
   - pnpm lint (on changed files)
   - Collect any lint errors
3. Run tests:
   - pnpm test:run (related to changed files)
   - Collect failures and coverage
4. Security checks:
   - Check for console.log statements
   - Check for hardcoded secrets
   - Check for TODO/FIXME comments
5. Aggregate results
6. Return PROCEED if all pass, STOP if any fail

## Parallel Execution (Optional)

Checks 1-4 are independent and MAY run in parallel using background tasks.
```

---

## Data Flow

### Full Workflow Sequence

```text
User: /code add-user-authentication
    │
    ▼
Orchestrator: Parse command, create handoff
    │
    ├── Task(code-researcher, {
    │     feature: "add-user-authentication",
    │     spec_path: "specs/user-auth/requirements.md"
    │   })
    │
    ▼
code-researcher: (isolated context ~15k tokens)
    ├── Read spec
    ├── Grep for "auth", "login", "user"
    ├── Found: src/lib/auth.ts (JWT utils)
    ├── No conflicts
    └── Return: {
          decision: "PROCEED",
          context_summary: "JWT auth exists in src/lib/auth.ts with
            validateToken, refreshToken. Recommend extending with
            loginUser, logoutUser functions. Use httpOnly cookies."
        }
    │
    ▼
Orchestrator: Received PROCEED, pass summary to writer
    │
    ├── Task(code-writer, {
    │     feature: "add-user-authentication",
    │     research_summary: "JWT auth exists in src/lib/auth.ts..."
    │   })
    │
    ▼
code-writer: (isolated context ~20k tokens)
    ├── Read research_summary (500 tokens, not 15k)
    ├── Read spec
    ├── Write tests for loginUser, logoutUser
    ├── Run tests (RED)
    ├── Implement functions
    ├── Run tests (GREEN)
    └── Return: {
          files_changed: ["src/lib/auth.ts", "src/lib/auth.test.ts"],
          context_summary: "Added loginUser, logoutUser to auth.ts.
            Tests cover success and error cases. 95% coverage."
        }
    │
    ▼
Orchestrator: Received complete, pass to QA
    │
    ├── Task(code-qa, {
    │     files_changed: ["src/lib/auth.ts", "src/lib/auth.test.ts"],
    │     implementation_summary: "Added loginUser, logoutUser..."
    │   }, model: "haiku")
    │
    ▼
code-qa: (isolated context ~10k tokens)
    ├── Run typecheck → PASS
    ├── Run lint → PASS
    ├── Run tests → PASS (95% coverage)
    ├── Security check → PASS
    └── Return: { decision: "PROCEED", checks: {...} }
    │
    ▼
Orchestrator: All phases complete
    │
    ▼
User: "Implementation complete. Files changed: src/lib/auth.ts,
       src/lib/auth.test.ts. All quality checks passed."
```

---

## Error Handling

### Research Returns STOP

```text
code-researcher returns: {
  decision: "STOP",
  findings: {
    conflicts: [{ type: "naming", description: "loginUser already exists" }]
  }
}

Orchestrator action:
1. Do NOT spawn writer
2. Report to user: "Conflict found: loginUser already exists in src/lib/auth.ts.
   Options: 1) Extend existing function, 2) Rename new function, 3) Override"
3. Wait for user decision
```

### Research Returns CLARIFY

```text
code-researcher returns: {
  decision: "CLARIFY",
  questions: ["Should auth use session cookies or JWT tokens?"]
}

Orchestrator action:
1. Prompt user with questions
2. Re-run research with answers
```

### QA Returns STOP (Validation Failure)

```text
code-qa returns: {
  decision: "STOP",
  checks: {
    tests: { passed: false, failed: ["loginUser should return token"] }
  }
}

Orchestrator action (attempt 1):
1. Re-spawn code-writer with retry context:
   {
     retry_context: {
       failures: ["loginUser should return token"],
       attempt: 2
     }
   }
2. Re-run code-qa on new changes

Orchestrator action (attempt 2 fails):
1. Report to user: "QA failed after 2 attempts. Failures: ..."
2. Suggest manual intervention
```

---

## Testing Strategy

### Unit Tests

| Test Case               | Verification              |
| ----------------------- | ------------------------- |
| Handoff format valid    | Schema validation         |
| Context summary length  | < 500 tokens              |
| Decision values correct | PROCEED/STOP/CLARIFY only |

### Integration Tests

| Test Case               | Verification                    |
| ----------------------- | ------------------------------- |
| Full workflow completes | All 3 sub-agents return         |
| Context isolation       | Writer doesn't see raw research |
| Retry logic works       | Writer re-runs on QA failure    |
| Error handling          | STOP halts workflow correctly   |

---

## Migration Plan

### Phase 1: Create Sub-Agent Definitions

1. Create `.claude/sub-agents/code/` directory
2. Create code-researcher.md
3. Create code-writer.md
4. Create code-qa.md

### Phase 2: Update Orchestrator

1. Update `.claude/agents/code-agent.md` to orchestration role
2. Implement handoff creation
3. Implement sub-agent spawning
4. Implement result handling

### Phase 3: Validation

1. Test full workflow
2. Compare output quality to monolithic
3. Measure context usage
4. Verify backward compatibility

---

## Dependencies

| Component              | Version  | Purpose              |
| ---------------------- | -------- | -------------------- |
| 01-infrastructure      | Required | Templates, protocols |
| Task tool              | Built-in | Sub-agent spawning   |
| tdd-workflow skill     | Current  | TDD patterns         |
| coding-standards skill | Current  | Code quality rules   |
