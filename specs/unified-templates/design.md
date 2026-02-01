# Design: Unified Templates

> **Status:** Draft
> **Created:** 2026-01-31
> **Spec ID:** unified-templates

## Overview

The unified template system provides 9 template files across 3 locations to standardize command previews, progress displays, error reports, and spec generation. This design consolidates all template patterns into a single, maintainable structure.

---

## Architecture

### Template Locations

```text
.claude/skills/preview/templates/
  ├── command-preview.md    # Command execution previews
  └── error-report.md       # Error reports with recovery

.claude/skills/progress/templates/
  └── stage-progress.md     # Real-time stage progress

specs/templates/
  ├── requirements.md       # Trimmed
  ├── design.md            # Trimmed
  ├── tasks.md             # Trimmed
  ├── summary.md           # New
  ├── meta.yaml            # New
  └── spec.json            # New
```

---

## Component Design

### 1. command-preview.md

Box-drawing layout with variable sections:

- Header: `{{command}}` + `{{description}}`
- CONTEXT: `{{dir}}`, `{{branch}}`, `{{feature}}` (if applicable), `{{gate}}` (if applicable), `{{checkpoint}}` (if applicable)
- STAGES: Numbered list with `{{sub_agent}}` + `{{model}}`
- OUTPUT: File tree structure

User confirmation: After displaying the preview, prompt the user via `AskUserQuestion` with Run/Cancel options before proceeding.

Command-specific extensions:

- /start → PREREQUISITES section
- /design → OUTPUT section
- /research → SCOPE section
- /reconcile → SOURCE section
- /implement → PROGRESS section
- /review → RATE LIMIT section
- /ship → COMMIT PREVIEW + PR PREVIEW sections

Vercel extension for /ship:

- DEPLOYMENT STATUS: `{{preview_status}}`, `{{preview_url}}`, `{{production_status}}`
- CHECKS: CI + Vercel status indicators

### 2. stage-progress.md

Layout sections:

- Command header line
- Current stage detail: `{{sub_agent}}`, `{{model}}`, `{{current_action}}`, `{{elapsed}}`
- ASCII progress bar: `{{percent}}`, `{{stage_name}}`, `{{elapsed}}`
- Stage status list: ✓●○✗⊘ indicators

### 3. error-report.md

Box-drawing ERROR layout:

- Stage identifier: `{{stage_name}}`, `{{sub_agent}}`
- Error details: `{{message}}`, `{{file_line}}`
- Recovery options: Numbered list
- Checkpoint: `{{checkpoint_path}}`
- Resume command: `{{resume_cmd}}`

**Checkpoint fallback:** When checkpoint infrastructure is not available, render checkpoint/resume fields as "N/A - checkpoint support pending" rather than leaving raw variable placeholders.

### 4. requirements.md (Trimmed)

Required sections:

- Header block (title, status, created, spec_id)
- Overview
- User Stories (1 template story with 3 EARS patterns: event-driven, unwanted, ubiquitous)
- Non-Functional Requirements
- Out of Scope
- Dependencies

Cuts: EARS/RFC2119 reference tables, duplicate stories, verbose per-pattern examples.

### 5. design.md (Trimmed)

Required sections:

- Header block (title, status, created, spec_id)
- Overview
- Architecture (current state + target state)
- Component Design (with I/O tables)
- Data Models (interface definitions)
- Data Flow (step diagram)
- Error Handling
- Testing Strategy (single combined table)

Cuts: Security Considerations (merge into Error Handling if needed), Alternatives Considered, Dependencies (redundant with requirements.md).

### 6. tasks.md (Trimmed)

Required sections:

- Header block (title, status, created, spec_id)
- Progress summary (total/completed counts)
- Phase sections (compact task format with `_Prompt` per task)
- Task Dependencies (graph)
- Completion Criteria

Cuts: Execution Notes, effort tables, rollback section. Effort inline in phase headers.

### 7. summary.md (New)

Human-readable quick review. Required sections:

- Feature name + status badge
- One-paragraph summary
- Key decisions (bullet list)
- Links to full specs

### 8. meta.yaml (New)

Shared metadata. Required fields:

```yaml
spec_id: "{{id}}"
feature: "{{name}}"
status: "{{status}}"
created: "{{created}}"
updated: "{{updated}}"
author: "{{agent}}"
version: "{{semver}}"
```

### 9. spec.json (New)

Machine-readable for /implement. Required fields:

```json
{
  "name": "{{feature}}",
  "status": "{{status}}",
  "created": "{{date}}",
  "files": {},
  "phases": [],
  "tasks": [],
  "linear": {
    "identifier": "{{linear_id}}",
    "url": "{{linear_url}}"
  }
}
```

**Note:** The `linear` block is optional. Omit entirely when Linear integration is not configured.

---

## Data Flow

```text
/design → reads specs/templates/*.md
       → writes specs/{feature}/ using templates
       → creates summary.md, meta.yaml, spec.json

/implement → reads spec.json for machine-readable task data
          → parses phases[] and tasks[]

/ship → reads spec.json for linear.identifier
     → includes in PR body
```

**Source of truth:** meta.yaml owns shared metadata fields (status, created, feature/name). When domain-writer generates spec.json, overlapping fields MUST match meta.yaml values.

---

## Error Handling

IF template variables are not filled, THEN leave placeholder with `{{variable_name}}` syntax for manual completion.

---

## Testing Strategy

| Test Case                 | Verification Method                                       |
| ------------------------- | --------------------------------------------------------- |
| Required sections present | Checklist validation per template                         |
| No boilerplate filler     | Verify no reference tables, duplicate examples, or filler |
| Variable syntax           | Grep for `{{.*}}` patterns                                |
