# Tasks: Unified Templates

> **Status:** Draft
> **Created:** 2026-01-31
> **Spec ID:** unified-templates

## Progress Summary

- **Total Tasks:** 9
- **Completed:** 9
- **In Progress:** 0
- **Blocked:** 0

---

## Phase 1: Skill Templates (3 tasks, ~2h)

### T001: Create command-preview.md [US1]

Create `.claude/skills/preview/templates/command-preview.md` with box-drawing layout per synthesis 1.1 + 6.2.3. Include CONTEXT, STAGES, OUTPUT sections plus command-specific extensions and Vercel integration for /ship.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create command-preview.md template with all command-specific sections, Vercel extension, and AskUserQuestion confirmation
- **Restrictions:** Must use {{double_brace}} syntax, follow box-drawing layout exactly, no action bar (use AskUserQuestion for Run/Cancel)
- **Success:** File exists with all 7 command extensions + Vercel sections + user confirmation prompt

### T002: Create stage-progress.md [US2]

Create `.claude/skills/progress/templates/stage-progress.md` with progress bar, stage status list using ✓●○✗⊘ indicators per synthesis 1.2.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create stage-progress.md with ASCII progress bar and Unicode status indicators
- **Restrictions:** Must match synthesis 1.2 layout exactly, use correct Unicode: ✓●○✗⊘
- **Success:** File exists with header, detail block, progress bar, status list

### T003: Create error-report.md [US3]

Create `.claude/skills/preview/templates/error-report.md` with ERROR box layout, recovery options, checkpoint path, resume command per synthesis 1.3.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create error-report.md with box-drawing ERROR layout and recovery options
- **Restrictions:** Must include stage/sub-agent ID, error+file:line, numbered recovery options
- **Success:** File exists with all sections from synthesis 1.3

---

## Phase 2: Spec Template Trimming (3 tasks, ~3h)

### T004: Trim requirements.md [US4]

Trim `specs/templates/requirements.md` to required sections only. Keep: header, Overview, single User Story template (3 EARS patterns), NFR, Out of Scope, Dependencies. Cut: EARS/RFC2119 reference tables, duplicate stories, verbose examples.

**\_Prompt:**

- **Role:** Spec editor
- **Task:** Reduce requirements.md to required sections only, removing all boilerplate filler
- **Restrictions:** Must keep EARS format, remove tables/duplicates/examples only
- **Success:** Contains all required sections from design.md component 4, no boilerplate

### T005: Trim design.md [US4]

Trim `specs/templates/design.md` to required sections only. Keep: header, Overview, Architecture, Component Design, Data Models, Data Flow, Error Handling, Testing (condensed to single table). Cut: Security Considerations, Alternatives Considered, Dependencies.

**\_Prompt:**

- **Role:** Spec editor
- **Task:** Reduce design.md to required sections only, removing redundant/filler sections
- **Restrictions:** Must preserve Architecture/Component Design/Data Flow, condense Testing to single table
- **Success:** Contains all required sections from design.md component 5, no boilerplate

### T006: Trim tasks.md [US4]

Trim `specs/templates/tasks.md` to required sections only. Keep: header, Progress summary, Phase sections (compact task format with `_Prompt`), Task Dependencies, Completion Criteria. Cut: Execution Notes, effort tables, rollback section.

**\_Prompt:**

- **Role:** Spec editor
- **Task:** Reduce tasks.md to required sections only with compact task format
- **Restrictions:** Must keep `_Prompt` field per task, remove Execution Notes entirely
- **Success:** Contains all required sections from design.md component 6, no boilerplate

---

## Phase 3: New Spec Files (3 tasks, ~2h)

### T007: Create summary.md [US4]

Create `specs/templates/summary.md` with feature name, status badge, one-paragraph summary, key decisions list, links to full specs.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create summary.md template for human-readable quick review
- **Restrictions:** Include all required sections: name/status/summary/decisions/links
- **Success:** Contains all required sections from design.md component 7

### T008: Create meta.yaml [US4]

Create `specs/templates/meta.yaml` with fields: spec_id, feature, status, created, updated, author, version.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create meta.yaml with shared metadata fields
- **Restrictions:** Must be valid YAML, all 7 fields from design.md component 8
- **Success:** Valid YAML, contains all required fields

### T009: Create spec.json [US4]

Create `specs/templates/spec.json` with fields: name, status, created, files, phases, tasks. Include optional Linear extension: linear.identifier, linear.url.

**\_Prompt:**

- **Role:** Template writer
- **Task:** Create spec.json template for /implement machine parsing
- **Restrictions:** Must be valid JSON, include optional Linear extension per synthesis 6.1.6
- **Success:** Valid JSON, contains all required fields from design.md component 9

---

## Task Dependencies

```
Phase 1: T001, T002, T003 (parallel)
Phase 2: T004, T005, T006 (parallel, independent of Phase 1)
Phase 3: T007, T008, T009 (parallel; T009 weakly depends on T008 for field consistency)
```

---

## Completion Criteria

- ✓ All 9 template files exist at specified paths
- ✓ All templates contain their required sections (per design.md components 1-9)
- ✓ No boilerplate filler: no reference tables, duplicate examples, or unused sections
- ✓ All templates use `{{double_brace}}` variable syntax
