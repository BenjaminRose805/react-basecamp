# Requirements: Design Incremental Execution

> **Status:** Approved
> **Created:** 2026-01-31
> **Spec ID:** design-incremental-execution

## Goal

Extend the `/design` command with incremental execution capabilities including per-phase flag control, checkpoint persistence, interactive review gates, auto-generation of summary/spec.json/meta.yaml artifacts, and Linear issue integration.

## User Stories

- As a designer, I want to run individual phases (research, write, validate) instead of all at once to iterate on specific sections
- As a designer, I want to pause and resume multi-phase design work using checkpoints so I don't lose progress
- As a designer, I want to review checkpoints interactively before proceeding to the next phase
- As a designer, I want auto-generated summary.md and spec.json files for quick reference and handoff to /implement
- As a designer, I want Linear issues created automatically when designs are approved

## Success Criteria

- [x] All four flag types (--phase, --resume, --no-checkpoint, --dry-run) implemented and working
- [x] Checkpoint persistence saves state across feature branches with recovery capability
- [x] Interactive checkpoints present structured questions and preserve responses
- [x] summary.md and spec.json auto-generated with complete content
- [x] Linear issue creation on approval with identifier stored in spec.json
- [x] /implement command reads summary.md and spec.json for richer context
- [x] Unified command preview shows checkpoint status and phase execution plan

## Technical Constraints

- Checkpoint files must remain under 50KB (context summaries limited to 500 tokens each)
- Context summaries validated via token-counter.cjs before checkpoint save
- Linear API requires .claude/config/integrations.json with linear.enabled and linear.team
- Checkpoint system uses JSON format at .claude/state/design-{feature}.json
- Symbol validation regex pattern used for spec directory matching in CI workflow

## Overview

Extend the `/design` command with incremental execution capabilities: per-phase flag control (`--phase`, `--resume`, `--no-checkpoint`, `--dry-run`), checkpoint persistence via `checkpoint-manager.cjs`, interactive review checkpoints between phases, auto-generation of `summary.md` and `spec.json`, Linear issue creation on post-checkpoint approval, and handoff artifacts that `/implement` consumes directly.

---

## Functional Requirements

### REQ-1: Flag Support

#### REQ-1.1: Phase Selection Flag

**EARS (Event-driven):** WHEN the user passes `--phase=research`, THE SYSTEM SHALL execute only the RESEARCH phase. WHEN the user passes `--phase=write`, THE SYSTEM SHALL execute only the WRITE phase. WHEN the user passes `--phase=validate`, THE SYSTEM SHALL execute only the VALIDATE phase.

**Acceptance Criteria:**

- `parseFlags()` in `.claude/scripts/lib/command-utils.cjs` supports `type: 'string'` flag definitions with an optional `values` array for validation
- `--phase=research` spawns only the 3 parallel domain-researchers, saves checkpoint, and exits
- `--phase=write` spawns only the domain-writer (requires research checkpoint or context), saves checkpoint, and exits
- `--phase=validate` spawns only the quality-validator (requires spec files to exist), saves checkpoint, and exits
- `--phase=foo` produces error: `Invalid phase "foo". Valid values: research, write, validate`
- The `--phase` flag value is parsed via `--phase=value` syntax (equals-sign format)
- New behavior applies when flag is used; without the flag, executes all phases normally

#### REQ-1.2: Resume Flag

**EARS (Event-driven):** WHEN the user passes `--resume` and a checkpoint file exists at `.claude/state/design-{feature}.json`, THE SYSTEM SHALL load the checkpoint and resume from the first incomplete phase, skipping all phases listed in `state.completed_phases`.

**Acceptance Criteria:**

- Loads checkpoint via `loadCheckpoint('design', feature)` from `checkpoint-manager.cjs`
- Phases with `status: 'complete'` in the checkpoint are skipped entirely
- The first phase not in `state.completed_phases` becomes the starting phase
- Context summaries from completed phases are loaded from `checkpoint.phases[name].context_summary` and passed to subsequent phases
- If no checkpoint exists, error: `No checkpoint found for "{feature}". Run without --resume to start fresh.`
- If checkpoint has `completed_at` set, error: `Design for "{feature}" is already complete. Run without --resume to start fresh.`
- Stale checkpoint (different `head_commit`) produces a warning via `logError()` but execution proceeds

#### REQ-1.3: No-Checkpoint Flag

**EARS (Event-driven):** WHEN the user passes `--no-checkpoint`, THE SYSTEM SHALL skip interactive checkpoint prompts (pre-design and post-design questions) but still persist checkpoint files to `.claude/state/` for crash recovery.

**Acceptance Criteria:**

- Interactive checkpoint questions from REQ-3.1 and REQ-3.2 are suppressed
- `saveCheckpoint()` and `updatePhase()` calls still execute after each phase
- Linear issue creation (REQ-5.1) is skipped because it requires explicit user approval at the post-design checkpoint
- The `--no-checkpoint` flag is a boolean flag parsed by existing `parseFlags()` boolean support
- Combinable with `--phase`: e.g., `--phase=write --no-checkpoint` runs write without interactive prompts

#### REQ-1.4: Dry-Run Flag

**EARS (Event-driven):** WHEN the user passes `--dry-run`, THE SYSTEM SHALL render the unified command preview (including checkpoint status if `--resume` is also passed) and exit without executing any phases.

**Acceptance Criteria:**

- Preview rendered using `.claude/skills/preview/templates/command-preview.md` template
- If `--resume --dry-run` combined, preview shows which phases would be skipped based on checkpoint state
- No sub-agents are spawned
- No checkpoint files are created or modified
- Output ends with: `Dry run complete. No changes made.`
- The `--dry-run` flag is a boolean flag parsed by existing `parseFlags()` boolean support

---

### REQ-2: Checkpoint Integration

#### REQ-2.1: Save Checkpoint After Research

**EARS (Event-driven):** AFTER the RESEARCH phase completes successfully, THE SYSTEM SHALL save a checkpoint via `updatePhase('design', 'research', { status: 'complete', context_summary }, feature)`.

**Acceptance Criteria:**

- Checkpoint file created/updated at `.claude/state/design-{feature}.json`
- `phases.research` entry contains: `status: 'complete'`, `context_summary` (<=500 tokens validated by `token-counter.cjs`), `updated_at` ISO timestamp
- `state.completed_phases` array includes `'research'`
- `head_commit` captured automatically by `saveCheckpoint()` via `git rev-parse HEAD`
- If save fails, warning logged via `logError()` but execution continues to WRITE phase

#### REQ-2.2: Save Checkpoint After Write

**EARS (Event-driven):** AFTER the WRITE phase completes successfully, THE SYSTEM SHALL save a checkpoint via `updatePhase('design', 'write', { status: 'complete', context_summary, files_created }, feature)`.

**Acceptance Criteria:**

- `phases.write` entry contains: `status: 'complete'`, `context_summary` (<=500 tokens), `files_created` array, `updated_at` ISO timestamp
- `files_created` lists: `['requirements.md', 'design.md', 'tasks.md', 'summary.md', 'spec.json', 'meta.yaml']`
- `state.completed_phases` includes both `'research'` and `'write'`
- If save fails, warning logged via `logError()` but execution continues to VALIDATE phase

#### REQ-2.3: Resume Skips Completed Phases

**EARS (Event-driven):** WHEN `--resume` is passed and a checkpoint exists with completed phases, THE SYSTEM SHALL skip those phases and resume from the next incomplete phase, using stored `context_summary` values as input.

**Acceptance Criteria:**

- `getResumePoint('design', feature)` returns the current/next phase and last completed summary
- Skipped phases display `[SKIPPED]` indicator in progress output using `stage-progress.md` template indicator `⊘`
- Research `context_summary` from checkpoint is passed to the WRITE phase as if research had just completed
- Write `context_summary` from checkpoint is passed to the VALIDATE phase as if write had just completed

---

### REQ-3: Interactive Checkpoints

#### REQ-3.1: Pre-Design Checkpoint

**EARS (Event-driven):** AFTER the RESEARCH phase completes AND unless `--no-checkpoint` is passed, THE SYSTEM SHALL present 6 pre-design checkpoint questions to the user and wait for responses before proceeding to the WRITE phase.

**Acceptance Criteria:**

- Questions presented via structured prompts (one at a time or as a batch) after research sub-agents complete
- User responses stored in checkpoint under `phases.research.checkpoint_responses` object
- If user responds with "stop" or "cancel", execution halts gracefully with message: `Design paused. Resume with: /design {feature} --resume`
- Checkpoint is saved before presenting questions (research phase is already complete at this point)

#### REQ-3.2: Post-Design Checkpoint

**EARS (Event-driven):** AFTER the WRITE phase completes AND unless `--no-checkpoint` is passed, THE SYSTEM SHALL present 6 post-design checkpoint questions to the user and wait for responses before proceeding to the VALIDATE phase.

**Acceptance Criteria:**

- Questions presented after spec files (requirements.md, design.md, tasks.md, summary.md, spec.json) are written
- Final question (Approval) determines next action: approved triggers Linear issue creation, rejected allows write re-run
- User responses stored in checkpoint under `phases.write.checkpoint_responses` object
- "yes" approval: creates Linear issue (REQ-5.1), updates `summary.md` status to `Approved`, proceeds to VALIDATE
- "no" rejection: halts with message: `Design not approved. Revise with: /design {feature} --phase=write`
- "revise" response: re-runs WRITE phase with user's feedback as additional context

#### REQ-3.3: Pre-Design Checkpoint Questions

**EARS (Ubiquitous):** THE SYSTEM SHALL present the following 6 pre-design checkpoint questions, populated with research findings:

1. **Understanding:** "Based on the research, here is what the feature needs to do: {summary}. Is this correct?"
2. **Approach:** "I plan to approach the design as follows: {approach}. Does this align with your expectations?"
3. **Assumptions:** "I am making these assumptions: {assumptions}. Are any of these incorrect?"
4. **Trade-offs:** "Key trade-offs identified: {trade_offs}. Are you comfortable with these?"
5. **Scope:** "The following is explicitly out of scope: {out_of_scope}. Is anything missing or incorrectly excluded?"
6. **Unknowns:** "Open questions that may need resolution: {unknowns}. Should we resolve any before proceeding?"

**Acceptance Criteria:**

- Question text populated from research/write context by the orchestrator (synthesized from overall findings, not extracted from specific variables)
- All 6 questions presented unless user cancels early
- Responses preserved in checkpoint and available for the write phase to consume as additional guidance

#### REQ-3.4: Post-Design Checkpoint Questions

**EARS (Ubiquitous):** THE SYSTEM SHALL present the following 6 post-design checkpoint questions, populated with write phase output:

1. **What Built:** "I have created the following spec files: {files_list}. Would you like to review any specific file?"
2. **Decisions:** "Key design decisions made: {decisions}. Do you agree with these choices?"
3. **Risks:** "Identified risks: {risks}. Are there additional risks to consider?"
4. **Omissions:** "Intentionally omitted: {omissions}. Is anything missing that should be included?"
5. **Confidence:** "My confidence level: {confidence_level}. Areas of lower confidence: {low_confidence_areas}."
6. **Approval:** "Do you approve this design for implementation? (yes / no / revise)"

**Acceptance Criteria:**

- Question text populated from research/write context by the orchestrator (synthesized from overall findings, not extracted from specific variables)
- `{files_list}` shows actual generated file paths relative to spec directory
- "yes" triggers Linear issue creation (REQ-5.1) and marks status as Approved
- "no" halts execution cleanly
- "revise" re-runs WRITE phase with user feedback incorporated as additional context
- All responses stored in checkpoint `phases.write.checkpoint_responses`

---

### REQ-4: Summary Generation

#### REQ-4.1: Auto-Generate summary.md

**EARS (Event-driven):** AFTER the WRITE phase completes, THE SYSTEM SHALL auto-generate `specs/{feature}/summary.md` using the template at `specs/templates/summary.md`.

**Acceptance Criteria:**

- File created at `specs/{feature}/summary.md`
- `{{feature_name}}` populated with the feature name (title-cased, e.g., "Design Incremental Execution")
- `{{status}}` set to `"Draft"` initially; updated to `"Approved"` after post-checkpoint approval (REQ-3.2)
- `{{one_paragraph_summary}}` contains a 2-4 sentence summary extracted from the write phase context
- `{{decision_1..N}}` populated with 3-5 key design decisions from `design.md`
- Links section includes relative links to: `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `spec.json`
- All template placeholders (`{{...}}`) are replaced with actual content (no unfilled placeholders)

#### REQ-4.2: Summary Content Completeness

**EARS (Ubiquitous):** THE SYSTEM SHALL ensure `summary.md` includes: status indicator, one-paragraph summary, key decisions list, and links to all spec files.

**Acceptance Criteria:**

- Status is one of: `Draft`, `Approved`, `In Progress`, `Complete`
- Summary paragraph is 2-4 sentences, no longer
- Key decisions list contains 3-5 bullet points
- All relative links (`./requirements.md`, etc.) resolve correctly from the spec directory

#### REQ-4.3: Auto-Generate meta.yaml

**EARS (Event-driven):** AFTER the WRITE phase completes, THE SYSTEM SHALL auto-generate `specs/{feature}/meta.yaml` using the template at `specs/templates/meta.yaml`.

**Acceptance Criteria:**

- File created at `specs/{feature}/meta.yaml`
- `id` populated with feature name (kebab-case)
- `status` set to `"draft"`
- `created` and `updated` fields set to current date
- `tasks_total` set to count of tasks in tasks.md
- `tasks_complete` set to 0
- All template placeholders filled with actual content

---

### REQ-5: Linear Integration

#### REQ-5.1: Create Linear Issue on Approval

**EARS (Event-driven):** WHEN the user responds "yes" to the Approval question at post-design checkpoint (REQ-3.4 question 6) AND `.claude/config/integrations.json` has `linear.enabled: true`, THE SYSTEM SHALL create a Linear issue via `mcp__linear-server__create_issue`.

**Acceptance Criteria:**

- Reads `.claude/config/integrations.json` and checks `linear.enabled` boolean
- If `linear.enabled` is `false`, skip issue creation silently (no error, explicit opt-out)
- If `integrations.json` is missing or malformed, THE SYSTEM SHALL halt with error: `"Linear configuration not found. Create .claude/config/integrations.json with linear.enabled and linear.team"`
- Issue title: `"[Design] {feature_name}"` where `{feature_name}` is the title-cased feature name
- Issue description includes: the summary paragraph from `summary.md`, a link to the spec directory, and key design decisions
- Team resolved from `integrations.json` `linear.team` field (`"Basecamp"`)
- MCP call: `mcp__linear-server__create_issue` with `title`, `description`, and `teamId` parameters
- On MCP call failure, THE SYSTEM SHALL halt execution with error: `"Linear issue creation failed: {error}. Fix MCP configuration and re-run with --phase=write"`

#### REQ-5.2: Store Linear Identifier in spec.json

**EARS (Event-driven):** AFTER the Linear issue is created successfully, THE SYSTEM SHALL store the issue identifier and URL in `specs/{feature}/spec.json` under the `linear` object.

**Acceptance Criteria:**

- `spec.json` field `linear.identifier` set to the Linear issue identifier (e.g., `"BASE-123"`)
- `spec.json` field `linear.url` set to the Linear issue URL (e.g., `"https://linear.app/basecamp/issue/BASE-123"`)
- If Linear issue creation was skipped due to explicit disable (`linear.enabled: false`), the `linear` key is omitted from `spec.json` entirely
- `spec.json` is re-written (not appended) to include the Linear data

#### REQ-5.3: Display Linear Issue Link

**EARS (Event-driven):** AFTER the Linear issue is created, THE SYSTEM SHALL display the issue link in the design completion output.

**Acceptance Criteria:**

- Output includes line: `Linear: {identifier} - {url}` (e.g., `Linear: BASE-123 - https://linear.app/basecamp/issue/BASE-123`)
- Displayed after the spec creation summary, before the "Next Steps" section
- If no Linear issue was created (disabled, skipped, or failed), this line is omitted entirely

---

### REQ-6: Spec.json Auto-Generation

#### REQ-6.1: Auto-Generate spec.json

**EARS (Event-driven):** AFTER the WRITE phase completes, THE SYSTEM SHALL auto-generate `specs/{feature}/spec.json` using the template at `specs/templates/spec.json`.

**Acceptance Criteria:**

- File created at `specs/{feature}/spec.json`
- `name` field: feature name (kebab-case, matching directory name)
- `status` field: `"draft"` initially; updated to `"approved"` after post-checkpoint approval
- `created` and `updated` fields: ISO 8601 date strings (e.g., `"2026-01-31"`)
- `author` field: `"plan-agent"`
- `version` field: `"1.0.0"`
- `files` object: maps `requirements`, `design`, `tasks`, `summary`, `meta` to their filenames
- `phases` array: lists phase names extracted from `tasks.md` section headers (e.g., `["Foundation", "Command Updates", ...]`)
- `tasks` array: lists all tasks with `id` (e.g., `"T001"`), `title`, `status` (`"pending"`), and `assignee` (`null`)
- `linear` object: omitted initially; populated after Linear issue creation (REQ-5.2)
- Output is valid JSON with 2-space indentation

---

### REQ-7: Implement Integration

#### REQ-7.1: Implement Reads summary.md

**EARS (Event-driven):** WHEN `/implement` is invoked for a feature, THE SYSTEM SHALL check for `specs/{feature}/summary.md` and read its content for quick context.

**Acceptance Criteria:**

- `/implement` checks for `summary.md` existence in `specs/{feature}/`
- If present, the one-paragraph summary is extracted and passed as initial context to the researcher sub-agent
- If present, the summary is displayed in the preview CONTEXT section
- If absent, skip this step (no error)

#### REQ-7.2: Implement Reads spec.json

**EARS (Event-driven):** WHEN `/implement` is invoked for a feature, THE SYSTEM SHALL check for `specs/{feature}/spec.json` and read its machine-readable routing and task data.

**Acceptance Criteria:**

- `/implement` checks for `spec.json` existence in `specs/{feature}/`
- If present, the `phases` and `tasks` arrays are used for task enumeration instead of re-parsing `tasks.md` headers
- If present and `linear.identifier` exists, include it in implementation progress output and checkpoint data
- If absent, use task-parser as alternative (no error)
- `spec.json` data is authoritative when present; `tasks.md` is the alternative

---

### REQ-8: Preview

#### REQ-8.1: Unified Command Preview

**EARS (Ubiquitous):** THE SYSTEM SHALL render the `/design` preview using the unified `command-preview.md` template from `.claude/skills/preview/templates/`.

**Acceptance Criteria:**

- `{{command}}` = `"design"`, `{{description}}` = `"Conversational Spec Creation"`
- `{{dir}}` = current working directory
- `{{branch}}` = current git branch
- `{{feature}}` = feature name from command arguments
- `{{checkpoint}}` = `.claude/state/design-{feature}.json`
- STAGES section lists 3 stages: `1. RESEARCH (domain-researcher / Opus)`, `2. WRITE (domain-writer / Sonnet)`, `3. VALIDATE (quality-validator / Haiku)`
- OUTPUT section lists: `specs/{feature}/` with files `requirements.md`, `design.md`, `tasks.md`, `summary.md`, `spec.json`, `meta.yaml`
- Active flags shown in CONTEXT section (e.g., `Flags: --no-checkpoint`)

#### REQ-8.2: Preview Shows Checkpoint Status

**EARS (Event-driven):** WHEN `--resume` is passed, THE SYSTEM SHALL include checkpoint status in the preview's CONTEXT section.

**Acceptance Criteria:**

- CONTEXT section includes: `Checkpoint: Loaded (research: complete, write: pending, validate: pending)` reflecting actual checkpoint state
- Stages that will be skipped show `⊘ [SKIP]` indicator from `stage-progress.md` template
- Stages that will execute show `○ [PENDING]` indicator
- If no checkpoint exists when `--resume` is used, preview shows: `Checkpoint: Not found (will error on execution)`
- OUTPUT section lists: `specs/{feature}/` with files `requirements.md`, `design.md`, `tasks.md`, `summary.md`, `spec.json`, `meta.yaml`

---

## Non-Functional Requirements

### NFR-1: Error Resilience

**EARS (Ubiquitous):** WHEN checkpoint save operations fail, THE SYSTEM SHALL log warnings via `logError()` and continue execution without halting.

**Acceptance Criteria:**

- `saveCheckpoint()` failures: logged, execution continues (non-blocking)
- `loadCheckpoint()` failures: return null (silent-fail, matching `checkpoint-manager.cjs` pattern)
- `mcp__linear-server__create_issue` failures: halt execution with blocking error (REQ-5.1)
- `parseFlags()` with invalid string values: returns `null` for that flag with a logged warning

### NFR-2: Token Budget

**EARS (Ubiquitous):** THE SYSTEM SHALL enforce the 500-token limit on all `context_summary` values stored in checkpoints.

**Acceptance Criteria:**

- `validateContextSummary()` from `token-counter.cjs` called before every `saveCheckpoint()` (already enforced in `checkpoint-manager.cjs`)
- Research phase summary: <=500 tokens
- Write phase summary: <=500 tokens
- Oversized summaries rejected with descriptive error message from `token-counter.cjs`

### NFR-3: Checkpoint File Size

**EARS (Ubiquitous):** THE SYSTEM SHALL keep checkpoint files under 50KB per feature.

**Acceptance Criteria:**

- Context summaries limited to 500 tokens each (3 phases max = ~1500 tokens)
- `checkpoint_responses` stored as concise key-value pairs, not full conversation transcripts
- No binary data or large file contents stored in checkpoints

---

## Out of Scope

- Per-sub-agent checkpoint granularity (checkpoints are per-phase only: one checkpoint after RESEARCH completes, not per-parallel-researcher)
- Automatic retry of failed phases (user must manually re-run with `--phase=X` or `--resume`)
- Concurrent `/design` runs for different features (sequential only; no file locking)
- Checkpoint integration for `/reconcile` and `/research` commands (separate spec)
- Linear issue status updates during `/implement` execution (only issue creation at design approval time)
- Migration of existing specs to include `summary.md`/`spec.json` retroactively
- Manual checkpoint file editing tools

---

## Dependencies

| Dependency               | Type     | Status                                                              |
| ------------------------ | -------- | ------------------------------------------------------------------- |
| `checkpoint-manager.cjs` | Module   | Implemented (`.claude/scripts/lib/checkpoint-manager.cjs`)          |
| `command-utils.cjs`      | Module   | Implemented (`.claude/scripts/lib/command-utils.cjs`)               |
| `token-counter.cjs`      | Module   | Implemented (`.claude/scripts/lib/token-counter.cjs`)               |
| `integrations.json`      | Config   | Implemented (`.claude/config/integrations.json`)                    |
| `spec.json` template     | Template | Implemented (`specs/templates/spec.json`)                           |
| `summary.md` template    | Template | Implemented (`specs/templates/summary.md`)                          |
| `meta.yaml` template     | Template | Implemented (`specs/templates/meta.yaml`)                           |
| `command-preview.md`     | Template | Implemented (`.claude/skills/preview/templates/command-preview.md`) |
| `stage-progress.md`      | Template | Implemented (`.claude/skills/progress/templates/stage-progress.md`) |
| `mcp__linear-server__*`  | MCP      | Available (external)                                                |
| `plan-agent.md`          | Agent    | `.claude/agents/plan-agent.md`                                      |
| `design.md` command      | Command  | `.claude/commands/design.md`                                        |
| `implement.md` command   | Command  | `.claude/commands/implement.md`                                     |

---
