# Design: Sub-Agent Consolidation & Dynamic Sizing

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** sub-agent-consolidation

## Overview

This design consolidates 37 sub-agents into 11 templates and implements adaptive phase sizing based on task complexity.

---

## Current State Analysis

### Sub-Agent Inventory (37 Total)

| Category           | Current Sub-Agents                                                                | Count |
| ------------------ | --------------------------------------------------------------------------------- | ----- |
| Domain Researchers | plan-researcher, code-researcher, ui-researcher, docs-researcher, eval-researcher | 5     |
| Domain Writers     | plan-writer, code-writer, ui-builder, docs-writer, eval-writer                    | 5     |
| Domain Validators  | plan-validator, code-validator, ui-validator, docs-validator, eval-validator      | 5     |
| Quality Checkers   | build-checker, type-checker, lint-checker, test-runner                            | 4     |
| Plan Analyzers     | spec-analyzer, spec-reviewer, spec-formatter                                      | 3     |
| Git Analyzers      | change-analyzer, pr-analyzer                                                      | 2     |
| Workflow Analyzers | workflow-analyzer, investigator, refactor-analyzer                                | 3     |
| Security           | security-scanner                                                                  | 1     |
| Git Execution      | git-executor                                                                      | 1     |
| PR Review          | pr-reviewer                                                                       | 1     |
| Parallel Execution | parallel-executor                                                                 | 1     |
| Task Decomposition | task-decomposer                                                                   | 1     |
| Content Generation | content-generator (for /ship)                                                     | 1     |
| Reconciliation     | reconciliation-analyzer, reconciliation-executor                                  | 2     |
| Spec Creation      | spec-creator                                                                      | 1     |
| Fix Workflow       | fix-investigator                                                                  | 1     |

### Duplication Analysis

**Domain Researchers (5 → 1):**
All 5 have identical structure:

- Search for existing implementations (Grep, Glob, Read)
- Check for conflicts
- Report PROCEED/STOP/CLARIFY
- Only difference: domain-specific search patterns

**Domain Writers (5 → 1):**
All 5 have identical structure:

- Review research findings
- Read spec
- Implement following patterns
- Report files changed
- Only difference: domain-specific patterns (TDD for code/ui, markdown for docs, eval framework for eval)

**Domain Validators (5 → 1):**
All 5 have identical structure:

- Run type check
- Run tests
- Check build
- Report PASS/FAIL
- Only difference: none (all domain-agnostic)

**Quality Checkers (4 → 1):**
All 4 just run a pnpm command and report output:

- `build-checker`: `pnpm build`
- `type-checker`: `pnpm typecheck`
- `lint-checker`: `pnpm lint`
- `test-runner`: `pnpm test:run`

---

## Consolidated Architecture

### Target: 11 Templates (Down from 37)

| Template                | Replaces                                                                          | Mode Parameter              | Model  |
| ----------------------- | --------------------------------------------------------------------------------- | --------------------------- | ------ |
| `domain-researcher`     | plan-researcher, code-researcher, ui-researcher, docs-researcher, eval-researcher | plan/code/ui/docs/eval      | Opus   |
| `domain-writer`         | plan-writer, code-writer, ui-builder, docs-writer, eval-writer                    | code/ui/docs/eval           | Sonnet |
| `quality-validator`     | plan-validator, code-validator, ui-validator, docs-validator, eval-validator      | none                        | Haiku  |
| `quality-checker`       | build-checker, type-checker, lint-checker, test-runner                            | build/type/lint/test        | Haiku  |
| `spec-analyzer`         | spec-analyzer, spec-reviewer, spec-formatter                                      | analyze/review/format       | Opus   |
| `git-content-generator` | change-analyzer, pr-analyzer, content-generator                                   | commit/pr/general           | Sonnet |
| `code-analyzer`         | workflow-analyzer, investigator, refactor-analyzer, fix-investigator              | workflow/debug/refactor/fix | Opus   |
| `git-executor`          | git-executor (unique)                                                             | none                        | Haiku  |
| `pr-reviewer`           | pr-reviewer (unique)                                                              | none                        | Opus   |
| `security-scanner`      | security-scanner (unique)                                                         | none                        | Haiku  |
| `parallel-executor`     | parallel-executor (unique template)                                               | none                        | Haiku  |

### Removed Sub-Agents

| Sub-Agent               | Reason                                       | Replacement                    |
| ----------------------- | -------------------------------------------- | ------------------------------ |
| task-decomposer         | Not actually used (effort estimates ignored) | Remove entirely                |
| reconciliation-analyzer | Identical to spec-analyzer in reconcile mode | `spec-analyzer` mode=reconcile |
| reconciliation-executor | Identical to domain-writer                   | `domain-writer`                |
| spec-creator            | Identical to plan-writer                     | `domain-writer` mode=plan      |

---

## Template Specifications

### 1. domain-researcher

**File:** `.claude/sub-agents/templates/domain-researcher.md`

**Purpose:** Research existing code, check conflicts, identify consolidation opportunities

**Mode Parameter:**

- `plan`: Search for existing specs, similar features
- `code`: Search for backend patterns (tRPC, Prisma, API)
- `ui`: Search for frontend patterns (React, components, hooks)
- `docs`: Search for existing documentation
- `eval`: Search for existing eval suites

**Tools:** Read, Grep, Glob, mcp**cclsp**\*

**Model:** Opus

**Output Format:**

```json
{
  "decision": "PROCEED | STOP | CLARIFY",
  "findings": {
    "existing_implementations": [],
    "conflicts": [],
    "consolidation_opportunities": []
  },
  "context_summary": "max 500 tokens for next phase"
}
```

**Template Structure:**

```markdown
You are a domain-researcher sub-agent (mode: {{mode}}).

TASK: Research existing {{domain_label}} implementations

MODE-SPECIFIC SEARCH PATTERNS:
{{#if mode == "code"}}

- Search for tRPC routers, Prisma models, API endpoints
  {{/if}}
  {{#if mode == "ui"}}
- Search for React components, hooks, UI patterns
  {{/if}}
  ... (other modes)

WORKFLOW:

1. Search for existing implementations
2. Check for conflicts
3. Identify consolidation opportunities
4. Report decision

OUTPUT: JSON with decision and findings
```

---

### 2. domain-writer

**File:** `.claude/sub-agents/templates/domain-writer.md`

**Purpose:** Implement feature following domain-specific patterns

**Mode Parameter:**

- `code`: TDD, backend patterns (tRPC, Prisma)
- `ui`: TDD, frontend patterns (React, hooks)
- `docs`: Markdown, documentation standards
- `eval`: EDD, evaluation framework
- `plan`: Spec creation (EARS format)

**Tools:** Read, Write, Edit, Grep, Glob, Bash, mcp**cclsp**\*

**Model:** Sonnet

**Output Format:**

```json
{
  "status": "complete | failed",
  "files_changed": [],
  "tests_added": [],
  "context_summary": "max 500 tokens for validation phase"
}
```

**Template Structure:**

```markdown
You are a domain-writer sub-agent (mode: {{mode}}).

TASK: Implement {{feature}} following {{mode}} patterns

MODE-SPECIFIC PATTERNS:
{{#if mode == "code"}}

- TDD: Write failing test first
- Use tRPC for API endpoints
- Use Prisma for database
  {{/if}}
  {{#if mode == "ui"}}
- TDD: Write component tests first
- Use React hooks
- Follow component patterns
  {{/if}}
  ... (other modes)

WORKFLOW:

1. Review research findings
2. Read spec
3. Follow TDD (if code/ui) or standards (if docs/eval)
4. Implement
5. Report files changed

OUTPUT: JSON with status and files
```

---

### 3. quality-validator

**File:** `.claude/sub-agents/templates/quality-validator.md`

**Purpose:** Validate implementation with type check, tests, build

**Mode Parameter:** None (domain-agnostic)

**Tools:** Bash, Read

**Model:** Haiku

**Output Format:**

```json
{
  "status": "PASS | FAIL",
  "checks": {
    "typecheck": "pass | fail",
    "tests": "pass | fail",
    "build": "pass | fail"
  },
  "errors": []
}
```

**Template Structure:**

```markdown
You are a quality-validator sub-agent.

TASK: Validate implementation quality

CHECKS:

1. Type check: pnpm typecheck
2. Tests: pnpm test:run
3. Build: pnpm build

WORKFLOW:

1. Run all checks
2. Collect errors
3. Report PASS or FAIL

OUTPUT: JSON with check results
```

---

### 4. quality-checker

**File:** `.claude/sub-agents/templates/quality-checker.md`

**Purpose:** Run a single quality check (for parallel execution)

**Mode Parameter:**

- `build`: Run `pnpm build`
- `type`: Run `pnpm typecheck`
- `lint`: Run `pnpm lint`
- `test`: Run `pnpm test:run`
- `security`: Run security scan

**Tools:** Bash, Read

**Model:** Haiku

**Output Format:**

```json
{
  "check_type": "build | type | lint | test | security",
  "status": "pass | fail",
  "output": "command output",
  "duration_ms": 1234
}
```

**Template Structure:**

```markdown
You are a quality-checker sub-agent (check_type: {{check_type}}).

TASK: Run {{check_type}} quality check

COMMAND:
{{#if check_type == "build"}}pnpm build{{/if}}
{{#if check_type == "type"}}pnpm typecheck{{/if}}
{{#if check_type == "lint"}}pnpm lint{{/if}}
{{#if check_type == "test"}}pnpm test:run{{/if}}
{{#if check_type == "security"}}pnpm audit && check patterns{{/if}}

WORKFLOW:

1. Run command
2. Capture output
3. Report status

OUTPUT: JSON with check results
```

---

### 5. spec-analyzer

**File:** `.claude/sub-agents/templates/spec-analyzer.md`

**Purpose:** Analyze specs, CodeRabbit comments, or format specs

**Mode Parameter:**

- `analyze`: Analyze spec for completeness and clarity
- `review`: Review spec against patterns
- `format`: Format spec to EARS standard
- `reconcile`: Analyze CodeRabbit comments for action items

**Tools:** Read, Grep, Glob

**Model:** Opus

**Output Format:**

```json
{
  "mode": "analyze | review | format | reconcile",
  "findings": {},
  "recommendations": [],
  "context_summary": "max 500 tokens"
}
```

---

### 6. git-content-generator

**File:** `.claude/sub-agents/templates/git-content-generator.md`

**Purpose:** Generate commit messages or PR descriptions

**Mode Parameter:**

- `commit`: Analyze changes and generate commit message
- `pr`: Analyze feature and generate PR description
- `general`: General content generation

**Tools:** Bash (git commands), Read, Grep

**Model:** Sonnet

**Output Format:**

```json
{
  "content_type": "commit | pr | general",
  "title": "short title",
  "body": "detailed description",
  "metadata": {}
}
```

---

### 7. code-analyzer

**File:** `.claude/sub-agents/templates/code-analyzer.md`

**Purpose:** Analyze code for workflows, debugging, refactoring, or fixes

**Mode Parameter:**

- `workflow`: Analyze workflow routing decisions
- `debug`: Investigate errors and failures
- `refactor`: Analyze code for refactoring opportunities
- `fix`: Analyze bug reports and error messages

**Tools:** Read, Grep, Glob, mcp**cclsp**\*, Bash

**Model:** Opus

**Output Format:**

```json
{
  "mode": "workflow | debug | refactor | fix",
  "analysis": {},
  "recommendations": [],
  "context_summary": "max 500 tokens"
}
```

---

## Dynamic Phase Sizing Algorithm

### Sizing Heuristics

Orchestrators determine sub-agent count using these heuristics:

| Heuristic       | Weight | Measurement                                    |
| --------------- | ------ | ---------------------------------------------- |
| File count      | 40%    | 1 file = 1 agent, 2-3 files = 2-3, 4+ = 4-7    |
| Task count      | 30%    | From spec tasks.md or user description         |
| Module spread   | 20%    | Changes span multiple modules = more agents    |
| Effort estimate | 10%    | Small/Medium/Large (if available from context) |

### Sizing Formula

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

| Scenario                            | Files | Tasks | Modules | Effort | Sub-Agents | Reasoning                                  |
| ----------------------------------- | ----- | ----- | ------- | ------ | ---------- | ------------------------------------------ |
| /ship commit + PR                   | N/A   | 1     | N/A     | small  | 1          | Single content generator                   |
| Fix typo in README                  | 1     | 1     | 1       | small  | 1          | Single writer                              |
| Add simple endpoint                 | 2     | 2     | 1       | small  | 2          | Researcher + writer                        |
| Add feature (5 tasks, 3 files)      | 3     | 5     | 2       | medium | 3          | Researcher + writer + validator            |
| Refactor module (10 files, 3 tasks) | 10    | 3     | 1       | medium | 4          | Researcher + analyzer + writer + validator |
| Large feature (20 files, 12 tasks)  | 20    | 12    | 4       | large  | 7          | Split by module boundaries                 |

---

## Orchestrator Changes

### Before (Hardcoded 3 Phases)

```javascript
// plan-agent orchestrator (old)
await spawnSubAgent("plan-researcher", { task: "research" });
await spawnSubAgent("plan-writer", { task: "write spec" });
await spawnSubAgent("plan-validator", { task: "validate spec" });
```

### After (Dynamic Sizing)

```javascript
// plan-agent orchestrator (new)
const context = {
  fileCount: estimateFileCount(),
  taskCount: estimateTaskCount(),
  moduleCount: estimateModuleSpread(),
  effort: estimateEffort(),
};

const agentCount = determineSubAgentCount(context);

if (agentCount === 1) {
  // Simple task - just write
  await spawnSubAgent("domain-writer", { mode: "plan", task: "create spec" });
} else if (agentCount === 2) {
  // Medium task - research + write
  await spawnSubAgent("domain-researcher", { mode: "plan", task: "research" });
  await spawnSubAgent("domain-writer", { mode: "plan", task: "write spec" });
} else {
  // Complex task - research + write + validate
  await spawnSubAgent("domain-researcher", { mode: "plan", task: "research" });
  await spawnSubAgent("domain-writer", { mode: "plan", task: "write spec" });
  await spawnSubAgent("quality-validator", { task: "validate spec" });
}
```

---

## Migration Path

### Phase 1: Create Consolidated Templates

1. Create 7 new consolidated templates:
   - `domain-researcher.md`
   - `domain-writer.md`
   - `quality-validator.md`
   - `quality-checker.md`
   - `spec-analyzer.md`
   - `git-content-generator.md`
   - `code-analyzer.md`

2. Add mode parameter support to each template

3. Preserve 4 unique sub-agents as-is

---

### Phase 2: Update Orchestrators (One at a Time)

For each agent (plan, code, ui, docs, eval, check, git):

1. Add sizing heuristics
2. Update sub-agent spawn calls to use consolidated templates
3. Pass mode parameters
4. Test unchanged behavior
5. Commit

---

### Phase 3: Remove Old Templates

1. Delete 26 obsolete sub-agent files
2. Update sub-agents README
3. Update CLAUDE.md architecture diagram

---

### Phase 4: Logging and Tuning

1. Add orchestrator decision logging
2. Monitor sub-agent count choices
3. Tune heuristics based on real usage

---

## Token Savings Calculation

### Before Consolidation

| Category           | Count  | Tokens/Template | Total Tokens |
| ------------------ | ------ | --------------- | ------------ |
| Domain Researchers | 5      | 500             | 2,500        |
| Domain Writers     | 5      | 500             | 2,500        |
| Domain Validators  | 5      | 500             | 2,500        |
| Quality Checkers   | 4      | 300             | 1,200        |
| Plan Analyzers     | 3      | 400             | 1,200        |
| Git Analyzers      | 2      | 400             | 800          |
| Workflow Analyzers | 3      | 500             | 1,500        |
| Unique             | 10     | 500             | 5,000        |
| **Total**          | **37** | —               | **17,200**   |

### After Consolidation

| Category              | Count  | Tokens/Template | Total Tokens |
| --------------------- | ------ | --------------- | ------------ |
| domain-researcher     | 1      | 800             | 800          |
| domain-writer         | 1      | 900             | 900          |
| quality-validator     | 1      | 400             | 400          |
| quality-checker       | 1      | 500             | 500          |
| spec-analyzer         | 1      | 600             | 600          |
| git-content-generator | 1      | 500             | 500          |
| code-analyzer         | 1      | 700             | 700          |
| Unique (preserved)    | 4      | 500             | 2,000        |
| **Total**             | **11** | —               | **6,400**    |

**Savings:** 17,200 - 6,400 = **10,800 tokens (63% reduction)**

---

## Context Efficiency Gains

### Invocation Overhead Reduction

**Before (Always 3 Sub-Agents):**

- Simple task (fix typo): 3 sub-agents × 500 tokens = 1,500 tokens overhead
- Medium task (add endpoint): 3 sub-agents × 500 tokens = 1,500 tokens overhead
- Complex task (feature): 3 sub-agents × 500 tokens = 1,500 tokens overhead

**After (Adaptive Sizing):**

- Simple task (fix typo): 1 sub-agent × 800 tokens = 800 tokens overhead (47% savings)
- Medium task (add endpoint): 2 sub-agents × 800 tokens = 1,600 tokens overhead (similar)
- Complex task (feature): 3-4 sub-agents × 800 tokens = 2,400-3,200 tokens overhead (appropriate for complexity)

**Average Savings:** ~30% context overhead reduction for typical workload (assuming 50% simple, 30% medium, 20% complex)

---

## Backward Compatibility Strategy

### Requirement

All 7 agents must produce identical outputs before and after consolidation.

### Verification Approach

1. **Capture baselines:** Run current agents on test scenarios, save outputs
2. **Implement consolidation:** Update orchestrators to use consolidated templates
3. **Compare outputs:** Run same test scenarios, diff outputs
4. **Iterate:** Fix any behavioral differences
5. **Approve:** Only merge when outputs are identical

### Test Scenarios

| Agent | Test Scenario                             | Expected Output                       |
| ----- | ----------------------------------------- | ------------------------------------- |
| plan  | Create spec for "add user authentication" | Spec with requirements, design, tasks |
| code  | Implement tRPC router for work items      | Router file + tests                   |
| ui    | Build button component                    | Component file + tests                |
| docs  | Document API endpoint                     | Markdown documentation                |
| eval  | Create eval suite for agent builder       | Eval config + cases + graders         |
| check | Verify code quality                       | Pass/fail on build/type/lint/test     |
| git   | Commit changes and create PR              | Commit message + PR description       |

---

## Risks and Mitigations

| Risk                                  | Likelihood | Impact | Mitigation                                            |
| ------------------------------------- | ---------- | ------ | ----------------------------------------------------- |
| Mode parameter bugs                   | Medium     | High   | Validate mode parameters at template entry            |
| Wrong sub-agent count chosen          | Medium     | Medium | Conservative bias (prefer more agents), log decisions |
| Performance regression                | Low        | Medium | Benchmark before/after, ensure <100ms overhead        |
| Breaking orchestrator logic           | Low        | High   | Test each agent individually, incremental rollout     |
| Difficulty debugging mode-based logic | Medium     | Low    | Add mode to all log messages                          |

---

## Success Metrics

| Metric                      | Target          | Measurement                         |
| --------------------------- | --------------- | ----------------------------------- |
| Template count reduction    | 37 → 11 (70%)   | File count in sub-agents/templates/ |
| Token savings               | 60%+            | Sum of template sizes               |
| Context overhead reduction  | 30%+            | Average tokens per operation        |
| Behavioral compatibility    | 100%            | Test scenario output diffs          |
| Orchestrator decision time  | <100ms overhead | Time from context → sub-agent spawn |
| Simple task sub-agent count | 1 (down from 3) | Log analysis                        |

---
