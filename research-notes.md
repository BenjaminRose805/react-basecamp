# Research Notes: /design Command Hierarchy Impact Analysis

> **Topic:** Impact analysis, cascading changes, and edge cases for adding `--project`, `--feature`, `--spec` flags to `/design`
> **Date:** 2026-02-01
> **Status:** Research complete — ready for spec authoring
> **Source prompt:** `.claude/prompts/design-hierarchy.md`

---

## Executive Summary

The proposed 3-tier hierarchy (`--project`, `--feature`, `--spec`) for the `/design` command would change the spec path model from flat `specs/{name}/` to nested `specs/{project}/{feature}/{spec}/`. This research investigated the full blast radius across the codebase.

**Key findings:**

- **28 files** reference `specs/` paths; **15 need updates** (4 critical, 6 high, 5 medium)
- **~45 edge cases** identified across 9 categories (4 critical, 22 warning, 19 info)
- **1 missing architectural piece:** a centralized spec discovery/resolution utility
- **6 blocking changes** required before hierarchy can ship
- **8+ deferrable changes** that can land incrementally after core ships
- **Pre-existing issue:** `meta.yaml` template diverges from actual generated files — should be reconciled first

---

## 1. Downstream Consumer Map

### 1.1 Critical (P0) — Block the hierarchy feature

| File                              | Operation          | What breaks                                                                                                                            |
| --------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/commands/implement.md`   | Read/Write/Display | Hardcodes `specs/{feature}/tasks.md`, `summary.md`, `spec.json` in 20+ places. The `feature` variable is always a single name segment. |
| `.claude/agents/plan-agent.md`    | Write/Display      | All 6-file creation paths at `specs/{feature}/`, Linear issue description, checkpoint references, output sections                      |
| `.claude/commands/design.md`      | Write/Display      | Output path display `specs/[feature]/`, writer prompt, OUTPUT section file tree                                                        |
| `.claude/skills/routing/SKILL.md` | Read               | Searches `specs/{feature}/design.md` for routing decisions. Error messages hardcode flat paths.                                        |

### 1.2 High (P1) — Should ship with or shortly after

| File                                                | Operation  | What breaks                                                                                      |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `.claude/agents/code-agent.md`                      | Read       | Line 162: `specs/{feature}/` hardcoded                                                           |
| `.claude/agents/ui-agent.md`                        | Read       | Line 167: `specs/{feature}/` hardcoded                                                           |
| `.claude/skills/research/SKILL.md`                  | Read       | Glob `specs/*/requirements.md` misses nested specs. Directory structure docs assume flat layout. |
| `.claude/sub-agents/templates/domain-writer.md`     | Read/Write | `spec_path` handoff field assumes flat structure                                                 |
| `.claude/sub-agents/templates/domain-researcher.md` | Read       | `specs/*` glob in plan mode only matches top-level                                               |
| `.claude/sub-agents/protocols/handoff.md`           | Schema     | `spec_path` examples assume `specs/auth/requirements.md` (flat)                                  |

### 1.3 Medium (P2) — Can be deferred

| File                                             | Operation     | What breaks                                                           |
| ------------------------------------------------ | ------------- | --------------------------------------------------------------------- |
| `.github/workflows/reusable-spec-validation.yml` | Read/Validate | `find` heuristic + branch-to-spec mapping gets ambiguous with nesting |
| `.claude/skills/preview/SKILL.md`                | Display       | Example paths in documentation                                        |
| `.claude/skills/progress/SKILL.md`               | Display       | Spec write progress paths                                             |
| `.claude/commands/reconcile.md`                  | Write         | Output path pattern (reconcile stays flat, minimal impact)            |
| `.claude/config/review-config.yaml`              | Config        | `include_specs: true` — consumer may need updated glob depth          |

### 1.4 Safe — No changes needed

| File                                                                           | Why safe                                                                    |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `specs/templates/*` (all 6)                                                    | Use relative `./` links — work at any depth                                 |
| `.gitleaks.toml`                                                               | Uses `specs/.*\.md$` regex — matches any depth                              |
| `.claude/scripts/lib/*.cjs` (all 15)                                           | No spec path references; checkpoint-manager treats feature as opaque string |
| `.claude/skills/preview/templates/*.md`                                        | Generic `{{output_path}}` placeholders                                      |
| `.claude/skills/progress/templates/*.md`                                       | Generic `{{stage_name}}` placeholders                                       |
| `/ship`, `/review`, `/research` commands                                       | Zero spec path dependencies                                                 |
| QA checks, git operations, TDD workflow, coding standards, eval harness skills | No spec path references                                                     |

### 1.5 Dominant Code Pattern

The codebase uniformly constructs spec paths via string interpolation:

```
specs/${feature}/tasks.md
specs/${feature}/design.md
specs/${feature}/spec.json
```

Where `feature` is always a **single name segment** (e.g., `"user-authentication"`). For hierarchy, this must become a **multi-segment path** (e.g., `"my-saas/authentication/auth-session"`) or be replaced by a resolution function.

---

## 2. Missing Architectural Piece: Spec Discovery Utility

There is **no centralized spec discovery mechanism**. Every command independently hardcodes `specs/{feature}/` patterns. This is the single biggest architectural gap.

### Proposed: `spec-resolver` utility

A function that:

1. Accepts a name (e.g., `auth-oauth`) and optional level hint (`project`/`feature`/`spec`)
2. Searches `specs/` recursively, detecting directory types by marker files:
   - `project.md` or `features.json` → project directory
   - `feature.md` or `specs.json` → feature directory
   - `requirements.md` or `design.md` or `tasks.md` → spec directory
3. Handles ambiguity (multiple matches → prompt or error with `--parent` suggestion)
4. Returns the full resolved path
5. Supports both flat (`specs/{name}/`) and nested (`specs/{project}/{feature}/{spec}/`) layouts

### Search order (backward-compatible)

1. `specs/{name}/` — standalone spec (existing behavior)
2. `specs/*/specs.json` — feature-level match
3. `specs/*/*/specs.json` — nested spec match
4. `specs/*/features.json` — project-level match (for feature names)

### Consumers

- `/implement` command
- Routing skill
- Plan-agent (for `--feature` and `--spec` path resolution)
- Research skill (for context gathering)

---

## 3. Critical Edge Cases (Require Immediate Design Attention)

### 3a. Directory collision: project name matches existing standalone spec (A1)

**Scenario:** `specs/auth/` exists as a standalone spec. User runs `/design auth --project`, which wants to create `project.md` and `features.json` in the same directory.

**Risk:** CRITICAL — silent data corruption.

**Recommendation:** Before creating any directory, detect its type via marker files. Error if type mismatch: `"specs/auth/ already exists as a spec. Choose a different project name or use --parent to nest it."`

### 3b. Reserved directory name `templates` (A5)

**Scenario:** `/design templates --project` would create `specs/templates/project.md`, colliding with the template files.

**Risk:** CRITICAL — destroys template infrastructure.

**Recommendation:** Maintain a deny-list: `["templates"]`. Reject with: `"Name 'templates' is reserved."`

### 3c. Feature redesign removes already-designed specs (D2)

**Scenario:** User designs 3 specs, implements 2, re-runs `--feature` which produces a new `specs.json` that drops one implemented spec.

**Risk:** CRITICAL — silent manifest/directory divergence.

**Recommendation:** Diff new `specs.json` against existing. For removed specs with existing directories, warn: `"The following specs would be removed from the manifest: auth-mfa (has existing design at specs/my-saas/authentication/auth-mfa/). Proceed?"` Never auto-delete spec directories.

### 3d. Name ambiguity across projects/features (A3, A4, F3, F4)

**Scenario:** `/design authentication --feature` finds matches in multiple `features.json` files across projects.

**Risk:** WARNING — wrong placement if silently resolved.

**Recommendation:** Define strict search algorithm: (1) search all manifest files, (2) if exactly one match, use it, (3) if multiple matches, error: `"Found 'authentication' in multiple projects: saas, platform. Use --parent=saas or --parent=platform."`

### 3e. Backward compatibility for existing standalone specs (E1)

**Scenario:** 12 existing specs at `specs/{name}/` must keep working with `/implement`.

**Risk:** CRITICAL — breaks existing workflows.

**Recommendation:** Auto-search prioritizes standalone `specs/{name}/` first. Add explicit test case: "Existing standalone spec at `specs/design-optimization/` works with `/implement` unchanged."

---

## 4. Edge Case Catalog

### 4.1 Naming and Identity (7 cases)

| ID  | Edge Case                                         | Risk     | Recommendation                                        |
| --- | ------------------------------------------------- | -------- | ----------------------------------------------------- |
| A1  | Project/standalone spec name collision            | CRITICAL | Directory-type detection before creation              |
| A2  | Feature/child spec same name (e.g., `auth/auth/`) | WARNING  | Prevent identical parent-child names                  |
| A3  | Same feature name in multiple projects            | WARNING  | Multi-match detection, require `--parent`             |
| A4  | Same spec name across features                    | WARNING  | Multi-match detection, require `--parent`             |
| A5  | Reserved names (`templates`)                      | CRITICAL | Deny-list of reserved names                           |
| A6  | Case sensitivity (`Auth` vs `auth`)               | WARNING  | Normalize to lowercase kebab-case                     |
| A7  | Special characters (spaces, dots, slashes)        | WARNING  | `validateAndNormalizeName()`: restrict to `[a-z0-9-]` |

### 4.2 Partial Hierarchy States (7 cases)

| ID  | Edge Case                                           | Risk    | Recommendation                                      |
| --- | --------------------------------------------------- | ------- | --------------------------------------------------- |
| B1  | Project exists, no features designed → `/implement` | WARNING | Type detection, guide user to design features first |
| B2  | Feature has some specs skipped                      | INFO    | Track per-spec status in `specs.json`               |
| B3  | Standalone spec matches project rough_spec          | WARNING | Detect and offer adoption                           |
| B4  | Orphaned features (project.md deleted)              | INFO    | Features self-describe via `feature.md`             |
| B5  | Orphaned specs (feature.md deleted)                 | INFO    | Specs self-contained, `specs.json` optional         |
| B6  | Feature in manifest but no directory yet            | INFO    | Normal state — document clearly                     |
| B7  | Dangling `depends_on` reference                     | WARNING | Referential integrity check in validation           |

### 4.3 Concurrent and Sequential Operations (5 cases)

| ID  | Edge Case                                                  | Risk    | Recommendation                                                              |
| --- | ---------------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| C1  | Two concurrent spec designs in same feature                | WARNING | Specs own only their subdirectory; `specs.json` owned by feature-level only |
| C2  | Spec designed before feature (`--spec` before `--feature`) | WARNING | Auto-search placement hints, allow standalone fallback                      |
| C3  | Manual manifest edits before `--feature`                   | INFO    | Schema validation on read, be permissive                                    |
| C4  | Running `--project` twice on same name                     | WARNING | Detect existing `project.md`, warn, offer overwrite with backup             |
| C5  | Resume after directory structure changed                   | WARNING | Filesystem integrity check on resume                                        |

### 4.4 Cross-Level Interactions (5 cases)

| ID  | Edge Case                                              | Risk     | Recommendation                                                                  |
| --- | ------------------------------------------------------ | -------- | ------------------------------------------------------------------------------- |
| D1  | `specs.json` vs `spec.json` naming confusion           | WARNING  | Consider renaming feature manifest to `feature-specs.json` or add `_type` field |
| D2  | Feature redesign removes existing specs                | CRITICAL | Diff against existing, warn about content dirs, never auto-delete               |
| D3  | Project `features.json` stale after feature refinement | INFO     | Document that `specs.json` is authoritative, do NOT auto-update `features.json` |
| D4  | Spec belonging to multiple features                    | WARNING  | Enforce single ownership, add `cross_feature_deps` field                        |
| D5  | Cross-feature spec dependencies                        | WARNING  | Support `"depends_on": ["authentication/auth-session"]` reference format        |

### 4.5 Migration and Backward Compatibility (5 cases)

| ID  | Edge Case                                        | Risk     | Recommendation                                    |
| --- | ------------------------------------------------ | -------- | ------------------------------------------------- |
| E1  | Existing standalone specs must keep working      | CRITICAL | No migration required, add explicit test case     |
| E2  | Adopting standalone spec into hierarchy          | INFO     | Defer tooling, document manual process            |
| E3  | Mixed flat and nested specs coexisting           | WARNING  | Multi-path auto-search with priority order        |
| E4  | `spec.json`/`meta.yaml` missing hierarchy fields | INFO     | Add optional `parent_project`/`parent_feature`    |
| E5  | `meta.yaml` template/actual divergence           | WARNING  | Reconcile template before adding hierarchy fields |

### 4.6 Path Resolution (6 cases)

| ID  | Edge Case                                         | Risk    | Recommendation                                  |
| --- | ------------------------------------------------- | ------- | ----------------------------------------------- |
| F1  | Feature found in `features.json` but no directory | INFO    | Normal — create directory on first design       |
| F2  | Spec found in `specs.json` but no `feature.md`    | INFO    | `specs.json` sufficient to identify feature dir |
| F3  | Feature name in multiple `features.json`          | WARNING | Same as A3 — disambiguation required            |
| F4  | Spec name in multiple `specs.json`                | WARNING | Same as A4 — disambiguation required            |
| F5  | `--parent=X` but X does not exist                 | WARNING | Validate existence before proceeding            |
| F6  | `--parent=X` but item not in X's manifest         | INFO    | Allow creation, add to manifest afterward       |

### 4.7 Checkpoint Edge Cases (4 cases)

| ID  | Edge Case                                      | Risk    | Recommendation                                                     |
| --- | ---------------------------------------------- | ------- | ------------------------------------------------------------------ |
| G1  | Checkpoint exists, directory deleted           | WARNING | Add `target_directory` to checkpoint schema, verify on resume      |
| G2  | Cross-level checkpoint overlap                 | INFO    | Keep independent, use filesystem state for cross-level awareness   |
| G3  | Resume feature after one spec already designed | INFO    | Feature-level independent of spec-level state                      |
| G4  | Resume with wrong level flag                   | INFO    | Search other levels, suggest: `"Did you mean --project --resume?"` |

### 4.8 Validation Edge Cases (4 cases)

| ID  | Edge Case                                             | Risk    | Recommendation                                                       |
| --- | ----------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| H1  | Cross-feature spec dependencies in DAG                | WARNING | Resolve cross-feature refs via other features' `specs.json`          |
| H2  | Project-level "coverage" — what to validate           | WARNING | Structural checks: >=1 feature, names present, non-empty rough_specs |
| H3  | Cross-feature circular dependencies                   | WARNING | Global topological sort across all features                          |
| H4  | Semantic correctness (wrong content, valid structure) | INFO    | Interactive checkpoints are the mitigation                           |

### 4.9 Template and Output Scale (6 cases)

| ID  | Edge Case                               | Risk    | Recommendation                                   |
| --- | --------------------------------------- | ------- | ------------------------------------------------ |
| I1  | Empty `features.json` (no features)     | WARNING | Validation requires >= 1 feature                 |
| I2  | Empty `specs.json` (no specs)           | WARNING | Validation requires >= 1 spec                    |
| I3  | 50+ specs in one feature                | INFO    | Soft cap at 20, warn about manageability         |
| I4  | 20+ features in one project             | INFO    | Soft cap at 15, suggest sub-projects             |
| I5  | Name length exceeding filesystem limits | WARNING | Max 50 chars per segment, total path < 200 chars |
| I6  | Unicode in names                        | INFO    | Restrict to `[a-z0-9-]` after normalization      |

---

## 5. Cross-Command Impact Summary

| Command/Component                            | Impact | Effort  | Blocks Hierarchy?         | Can Defer? |
| -------------------------------------------- | ------ | ------- | ------------------------- | ---------- |
| `/implement` command + routing skill         | HIGH   | Large   | YES                       | No         |
| `/design` command + plan-agent               | HIGH   | Large   | YES (this IS the feature) | No         |
| Spec discovery utility (new)                 | HIGH   | Medium  | YES                       | No         |
| Checkpoint manager                           | MEDIUM | Small   | YES                       | No         |
| New templates (project.md, feature.md, etc.) | LOW    | Small   | YES                       | No         |
| code-agent                                   | MEDIUM | Small   | No                        | Yes\*      |
| ui-agent                                     | MEDIUM | Small   | No                        | Yes\*      |
| Research skill docs                          | MEDIUM | Small   | No                        | Yes        |
| CI spec validation workflow                  | MEDIUM | Medium  | No                        | Yes        |
| Preview/progress skills                      | LOW    | Small   | No                        | Yes        |
| `/start` command                             | LOW    | Trivial | No                        | Yes        |
| `/reconcile` command                         | LOW    | Trivial | No                        | Yes        |
| GitHub templates                             | LOW    | Trivial | No                        | Yes        |
| `specs/README.md`                            | LOW    | Trivial | No                        | Yes        |
| `/ship`, `/review`, `/research`              | NONE   | Zero    | No                        | N/A        |
| QA checks, git ops, TDD, coding standards    | NONE   | Zero    | No                        | N/A        |

\*Code-agent and ui-agent can be deferred IF `/implement` resolves and passes the full spec path to them.

---

## 6. Blocking Critical Path

These must all be in place for the hierarchy to function:

1. **Spec discovery utility** — resolves names to full paths, handles ambiguity, supports flat + nested
2. **`/design` command + plan-agent** — level-aware routing, different output artifacts per level, nested path creation
3. **`/implement` command** — uses discovery utility, passes full path to sub-agents
4. **Routing skill** — searches nested paths for approved specs
5. **Checkpoint manager** — level-prefixed keys, collision avoidance for same-name specs in different projects
6. **New templates** — `project.md`, `feature.md`, `features.json`, `specs.json`

---

## 7. Key Design Decisions Surfaced

### 7a. `--parent` flag naming

Cannot reuse `--project` as both a boolean level flag and a string context flag. Introduce `--parent=X` (or `--in=X`) for explicit path resolution, keeping `--project` purely as the level selector.

### 7b. Spec discovery is the architectural linchpin

Without a centralized resolver, every downstream command needs its own nested path resolution logic. This utility should be designed and built as a foundation before the hierarchy feature ships.

### 7c. `specs.json` vs `spec.json` naming

These coexist in the same tree and mean different things:

- `specs.json` = feature manifest (list of specs with dependencies)
- `spec.json` = individual spec metadata

One-letter difference creates confusion. Consider renaming the feature manifest to `feature-specs.json`, `spec-manifest.json`, or adding a `"_type"` field to both for self-identification.

### 7d. Cross-feature dependencies need first-class support

The `depends_on` field in `specs.json` should support both local (`"auth-session"`) and cross-feature (`"authentication/auth-session"`) references from day one. Deferring this creates a manifest format change later.

### 7e. Never auto-delete directories when manifests change

When a feature-level redesign removes specs from `specs.json`, existing spec directories must be preserved. Manifests are plans; directories are artifacts. This is a data safety principle.

### 7f. Pre-existing `meta.yaml` divergence

The `meta.yaml` template has fields (`spec_id`, `feature`, `author`, `version`) that actual generated files don't use (they use `id`, omit others). This should be reconciled before adding hierarchy fields (`parent_project`, `parent_feature`).

---

## 8. Recommendations for Spec Authoring

When writing the formal spec (`requirements.md`, `design.md`, `tasks.md`):

1. **Include the spec discovery utility as a foundational task** — it unblocks everything downstream
2. **Add explicit backward compatibility test cases** — "existing standalone spec works with `/implement` unchanged"
3. **Define the exact auto-search algorithm** with fallback chain and disambiguation rules
4. **Specify validation criteria per level** — project, feature, and spec levels need different checks
5. **Address the `specs.json` / `spec.json` naming** — decide before the spec ships
6. **Include a name validation function spec** — `validateAndNormalizeName()` covering length, characters, case, reserved names
7. **Design the `--parent` flag interaction** — orthogonal to level flags, resolves path context
8. **Scope cross-feature dependencies** — at minimum, define the `depends_on` reference format
9. **Document the manifest ownership model** — `features.json` owned by project-level, `specs.json` owned by feature-level, `spec.json` owned by spec-level
10. **Reconcile `meta.yaml` template** before adding hierarchy fields

---

## 9. Dependency Note

The `design-incremental-execution` spec (flags, checkpoints, interactive checkpoints, summary/spec.json/meta.yaml generation, Linear integration) is approved but has 0/22 tasks complete. The hierarchy feature layers on top of it and cannot be implemented until it lands. The hierarchy spec can be _authored_ now but should be tagged as dependent.

---
