# /design Command Optimization

> **Phase 2 Analysis** | **Date:** 2026-01-28
> **Prerequisites:** All command analyses + cross-command-analysis.md

---

## 1. Sub-Agent Spawning Comparison

### How Other Commands Spawn Sub-Agents

| Command    | Pattern                      | Handoff Format            | Consistency   |
| ---------- | ---------------------------- | ------------------------- | ------------- |
| /start     | Task() with implicit outputs | Stage outputs (no schema) | ⚠️ Informal   |
| /design    | Task() with context_summary  | JSON with 500-token limit | ✓ Documented  |
| /implement | Task() with context_summary  | JSON with 500-token limit | ✓ Documented  |
| /review    | Task() with loop state       | Structured JSON files     | ✓ Most mature |
| /ship      | Task() with phase outputs    | Implicit (no schema)      | ⚠️ Informal   |

### /design's Current Task() Usage

```typescript
// /design uses identical pattern to /implement
Task({
  subagent_type: "general-purpose",
  description: "...",
  prompt: `...`,
  model: "opus" | "sonnet" | "haiku",
  run_in_background: true, // Only command using parallel
});
```

**Consistency Score: HIGH**

- /design follows the same Task() pattern as all other commands
- /design is the ONLY command using `run_in_background: true` for parallel research
- Handoff format matches /implement (both use context_summary)

### Standardized Handoff Format for /design

**Adopt from cross-command-analysis.md:**

```typescript
interface SubAgentHandoff {
  task_id: string;
  phase: "research" | "write" | "validate";
  mode: "plan"; // /design always uses mode=plan
  context: {
    feature: string;
    spec_path: string | null;
    relevant_files: string[];
    constraints: string[];
    previous_summary?: string; // ≤500 tokens
  };
  instructions: string;
  expected_output:
    | "structured_findings"
    | "files_changed"
    | "validation_result";
}
```

**Recommendation:** /design's handoff format is already correct. No changes needed.

---

## 2. Incremental Execution

### Cross-Command Comparison

| Command    | Phase Flag?            | Checkpoint?                 | Resume? | Status     |
| ---------- | ---------------------- | --------------------------- | ------- | ---------- |
| /start     | No                     | Partial (start-status.json) | No      | ⚠️ Gap     |
| /design    | **No**                 | **No**                      | **No**  | **❌ Gap** |
| /implement | No                     | No                          | No      | ❌ Gap     |
| /review    | Partial (--skip flags) | Yes (3 files)               | No      | ✓ Best     |
| /ship      | No                     | No                          | No      | ❌ Gap     |

**Key Finding:** Only /review has meaningful incremental execution (via `--skip-L1-T1` etc.)

### Proposed Implementation for /design

#### 2.1 Add `--phase` Flag

```bash
# Run specific phases
/design [feature] --phase=research   # Only research
/design [feature] --phase=write      # Only write (requires research complete)
/design [feature] --phase=validate   # Only validate (requires write complete)

# Resume from checkpoint
/design [feature] --resume           # Continue from last checkpoint
```

**Implementation in design.md:**

```markdown
## Arguments & Flags

| Flag        | Description                                   | Default |
| ----------- | --------------------------------------------- | ------- |
| `[feature]` | Feature name (required)                       | -       |
| `--phase`   | Run specific phase: research\|write\|validate | all     |
| `--resume`  | Resume from checkpoint                        | false   |
| `--dry-run` | Preview without executing                     | false   |
```

#### 2.2 Checkpoint File Location

**Standardize with cross-command pattern:**

```
.claude/state/design-checkpoint.json    # Command-level state
specs/{feature}/.checkpoint.json        # Feature-specific state (alternative)
```

**Recommendation:** Use `.claude/state/design-{feature}.json` to match /review pattern.

#### 2.3 Checkpoint Schema for /design

```json
{
  "command": "design",
  "feature": "user-auth",
  "version": 1,
  "started_at": "2026-01-28T10:00:00Z",
  "updated_at": "2026-01-28T10:05:30Z",
  "state": {
    "current_phase": "write",
    "completed_phases": ["research"],
    "pending_phases": ["write", "validate"]
  },
  "phases": {
    "research": {
      "status": "complete",
      "started_at": "2026-01-28T10:00:00Z",
      "completed_at": "2026-01-28T10:05:00Z",
      "context_summary": "Auth utilities at src/lib/auth.ts using JWT. Follow src/server/routers/user.ts pattern. No conflicts. Recommend: extend auth.ts, create auth router.",
      "sub_agents": [
        { "type": "requirements", "status": "complete" },
        { "type": "dependencies", "status": "complete" },
        { "type": "tasks", "status": "complete" }
      ]
    },
    "write": {
      "status": "in_progress",
      "started_at": "2026-01-28T10:05:30Z",
      "files_created": []
    },
    "validate": {
      "status": "pending"
    }
  }
}
```

#### 2.4 Phase Execution Logic

```typescript
// Pseudocode for phase-aware execution
async function executeDesign(feature: string, flags: Flags) {
  const checkpoint = loadCheckpoint(feature);

  if (flags.resume && checkpoint) {
    // Resume from last checkpoint
    startFromPhase = checkpoint.state.current_phase;
  } else if (flags.phase) {
    // Run specific phase
    validatePhasePreconditions(flags.phase, checkpoint);
    startFromPhase = flags.phase;
  } else {
    // Run all phases
    startFromPhase = "research";
  }

  // Execute phases
  if (startFromPhase === "research") {
    const research = await runResearch(feature);
    saveCheckpoint(feature, { phase: "research", ...research });
    if (flags.phase === "research") return;
  }

  if (startFromPhase === "write" || startFromPhase === "research") {
    const write = await runWrite(
      feature,
      checkpoint.phases.research.context_summary
    );
    saveCheckpoint(feature, { phase: "write", ...write });
    if (flags.phase === "write") return;
  }

  if (startFromPhase === "validate" || startFromPhase === "write") {
    const validate = await runValidate(
      feature,
      checkpoint.phases.write.files_created
    );
    saveCheckpoint(feature, { phase: "validate", ...validate });
  }
}
```

---

## 3. Spec Verbosity

### Cross-Command Output Comparison

| Command    | Output Files       | Total Lines | Verbosity |
| ---------- | ------------------ | ----------- | --------- |
| /start     | start-status.json  | ~20         | Low       |
| /design    | 3 markdown files   | **~361**    | **High**  |
| /research  | research-notes.md  | ~50-100     | Medium    |
| /reconcile | tasks.md           | ~50         | Low       |
| /implement | Modified src files | Varies      | N/A       |

**Key Finding:** /design produces the most verbose output (~361 lines across 3 files).

### What Can Be Trimmed

#### 3.1 Keywords Reference (35 lines → 0)

**Current:** requirements.md includes 35-line EARS/RFC 2119 reference table.

**Recommendation:** Move to `.claude/docs/ears-reference.md` and link instead.

```markdown
## Requirement Keywords

> See [EARS Reference](.claude/docs/ears-reference.md) for syntax guide.
```

**Savings:** 35 lines

#### 3.2 Empty Placeholder Sections

**Current templates include:**

- Multiple "US2", "US3" placeholder sections
- Empty architecture diagrams
- Placeholder dependency tables

**Recommendation:** Remove all placeholders, only generate actual content.

**Savings:** ~40 lines across 3 files

#### 3.3 Duplicate Headers

**Duplicated 3x:**

```markdown
> **Status:** Draft
> **Created:** [YYYY-MM-DD]
> **Spec ID:** [feature-id]
```

**Recommendation:** Create `meta.yaml` for shared metadata:

```yaml
# specs/{feature}/meta.yaml
id: user-auth
status: draft
created: 2026-01-28
updated: 2026-01-28
tasks_total: 12
tasks_complete: 0
```

Each file then just links:

```markdown
# Requirements: User Auth

<!-- See meta.yaml for status -->
```

**Savings:** ~15 lines

#### 3.4 Revised Template Sizes

| File             | Current | Proposed | Savings |
| ---------------- | ------- | -------- | ------- |
| requirements.md  | 125     | 55       | 56%     |
| design.md        | 128     | 70       | 45%     |
| tasks.md         | 108     | 45       | 58%     |
| meta.yaml (new)  | 0       | 10       | -       |
| summary.md (new) | 0       | 25       | -       |
| **Total**        | **361** | **205**  | **43%** |

### 3.5 Create summary.md for Quick Human Review

**Recommended addition:** Auto-generate `specs/{feature}/summary.md`

```markdown
# User Auth - Summary

> **Status:** Draft → Approved → Implementing → Done
> **Created:** 2026-01-28
> **Progress:** 0/12 tasks

## Overview

User authentication with JWT tokens and httpOnly cookies.

## Key Decisions

1. **JWT over sessions** - Stateless, scalable
2. **httpOnly cookies** - XSS protection
3. **Extend existing auth.ts** - Don't duplicate

## Scope

- Login/logout endpoints
- Token refresh mechanism
- Password validation

## Files

- [requirements.md](./requirements.md) - 8 requirements (EARS)
- [design.md](./design.md) - Architecture decisions
- [tasks.md](./tasks.md) - 12 implementation tasks

## Quick Links

- Implementation: `/implement user-auth`
- Review: `specs/user-auth/tasks.md`
```

**Benefits:**

1. Human can review spec in <60 seconds
2. /implement can read summary (~25 lines) instead of 3 files (~200 lines)
3. Status visible at a glance

---

## 4. Information Handoff to /implement

### What /implement Needs (from implement-analysis.md)

| Information      | Source            | Format                      |
| ---------------- | ----------------- | --------------------------- |
| Approval status  | design.md header  | "Status: Approved"          |
| Routing keywords | design.md content | Backend/Frontend indicators |
| Requirements     | requirements.md   | EARS format                 |
| Tasks            | tasks.md          | Checkbox list               |
| Architecture     | design.md         | Text description            |

### Is /design Producing the Right Artifacts?

| Artifact        | Produced? | Consumed by /implement? |
| --------------- | --------- | ----------------------- |
| requirements.md | ✓ Yes     | ✓ Yes                   |
| design.md       | ✓ Yes     | ✓ Yes (routing)         |
| tasks.md        | ✓ Yes     | ✓ Yes                   |
| summary.md      | ❌ No     | Would help              |
| spec.json       | ❌ No     | Would help              |
| checkpoint.json | ❌ No     | Would help              |

### 4.1 Add Machine-Readable spec.json

**Why:** /implement currently parses markdown with regex. JSON is more reliable.

**Proposed:** `specs/{feature}/spec.json`

```json
{
  "id": "user-auth",
  "version": 1,
  "status": "approved",
  "routing": {
    "agents": ["code-agent"],
    "keywords_detected": ["tRPC", "API", "JWT"]
  },
  "requirements": [
    {
      "id": "REQ-1.1",
      "story": "US1",
      "type": "event-driven",
      "text": "WHEN user submits login form, THE SYSTEM SHALL validate credentials",
      "acceptance": [
        "Returns 200 with JWT on valid credentials",
        "Returns 401 on invalid credentials"
      ]
    }
  ],
  "tasks": [
    {
      "id": "T001",
      "phase": 1,
      "requirement": "REQ-1.1",
      "description": "Create auth tRPC router",
      "file": "src/server/routers/auth.ts",
      "status": "pending"
    }
  ],
  "dependencies": {
    "internal": ["src/lib/auth.ts"],
    "external": ["jsonwebtoken", "bcrypt"]
  }
}
```

**Benefits:**

1. /implement parses programmatically (no regex)
2. Task status tracked persistently
3. Requirement traceability automated
4. Routing pre-computed

### 4.2 Handoff Flow Improvement

**Current:**

```
/design → specs/{feature}/*.md → /implement parses markdown
```

**Proposed:**

```
/design → specs/{feature}/*.md + spec.json + summary.md
         ↓
/implement reads spec.json for:
  - Routing decision (agents field)
  - Task list (tasks array)
  - Dependencies (dependencies object)
         ↓
/implement updates spec.json task statuses as work completes
```

---

## 5. Preview/Progress

### Cross-Command Preview Comparison

| Command    | Preview Format        | Standardized?    |
| ---------- | --------------------- | ---------------- |
| /start     | ASCII box with stages | Yes (documented) |
| /design    | ASCII box with phases | Yes (documented) |
| /implement | Routing preview       | Partial          |
| /review    | Loop indicators       | Different format |
| /ship      | ASCII box with stages | Yes (documented) |

### Unified Preview Template (from cross-command-analysis.md)

```
┌──────────────────────────────────────────────────────────────────────┐
│ /{command} - {Description}                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CONTEXT                                                              │
│   Working Dir: {path}                                                │
│   Feature: {feature_name}                                            │
│   Checkpoint: {none | resume from phase X}                           │
│                                                                      │
│ PHASES                                                               │
│   1. RESEARCH (domain-researcher × 3 / Opus)                         │
│      → Analyze requirements, dependencies, tasks                     │
│                                                                      │
│   2. WRITE (domain-writer / Sonnet)                                  │
│      → Create requirements.md, design.md, tasks.md                   │
│                                                                      │
│   3. VALIDATE (quality-validator / Haiku)                            │
│      → Verify EARS format, acceptance criteria, task prompts         │
│                                                                      │
│ OUTPUT                                                               │
│   specs/{feature}/                                                   │
│     ├── requirements.md                                              │
│     ├── design.md                                                    │
│     ├── tasks.md                                                     │
│     ├── summary.md                                                   │
│     └── spec.json                                                    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel  [?] Help                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Phase Transition Display

**Adopt unified progress pattern:**

```
/design user-auth

Phase 1/3: RESEARCH
  ● Running: domain-researcher × 3 (Opus, parallel)
  ├── Analyzing requirements...
  ├── Checking dependencies...
  └── Decomposing tasks...
  Elapsed: 2m 15s

[===================>          ] 45% | Phase 1/3 | 2m 15s

Phase Status:
  ● Phase 1: RESEARCH (in progress)
  ○ Phase 2: WRITE (pending)
  ○ Phase 3: VALIDATE (pending)
```

**After completion:**

```
✓ Phase 1: RESEARCH (2m 30s)
  → Found 3 existing patterns, 0 conflicts
  → Identified 12 tasks across 4 phases

✓ Phase 2: WRITE (45s)
  → Created specs/user-auth/requirements.md (8 requirements)
  → Created specs/user-auth/design.md
  → Created specs/user-auth/tasks.md (12 tasks)
  → Created specs/user-auth/summary.md
  → Created specs/user-auth/spec.json

✓ Phase 3: VALIDATE (15s)
  → EARS format: PASS
  → Acceptance criteria: PASS
  → Task prompts: PASS

Spec ready for implementation.
Next: /implement user-auth
```

---

## Deliverables

### 1. Proposed File Changes

| File                              | Change Type | Description                            |
| --------------------------------- | ----------- | -------------------------------------- |
| `.claude/commands/design.md`      | MODIFY      | Add --phase, --resume, --dry-run flags |
| `.claude/agents/plan-agent.md`    | MODIFY      | Add checkpoint read/write logic        |
| `specs/templates/requirements.md` | MODIFY      | Remove keywords reference (~35 lines)  |
| `specs/templates/design.md`       | MODIFY      | Remove empty placeholders (~20 lines)  |
| `specs/templates/tasks.md`        | MODIFY      | Remove empty placeholders (~30 lines)  |
| `specs/templates/summary.md`      | CREATE      | New template for quick review          |
| `specs/templates/spec.json`       | CREATE      | Machine-readable spec schema           |
| `specs/templates/meta.yaml`       | CREATE      | Shared metadata template               |
| `.claude/docs/ears-reference.md`  | CREATE      | Moved keywords reference               |
| `.claude/state/`                  | USE         | Checkpoint files location              |

### 2. Unified Patterns Adopted

| Pattern                             | Source                    | Adoption in /design       |
| ----------------------------------- | ------------------------- | ------------------------- |
| Task() spawning                     | All commands (100%)       | ✓ Already compliant       |
| context_summary handoff             | /implement, cross-command | ✓ Already compliant       |
| Model selection (Opus/Sonnet/Haiku) | All commands              | ✓ Already compliant       |
| Parallel execution                  | /design unique            | ✓ Keep (best practice)    |
| Checkpoint schema                   | /review, cross-command    | **ADOPT**                 |
| Preview format                      | cross-command template    | **ADOPT** (minor updates) |
| Progress indicators                 | cross-command template    | **ADOPT**                 |
| State file location                 | `.claude/state/`          | **ADOPT**                 |

### 3. /design-Specific Optimizations

#### Priority 1: Critical (Enable Incremental Execution)

| #   | Optimization                | Effort  | Impact              |
| --- | --------------------------- | ------- | ------------------- |
| 1   | Add checkpoint.json support | 2 hours | Resume capability   |
| 2   | Add --phase flag            | 1 hour  | Phase-specific runs |
| 3   | Add --resume flag           | 1 hour  | Crash recovery      |

#### Priority 2: High (Reduce Verbosity)

| #   | Optimization                         | Effort | Impact       |
| --- | ------------------------------------ | ------ | ------------ |
| 4   | Move keywords reference to docs      | 30 min | -35 lines    |
| 5   | Remove empty placeholders            | 30 min | -50 lines    |
| 6   | Create summary.md template           | 1 hour | Quick review |
| 7   | Create meta.yaml for shared metadata | 30 min | DRY          |

#### Priority 3: Medium (Improve /implement Handoff)

| #   | Optimization                     | Effort  | Impact            |
| --- | -------------------------------- | ------- | ----------------- |
| 8   | Create spec.json template        | 2 hours | Machine-readable  |
| 9   | Pre-compute routing in spec.json | 1 hour  | Faster /implement |
| 10  | Track task status in spec.json   | 1 hour  | Progress tracking |

#### Priority 4: Polish (UX Improvements)

| #   | Optimization               | Effort | Impact        |
| --- | -------------------------- | ------ | ------------- |
| 11  | Standardize preview format | 1 hour | Consistency   |
| 12  | Add progress indicators    | 1 hour | User feedback |
| 13  | Add --dry-run flag         | 1 hour | Safety        |

---

## Implementation Order

```
Week 1: Foundation
├── #1: Checkpoint schema
├── #2: --phase flag
├── #3: --resume flag
└── #4-5: Template trimming

Week 2: Handoff Improvements
├── #6: summary.md
├── #7: meta.yaml
├── #8: spec.json
└── #9-10: Routing + status tracking

Week 3: Polish
├── #11: Preview format
├── #12: Progress indicators
└── #13: --dry-run
```

---

## Summary

| Dimension             | Current State      | After Optimization  |
| --------------------- | ------------------ | ------------------- |
| Incremental Execution | ❌ None            | ✓ --phase, --resume |
| Template Verbosity    | 361 lines          | ~205 lines (-43%)   |
| Quick Human Review    | ❌ Read 3 files    | ✓ summary.md        |
| Machine Handoff       | ❌ Parse markdown  | ✓ spec.json         |
| State Persistence     | ❌ None            | ✓ checkpoint.json   |
| Preview/Progress      | ⚠️ Documented only | ✓ Standardized      |

**Key Win:** /design becomes the first command with full incremental execution support, setting the pattern for /implement and /ship to follow.
