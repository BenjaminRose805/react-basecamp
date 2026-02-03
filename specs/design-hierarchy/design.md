# Design: Design Hierarchy

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy

## Overview

This design extends the `/design` command to support a 3-tier design hierarchy: project-level (produces `project.md` + `features.json`), feature-level (produces `feature.md` + `specs.json` with DAG dependencies), and spec-level (current 6-file behavior, unchanged). Each level uses the same 3-phase pipeline (research, write, validate) with level-specific routing, artifacts, checkpoint questions, and validation logic.

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
    │     └── Creates: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
    │
    └── VALIDATE  (quality-validator)
          └── Returns: { passed, issues[] }

Single level. No hierarchy flags. No parent context.
Outputs to flat directory: specs/{name}/
```

### Target State

```text
/design {name} [--project | --feature | --spec] [--parent=X] [flags]
    │
    ├── Parse level flags (mutual exclusivity, prompt if missing)
    ├── Validate parent context (if --parent provided)
    ├── Resolve paths via spec-path-resolver (collision detection)
    ├── Load checkpoint (if --resume)
    ├── Show unified preview (with level context)
    │
    ├── RESEARCH phase (level-aware)
    │   ├── Project: explore vision, scope, feature candidates
    │   ├── Feature: read parent features.json rough_specs, explore feature domain
    │   └── Spec: current behavior (explore requirements, design, tasks)
    │
    ├── WRITE phase (level-aware)
    │   ├── Project: generate project.md + features.json
    │   ├── Feature: generate feature.md + specs.json (with depends_on DAG)
    │   └── Spec: generate 6 files (requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml)
    │
    └── VALIDATE phase (level-aware)
        ├── Project: structural check (>=1 feature, no duplicates, deny-list validation)
        ├── Feature: JSON schema + DAG cycle detection
        └── Spec: EARS notation, acceptance criteria, _Prompt blocks (current behavior)
```

---

## Component Design

### 1. Level Flag System

**Flags:** `--project`, `--feature`, `--spec`

**Mutual Exclusivity:**

```text
/design my-project --project --feature
    └─> Error: "Only one of --project, --feature, --spec allowed"

/design my-feature --feature
    └─> OK: feature level

/design my-spec
    └─> Prompt: "Select design level: (1) Project, (2) Feature, (3) Spec"
```

**Parsing:**

```javascript
// In parseFlags() (already supports boolean flags from design-incremental-execution)
parseFlags(userPrompt, {
  project: "boolean",
  feature: "boolean",
  spec: "boolean",
});
// Returns: { project: false, feature: true, spec: false }
```

**Prompt-if-missing logic:**

```text
IF no level flag is set:
    PRESENT interactive prompt:
        "Select design level:
         (1) Project: overall vision and feature list
         (2) Feature: spec list and dependency graph
         (3) Spec: detailed 6-file specification"

    User selects: 2

    SET flags.feature = true
    CONTINUE execution
```

**Implementation location:** `.claude/commands/design.md` (flag parsing) + `.claude/agents/plan-agent.md` (prompt logic)

---

### 2. Parent Context Flag

**Flag:** `--parent=X`

**Usage:**

| Command                              | Level   | Parent | Result                                                   |
| ------------------------------------ | ------- | ------ | -------------------------------------------------------- |
| `/design auth --feature`             | Feature | Auto   | `specs/auth/` (standalone, no parent)                    |
| `/design auth --feature --parent=p1` | Feature | p1     | `specs/p1/auth/` (nested under project p1)               |
| `/design spec-a --spec --parent=f1`  | Spec    | f1     | Uses resolver to find f1, creates nested spec-a          |
| `/design spec-b --spec --parent=p/f` | Spec    | p/f    | `specs/p/f/spec-b/` (explicit project/feature)           |
| `/design proj --project --parent=X`  | Project | X      | Warning logged, parent ignored (projects have no parent) |

**Validation:**

```text
Feature level with --parent:
    CHECK: specs/{parent}/project.md OR specs/{parent}/.project-marker
    IF not found:
        ERROR: "Parent project "{parent}" not found. Create it first with: /design {parent} --project"
        HALT

Spec level with --parent:
    IF parent contains "/":
        SPLIT: project, feature = parent.split('/')
        CHECK: specs/{project}/{feature}/feature.md OR .feature-marker
    ELSE:
        CALL: resolveSpecPath(parent) -> { type: 'feature', path: 'specs/...' }

    IF not found:
        ERROR: "Parent feature "{parent}" not found. Create it first with: /design {parent} --feature"
        HALT
```

**Standalone Fallback (out-of-order creation):**

```text
/design my-feature --feature
    (no --parent, no parent project exists)

    CREATE: specs/my-feature/feature.md
    ADD NOTE: "Parent project: [not yet defined]"
    LOG: "Warning: Creating standalone feature. Link to parent later by creating the parent structure."
```

**Implementation location:** `.claude/agents/plan-agent.md` (validation logic) + `.claude/scripts/lib/spec-resolver.cjs` (path resolution)

---

### 3. Level-Aware Pipeline Routing

#### Research Phase

**Project level:**

```text
Research goal: Broad exploration of project vision, scope, and feature breakdown
    │
    ├── Spawn 3 domain-researchers (Opus)
    │   ├── Researcher 1: Vision and target users
    │   ├── Researcher 2: Scope boundaries and feature candidates
    │   └── Researcher 3: Rough specs per feature (2-4 sentences each)
    │
    └── Aggregate context_summary (~500 tokens)
        └── Pass to pre-design checkpoint
```

**Feature level:**

```text
Research goal: Read parent rough_specs, break down feature into specs with dependencies
    │
    ├── Read: specs/{project}/features.json -> extract rough_specs for this feature
    │
    ├── Spawn 3 domain-researchers (Opus)
    │   ├── Researcher 1: Feature domain understanding (from rough_specs)
    │   ├── Researcher 2: Spec breakdown (identify 3-7 specs)
    │   └── Researcher 3: Dependencies and build order
    │
    └── Aggregate context_summary (~500 tokens)
        └── Pass to pre-design checkpoint
```

**Spec level:**

```text
Research goal: Current behavior (no changes)
    │
    ├── Spawn 3 domain-researchers (Opus)
    │   ├── Researcher 1: Requirements exploration
    │   ├── Researcher 2: Design approach
    │   └── Researcher 3: Task breakdown
    │
    └── Aggregate context_summary (~500 tokens)
        └── Pass to pre-design checkpoint
```

#### Write Phase

**Project level:**

```text
Write goal: Generate project.md + features.json
    │
    ├── Read template: specs/templates/project.md
    ├── Read template: specs/templates/features.json
    │
    ├── Spawn domain-writer (Sonnet)
    │   ├── Input: research context_summary, pre-design checkpoint responses
    │   ├── Generate: project.md (Vision, Scope, Feature List, Out of Scope, Dependencies)
    │   └── Generate: features.json ({ project, features: [{ name, description, rough_specs }] })
    │
    ├── Create directory: specs/{project}/ (with .project-marker)
    ├── Write: specs/{project}/project.md
    └── Write: specs/{project}/features.json
```

**Feature level:**

```text
Write goal: Generate feature.md + specs.json
    │
    ├── Read template: specs/templates/feature.md
    ├── Read template: specs/templates/specs.json
    │
    ├── Spawn domain-writer (Sonnet)
    │   ├── Input: research context_summary, parent rough_specs, pre-design checkpoint responses
    │   ├── Generate: feature.md (Overview, Spec List, Build Order, Cross-Feature Dependencies)
    │   └── Generate: specs.json ({ feature, specs: [{ name, description, depends_on }] })
    │
    ├── Create directory: specs/{project}/{feature}/ OR specs/{feature}/ (standalone)
    ├── Create marker: .feature-marker
    ├── Write: feature.md
    └── Write: specs.json
```

**Spec level:**

```text
Write goal: Generate 6 spec files (current behavior, no changes)
    │
    ├── Spawn domain-writer (Sonnet)
    │   ├── Input: research context_summary, pre-design checkpoint responses
    │   └── Generate: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
    │
    ├── Create directory: specs/{project}/{feature}/{spec}/ OR specs/{spec}/ (standalone)
    └── Write all 6 files
```

#### Validate Phase

**Project level:**

```text
Validation goal: Structural correctness
    │
    ├── Spawn quality-validator (Haiku)
    │   ├── Check: features.json is valid JSON
    │   ├── Check: features.json contains >=1 feature
    │   ├── Check: all feature names are unique
    │   ├── Check: all feature names pass deny-list validation (from spec-path-resolution)
    │   └── Check: project.md has required sections (Vision, Scope, Feature List, Out of Scope)
    │
    └── Return: { passed, issues[] }
```

**Feature level:**

```text
Validation goal: JSON schema + DAG cycle detection
    │
    ├── Spawn quality-validator (Haiku)
    │   ├── Check: specs.json is valid JSON
    │   ├── Check: specs.json matches schema: { feature, specs: [{ name, description, depends_on }] }
    │   ├── Check: all spec names are unique
    │   ├── Check: all spec names pass deny-list validation
    │   ├── Check: depends_on references are valid (within feature or cross-feature refs)
    │   ├── Check: no cycles in dependency DAG (DFS traversal)
    │   └── Check: feature.md has required sections (Overview, Spec List, Build Order)
    │
    └── Return: { passed, issues[] }
```

**Spec level:**

```text
Validation goal: EARS notation, acceptance criteria, _Prompt blocks (current behavior, no changes)
    │
    ├── Spawn quality-validator (Haiku)
    │   ├── Check: requirements.md uses EARS notation
    │   ├── Check: each requirement has acceptance criteria
    │   ├── Check: tasks.md has _Prompt blocks per task
    │   └── (all existing validation checks)
    │
    └── Return: { passed, issues[] }
```

**Implementation location:** `.claude/agents/plan-agent.md` (routing logic) + `.claude/agents/templates/validator-project.md` (new) + `.claude/agents/templates/validator-feature.md` (new)

---

### 4. Template System

**New templates:**

| Template                        | Purpose                        | Sections                                                      |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `specs/templates/project.md`    | Project-level narrative        | Vision, Scope, Feature List, Out of Scope, Deps               |
| `specs/templates/feature.md`    | Feature-level narrative        | Overview, Spec List, Build Order, Cross-Feature Deps          |
| `specs/templates/features.json` | Project-level feature manifest | `{ project, features: [{ name, description, rough_specs }] }` |
| `specs/templates/specs.json`    | Feature-level spec manifest    | `{ feature, specs: [{ name, description, depends_on }] }`     |

**Variable population example (project.md):**

```markdown
# {{project_name}}

## Vision

{{vision_paragraph}}

## Scope

{{scope_description}}

## Feature List

### {{feature_1_name}}

{{feature_1_rough_specs}}

### {{feature_2_name}}

{{feature_2_rough_specs}}

## Out of Scope

{{out_of_scope_items}}

## Dependencies

{{dependencies_list}}
```

**Variable population example (features.json):**

```json
{
  "project": "{{project_name}}",
  "features": [
    {
      "name": "{{feature_1_name}}",
      "description": "{{feature_1_description}}",
      "rough_specs": "{{feature_1_rough_specs}}"
    }
  ]
}
```

**Implementation location:** `specs/templates/` (4 new files)

---

### 5. Nested Directory Structure

**Directory layout:**

```text
specs/
    ├── {project}/                 (project level)
    │   ├── .project-marker         (marker file)
    │   ├── project.md
    │   ├── features.json
    │   │
    │   ├── {feature}/              (feature level)
    │   │   ├── .feature-marker     (marker file)
    │   │   ├── feature.md
    │   │   ├── specs.json
    │   │   │
    │   │   └── {spec}/             (spec level)
    │   │       ├── requirements.md
    │   │       ├── design.md
    │   │       ├── tasks.md
    │   │       ├── summary.md
    │   │       ├── spec.json
    │   │       └── meta.yaml
    │   │
    │   └── {feature-2}/
    │       └── ...
    │
    └── {standalone-spec}/          (standalone, backward compat)
        ├── requirements.md
        └── ...
```

**Marker files:**

| File              | Purpose                  | Created When         |
| ----------------- | ------------------------ | -------------------- |
| `.project-marker` | Distinguish project dirs | Project level design |
| `.feature-marker` | Distinguish feature dirs | Feature level design |
| (none for spec)   | Presence of 6 spec files | Spec level design    |

**Collision detection:**

```text
BEFORE creating specs/{name}/:

    CHECK: directory exists?
        IF yes:
            IF .project-marker exists:
                ERROR: "Name collision: "{name}" exists as a project. Choose a different name or use --parent."

            IF .feature-marker exists:
                ERROR: "Name collision: "{name}" exists as a feature. Choose a different name."

            IF requirements.md + design.md + tasks.md exist:
                ERROR: "Name collision: "{name}" exists as a spec. Choose a different name."

        ELSE:
            OK: proceed with directory creation
```

**Path resolution integration:**

```javascript
// From spec-path-resolution (Spec 1)
const { resolveSpecPath } = require("./.claude/scripts/lib/spec-resolver.cjs");

const result = resolveSpecPath("my-feature");
// Returns: { type: 'feature', path: 'specs/my-project/my-feature' }
// OR: null (not found)

// Use for:
// 1. Parent validation (does parent project/feature exist?)
// 2. Collision detection (does name already exist as different type?)
// 3. Disambiguation (multiple matches for same name)
```

**Implementation location:** `.claude/agents/plan-agent.md` (directory creation logic) + `.claude/scripts/lib/spec-resolver.cjs` (path resolution utility from Spec 1)

---

### 6. Checkpoint Key Prefixing

**Current (spec-level) checkpoint key:**

```text
.claude/state/design-{name}.json
```

**New level-prefixed checkpoint keys:**

```text
.claude/state/design-project-{name}.json
.claude/state/design-feature-{name}.json
.claude/state/design-spec-{name}.json
```

**Key construction:**

```javascript
const level = flags.project ? "project" : flags.feature ? "feature" : "spec";
const checkpointKey = `design-${level}-${name}`;

// Save checkpoint
saveCheckpoint("design", checkpointKey, { ...data });

// Load checkpoint
const checkpoint = loadCheckpoint("design", checkpointKey);
```

**No changes to checkpoint-manager.cjs:** The `feature` parameter in `saveCheckpoint(command, feature, data)` becomes the level-prefixed name. The schema remains unchanged (version 1, command, feature, phases, state).

**Implementation location:** `.claude/agents/plan-agent.md` (checkpoint key construction)

---

### 7. Level-Specific Interactive Checkpoints

#### Project Pre-Design Checkpoint (After Research)

**Questions (6):**

```text
1. VISION
   Based on research, here is the project vision:
   {vision_summary from context_summary}

   Is this correct? [yes / correct with changes / no]

2. USERS
   Target users/audience:
   {users_description from context_summary}

   Is this correct? [yes / corrections: ...]

3. FEATURES
   Candidate features:
   {feature_list from context_summary}

   Any missing or unnecessary? [complete / add: ... / remove: ...]

4. BOUNDARIES
   Project boundaries:
   {boundaries from context_summary}

   Are these clear? [yes / clarify: ...]

5. PRIORITIES
   Priority order:
   {priorities from context_summary}

   Does this align with goals? [yes / adjust: ...]

6. RISKS
   Identified risks:
   {risks from context_summary}

   Any additional concerns? [no / add: ...]
```

#### Project Post-Design Checkpoint (After Write)

**Questions (6):**

```text
1. FEATURES PRODUCED
   I have identified {N} features: {list}

   Are these complete? [yes / add: ... / remove: ...]

2. ROUGH SPECS
   Rough specs for each feature:
   {summaries from features.json}

   Are these clear? [yes / revise: ...]

3. COVERAGE
   Does this cover the full project scope? [yes / gaps: ...]

4. GRANULARITY
   Are features at the right level of granularity (not too broad, not too narrow)?
   [yes / too broad: ... / too narrow: ...]

5. NAMING
   Feature names: {names}

   Are these clear and consistent? [yes / rename: ...]

6. APPROVAL
   Do you approve this project design?

   [yes] → Update status to Approved, proceed to validate (no Linear issue)
   [no]  → Halt
   [revise] → Re-run write phase with feedback
```

#### Feature Pre-Design Checkpoint (After Research)

**Questions (6):**

```text
1. UNDERSTANDING
   Based on research, here is what the feature needs to accomplish:
   {summary from context_summary}

   Is this correct? [yes / corrections: ...]

2. ROUGH SPECS INPUT
   Parent rough specs:
   {rough_specs from parent features.json}

   Does this match your understanding? [yes / discrepancies: ...]

3. DEPENDENCIES
   Identified dependencies:
   {dependencies from context_summary}

   Any missing? [complete / add: ...]

4. BOUNDARIES
   Feature boundaries:
   {boundaries from context_summary}

   Are these clear? [yes / clarify: ...]

5. COMPLEXITY
   Complexity assessment:
   {complexity from context_summary}

   Does this align with expectations? [yes / adjust: ...]

6. CONSTRAINTS
   Constraints:
   {constraints from context_summary}

   Any additional constraints? [no / add: ...]
```

#### Feature Post-Design Checkpoint (After Write)

**Questions (6):**

```text
1. SPECS PRODUCED
   I have identified {N} specs: {list}

   Are these complete? [yes / add: ... / remove: ...]

2. DEPENDENCIES
   Dependencies per spec:
   {deps from specs.json}

   Are these correct? [yes / adjust: ...]

3. BUILD ORDER
   Recommended build order:
   {order from feature.md}

   Does this make sense? [yes / reorder: ...]

4. CROSS-FEATURE
   Cross-feature dependencies:
   {cross_deps from specs.json}

   Are these necessary? [yes / remove: ...]

5. GAPS
   Any missing specs or functionality? [no / add: ...]

6. APPROVAL
   Do you approve this feature design?

   [yes] → Update status to Approved, proceed to validate (no Linear issue)
   [no]  → Halt
   [revise] → Re-run write phase with feedback
```

#### Spec Checkpoints (Unchanged)

**Pre-design questions:** Understanding, Approach, Assumptions, Trade-offs, Scope, Unknowns (from design-incremental-execution)

**Post-design questions:** What Built, Decisions, Risks, Omissions, Confidence, Approval (from design-incremental-execution)

**Approval triggers Linear issue creation (spec level only)**

**Implementation location:** `.claude/agents/plan-agent.md` (checkpoint question templates)

---

### 8. Level-Specific Validation

#### Project Validator Template

**File:** `.claude/agents/templates/validator-project.md`

**Checks:**

1. `features.json` is valid JSON
2. `features.json` contains >=1 feature
3. All feature names are unique (no duplicates)
4. All feature names pass deny-list validation (from Spec 1: spec-path-resolution)
5. `project.md` has all required sections: Vision, Scope, Feature List, Out of Scope

**Output:** `{ passed: boolean, issues: string[] }`

#### Feature Validator Template

**File:** `.claude/agents/templates/validator-feature.md`

**Checks:**

1. `specs.json` is valid JSON
2. `specs.json` matches schema: `{ feature: string, specs: [{ name, description, depends_on }] }`
3. All spec names are unique
4. All spec names pass deny-list validation (from Spec 1)
5. `depends_on` array contains valid spec names (within feature or cross-feature refs)
6. No cycles in dependency DAG (DFS traversal with visited set)
7. `feature.md` has all required sections: Overview, Spec List, Build Order

**DAG cycle detection algorithm:**

```javascript
function hasCycle(specs) {
  const graph = buildGraph(specs); // { specName: [dependencyNames] }
  const visited = new Set();
  const recStack = new Set();

  for (const spec of specs) {
    if (detectCycleUtil(spec.name, graph, visited, recStack)) {
      return { cycle: true, node: spec.name };
    }
  }
  return { cycle: false };
}

function detectCycleUtil(node, graph, visited, recStack) {
  if (recStack.has(node)) return true; // Cycle detected
  if (visited.has(node)) return false; // Already processed

  visited.add(node);
  recStack.add(node);

  const neighbors = graph[node] || [];
  for (const neighbor of neighbors) {
    if (detectCycleUtil(neighbor, graph, visited, recStack)) {
      return true;
    }
  }

  recStack.delete(node);
  return false;
}
```

**Output:** `{ passed: boolean, issues: string[] }`

#### Spec Validator Template

**File:** `.claude/agents/templates/validator-spec.md` (existing, no changes)

**Checks:** EARS notation, acceptance criteria, \_Prompt blocks (current behavior from design-incremental-execution)

**Implementation location:** `.claude/agents/templates/` (2 new validator templates)

---

### 9. Linear Integration Scope

**Linear issue creation:** Spec level only

**Project level:** No Linear issue creation. Approval completes without Linear call.

**Feature level:** No Linear issue creation. Approval completes without Linear call.

**Spec level:** Linear issue creation on approval (existing behavior from design-incremental-execution, unchanged)

**Post-design checkpoint note for project/feature:**

```text
6. APPROVAL
   Do you approve this {project|feature} design?

   [yes] → Update status to Approved, proceed to validate
   [no]  → Halt
   [revise] → Re-run write phase with feedback

   Note: Linear issues are created at spec level only.
```

**Implementation location:** `.claude/agents/plan-agent.md` (approval logic per level)

---

## Edge Case Handling

### 1. Directory Collision Detection

**Scenario:** User tries to create a project named "auth" but "auth" already exists as a feature.

**Handling:**

```text
/design auth --project
    │
    ├── Check: specs/auth/ exists?
    │   └─> YES
    │
    ├── Check marker files:
    │   ├─> .project-marker? NO
    │   ├─> .feature-marker? YES
    │   └─> ERROR: "Name collision: "auth" exists as a feature. Choose a different name."
    │
    └── HALT
```

**Implementation:** Pre-creation collision check before any files are written.

---

### 2. Feature Redesign Manifest Diffing

**Scenario:** User runs `/design auth --feature` on an existing feature, removing 2 specs from the design.

**Handling:**

```text
/design auth --feature (existing feature)
    │
    ├── Load existing: specs/{project}/auth/specs.json
    │   └─> oldSpecs = ['spec-a', 'spec-b', 'spec-c']
    │
    ├── WRITE phase produces new specs.json
    │   └─> newSpecs = ['spec-a', 'spec-c']
    │
    ├── Diff: removed = oldSpecs - newSpecs
    │   └─> removed = ['spec-b']
    │
    ├── WARN: "Warning: The following specs were removed: spec-b. Existing spec directories will NOT be deleted. Delete manually if intentional."
    │
    └── Overwrite specs.json (do not auto-delete specs/{project}/auth/spec-b/)
```

**Implementation:** Diff logic in write phase after new specs.json is generated.

---

### 3. Cross-Feature Dependency Refs

**Scenario:** Spec in feature "billing" depends on spec in feature "auth".

**Handling:**

```json
{
  "feature": "billing",
  "specs": [
    {
      "name": "billing-api",
      "description": "REST API for billing",
      "depends_on": ["authentication/auth-session/session-storage"]
    }
  ]
}
```

**Validation:** Cross-feature refs are syntactically valid (format: `{project}/{feature}/{spec}`), but existence is not checked (out of scope). Build order calculation treats cross-feature deps as external (no cycle detection across features).

**Implementation:** Feature validator recognizes cross-feature refs (contains `/`) and skips existence check.

---

### 4. Stale Features JSON

**Scenario:** User refines a feature (re-runs `/design auth --feature`), but parent `features.json` is not updated.

**Handling:**

```text
/design auth --feature (refinement of existing feature)
    │
    ├── WRITE phase updates: specs/{project}/auth/feature.md and specs.json
    │
    ├── NO PROPAGATION to parent: specs/{project}/features.json is NOT updated
    │
    ├── ADD NOTE in feature.md:
    │   "Note: Parent features.json may be stale. Update manually if needed."
    │
    └── Document: No auto-sync between feature-level artifacts and project-level features.json
```

**Implementation:** No automatic update logic. Document the manual sync requirement.

---

### 5. Out-of-Order Creation (Standalone Fallback)

**Scenario:** User creates a spec without a parent feature existing.

**Handling:**

```text
/design my-spec --spec (no --parent, no parent feature exists)
    │
    ├── Check: parent feature exists? NO
    │
    ├── WARN: "Warning: Creating standalone spec. Link to parent later by creating the parent structure."
    │
    ├── CREATE: specs/my-spec/ (flat directory)
    │   └─> requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
    │
    └── ADD NOTE in requirements.md:
        "Parent feature: [not yet defined]"
```

**Implementation:** Standalone fallback when parent validation fails (no error, just warning).

---

## Data Flow

```text
User invokes /design {name} [--project|--feature|--spec] [--parent=X] [flags]
    │
    ├── command-utils.cjs: parseFlags() → { project, feature, spec, parent, ... }
    │
    ├── plan-agent.md: level detection
    │   ├─> IF no level flag: presentLevelPrompt() → user selects level
    │   ├─> IF multiple level flags: ERROR "Only one of --project, --feature, --spec allowed"
    │   └─> SET: level = 'project' | 'feature' | 'spec'
    │
    ├── plan-agent.md: parent validation
    │   ├─> IF --parent provided: validate parent exists
    │   ├─> IF missing: error with create command
    │   └─> IF no --parent: standalone fallback
    │
    ├── spec-resolver.cjs: resolveSpecPath(name) → collision detection
    │   └─> IF collision: ERROR "Name collision: ..."
    │
    ├── checkpoint-manager.cjs: loadCheckpoint(design-{level}-{name}) → checkpoint | null
    │
    ├── command-preview.md: render preview → user confirms
    │
    ├── plan-agent.md (orchestrator):
    │   │
    │   ├── RESEARCH (level-aware)
    │   │   ├─> Project: 3x domain-researcher (vision, scope, features)
    │   │   ├─> Feature: 3x domain-researcher (rough_specs, breakdown, deps)
    │   │   └─> Spec: 3x domain-researcher (requirements, design, tasks) [current]
    │   │
    │   │   └─> checkpoint-manager.cjs: updatePhase(design-{level}-{name}, research, {...})
    │   │       └─> PRE-DESIGN CHECKPOINT (level-specific 6 questions)
    │   │
    │   ├── WRITE (level-aware)
    │   │   ├─> Project: domain-writer → project.md, features.json
    │   │   ├─> Feature: domain-writer → feature.md, specs.json
    │   │   └─> Spec: domain-writer → 6 spec files [current]
    │   │
    │   │   └─> checkpoint-manager.cjs: updatePhase(design-{level}-{name}, write, {...})
    │   │       └─> POST-DESIGN CHECKPOINT (level-specific 6 questions)
    │   │           ├─> Approval at project/feature: no Linear
    │   │           └─> Approval at spec: Linear issue creation [current]
    │   │
    │   └── VALIDATE (level-aware)
    │       ├─> Project: validator-project (structure check)
    │       ├─> Feature: validator-feature (DAG cycle detection)
    │       └─> Spec: validator-spec (EARS, acceptance criteria) [current]
    │
    │       └─> checkpoint-manager.cjs: completeCheckpoint(design-{level}-{name})
    │
    └── Output: nested directory with level-appropriate artifacts
```

---

## Files Modified

| File                                             | Action | Description                                                                    |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| `.claude/commands/design.md`                     | Modify | Add level flags, parent flag, prompt-if-missing documentation                  |
| `.claude/agents/plan-agent.md`                   | Modify | Add level detection, routing, parent validation, level-specific checkpoints    |
| `specs/templates/project.md`                     | Create | Template for project.md (Vision, Scope, Feature List, Out of Scope, Deps)      |
| `specs/templates/feature.md`                     | Create | Template for feature.md (Overview, Spec List, Build Order, Cross-Feature Deps) |
| `specs/templates/features.json`                  | Create | Template for features.json (project-level feature manifest)                    |
| `specs/templates/specs.json`                     | Create | Template for specs.json (feature-level spec manifest with depends_on DAG)      |
| `.claude/agents/templates/validator-project.md`  | Create | Validator for project level (structure check)                                  |
| `.claude/agents/templates/validator-feature.md`  | Create | Validator for feature level (JSON schema + DAG cycle detection)                |
| `.claude/scripts/lib/spec-resolver.cjs` (Spec 1) | Ref    | Used for path resolution, collision detection, parent validation               |

---

## Error Handling

### Multiple Level Flags

```text
Error: Only one of --project, --feature, --spec allowed
```

**Response:** Exit with error code. Do not start any phases.

---

### Missing Parent

```text
Error: Parent project "my-project" not found. Create it first with: /design my-project --project
```

**Response:** Exit with error code. Provide create command.

---

### Name Collision

```text
Error: Name collision: "auth" exists as a feature. Choose a different name.
```

**Response:** Exit with error code before writing any files.

---

### Invalid Feature Name (Deny-List)

```text
Error: Feature name "templates" is reserved. Choose a different name. See deny-list in spec-path-resolution.
```

**Response:** Exit with error code. Reference deny-list documentation.

---

### DAG Cycle Detected

```text
Error: Dependency cycle detected in specs.json: spec-a -> spec-b -> spec-c -> spec-a
```

**Response:** Validation fails with detailed cycle path. User must revise dependencies.

---

### Out-of-Order Creation (Non-blocking)

```text
Warning: Creating standalone spec. Link to parent later by creating the parent structure.
```

**Response:** Log warning, continue execution. Create standalone directory.

---

### Stale Features JSON (Non-blocking)

```text
Warning: Parent features.json may be stale. Update manually if needed.
```

**Response:** Add note to feature.md. No automatic sync.

---

## Testing Strategy

| Test Type   | Test Case                                                | Verification                                                                |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Unit        | Level flag mutual exclusivity                            | Error when multiple level flags passed                                      |
| Unit        | Prompt-if-missing logic                                  | Interactive prompt shown when no level flag                                 |
| Unit        | Parent validation (feature with project parent)          | Error when parent project not found                                         |
| Unit        | Parent validation (spec with feature parent)             | Error when parent feature not found                                         |
| Unit        | Collision detection (project vs feature)                 | Error when name exists as different type                                    |
| Unit        | Standalone fallback (spec without feature)               | Warning logged, standalone directory created                                |
| Integration | Full `/design` flow at project level                     | Produces project.md + features.json in specs/{project}/                     |
| Integration | Full `/design` flow at feature level                     | Produces feature.md + specs.json in specs/{project}/{feature}/              |
| Integration | Full `/design` flow at spec level (nested)               | Produces 6 files in specs/{project}/{feature}/{spec}/                       |
| Integration | Project pre-design checkpoint (6 questions)              | All 6 project-specific questions presented, responses stored                |
| Integration | Feature post-design checkpoint (6 questions)             | All 6 feature-specific questions presented, approval does not create Linear |
| Integration | Feature redesign with removed specs                      | Warning about removed specs, existing directories not deleted               |
| Integration | DAG cycle detection in feature validation                | Validation fails with cycle path                                            |
| Integration | Cross-feature dependency refs in specs.json              | Validation passes, cross-feature refs treated as external                   |
| Integration | Checkpoint key prefixing (design-project-{name}.json)    | Checkpoint saved with correct prefix                                        |
| E2E         | Create project -> create feature -> create spec (nested) | Full nested directory structure created correctly                           |
| E2E         | Create spec standalone -> create feature -> move spec    | Standalone spec created, manual move required                               |

---
