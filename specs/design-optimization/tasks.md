# Tasks: Design Incremental Execution

> **Status:** Approved
> **Created:** 2026-01-31
> **Spec ID:** design-incremental-execution

## Progress

**Total:** 0/22 tasks complete

**Critical Path:** T001 -> T002 -> T006 -> T007 -> T008 -> T012 -> T016 -> T017 -> T018

**Files:** 4 modified files + 3 auto-generated files per feature

**Checklist:**

- [ ] T001: Extend parseFlags() for string type flags
- [ ] T002: Add flags section to design.md
- [ ] T003: Add Flags to design.md parsing logic
- [ ] T004: Add unified command preview to design.md
- [ ] T005: Update implement.md to read summary.md
- [ ] T006: Implement checkpoint-manager.cjs module
- [ ] T007: Implement phase execution with --phase flag
- [ ] T008: Implement --resume flag loading checkpoint
- [ ] T009: Implement --no-checkpoint flag suppression
- [ ] T010: Implement --dry-run flag preview mode
- [ ] T011: Add pre-design checkpoint questions
- [ ] T012: Add post-design checkpoint questions
- [ ] T013: Auto-generate summary.md from template
- [ ] T014: Auto-generate meta.yaml from template
- [ ] T015: Auto-generate spec.json from template
- [ ] T016: Implement Linear issue creation on approval
- [ ] T017: Store Linear identifier in spec.json
- [ ] T018: Display Linear issue link in output
- [ ] T019: Implement implement.md reading summary.md
- [ ] T020: Implement implement.md reading spec.json
- [ ] T021: Update plan-agent.md with new output files
- [ ] T022: Full system integration and E2E testing

---

## Phase 1: Foundation

### T001: Extend parseFlags() to support string type flags [REQ-1.1, REQ-1.4]

Extend `parseFlags()` in `.claude/scripts/lib/command-utils.cjs` to support a `{ type: 'string', values?: string[] }` flag definition alongside the existing `'boolean'` shorthand. String flags are parsed via `--flag=value` syntax. If a `values` array is provided, the parsed value is validated against it; invalid values return `null` with a logged warning.

**File:** `.claude/scripts/lib/command-utils.cjs`

**Changes:**

- In the `for...of` loop over `flagDefinitions`, add an `else if` branch for when `flagType` is an object with `type === 'string'`
- Use regex `new RegExp('--' + flagName + '=(\\S+)', 'i')` to capture the value
- If `flagType.values` array exists, validate captured value is in the array
- If validation fails or no match, set `flags[flagName] = null`
- Preserve existing `flagType === 'boolean'` branch unchanged
- Add JSDoc documenting the new flag definition shape

**\_Prompt:**
**Role:** Backend Developer | **Task:** Extend `parseFlags()` in `.claude/scripts/lib/command-utils.cjs` to support string-typed flags. Add an `else if` branch for flag definitions that are objects with `{ type: 'string', values?: string[] }`. Parse `--flag=value` syntax via regex. If `values` array is provided, validate the captured value is in the array; return `null` if invalid. Add JSDoc for the new shape. | **Restrictions:** No new files. No new dependencies. Use the same coding style as the existing `parseFlags()` function. | **Success:** `parseFlags('/design feat --phase=research', { phase: { type: 'string', values: ['research','write','validate'] } })` returns `{ phase: 'research' }`. `parseFlags('/design feat --phase=invalid', ...)` returns `{ phase: null }`. Boolean flags still work.

---

## Phase 2: Command Definition Updates

### T002: Add flags section to design.md [REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4]

Add a `## Flags` section to `.claude/commands/design.md` documenting the 4 new flags: `--phase=X`, `--resume`, `--no-checkpoint`, `--dry-run`. Add a `## Usage` section at the top showing example invocations. Update the `$ARGUMENTS` variable reference to integrate with flag parsing.

**File:** `.claude/commands/design.md`

**Changes:**

- Add `## Usage` section after the title with example invocations
- Add `## Flags` section with a table: Flag | Description | Example
- Document flag combinations and precedence

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add `## Usage` and `## Flags` sections to `.claude/commands/design.md`. Usage section shows 6 example invocations: bare `/design feature`, `--phase=research`, `--phase=write`, `--resume`, `--no-checkpoint`, `--dry-run`. Flags section is a markdown table with columns Flag, Description, Example. Include a note on flag combinations: `--dry-run` exits after preview; `--no-checkpoint` suppresses interactive prompts but saves checkpoints; `--resume` skips completed phases; `--phase` runs a single phase. Place Usage after the title and before the existing MANDATORY section. Place Flags after Usage. | **Restrictions:** Do not remove or reorder existing sections. Keep the existing preview, output, and Task Examples sections intact. Preserve `$ARGUMENTS` on the last line. | **Success:** The file contains `## Usage`, `## Flags`, and all existing sections in logical order.

---

### T003: Update design.md preview to show checkpoint status [REQ-8.1, REQ-8.2]

Update the preview section in `.claude/commands/design.md` to use the unified `command-preview.md` template with checkpoint status, flags display, and the expanded output list.

**File:** `.claude/commands/design.md`

**Changes:**

- Replace the hardcoded preview box with a reference to `.claude/skills/preview/templates/command-preview.md`
- Add variable table mapping template variables to design-specific values
- Add CONTEXT section showing checkpoint status when `--resume` is used
- Add FLAGS display in CONTEXT section

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Replace the hardcoded preview box in `.claude/commands/design.md` (lines 73-93) with a template-driven preview referencing `.claude/skills/preview/templates/command-preview.md`. Add a variable table mapping: `{{command}}`=`design`, `{{description}}`=`Conversational Spec Creation`, `{{feature}}`=feature name, `{{checkpoint}}`=`.claude/state/design-{feature}.json`. Add CONTEXT section showing: Feature, Checkpoint status (none/loaded with phase statuses), active Flags. STAGES section: 1. RESEARCH (domain-researcher/Opus), 2. WRITE (domain-writer/Sonnet), 3. VALIDATE (quality-validator/Haiku). OUTPUT section: specs/{feature}/ with files requirements.md, design.md, tasks.md, summary.md, spec.json. Follow the exact pattern used in `.claude/commands/implement.md` preview section. | **Restrictions:** Keep the AskUserQuestion confirmation reference. Do not change the Task Examples section. | **Success:** Preview section references the unified template, includes variable table, and shows checkpoint status.

---

### T004: Add summary.md and spec.json to design.md output list [REQ-4.1, REQ-6.1]

Update the `## Output` section in `.claude/commands/design.md` to include `summary.md` and `spec.json` in the file list.

**File:** `.claude/commands/design.md`

**Changes:**

- Add `summary.md` and `spec.json` to the bullet list in the Output section
- Add brief descriptions for each new file

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update the `## Output` section in `.claude/commands/design.md` to add two new files to the output list: `specs/{feature}/summary.md` - Human-readable summary with status and key decisions, and `specs/{feature}/spec.json` - Machine-readable metadata with phases, tasks, and Linear identifier. Keep the existing 3 files (requirements.md, design.md, tasks.md) and add the 2 new ones after them. | **Restrictions:** Do not remove existing output entries. Keep the same formatting style (bullet list with dash prefix and description). | **Success:** Output section lists 5 files: requirements.md, design.md, tasks.md, summary.md, spec.json.

---

### T005: Add --dry-run exit logic to design.md [REQ-1.4]

Document the dry-run behavior in `design.md`: after rendering the preview, if `--dry-run` is active, output the exit message and do not proceed to phase execution.

**File:** `.claude/commands/design.md`

**Changes:**

- Add a note in the MANDATORY section or a new `## Dry Run` section explaining that `--dry-run` exits after preview
- Document the exit message: "Dry run complete. No changes made."

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add dry-run documentation to `.claude/commands/design.md`. Either add a bullet point in the MANDATORY section or create a new `## Dry Run` section that explains: when `--dry-run` flag is active, the system renders the unified preview (including checkpoint status if `--resume` is also set), displays the message "Dry run complete. No changes made.", and exits without spawning any sub-agents or writing any files. | **Restrictions:** Do not change existing behavior descriptions. Keep it concise (3-5 lines). | **Success:** The file documents that --dry-run shows preview and exits without execution.

---

## Phase 3: Checkpoint Integration in plan-agent.md

### T006: Add checkpoint load at start of /design flow [REQ-1.2, REQ-2.3]

Add checkpoint loading logic to the plan-agent.md `/design` flow. When `--resume` is passed, call `loadCheckpoint('design', feature)` and determine which phases to skip based on `state.completed_phases`. Extract `context_summary` from the last completed phase for handoff to the next phase.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a new step at the start of the "Full Flow (/design [feature])" section: "Load checkpoint if --resume"
- Add logic to determine `completedPhases` and `resumeContext`
- Add error handling for missing/stale/complete checkpoints
- Show code example using `loadCheckpoint()` and `getResumePoint()`

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add checkpoint loading to the "Full Flow (/design [feature])" section in `.claude/agents/plan-agent.md`. Insert a new step before "PHASE 1: PARALLEL ANALYSIS" that: (1) checks if `--resume` flag is set, (2) calls `loadCheckpoint('design', feature)` from `.claude/scripts/lib/checkpoint-manager.cjs`, (3) if no checkpoint exists, reports error "No checkpoint found for {feature}. Run without --resume to start fresh.", (4) if `checkpoint.completed_at` is set, reports "Design already complete. Run without --resume to start fresh.", (5) extracts `completedPhases = checkpoint.state.completed_phases`, (6) extracts `resumeContext` from the last completed phase's `context_summary`, (7) warns if `head_commit` differs from current HEAD. Show this as a code/pseudocode block in the flow diagram. | **Restrictions:** Do not modify existing phase logic. This is additive. Follow the existing flow diagram notation style (using `│`, `├──`, `└──`, `▼`). | **Success:** The flow diagram shows checkpoint loading as the first step, with error handling for missing/stale/complete checkpoints.

---

### T007: Add checkpoint save after RESEARCH phase [REQ-2.1]

Add a checkpoint save call after the RESEARCH phase completes in `plan-agent.md`. Use `updatePhase('design', 'research', { status: 'complete', context_summary }, feature)`.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- After the "Wait for all analyzers" step and "Check for blockers" step, add a checkpoint save step
- Show the `updatePhase()` call with the research `context_summary`
- Note that checkpoint save failures are non-blocking (logged, execution continues)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add a checkpoint save step to `.claude/agents/plan-agent.md` after the RESEARCH phase (after "Check for blockers" and before "PHASE 2: AGGREGATE SUMMARIES"). The step calls `updatePhase('design', 'research', { status: 'complete', context_summary: aggregatedSummary }, feature)` from `.claude/scripts/lib/checkpoint-manager.cjs`. Add a note that if the save fails, execution continues (non-blocking, warning logged). Show this as a step in the existing flow diagram between the blocker check and the summary aggregation. | **Restrictions:** Do not modify existing phase steps. This is a single additive step inserted between existing steps. Follow the existing flow notation. | **Success:** The flow diagram shows `Save checkpoint (research: complete)` between the blocker check and aggregation steps.

---

### T008: Add checkpoint save after WRITE phase [REQ-2.2]

Add a checkpoint save call after the WRITE phase completes in `plan-agent.md`. Use `updatePhase('design', 'write', { status: 'complete', context_summary, files_created }, feature)`.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- After the "PHASE 3: SPEC CREATION" step, add checkpoint save
- Include `files_created` array listing all output files
- Note that this is before the interactive post-design checkpoint

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add a checkpoint save step to `.claude/agents/plan-agent.md` after the WRITE phase (after "PHASE 3: SPEC CREATION" creates the spec files, but before validation). The step calls `updatePhase('design', 'write', { status: 'complete', context_summary: writeSummary, files_created: ['requirements.md', 'design.md', 'tasks.md', 'summary.md', 'spec.json', 'meta.yaml'] }, feature)`. Add a note that if the save fails, execution continues (non-blocking). Show this in the flow diagram after spec creation. | **Restrictions:** Do not modify existing phase steps. This is a single additive step. Follow the existing flow notation. | **Success:** The flow diagram shows `Save checkpoint (write: complete)` after spec creation and before validation.

---

### T009: Add --phase flag handling to plan-agent.md [REQ-1.1]

Add conditional phase execution logic to `plan-agent.md`. When `--phase=X` is passed, only the selected phase runs. If a phase requires context from a previous phase (e.g., `--phase=write` needs research context), load it from checkpoint.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add phase filtering logic after flag parsing and before phase execution
- Document that `--phase=write` requires either a research checkpoint or will start research first
- Document that `--phase=validate` requires spec files to exist
- Show conditional execution in the flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add `--phase` flag handling to `.claude/agents/plan-agent.md` in the "/design" flow. After parsing flags and before executing phases, add a phase filtering step: (1) if `flags.phase` is set, `phasesToRun = [flags.phase]`, (2) if `flags.phase === 'write'` and no research checkpoint exists, either load context from a previous run or error with "Research phase must complete before write. Run: /design {feature} --phase=research first.", (3) if `flags.phase === 'validate'` and spec files do not exist, error with "Spec files must exist before validation. Run: /design {feature} --phase=write first.", (4) if no `--phase` flag, `phasesToRun = ['research', 'write', 'validate']`. Show this as a decision block in the flow diagram. | **Restrictions:** Do not change the actual phase execution logic. Only add the filtering/gating logic. Follow existing flow notation. | **Success:** The flow shows phase filtering with clear error messages for missing prerequisites.

---

### T010: Add --resume flag handling to plan-agent.md [REQ-1.2, REQ-2.3]

Add resume logic that integrates with the checkpoint load (T006) and the phase filtering (T009). When `--resume` is active, determine which phases to skip and which context to carry forward.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Connect the checkpoint load logic (T006) to the phase execution
- Show how `completedPhases` determines `phasesToRun`
- Show how `resumeContext` is passed to the next phase
- Document interaction with `--phase` flag (--resume + --phase=validate: resume and only run validate)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add `--resume` flag handling to `.claude/agents/plan-agent.md` that integrates with checkpoint loading (from T006) and phase filtering (from T009). After loading the checkpoint: (1) `completedPhases = checkpoint.state.completed_phases`, (2) `phasesToRun = allPhases.filter(p => !completedPhases.includes(p))`, (3) if `--phase` is also set, intersect: `phasesToRun = phasesToRun.filter(p => p === flags.phase)`, (4) for each phase that runs, pass `context_summary` from the prior completed phase as input (e.g., research context_summary passed to write phase). Document that `--resume` and `--phase` can combine: `--resume --phase=validate` skips completed phases and runs only validate if it is not yet complete. Show the context handoff in the flow diagram. | **Restrictions:** Do not duplicate checkpoint loading logic from T006. Reference it. Follow existing flow notation. | **Success:** The flow shows how --resume determines phasesToRun and how context flows from completed phases to pending phases.

---

## Phase 4: Interactive Checkpoints

### T011: Implement pre-design checkpoint in plan-agent.md [REQ-3.1, REQ-3.3]

Add the pre-design interactive checkpoint to `plan-agent.md`. After research completes and checkpoint is saved, present the 6 structured questions (unless `--no-checkpoint`). Store responses in the checkpoint.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a new section/step after the research checkpoint save
- Show the 6 pre-design questions with variable population from `context_summary`
- Document that questions are skipped if `--no-checkpoint` is passed
- Show response storage in `phases.research.checkpoint_responses`
- Document cancel/stop handling

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add pre-design interactive checkpoint to `.claude/agents/plan-agent.md`. After the research checkpoint save and before the WRITE phase: (1) check `if (!flags['no-checkpoint'])`, (2) present 6 structured questions populated from research `context_summary`: Understanding, Approach, Assumptions, Trade-offs, Scope, Unknowns (exact text from REQ-3.3 in requirements.md), (3) collect responses via structured prompts, (4) store responses in checkpoint via `updatePhase('design', 'research', { checkpoint_responses: {...} }, feature)`, (5) if user responds "stop" or "cancel" to any question, halt with "Design paused. Resume with: /design {feature} --resume", (6) pass user responses as additional context to the write phase. Show this as a step in the flow diagram between research checkpoint save and write phase execution. | **Restrictions:** Questions must match REQ-3.3 exactly. Do not modify existing phase logic. Checkpoint responses are additive to the existing research phase data. | **Success:** The flow shows 6 questions after research, with cancel handling and response storage.

---

### T012: Implement post-design checkpoint in plan-agent.md [REQ-3.2, REQ-3.4]

Add the post-design interactive checkpoint to `plan-agent.md`. After write completes and checkpoint is saved, present the 6 structured questions (unless `--no-checkpoint`). Handle approval, rejection, and revision responses.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a new section/step after the write checkpoint save
- Show the 6 post-design questions with variable population
- Document the 3 approval responses: yes (Linear + validate), no (halt), revise (re-run write)
- Show response storage in `phases.write.checkpoint_responses`

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add post-design interactive checkpoint to `.claude/agents/plan-agent.md`. After the write checkpoint save and before the VALIDATE phase: (1) check `if (!flags['no-checkpoint'])`, (2) present 6 structured questions populated from write phase output: What Built, Decisions, Risks, Omissions, Confidence, Approval (exact text from REQ-3.4 in requirements.md), (3) collect responses via structured prompts, (4) store in checkpoint via `updatePhase('design', 'write', { checkpoint_responses: {...} }, feature)`, (5) handle Approval response: "yes" triggers Linear issue creation (T016-T018) and proceeds to validate; "no" halts with "Design not approved. Revise with: /design {feature} --phase=write"; "revise" re-runs the write phase with user feedback as additional context, (6) update summary.md status to "Approved" on "yes". Show this as a decision block in the flow diagram. | **Restrictions:** Questions must match REQ-3.4 exactly. The Linear integration call should reference T016-T018 (not implemented here, just call site). Do not modify existing validation logic. | **Success:** The flow shows 6 questions after write, with 3 approval branches (yes/no/revise) and Linear trigger on "yes".

---

### T013: Add --no-checkpoint flag handling [REQ-1.3]

Document the `--no-checkpoint` flag behavior in `plan-agent.md`. This flag suppresses the interactive checkpoints (T011, T012) while preserving the checkpoint file persistence (T007, T008).

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add the `--no-checkpoint` check as a guard around the interactive checkpoint blocks
- Document that checkpoint file saves (updatePhase, completeCheckpoint) still execute
- Document that Linear issue creation is skipped (requires approval prompt)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add `--no-checkpoint` flag documentation to `.claude/agents/plan-agent.md`. In the interactive checkpoint sections (pre-design from T011 and post-design from T012), add conditional guards: `if (!flags['no-checkpoint']) { presentCheckpoint() }`. Explicitly document: (1) `--no-checkpoint` suppresses the 6 pre-design questions and the 6 post-design questions, (2) checkpoint file persistence (`updatePhase()`, `completeCheckpoint()`) still executes regardless, (3) Linear issue creation is skipped because it requires explicit user approval at the post-design checkpoint, (4) `--no-checkpoint` is designed for CI/batch runs or when the user wants to skip interactive review. | **Restrictions:** Do not modify the checkpoint persistence logic. Do not modify the existing phase execution. Only add the conditional guards and documentation. | **Success:** Interactive checkpoints are wrapped in `if (!flags['no-checkpoint'])` guards with clear documentation of what is skipped and what is preserved.

---

## Phase 5: Auto-Generation

### T014: Auto-generate summary.md after write phase [REQ-4.1, REQ-4.2]

Add summary.md auto-generation to `plan-agent.md`. After the domain-writer creates the 3 core spec files, generate `summary.md` from the template.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a step after domain-writer completion to generate summary.md
- Document template variable population from write phase output
- Show the template source: `specs/templates/summary.md`

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add summary.md auto-generation to `.claude/agents/plan-agent.md` in the WRITE phase. After the domain-writer creates requirements.md, design.md, and tasks.md: (1) read template from `specs/templates/summary.md`, (2) populate `{{feature_name}}` with title-cased feature name, (3) populate `{{status}}` with "Draft", (4) populate `{{one_paragraph_summary}}` with a 2-4 sentence summary from the write phase context_summary, (5) populate `{{decision_1..N}}` with 3-5 key decisions extracted from design.md, (6) write the populated template to `specs/{feature}/summary.md`. Document that the domain-writer sub-agent should produce all 5 files (including summary.md) in a single invocation, using the template as a guide. The status is updated to "Approved" later at T012 (post-design checkpoint approval). | **Restrictions:** Use the existing template from `specs/templates/summary.md`. No new templates. All placeholders must be filled (no `{{...}}` in output). | **Success:** After the write phase, `specs/{feature}/summary.md` exists with filled content matching the template structure.

---

### T015: Auto-generate spec.json after write phase [REQ-6.1]

Add spec.json auto-generation to `plan-agent.md`. After the domain-writer creates the spec files, generate `spec.json` from the template.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a step after domain-writer completion to generate spec.json
- Document template variable population
- Show the template source: `specs/templates/spec.json`
- Note that the `linear` block is omitted initially and added later (T018)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add spec.json auto-generation to `.claude/agents/plan-agent.md` in the WRITE phase. After the domain-writer creates the spec files: (1) read template from `specs/templates/spec.json`, (2) populate `name` with feature name (kebab-case), (3) `status` = "draft", (4) `created`/`updated` = ISO 8601 date, (5) `author` = "plan-agent", (6) `version` = "1.0.0", (7) `files` object maps all 5 spec file names, (8) `phases` array extracted from tasks.md section headers (e.g., "Foundation", "Command Updates"), (9) `tasks` array with id, title, status="pending", assignee=null for each task in tasks.md, (10) omit the `linear` block initially (added by T018 after approval). Document that the domain-writer sub-agent should generate spec.json as part of its output, treating the template as a schema guide. Write valid JSON with 2-space indentation. | **Restrictions:** Use the existing template from `specs/templates/spec.json`. Output must be valid JSON. The `linear` block is omitted initially (not filled with placeholders). | **Success:** After the write phase, `specs/{feature}/spec.json` exists as valid JSON with all fields populated except `linear`.

---

### T022: Auto-generate meta.yaml after write phase [REQ-4.3]

Add meta.yaml auto-generation to `plan-agent.md`. After the domain-writer creates the spec files, generate `meta.yaml` from the template alongside summary.md and spec.json.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a step after domain-writer completion to generate meta.yaml
- Document template variable population from write phase output
- Show the template source: `specs/templates/meta.yaml`

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add meta.yaml auto-generation to `.claude/agents/plan-agent.md` in the WRITE phase. After the domain-writer creates the spec files: (1) read template from `specs/templates/meta.yaml`, (2) populate `id` with feature name (kebab-case), (3) `status` = "draft", (4) `created` and `updated` = current date (YYYY-MM-DD), (5) `tasks_total` = count of tasks in tasks.md, (6) `tasks_complete` = 0. Write the populated template to `specs/{feature}/meta.yaml`. Document that the domain-writer sub-agent should produce all 6 files (including meta.yaml) in a single invocation. | **Restrictions:** Use the existing template from `specs/templates/meta.yaml`. All placeholders must be filled. | **Success:** After the write phase, `specs/{feature}/meta.yaml` exists with populated id, status, dates, and task counts.

---

## Phase 6: Linear Integration

### T016: Read integrations.json for Linear config [REQ-5.1]

Add Linear configuration reading to `plan-agent.md`. Before attempting to create a Linear issue, read `.claude/config/integrations.json` and check `linear.enabled`.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a step that reads integrations.json
- Document the check: if `linear.enabled !== true`, skip issue creation
- Show graceful handling if integrations.json is missing or malformed

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add Linear configuration reading to `.claude/agents/plan-agent.md`. In the post-design checkpoint approval flow (after user says "yes"): (1) read `.claude/config/integrations.json`, (2) parse JSON and check `linear.enabled`, (3) if `linear.enabled === false`, skip Linear issue creation silently (explicit opt-out), (4) if file is missing or JSON is invalid, HALT with error: "Linear configuration not found. Create .claude/config/integrations.json with linear.enabled and linear.team", (5) extract `linear.team` value for use in issue creation. Show this as a prerequisite check before the MCP call. | **Restrictions:** Do not create new config files. Missing/malformed config is a blocking error. Only `linear.enabled: false` is a valid skip. | **Success:** The flow checks `linear.enabled` before attempting issue creation. Missing config halts execution. `linear.enabled: false` skips silently.

---

### T017: Create Linear issue via MCP after approval [REQ-5.1, REQ-5.3]

Add the MCP call to create a Linear issue after post-design approval. Use `mcp__linear-server__create_issue` with the feature title and spec summary.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add MCP call step after Linear config check (T016)
- Document the call parameters: title, description, teamId
- Show success and failure handling
- Document the output display: "Linear: {identifier} - {url}"

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add Linear issue creation via MCP to `.claude/agents/plan-agent.md`. After confirming `linear.enabled === true` (from T016): (1) build issue payload: title = `"[Design] {feature_name}"` (title-cased), description = summary paragraph from summary.md + spec directory link + key decisions from design.md, teamId = `integrations.linear.team` value, (2) call `mcp__linear-server__create_issue` with the payload, (3) on success: extract `identifier` and `url` from the response, display `"Linear: {identifier} - {url}"` in the output, and pass identifier/url to T018, (4) on failure: HALT with error "Linear issue creation failed: {error}. Fix MCP configuration and re-run with: /design {feature} --resume". Show this as a step in the post-design approval flow. | **Restrictions:** Use MCP tool `mcp__linear-server__create_issue`. Failure is a blocking error (halt execution). Do not hardcode team IDs. | **Success:** On approval with `linear.enabled`, a Linear issue is created and its identifier is displayed. On failure, execution halts with error and fix instructions.

---

### T018: Store Linear identifier in spec.json [REQ-5.2]

After Linear issue creation succeeds, update `specs/{feature}/spec.json` to include the `linear.identifier` and `linear.url` fields.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a step after successful MCP call (T017) to update spec.json
- Read existing spec.json, add `linear` block, rewrite file
- Document that this only runs on successful Linear issue creation

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add spec.json Linear update to `.claude/agents/plan-agent.md`. After successful Linear issue creation (from T017): (1) read `specs/{feature}/spec.json`, (2) parse as JSON, (3) add `linear` object: `{ "identifier": "{id}", "url": "{url}" }` using the values returned from the MCP call, (4) update `status` from `"draft"` to `"approved"`, (5) update `updated` to current ISO date, (6) rewrite `specs/{feature}/spec.json` with the updated JSON (2-space indentation). When Linear is explicitly disabled (`linear.enabled: false`), omit the `linear` block. Show this as a step immediately after the Linear MCP call. | **Restrictions:** Only modify spec.json when Linear issue creation succeeds. Use JSON.parse/JSON.stringify for safe manipulation. Preserve all existing spec.json fields. | **Success:** After approval with successful Linear creation, spec.json contains `linear.identifier` and `linear.url`. When Linear is disabled, spec.json has no `linear` block.

---

### T019: Display Linear issue link in design output [REQ-5.3]

Ensure the final design output includes the Linear issue link when a Linear issue was created.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add Linear link to the "After WRITE" and "After VALIDATE" output sections
- Document conditional display: only shown when Linear issue was created

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update the output sections in `.claude/agents/plan-agent.md` to include the Linear issue link. In the "After VALIDATE" output section (and optionally "After WRITE"), add a conditional line: `Linear: {identifier} - {url}` that is displayed only when a Linear issue was successfully created. If no Linear issue was created (disabled, skipped, or failed), omit this line entirely. Place it after the file listing and before "Next Steps". | **Restrictions:** Only display when Linear issue exists. Do not add placeholder text when Linear is not used. Follow existing output formatting. | **Success:** Design output shows "Linear: BASE-123 - https://linear.app/..." when a Linear issue was created, and omits the line when it was not.

---

## Phase 7: /implement Integration

### T020: Update /implement to read summary.md for quick context [REQ-7.1]

Update `.claude/commands/implement.md` to check for and read `specs/{feature}/summary.md` as an initial context source before loading the full spec.

**File:** `.claude/commands/implement.md`

**Changes:**

- Add a new step in "What Happens" before "Parse tasks": check for summary.md
- If present, extract the one-paragraph summary and pass to researcher sub-agent
- If present, display summary in the preview CONTEXT section
- If absent, fall back to existing behavior (no error)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `.claude/commands/implement.md` to read `specs/{feature}/summary.md` for quick context. Add a new step between "Check spec exists" (step 1) and "Parse tasks" (step 2) in the "What Happens" section: (1) check if `specs/{feature}/summary.md` exists, (2) if present, read the file and extract the one-paragraph summary (text between `## Summary` and `---`), (3) pass the summary as initial context to the researcher sub-agent's prompt (as a `SUMMARY:` field), (4) display the summary in the preview CONTEXT section as `Summary: {first_sentence}...`, (5) if absent, skip this step (no error). Update the preview CONTEXT section example to show the summary line. | **Restrictions:** summary.md is optional. Absence must not cause errors. Do not change existing task parsing logic. This is additive context, not a replacement for reading spec files. | **Success:** When summary.md exists, /implement displays a summary line in the preview and passes it as context. When absent, behavior is unchanged.

---

### T021: Update /implement to read spec.json for routing and task data [REQ-7.2]

Update `.claude/commands/implement.md` to check for and read `specs/{feature}/spec.json` as a machine-readable source for phases, tasks, and Linear tracking.

**File:** `.claude/commands/implement.md`

**Changes:**

- Add a new step to read spec.json before task parsing
- If present, use `phases` and `tasks` arrays instead of parsing tasks.md
- If present and `linear.identifier` exists, include in progress output
- If absent, fall back to task-parser.parseTasks() (existing behavior)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `.claude/commands/implement.md` to read `specs/{feature}/spec.json` for machine-readable task data. Add a new step between "Check spec exists" (step 1) and "Parse tasks" (step 2) in the "What Happens" section: (1) check if `specs/{feature}/spec.json` exists, (2) if present, read and parse as JSON, (3) use `spec.json.phases` array for phase enumeration instead of parsing tasks.md section headers, (4) use `spec.json.tasks` array for task listing (id, title, status, assignee), (5) if `spec.json.linear.identifier` exists, include it in checkpoint data and progress output (e.g., "Linear: BASE-123"), (6) if absent, use task-parser as alternative (no error). Document that `spec.json` is authoritative when present, with `tasks.md` as alternative. Add a note in the Prerequisites section mentioning spec.json as an optional enhanced input. | **Restrictions:** spec.json is optional. Absence must not cause errors. Maintain backward compatibility with specs that do not have spec.json. Do not remove existing task-parser logic. | **Success:** When spec.json exists, /implement uses its phases and tasks arrays. When absent, behavior is unchanged. Linear identifier appears in progress when available.

---

## Task Dependencies

```text
Phase 1 (Foundation):
  T001 (parseFlags string support)

Phase 2 (Command Definition):
  T002 (flags section)     ─── depends on ──→ T001
  T003 (preview update)    ─── depends on ──→ T002
  T004 (output list)       ─── independent
  T005 (dry-run docs)      ─── depends on ──→ T002

Phase 3 (Checkpoint Integration):
  T006 (checkpoint load)   ─── depends on ──→ T002
  T007 (research save)     ─── depends on ──→ T006
  T008 (write save)        ─── depends on ──→ T007
  T009 (--phase handling)  ─── depends on ──→ T006
  T010 (--resume handling) ─── depends on ──→ T006, T009

Phase 4 (Interactive Checkpoints):
  T011 (pre-design)        ─── depends on ──→ T007
  T012 (post-design)       ─── depends on ──→ T008
  T013 (--no-checkpoint)   ─── depends on ──→ T011, T012

Phase 5 (Auto-generation):
  T014 (summary.md)        ─── depends on ──→ T008
  T015 (spec.json)         ─── depends on ──→ T008
  T022 (meta.yaml)         ─── depends on ──→ T008

Phase 6 (Linear Integration):
  T016 (read config)       ─── depends on ──→ T012
  T017 (create issue)      ─── depends on ──→ T016
  T018 (store identifier)  ─── depends on ──→ T015, T017
  T019 (display link)      ─── depends on ──→ T017

Phase 7 (/implement Integration):
  T020 (read summary.md)   ─── depends on ──→ T014
  T021 (read spec.json)    ─── depends on ──→ T015
```

**Critical Path:** T001 -> T002 -> T006 -> T007 -> T008 -> T012 -> T016 -> T017 -> T018

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] `parseFlags()` supports string-type flags with optional validation (T001)
2. [ ] `/design` command documents all 4 flags with usage examples (T002-T005)
3. [ ] Checkpoint is saved after each phase of `/design` (T006-T008)
4. [ ] `--phase`, `--resume`, and `--no-checkpoint` flags control execution flow (T009-T013)
5. [ ] Pre-design and post-design interactive checkpoints present 6 questions each (T011-T012)
6. [ ] `summary.md`, `spec.json`, and `meta.yaml` are auto-generated after the write phase (T014-T015, T022)
7. [ ] Linear issue is created on post-design approval and stored in spec.json (T016-T018)
8. [ ] Linear MCP failure halts execution with error (T017)
9. [ ] `/implement` reads `summary.md` and `spec.json` when available (T020-T021)

---
