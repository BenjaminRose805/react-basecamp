# /implement Command Analysis

## Summary

The `/implement` command is a sophisticated orchestration system that routes approved specs to specialized agents (code, ui, docs, eval) and executes them through a 3-phase sub-agent workflow (Research → Write → Validate). The architecture is well-structured but lacks critical incremental execution capabilities.

---

## 1. Routing Logic

### How /implement decides which agent to use

The routing skill (`SKILL.md`) analyzes spec content using keyword detection:

| Keywords                                           | Detected Type | Routes To  |
| -------------------------------------------------- | ------------- | ---------- |
| tRPC, Prisma, API, database, model, schema, server | Backend       | code-agent |
| React, component, form, UI, hook, page, layout     | Frontend      | ui-agent   |
| README, documentation, guide, tutorial             | Docs          | docs-agent |
| evaluation, grader, benchmark, pass@k, LLM test    | Eval          | eval-agent |

### Routing Behavior

- **Explicit or Inferred?** INFERRED - routing is automatic based on spec content
- **Source file:** Reads `specs/{feature}/design.md` and checks for "Status: Approved"
- **Multi-agent routing:** Supported sequentially (e.g., `code-agent → ui-agent` for full-stack)
- **Ambiguous specs:** Prompts user to clarify implementation type

### Routing Algorithm

```typescript
function routeImplement(specPath: string): RoutingResult {
  const spec = readSpec(specPath);
  const sections = detectSections(spec.content);
  const agents = [];

  if (hasBackendIndicators(sections)) agents.push("code-agent");
  if (hasFrontendIndicators(sections)) agents.push("ui-agent");
  if (hasDocsIndicators(sections)) agents.push("docs-agent");
  if (hasEvalIndicators(sections)) agents.push("eval-agent");

  return { agents, reason, spec };
}
```

---

## 2. Command Flow per Agent

### Unified 3-Phase Pattern

All 4 agents follow an **identical** orchestration pattern:

```text
Agent (Orchestrator, Opus)
    │
    ├── Phase 1: RESEARCH
    │   └── domain-researcher (mode={domain}, Opus)
    │   └── Returns: decision, context_summary (≤500 tokens)
    │
    ├── Phase 2: WRITE/BUILD/CREATE
    │   └── domain-writer (mode={domain}, Sonnet)
    │   └── Returns: files_changed, context_summary
    │
    └── Phase 3: VALIDATE
        └── quality-validator (Haiku)
        └── Returns: PASS/FAIL with issues
```

### Agent-Specific Differences

| Agent      | Phase 2 Name | Mode     | TDD/EDD | Validation Focus               |
| ---------- | ------------ | -------- | ------- | ------------------------------ |
| code-agent | IMPLEMENT    | backend  | TDD     | Types, tests, lint, build      |
| ui-agent   | BUILD        | frontend | TDD     | Types, tests, a11y, responsive |
| docs-agent | WRITE        | docs     | None    | Code examples, links           |
| eval-agent | CREATE       | eval     | EDD     | Dry runs, coverage             |

### Are Flows Identical?

**YES** - The orchestration structure is identical across all 4 agents:

1. Same 3-phase pattern
2. Same sub-agent templates with mode parameter
3. Same handoff protocol
4. Same context_summary constraints

---

## 3. Sub-Agent Spawning

### Task() Call Pattern

All agents use identical spawning:

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Research/Write/Validate [feature]",
  prompt: `...`,
  model: "opus" | "sonnet" | "haiku",
});
```

### Handoff Object Structure

Identical JSON structure across all agents:

```json
{
  "task_id": "string",
  "phase": "research | write | validate",
  "mode": "backend | frontend | docs | eval",
  "context": {
    "feature": "string",
    "spec_path": "string | null",
    "relevant_files": ["..."],
    "constraints": ["..."],
    "previous_findings": "context_summary from previous phase"
  },
  "instructions": "string",
  "expected_output": "structured_findings | files_changed | validation_result"
}
```

### Model Assignment

Consistent across all agents:

| Sub-Agent         | Model  | Purpose        |
| ----------------- | ------ | -------------- |
| domain-researcher | Opus   | Deep research  |
| domain-writer     | Sonnet | Implementation |
| quality-validator | Haiku  | Fast checks    |

### context_summary Enforcement

**Uniform** - All agents enforce:

- Max 500 tokens (~400 words)
- Pass summaries, not raw data
- Include only essential info for next phase

### Dynamic Sizing

All agents use the same sizing heuristics:

```typescript
if (agentCount === 1) {
  spawn domain-writer(mode={domain})
} else if (agentCount === 2) {
  spawn domain-researcher(mode={domain})
  spawn domain-writer(mode={domain})
} else {
  spawn domain-researcher(mode={domain})
  spawn domain-writer(mode={domain})
  spawn quality-validator
}
```

---

## 4. Inputs/Outputs

### Spec Files Read

| File                              | Purpose               |
| --------------------------------- | --------------------- |
| `specs/{feature}/design.md`       | Architecture, routing |
| `specs/{feature}/requirements.md` | EARS requirements     |
| `specs/{feature}/tasks.md`        | Implementation tasks  |

### How Tasks Are Identified

- Tasks are read from `tasks.md` in the spec directory
- Each task has a checkbox format: `- [ ] Task description`
- Writer marks tasks complete: `- [x] Task description`

### Files Created/Modified

Tracked in writer output:

```json
{
  "files_created": [{ "path": "...", "purpose": "..." }],
  "files_modified": [{ "path": "...", "changes": "..." }],
  "tests_written": [{ "path": "...", "test_count": N }]
}
```

### Completion Tracking

- **Primary:** Task checkboxes in `tasks.md`
- **Secondary:** Writer's `files_changed` in output
- **No separate checkpoint file exists**

---

## 5. Incremental Execution (CRITICAL GAPS)

### Current State

| Capability                      | Supported?  | Notes                        |
| ------------------------------- | ----------- | ---------------------------- |
| Run single task (`--task=T001`) | **NO**      | Not implemented              |
| Run single phase (`--phase=1`)  | **NO**      | Not implemented              |
| Resume from failure             | **NO**      | Starts fresh each time       |
| Skip completed tasks            | **PARTIAL** | Checkboxes exist but ignored |
| Mark task "done manually"       | **NO**      | No mechanism                 |
| Checkpoint file                 | **NO**      | Only tasks.md exists         |

### What Happens If User Runs /implement Twice?

1. **All tasks re-execute** - No skip logic for completed tasks
2. **Files may be overwritten** - No conflict detection
3. **Checkboxes reset or duplicated** - Undefined behavior

### Current Command Signature

```bash
/implement    # No arguments supported
```

### Missing Features for True Task-by-Task Execution

1. **Task ID system** - Tasks need unique IDs (T001, T002, etc.)
2. **--task flag** - `--task=T001,T002` for specific tasks
3. **--phase flag** - `--phase=1` for phase-only execution
4. **Checkpoint file** - Track completed tasks persistently
5. **Skip logic** - Read checkboxes before executing
6. **Resume capability** - Continue from last failure
7. **Manual completion** - Mark task done without executing

---

## 6. TDD Workflow

### Enforcement by Agent

| Agent      | Methodology | Enforced? | Coverage Tracked?            |
| ---------- | ----------- | --------- | ---------------------------- |
| code-agent | TDD         | **Yes**   | Yes (`pnpm test --coverage`) |
| ui-agent   | TDD         | **Yes**   | Yes                          |
| docs-agent | None        | N/A       | No                           |
| eval-agent | EDD         | **Yes**   | Yes (pass@k metrics)         |

### TDD Workflow (code-agent, ui-agent)

```text
For each task:
1. RED: Write failing test first
2. GREEN: Minimal code to pass
3. REFACTOR: Clean up while green
4. Mark task [x] complete
```

### Coverage Tracking

- **Command:** `pnpm test:run --coverage`
- **Threshold:** 70% minimum (mentioned in quality-validator)
- **Reporting:** Included in validation phase output

---

## 7. Optimization Opportunities

### Duplicated Logic Across Agents

| Duplicated Element       | Where             |
| ------------------------ | ----------------- |
| 3-phase orchestration    | All 4 agent files |
| Dynamic sizing logic     | All 4 agent files |
| Task() spawning pattern  | All 4 agent files |
| Error handling (retry)   | All 4 agent files |
| Context compaction rules | All 4 agent files |
| Model assignment table   | All 4 agent files |

### Shared Implementation Template Opportunity

```typescript
// Proposed: .claude/agents/templates/orchestrator-base.md
interface OrchestratorConfig {
  name: string;
  domain: "backend" | "frontend" | "docs" | "eval";
  phases: {
    research: { mode: string; model: "opus" };
    write: {
      mode: string;
      model: "sonnet";
      name: "implement" | "build" | "write" | "create";
    };
    validate: { model: "haiku" };
  };
  skills: string[];
  mcpServers: string[];
}

// Agent files become thin wrappers:
// code-agent.md → domain: "backend", phases.write.name: "implement"
// ui-agent.md → domain: "frontend", phases.write.name: "build"
```

### Needed for True Task-by-Task Execution

1. **Task Registry System**

   ```typescript
   interface Task {
     id: string; // T001, T002
     phase: number;
     description: string;
     status: "pending" | "in_progress" | "complete" | "skipped" | "failed";
     checkpoint?: string;
   }
   ```

2. **Checkpoint File** (`specs/{feature}/.checkpoint.json`)

   ```json
   {
     "feature": "user-auth",
     "started_at": "2026-01-28T10:00:00Z",
     "tasks": {
       "T001": { "status": "complete", "completed_at": "..." },
       "T002": { "status": "in_progress", "started_at": "..." }
     },
     "current_phase": 2,
     "current_task": "T002"
   }
   ```

3. **Command Flags**

   ```bash
   /implement                    # Run all remaining tasks
   /implement --task=T001        # Run specific task
   /implement --task=T001,T002   # Run multiple tasks
   /implement --phase=1          # Run phase 1 only
   /implement --resume           # Resume from last checkpoint
   /implement --skip=T003        # Skip specific task
   /implement --mark-done=T003   # Mark task complete without running
   ```

4. **Execution Flow with Incremental Support**
   ```text
   /implement
       │
       ├── Load checkpoint (or create new)
       │
       ├── For each task NOT complete:
       │   ├── Check --skip / --task filters
       │   ├── Execute if not filtered out
       │   ├── Update checkpoint
       │   └── On failure: save checkpoint, exit
       │
       └── All tasks complete → ready for /ship
   ```

---

## Appendix: File Inventory

### Command & Routing

- `.claude/commands/implement.md` - Command definition
- `.claude/skills/routing/SKILL.md` - Agent routing logic

### Agent Orchestrators

- `.claude/agents/code-agent.md` - Backend orchestrator
- `.claude/agents/ui-agent.md` - Frontend orchestrator
- `.claude/agents/docs-agent.md` - Documentation orchestrator
- `.claude/agents/eval-agent.md` - Evaluation orchestrator

### Sub-Agent Templates

- `.claude/sub-agents/templates/domain-researcher.md` - Research template
- `.claude/sub-agents/templates/domain-writer.md` - Writer template
- `.claude/sub-agents/templates/quality-validator.md` - Validator template

### Skills Referenced

- `routing` - Agent selection
- `preview` - Execution plan display
- `progress` - Real-time status
- `tdd-workflow` - Red-Green-Refactor
- `qa-checks` - Final verification
