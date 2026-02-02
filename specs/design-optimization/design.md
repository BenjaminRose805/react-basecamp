# Design: Design Incremental Execution

> **Status:** Approved
> **Created:** 2026-01-31
> **Spec ID:** design-incremental-execution

## Overview

This design extends the `/design` command from a simple 3-phase sequential flow into a flag-driven, checkpoint-persisted, interactively-gated pipeline. The core change: each phase boundary becomes a persistence point and optional user interaction point, enabling incremental execution, crash recovery, and quality gates without changing the fundamental RESEARCH -> WRITE -> VALIDATE architecture.

---

## Architecture

### Current State

```text
/design {feature}
    │
    ├── RESEARCH  (domain-researcher x3, parallel)
    │     └── Returns: context_summary
    │
    ├── WRITE     (domain-writer)
    │     └── Creates: requirements.md, design.md, tasks.md
    │
    └── VALIDATE  (quality-validator)
          └── Returns: { passed, issues[] }

No flags. No checkpoint. No interactive gates. No summary.md/spec.json.
```

### Target State

```text
/design {feature} [--phase=X] [--resume] [--no-checkpoint] [--dry-run]
    │
    ├── Parse flags via extended parseFlags()
    ├── Load checkpoint (if --resume)
    ├── Show unified preview (with checkpoint status)
    ├── If --dry-run: show preview and exit
    │
    ├── RESEARCH phase (if not skipped by --phase or --resume)
    │   ├── Spawn 3 parallel domain-researchers (Opus)
    │   ├── Aggregate context_summary (~1500 tokens)
    │   ├── Save checkpoint: updatePhase('design', 'research', { status: 'complete', context_summary }, feature)
    │   └── PRE-DESIGN CHECKPOINT (unless --no-checkpoint)
    │       ├── Present 6 questions via structured prompts
    │       ├── Store responses in checkpoint: phases.research.checkpoint_responses
    │       └── If cancelled: halt with resume instructions
    │
    ├── WRITE phase (if not skipped by --phase or --resume)
    │   ├── Spawn domain-writer (Sonnet) with research context
    │   ├── Creates: requirements.md, design.md, tasks.md
    │   ├── Auto-generate: summary.md (from template)
    │   ├── Auto-generate: spec.json (from template)
    │   ├── Save checkpoint: updatePhase('design', 'write', { status: 'complete', context_summary, files_created }, feature)
    │   └── POST-DESIGN CHECKPOINT (unless --no-checkpoint)
    │       ├── Present 6 questions via structured prompts
    │       ├── If approved ("yes"):
    │       │   ├── Create Linear issue (if linear.enabled)
    │       │   ├── Store Linear identifier in spec.json
    │       │   ├── Update summary.md status to "Approved"
    │       │   └── Proceed to VALIDATE
    │       ├── If rejected ("no"):
    │       │   └── Halt with message: revise with --phase=write
    │       └── If "revise":
    │           └── Re-run WRITE phase with user feedback
    │
    └── VALIDATE phase (if not skipped by --phase or --resume)
        ├── Spawn quality-validator (Haiku)
        ├── Save checkpoint: completeCheckpoint('design', feature)
        └── Report final status with Linear link (if created)
```

---

## Component Design

### 1. Flag Parsing Extension (`command-utils.cjs`)

Extend `parseFlags()` to support string-type flags in addition to existing boolean flags.

**Current interface:**

```javascript
parseFlags(userPrompt, { flagName: "boolean" });
// Returns: { flagName: true/false }
```

**Extended interface:**

```javascript
parseFlags(userPrompt, {
  // Boolean flag (existing behavior, unchanged)
  resume: "boolean",
  "no-checkpoint": "boolean",
  "dry-run": "boolean",
  // String flag (new behavior)
  phase: { type: "string", values: ["research", "write", "validate"] },
});
// Returns: { resume: false, 'no-checkpoint': false, 'dry-run': false, phase: null }
// With --phase=write: { ..., phase: 'write' }
```

**String-type flag parsing logic:**

| Input                | `flagDefinition`                                              | Result                          |
| -------------------- | ------------------------------------------------------------- | ------------------------------- |
| `--phase=research`   | `{ type: 'string', values: ['research','write','validate'] }` | `'research'`                    |
| `--phase=foo`        | `{ type: 'string', values: ['research','write','validate'] }` | `null` (+ warning logged)       |
| `--phase` (no value) | `{ type: 'string', values: [...] }`                           | `null`                          |
| (flag absent)        | `{ type: 'string', values: [...] }`                           | `null`                          |
| `--phase=write`      | `{ type: 'string' }` (no values array)                        | `'write'` (any string accepted) |

**Implementation approach:**

- Regex pattern for string-type flags: `--{flagName}=(\S+)`
- If `values` array is provided, validate the captured value is in the array
- If validation fails, log warning and return `null`
- `'boolean'` string shorthand still works as before

**File:** `.claude/scripts/lib/command-utils.cjs`

---

### 2. Phase Execution Flow

The complete flag resolution and execution flow:

```text
Step 1: Parse flags
    │
    ├── flags = parseFlags(userPrompt, {
    │     phase: { type: 'string', values: ['research', 'write', 'validate'] },
    │     resume: 'boolean',
    │     'no-checkpoint': 'boolean',
    │     'dry-run': 'boolean'
    │   })
    │
Step 2: Determine execution plan
    │
    ├── IF flags.resume:
    │   ├── checkpoint = loadCheckpoint('design', feature)
    │   ├── IF !checkpoint: ERROR "No checkpoint found"
    │   ├── IF checkpoint.completed_at: ERROR "Already complete"
    │   ├── completedPhases = checkpoint.state.completed_phases
    │   └── resumeContext = last completed phase's context_summary
    │
    ├── Determine phasesToRun:
    │   ├── IF flags.resume AND flags.phase:
    │   │   └── phasesToRun = [flags.phase].filter(p => !completedPhases.includes(p))
    │   ├── ELSE IF flags.resume (without --phase):
    │   │   └── phasesToRun = allPhases.filter(p => !completedPhases.includes(p))
    │   ├── ELSE IF flags.phase (without --resume):
    │   │   └── phasesToRun = [flags.phase]
    │   └── ELSE (no flags):
    │       └── phasesToRun = ['research', 'write', 'validate']  // Full run
    │
Step 3: Render preview
    │
    ├── Read .claude/skills/preview/templates/command-preview.md
    ├── Fill variables: command, feature, checkpoint status, stages
    ├── Mark skipped phases with ⊘ indicator
    └── Prompt: "Run / Cancel?"
    │
Step 4: Check dry-run
    │
    ├── IF flags['dry-run']:
    │   └── Output "Dry run complete. No changes made." → EXIT
    │
Step 5: Execute phases
    │
    ├── FOR phase IN phasesToRun:
    │   ├── IF phase === 'research':
    │   │   ├── Spawn 3 parallel domain-researchers
    │   │   ├── Aggregate summaries (~1500 tokens → compress to <=500)
    │   │   ├── updatePhase('design', 'research', { status: 'complete', context_summary }, feature)
    │   │   └── IF !flags['no-checkpoint']: presentPreDesignCheckpoint()
    │   │
    │   ├── IF phase === 'write':
    │   │   ├── context = checkpoint?.phases?.research?.context_summary || researchResult
    │   │   ├── Spawn domain-writer with context
    │   │   ├── Auto-generate summary.md
    │   │   ├── Auto-generate spec.json
    │   │   ├── updatePhase('design', 'write', { status: 'complete', context_summary, files_created }, feature)
    │   │   └── IF !flags['no-checkpoint']: presentPostDesignCheckpoint()
    │   │       ├── IF approved: createLinearIssue(), updateSpecJson(), updateSummaryStatus()
    │   │       ├── IF rejected: HALT
    │   │       └── IF revise: RE-RUN write phase
    │   │
    │   └── IF phase === 'validate':
    │       ├── Spawn quality-validator
    │       ├── completeCheckpoint('design', feature)
    │       └── Report final status
```

---

### 3. Checkpoint Schema

Checkpoint file stored at `.claude/state/design-{feature}.json`:

```json
{
  "version": 1,
  "command": "design",
  "feature": "design-incremental-execution",
  "head_commit": "c0a48aa...",
  "started_at": "2026-01-31T10:00:00.000Z",
  "updated_at": "2026-01-31T10:15:00.000Z",
  "completed_at": null,
  "state": {
    "current_phase": "write",
    "completed_phases": ["research"],
    "pending_phases": ["write", "validate"]
  },
  "phases": {
    "research": {
      "status": "complete",
      "started_at": "2026-01-31T10:00:00.000Z",
      "updated_at": "2026-01-31T10:05:00.000Z",
      "context_summary": "Feature needs X, Y, Z. Dependencies: A, B. No conflicts. Approach: ...",
      "checkpoint_responses": {
        "understanding": "Yes, correct.",
        "approach": "Looks good, proceed.",
        "assumptions": "Assumption 2 needs revision: ...",
        "trade_offs": "Acceptable.",
        "scope": "Add error handling to scope.",
        "unknowns": "None, proceed."
      }
    },
    "write": {
      "status": "complete",
      "started_at": "2026-01-31T10:06:00.000Z",
      "updated_at": "2026-01-31T10:12:00.000Z",
      "context_summary": "Created 6 spec files covering 21 tasks across 7 phases...",
      "files_created": [
        "requirements.md",
        "design.md",
        "tasks.md",
        "summary.md",
        "spec.json",
        "meta.yaml"
      ],
      "checkpoint_responses": {
        "what_built": "Reviewed, looks complete.",
        "decisions": "Agree with all decisions.",
        "risks": "No additional risks.",
        "omissions": "Nothing missing.",
        "confidence": "High confidence.",
        "approval": "yes"
      }
    },
    "validate": {
      "status": "complete",
      "started_at": "2026-01-31T10:13:00.000Z",
      "updated_at": "2026-01-31T10:14:00.000Z",
      "context_summary": "Validation passed. All requirements have acceptance criteria..."
    }
  }
}
```

**Key schema notes:**

- `version: 1` required by `checkpoint-manager.cjs` (strict check)
- `context_summary` per phase limited to 500 tokens (enforced by `token-counter.cjs` via `saveCheckpoint()`)
- `checkpoint_responses` is an optional object, present only when interactive checkpoints are used
- `files_created` is an optional array, present only for the write phase
- `completed_at` set by `completeCheckpoint()` when all phases finish
- `head_commit` auto-captured by `saveCheckpoint()` on every write

---

### 4. Interactive Checkpoint Format

#### Pre-Design Checkpoint (After Research)

Presented as a structured review of research findings. The orchestrator populates variables from the aggregated `context_summary` of the 3 parallel domain-researchers.

```text
Pre-Design Checkpoint
=====================

I have completed research for "{feature}". Before writing the spec, I would like
to verify my understanding with you.

1. UNDERSTANDING
   Based on the research, here is what the feature needs to do:
   {summary extracted from context_summary}

   Is this correct? [yes / correct with changes / no]

2. APPROACH
   I plan to approach the design as follows:
   {approach extracted from context_summary}

   Does this align with your expectations? [yes / suggest alternative]

3. ASSUMPTIONS
   I am making these assumptions:
   {assumptions extracted from context_summary}

   Are any of these incorrect? [all correct / corrections: ...]

4. TRADE-OFFS
   Key trade-offs identified:
   {trade_offs extracted from context_summary}

   Are you comfortable with these? [yes / concerns: ...]

5. SCOPE
   The following is explicitly out of scope:
   {out_of_scope extracted from context_summary}

   Is anything missing or incorrectly excluded? [scope is right / adjustments: ...]

6. UNKNOWNS
   Open questions that may need resolution:
   {unknowns extracted from context_summary}

   Should we resolve any before proceeding? [proceed / resolve: ...]
```

#### Post-Design Checkpoint (After Write)

Presented as a review of the generated spec files. Variables populated from write phase output.

```text
Post-Design Checkpoint
======================

I have completed the spec for "{feature}". Before validation, I would like
your review.

1. WHAT BUILT
   I have created the following spec files:
   - specs/{feature}/requirements.md
   - specs/{feature}/design.md
   - specs/{feature}/tasks.md
   - specs/{feature}/summary.md
   - specs/{feature}/spec.json
   - specs/{feature}/meta.yaml

   Would you like to review any specific file? [proceed / review: {filename}]

2. DECISIONS
   Key design decisions made:
   {decisions extracted from design.md}

   Do you agree with these choices? [yes / changes: ...]

3. RISKS
   Identified risks:
   {risks extracted from design.md}

   Are there additional risks to consider? [no additional / add: ...]

4. OMISSIONS
   Intentionally omitted:
   {omissions extracted from requirements.md out-of-scope}

   Is anything missing that should be included? [nothing missing / add: ...]

5. CONFIDENCE
   My confidence level: {high|medium|low}
   Areas of lower confidence: {low_confidence_areas}

   Any concerns? [no concerns / concerns: ...]

6. APPROVAL
   Do you approve this design for implementation?

   [yes] → Create Linear issue, proceed to validation
   [no]  → Halt, suggest --phase=write to revise
   [revise] → Re-run write phase with your feedback
```

---

### 5. Linear Integration

**Trigger:** User responds "yes" to post-design checkpoint question 6 (Approval).

**Flow:**

```text
User approves design
    │
    ├── Read .claude/config/integrations.json
    │   └── Check linear.enabled === true
    │
    ├── IF linear.enabled:
    │   ├── Build issue payload:
    │   │   ├── title: "[Design] {feature_name}"
    │   │   ├── description: summary paragraph + spec directory link + key decisions
    │   │   └── teamId: resolved from linear.team ("Basecamp")
    │   │
    │   ├── Call mcp__linear-server__create_issue(title, description, teamId)
    │   │
    │   ├── IF success:
    │   │   ├── Extract identifier (e.g., "BASE-123") and url from response
    │   │   ├── Update spec.json: set linear.identifier and linear.url
    │   │   ├── Display: "Linear: BASE-123 - https://linear.app/..."
    │   │   └── Continue to VALIDATE
    │   │
    │   └── IF failure:
    │       ├── Display error: "Linear issue creation failed: {error}"
    │       ├── Display fix: "Fix MCP configuration and re-run with: /design {feature} --resume"
    │       └── HALT (do not proceed to VALIDATE)
    │
    ├── IF !linear.enabled (explicit opt-out):
    │   ├── Skip silently
    │   └── Continue to VALIDATE
    │
    └── IF integrations.json missing or malformed:
        ├── Display error: "Linear configuration not found. Create .claude/config/integrations.json with linear.enabled and linear.team"
        └── HALT (do not proceed to VALIDATE)
```

**MCP call signature:**

```javascript
mcp__linear -
  server__create_issue({
    title: `[Design] ${featureName}`,
    description: `## ${featureName}\n\n${summaryParagraph}\n\n**Spec:** specs/${feature}/\n\n### Key Decisions\n${decisions}`,
    teamId: integrations.linear.team,
  });
```

---

### 6. summary.md Generation

**Template source:** `specs/templates/summary.md`

**Population logic:**

| Template Variable           | Source                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `{{feature_name}}`          | Title-case of feature name (e.g., `"design-incremental-execution"` -> `"Design Incremental Execution"`) |
| `{{status}}`                | `"Draft"` initially; `"Approved"` after post-checkpoint approval                                        |
| `{{one_paragraph_summary}}` | 2-4 sentence summary extracted from write phase `context_summary`                                       |
| `{{decision_1..N}}`         | 3-5 key decisions extracted from `design.md` architecture/component sections                            |

**Timing:** Generated during the WRITE phase, after `requirements.md`, `design.md`, and `tasks.md` are created. The domain-writer sub-agent generates all 6 files in a single pass.

**Status update:** After post-design checkpoint approval, the orchestrator updates the `{{status}}` line in `summary.md` from `Draft` to `Approved` via a targeted string replacement.

---

### 7. spec.json Generation

**Template source:** `specs/templates/spec.json`

**Population logic:**

| Template Variable   | Source                           | Example                             |
| ------------------- | -------------------------------- | ----------------------------------- |
| `{{feature}}`       | Feature name (kebab-case)        | `"design-incremental-execution"`    |
| `{{status}}`        | Lifecycle state                  | `"draft"` or `"approved"`           |
| `{{date}}`          | ISO 8601 date                    | `"2026-01-31"`                      |
| `{{agent}}`         | Authoring agent                  | `"plan-agent"`                      |
| `{{semver}}`        | Spec version                     | `"1.0.0"`                           |
| `{{phase_N}}`       | Phase names from `tasks.md`      | `"Foundation"`, `"Command Updates"` |
| `{{task_id}}`       | Task IDs from `tasks.md`         | `"T001"`, `"T002"`                  |
| `{{task_title}}`    | Task titles                      | `"Extend parseFlags()"`             |
| `{{task_status}}`   | Initial status                   | `"pending"`                         |
| `{{task_assignee}}` | Initial assignee                 | `null`                              |
| `{{linear_id}}`     | Linear issue ID (post-approval)  | `"BASE-123"`                        |
| `{{linear_url}}`    | Linear issue URL (post-approval) | `"https://linear.app/..."`          |

**Example populated spec.json:**

```json
{
  "name": "design-incremental-execution",
  "status": "approved",
  "created": "2026-01-31",
  "updated": "2026-01-31",
  "author": "plan-agent",
  "version": "1.0.0",
  "files": {
    "requirements": "requirements.md",
    "design": "design.md",
    "tasks": "tasks.md",
    "summary": "summary.md",
    "meta": "meta.yaml"
  },
  "phases": [
    "Foundation",
    "Command Definition Updates",
    "Checkpoint Integration",
    "Interactive Checkpoints",
    "Auto-generation",
    "Linear Integration",
    "Implement Integration"
  ],
  "tasks": [
    {
      "id": "T001",
      "title": "Extend parseFlags() for string-type flags",
      "status": "pending",
      "assignee": null
    },
    {
      "id": "T002",
      "title": "Add flags section to design.md",
      "status": "pending",
      "assignee": null
    }
  ],
  "linear": {
    "identifier": "BASE-123",
    "url": "https://linear.app/basecamp/issue/BASE-123"
  }
}
```

---

### 8. Files Modified

| File                                    | Action | Description                                                                                                                                                 |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/scripts/lib/command-utils.cjs` | Modify | Add string-type support to `parseFlags()`                                                                                                                   |
| `.claude/commands/design.md`            | Modify | Add flags section, preview update, output list, dry-run, checkpoint references                                                                              |
| `.claude/agents/plan-agent.md`          | Modify | Add checkpoint load/save, interactive checkpoints, --phase/--resume/--no-checkpoint handling, summary.md/spec.json/meta.yaml generation, Linear integration |
| `.claude/commands/implement.md`         | Modify | Add summary.md reading, spec.json reading for routing/task data                                                                                             |
| `specs/{feature}/summary.md`            | Create | Auto-generated from template after WRITE phase                                                                                                              |
| `specs/{feature}/spec.json`             | Create | Auto-generated from template after WRITE phase                                                                                                              |
| `specs/{feature}/meta.yaml`             | Create | Auto-generated from template after WRITE phase                                                                                                              |
| `.claude/state/design-{feature}.json`   | Create | Checkpoint file (runtime, not committed)                                                                                                                    |

---

## Data Flow

```text
User invokes /design {feature} [flags]
    │
    ├── command-utils.cjs: parseFlags() → { phase, resume, no-checkpoint, dry-run }
    │
    ├── checkpoint-manager.cjs: loadCheckpoint() → checkpoint | null
    │
    ├── command-preview.md: render preview → user confirms
    │
    ├── plan-agent.md (orchestrator):
    │   │
    │   ├── RESEARCH → domain-researcher x3 → context_summary
    │   │                                        │
    │   │   checkpoint-manager.cjs: updatePhase() ←┘
    │   │   interactive checkpoint: 6 questions → user responses
    │   │
    │   ├── WRITE → domain-writer → requirements.md, design.md, tasks.md
    │   │                              │
    │   │   summary.md ← template ←────┘
    │   │   spec.json  ← template ←────┘
    │   │   checkpoint-manager.cjs: updatePhase() ←┘
    │   │   interactive checkpoint: 6 questions → approval
    │   │                                           │
    │   │   integrations.json: linear.enabled ←─────┘
    │   │   mcp__linear-server__create_issue → identifier, url
    │   │   spec.json: linear.identifier, linear.url ←┘
    │   │   summary.md: status → "Approved" ←┘
    │   │
    │   └── VALIDATE → quality-validator → { passed, issues[] }
    │                                         │
    │       checkpoint-manager.cjs: completeCheckpoint() ←┘
    │
    └── /implement reads: summary.md, spec.json → structured context
```

---

## Error Handling

### Invalid Flag Value

```text
Error: Invalid phase "foo". Valid values: research, write, validate
```

**Response:** Exit with error code. Do not start any phases.

**Note:** `parseFlags()` returns `null` for invalid string values and logs a warning. The orchestrator then checks for null and produces this hard error before execution begins. These are two layers: parseFlags() normalizes, the orchestrator validates.

### Missing Checkpoint on --resume

```text
Error: No checkpoint found for "my-feature". Run without --resume to start fresh.
```

**Response:** Exit with error code. Suggest running without `--resume`.

### Stale Checkpoint

```text
Warning: Checkpoint is stale (saved at c0a48aa, current HEAD is d36b6b4).
Proceeding with existing checkpoint data.
```

**Response:** Log warning via `logError()`, continue execution.

### Checkpoint Save Failure

```text
Warning: Failed to save checkpoint: Permission denied
Continuing execution without checkpoint persistence.
```

**Response:** Log warning, continue execution. User loses crash recovery for that phase.

### Linear MCP Failure

```text
Error: Linear issue creation failed: MCP server unavailable
Fix MCP configuration and re-run with: /design {feature} --resume
```

**Response:** Halt execution. Do not proceed to VALIDATE. Checkpoint remains with write phase complete. User must fix MCP config and resume.

### Missing Linear Configuration

```text
Error: Linear configuration not found. Create .claude/config/integrations.json with linear.enabled and linear.team
```

**Response:** Halt execution. User must create or fix integrations.json.

### Post-Design Rejection

```text
Design not approved. To revise, run:
  /design {feature} --phase=write
```

**Response:** Halt execution. Do not proceed to VALIDATE. Checkpoint remains with write phase complete.

---

## Testing Strategy

| Test Type   | Test Case                                                 | Verification                                                                    |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Unit        | `parseFlags()` with string-type flags                     | Returns correct string value or null for invalid                                |
| Unit        | `parseFlags()` with boolean flags                         | Boolean flags still work correctly                                              |
| Unit        | `parseFlags()` with no values array (any string accepted) | Returns any string value without validation                                     |
| Integration | Full `/design` flow without flags                         | Produces requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml |
| Integration | `--phase=research` runs only research                     | Only research checkpoint saved, no spec files created                           |
| Integration | `--resume` after research                                 | Skips research, runs write and validate                                         |
| Integration | `--dry-run` shows preview and exits                       | No files created, no checkpoint saved                                           |
| Integration | `--no-checkpoint` skips interactive prompts               | Files and checkpoints created, no user prompts                                  |
| Integration | Post-design approval creates Linear issue                 | spec.json contains linear.identifier                                            |
| Integration | Linear MCP failure halts execution                        | Error displayed, execution halted                                               |
| Integration | Post-design rejection halts cleanly                       | No validate phase runs, checkpoint shows write complete                         |
| E2E         | Full flow: design -> approve -> implement reads spec.json | /implement picks up phases and tasks from spec.json                             |

---
