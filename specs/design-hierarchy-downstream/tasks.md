# Tasks: Design Hierarchy Downstream

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy-downstream

## Progress

**Total:** 18/18 tasks complete

**Suggested Implementation Order:** T001, T004, T008, T013, T017

**Files:** 14 modified files

---

## Phase 1: Template Reconciliation

### T001: Reconcile meta.yaml template fields [REQ-D7.1, REQ-D7.3]

Update `specs/templates/meta.yaml` to align with actual generated files. Replace `spec_id` with `id`, remove unused fields (`feature`, `author`, `version`), add used fields (`status`, `tasks_total`, `tasks_complete`), and organize fields into logical groups with section headers.

**File:** `specs/templates/meta.yaml`

**Changes:**

- Replace `spec_id: "{{id}}"` with `id: "{{id}}"`
- Remove `feature: "{{name}}"` line (redundant with directory name)
- Remove `author: "{{agent}}"` line (not used in practice)
- Remove `version: "{{semver}}"` line (not used in practice)
- Add `status: "{{status}}"` line with comment explaining values: draft, approved, in-progress, complete
- Add `tasks_total: {{tasks_total}}` line (integer, no quotes)
- Add `tasks_complete: {{tasks_complete}}` line (integer, no quotes)
- Add section header comments: `# Identifiers`, `# Lifecycle`, `# Progress`
- Reorder fields: id (under Identifiers), status/created/updated (under Lifecycle), tasks_total/tasks_complete (under Progress)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `specs/templates/meta.yaml` to reconcile template with actual generated files. (1) Replace `spec_id` field with `id`, (2) remove `feature`, `author`, and `version` fields (not used in practice), (3) add `status` field with comment: "# Values: draft, approved, in-progress, complete", (4) add `tasks_total` and `tasks_complete` fields (integers, no quotes), (5) add section header comments: "# Identifiers" before `id`, "# Lifecycle" before `status`, "# Progress" before `tasks_total`, (6) reorder fields: id, status, created, updated, tasks_total, tasks_complete. Preserve all existing comments explaining field purpose. | **Restrictions:** Keep YAML format valid. Use 2-space indentation. No new files. | **Success:** Template matches actual generated meta.yaml files. Fields are id, status, created, updated, tasks_total, tasks_complete with section headers.

---

### T002: Add hierarchy fields to spec.json template [REQ-D7.4, REQ-D7.5]

Add optional `parent_project` and `parent_feature` fields to `specs/templates/spec.json` to support nested hierarchy metadata. Update the `_note` field with examples showing nested and standalone usage.

**File:** `specs/templates/spec.json`

**Changes:**

- Add `"parent_project": "{{parent_project}}"` field after `"name"` field
- Add `"parent_feature": "{{parent_feature}}"` field after `"parent_project"` field
- Update `"_note"` field to include example: "For nested specs: parent_project='basecamp', name='authentication'. For standalone: omit parent_project and parent_feature."
- Document that parent fields are optional and should be omitted (not null) for standalone specs

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `specs/templates/spec.json` to add hierarchy fields. (1) After the `"name"` field, add `"parent_project": "{{parent_project}}"`, (2) after `"parent_project"`, add `"parent_feature": "{{parent_feature}}"`, (3) update the `"_note"` field to: "Template for machine-readable spec metadata. For nested specs: parent_project='basecamp', name='authentication'. For standalone: omit parent_project and parent_feature fields entirely.", (4) preserve all existing fields and structure. | **Restrictions:** Valid JSON only. Use 2-space indentation. parent_project and parent_feature are optional (omit for standalone, not set to null). No new files. | **Success:** spec.json template includes parent_project and parent_feature fields with usage examples in \_note.

---

### T003: Add hierarchy fields to meta.yaml template [REQ-D7.2]

Add optional `parent_project` and `parent_feature` fields to `specs/templates/meta.yaml` to support nested hierarchy metadata, placed in the Identifiers section.

**File:** `specs/templates/meta.yaml`

**Changes:**

- After the `id` field (in Identifiers section), add `parent_project: "{{parent_project}}"` with comment: "# Optional: ID of parent project (for FEATURE level specs only)"
- After `parent_project`, add `parent_feature: "{{parent_feature}}"` with comment: "# Optional: ID of parent feature (for nested features only, rare)"
- Document in comments that these fields should be omitted for PROJECT and STANDALONE levels

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `specs/templates/meta.yaml` to add optional hierarchy fields in the Identifiers section. (1) After the `id: "{{id}}"` line, add `parent_project: "{{parent_project}}"` with comment: "# Optional: ID of parent project (for FEATURE level specs only)", (2) after `parent_project`, add `parent_feature: "{{parent_feature}}"` with comment: "# Optional: ID of parent feature (for nested features only, rare)", (3) add comment explaining these fields are omitted for PROJECT and STANDALONE levels. | **Restrictions:** Valid YAML only. Use 2-space indentation. Fields are optional (omit for PROJECT/STANDALONE). No new files. This task depends on T001 being complete. | **Success:** meta.yaml template includes parent_project and parent_feature in Identifiers section with usage comments.

---

## Phase 2: CI/CD Workflow

### T004: Update spec discovery to recursive find [REQ-D1.1]

Update `.github/workflows/reusable-spec-validation.yml` line 42 to use recursive find instead of flat pattern, discovering spec directories at any depth.

**File:** `.github/workflows/reusable-spec-validation.yml`

**Changes:**

- Line 42: replace `find specs/*/meta.yaml` with `find specs -type f -name 'meta.yaml'`
- Verify output format remains line-separated paths (no functional change beyond recursion)
- Add comment explaining recursive search discovers nested directories

**\_Prompt:**
**Role:** DevOps Engineer | **Task:** Update `.github/workflows/reusable-spec-validation.yml` line 42 to use recursive find. Replace `find specs/*/meta.yaml` with `find specs -type f -name 'meta.yaml'`. Add inline comment: "# Recursive search discovers nested specs (specs/project/feature/meta.yaml) and standalone (specs/feature/meta.yaml)". | **Restrictions:** No other workflow changes. Preserve output format (line-separated paths). No new files. | **Success:** Workflow discovers both `specs/feature/meta.yaml` and `specs/project/feature/meta.yaml` directories.

---

### T005: Add level detection to CI validation [REQ-D1.2, REQ-D1.5]

Add spec level detection logic to the CI workflow. After extracting the spec directory path, check for `project.md` or `feature.md` existence to classify as PROJECT, FEATURE, or STANDALONE level, then apply level-appropriate validation rules.

**File:** `.github/workflows/reusable-spec-validation.yml`

**Changes:**

- Add a new step after extracting spec directory path: "Detect spec level"
- Check for `project.md` existence (PROJECT level)
- Check for `feature.md` existence (FEATURE level)
- If neither, classify as STANDALONE level
- Set required files list based on level:
  - PROJECT: `project.md requirements.md meta.yaml`
  - FEATURE: `feature.md requirements.md design.md tasks.md meta.yaml summary.md spec.json`
  - STANDALONE: `requirements.md design.md tasks.md meta.yaml summary.md spec.json`
- Validate all required files exist
- Report level in validation output and error messages

**\_Prompt:**
**Role:** DevOps Engineer | **Task:** Add level detection to `.github/workflows/reusable-spec-validation.yml`. After extracting spec directory from meta.yaml path: (1) check if `$spec_dir/project.md` exists (PROJECT level), (2) check if `$spec_dir/feature.md` exists (FEATURE level), (3) if neither, classify as STANDALONE, (4) set required files based on level: PROJECT=`project.md requirements.md meta.yaml`, FEATURE=`feature.md requirements.md design.md tasks.md meta.yaml summary.md spec.json`, STANDALONE=`requirements.md design.md tasks.md meta.yaml summary.md spec.json`, (5) validate each required file exists, (6) include level in error messages: "ERROR: $LEVEL spec $spec_dir missing required file: $file". | **Restrictions:** Bash script logic. No new workflow files. Preserve existing validation steps. | **Success:** CI validates PROJECT specs require project.md, FEATURE specs require feature.md, STANDALONE specs require neither.

---

### T006: Update branch-to-path mapping [REQ-D1.3]

Update the CI workflow's branch name parsing logic to map `{prefix}-{project}-{feature}` format to `specs/{project}/{feature}/` with fallback to flat format for standalone specs.

**File:** `.github/workflows/reusable-spec-validation.yml`

**Changes:**

- Extract branch name components: PREFIX (1st segment), PROJECT (2nd segment), FEATURE (3rd+ segments)
- Test for nested path: `specs/$PROJECT/$FEATURE/` existence
- Test for flat path: `specs/$PROJECT/` existence
- Prefer nested path if both exist
- Error if neither exists: "Spec directory not found for branch {branch}. Tried: specs/{project}/{feature}/ and specs/{project}/"
- Use resolved path for validation

**\_Prompt:**
**Role:** DevOps Engineer | **Task:** Update branch-to-path mapping in `.github/workflows/reusable-spec-validation.yml`. (1) Extract branch components: `PREFIX=$(echo "$BRANCH" | cut -d- -f1)`, `PROJECT=$(echo "$BRANCH" | cut -d- -f2)`, `FEATURE=$(echo "$BRANCH" | cut -d- -f3-)`, (2) test for nested: `if [ -n "$FEATURE" ] && [ -d "specs/$PROJECT/$FEATURE" ]; then SPEC_PATH="specs/$PROJECT/$FEATURE/"`, (3) test for flat: `elif [ -d "specs/$PROJECT" ]; then SPEC_PATH="specs/$PROJECT/"`, (4) error if neither: "Spec directory not found for branch $BRANCH. Tried: specs/$PROJECT/$FEATURE/ and specs/$PROJECT/". (5) use $SPEC_PATH for validation. Document mapping: design-basecamp-auth → specs/basecamp/auth/, design-my-feature → specs/my-feature/. | **Restrictions:** Bash script logic. No new workflow files. Preserve existing branch parsing if present. | **Success:** CI maps design-basecamp-auth to specs/basecamp/auth/ and design-my-feature to specs/my-feature/ correctly.

---

### T007: Update PR comment path display [REQ-D1.4]

Update the CI workflow's PR comment to display the full relative path for validated specs (e.g., `specs/basecamp/auth/`) instead of just the feature name.

**File:** `.github/workflows/reusable-spec-validation.yml`

**Changes:**

- In PR comment generation, use full spec directory path extracted from validation
- Display path relative to repo root (e.g., `specs/basecamp/auth/`)
- Include path in both success message ("Spec validated: specs/basecamp/auth/") and failure message
- Extract path from validated spec directory, not synthesized from branch name

**\_Prompt:**
**Role:** DevOps Engineer | **Task:** Update PR comment generation in `.github/workflows/reusable-spec-validation.yml` to display full spec path. (1) In validation success message, use: "Spec validated: $SPEC_PATH" where $SPEC_PATH is the resolved directory path (e.g., specs/basecamp/auth/), (2) in validation failure message, include: "Spec validation failed for: $SPEC_PATH", (3) extract $SPEC_PATH from the validated directory (from branch mapping or meta.yaml path), not from branch name. | **Restrictions:** No new workflow files. Preserve existing PR comment format. Path should be relative to repo root. | **Success:** PR comments show "Spec validated: specs/basecamp/auth/" for nested specs and "Spec validated: specs/my-feature/" for standalone.

---

## Phase 3: Skill Documentation

### T008: Update research skill glob patterns and examples [REQ-D2.2, REQ-D2.3, REQ-D2.4]

Update `.claude/skills/research/SKILL.md` to use recursive glob patterns (`specs/**/`), add hierarchy-aware search examples, and document path resolution via `spec-path-resolver.cjs`.

**File:** `.claude/skills/research/SKILL.md`

**Changes:**

- Replace all `specs/*/` glob patterns with `specs/**/` (e.g., `specs/**/requirements.md`)
- Add text explanation: "`**` matches zero or more directory levels"
- Add new section: "Common Search Patterns" with examples:
  - "Find all features in a project: `specs/basecamp/*/requirements.md`"
  - "Find project requirements: `specs/*/project.md`"
  - "Find all specs (nested and standalone): `specs/**/requirements.md`"
- Add "Path Resolution" section referencing `spec-path-resolver.cjs` in `.claude/scripts/lib/`
- Note that resolver handles both `{project}/{feature}` and `{feature}` inputs

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/skills/research/SKILL.md` glob patterns and add hierarchy examples. (1) Replace all instances of `specs/*/` with `specs/**/` in glob pattern examples, (2) add note: "`**` matches zero or more directory levels (discovers nested specs)", (3) add new section "## Common Search Patterns" with examples: "Find all features in project: `specs/basecamp/*/requirements.md`", "Find project requirements: `specs/*/project.md`", "Find all specs: `specs/**/requirements.md`", (4) add section "## Path Resolution" with note: "Spec paths resolved by `spec-path-resolver.cjs` in `.claude/scripts/lib/`. Handles both nested ({project}/{feature}) and standalone ({feature}) formats." | **Restrictions:** No code changes, documentation only. Preserve existing skill structure. No new files. | **Success:** research skill documents recursive patterns, hierarchy search examples, and path resolver.

---

### T009: Update preview skill path display width [REQ-D3.1, REQ-D3.3]

Update `.claude/skills/preview/templates/command-preview.md` to allocate sufficient width for nested paths (up to 60 characters) and update example paths to show nested format.

**File:** `.claude/skills/preview/templates/command-preview.md`

**Changes:**

- Update box-drawing to handle 60-character paths without breaking alignment
- Replace example paths from `specs/{feature}/` to include nested examples: `specs/{project}/{feature}/`
- Ensure `{{spec_path}}` variable is used (no hardcoded path assumptions)
- Add both nested and standalone examples in the template

**\_Prompt:**
**Role:** Frontend Developer | **Task:** Update `.claude/skills/preview/templates/command-preview.md` for nested path display. (1) Ensure box-drawing characters allocate 60-character width for spec paths (adjust border length if needed), (2) replace example paths: change `specs/my-feature/` to include nested example `specs/basecamp/auth/` and standalone example `specs/my-feature/`, (3) verify `{{spec_path}}` variable is used (no hardcoded paths), (4) test alignment preservation for paths up to 60 chars. | **Restrictions:** No new files. Preserve box-drawing style. Use Unicode box-drawing characters (┌─┐│└─┘). Template variables only, no actual paths. | **Success:** Preview template displays nested paths like specs/basecamp/authentication/ without breaking box alignment.

---

### T010: Update progress skill path display width [REQ-D3.2, REQ-D3.3]

Update `.claude/skills/progress/templates/stage-progress.md` to allocate sufficient width for nested paths (up to 60 characters) and update example paths to show nested format.

**File:** `.claude/skills/progress/templates/stage-progress.md`

**Changes:**

- Update box-drawing to handle 60-character paths without breaking alignment
- Replace example paths from `specs/{feature}/` to include nested examples: `specs/{project}/{feature}/`
- Ensure `{{spec_path}}` variable is used (no hardcoded path assumptions)
- Add both nested and standalone examples in the template

**\_Prompt:**
**Role:** Frontend Developer | **Task:** Update `.claude/skills/progress/templates/stage-progress.md` for nested path display. (1) Ensure box-drawing characters allocate 60-character width for spec paths (adjust border length if needed), (2) replace example paths: change `specs/my-feature/` to include nested example `specs/basecamp/auth/` and standalone example `specs/my-feature/`, (3) verify `{{spec_path}}` variable is used (no hardcoded paths), (4) test alignment preservation for paths up to 60 chars. | **Restrictions:** No new files. Preserve box-drawing style. Use Unicode box-drawing characters. Template variables only, no actual paths. | **Success:** Progress template displays nested paths like specs/basecamp/authentication/ without breaking box alignment.

---

## Phase 4: Agent Documentation

### T011: Update code-agent.md path note [REQ-D4.1]

Update `.claude/agents/code-agent.md` line 161 to reference `specs/{resolved_path}/` instead of hardcoded `specs/{feature}/`, with an inline comment explaining path resolution.

**File:** `.claude/agents/code-agent.md`

**Changes:**

- Line 161: replace `specs/{feature}/` with `specs/{resolved_path}/`
- Add inline comment: "Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})"
- No logic changes, documentation only

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/agents/code-agent.md` line 161 path reference. (1) Replace `specs/{feature}/` with `specs/{resolved_path}/`, (2) add inline comment on the same line or next line: "// Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})". | **Restrictions:** No code changes, documentation only. Do not modify agent logic. Preserve existing formatting. | **Success:** Line 161 shows specs/{resolved_path}/ with path resolution comment.

---

### T012: Update ui-agent.md path note [REQ-D4.2]

Update `.claude/agents/ui-agent.md` line 167 to reference `specs/{resolved_path}/` instead of hardcoded `specs/{feature}/`, with an inline comment explaining path resolution.

**File:** `.claude/agents/ui-agent.md`

**Changes:**

- Line 167: replace `specs/{feature}/` with `specs/{resolved_path}/`
- Add inline comment: "Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})"
- No logic changes, documentation only

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/agents/ui-agent.md` line 167 path reference. (1) Replace `specs/{feature}/` with `specs/{resolved_path}/`, (2) add inline comment on the same line or next line: "// Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})". | **Restrictions:** No code changes, documentation only. Do not modify agent logic. Preserve existing formatting. | **Success:** Line 167 shows specs/{resolved_path}/ with path resolution comment.

---

## Phase 5: GitHub and Commands

### T013: Update PR template spec path placeholder [REQ-D5.1]

Update `.github/pull_request_template.md` to use `specs/{path}` placeholder instead of `specs/{feature}`, with explanatory text showing nested and standalone examples.

**File:** `.github/pull_request_template.md`

**Changes:**

- Replace `specs/{feature}` placeholder with `specs/{path}`
- Add explanatory text: "Spec path (e.g., specs/basecamp/auth for nested, or specs/my-feature for standalone)"
- Preserve existing template structure

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.github/pull_request_template.md` spec path placeholder. (1) Find any line containing `specs/{feature}` or similar spec path placeholder, (2) replace with `specs/{path}`, (3) add explanatory text nearby: "Spec path (e.g., specs/basecamp/auth for nested, or specs/my-feature for standalone)". If no spec path field exists, note "No spec path placeholder found, skip this task". | **Restrictions:** No new files. Preserve existing template sections. If template doesn't have spec path field, document findings. | **Success:** PR template uses specs/{path} with nested/standalone examples, or task documents that no placeholder exists.

---

### T014: Update issue templates [REQ-D5.2]

Update `.github/ISSUE_TEMPLATE/*.md` files to use `specs/{path}` placeholder instead of `specs/{feature}`, with explanatory text showing nested and standalone examples.

**File:** `.github/ISSUE_TEMPLATE/*.md` (all issue template files)

**Changes:**

- Scan all issue template files for `specs/{feature}` or similar spec path references
- Replace with `specs/{path}`
- Add explanatory text: "Spec path (e.g., specs/basecamp/auth or specs/my-feature)"
- Document which templates were updated

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update issue templates in `.github/ISSUE_TEMPLATE/` for nested paths. (1) List all .md files in `.github/ISSUE_TEMPLATE/`, (2) for each file, search for `specs/{feature}` or similar spec path references, (3) replace with `specs/{path}`, (4) add explanatory text: "Spec path (e.g., specs/basecamp/auth or specs/my-feature)", (5) document which files were modified (may be none if no spec references). | **Restrictions:** No new files. Preserve existing template structure. Only modify spec path references. | **Success:** Issue templates use specs/{path} with examples, or task documents that no spec references exist in templates.

---

### T015: Update reconcile command documentation [REQ-D8.1, REQ-D8.2]

Update `.claude/commands/reconcile.md` to document project-qualified paths (e.g., `basecamp/auth`) and reference the centralized path resolver.

**File:** `.claude/commands/reconcile.md`

**Changes:**

- Add usage examples with project-qualified paths: `/reconcile basecamp/auth`
- Add text: "Path can be a standalone feature (e.g., 'my-feature') or a nested feature (e.g., 'basecamp/auth')"
- Add "Path Resolution" note: "Path resolution handled by spec-path-resolver.cjs (supports nested and standalone)"
- Place note in "Technical Details" or "Implementation" section

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/commands/reconcile.md` to document nested path support. (1) In the Usage section, add example: `/reconcile basecamp/auth` (nested), `/reconcile my-feature` (standalone), (2) add explanatory text: "Path can be a standalone feature (e.g., 'my-feature') or a nested feature (e.g., 'basecamp/auth'). The centralized path resolver handles both formats.", (3) add section "## Path Resolution" or note in "Technical Details": "Path resolution handled by spec-path-resolver.cjs (supports nested and standalone)". | **Restrictions:** No code changes, documentation only. Preserve existing command structure. No new files. | **Success:** reconcile.md documents project-qualified paths with examples and resolver reference.

---

### T016: Update start command branch naming docs [REQ-D8.3, REQ-D8.4]

Update `.claude/commands/start.md` to document branch naming for nested specs and the mapping between branch names and spec directory paths.

**File:** `.claude/commands/start.md`

**Changes:**

- Add section "## Branch Naming for Nested Specs"
- Document: "For nested specs like specs/basecamp/auth/, create branch: design-basecamp-auth"
- Add text: "CI workflow maps branch name to nested directory automatically"
- Add mapping table:
  - `design-basecamp-auth` -> `specs/basecamp/auth/`
  - `design-my-feature` -> `specs/my-feature/`
- Add text: "Branch names use dash-separated format; CI workflow resolves to directory structure"

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/commands/start.md` to document nested branch naming. (1) Add section "## Branch Naming for Nested Specs" after the main usage section, (2) add text: "For nested specs like specs/basecamp/auth/, create branch: design-basecamp-auth. CI workflow maps branch name to nested directory automatically.", (3) add subsection "### Branch Name Mapping" with markdown table: columns "Branch Name" and "Resolved Spec Path", rows: "design-basecamp-auth" → "specs/basecamp/auth/", "design-my-feature" → "specs/my-feature/", (4) add text: "Branch names use dash-separated format; CI workflow resolves to directory structure". | **Restrictions:** No code changes, documentation only. Preserve existing command structure. No new files. | **Success:** start.md documents branch naming for nested specs with mapping table.

---

## Phase 6: Infrastructure

### T017: Rewrite specs/README.md for directory-based + nested hierarchy [REQ-D6.1, REQ-D6.2, REQ-D6.3, REQ-D6.4]

Completely rewrite `specs/README.md` to document the directory-based spec format (not single-file) and explain the nested hierarchy with PROJECT, FEATURE, and STANDALONE levels.

**File:** `specs/README.md`

**Changes:**

- Replace entire file content with new structure:
  1. Overview: Directory-based specs, optional nested hierarchy
  2. Spec Directory Structure: Required files per level
  3. Nested Hierarchy: PROJECT and FEATURE levels explained
  4. Standalone Specs: Flat spec format
  5. Path Resolution: Reference to spec-path-resolver.cjs
  6. Required Files Table: PROJECT/FEATURE/STANDALONE with required files
  7. Finding Specs: Navigation examples (ls specs/basecamp/, cat specs/basecamp/project.md, find specs -name 'meta.yaml')
  8. Backward Compatibility: Existing standalone specs remain valid, new specs can choose format

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Rewrite `specs/README.md` for directory-based specs and nested hierarchy. Create new content with 8 sections: (1) ## Overview: Directory-based specs (not single-file), optional nested hierarchy for organizing features by project, (2) ## Spec Directory Structure: Show ASCII tree for nested and standalone formats, (3) ## Nested Hierarchy: Explain PROJECT level (project.md) and FEATURE level (feature.md), (4) ## Standalone Specs: Explain flat format (no hierarchy), (5) ## Path Resolution: Reference spec-path-resolver.cjs in .claude/scripts/lib/, (6) ## Required Files: Table with columns "Level", "Required Files". Rows: PROJECT (project.md, requirements.md, meta.yaml), FEATURE (feature.md, requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json), STANDALONE (requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json), (7) ## Finding Specs: Examples: `ls specs/basecamp/`, `cat specs/basecamp/project.md`, `find specs -name 'meta.yaml'`, (8) ## Backward Compatibility: Existing standalone specs remain valid, new specs can choose nested or standalone, all tooling supports both via spec-path-resolver.cjs. | **Restrictions:** Complete file rewrite. Remove all outdated single-file references. Use markdown formatting. No new files. | **Success:** specs/README.md documents directory-based specs, nested hierarchy levels, required files table, navigation examples, and backward compatibility.

---

### T018: Add review-config.yaml nested support comment [REQ-D9.1]

Add an inline comment to `.claude/config/review-config.yaml` next to `include_specs: true` noting that nested directories are supported.

**File:** `.claude/config/review-config.yaml`

**Changes:**

- Find line containing `include_specs: true`
- Add inline comment: `# Supports nested specs (specs/project/feature/) and standalone (specs/feature/)`
- No functional change, documentation only

**\_Prompt:**
**Role:** Backend Developer | **Task:** Add nested support comment to `.claude/config/review-config.yaml`. (1) Find the line containing `include_specs: true`, (2) add inline comment: "# Supports nested specs (specs/project/feature/) and standalone (specs/feature/)". If `include_specs` is not present, document findings. | **Restrictions:** No code changes, comment only. No new files. Preserve YAML format. | **Success:** review-config.yaml has comment after include_specs: true documenting nested support, or task notes field doesn't exist.

---

## Task Dependencies

```text
Phase 1 (Template Reconciliation):
  T001 (meta.yaml fields)       ─── independent
  T002 (spec.json hierarchy)    ─── independent
  T003 (meta.yaml hierarchy)    ─── depends on ──→ T001

Phase 2 (CI/CD Workflow):
  T004 (recursive find)         ─── independent
  T005 (level detection)        ─── depends on ──→ T004
  T006 (branch mapping)         ─── depends on ──→ T004
  T007 (PR comment path)        ─── depends on ──→ T006

Phase 3 (Skill Documentation):
  T008 (research skill)         ─── independent
  T009 (preview skill)          ─── independent
  T010 (progress skill)         ─── independent

Phase 4 (Agent Documentation):
  T011 (code-agent.md)          ─── independent
  T012 (ui-agent.md)            ─── independent

Phase 5 (GitHub and Commands):
  T013 (PR template)            ─── independent
  T014 (issue templates)        ─── independent
  T015 (reconcile.md)           ─── independent
  T016 (start.md)               ─── independent

Phase 6 (Infrastructure):
  T017 (specs/README.md)        ─── independent
  T018 (review-config.yaml)     ─── independent
```

**Suggested Implementation Order:** T001, T004, T008, T013, T017

**Note:** These tasks are largely independent across phases. The order above is a suggested sequence, not a strict dependency chain.

**Actual Task Dependencies:**

- T001 -> T003 (template dependency)
- T004 -> T005 (validation depends on discovery)
- T004 -> T006 -> T007 (CI/CD chain)

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] meta.yaml template fields aligned with actual usage: id, status, created, updated, tasks_total, tasks_complete, parent_project, parent_feature (T001-T003)
2. [ ] spec.json template includes parent_project and parent_feature with nested examples (T002)
3. [ ] CI workflow discovers nested specs via recursive find (T004)
4. [ ] CI workflow detects spec level (PROJECT/FEATURE/STANDALONE) and validates required files (T005)
5. [ ] CI workflow maps branch names to nested paths with fallback to flat (T006)
6. [ ] CI PR comments display full nested spec paths (T007)
7. [ ] Research skill uses recursive glob patterns and documents hierarchy search (T008)
8. [ ] Preview and progress skills handle 60-char nested paths (T009-T010)
9. [ ] Agent docs reference spec-path-resolver.cjs for path resolution (T011-T012)
10. [ ] GitHub templates use {path} placeholder with nested/standalone examples (T013-T014)
11. [ ] Command docs show nested path usage and branch naming (T015-T016)
12. [ ] specs/README.md documents directory-based specs, hierarchy levels, and backward compatibility (T017)
13. [ ] review-config.yaml comments nested support (T018)

---
