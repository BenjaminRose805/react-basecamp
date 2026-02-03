# Design Prompt: /design Command Hierarchy (--project, --feature, --spec)

## Context

The `/design` command currently produces a single spec (6 files: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml) for a given feature name. We want to extend it with a 3-tier hierarchy so users can design at different zoom levels.

The existing spec for the current `/design` behavior is at `specs/design-incremental-execution/` and covers flags (`--phase`, `--resume`, `--no-checkpoint`, `--dry-run`), checkpoint persistence, interactive checkpoints, summary/spec.json/meta.yaml auto-generation, and Linear integration. That spec should land first. This new spec layers the hierarchy on top.

## What to Design

Add `--project`, `--feature`, and `--spec` flags to `/design`. Each flag declares **what the user is designing**, not output depth. Each level runs the same 3-phase pipeline (research → write → validate) but produces different output artifacts.

### The Three Levels

```
/design my-saas --project
  → Research: explore the idea, identify major capability areas
  → Write: feature list + rough spec sketches per feature (intentionally disposable)
  → Validate: coverage gaps, feasibility, missing features

/design authentication --feature
  → Research: explore the feature, refine/correct any project-level spec sketches
  → Write: refined spec list with descriptions and dependencies between specs
  → Validate: spec boundaries, dependency ordering, no overlaps/gaps

/design auth-oauth --spec
  → Research: current behavior (explore codebase, gather context)
  → Write: current behavior (requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml)
  → Validate: current behavior (completeness, template compliance)
```

### Key Design Decisions (Already Made)

1. **Flag is required.** If the user runs `/design auth` without `--project`, `--feature`, or `--spec`, the system prompts them to choose which level. The agent cannot reliably infer this from the name alone.

2. **`--spec` preserves the current /design behavior.** No breaking changes to existing usage once a level is selected.

3. **Each level uses the 3-phase pipeline** (research → write → validate), just with different output templates and artifacts.

4. **Project-level spec sketches are intentionally rough.** They're a starting hypothesis that `--feature` refines. The project level doesn't need to be right, it needs to be useful for kickstarting feature-level design.

5. **Dependencies surface at feature level.** Project level doesn't know enough, spec level is too late. Feature level is where you have N specs and need to decide build order.

6. **Nested directory structure.** A project contains features which contain specs:

   ```
   specs/my-saas/
     project.md
     features.json
     authentication/
       feature.md
       specs.json
       auth-session/
         requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
       auth-oauth/
         requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
     billing/
       feature.md
       specs.json
   ```

   Standalone specs (no parent project/feature) stay at `specs/{name}/` for backward compatibility.

7. **Checkpoint keys include the level** to prevent collisions:
   ```
   .claude/state/design-project-my-saas.json
   .claude/state/design-feature-authentication.json
   .claude/state/design-spec-auth-oauth.json
   ```

### Output Per Level

| Level       | Primary artifact                                                                         | Manifest                                             | What it produces                 |
| ----------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| `--project` | `project.md` (vision, scope, feature list with rough spec sketches)                      | `features.json` (feature names, rough spec names)    | High-level feature breakdown     |
| `--feature` | `feature.md` (refined spec list, dependency graph, descriptions)                         | `specs.json` (spec names, dependencies, build order) | Spec decomposition with ordering |
| `--spec`    | Current 6 files (requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml) | `spec.json` (existing)                               | Full implementation spec         |

### Manifest Formats

`features.json` (project output):

```json
{
  "project": "my-saas",
  "features": [
    {
      "name": "authentication",
      "description": "User auth with session, OAuth, and MFA support",
      "rough_specs": ["auth-session", "auth-oauth", "auth-mfa"]
    },
    {
      "name": "billing",
      "description": "Stripe integration for subscriptions and invoicing",
      "rough_specs": ["billing-subscriptions", "billing-invoicing"]
    }
  ]
}
```

`specs.json` (feature output):

```json
{
  "feature": "authentication",
  "specs": [
    { "name": "auth-session", "description": "...", "depends_on": [] },
    {
      "name": "auth-oauth",
      "description": "...",
      "depends_on": ["auth-session"]
    },
    { "name": "auth-mfa", "description": "...", "depends_on": ["auth-oauth"] }
  ]
}
```

### Flag Interactions

All existing flags (`--phase`, `--resume`, `--no-checkpoint`, `--dry-run`) should work with all three levels:

- `/design my-saas --project --phase=research` — only research the project idea
- `/design authentication --feature --resume` — resume feature-level design from checkpoint
- `/design auth-oauth --spec --dry-run` — preview spec-level design

The level flag and the execution flags are orthogonal.

### Workflow Example

```bash
# Step 1: Break down an idea into features
/design my-saas --project
# Output: specs/my-saas/project.md + features.json

# Step 2: Design one feature, refining the rough spec sketches
/design authentication --feature
# Output: specs/my-saas/authentication/feature.md + specs.json with dependencies

# Step 3: Design individual specs in dependency order
/design auth-session --spec
# Output: specs/my-saas/authentication/auth-session/ (6 files)

/design auth-oauth --spec
# Output: specs/my-saas/authentication/auth-oauth/ (6 files)
```

### Open Questions to Resolve During Design

1. **Path resolution for `--feature` and `--spec`.** When running `/design authentication --feature`, how does the system know this feature belongs to the `my-saas` project? Options: (a) user passes `--project=my-saas`, (b) system searches for a features.json that lists it, (c) user runs from within the project directory context.

2. **Template design.** What do `project.md` and `feature.md` templates look like? They need enough structure to be useful but not so much that the agent can't fill them at the appropriate fidelity level.

3. **Interactive checkpoints per level.** The pre-design and post-design questions need to be different for each level. Project-level questions are about scope and feature boundaries. Feature-level questions are about spec boundaries and dependencies. Spec-level questions are the current 6+6 questions.

4. **Linear integration per level.** Does project-level create a Linear project/initiative? Does feature-level create a parent issue? Or is Linear only at spec level (current behavior)?

5. **Validation differences.** What does the validate phase check at each level? Project: feature coverage. Feature: spec dependency DAG is valid, no circular deps. Spec: current behavior.

6. **How `--feature` refines project-level sketches.** The project produces rough_specs. When you design a feature, should it read those sketches as input context? Should it be able to add/remove/rename specs from what the project suggested?

### Files to Modify

- `.claude/commands/design.md` — add level flags, prompt-if-missing behavior, path resolution
- `.claude/agents/plan-agent.md` — level-aware phase execution, different sub-agent prompts per level
- `.claude/scripts/lib/command-utils.cjs` — may need mutual exclusivity validation for level flags
- New templates: `specs/templates/project.md`, `specs/templates/feature.md`, `specs/templates/features.json`, `specs/templates/specs.json`
- Checkpoint manager updates for level-prefixed keys

### Constraints

- Do not break existing `/design {name}` behavior — `--spec` is the default once a level is selected
- Follow the existing spec format used in `specs/design-incremental-execution/`
- Produce: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml
- Use EARS notation for requirements
- Keep tasks actionable with \_Prompt blocks
- This depends on the design-incremental-execution spec landing first

### Existing Codebase Reference

Read these files for patterns and conventions:

- `specs/design-incremental-execution/requirements.md` — EARS format, acceptance criteria style
- `specs/design-incremental-execution/design.md` — architecture, component design, schemas
- `specs/design-incremental-execution/tasks.md` — task format with \_Prompt blocks, dependency graph
- `.claude/commands/design.md` — current command definition
- `.claude/agents/plan-agent.md` — current agent orchestration
- `.claude/scripts/lib/command-utils.cjs` — flag parsing implementation
