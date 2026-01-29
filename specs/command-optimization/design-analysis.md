# /design Command Analysis

> **Analyzed:** 2026-01-28
> **Files Reviewed:** 11 files (command, agent, sub-agents, protocols, templates)

---

## 1. Command Flow

### Full Execution Path

```text
User: /design [feature]
    │
    ├── Preview shown (ASCII box in design.md)
    ├── User confirms [Enter] or cancels [Esc]
    │
    ▼
Orchestrator reads .claude/agents/plan-agent.md
    │
    ▼
PHASE 1: RESEARCH (parallel)
    ├── Task(domain-researcher mode=plan:requirements, Opus, run_in_background: true)
    ├── Task(domain-researcher mode=plan:dependencies, Opus, run_in_background: true)
    └── Task(domain-researcher mode=plan:tasks, Opus, run_in_background: true)
    │
    ▼
Wait for all analyzers (~5 min max)
    │
    ├── STOP? → Report conflict, halt
    ├── CLARIFY? → Ask user, re-run
    └── PROCEED → Continue
    │
    ▼
PHASE 2: AGGREGATE SUMMARIES
    └── Combine context_summary from each analyzer (~1500 tokens total)
    │
    ▼
PHASE 3: WRITE (sequential)
    └── Task(domain-writer mode=plan, analysis_summary, Sonnet)
        └── Creates: specs/{feature}/requirements.md
        └── Creates: specs/{feature}/design.md
        └── Creates: specs/{feature}/tasks.md
    │
    ▼
PHASE 4: VALIDATE (sequential)
    └── Task(quality-validator, spec_files, Haiku)
        └── Returns: { passed: true/false, issues[] }
    │
    ├── FAIL (attempt 1)? → Re-run domain-writer with issues
    └── PASS → Report final status
```

### Sub-Agent Roles

| Phase    | Sub-Agent         | Mode | Model  | Purpose                                    |
| -------- | ----------------- | ---- | ------ | ------------------------------------------ |
| RESEARCH | domain-researcher | plan | Opus   | Analyze requirements, dependencies, tasks  |
| WRITE    | domain-writer     | plan | Sonnet | Write requirements.md, design.md, tasks.md |
| VALIDATE | quality-validator | -    | Haiku  | Verify completeness, template compliance   |

---

## 2. Sub-Agent Spawning

### How Task() Is Called

**Research Phase (3 parallel tasks):**

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze requirements for [feature]",
  prompt: `
You are a domain-researcher sub-agent (mode=plan).

Analyze requirements for [feature]:
- Review existing codebase patterns
- Identify dependencies and constraints
- Gather relevant examples and context

Output: context_summary with findings.
  `,
  model: "opus",
  run_in_background: true, // For parallelism
});
```

**Write Phase (sequential):**

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Create spec files for [feature]",
  prompt: `
You are a domain-writer sub-agent (mode=plan).

Context: [context_summary from Phase 1]

Create spec files in specs/[feature]/:
- requirements.md (what and why)
- design.md (how and architecture)
- tasks.md (step-by-step implementation)
  `,
  model: "sonnet",
});
```

**Validate Phase (sequential):**

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Verify spec completeness for [feature]",
  prompt: `
You are a quality-validator sub-agent (mode=plan).

Verify specs/[feature]/ contains:
- requirements.md with clear acceptance criteria
- design.md with architecture decisions
- tasks.md with actionable steps
  `,
  model: "haiku",
});
```

### Handoff Object Structure

**Research handoff (JSON):**

```json
{
  "task_id": "feature-research",
  "phase": "research",
  "mode": "plan",
  "context": {
    "feature": "string",
    "spec_path": "string | null",
    "relevant_files": ["string"],
    "constraints": ["string"]
  },
  "instructions": "string",
  "expected_output": "structured_findings"
}
```

### Model Assignment

| Phase    | Model  | Reason                   |
| -------- | ------ | ------------------------ |
| Research | Opus   | Complex analysis         |
| Write    | Sonnet | Implementation quality   |
| Validate | Haiku  | Checklist work (cheaper) |

### Parallel Execution

- **Used:** `run_in_background: true` for RESEARCH phase (3 parallel analyzers)
- **Not used:** WRITE and VALIDATE are sequential

### Context Summary Enforcement

- **Documented:** Yes, 500 token limit per sub-agent
- **Enforced:** Through handoff protocol guidelines only (no runtime check)
- **Template provided:** Yes, in domain-researcher.md and handoff.md

---

## 3. Inputs/Outputs

### Inputs

- **Command argument:** `$ARGUMENTS` (feature name/description)
- **Source docs:** User-provided requirements or `~/basecamp/docs/` design docs

### Outputs

| File                            | Lines    | Purpose                     |
| ------------------------------- | -------- | --------------------------- |
| specs/{feature}/requirements.md | ~125     | What and why (EARS format)  |
| specs/{feature}/design.md       | ~128     | How and architecture        |
| specs/{feature}/tasks.md        | ~108     | Step-by-step implementation |
| **Total**                       | **~361** | Full spec output            |

### Template Verbosity

**requirements.md (125 lines):**

- Status header: 5 lines
- Overview: 2 lines
- Keywords reference: 35 lines (substantial)
- User stories template: 50 lines
- NFR template: 15 lines
- Out of scope: 5 lines
- Dependencies: 10 lines

**design.md (128 lines):**

- Status header: 5 lines
- Overview: 2 lines
- Architecture: 15 lines
- Component design: 15 lines
- Data models: 15 lines
- Data flow: 12 lines
- Error handling: 12 lines
- Testing strategy: 15 lines
- Implementation notes: 10 lines
- Security: 8 lines
- Alternatives: 8 lines
- Dependencies: 8 lines

**tasks.md (108 lines):**

- Status header: 5 lines
- Progress tracker: 8 lines
- Phase templates: 50 lines
- Dependencies graph: 15 lines
- Execution notes: 20 lines
- Completion criteria: 10 lines

---

## 4. Incremental Execution

### Current State

| Question                                           | Answer | Evidence           |
| -------------------------------------------------- | ------ | ------------------ |
| Can user run ONLY research phase?                  | **NO** | No flag documented |
| Can user run ONLY write phase?                     | **NO** | No flag documented |
| Can user re-run validate without re-running write? | **NO** | No checkpoint      |
| Is there a --phase flag?                           | **NO** | Not in design.md   |
| Is phase state persisted?                          | **NO** | No checkpoint file |

### What's Missing

1. **Phase flag:** `--phase=research|write|validate`
2. **Checkpoint file:** `specs/{feature}/.checkpoint.json`
3. **Resume capability:** `--resume` to continue from checkpoint

### Proposed Checkpoint Structure

```json
{
  "feature": "user-auth",
  "phase": "write",
  "started_at": "2026-01-28T10:00:00Z",
  "completed_phases": ["research"],
  "research_summary": "...(500 tokens)...",
  "files_created": [],
  "blockers": []
}
```

---

## 5. Information Flow

### What Passes Between Phases

| From → To            | What Passes               | Size         | Format     |
| -------------------- | ------------------------- | ------------ | ---------- |
| Research → Aggregate | context_summary × 3       | ~1500 tokens | Plain text |
| Aggregate → Write    | combined analysis_summary | ~1500 tokens | Plain text |
| Write → Validate     | context_summary           | ~500 tokens  | Plain text |
| Write → Validate     | files_created             | Paths only   | Array      |

### Documented Behavior

**Orchestrator memory rules (from plan-agent.md):**

```typescript
// EXTRACT only what's needed
state.analysis = {
  requirements_summary: reqResult.context_summary, // ≤500 tokens
  dependencies_summary: depResult.context_summary, // ≤500 tokens
  tasks_summary: taskResult.context_summary, // ≤500 tokens
};
// DISCARD full findings - don't store detailed results
```

**Pass summaries, not raw data (from plan-agent.md):**

```typescript
// GOOD: Pass compact summary to writer
await runWriter({
  analysis_summary: state.analysis, // ~1500 tokens total
});

// BAD: Pass full analysis results
await runWriter({
  requirements: reqResult.requirements, // ~5K tokens
  dependencies: depResult.internal_dependencies, // ~3K tokens
  tasks: taskResult.phases, // ~4K tokens
});
```

### Is context_summary Enforced?

- **Documented:** Yes (500 token limit)
- **Runtime check:** No (relies on sub-agent compliance)
- **Actual compliance:** Unknown (no telemetry)

---

## 6. Preview/Progress

### Preview

**Documented (from design.md):**

```
┌──────────────────────────────────────────────────────────────────────┐
│ /design - Conversational Spec Creation                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Phase 1: RESEARCH                                                    │
│   → domain-researcher (Opus)                                         │
│   → Analyze requirements and gather context                          │
│                                                                      │
│ Phase 2: WRITE                                                       │
│   → domain-writer (Sonnet)                                           │
│   → Create requirements.md, design.md, tasks.md                      │
│                                                                      │
│ Phase 3: VALIDATE                                                    │
│   → quality-validator (Haiku)                                        │
│   → Verify spec completeness                                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel                                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Actually implemented:** Unclear - preview skill exists but integration not verified

### Phase Transitions

**Documented outputs (from plan-agent.md):**

After RESEARCH:

```markdown
## Analysis Complete: PROCEED

### Requirements (5 functional, 2 NFR)

- Event-driven auth flow...

### Dependencies

- Extends: src/lib/session.ts...

### Tasks Preview

- 4 phases, 12 tasks identified...
```

After WRITE:

```markdown
## Spec Created: {feature}

**Location:** `specs/{feature}/`
**Files:**

- requirements.md - X requirements defined
- design.md - Architecture documented
- tasks.md - X tasks with \_Prompt fields
```

After VALIDATE:

```markdown
## Validation: PASS

| Check | Status | Details |
| EARS Format | PASS | All requirements compliant |
...
```

**Actually shown to user:** Unknown - depends on orchestrator implementation

---

## 7. Optimization Opportunities

### A. Spec Template Trimming

**Current waste:**

1. **Keywords reference (35 lines):** Move to separate reference doc
2. **Placeholder sections:** Many sections are empty templates
3. **Duplicate structure:** All three files have similar headers

**Proposed trimmed templates:**

| File            | Current | Proposed | Savings  |
| --------------- | ------- | -------- | -------- |
| requirements.md | 125     | ~60      | 52%      |
| design.md       | 128     | ~70      | 45%      |
| tasks.md        | 108     | ~50      | 54%      |
| **Total**       | **361** | **~180** | **~50%** |

### B. Summary.md for Quick View

**Proposed new file:** `specs/{feature}/summary.md`

```markdown
# {Feature} Summary

> **Status:** Draft | Approved | Implementing | Done
> **Created:** 2026-01-28
> **Tasks:** 0/12 complete

## What

[2-3 sentences from requirements.md overview]

## Why

[Business justification]

## Key Decisions

- [Decision 1]: [Rationale]
- [Decision 2]: [Rationale]

## Quick Links

- [requirements.md](./requirements.md) - Full requirements
- [design.md](./design.md) - Architecture details
- [tasks.md](./tasks.md) - Implementation plan
```

**Benefits:**

- Human can review spec in <1 min
- /implement can read summary instead of all files
- Reduces context usage by ~80%

### C. Duplication Analysis

**Duplicated across files:**

1. Status/metadata header (3x)
2. Feature name (6+ times)
3. Dependencies section (requirements + design)
4. Testing info (design + tasks)

**Proposed consolidation:**

- Single `meta.yaml` for shared metadata
- requirements.md focuses on WHAT
- design.md focuses on HOW
- tasks.md focuses on STEPS

### D. Checkpoint.json for Incremental Execution

**Proposed structure:**

```json
{
  "spec_id": "user-auth",
  "version": 1,
  "state": {
    "current_phase": "write",
    "completed": ["research"],
    "pending": ["write", "validate"]
  },
  "research": {
    "completed_at": "2026-01-28T10:05:00Z",
    "context_summary": "Auth utilities at src/lib/auth.ts..."
  },
  "write": {
    "started_at": "2026-01-28T10:05:30Z",
    "files_created": []
  },
  "validate": {
    "started_at": null,
    "passed": null
  }
}
```

**Enables:**

- `--resume` to continue from checkpoint
- `--phase=validate` to re-run only validation
- Crash recovery
- Progress tracking

### E. Machine-Readable Spec

**Proposed:** `specs/{feature}/spec.json`

```json
{
  "id": "user-auth",
  "version": 1,
  "requirements": [
    {
      "id": "REQ-1.1",
      "type": "event-driven",
      "text": "WHEN user submits login form, THE SYSTEM SHALL validate credentials",
      "acceptance": ["Returns 200 on success", "Returns 401 on failure"],
      "story": "US1"
    }
  ],
  "tasks": [
    {
      "id": "T001",
      "requirement": "REQ-1.1",
      "description": "Create login endpoint",
      "status": "pending",
      "file": "src/server/routers/auth.ts"
    }
  ],
  "dependencies": {
    "internal": ["src/lib/auth.ts"],
    "external": ["jsonwebtoken"]
  }
}
```

**Benefits:**

- /implement can parse programmatically
- Progress tracking automation
- Requirement traceability

---

## Summary: Current Gaps

| Area                  | Gap               | Impact                        |
| --------------------- | ----------------- | ----------------------------- |
| Incremental execution | No --phase flag   | Must re-run entire command    |
| State persistence     | No checkpoint     | Can't resume after crash      |
| Template verbosity    | ~360 lines output | Bloats context for /implement |
| Quick review          | No summary.md     | Human must read 3 files       |
| Machine readable      | No spec.json      | /implement parses markdown    |
| context_summary       | Not enforced      | Risk of context bloat         |

---

## Recommendations

1. **Add checkpoint.json** - Enable incremental execution
2. **Add --phase flag** - Allow phase-specific runs
3. **Create summary.md** - Quick human review (auto-generated)
4. **Trim templates** - Remove keywords reference, reduce placeholders
5. **Add spec.json** - Machine-readable for /implement
6. **Enforce context_summary** - Add token counting/validation
