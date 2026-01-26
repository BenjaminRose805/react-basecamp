# Design: Sub-Agent Infrastructure

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-01

## Overview

This design establishes the foundational infrastructure for sub-agent delegation. The approach uses Claude Code's built-in Task tool to spawn sub-agents with isolated context windows, structured handoff protocols for efficient context transfer, and permission profiles for security.

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  Monolithic Agent (e.g., code-agent)                        │
├─────────────────────────────────────────────────────────────┤
│  RESEARCH phase   │ Accumulates search results, patterns    │
│  IMPLEMENT phase  │ + Implementation context (bloated)      │
│  VALIDATE phase   │ + Validation results (near limit)       │
└─────────────────────────────────────────────────────────────┘
Context: 100% used, high risk of overflow on complex specs
```

### Target State

```text
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator Agent (lightweight)                           │
├─────────────────────────────────────────────────────────────┤
│  Spawns sub-agents via Task tool                            │
│  Receives compacted handoffs                                │
│  Aggregates results                                         │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ (isolated)  │ ───► │ (isolated)  │ ───► │ (isolated)  │
│ ~15% ctx    │      │ ~25% ctx    │      │ ~10% ctx    │
└─────────────┘      └─────────────┘      └─────────────┘
     returns              returns              returns
  context_summary      files_changed           PASS/FAIL

Total context: ~50% (vs 100% monolithic)
```

---

## Directory Structure

```text
.claude/
├── sub-agents/
│   ├── README.md                    # Sub-agent system documentation
│   ├── templates/
│   │   ├── researcher.md            # Generic research sub-agent
│   │   ├── writer.md                # Generic implementation sub-agent
│   │   ├── validator.md             # Generic QA sub-agent
│   │   └── parallel-executor.md     # Parallel task runner
│   ├── profiles/
│   │   ├── read-only.md             # Read, Grep, Glob only
│   │   ├── research.md              # + WebFetch, WebSearch
│   │   ├── writer.md                # + Write, Edit, Bash
│   │   └── full-access.md           # All tools
│   └── protocols/
│       ├── handoff.md               # Handoff format specification
│       └── orchestration.md         # Orchestration patterns
```

---

## Component Design

### 1. Handoff Protocol

The handoff protocol defines structured communication between orchestrators and sub-agents.

#### Request Schema (Orchestrator → Sub-Agent)

```json
{
  "task_id": "string",
  "phase": "research | write | validate",
  "context": {
    "feature": "string",
    "spec_path": "string | null",
    "relevant_files": ["string"],
    "constraints": ["string"],
    "previous_findings": "string | null"
  },
  "instructions": "string",
  "expected_output": "structured_findings | files_changed | validation_result"
}
```

#### Response Schema (Sub-Agent → Orchestrator)

```json
{
  "task_id": "string",
  "phase": "research | write | validate",
  "status": "complete | partial | blocked",
  "decision": "PROCEED | STOP | CLARIFY",
  "findings": {
    "type": "object",
    "description": "Phase-specific structured data"
  },
  "context_summary": "string (max 500 tokens)",
  "tokens_used": "number",
  "issues": ["string"]
}
```

#### Decision Values

| Decision  | When to Use                | Orchestrator Action           |
| --------- | -------------------------- | ----------------------------- |
| `PROCEED` | No blockers, work complete | Continue to next phase        |
| `STOP`    | Critical conflict or error | Halt workflow, report to user |
| `CLARIFY` | Ambiguous requirements     | Prompt user for clarification |

### 2. Sub-Agent Templates

#### Researcher Template

```markdown
# Sub-Agent: Researcher

## Role

Find existing implementations, identify conflicts, gather context.

## Profile

research (Read, Grep, Glob, WebFetch, WebSearch, mcp**cclsp**_, mcp**context7**_)

## Input

Handoff request with task description, file hints, constraints.

## Output

{
"decision": "PROCEED | STOP | CLARIFY",
"findings": {
"existing_implementations": [...],
"conflicts": [...],
"patterns_found": [...],
"recommendations": [...]
},
"context_summary": "Compact summary for writer"
}

## Behavior

1. Search for existing code matching the task
2. Check for naming/pattern conflicts
3. Identify reusable patterns
4. Summarize findings (max 500 tokens)
5. Return decision with reasoning
```

#### Writer Template

```markdown
# Sub-Agent: Writer

## Role

Implement functionality following project patterns and TDD.

## Profile

writer (Read, Write, Edit, Bash, Grep, Glob, mcp**cclsp**\*)

## Input

Handoff request with research summary, spec reference.

## Output

{
"status": "complete | partial | blocked",
"files_changed": [...],
"tests_written": [...],
"context_summary": "Changes made for validator"
}

## Behavior

1. Read research context_summary (NOT raw research)
2. Read spec if provided
3. Write tests first (TDD)
4. Implement to pass tests
5. Keep functions under 30 lines
6. Return list of changed files
```

#### Validator Template

```markdown
# Sub-Agent: Validator

## Role

Verify implementation quality through automated checks.

## Profile

read-only + Bash (Read, Grep, Glob, Bash, mcp**cclsp**\*)

## Input

Handoff request with files_changed, expected behavior.

## Output

{
"decision": "PROCEED | STOP",
"checks": {
"types": { "passed": boolean, "errors": [...] },
"lint": { "passed": boolean, "errors": [...] },
"tests": { "passed": boolean, "coverage": number },
"security": { "passed": boolean, "issues": [...] }
},
"context_summary": "Validation result summary"
}

## Behavior

1. Run type checking (pnpm typecheck)
2. Run linting (pnpm lint)
3. Run tests (pnpm test:run)
4. Check for security issues
5. Aggregate results
6. Return PROCEED if all pass, STOP if any fail
```

### 3. Permission Profiles

#### read-only Profile

```yaml
name: read-only
description: Read and search only, no modifications
tools:
  - Read
  - Grep
  - Glob
  - mcp__cclsp__find_definition
  - mcp__cclsp__find_references
  - mcp__cclsp__get_hover
  - mcp__cclsp__find_workspace_symbols
use_cases:
  - Code review
  - Security audit
  - Pattern analysis
```

#### research Profile

```yaml
name: research
description: Read, search, and web lookup
tools:
  - Read
  - Grep
  - Glob
  - WebFetch
  - WebSearch
  - mcp__cclsp__*
  - mcp__context7__*
use_cases:
  - Documentation lookup
  - Pattern research
  - Conflict detection
```

#### writer Profile

```yaml
name: writer
description: Full file operations and build commands
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__cclsp__*
use_cases:
  - Code implementation
  - Test writing
  - File creation
```

#### full-access Profile

```yaml
name: full-access
description: All tools including Task for sub-agent spawning
tools:
  - All tools
  - Task
use_cases:
  - Workflow orchestration
  - Complex multi-phase operations
```

### 4. Orchestration Patterns

#### Pattern 1: Sequential Chain

For dependent phases where each builds on the previous.

```text
Orchestrator
    │
    ├── Task(researcher, handoff) ──► [isolated context]
    │       │
    │       └── returns: { decision: PROCEED, context_summary: "..." }
    │
    ├── Task(writer, { previous_findings: context_summary }) ──► [isolated]
    │       │
    │       └── returns: { files_changed: [...], context_summary: "..." }
    │
    └── Task(validator, { files_changed, context_summary }) ──► [isolated]
            │
            └── returns: { decision: PROCEED | STOP }
```

**Pseudocode:**

```typescript
// Sequential chain orchestration
async function executeSequentialChain(task: Task) {
  // Phase 1: Research
  const research = await spawnSubAgent({
    subagent_type: "general-purpose",
    prompt: buildResearchHandoff(task),
    allowed_tools: RESEARCH_PROFILE,
    model: "sonnet",
  });

  if (research.decision !== "PROCEED") {
    return handleNonProceed(research);
  }

  // Phase 2: Write (receives compacted context)
  const implementation = await spawnSubAgent({
    subagent_type: "general-purpose",
    prompt: buildWriterHandoff(task, research.context_summary),
    allowed_tools: WRITER_PROFILE,
    model: "sonnet",
  });

  // Phase 3: Validate (receives compacted context)
  const validation = await spawnSubAgent({
    subagent_type: "general-purpose",
    prompt: buildValidatorHandoff(implementation),
    allowed_tools: VALIDATOR_PROFILE,
    model: "haiku", // Cheaper for checklist-based work
  });

  return validation;
}
```

#### Pattern 2: Parallel Executor

For independent tasks that can run concurrently.

```text
Orchestrator
    │
    ├── Task(type-checker, files) ────┐
    ├── Task(lint-checker, files) ────┼──► [parallel, isolated]
    ├── Task(test-runner, files) ─────┤
    └── Task(security-scan, files) ───┘
            │
            └── aggregate results
```

**Pseudocode:**

```typescript
// Parallel executor orchestration
async function executeParallel(tasks: SubTask[]) {
  // Spawn all sub-agents in parallel
  const results = await Promise.all(
    tasks.map((task) =>
      spawnSubAgent({
        subagent_type: task.type,
        prompt: task.handoff,
        allowed_tools: task.profile,
        model: "haiku",
        run_in_background: true,
      })
    )
  );

  // Aggregate results
  return aggregateResults(results);
}

function aggregateResults(results: SubAgentResult[]) {
  const allPassed = results.every((r) => r.decision === "PROCEED");
  const issues = results.flatMap((r) => r.issues || []);

  return {
    decision: allPassed ? "PROCEED" : "STOP",
    checks: Object.fromEntries(results.map((r) => [r.phase, r.findings])),
    issues,
  };
}
```

#### Pattern 3: Conditional Branch

For workflows that vary based on analysis.

```text
Orchestrator
    │
    ├── Task(analyzer, task)
    │       │
    │       └── returns: { complexity: 'simple' | 'complex' }
    │
    ├── if simple:
    │   └── Task(quick-writer, task)
    │
    └── if complex:
        ├── Task(researcher, task)
        ├── Task(architect, research)
        └── Task(writer, architecture)
```

---

## Data Flow

### Sequential Chain Flow

```text
User Request: "Add user authentication"
    │
    ▼
Orchestrator creates handoff request
    │
    ▼
Researcher sub-agent (isolated context)
    ├── Searches for existing auth code
    ├── Finds: src/lib/auth.ts with JWT utils
    ├── Returns: { decision: PROCEED, context_summary: "JWT auth exists..." }
    │
    ▼
Writer sub-agent (fresh context + summary only)
    ├── Reads: context_summary (50 tokens vs 5000 tokens raw)
    ├── Implements: new auth functions
    ├── Returns: { files_changed: [...], context_summary: "Added login..." }
    │
    ▼
Validator sub-agent (fresh context + changes summary)
    ├── Runs: typecheck, lint, tests
    ├── Returns: { decision: PROCEED, checks: {...} }
    │
    ▼
Orchestrator reports success to user
```

### Context Savings Analysis

| Phase     | Monolithic                      | Sub-Agent                        | Savings              |
| --------- | ------------------------------- | -------------------------------- | -------------------- |
| Research  | 15,000 tokens                   | 15,000 tokens                    | 0% (same work)       |
| Write     | 35,000 tokens (research + impl) | 20,000 tokens (summary + impl)   | 43%                  |
| Validate  | 45,000 tokens (all accumulated) | 10,000 tokens (changes + checks) | 78%                  |
| **Total** | **45,000 tokens**               | **45,000 across 3 isolated**     | **Each under limit** |

Key insight: Total tokens may be similar, but each sub-agent stays well under context limits, enabling longer specs.

---

## Error Handling

### Sub-Agent Timeout

```text
Error: Sub-agent did not respond within timeout
```

**Response:** Orchestrator retries once with simplified handoff. If retry fails, report partial results and prompt user.

### Sub-Agent Returns STOP

```text
Response: { decision: "STOP", reason: "Critical conflict found" }
```

**Response:** Orchestrator halts workflow, surfaces reason to user, suggests resolution.

### Sub-Agent Returns CLARIFY

```text
Response: { decision: "CLARIFY", questions: ["Which auth provider?"] }
```

**Response:** Orchestrator prompts user with questions, then re-runs sub-agent with answers.

### Validation Failure

```text
Response: { decision: "STOP", checks: { tests: { passed: false } } }
```

**Response:** Orchestrator re-runs writer sub-agent with failure details. Max 2 retries before escalating to user.

---

## Testing Strategy

### Unit Tests

| Test Case               | Verification                    |
| ----------------------- | ------------------------------- |
| Handoff JSON validates  | Schema validation passes        |
| Decision values correct | Only PROCEED/STOP/CLARIFY       |
| Profile tools correct   | Each profile has expected tools |

### Integration Tests

| Test Case                    | Verification                              |
| ---------------------------- | ----------------------------------------- |
| Sequential chain completes   | All 3 phases return results               |
| Parallel executor aggregates | All results combined correctly            |
| Context isolation works      | Sub-agents don't see each other's context |
| Handoff compaction works     | context_summary < 500 tokens              |

---

## Security Considerations

### Tool Permission Enforcement

- Sub-agents receive only their profile's tools via `allowed_tools` parameter
- Orchestrator validates tool usage against profile before execution

### Context Leakage Prevention

- Sub-agents only receive handoff request, not full conversation history
- `context_summary` field limits what passes between phases

### Sensitive Data

- Handoff protocol SHOULD NOT include secrets or credentials
- Research sub-agents SHOULD NOT search for .env or credential files

---

## Alternatives Considered

### Alternative 1: Custom MCP Server for Orchestration

**Rejected:** Adds complexity without benefit. Built-in Task tool provides sufficient orchestration capability.

### Alternative 2: Shared Context with Summarization

**Rejected:** Summarization is lossy and doesn't provide true context isolation. Sub-agent approach gives clean separation.

### Alternative 3: Single Agent with Explicit Compaction

**Rejected:** Compaction within a single context is less effective than fresh context per phase. Sub-agents provide cleaner isolation.

---

## Dependencies

| Component       | Version              | Purpose               |
| --------------- | -------------------- | --------------------- |
| Task tool       | Claude Code built-in | Sub-agent spawning    |
| Existing agents | Current              | Migration targets     |
| CLAUDE.md       | Current              | Documentation updates |
