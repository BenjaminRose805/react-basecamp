# Design: Sub-Agent Infrastructure

> **Status:** Completed
> **Created:** 2026-01-26
> **Consolidated:** 2026-01-28

## Overview

This consolidated design document describes the implemented sub-agent architecture, including template consolidation (37 → 11), handoff protocols, dynamic phase sizing, and context compaction strategies.

---

## Architecture Evolution

### Before: Monolithic Agents with 37 Sub-Agents

```text
┌─────────────────────────────────────────────────────────┐
│  Monolithic Agent (e.g., code-agent)                    │
├─────────────────────────────────────────────────────────┤
│  RESEARCH phase   │ Accumulates search results         │
│  IMPLEMENT phase  │ + Implementation context (bloat)   │
│  VALIDATE phase   │ + Validation results (near limit)  │
└─────────────────────────────────────────────────────────┘

Sub-agents: 37 individual templates
- 5 domain-specific researchers
- 5 domain-specific writers
- 5 domain-specific validators
- 4 quality checkers
- 3 plan analyzers
- 3 git analyzers
- 3 workflow analyzers
- 9 unique specialized agents

Total tokens: 17,200
Context risk: High on complex specs
```

### After: Isolated Sub-Agents with 11 Templates

```text
┌─────────────────────────────────────────────────────────┐
│  Orchestrator Agent (lightweight)                       │
├─────────────────────────────────────────────────────────┤
│  Determines sub-agent count (1-7)                       │
│  Spawns sub-agents via Task tool                        │
│  Receives compacted handoffs (max 500 tokens)           │
│  Aggregates results                                     │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ (isolated)  │ ───► │ (isolated)  │ ───► │ (isolated)  │
│ ~15% ctx    │      │ ~25% ctx    │      │ ~10% ctx    │
└─────────────┘      └─────────────┘      └─────────────┘
     returns              returns              returns
  context_summary      files_changed           PASS/FAIL

Sub-agents: 11 consolidated templates with mode parameters
Total tokens: 6,400 (63% reduction)
Context efficiency: Each phase isolated, 50% vs 100% monolithic
```

---

## Directory Structure

```text
.claude/
├── agents/
│   ├── plan-agent.md        # Orchestrates domain-researcher + domain-writer
│   ├── code-agent.md        # Orchestrates domain-researcher + domain-writer (code mode)
│   ├── ui-agent.md          # Orchestrates domain-researcher + domain-writer (ui mode)
│   ├── docs-agent.md        # Orchestrates domain-researcher + domain-writer (docs mode)
│   ├── eval-agent.md        # Orchestrates domain-researcher + domain-writer (eval mode)
│   ├── check-agent.md       # Orchestrates parallel quality-checker instances
│   └── git-agent.md         # Orchestrates git-content-generator + git-executor
│
├── sub-agents/
│   ├── README.md
│   ├── templates/
│   │   ├── domain-researcher.md      # Mode: plan/code/ui/docs/eval
│   │   ├── domain-writer.md          # Mode: code/ui/docs/eval/plan
│   │   ├── quality-validator.md      # Domain-agnostic
│   │   ├── quality-checker.md        # Mode: build/type/lint/test/security
│   │   ├── spec-analyzer.md          # Mode: analyze/review/format/reconcile
│   │   ├── git-content-generator.md  # Mode: commit/pr/general
│   │   ├── code-analyzer.md          # Mode: workflow/debug/refactor/fix
│   │   ├── git-executor.md           # Unique (command execution)
│   │   ├── pr-reviewer.md            # Unique (complex review)
│   │   ├── security-scanner.md       # Unique (security patterns)
│   │   └── parallel-executor.md      # Unique (parallel coordination)
│   │
│   ├── profiles/
│   │   ├── reader.md        # Read, Grep, Glob, mcp__cclsp__*
│   │   ├── researcher.md    # reader + WebFetch, WebSearch, mcp__context7__*
│   │   ├── writer.md        # researcher + Write, Edit, Bash
│   │   └── orchestrator.md  # All tools + Task
│   │
│   └── protocols/
│       ├── handoff.md           # Handoff JSON schema
│       └── orchestration.md     # Orchestration patterns
```

---

## Consolidated Template Specifications

### 1. domain-researcher (Opus)

**Replaces:** 5 agents (plan-researcher, code-researcher, ui-researcher, docs-researcher, eval-researcher)

**Mode Parameter:**

- `plan` - Search for existing specs, similar features
- `code` - Search for backend patterns (tRPC, Prisma, API)
- `ui` - Search for frontend patterns (React, components, hooks)
- `docs` - Search for existing documentation
- `eval` - Search for existing eval suites

**Profile:** researcher (Read, Grep, Glob, WebFetch, WebSearch, mcp**cclsp**_, mcp**context7**_)

**Output Format:**

```json
{
  "decision": "PROCEED | STOP | CLARIFY",
  "findings": {
    "existing_implementations": [...],
    "conflicts": [...],
    "consolidation_opportunities": [...]
  },
  "context_summary": "max 500 tokens"
}
```

**Behavior:**

1. Search for existing implementations matching task
2. Check for naming/pattern conflicts
3. Identify reusable patterns and consolidation opportunities
4. Summarize findings compactly
5. Return decision with reasoning

---

### 2. domain-writer (Sonnet)

**Replaces:** 5 agents (plan-writer, code-writer, ui-builder, docs-writer, eval-writer)

**Mode Parameter:**

- `code` - TDD, backend patterns (tRPC, Prisma)
- `ui` - TDD, frontend patterns (React, hooks)
- `docs` - Markdown, documentation standards
- `eval` - EDD, evaluation framework
- `plan` - Spec creation (EARS format)

**Profile:** writer (Read, Write, Edit, Bash, Grep, Glob, mcp**cclsp**\*)

**Output Format:**

```json
{
  "status": "complete | failed",
  "files_changed": [...],
  "tests_added": [...],
  "context_summary": "max 500 tokens"
}
```

**Behavior:**

1. Review research context_summary (NOT raw research)
2. Read spec if provided
3. Follow domain-specific patterns:
   - **code/ui:** TDD (tests first), keep functions <30 lines
   - **docs:** Markdown standards, code examples
   - **eval:** EDD framework, grader implementation
   - **plan:** EARS format, requirements/design/tasks
4. Return list of changed files

---

### 3. quality-validator (Haiku)

**Replaces:** 5 agents (all domain validators - behavior was identical)

**Mode Parameter:** None (domain-agnostic)

**Profile:** reader + Bash (Read, Grep, Glob, Bash, mcp**cclsp**\*)

**Output Format:**

```json
{
  "status": "PASS | FAIL",
  "checks": {
    "typecheck": "pass | fail",
    "lint": "pass | fail",
    "tests": "pass | fail",
    "build": "pass | fail"
  },
  "errors": [...]
}
```

**Behavior:**

1. Run type checking (`pnpm typecheck`)
2. Run linting (`pnpm lint`)
3. Run tests (`pnpm test:run`)
4. Check build (`pnpm build`)
5. Aggregate results
6. Return PASS if all pass, FAIL with errors if any fail

---

### 4. quality-checker (Haiku)

**Replaces:** 4 agents (build-checker, type-checker, lint-checker, test-runner)

**Mode Parameter:**

- `build` - Run `pnpm build`
- `type` - Run `pnpm typecheck`
- `lint` - Run `pnpm lint`
- `test` - Run `pnpm test:run`
- `security` - Run security scan

**Profile:** reader + Bash

**Output Format:**

```json
{
  "check_type": "build | type | lint | test | security",
  "status": "pass | fail",
  "output": "command output",
  "duration_ms": 1234
}
```

**Used For:** Parallel execution by check-agent (spawn 4-5 instances concurrently)

---

### 5. spec-analyzer (Opus)

**Replaces:** 3 agents (spec-analyzer, spec-reviewer, spec-formatter)

**Mode Parameter:**

- `analyze` - Analyze spec for completeness/clarity
- `review` - Review spec against patterns
- `format` - Format spec to EARS standard
- `reconcile` - Analyze CodeRabbit comments for action items

**Profile:** researcher

**Output Format:**

```json
{
  "mode": "analyze | review | format | reconcile",
  "findings": {...},
  "recommendations": [...],
  "context_summary": "max 500 tokens"
}
```

---

### 6. git-content-generator (Sonnet)

**Replaces:** 3 agents (change-analyzer, pr-analyzer, content-generator)

**Mode Parameter:**

- `commit` - Analyze changes and generate commit message
- `pr` - Analyze feature and generate PR description
- `general` - General content generation

**Profile:** reader + Bash (git commands)

**Output Format:**

```json
{
  "content_type": "commit | pr | general",
  "title": "short title",
  "body": "detailed description",
  "metadata": {...}
}
```

---

### 7. code-analyzer (Opus)

**Replaces:** 4 agents (workflow-analyzer, investigator, refactor-analyzer, fix-investigator)

**Mode Parameter:**

- `workflow` - Analyze workflow routing decisions
- `debug` - Investigate errors and failures
- `refactor` - Analyze code for refactoring opportunities
- `fix` - Analyze bug reports and error messages

**Profile:** researcher + Bash

**Output Format:**

```json
{
  "mode": "workflow | debug | refactor | fix",
  "analysis": {...},
  "recommendations": [...],
  "context_summary": "max 500 tokens"
}
```

---

### 8-11. Unique Sub-Agents (Preserved)

- **git-executor** (Haiku) - Executes git commands with validation
- **pr-reviewer** (Opus) - Complex PR review logic with deep analysis
- **security-scanner** (Haiku) - Specialized security pattern detection
- **parallel-executor** (Haiku) - Coordinates parallel sub-agent execution

---

## Dynamic Phase Sizing Algorithm

### Sizing Heuristics

```javascript
function determineSubAgentCount(context) {
  let count = 1; // Start with minimum

  // File count contribution (40%)
  if (context.fileCount === 1) count += 0;
  else if (context.fileCount <= 3) count += 1;
  else if (context.fileCount <= 7) count += 2;
  else count += 3;

  // Task count contribution (30%)
  if (context.taskCount <= 2) count += 0;
  else if (context.taskCount <= 5) count += 1;
  else count += 2;

  // Module spread contribution (20%)
  if (context.moduleCount > 1) count += 1;

  // Effort estimate contribution (10%)
  if (context.effort === "large") count += 1;

  // Cap at reasonable maximum
  return Math.min(count, 7);
}
```

### Sizing Examples

| Scenario                            | Files | Tasks | Modules | Effort | Sub-Agents | Phases                                     |
| ----------------------------------- | ----- | ----- | ------- | ------ | ---------- | ------------------------------------------ |
| /ship commit + PR                   | N/A   | 1     | N/A     | small  | 1          | git-content-generator                      |
| Fix typo in README                  | 1     | 1     | 1       | small  | 1          | domain-writer                              |
| Add simple endpoint                 | 2     | 2     | 1       | small  | 2          | researcher + writer                        |
| Add feature (5 tasks, 3 files)      | 3     | 5     | 2       | medium | 3          | researcher + writer + validator            |
| Refactor module (10 files, 3 tasks) | 10    | 3     | 1       | medium | 4          | researcher + analyzer + writer + validator |
| Large feature (20 files, 12 tasks)  | 20    | 12    | 4       | large  | 7          | Split by module boundaries                 |

---

## Handoff Protocol

### Request Schema (Orchestrator → Sub-Agent)

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

### Response Schema (Sub-Agent → Orchestrator)

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

### Decision Flow

| Decision  | When to Use                | Orchestrator Action           |
| --------- | -------------------------- | ----------------------------- |
| `PROCEED` | No blockers, work complete | Continue to next phase        |
| `STOP`    | Critical conflict or error | Halt workflow, report to user |
| `CLARIFY` | Ambiguous requirements     | Prompt user for clarification |

---

## Context Compaction Strategy

### Phase Boundary Compaction

**Automatic:** Between every sub-agent phase

1. Sub-agent completes and returns full result
2. Orchestrator extracts only `context_summary` field (max 500 tokens)
3. Orchestrator discards raw sub-agent output
4. Next sub-agent receives only compacted summary

**Example:**

- Research phase produces 15,000 tokens of search results
- Orchestrator extracts 500-token summary: "Found JWT auth in src/lib/auth.ts. Pattern: bearer tokens. No conflicts."
- Writer receives 500 tokens instead of 15,000 (97% reduction)

### Compaction Rules

**Include in context_summary:**

- Actionable findings (file paths, pattern names, conflict details)
- Decision reasoning (why PROCEED/STOP/CLARIFY)
- Key recommendations for next phase

**Exclude from context_summary:**

- Search queries and tool invocations
- Full file contents
- Intermediate reasoning steps
- Error messages already resolved

### Manual Compaction

**Command:** `/compact`

**Triggers automatically:**

- When context exceeds 70% capacity
- After 50+ tool calls
- On user request

**Preserves:**

- Current task state (task_id, feature, spec)
- Recent decisions and findings (last 3 phases)
- Essential context for continuation

**Achieves:** 50%+ context reduction while preserving critical information

---

## Data Flow Example

### Sequential Chain: "Add user authentication"

```text
User Request: "Add user authentication"
    │
    ▼
Orchestrator analyzes complexity
    ├─ Files: 3 (auth route, middleware, tests)
    ├─ Tasks: 4 (create route, add middleware, write tests, update docs)
    ├─ Modules: 2 (backend, docs)
    └─ Decision: Spawn 3 sub-agents
    │
    ▼
Sub-Agent 1: domain-researcher (isolated context, Opus)
    ├─ Searches for existing auth code
    ├─ Finds: src/lib/auth.ts with JWT utils
    ├─ Checks: No conflicts, can extend
    ├─ Returns: { decision: "PROCEED", context_summary: "JWT auth exists at src/lib/auth.ts with bearer token pattern. Can extend for new route. No conflicts." }
    │   (500 tokens vs 15,000 tokens raw search results)
    │
    ▼
Sub-Agent 2: domain-writer (fresh context + summary, Sonnet)
    ├─ Reads: context_summary only (500 tokens)
    ├─ Reads: spec file if provided
    ├─ Writes: Tests first (TDD)
    ├─ Implements: Auth route + middleware
    ├─ Returns: { files_changed: ["src/routes/auth.ts", "src/middleware/verify-token.ts", "tests/auth.test.ts"], context_summary: "Added /auth/login route with JWT middleware. Tests passing." }
    │   (500 tokens for validator)
    │
    ▼
Sub-Agent 3: quality-validator (fresh context + changes, Haiku)
    ├─ Runs: typecheck (pass)
    ├─ Runs: lint (pass)
    ├─ Runs: tests (pass)
    ├─ Returns: { status: "PASS", checks: {typecheck: "pass", lint: "pass", tests: "pass"} }
    │
    ▼
Orchestrator reports success to user
    └─ "Added authentication with 3 files changed. All checks passed."
```

**Total Context:**

- Monolithic approach: 45,000 tokens in single context (risk of overflow)
- Sub-agent approach: 45,000 tokens across 3 isolated contexts (safe, efficient)

---

## Migration Path (Completed)

### Phase 1: Create Consolidated Templates ✓

Created 11 new consolidated templates with mode parameters:

- domain-researcher.md
- domain-writer.md
- quality-validator.md
- quality-checker.md
- spec-analyzer.md
- git-content-generator.md
- code-analyzer.md

Preserved 4 unique sub-agents:

- git-executor.md
- pr-reviewer.md
- security-scanner.md
- parallel-executor.md

### Phase 2: Update Orchestrators ✓

Updated all 7 agents to use consolidated templates:

- plan-agent.md → uses domain-researcher, domain-writer, quality-validator
- code-agent.md → uses domain-researcher (mode=code), domain-writer (mode=code)
- ui-agent.md → uses domain-researcher (mode=ui), domain-writer (mode=ui)
- docs-agent.md → uses domain-researcher (mode=docs), domain-writer (mode=docs)
- eval-agent.md → uses domain-researcher (mode=eval), domain-writer (mode=eval)
- check-agent.md → uses parallel quality-checker instances
- git-agent.md → uses git-content-generator, git-executor

### Phase 3: Remove Old Templates ✓

Deleted 26 obsolete sub-agent files (kept consolidated 11)

### Phase 4: Verification ✓

- Backward compatibility verified (identical outputs)
- Performance benchmarked (context savings confirmed)
- Documentation updated (CLAUDE.md, README.md)

---

## Success Metrics (Achieved)

| Metric                      | Target          | Achieved      |
| --------------------------- | --------------- | ------------- |
| Template count reduction    | 37 → 11 (70%)   | 37 → 11 (70%) |
| Token savings               | 60%+            | 63%           |
| Context overhead reduction  | 30%+            | 47% (simple)  |
| Behavioral compatibility    | 100%            | 100%          |
| Simple task sub-agent count | 1 (down from 3) | 1             |

---

**Status:** Design fully implemented and verified.
