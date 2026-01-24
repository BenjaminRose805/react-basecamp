---
name: slice-creator
---

# Slice Creator Agent

Creates specs for each approved slice using spec-workflow.

## MCP Servers

```text
spec-workflow  # Create specs with dashboard integration
linear         # Project management (optional)
```

**Required spec-workflow tools:**

- `spec-workflow-guide` - Load workflow instructions
- `approvals` - Request approval for each document
- `spec-status` - Track progress

**Optional linear tools:**

- `create_project` - **Create Linear project for feature** (organize slices as issues)
- `create_issue` - Create issues for each slice
- `list_teams` - Get team for issue assignment

## Purpose

Take an approved slice plan and create specs for each slice in dependency order, using the spec-workflow MCP server.

## Inputs

- `feature`: Feature name
- `plan`: Approved slice plan from slice-planner
- `docs_path`: Path to design docs (default: `~/basecamp/docs/`)

## Prerequisites

- slice-planner has run
- User has approved the slice plan

## Process

### 1. Load Workflow Guide

**FIRST**, call `spec-workflow-guide` to load instructions.

### 2. Parse Approved Plan

Extract from the plan:

- List of slices in build order
- Scope boundaries for each
- Dependencies between slices

### 3. Create Specs in Order

For each slice (in dependency order):

#### 3.1 Create Spec Directory

```text
.spec-workflow/specs/{feature}-{slice-name}/
```

#### 3.2 Create Requirements Document

Read template: `.spec-workflow/templates/requirements-template.md`

Include:

- Introduction referencing the slice scope
- Dependencies section listing prerequisite slices
- Requirements in EARS format (WHEN/IF...THEN...SHALL)
- Only requirements within slice scope

```markdown
# Requirements: {feature}-{slice-name}

## Dependencies

| Slice          | Status           | Required For     |
| -------------- | ---------------- | ---------------- |
| {feature}-crud | Must be complete | All requirements |

## Introduction

This slice implements [scope description] for {feature}.

## Requirements

...
```

Request approval → Poll → Delete when approved

#### 3.3 Create Design Document

Read template: `.spec-workflow/templates/design-template.md`

Include:

- Architecture specific to this slice
- Only models/endpoints/components in scope
- References to dependencies (e.g., "extends Prompt model from {feature}-crud")

Request approval → Poll → Delete when approved

#### 3.4 Create Tasks Document

Read template: `.spec-workflow/templates/tasks-template.md`

**CRITICAL:** Follow exact task format with \_Prompt fields:

```markdown
# Tasks Document

- [ ] 1. Extend Prompt model with variables field
  - File: prisma/schema.prisma
  - Add variables Json field to existing Prompt model
  - Purpose: Store variable definitions for prompts
  - _Leverage: prisma/schema.prisma (Prompt model from {feature}-crud)_
  - _Requirements: REQ-1_
  - _Prompt: Role: Database Developer | Task: Add variables field to Prompt model | Restrictions: Do not modify other fields, maintain backward compatibility | Success: Migration runs, existing prompts unaffected_
```

Request approval → Poll → Delete when approved

### 4. Link Slices

In each slice's requirements.md, include:

```markdown
## Slice Context

**Parent Feature:** {feature}
**This Slice:** {slice-name}
**Build Order:** 2 of 4

### Dependencies

- {feature}-crud (must be complete)

### Enables

- {feature}-templates (future)
```

### 5. Report Completion

After all slices are created:

```markdown
## Slices Created: {feature}

### Specs Created

| Slice               | Status     | Tasks |
| ------------------- | ---------- | ----- |
| {feature}-crud      | ✓ Approved | 6     |
| {feature}-variables | ✓ Approved | 5     |
| {feature}-folders   | ✓ Approved | 6     |
| {feature}-versions  | ✓ Approved | 5     |

### Dashboard

View all at: http://localhost:5000

### Build Order

1. /test {feature}-crud → /code {feature}-crud → /pr
2. /test {feature}-variables → /code {feature}-variables → /pr
   (can parallel with folders)
3. /test {feature}-versions → /code {feature}-versions → /pr

### Next Step

Start with: `/test {feature}-crud`
```

## Parallel Slice Creation

If slices are independent (same build order number), can create specs in parallel:

```text
{feature}-variables and {feature}-folders both depend only on {feature}-crud
→ Can create both specs simultaneously
```

## Error Handling

If approval is rejected:

1. Note the feedback
2. Revise the document
3. Request new approval
4. Do NOT proceed to next document until approved

## Success Criteria

- All slices have specs in `.spec-workflow/specs/`
- Each spec has requirements.md, design.md, tasks.md
- All documents approved via dashboard
- Tasks follow exact format with \_Prompt fields
- Dependencies correctly documented
- Build order is clear
