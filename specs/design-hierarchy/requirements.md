# Requirements: Design Hierarchy

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy

## Overview

Extend the `/design` command to support a 3-tier design hierarchy: project-level (produces `project.md` + `features.json`), feature-level (produces `feature.md` + `specs.json` with DAG dependencies), and spec-level (current 6-file behavior, unchanged). Each level uses the same 3-phase pipeline (research, write, validate) with level-specific routing, artifacts, checkpoint questions, and validation logic. Adds `--project`, `--feature`, `--spec` flags (mutually exclusive), `--parent=X` for disambiguation, nested directory creation with collision detection, and Linear integration only at spec level.

---

## Functional Requirements

### REQ-H1: Level Flags

#### REQ-H1.1: Project Flag

**EARS (Event-driven):** WHEN the user passes `--project`, THE SYSTEM SHALL execute the design pipeline at project level, producing `specs/{project}/project.md` and `specs/{project}/features.json`.

**Acceptance Criteria:**

- `parseFlags()` in `.claude/scripts/lib/command-utils.cjs` supports `--project` as a boolean flag
- Flag is mutually exclusive with `--feature` and `--spec`
- If multiple level flags are passed, error: `Only one of --project, --feature, --spec allowed`
- Project-level routing: research explores the project idea broadly, write produces `project.md` + `features.json`, validate checks structural correctness
- Checkpoint key: `design-project-{name}.json`
- Level flag parsed via existing boolean flag support in `parseFlags()`

#### REQ-H1.2: Feature Flag

**EARS (Event-driven):** WHEN the user passes `--feature`, THE SYSTEM SHALL execute the design pipeline at feature level, producing `specs/{project}/{feature}/feature.md` and `specs/{project}/{feature}/specs.json`.

**Acceptance Criteria:**

- `parseFlags()` supports `--feature` as a boolean flag
- Flag is mutually exclusive with `--project` and `--spec`
- Feature-level routing: research reads parent `features.json` `rough_specs` + explores domain, write produces `feature.md` + `specs.json` with `depends_on` DAG, validate checks JSON schema + DAG cycle detection
- Checkpoint key: `design-feature-{name}.json`
- Requires parent project to exist (checked via marker file or `project.md`)

#### REQ-H1.3: Spec Flag

**EARS (Event-driven):** WHEN the user passes `--spec`, THE SYSTEM SHALL execute the design pipeline at spec level, producing the current 6 files in `specs/{project}/{feature}/{spec}/`.

**Acceptance Criteria:**

- `parseFlags()` supports `--spec` as a boolean flag
- Flag is mutually exclusive with `--project` and `--feature`
- Spec-level routing: unchanged from current behavior (research/write/validate as today)
- Checkpoint key: `design-spec-{name}.json`
- Requires parent feature to exist (checked via marker file or `feature.md`)
- Linear integration applies only at spec level (REQ-H10.1)

#### REQ-H1.4: Prompt If Missing

**EARS (Event-driven):** WHEN no level flag is passed (`--project`, `--feature`, `--spec` all absent), THE SYSTEM SHALL prompt the user to select a level before proceeding.

**Acceptance Criteria:**

- After flag parsing, if no level flag is set, present interactive prompt: `Select design level: (1) Project, (2) Feature, (3) Spec`
- User response sets the effective level flag for execution
- Prompt includes brief descriptions: "Project: overall vision and feature list", "Feature: spec list and dependency graph", "Spec: detailed 6-file specification"
- After selection, execution proceeds as if that flag was originally passed

---

### REQ-H2: Parent Context Flag

#### REQ-H2.1: Parent Flag Definition

**EARS (Event-driven):** WHEN the user passes `--parent=X`, THE SYSTEM SHALL use `X` as the parent context for resolving paths.

**Acceptance Criteria:**

- `parseFlags()` supports `--parent` as a string flag (type: 'string', no values array)
- Parsed via `--parent=value` syntax
- `--parent` is only meaningful with `--feature` (parent=project name) or `--spec` (parent=feature name)
- If `--parent` is passed with `--project`, log warning and ignore (projects have no parent)

#### REQ-H2.2: Parent Validation for Feature

**EARS (Event-driven):** WHEN `--feature` is passed with `--parent=X`, THE SYSTEM SHALL validate that project `X` exists before proceeding.

**Acceptance Criteria:**

- Check for `specs/{parent}/project.md` or marker file
- If not found, error: `Parent project "{parent}" not found. Create it first with: /design {parent} --project`
- Feature directory created at `specs/{parent}/{feature}/`

#### REQ-H2.3: Parent Validation for Spec

**EARS (Event-driven):** WHEN `--spec` is passed with `--parent=X`, THE SYSTEM SHALL validate that feature `X` exists (with project context) before proceeding.

**Acceptance Criteria:**

- If `--parent` value contains `/`, split into `project/feature` and validate both
- If `--parent` value is single name, use path resolution to find the feature (from Spec 1: spec-path-resolution)
- Check for `specs/{project}/{feature}/feature.md` or marker file
- If not found, error: `Parent feature "{parent}" not found. Create it first with: /design {parent} --feature`
- Spec directory created at `specs/{project}/{feature}/{spec}/`

#### REQ-H2.4: Standalone Fallback

**EARS (Event-driven):** WHEN a level is created without a parent existing (out-of-order creation), THE SYSTEM SHALL create a standalone directory and document the missing parent in the artifact.

**Acceptance Criteria:**

- Feature created without project: `specs/{feature}/feature.md` includes note: `Parent project: [not yet defined]`
- Spec created without feature: `specs/{spec}/` with note in `requirements.md`: `Parent feature: [not yet defined]`
- Warning logged: `Creating standalone {level}. Link to parent later by creating the parent structure.`

---

### REQ-H3: Level-Aware Routing

#### REQ-H3.1: Research Phase Routing

**EARS (Event-driven):** WHEN the research phase executes, THE SYSTEM SHALL route researcher sub-agents based on the active level flag.

**Acceptance Criteria:**

- Project level: 3 domain-researchers explore the project idea broadly (vision, scope, feature candidates, rough specs)
- Feature level: 3 domain-researchers read parent `features.json` `rough_specs` field + explore the feature domain (spec breakdown, dependencies, build order)
- Spec level: current behavior unchanged (3 domain-researchers explore spec requirements, design approach, tasks)
- Routing implemented in `plan-agent.md` via conditional logic after flag parsing

#### REQ-H3.2: Write Phase Routing

**EARS (Event-driven):** WHEN the write phase executes, THE SYSTEM SHALL route writer sub-agents based on the active level flag.

**Acceptance Criteria:**

- Project level: domain-writer produces `project.md` (from `specs/templates/project.md`) + `features.json` (from `specs/templates/features.json`)
- Feature level: domain-writer produces `feature.md` (from `specs/templates/feature.md`) + `specs.json` (from `specs/templates/specs.json`)
- Spec level: domain-writer produces 6 files (requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml) - current behavior unchanged
- Templates passed to writer sub-agent as part of the prompt

#### REQ-H3.3: Validate Phase Routing

**EARS (Event-driven):** WHEN the validate phase executes, THE SYSTEM SHALL route validator sub-agents based on the active level flag.

**Acceptance Criteria:**

- Project level: quality-validator checks structural correctness (>=1 feature, no duplicate names, all names valid per Spec 1 deny-list)
- Feature level: quality-validator checks JSON schema + DAG cycle detection for `depends_on` field in `specs.json`
- Spec level: quality-validator checks EARS notation, acceptance criteria, `_Prompt` blocks - current behavior unchanged
- Validation logic implemented via level-specific validator templates

#### REQ-H3.4: Context Summary Flow

**EARS (Event-driven):** WHEN checkpoint saves occur, THE SYSTEM SHALL store level-appropriate context summaries for each phase.

**Acceptance Criteria:**

- Project research context: vision, scope, feature candidates, rough specs overview
- Feature research context: parent rough specs, spec breakdown, dependencies identified
- Spec research context: current behavior (requirements, design approach, constraints)
- Context summaries limited to 500 tokens per phase as per existing checkpoint validation

---

### REQ-H4: New Templates

#### REQ-H4.1: Project Template

**EARS (Ubiquitous):** THE SYSTEM SHALL provide a template at `specs/templates/project.md` for project-level artifacts.

**Acceptance Criteria:**

- Template includes sections: Vision, Scope, Feature List (with rough specs per feature), Out of Scope, Dependencies
- Rough specs per feature: 2-4 sentence description of what the feature does
- Feature list format: markdown headers (### Feature Name) with rough spec paragraph
- All template placeholders (`{{...}}`) documented

#### REQ-H4.2: Feature Template

**EARS (Ubiquitous):** THE SYSTEM SHALL provide a template at `specs/templates/feature.md` for feature-level artifacts.

**Acceptance Criteria:**

- Template includes sections: Overview, Spec List (with dependencies), Build Order, Cross-Feature Dependencies
- Spec list format: bullet list with spec name, description, `depends_on` refs
- Build order: topologically sorted spec names based on DAG
- All template placeholders documented

#### REQ-H4.3: Features JSON Schema

**EARS (Ubiquitous):** THE SYSTEM SHALL provide a template at `specs/templates/features.json` for project-level feature manifest.

**Acceptance Criteria:**

- JSON schema: `{ project: string, features: [{ name: string, description: string, rough_specs: string }] }`
- `rough_specs` field contains 2-4 sentence summary of the feature's purpose and scope
- Valid JSON with 2-space indentation
- Example provided in template comments

#### REQ-H4.4: Specs JSON Schema

**EARS (Ubiquitous):** THE SYSTEM SHALL provide a template at `specs/templates/specs.json` for feature-level spec manifest.

**Acceptance Criteria:**

- JSON schema: `{ feature: string, specs: [{ name: string, description: string, depends_on: string[] }] }`
- `depends_on` array contains spec names within same feature, or cross-feature refs as `"project/feature/spec"`
- Valid JSON with 2-space indentation
- Example provided in template comments

---

### REQ-H5: Nested Directory Creation

#### REQ-H5.1: Project Directory Structure

**EARS (Event-driven):** WHEN a project is designed, THE SYSTEM SHALL create `specs/{project}/` with `project.md` and `features.json`.

**Acceptance Criteria:**

- Directory path: `specs/{project}/`
- Files: `project.md`, `features.json`
- Marker file: `.project-marker` created to distinguish project dirs from legacy flat specs
- Name validation: project name must match deny-list from Spec 1 (spec-path-resolution)

#### REQ-H5.2: Feature Directory Structure

**EARS (Event-driven):** WHEN a feature is designed, THE SYSTEM SHALL create `specs/{project}/{feature}/` with `feature.md` and `specs.json`.

**Acceptance Criteria:**

- Directory path: `specs/{project}/{feature}/` if parent exists, else `specs/{feature}/` (standalone)
- Files: `feature.md`, `specs.json`
- Marker file: `.feature-marker` created to distinguish feature dirs
- Name validation: feature name must match deny-list from Spec 1

#### REQ-H5.3: Spec Directory Structure

**EARS (Event-driven):** WHEN a spec is designed, THE SYSTEM SHALL create `specs/{project}/{feature}/{spec}/` with 6 spec files.

**Acceptance Criteria:**

- Directory path: `specs/{project}/{feature}/{spec}/` if parents exist, else `specs/{spec}/` (standalone)
- Files: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
- No marker file needed (6 files are sufficient identifier)
- Name validation: spec name must match deny-list from Spec 1

#### REQ-H5.4: Collision Detection

**EARS (Event-driven):** WHEN creating a new directory, THE SYSTEM SHALL check for existing directories or files with the same name and report conflicts.

**Acceptance Criteria:**

- Before creating `specs/{project}/`, check for existing `specs/{project}/` directory
- If exists and has `.project-marker`, treat as existing project
- If exists and has `.feature-marker`, error: `Name collision: "{project}" exists as a feature. Choose a different name.`
- If exists and has spec files, error: `Name collision: "{project}" exists as a spec. Choose a different name.`
- Collision detection uses marker files + heuristics (presence of 6 spec files)

#### REQ-H5.5: Path Resolution Integration

**EARS (Event-driven):** WHEN resolving paths, THE SYSTEM SHALL use the resolver utility from Spec 1 (spec-path-resolution).

**Acceptance Criteria:**

- Resolver utility: `.claude/scripts/lib/spec-resolver.cjs` (from Spec 1)
- Call `resolveSpecPath(name)` to find existing projects/features/specs
- Resolver returns: `{ type: 'project' | 'feature' | 'spec', path: 'specs/...' }` or null
- Use resolver output for parent validation and collision detection

#### REQ-H5.6: Nested Directory Cleanup

**EARS (Event-driven):** WHEN a design is created, THE SYSTEM SHALL NOT automatically create parent directories if they do not exist (unless `--parent` is specified).

**Acceptance Criteria:**

- Feature creation without `--parent` creates standalone `specs/{feature}/`
- Spec creation without `--parent` creates standalone `specs/{spec}/`
- No automatic `mkdir -p` of missing parent levels
- User must explicitly create parents first or use `--parent` for disambiguation

---

### REQ-H6: Checkpoint Level-Prefixed Keys

#### REQ-H6.1: Level-Prefixed Checkpoint Keys

**EARS (Event-driven):** WHEN checkpoints are saved, THE SYSTEM SHALL use level-prefixed keys to distinguish checkpoint files.

**Acceptance Criteria:**

- Project level: `.claude/state/design-project-{name}.json`
- Feature level: `.claude/state/design-feature-{name}.json`
- Spec level: `.claude/state/design-spec-{name}.json`
- No changes to `checkpoint-manager.cjs` code (feature param becomes level-prefixed name)
- Checkpoint schema unchanged (version 1, command, feature, phases, state)

#### REQ-H6.2: Checkpoint Key Format

**EARS (Ubiquitous):** THE SYSTEM SHALL construct checkpoint keys as `design-{level}-{name}`.

**Acceptance Criteria:**

- Level: `project`, `feature`, or `spec`
- Name: kebab-case name of the artifact being designed
- Example: `design-project-react-basecamp.json`, `design-feature-auth-system.json`, `design-spec-incremental-execution.json`
- Format used consistently in `saveCheckpoint()`, `loadCheckpoint()`, `updatePhase()`, `completeCheckpoint()` calls

---

### REQ-H7: Level-Specific Validation

#### REQ-H7.1: Project Validation

**EARS (Event-driven):** WHEN validating a project design, THE SYSTEM SHALL check structural correctness of `project.md` and `features.json`.

**Acceptance Criteria:**

- `features.json` is valid JSON
- `features.json` contains at least 1 feature
- All feature names are unique (no duplicates)
- All feature names pass deny-list validation from Spec 1
- `project.md` has all required sections: Vision, Scope, Feature List, Out of Scope
- Validator template: `.claude/agents/templates/validator-project.md` (to be created)

#### REQ-H7.2: Feature Validation

**EARS (Event-driven):** WHEN validating a feature design, THE SYSTEM SHALL check JSON schema and DAG correctness of `specs.json`.

**Acceptance Criteria:**

- `specs.json` is valid JSON
- `specs.json` matches schema: `{ feature: string, specs: [{ name, description, depends_on }] }`
- All spec names are unique
- All spec names pass deny-list validation from Spec 1
- `depends_on` array contains valid spec names (within feature or cross-feature refs)
- No cycles in the dependency DAG (cycle detection via DFS traversal)
- `feature.md` has all required sections: Overview, Spec List, Build Order
- Validator template: `.claude/agents/templates/validator-feature.md` (to be created)

#### REQ-H7.3: Spec Validation

**EARS (Event-driven):** WHEN validating a spec design, THE SYSTEM SHALL use current validation logic (EARS notation, acceptance criteria, `_Prompt` blocks).

**Acceptance Criteria:**

- Current validator behavior unchanged
- Validator template: `.claude/agents/templates/validator-spec.md` (existing, no changes)
- All existing validation checks apply: EARS in requirements.md, acceptance criteria per requirement, `_Prompt:` per task

---

### REQ-H8: Level-Specific Interactive Checkpoints

#### REQ-H8.1: Project Pre-Design Checkpoint

**EARS (Event-driven):** AFTER project research completes AND unless `--no-checkpoint`, THE SYSTEM SHALL present 6 project pre-design checkpoint questions.

**Acceptance Criteria:**

- Questions presented after research phase, before write phase
- Questions:
  1. **Vision:** "Based on research, here is the project vision: {vision}. Is this correct?"
  2. **Users:** "Target users/audience: {users}. Is this correct?"
  3. **Features:** "Candidate features: {features}. Any missing or unnecessary?"
  4. **Boundaries:** "Project boundaries: {boundaries}. Are these clear?"
  5. **Priorities:** "Priority order: {priorities}. Does this align with goals?"
  6. **Risks:** "Identified risks: {risks}. Any additional concerns?"
- User responses stored in `checkpoint.phases.research.checkpoint_responses`
- Cancel/stop halts execution with resume instructions

#### REQ-H8.2: Project Post-Design Checkpoint

**EARS (Event-driven):** AFTER project write completes AND unless `--no-checkpoint`, THE SYSTEM SHALL present 6 project post-design checkpoint questions.

**Acceptance Criteria:**

- Questions presented after write phase, before validate phase
- Questions:
  1. **Features Produced:** "I have identified {N} features: {list}. Are these complete?"
  2. **Rough Specs:** "Rough specs for each feature: {summaries}. Are these clear?"
  3. **Coverage:** "Does this cover the full project scope?"
  4. **Granularity:** "Are features at the right level of granularity (not too broad, not too narrow)?"
  5. **Naming:** "Feature names: {names}. Are these clear and consistent?"
  6. **Approval:** "Do you approve this project design? (yes / no / revise)"
- "yes" approval: no Linear issue (projects have no Linear integration), update status to Approved, proceed to validate
- "no" rejection: halt with message
- "revise" response: re-run write phase with feedback

#### REQ-H8.3: Feature Pre-Design Checkpoint

**EARS (Event-driven):** AFTER feature research completes AND unless `--no-checkpoint`, THE SYSTEM SHALL present 6 feature pre-design checkpoint questions.

**Acceptance Criteria:**

- Questions:
  1. **Understanding:** "Based on research, here is what the feature needs to accomplish: {summary}. Is this correct?"
  2. **Rough Specs Input:** "Parent rough specs: {rough_specs}. Does this match your understanding?"
  3. **Dependencies:** "Identified dependencies: {dependencies}. Any missing?"
  4. **Boundaries:** "Feature boundaries: {boundaries}. Are these clear?"
  5. **Complexity:** "Complexity assessment: {complexity}. Does this align with expectations?"
  6. **Constraints:** "Constraints: {constraints}. Any additional constraints?"
- User responses stored in checkpoint
- Cancel/stop halts with resume instructions

#### REQ-H8.4: Feature Post-Design Checkpoint

**EARS (Event-driven):** AFTER feature write completes AND unless `--no-checkpoint`, THE SYSTEM SHALL present 6 feature post-design checkpoint questions.

**Acceptance Criteria:**

- Questions:
  1. **Specs Produced:** "I have identified {N} specs: {list}. Are these complete?"
  2. **Dependencies:** "Dependencies per spec: {deps}. Are these correct?"
  3. **Build Order:** "Recommended build order: {order}. Does this make sense?"
  4. **Cross-Feature:** "Cross-feature dependencies: {cross_deps}. Are these necessary?"
  5. **Gaps:** "Any missing specs or functionality?"
  6. **Approval:** "Do you approve this feature design? (yes / no / revise)"
- "yes" approval: no Linear issue (features have no Linear integration), update status to Approved, proceed to validate
- "no" rejection: halt with message
- "revise" response: re-run write phase with feedback

#### REQ-H8.5: Spec Checkpoints Unchanged

**EARS (Ubiquitous):** THE SYSTEM SHALL use current spec-level checkpoint questions (6 pre-design + 6 post-design from design-incremental-execution) with no changes.

**Acceptance Criteria:**

- Spec pre-design questions: Understanding, Approach, Assumptions, Trade-offs, Scope, Unknowns
- Spec post-design questions: What Built, Decisions, Risks, Omissions, Confidence, Approval
- Approval triggers Linear issue creation (REQ-H10.1)
- All existing spec checkpoint logic preserved

---

### REQ-H9: Edge Case Handling

#### REQ-H9.1: Directory Collision Detection

**EARS (Event-driven):** WHEN creating a directory that already exists with a different type, THE SYSTEM SHALL report an error and halt.

**Acceptance Criteria:**

- Check for marker files: `.project-marker`, `.feature-marker`
- Check for spec files: presence of `requirements.md`, `design.md`, `tasks.md`
- Error messages:
  - `Name collision: "{name}" exists as a project. Choose a different name or use --parent.`
  - `Name collision: "{name}" exists as a feature. Choose a different name.`
  - `Name collision: "{name}" exists as a spec. Choose a different name.`
- Collision detected before any files are written

#### REQ-H9.2: Feature Redesign Manifest Diffing

**EARS (Event-driven):** WHEN redesigning a feature (running `/design {feature} --feature` on existing feature), THE SYSTEM SHALL compare the new `specs.json` with the existing one and warn about removed specs.

**Acceptance Criteria:**

- Load existing `specs/{project}/{feature}/specs.json`
- Compare existing `specs` array with new `specs` array
- Identify removed specs (in old but not in new)
- Warn: `Warning: The following specs were removed: {list}. Existing spec directories will NOT be deleted. Delete manually if intentional.`
- Never auto-delete spec directories (manual cleanup required)

#### REQ-H9.3: Cross-Feature Dependency Refs

**EARS (Ubiquitous):** THE SYSTEM SHALL support cross-feature dependencies in `specs.json` using `{project}/{feature}/{spec}` format.

**Acceptance Criteria:**

- `depends_on` field accepts refs like `"authentication/auth-session/session-storage"`
- Validation: cross-feature refs are syntactically valid but existence is not checked (out of scope)
- Build order calculation: cross-feature deps treated as external (no cycle detection across features)
- Documented in template comments

#### REQ-H9.4: Stale Features JSON

**EARS (Ubiquitous):** THE SYSTEM SHALL NOT automatically update `features.json` when a feature is refined/redesigned.

**Acceptance Criteria:**

- Refinement: user runs `/design {feature} --feature` to update an existing feature
- Refinement updates `feature.md` and `specs.json` but does NOT propagate changes to parent `features.json`
- Document in feature.md: "Note: Parent features.json may be stale. Update manually if needed."
- No auto-sync between feature-level artifacts and project-level `features.json`

#### REQ-H9.5: Out-of-Order Creation Standalone Fallback

**EARS (Event-driven):** WHEN a level is created without its parent existing, THE SYSTEM SHALL create it in a standalone directory and document the missing parent.

**Acceptance Criteria:**

- Feature without project: created at `specs/{feature}/` with note in `feature.md`: `Parent project: [not yet defined]`
- Spec without feature: created at `specs/{spec}/` with note in `requirements.md`: `Parent feature: [not yet defined]`
- Warning logged at creation time
- User can later move to proper nested location manually

---

### REQ-H10: Linear Integration

#### REQ-H10.1: Linear Only at Spec Level

**EARS (Ubiquitous):** THE SYSTEM SHALL create Linear issues only for spec-level designs, not for project or feature designs.

**Acceptance Criteria:**

- Spec level: Linear issue creation on approval (existing behavior from design-incremental-execution)
- Project level: no Linear issue creation (approval completes without Linear call)
- Feature level: no Linear issue creation (approval completes without Linear call)
- Document in project/feature post-design checkpoint: "Note: Linear issues are created at spec level only."

---

## Non-Functional Requirements

### NFR-1: Template Discoverability

**EARS (Ubiquitous):** THE SYSTEM SHALL store all new templates in `specs/templates/` alongside existing templates.

**Acceptance Criteria:**

- `specs/templates/project.md`
- `specs/templates/feature.md`
- `specs/templates/features.json`
- `specs/templates/specs.json`
- All templates include usage instructions in header comments

### NFR-2: Backward Compatibility

**EARS (Ubiquitous):** THE SYSTEM SHALL preserve existing spec-level behavior when no level flags are passed.

**Acceptance Criteria:**

- `/design {name}` without flags prompts for level selection (REQ-H1.4)
- `/design {name} --spec` produces current 6-file output in `specs/{name}/` (flat structure for backward compat)
- Existing checkpoint files (`design-{name}.json`) are treated as spec-level checkpoints
- No breaking changes to `checkpoint-manager.cjs`, `command-utils.cjs`, or `token-counter.cjs`

### NFR-3: Validation Performance

**EARS (Ubiquitous):** THE SYSTEM SHALL complete DAG cycle detection for features with up to 100 specs in under 5 seconds.

**Acceptance Criteria:**

- Cycle detection uses DFS traversal with visited set
- Time complexity: O(V + E) where V = specs, E = dependencies
- No timeout for validation phase with large features

### NFR-4: Error Resilience

**EARS (Ubiquitous):** THE SYSTEM SHALL handle missing parent directories gracefully by creating standalone artifacts with documented warnings.

**Acceptance Criteria:**

- Missing parent: creates standalone dir + logs warning (REQ-H9.5)
- Invalid parent: errors with clear message (REQ-H2.2, REQ-H2.3)
- Collision: errors before writing any files (REQ-H9.1)

---

## Out of Scope

- Auto-migration of existing flat specs to nested structure
- Auto-sync of `features.json` rough specs when features are refined
- Auto-deletion of spec directories when removed from `specs.json` (REQ-H9.2)
- Cross-feature cycle detection in dependency DAG
- Visual DAG rendering or build order diagrams
- Project-level or feature-level Linear issue creation
- Automated movement of standalone artifacts to nested locations
- `--reconcile` support for project/feature levels (spec-level only)

---

## Dependencies

| Dependency                     | Type     | Status                                                          |
| ------------------------------ | -------- | --------------------------------------------------------------- |
| `spec-path-resolution`         | Spec     | Pending (Spec 1, provides resolver utility and name validation) |
| `design-incremental-execution` | Spec     | In Progress (0/22 tasks, provides phase execution machinery)    |
| `checkpoint-manager.cjs`       | Module   | Implemented (`.claude/scripts/lib/checkpoint-manager.cjs`)      |
| `command-utils.cjs`            | Module   | Implemented (`.claude/scripts/lib/command-utils.cjs`)           |
| `token-counter.cjs`            | Module   | Implemented (`.claude/scripts/lib/token-counter.cjs`)           |
| `plan-agent.md`                | Agent    | Implemented (`.claude/agents/plan-agent.md`)                    |
| `design.md` command            | Command  | Implemented (`.claude/commands/design.md`)                      |
| `project.md` template          | Template | To be created (`specs/templates/project.md`)                    |
| `feature.md` template          | Template | To be created (`specs/templates/feature.md`)                    |
| `features.json` template       | Template | To be created (`specs/templates/features.json`)                 |
| `specs.json` template          | Template | To be created (`specs/templates/specs.json`)                    |
| `validator-project.md`         | Template | To be created (`.claude/agents/templates/validator-project.md`) |
| `validator-feature.md`         | Template | To be created (`.claude/agents/templates/validator-feature.md`) |

---
