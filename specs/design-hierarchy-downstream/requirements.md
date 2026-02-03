# Requirements: Design Hierarchy Downstream

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy-downstream

## Overview

Adopt the nested spec hierarchy (from specs 1-2) across the downstream tooling ecosystem. This spec updates 14 files across 6 areas: CI/CD workflow validation, skill documentation, agent documentation, GitHub templates, command documentation, and spec infrastructure. The core challenge: existing tools assume flat `specs/{feature}/` paths, while the new hierarchy introduces `specs/{project}/{feature}/` nesting and distinct spec types (`project.md`, `feature.md`, standalone specs). All changes preserve backward compatibility with existing standalone specs.

---

## Functional Requirements

### REQ-D1: CI/CD Workflow Updates

#### REQ-D1.1: Recursive Spec Discovery

**EARS (Event-driven):** WHEN the CI workflow runs spec validation, THE SYSTEM SHALL recursively search for spec directories using `find specs -type f -name 'meta.yaml'` instead of the current flat `find specs/*/meta.yaml` pattern.

**Acceptance Criteria:**

- `.github/workflows/reusable-spec-validation.yml` line 42 updated from `find specs/*/meta.yaml` to `find specs -type f -name 'meta.yaml'`
- Search discovers nested directories at any depth (e.g., `specs/project/feature/meta.yaml`)
- Search discovers standalone specs at root level (e.g., `specs/feature/meta.yaml`)
- No change to output format (still line-separated paths)

#### REQ-D1.2: Spec Type Level Detection

**EARS (Event-driven):** WHEN the CI workflow validates a spec directory, THE SYSTEM SHALL detect whether it contains `project.md`, `feature.md`, or neither (standalone spec) and apply level-appropriate validation rules.

**Acceptance Criteria:**

- After extracting the spec directory path, check for `project.md` existence
- After extracting the spec directory path, check for `feature.md` existence
- If `project.md` exists, classify as PROJECT level and validate project-specific fields
- If `feature.md` exists, classify as FEATURE level and validate feature-specific fields
- If neither exists, classify as STANDALONE and apply existing validation rules
- Level detection implemented as a new validation step before existing checks

#### REQ-D1.3: Branch Name to Nested Spec Mapping

**EARS (Event-driven):** WHEN the CI workflow extracts the spec path from a branch name, THE SYSTEM SHALL map branch names to nested spec directories using the pattern `{branch_prefix}-{project}-{feature}` -> `specs/{project}/{feature}/`.

**Acceptance Criteria:**

- Branch name parsing updated to handle `{prefix}-{project}-{feature}` format (e.g., `design-basecamp-auth` -> `specs/basecamp/auth/`)
- Branch name parsing falls back to flat format for branches without project segment (e.g., `design-my-feature` -> `specs/my-feature/`)
- Parsing implemented via shell script segment extraction (split on `-`, test directory existence)
- If both `specs/{project}/{feature}/` and `specs/{feature}/` exist, prefer nested path
- If neither exists, report error: "Spec directory not found for branch {branch}"

#### REQ-D1.4: PR Comment Path Display

**EARS (Event-driven):** WHEN the CI workflow posts validation results as a PR comment, THE SYSTEM SHALL display the full relative path for nested specs (e.g., `specs/basecamp/auth/`) instead of just the feature name.

**Acceptance Criteria:**

- PR comment includes full path relative to repo root (e.g., `specs/basecamp/auth/`)
- Path extracted from validated spec directory, not synthesized from branch name
- Standalone specs display as `specs/{feature}/` (unchanged from current behavior)
- Path displayed in validation success message and failure message

#### REQ-D1.5: Level-Aware Validation Rules

**EARS (Ubiquitous):** THE SYSTEM SHALL enforce level-specific validation rules: PROJECT specs must have `project.md` and `requirements.md`; FEATURE specs must have `feature.md`, `requirements.md`, `design.md`, and `tasks.md`; STANDALONE specs must have `requirements.md`, `design.md`, `tasks.md`, `summary.md`, `spec.json`, and `meta.yaml`.

**Acceptance Criteria:**

- PROJECT level: require `project.md`, `requirements.md`, `meta.yaml`; optional `summary.md`, `spec.json`
- FEATURE level: require `feature.md`, `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`; optional `project.md` (inherited from parent)
- STANDALONE level: require `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`
- Validation errors report which level was detected and which required files are missing

---

### REQ-D2: Research Skill Documentation

#### REQ-D2.1: Directory Structure Diagram Update

**EARS (Ubiquitous):** THE SYSTEM SHALL update the directory structure diagram in `.claude/skills/research/SKILL.md` to show the nested hierarchy with PROJECT and FEATURE levels.

**Acceptance Criteria:**

- Diagram shows `specs/{project}/{feature}/` structure
- Diagram shows `specs/{feature}/` standalone structure
- Diagram includes `project.md` and `feature.md` file types
- Diagram preserves existing file types (requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json)
- Diagram uses ASCII tree notation consistent with existing format

#### REQ-D2.2: Glob Pattern Update

**EARS (Event-driven):** WHEN the research skill documents glob patterns for finding spec files, THE SYSTEM SHALL use recursive patterns like `specs/**/requirements.md` instead of flat patterns like `specs/*/requirements.md`.

**Acceptance Criteria:**

- All glob pattern examples in `.claude/skills/research/SKILL.md` updated from `specs/*/` to `specs/**/`
- Examples include: `specs/**/requirements.md`, `specs/**/design.md`, `specs/**/tasks.md`, `specs/**/meta.yaml`
- Text explanations note that `**` matches zero or more directory levels
- At least one example shows finding nested specs specifically

#### REQ-D2.3: Hierarchy-Aware Search Examples

**EARS (Ubiquitous):** THE SYSTEM SHALL provide examples of searching within nested hierarchies, such as finding all features within a project or finding project-level requirements.

**Acceptance Criteria:**

- Example added: "Find all features in the 'basecamp' project: `specs/basecamp/*/requirements.md`"
- Example added: "Find project requirements: `specs/*/project.md`"
- Example added: "Find all specs (nested and standalone): `specs/**/requirements.md`"
- Examples placed in a new "Common Search Patterns" section

#### REQ-D2.4: Path Resolution Note

**EARS (Ubiquitous):** THE SYSTEM SHALL document that spec path resolution uses the centralized `spec-path-resolver.cjs` (from Spec 1) to handle both nested and standalone paths.

**Acceptance Criteria:**

- Note added referencing `spec-path-resolver.cjs` in `.claude/scripts/lib/`
- Note explains that resolver handles both `{project}/{feature}` and `{feature}` inputs
- Note placed in "Technical Details" or "Implementation Notes" section

---

### REQ-D3: Preview/Progress Skill Updates

#### REQ-D3.1: Preview Path Display

**EARS (Event-driven):** WHEN the preview skill displays spec paths in command previews, THE SYSTEM SHALL handle longer nested paths (e.g., `specs/basecamp/authentication/`) without breaking box-drawing layouts.

**Acceptance Criteria:**

- `.claude/skills/preview/templates/command-preview.md` updated to allocate sufficient width for nested paths
- Example paths in template updated to show nested format: `specs/{project}/{feature}/`
- No hardcoded path assumptions (template uses `{{spec_path}}` variable)
- Box drawing characters preserve alignment for paths up to 60 characters

#### REQ-D3.2: Progress Path Display

**EARS (Event-driven):** WHEN the progress skill displays spec paths in stage progress output, THE SYSTEM SHALL handle longer nested paths without breaking box-drawing layouts.

**Acceptance Criteria:**

- `.claude/skills/progress/templates/stage-progress.md` updated to allocate sufficient width for nested paths
- Example paths in template updated to show nested format
- No hardcoded path assumptions (template uses `{{spec_path}}` variable)
- Box drawing characters preserve alignment for paths up to 60 characters

#### REQ-D3.3: Example Path Updates

**EARS (Ubiquitous):** THE SYSTEM SHALL update all example spec paths in skill documentation from flat format (`specs/my-feature/`) to include nested examples (`specs/project/my-feature/`).

**Acceptance Criteria:**

- At least one nested path example in preview skill documentation
- At least one nested path example in progress skill documentation
- Standalone path examples preserved (not all replaced)
- Examples show realistic project/feature names (e.g., `basecamp/auth`, not `foo/bar`)

---

### REQ-D4: Agent Documentation Updates

#### REQ-D4.1: Code Agent Path Note

**EARS (Ubiquitous):** THE SYSTEM SHALL update `.claude/agents/code-agent.md` line 161 (the hardcoded `specs/{feature}/` reference) to note that the path is resolved by the centralized resolver and may be nested.

**Acceptance Criteria:**

- Line 161 updated from `specs/{feature}/` to `specs/{resolved_path}/` or similar
- Inline comment or note added: "Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})"
- No change to agent logic, only documentation update

#### REQ-D4.2: UI Agent Path Note

**EARS (Ubiquitous):** THE SYSTEM SHALL update `.claude/agents/ui-agent.md` line 167 (the hardcoded `specs/{feature}/` reference) to note that the path is resolved by the centralized resolver and may be nested.

**Acceptance Criteria:**

- Line 167 updated from `specs/{feature}/` to `specs/{resolved_path}/` or similar
- Inline comment or note added: "Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})"
- No change to agent logic, only documentation update

---

### REQ-D5: GitHub Templates

#### REQ-D5.1: PR Template Path Placeholder

**EARS (Ubiquitous):** THE SYSTEM SHALL update the pull request template spec path placeholder from `specs/{feature}` to `specs/{path}` to accommodate nested paths.

**Acceptance Criteria:**

- IF `.github/pull_request_template.md` contains a spec path field (e.g., `Spec: specs/{{feature}}/`), THEN update the field to reference the new spec path
- IF no spec path field exists, skip with a logged note: "PR template has no spec path field. Skipping update."
- Placeholder changed from `specs/{feature}` to `specs/{path}` or `specs/{project}/{feature}`
- Accompanying text updated to explain nested paths: "Spec path (e.g., specs/basecamp/auth or specs/my-feature)"

#### REQ-D5.2: Issue Template Spec Reference

**EARS (Ubiquitous):** THE SYSTEM SHALL update issue templates to reference nested spec paths where applicable.

**Acceptance Criteria:**

- `.github/ISSUE_TEMPLATE/*.md` files scanned for spec path references
- Any `specs/{feature}` placeholders updated to `specs/{path}`
- Any explanatory text updated to mention nested paths

---

### REQ-D6: Spec Infrastructure Documentation

#### REQ-D6.1: README Rewrite for Directory-Based Specs

**EARS (Ubiquitous):** THE SYSTEM SHALL rewrite `specs/README.md` to document the directory-based spec format (replacing the outdated single-file documentation) and explain the nested hierarchy.

**Acceptance Criteria:**

- `specs/README.md` updated to reflect directory-based specs (not single-file)
- Section added: "Spec Directory Structure" showing required files per level
- Section added: "Nested Hierarchy" explaining PROJECT and FEATURE levels
- Section added: "Standalone Specs" explaining flat specs
- Section added: "Path Resolution" referencing `spec-path-resolver.cjs`
- Examples show both nested and standalone structures
- Outdated single-file references removed

#### REQ-D6.2: README Level Type Documentation

**EARS (Ubiquitous):** THE SYSTEM SHALL document the three spec levels (PROJECT, FEATURE, STANDALONE) with required files and usage guidance.

**Acceptance Criteria:**

- Table added showing level types with required files and optional files
- PROJECT level: requires `project.md`, `requirements.md`, `meta.yaml`
- FEATURE level: requires `feature.md`, `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`
- STANDALONE level: requires `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`
- Usage guidance: when to use each level

#### REQ-D6.3: README Navigation Examples

**EARS (Ubiquitous):** THE SYSTEM SHALL provide examples of navigating the nested hierarchy, including finding specs by project and finding project-level documentation.

**Acceptance Criteria:**

- Example: "Find all features in a project: `ls specs/basecamp/`"
- Example: "View project overview: `cat specs/basecamp/project.md`"
- Example: "Find all specs: `find specs -name 'meta.yaml'`"
- Examples placed in "Finding Specs" or "Navigation" section

#### REQ-D6.4: README Backward Compatibility Note

**EARS (Ubiquitous):** THE SYSTEM SHALL document that existing standalone specs remain valid and that nested hierarchy is optional for new specs.

**Acceptance Criteria:**

- Section added: "Backward Compatibility"
- Text explains: "Existing standalone specs (e.g., specs/my-feature/) remain valid and fully supported"
- Text explains: "New specs can choose nested (specs/project/feature/) or standalone format"
- Text explains: "All tooling supports both formats via spec-path-resolver.cjs"

---

### REQ-D7: Template Reconciliation

#### REQ-D7.1: meta.yaml Field Alignment

**EARS (Ubiquitous):** THE SYSTEM SHALL reconcile the `specs/templates/meta.yaml` template with actual generated files by replacing `spec_id`, `feature`, `author`, `version` with the fields actually used: `id`, `status`, `created`, `updated`, `tasks_total`, `tasks_complete`.

**Acceptance Criteria:**

- Template field `spec_id` renamed to `id`
- Template field `feature` removed (redundant with directory name)
- Template field `author` removed (not used in practice)
- Template field `version` removed (not used in practice)
- Template field `status` added with values: `draft`, `approved`, `in-progress`, `complete`
- Template field `tasks_total` added (integer)
- Template field `tasks_complete` added (integer)
- Comments explain each field's purpose

#### REQ-D7.2: meta.yaml Hierarchy Fields

**EARS (Ubiquitous):** THE SYSTEM SHALL add optional `parent_project` and `parent_feature` fields to `specs/templates/meta.yaml` to support nested hierarchy metadata.

**Acceptance Criteria:**

- Optional field `parent_project` added (string, omitted for PROJECT and STANDALONE levels)
- Optional field `parent_feature` added (string, omitted for PROJECT and STANDALONE levels)
- Comment explains: "parent_project: ID of parent project (for FEATURE level specs only)"
- Comment explains: "parent_feature: Reserved for future nested-feature support. Not currently used in the PROJECT > FEATURE > SPEC hierarchy."
- Fields placed after `updated` and before `tasks_total`

#### REQ-D7.3: meta.yaml Field Order

**EARS (Ubiquitous):** THE SYSTEM SHALL order fields in `meta.yaml` logically: identifiers first (id, parent_project, parent_feature), lifecycle second (status, created, updated), progress third (tasks_total, tasks_complete).

**Acceptance Criteria:**

- Field order: `id`, `parent_project`, `parent_feature`, `status`, `created`, `updated`, `tasks_total`, `tasks_complete`
- Comments group fields by category with section headers: "# Identifiers", "# Lifecycle", "# Progress"

#### REQ-D7.4: spec.json Hierarchy Fields

**EARS (Ubiquitous):** THE SYSTEM SHALL add optional `parent_project` and `parent_feature` fields to `specs/templates/spec.json` to support nested hierarchy metadata.

**Acceptance Criteria:**

- Optional field `parent_project` added to spec.json template (string, omitted if not applicable)
- Optional field `parent_feature` added to spec.json template (string, omitted if not applicable)
- JSON comment (via `_note` field) explains: "parent_project and parent_feature are optional, used for nested specs"
- Fields placed after `name` and before `status`

#### REQ-D7.5: spec.json Example Comment

**EARS (Ubiquitous):** THE SYSTEM SHALL add an example to the spec.json template `_note` field showing a nested spec structure.

**Acceptance Criteria:**

- `_note` field includes example: "For nested specs: parent_project='basecamp', name='authentication'"
- `_note` field includes example: "For standalone: omit parent_project and parent_feature"

---

### REQ-D8: Command Documentation

#### REQ-D8.1: Reconcile Command Project Path Option

**EARS (Ubiquitous):** THE SYSTEM SHALL document in `.claude/commands/reconcile.md` that the command accepts project-qualified paths (e.g., `basecamp/auth`) in addition to standalone feature names.

**Acceptance Criteria:**

- Usage section updated with example: `/reconcile basecamp/auth`
- Text explains: "Path can be a standalone feature (e.g., 'my-feature') or a nested feature (e.g., 'basecamp/auth')"
- No code changes required (resolver already handles this)

#### REQ-D8.2: Reconcile Command Path Resolution Note

**EARS (Ubiquitous):** THE SYSTEM SHALL add a note to `.claude/commands/reconcile.md` referencing the centralized path resolver and explaining that paths are normalized automatically.

**Acceptance Criteria:**

- Note added: "Path resolution handled by spec-path-resolver.cjs (supports nested and standalone)"
- Note placed in "Technical Details" or "Implementation" section

#### REQ-D8.3: Start Command Branch Naming

**EARS (Ubiquitous):** THE SYSTEM SHALL document in `.claude/commands/start.md` that branch names for hierarchical specs use flat format (e.g., `design-basecamp-auth` for `specs/basecamp/auth/`) to maintain Git branch naming simplicity.

**Acceptance Criteria:**

- Section added or updated: "Branch Naming for Nested Specs"
- Text explains: "For nested specs like specs/basecamp/auth/, create branch: design-basecamp-auth"
- Text explains: "CI workflow maps branch name to nested directory automatically"
- Example shows nested spec with corresponding branch name

#### REQ-D8.4: Start Command Path Mapping

**EARS (Ubiquitous):** THE SYSTEM SHALL document the mapping between branch names and nested spec paths in `.claude/commands/start.md`.

**Acceptance Criteria:**

- Mapping table added: `design-basecamp-auth` -> `specs/basecamp/auth/`
- Mapping table added: `design-my-feature` -> `specs/my-feature/`
- Text explains: "Branch names use dash-separated format; CI workflow resolves to directory structure"

---

### REQ-D9: Review Config

#### REQ-D9.1: Review Config Nested Support Comment

**EARS (Ubiquitous):** THE SYSTEM SHALL add a comment to `.claude/config/review-config.yaml` next to `include_specs: true` noting that nested directories are supported.

**Acceptance Criteria:**

- Comment added after `include_specs: true` line: "# Supports nested specs (specs/project/feature/) and standalone (specs/feature/)"
- No functional change, documentation only

---

## Non-Functional Requirements

### NFR-1: Backward Compatibility

**EARS (Ubiquitous):** THE SYSTEM SHALL maintain full backward compatibility with existing standalone specs at `specs/{feature}/` throughout all downstream updates.

**Acceptance Criteria:**

- All CI workflow changes support both nested and standalone paths
- All documentation changes show both formats as valid
- No existing standalone spec breaks due to these changes
- CI validation passes for existing specs without modification

### NFR-2: Path Length Handling

**EARS (Ubiquitous):** THE SYSTEM SHALL handle nested spec paths up to 60 characters in length without breaking UI layouts or truncating paths.

**Acceptance Criteria:**

- Preview templates handle paths up to 60 characters
- Progress templates handle paths up to 60 characters
- PR comment formatting handles paths up to 60 characters
- Longer paths degrade gracefully (wrap or truncate with ellipsis, not break layout)

### NFR-3: Documentation Clarity

**EARS (Ubiquitous):** THE SYSTEM SHALL provide clear examples of both nested and standalone spec usage in all documentation updates.

**Acceptance Criteria:**

- Every documentation file updated includes at least one nested example and one standalone example
- Examples use realistic names (e.g., `basecamp/auth`, not abstract placeholders)
- Examples show complete paths from repo root

---

## Out of Scope

- Automated migration of existing standalone specs to nested format (manual process if desired)
- Spec path resolution logic changes (handled by Spec 1, not this spec)
- Directory type definitions or spec level types (handled by Spec 2, not this spec)
- Changes to command execution logic (only documentation updates)
- Integration with Linear or other external tools (unrelated to hierarchy adoption)
- Performance optimization for recursive directory searches (search depth is shallow, not a concern)

---

## Dependencies

| Dependency                | Type   | Status                                                                           |
| ------------------------- | ------ | -------------------------------------------------------------------------------- |
| `spec-path-resolver.cjs`  | Module | Required (Spec 1) - centralized resolver for nested/standalone path handling     |
| Directory type system     | Spec   | Required (Spec 2) - defines PROJECT/FEATURE/STANDALONE levels and required files |
| `meta.yaml` template      | File   | Modified by this spec - reconcile template with actual usage                     |
| `spec.json` template      | File   | Modified by this spec - add hierarchy fields                                     |
| CI workflow               | File   | Modified by this spec - recursive search and level-aware validation              |
| Skill documentation       | Files  | Modified by this spec - research, preview, progress skills                       |
| Agent documentation       | Files  | Modified by this spec - code-agent.md, ui-agent.md path references               |
| GitHub templates          | Files  | Modified by this spec - PR and issue templates                                   |
| Command documentation     | Files  | Modified by this spec - start, reconcile commands                                |
| `specs/README.md`         | File   | Modified by this spec - rewrite for directory-based specs and hierarchy          |
| `review-config.yaml`      | File   | Modified by this spec - add comment about nested support                         |
| Existing standalone specs | Data   | Preserved - no breaking changes, all existing specs remain valid                 |

---
