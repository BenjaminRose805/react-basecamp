# Tasks: Design Hierarchy

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy

## Progress

**Total:** 26/26 tasks complete

**Critical Path:** T001 -> T002 -> T003 -> T009 -> T010 -> T014 -> T022 -> T023

**Files:** 8 modified/created files + 4 new templates + 2 new validator templates

---

## Phase 1: Level Flag Infrastructure

### T001: Add --project, --feature, --spec flags to design.md command [REQ-H1.1, REQ-H1.2, REQ-H1.3]

Add three boolean flags (`--project`, `--feature`, `--spec`) to `.claude/commands/design.md` command definition. Document that these flags are mutually exclusive and determine the design level (project/feature/spec).

**File:** `.claude/commands/design.md`

**Changes:**

- Add `## Flags` section with a table documenting the three level flags
- Add examples showing `--project`, `--feature`, `--spec` usage
- Document mutual exclusivity constraint
- Add a note that if no level flag is passed, the user will be prompted to select one

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add level flags documentation to `.claude/commands/design.md`. Create a `## Flags` section after the existing Usage section. Add a markdown table with columns: Flag, Description, Example. Document three flags: `--project` (design at project level, produces project.md + features.json), `--feature` (design at feature level, produces feature.md + specs.json), `--spec` (design at spec level, produces 6 spec files). Add a note: "Flags are mutually exclusive. If multiple level flags are passed, an error is returned. If no level flag is passed, you will be prompted to select a level." Include 3 example invocations: `/design my-project --project`, `/design auth-system --feature`, `/design incremental-execution --spec`. | **Restrictions:** Do not remove existing sections. Place Flags section after Usage and before MANDATORY. Follow existing markdown formatting style. | **Success:** The file contains a Flags section with clear documentation of the 3 level flags, mutual exclusivity note, and 3 examples.

---

### T002: Add mutual exclusivity validation [REQ-H1.1]

Add validation logic to `plan-agent.md` that checks for multiple level flags and reports an error if more than one is passed.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a level flag validation step at the start of the `/design` flow
- Check if more than one of `flags.project`, `flags.feature`, `flags.spec` is true
- If multiple flags are set, report error: "Only one of --project, --feature, --spec allowed"
- Exit without executing any phases

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level flag mutual exclusivity validation to `.claude/agents/plan-agent.md`. At the start of the "/design" flow (before checkpoint loading): (1) count how many of `flags.project`, `flags.feature`, `flags.spec` are true, (2) if count > 1, display error: "Only one of --project, --feature, --spec allowed", (3) HALT execution without starting any phases. Add this as a step in the flow diagram before "Load checkpoint". Use the existing flow notation style (using `│`, `├──`, `└──`). | **Restrictions:** This is a guard condition, runs before all other logic. Do not modify existing phase execution. Follow existing error handling pattern. | **Success:** The flow shows mutual exclusivity check before checkpoint loading, with error message and halt on multiple flags.

---

### T003: Add prompt-if-missing behavior [REQ-H1.4]

Add interactive prompt logic to `plan-agent.md` that presents a level selection menu when no level flag is passed.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- After mutual exclusivity validation, check if all level flags are false
- If no level flag is set, present interactive prompt with 3 options: (1) Project, (2) Feature, (3) Spec
- Include brief descriptions for each option
- Store user selection in the appropriate flag (`flags.project`, `flags.feature`, or `flags.spec`)
- Continue execution with the selected level

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add prompt-if-missing logic to `.claude/agents/plan-agent.md`. After the mutual exclusivity check (from T002): (1) check if all three level flags (project, feature, spec) are false, (2) if all false, present interactive prompt: "Select design level: (1) Project: overall vision and feature list, (2) Feature: spec list and dependency graph, (3) Spec: detailed 6-file specification", (3) collect user response (1, 2, or 3), (4) set the corresponding flag based on response (1 → flags.project=true, 2 → flags.feature=true, 3 → flags.spec=true), (5) continue execution. Add this as a step in the flow diagram after mutual exclusivity check and before checkpoint loading. Use existing flow notation. | **Restrictions:** Only prompt when no level flags are set. After prompt, execution proceeds normally with the selected level. Do not modify existing phase logic. | **Success:** The flow shows prompt logic after mutual exclusivity check, with 3 options and flag setting based on user response.

---

### T004: Update preview to show level context [REQ-H1.1, REQ-H1.2, REQ-H1.3]

Update the preview section in `.claude/commands/design.md` to display the active level (project/feature/spec) in the CONTEXT section.

**File:** `.claude/commands/design.md`

**Changes:**

- Add `Level: {project|feature|spec}` line to the CONTEXT section of the preview
- Update the OUTPUT section to show level-appropriate files (project.md + features.json for project, feature.md + specs.json for feature, 6 files for spec)
- Update STAGES section descriptions to reflect level-specific research/write/validate goals

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update the preview section in `.claude/commands/design.md` to show level context. In the CONTEXT section of the preview template reference: (1) add a `Level:` line showing the active level (Project / Feature / Spec), (2) update OUTPUT section to be conditional based on level: Project → specs/{name}/project.md + features.json, Feature → specs/{parent?}/{name}/feature.md + specs.json, Spec → specs/{parent?}/{name}/ with 6 files. Update STAGES section descriptions: RESEARCH (Project: vision/scope/features, Feature: rough_specs/breakdown, Spec: requirements/design/tasks), WRITE (level-appropriate artifacts), VALIDATE (level-appropriate checks). | **Restrictions:** Keep the unified template reference structure. Do not hardcode the preview. Follow the pattern from design-incremental-execution preview updates. | **Success:** Preview template reference shows level-aware CONTEXT, OUTPUT, and STAGES sections.

---

## Phase 2: Templates

### T005: Create specs/templates/project.md [REQ-H4.1]

Create a markdown template for project-level artifacts with sections: Vision, Scope, Feature List (with rough specs per feature), Out of Scope, Dependencies.

**File:** `specs/templates/project.md`

**Changes:**

- Create new template file
- Add header comment explaining template usage
- Define sections: Vision, Scope, Feature List, Out of Scope, Dependencies
- Add placeholders for all variable content ({{...}})
- Include an example feature with rough specs

**\_Prompt:**
**Role:** Technical Writer | **Task:** Create `specs/templates/project.md` template. Structure: (1) header comment: "Template for project-level design artifacts. Populate all {{...}} placeholders.", (2) `# {{project_name}}` title, (3) `## Vision` section with `{{vision_paragraph}}` placeholder (2-4 sentences describing project purpose and goals), (4) `## Scope` section with `{{scope_description}}` (what's included in the project), (5) `## Feature List` section with example: `### {{feature_name}}` and `{{feature_rough_specs}}` (2-4 sentences per feature describing what it does), (6) `## Out of Scope` section with `{{out_of_scope_items}}` (bullet list of what's explicitly excluded), (7) `## Dependencies` section with `{{dependencies_list}}` (external dependencies and prerequisites). Use clear placeholder naming. Add usage notes in header comment. | **Restrictions:** Use markdown formatting. All content must be placeholders (no hardcoded values). Keep template generic and reusable. | **Success:** Template file exists with all 5 sections, clear placeholders, and usage documentation.

---

### T006: Create specs/templates/feature.md [REQ-H4.2]

Create a markdown template for feature-level artifacts with sections: Overview, Spec List (with dependencies), Build Order, Cross-Feature Dependencies.

**File:** `specs/templates/feature.md`

**Changes:**

- Create new template file
- Add header comment explaining template usage
- Define sections: Overview, Spec List, Build Order, Cross-Feature Dependencies
- Add placeholders for all variable content
- Include example spec with depends_on references

**\_Prompt:**
**Role:** Technical Writer | **Task:** Create `specs/templates/feature.md` template. Structure: (1) header comment: "Template for feature-level design artifacts. Populate all {{...}} placeholders.", (2) `# {{feature_name}}` title, (3) `## Overview` section with `{{feature_overview}}` (2-3 paragraphs describing feature purpose, scope, and context), (4) `## Spec List` section with example: `### {{spec_name}}` (bullet list: description, depends_on: [spec-a, spec-b]), (5) `## Build Order` section with `{{build_order}}` (numbered list of specs in topological order based on dependencies), (6) `## Cross-Feature Dependencies` section with `{{cross_feature_deps}}` (bullet list of dependencies on specs in other features, format: {project}/{feature}/{spec}). Add note in header: "Build order is derived from depends_on graph via topological sort." | **Restrictions:** Use markdown formatting. All content must be placeholders. Include example format for depends_on references. | **Success:** Template file exists with all 4 sections, dependency format examples, and usage documentation.

---

### T007: Create specs/templates/features.json [REQ-H4.3]

Create a JSON template for project-level feature manifest with schema: `{ project, features: [{ name, description, rough_specs }] }`.

**File:** `specs/templates/features.json`

**Changes:**

- Create new template file (valid JSON)
- Add header comment (JSON comment style) explaining schema
- Define structure with placeholders
- Include 2 example features
- Use 2-space indentation

**\_Prompt:**
**Role:** Backend Developer | **Task:** Create `specs/templates/features.json` template as valid JSON. Structure: `{ "project": "{{project_name}}", "features": [ { "name": "{{feature_1_name}}", "description": "{{feature_1_description}}", "rough_specs": "{{feature_1_rough_specs}}" }, { "name": "{{feature_2_name}}", "description": "{{feature_2_description}}", "rough_specs": "{{feature_2_rough_specs}}" } ] }`. Add schema documentation in a comment at the top (using JSON comment convention `//`): "Schema: project (string), features (array of { name, description, rough_specs }). rough_specs: 2-4 sentence summary of feature purpose and scope." Use 2-space indentation. Include 2 example features to show array structure. | **Restrictions:** Output must be valid JSON. Use placeholders for all values. No hardcoded content. | **Success:** Template file exists as valid JSON with correct schema, 2 example features, and documentation comment.

---

### T008: Create specs/templates/specs.json [REQ-H4.4]

Create a JSON template for feature-level spec manifest with schema: `{ feature, specs: [{ name, description, depends_on }] }`.

**File:** `specs/templates/specs.json`

**Changes:**

- Create new template file (valid JSON)
- Add header comment explaining schema and depends_on format
- Define structure with placeholders
- Include 3 example specs with different depends_on patterns (within-feature, cross-feature, no deps)
- Use 2-space indentation

**\_Prompt:**
**Role:** Backend Developer | **Task:** Create `specs/templates/specs.json` template as valid JSON. Structure: `{ "feature": "{{feature_name}}", "specs": [ { "name": "{{spec_1_name}}", "description": "{{spec_1_description}}", "depends_on": [] }, { "name": "{{spec_2_name}}", "description": "{{spec_2_description}}", "depends_on": ["{{spec_1_name}}"] }, { "name": "{{spec_3_name}}", "description": "{{spec_3_description}}", "depends_on": ["{{project}}/{{other_feature}}/{{other_spec}}"] } ] }`. Add schema documentation comment: "Schema: feature (string), specs (array of { name, description, depends_on }). depends_on: array of spec names within same feature, or cross-feature refs as 'project/feature/spec'." Use 2-space indentation. Include 3 examples showing: no deps, within-feature dep, cross-feature dep. | **Restrictions:** Output must be valid JSON. Use placeholders for all values. Show all three dependency patterns. | **Success:** Template file exists as valid JSON with correct schema, 3 example specs showing different depends_on patterns, and documentation comment.

---

## Phase 3: Plan-Agent Pipeline

### T009: Add level detection to plan-agent.md [REQ-H3.1, REQ-H3.2, REQ-H3.3]

Add level detection logic to `plan-agent.md` that determines the active level (project/feature/spec) after flag parsing and prompt-if-missing.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- After level flag resolution (T002, T003), add a step to detect active level
- Set `level` variable to 'project', 'feature', or 'spec' based on which flag is true
- Document that this level variable is used for all subsequent routing decisions
- Show level detection in the flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level detection to `.claude/agents/plan-agent.md`. After prompt-if-missing logic (from T003) and before checkpoint loading: (1) determine active level by checking which flag is true: `level = flags.project ? 'project' : flags.feature ? 'feature' : 'spec'`, (2) log the detected level: `"Design level: {level}"`, (3) store level in a variable for use in routing decisions throughout the flow. Add this as a step in the flow diagram. Document that this level variable controls all phase routing (research, write, validate). Use existing flow notation. | **Restrictions:** This is a single variable assignment step. Do not modify existing phase logic. Level detection happens once, before any phases execute. | **Success:** The flow shows level detection as a distinct step after prompt-if-missing, with level variable set and logged.

---

### T010: Route research phase by level [REQ-H3.1]

Add conditional routing in the RESEARCH phase of `plan-agent.md` based on the detected level. Project level explores vision/scope/features, feature level reads parent rough_specs and breaks down into specs, spec level uses current behavior.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Modify RESEARCH phase to branch on `level` variable
- Project level: 3 researchers explore vision (1), scope/features (2), rough specs (3)
- Feature level: 3 researchers read parent features.json rough_specs (1), break down into specs (2), identify dependencies (3)
- Spec level: current behavior unchanged (requirements, design, tasks)
- Show conditional routing in flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level-aware research routing to `.claude/agents/plan-agent.md` RESEARCH phase. After the phase starts: (1) branch on `level` variable: `IF level === 'project'`, spawn 3 domain-researchers (Opus) with prompts: Researcher 1: "Explore project vision and target users", Researcher 2: "Identify scope boundaries and candidate features", Researcher 3: "Draft rough specs (2-4 sentences) for each feature". `ELSE IF level === 'feature'`, spawn 3 domain-researchers: Researcher 1: "Read parent features.json and extract rough_specs for this feature", Researcher 2: "Break down feature into 3-7 specs", Researcher 3: "Identify dependencies between specs and estimate build order". `ELSE` (spec level), use current behavior (no changes). (2) All branches aggregate context_summary (~500 tokens). Show this as a conditional block in the flow diagram using existing notation. | **Restrictions:** Do not modify existing aggregation or checkpoint save logic. Only change researcher prompts and focus based on level. Spec level is unchanged. | **Success:** RESEARCH phase shows 3 branches (project/feature/spec) with level-specific researcher prompts, all converging to context_summary aggregation.

---

### T011: Route write phase by level [REQ-H3.2]

Add conditional routing in the WRITE phase of `plan-agent.md` based on the detected level. Project level generates project.md + features.json, feature level generates feature.md + specs.json, spec level generates 6 files (current behavior).

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Modify WRITE phase to branch on `level` variable
- Project level: read templates (project.md, features.json), spawn domain-writer, generate 2 files, create .project-marker
- Feature level: read templates (feature.md, specs.json), spawn domain-writer, generate 2 files, create .feature-marker
- Spec level: current behavior (6 files)
- Show conditional routing and template usage in flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level-aware write routing to `.claude/agents/plan-agent.md` WRITE phase. After the phase starts: (1) branch on `level` variable: `IF level === 'project'`, read templates from `specs/templates/project.md` and `specs/templates/features.json`, spawn domain-writer (Sonnet) with context: research context_summary + pre-design checkpoint responses + templates, generate: `specs/{name}/project.md` and `specs/{name}/features.json`, create marker: `specs/{name}/.project-marker`. `ELSE IF level === 'feature'`, read templates from `specs/templates/feature.md` and `specs/templates/specs.json`, spawn domain-writer with context: research context_summary (including parent rough_specs) + pre-design checkpoint responses + templates, generate: `specs/{parent?}/{name}/feature.md` and `specs/{parent?}/{name}/specs.json`, create marker: `.feature-marker`. `ELSE` (spec level), use current behavior (generate 6 files). (2) Show directory creation, file writes, and marker file creation in the flow diagram. | **Restrictions:** Do not modify checkpoint save logic. Only change writer sub-agent prompts and output files based on level. Spec level is unchanged. | **Success:** WRITE phase shows 3 branches with level-specific templates, output files, and marker file creation.

---

### T012: Route validate phase by level [REQ-H3.3]

Add conditional routing in the VALIDATE phase of `plan-agent.md` based on the detected level. Project level checks structure, feature level checks JSON schema + DAG, spec level uses current behavior.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Modify VALIDATE phase to branch on `level` variable
- Project level: spawn quality-validator with validator-project.md template
- Feature level: spawn quality-validator with validator-feature.md template (includes DAG cycle detection)
- Spec level: spawn quality-validator with validator-spec.md template (current behavior)
- Show conditional routing in flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level-aware validate routing to `.claude/agents/plan-agent.md` VALIDATE phase. After the phase starts: (1) branch on `level` variable: `IF level === 'project'`, spawn quality-validator (Haiku) with template: `.claude/agents/templates/validator-project.md`, validate: features.json is valid JSON, >=1 feature, unique names, deny-list check, project.md has required sections. `ELSE IF level === 'feature'`, spawn quality-validator with template: `.claude/agents/templates/validator-feature.md`, validate: specs.json is valid JSON, matches schema, unique names, deny-list check, no cycles in depends_on DAG, feature.md has required sections. `ELSE` (spec level), spawn quality-validator with template: `.claude/agents/templates/validator-spec.md` (current behavior: EARS notation, acceptance criteria, \_Prompt blocks). (2) All branches return `{ passed: boolean, issues: string[] }`. Show validator template usage in the flow diagram. | **Restrictions:** Do not modify checkpoint completion logic. Only change validator sub-agent template and validation checks based on level. Spec level is unchanged. | **Success:** VALIDATE phase shows 3 branches with level-specific validator templates and validation checks.

---

### T013: Update context_summary flow for level [REQ-H3.4]

Document the level-appropriate context_summary content for each phase in `plan-agent.md`. Project research summarizes vision/scope/features, feature research summarizes parent rough_specs/breakdown/deps, spec research uses current format.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a section documenting context_summary format per level
- Project research context: vision, scope, feature candidates, rough specs overview (<=500 tokens)
- Feature research context: parent rough specs, spec breakdown, dependencies identified (<=500 tokens)
- Spec research context: current format (requirements, design, constraints) (<=500 tokens)
- Reference existing 500-token limit from design-incremental-execution

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add context_summary documentation to `.claude/agents/plan-agent.md`. Create a new section "Context Summary by Level" after the level detection step. Document: (1) Project level: research context_summary contains: vision (1-2 sentences), scope (1-2 sentences), feature candidates (list with rough specs), rough specs overview. Write context_summary contains: features identified (count), rough specs quality, coverage assessment. (2) Feature level: research context_summary contains: parent rough_specs (from features.json), spec breakdown (list of 3-7 specs), dependencies identified, build order estimate. Write context_summary contains: specs identified (count), dependency graph correctness, build order. (3) Spec level: current format (no changes). All context summaries limited to <=500 tokens per phase (enforced by token-counter.cjs). Reference REQ-H3.4 from requirements.md. | **Restrictions:** This is documentation only, no code changes. Reference existing token limit enforcement. Do not change actual context_summary generation logic. | **Success:** The file contains a "Context Summary by Level" section documenting the expected content format for each level.

---

## Phase 4: Directory Management

### T014: Implement nested directory creation [REQ-H5.1, REQ-H5.2, REQ-H5.3]

Add nested directory creation logic to `plan-agent.md` WRITE phase. Create `specs/{project}/` for projects, `specs/{project}/{feature}/` for features, `specs/{project}/{feature}/{spec}/` for specs, with fallback to flat structure for standalone artifacts.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add directory path determination logic based on level and parent context
- Project: `specs/{name}/`
- Feature: `specs/{parent}/{name}/` if parent exists, else `specs/{name}/` (standalone)
- Spec: `specs/{parent_path}/{name}/` if parents exist, else `specs/{name}/` (standalone)
- Create directories recursively using `mkdir -p`
- Show directory creation in write phase flow

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add nested directory creation to `.claude/agents/plan-agent.md` WRITE phase. Before writing files: (1) determine directory path based on level and parent: Project → `specs/{name}`, Feature → `specs/{parent}/{name}` if parent exists (validated by T015) else `specs/{name}` (standalone), Spec → `specs/{parent_project}/{parent_feature}/{name}` if parents exist else `specs/{name}` (standalone). (2) Create directory: `mkdir -p {directory_path}` (recursive creation). (3) For project level, create marker file: `touch {directory_path}/.project-marker`. For feature level, create: `touch {directory_path}/.feature-marker`. (4) Document directory structure in flow: show path determination → directory creation → marker file creation → file writes. Use existing flow notation. | **Restrictions:** Directory creation happens before any file writes. Marker files are created for project and feature levels only (spec level uses 6-file heuristic). Follow existing error handling. | **Success:** WRITE phase shows directory path determination, recursive creation, marker file creation, with support for both nested and standalone structures.

---

### T015: Add collision detection [REQ-H5.4, REQ-H9.1]

Add collision detection logic to `plan-agent.md` that checks for existing directories/files with the same name before creating new artifacts. Report conflicts based on marker files and spec file heuristics.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add collision detection step before directory creation (from T014)
- Check if directory exists: `test -d specs/{name}`
- If exists, check for marker files (.project-marker, .feature-marker) and spec files (requirements.md, design.md, tasks.md)
- Report collision with error message indicating the existing type
- Halt execution before writing any files

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add collision detection to `.claude/agents/plan-agent.md` WRITE phase. Before directory creation (from T014): (1) check if target directory exists: `test -d {directory_path}`, (2) if exists, check for type markers: `test -f {directory_path}/.project-marker` (existing project), `test -f {directory_path}/.feature-marker` (existing feature), `test -f {directory_path}/requirements.md && test -f {directory_path}/design.md` (existing spec). (3) If collision detected, report error based on type: "Name collision: '{name}' exists as a project. Choose a different name or use --parent." (for project collision), "Name collision: '{name}' exists as a feature. Choose a different name." (for feature collision), "Name collision: '{name}' exists as a spec. Choose a different name." (for spec collision). (4) HALT execution without writing any files. Add this as a step in the flow diagram before directory creation. Use existing error handling and flow notation. | **Restrictions:** Collision detection runs before directory creation. Errors are blocking (halt execution). Do not modify existing directory creation or file write logic. | **Success:** WRITE phase shows collision detection step before directory creation, with type-specific error messages and halt behavior.

---

### T016: Integrate with spec-path-resolver [REQ-H5.5]

Integrate the spec-path-resolver utility from Spec 1 into `plan-agent.md` for parent validation, collision detection, and path disambiguation.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add call to `resolveSpecPath(name)` from `.claude/scripts/lib/spec-resolver.cjs` (dependency from Spec 1)
- Use resolver output for parent validation (does parent exist?)
- Use resolver output for collision detection (does name already exist as different type?)
- Use resolver output for --parent disambiguation (multiple matches)
- Document resolver integration in the flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Integrate spec-path-resolver into `.claude/agents/plan-agent.md`. After level detection and before directory creation: (1) import resolver utility: `const { resolveSpecPath } = require('./.claude/scripts/lib/spec-resolver.cjs')` (from Spec 1: spec-path-resolution), (2) for parent validation: call `resolveSpecPath(parent)` to check if parent exists, use result type ('project' or 'feature') to validate correct parent level, (3) for collision detection: call `resolveSpecPath(name)` to check if name already exists, compare result type with current level, error if types differ (e.g., creating project but name exists as feature), (4) for disambiguation: if --parent is ambiguous (name exists in multiple locations), use resolver to find all matches and prompt user to specify full path. Show resolver calls in the flow diagram at: parent validation step, collision detection step. Document resolver return format: `{ type: 'project' | 'feature' | 'spec', path: 'specs/...' } | null`. | **Restrictions:** Resolver utility is a dependency from Spec 1 (spec-path-resolution). Do not implement resolver logic here, only call it. Handle null result (not found) appropriately. | **Success:** Flow shows resolver integration for parent validation and collision detection, with correct usage of resolver return values.

---

### T017: Handle out-of-order creation (standalone fallback) [REQ-H2.4, REQ-H9.5]

Add standalone fallback logic to `plan-agent.md` that creates flat directory structure when parent does not exist, with warnings and documentation notes.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- When parent validation fails (parent not found), do not error; instead, create standalone directory
- Feature without project: create `specs/{feature}/` with note in feature.md: "Parent project: [not yet defined]"
- Spec without feature: create `specs/{spec}/` with note in requirements.md: "Parent feature: [not yet defined]"
- Log warning: "Creating standalone {level}. Link to parent later by creating the parent structure."
- Show standalone fallback path in flow diagram

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add standalone fallback to `.claude/agents/plan-agent.md` parent validation step. After parent validation (from T016): (1) if parent not found and --parent not explicitly provided, trigger standalone mode: set `standalone = true`, log warning: "Warning: Creating standalone {level}. Link to parent later by creating the parent structure.", set directory path to flat structure: `specs/{name}`. (2) During WRITE phase, if `standalone === true`: for feature level, add note to feature.md: "**Parent project:** [not yet defined]", for spec level, add note to requirements.md: "**Parent feature:** [not yet defined]". (3) Show standalone fallback as a branch in the flow diagram: parent not found → standalone mode → flat directory → note added to artifact. Use existing flow notation. | **Restrictions:** Standalone is a fallback, not an error. Only triggered when parent is missing and --parent is not explicitly provided. Explicit --parent with missing parent is still an error (REQ-H2.2, REQ-H2.3). | **Success:** Flow shows standalone fallback branch with warning, flat directory creation, and note addition to artifacts.

---

## Phase 5: Checkpoints

### T018: Implement level-prefixed checkpoint keys [REQ-H6.1, REQ-H6.2]

Update checkpoint key construction in `plan-agent.md` to use level-prefixed keys: `design-project-{name}`, `design-feature-{name}`, `design-spec-{name}`.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- After level detection, construct checkpoint key: `checkpointKey = 'design-' + level + '-' + name`
- Use `checkpointKey` in all checkpoint operations: `saveCheckpoint()`, `loadCheckpoint()`, `updatePhase()`, `completeCheckpoint()`
- Document checkpoint key format in flow diagram
- No changes to checkpoint-manager.cjs (feature param becomes level-prefixed name)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add level-prefixed checkpoint keys to `.claude/agents/plan-agent.md`. After level detection (from T009): (1) construct checkpoint key: `checkpointKey = 'design-' + level + '-' + name`, where level is 'project', 'feature', or 'spec', and name is kebab-case name of the artifact. Example keys: `design-project-react-basecamp`, `design-feature-auth-system`, `design-spec-incremental-execution`. (2) Update all checkpoint calls to use `checkpointKey` instead of plain `name`: `loadCheckpoint('design', checkpointKey)`, `saveCheckpoint('design', checkpointKey, data)`, `updatePhase('design', phase, data, checkpointKey)`, `completeCheckpoint('design', checkpointKey)`. (3) Document checkpoint key format in the flow diagram at checkpoint loading step. Note: no changes to checkpoint-manager.cjs code (the feature parameter is now the level-prefixed key). | **Restrictions:** Only change the key construction, not checkpoint-manager.cjs. Checkpoint schema is unchanged. Follow existing checkpoint call patterns from design-incremental-execution. | **Success:** All checkpoint operations use level-prefixed keys. Flow diagram shows key construction format. Checkpoint files are saved as `.claude/state/design-{level}-{name}.json`.

---

### T019: Create project checkpoint questions (6+6) [REQ-H8.1, REQ-H8.2]

Add project-level interactive checkpoint questions to `plan-agent.md`. 6 pre-design questions (after research) and 6 post-design questions (after write) specific to project-level concerns.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add project pre-design checkpoint (6 questions): Vision, Users, Features, Boundaries, Priorities, Risks
- Add project post-design checkpoint (6 questions): Features Produced, Rough Specs, Coverage, Granularity, Naming, Approval
- Questions populate variables from context_summary (pre-design) and write output (post-design)
- Store responses in checkpoint: `phases.research.checkpoint_responses` and `phases.write.checkpoint_responses`
- Approval at project level does NOT create Linear issue (document this in question 6)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add project checkpoint questions to `.claude/agents/plan-agent.md`. (1) Pre-design checkpoint (after research, if level === 'project'): present 6 questions from REQ-H8.1 (Vision, Users, Features, Boundaries, Priorities, Risks), populate from research context_summary, collect responses, store in `checkpoint.phases.research.checkpoint_responses`. (2) Post-design checkpoint (after write, if level === 'project'): present 6 questions from REQ-H8.2 (Features Produced, Rough Specs, Coverage, Granularity, Naming, Approval), populate from write output (features.json), collect responses, store in `checkpoint.phases.write.checkpoint_responses`. (3) Question 6 (Approval): "yes" → update summary status to Approved (no Linear issue for projects), proceed to validate; "no" → halt; "revise" → re-run write phase with feedback. (4) Add note: "Note: Linear issues are created at spec level only." Show both checkpoints in the flow diagram with level branching. Use exact question text from REQ-H8.1 and REQ-H8.2. | **Restrictions:** Project checkpoints only run when level === 'project'. Responses stored in checkpoint. No Linear integration at project level. Follow existing checkpoint pattern from design-incremental-execution. | **Success:** Flow shows project-specific 6+6 checkpoint questions, with approval handling (no Linear) and note about spec-level Linear integration.

---

### T020: Create feature checkpoint questions (6+6) [REQ-H8.3, REQ-H8.4]

Add feature-level interactive checkpoint questions to `plan-agent.md`. 6 pre-design questions (after research) and 6 post-design questions (after write) specific to feature-level concerns.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add feature pre-design checkpoint (6 questions): Understanding, Rough Specs Input, Dependencies, Boundaries, Complexity, Constraints
- Add feature post-design checkpoint (6 questions): Specs Produced, Dependencies, Build Order, Cross-Feature, Gaps, Approval
- Questions populate variables from context_summary (pre-design) and write output (post-design)
- Store responses in checkpoint
- Approval at feature level does NOT create Linear issue (document this in question 6)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add feature checkpoint questions to `.claude/agents/plan-agent.md`. (1) Pre-design checkpoint (after research, if level === 'feature'): present 6 questions from REQ-H8.3 (Understanding, Rough Specs Input, Dependencies, Boundaries, Complexity, Constraints), populate from research context_summary (including parent rough_specs read from features.json), collect responses, store in `checkpoint.phases.research.checkpoint_responses`. (2) Post-design checkpoint (after write, if level === 'feature'): present 6 questions from REQ-H8.4 (Specs Produced, Dependencies, Build Order, Cross-Feature, Gaps, Approval), populate from write output (specs.json), collect responses, store in `checkpoint.phases.write.checkpoint_responses`. (3) Question 6 (Approval): "yes" → update status to Approved (no Linear issue for features), proceed to validate; "no" → halt; "revise" → re-run write phase with feedback. (4) Add note: "Note: Linear issues are created at spec level only." Show both checkpoints in the flow diagram with level branching. Use exact question text from REQ-H8.3 and REQ-H8.4. | **Restrictions:** Feature checkpoints only run when level === 'feature'. Responses stored in checkpoint. No Linear integration at feature level. Follow existing checkpoint pattern. | **Success:** Flow shows feature-specific 6+6 checkpoint questions, with approval handling (no Linear) and note about spec-level Linear integration.

---

### T021: Verify spec checkpoint questions unchanged [REQ-H8.5]

Document that spec-level checkpoint questions remain unchanged from design-incremental-execution. No code changes needed, only verification and documentation.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- Add a note in the checkpoint section documenting that spec-level checkpoints are unchanged
- Reference design-incremental-execution for spec checkpoint question details
- Confirm that Linear integration is triggered by spec-level approval (existing behavior)
- No code changes required

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add spec checkpoint documentation to `.claude/agents/plan-agent.md`. In the checkpoint section (after project and feature checkpoint additions from T019-T020): (1) add a note: "Spec-level checkpoints: Unchanged from design-incremental-execution. Pre-design questions: Understanding, Approach, Assumptions, Trade-offs, Scope, Unknowns. Post-design questions: What Built, Decisions, Risks, Omissions, Confidence, Approval. Approval triggers Linear issue creation (spec level only)." (2) Reference REQ-H8.5 from requirements.md. (3) No code changes needed. Show spec checkpoint in the flow diagram with level branching (if level === 'spec': use existing checkpoint logic). | **Restrictions:** This is documentation only. Do not modify existing spec checkpoint code. Confirm Linear integration is preserved for spec level. | **Success:** Documentation confirms spec checkpoints are unchanged with reference to design-incremental-execution and Linear integration note.

---

## Phase 6: Validation

### T022: Create validator-project.md template [REQ-H7.1]

Create a validator template for project-level artifacts with checks: valid JSON, >=1 feature, unique names, deny-list validation, required sections.

**File:** `.claude/agents/templates/validator-project.md`

**Changes:**

- Create new validator template file
- Document validation checks as a checklist
- Include sample validation script/pseudocode
- Return format: `{ passed: boolean, issues: string[] }`
- Reference deny-list from spec-path-resolution (Spec 1)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Create `.claude/agents/templates/validator-project.md` validator template. Structure: (1) header: "Validator for project-level design artifacts. Check structural correctness of project.md and features.json.", (2) validation checklist: Check 1: features.json is valid JSON (use JSON.parse, catch errors), Check 2: features.json contains >=1 feature, Check 3: all feature names are unique (no duplicates), Check 4: all feature names pass deny-list validation (call deny-list from Spec 1: spec-path-resolution), Check 5: project.md has required sections: Vision, Scope, Feature List, Out of Scope. (3) Return format: `{ passed: boolean, issues: string[] }`. If all checks pass, `passed = true, issues = []`. If any check fails, `passed = false, issues = ['Check 2 failed: no features defined', ...]`. (4) Include pseudocode for validation logic. Reference REQ-H7.1. | **Restrictions:** This is a template for the validator sub-agent, not executable code. Use clear pseudocode/checklist format. Reference deny-list utility from Spec 1. | **Success:** Validator template exists with 5 checks, return format documentation, and pseudocode/checklist.

---

### T023: Create validator-feature.md template [REQ-H7.2]

Create a validator template for feature-level artifacts with checks: valid JSON, schema match, unique names, deny-list validation, valid depends_on refs, DAG cycle detection, required sections.

**File:** `.claude/agents/templates/validator-feature.md`

**Changes:**

- Create new validator template file
- Document validation checks as a checklist (7 checks)
- Include DAG cycle detection algorithm (DFS traversal)
- Return format: `{ passed: boolean, issues: string[] }`
- Reference deny-list from spec-path-resolution (Spec 1)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Create `.claude/agents/templates/validator-feature.md` validator template. Structure: (1) header: "Validator for feature-level design artifacts. Check JSON schema and DAG correctness of specs.json.", (2) validation checklist: Check 1: specs.json is valid JSON, Check 2: specs.json matches schema `{ feature: string, specs: [{ name, description, depends_on }] }`, Check 3: all spec names are unique, Check 4: all spec names pass deny-list validation (from Spec 1), Check 5: depends_on references are valid (within-feature or cross-feature refs as 'project/feature/spec'), Check 6: no cycles in dependency DAG (use DFS traversal with visited set, see design.md for algorithm), Check 7: feature.md has required sections: Overview, Spec List, Build Order. (3) Return format: `{ passed: boolean, issues: string[] }`. If cycle detected: `issues = ['Cycle detected: spec-a -> spec-b -> spec-c -> spec-a']`. (4) Include pseudocode for DAG cycle detection (hasCycle function from design.md). Reference REQ-H7.2. | **Restrictions:** This is a template, not executable code. Use clear pseudocode for cycle detection. Cross-feature refs (containing '/') are treated as external (no cycle check across features). | **Success:** Validator template exists with 7 checks, DAG cycle detection pseudocode, return format documentation.

---

### T024: Verify validator-spec.md unchanged [REQ-H7.3]

Document that spec-level validator remains unchanged from design-incremental-execution. No code changes needed, only verification and documentation.

**File:** `.claude/agents/templates/validator-spec.md`

**Changes:**

- Add a comment at the top documenting that this validator is unchanged for design-hierarchy
- Reference design-incremental-execution for spec validation logic
- Confirm existing checks: EARS notation, acceptance criteria, \_Prompt blocks
- No code changes required

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add a comment to `.claude/agents/templates/validator-spec.md` (existing file from design-incremental-execution). At the top of the file, add: "NOTE: This validator is unchanged for design-hierarchy (Spec 2). Spec-level validation logic remains the same: check EARS notation in requirements.md, acceptance criteria per requirement, \_Prompt blocks per task in tasks.md. See design-incremental-execution for details. Reference REQ-H7.3." | **Restrictions:** This is a comment addition only. Do not modify existing validation logic. Confirm all existing checks are preserved. | **Success:** validator-spec.md contains a note documenting that it is unchanged for design-hierarchy with reference to design-incremental-execution and REQ-H7.3.

---

## Phase 7: Edge Cases

### T025: Implement feature redesign manifest diffing [REQ-H9.2]

Add manifest diffing logic to `plan-agent.md` WRITE phase that compares new specs.json with existing specs.json when redesigning a feature, warning about removed specs.

**File:** `.claude/agents/plan-agent.md`

**Changes:**

- In feature-level WRITE phase, check if specs.json already exists
- If exists, load old specs.json and parse JSON
- After generating new specs.json, diff: `removedSpecs = oldSpecs.filter(s => !newSpecs.some(n => n.name === s.name))`
- If removedSpecs is not empty, warn: "Warning: The following specs were removed: {list}. Existing spec directories will NOT be deleted. Delete manually if intentional."
- Do not auto-delete spec directories

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add feature redesign manifest diffing to `.claude/agents/plan-agent.md` WRITE phase. For feature-level designs: (1) before generating new specs.json, check if `specs/{project}/{feature}/specs.json` already exists, (2) if exists, read and parse as JSON: `oldSpecs = JSON.parse(oldSpecsJson).specs`, (3) after domain-writer generates new specs.json, parse new specs: `newSpecs = JSON.parse(newSpecsJson).specs`, (4) diff: `removedSpecs = oldSpecs.filter(old => !newSpecs.some(n => n.name === old.name))`, (5) if `removedSpecs.length > 0`, log warning: "Warning: The following specs were removed: {removedSpecs.map(s => s.name).join(', ')}. Existing spec directories will NOT be deleted. Delete manually if intentional." (6) Overwrite specs.json with new version (no auto-delete of spec directories). Show manifest diffing as a step in the write phase flow diagram (feature level only). Reference REQ-H9.2. | **Restrictions:** Only run for feature-level designs. Do not auto-delete spec directories. Warning is informational (non-blocking). Use JSON.parse for parsing. | **Success:** Feature redesign shows manifest diff step with warning about removed specs. No auto-deletion occurs.

---

### T026: Handle stale features.json and cross-feature deps [REQ-H9.3, REQ-H9.4]

Add documentation to `plan-agent.md` and `feature.md` template explaining that parent features.json is not auto-updated during feature refinement, and that cross-feature deps are validated syntactically but not for existence.

**File:** `.claude/agents/plan-agent.md` and `specs/templates/feature.md`

**Changes:**

- Add note to feature.md template: "Note: Parent features.json may be stale. Update manually if needed."
- Add documentation in plan-agent.md that feature refinement (redesign) does not propagate changes to parent features.json
- Document that cross-feature deps (format: `project/feature/spec`) are syntactically valid but existence is not checked
- Validator treats cross-feature deps as external (no cycle detection across features)

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add stale features.json and cross-feature dep documentation. (1) In `specs/templates/feature.md`: add a note at the bottom: "---\n\n**Note:** Parent features.json may be stale. Update manually if needed. Feature refinements do not propagate to parent." (2) In `.claude/agents/plan-agent.md`: add a section "Feature Refinement" documenting: when a feature is redesigned (user runs `/design {feature} --feature` on existing feature), the WRITE phase updates `feature.md` and `specs.json` but does NOT update parent `features.json`. User must manually sync if needed. (3) In `.claude/agents/plan-agent.md` validation section: document that cross-feature deps in `depends_on` (format: `{project}/{feature}/{spec}`) are syntactically validated but existence is not checked. Validator treats them as external dependencies (no cycle detection across features). Reference REQ-H9.3 and REQ-H9.4. | **Restrictions:** This is documentation only. No auto-sync logic. Cross-feature deps are valid if formatted correctly (contain '/'). | **Success:** feature.md template contains stale parent note. plan-agent.md documents feature refinement behavior and cross-feature dep validation scope.

---

## Task Dependencies

```text
Phase 1 (Level Flag Infrastructure):
  T001 (add flags to design.md)
  T002 (mutual exclusivity)   ─── depends on ──→ T001
  T003 (prompt-if-missing)     ─── depends on ──→ T002
  T004 (preview update)        ─── depends on ──→ T001

Phase 2 (Templates):
  T005 (project.md)            ─── independent
  T006 (feature.md)            ─── independent
  T007 (features.json)         ─── independent
  T008 (specs.json)            ─── independent

Phase 3 (Plan-Agent Pipeline):
  T009 (level detection)       ─── depends on ──→ T003
  T010 (research routing)      ─── depends on ──→ T009
  T011 (write routing)         ─── depends on ──→ T009, T005, T006, T007, T008
  T012 (validate routing)      ─── depends on ──→ T009
  T013 (context_summary docs)  ─── depends on ──→ T010

Phase 4 (Directory Management):
  T014 (nested directory)      ─── depends on ──→ T011
  T015 (collision detection)   ─── depends on ──→ T014
  T016 (resolver integration)  ─── depends on ──→ T015 (+ Spec 1)
  T017 (standalone fallback)   ─── depends on ──→ T016

Phase 5 (Checkpoints):
  T018 (level-prefixed keys)   ─── depends on ──→ T009
  T019 (project questions)     ─── depends on ──→ T018
  T020 (feature questions)     ─── depends on ──→ T018
  T021 (spec questions docs)   ─── depends on ──→ T018

Phase 6 (Validation):
  T022 (validator-project)     ─── depends on ──→ T012 (+ Spec 1)
  T023 (validator-feature)     ─── depends on ──→ T012 (+ Spec 1)
  T024 (validator-spec docs)   ─── depends on ──→ T012

Phase 7 (Edge Cases):
  T025 (manifest diffing)      ─── depends on ──→ T011
  T026 (stale docs)            ─── depends on ──→ T011, T006
```

**Critical Path:** T001 -> T002 -> T003 -> T009 -> T010 -> T014 -> T022 -> T023

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] Level flags (`--project`, `--feature`, `--spec`) are documented and implemented with mutual exclusivity (T001-T004)
2. [x] Four new templates exist in `specs/templates/`: project.md, feature.md, features.json, specs.json (T005-T008)
3. [x] Plan-agent routes research/write/validate phases based on level (T009-T013)
4. [x] Nested directory creation works with collision detection and standalone fallback (T014-T017)
5. [x] Checkpoint keys are level-prefixed: `design-{level}-{name}.json` (T018)
6. [x] Project and feature levels have 6+6 interactive checkpoint questions (T019-T021)
7. [x] Project and feature validators exist with structural and DAG checks (T022-T024)
8. [x] Feature redesign shows manifest diff warnings, no auto-deletion (T025)
9. [x] Stale features.json and cross-feature deps are documented (T026)

---
