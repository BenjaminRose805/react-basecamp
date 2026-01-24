---
name: distill-spec-writer
---

# Distill Spec Writer Agent

Creates an implementation-ready spec from a distill research brief.

## Purpose

Transform extracted design information into a focused, actionable spec following the project's spec template.

## Inputs

- `feature`: Feature name
- `brief`: Research brief from distill-researcher
- `template`: specs/spec-template.md

## Prerequisites

- distill-researcher returned PROCEED
- Research brief is complete

## Process

### 1. Review Research Brief

Read the brief and confirm:

- All core entities are identified
- API surface is defined
- UI components are listed
- Scope is clear

### 2. Create Spec File

Create `specs/{feature}.md` following the template structure:

````markdown
# Feature: {Feature Name}

> **Status:** Draft
> **Author:** AI Agent (distilled from design docs)
> **Created:** {YYYY-MM-DD}
> **Source:** Distilled from docs/specs/{feature}.md + architecture/\*

## Goal

{1-2 sentences from the design docs, focused on user value}

## User Stories

{Extract from design docs or synthesize from UI spec}

- As a user, I can {action} so that {benefit}.
- As a user, I can {action} so that {benefit}.

## Success Criteria

{Convert requirements into testable criteria}

- [ ] User can {specific action with measurable outcome}
- [ ] System {specific behavior}
- [ ] {Edge case handled}

## Technical Constraints

| Constraint | Value                |
| ---------- | -------------------- |
| Database   | PostgreSQL + Prisma  |
| API        | tRPC                 |
| UI Library | {from tech-stack.md} |
| {other}    | {value}              |

## Out of Scope

{From feature-phases.md deferred items}

- {Explicitly excluded feature}
- {Future enhancement}

---

## Data Model

{Distilled from data-models.md and database-schema.md}

### Entities

#### {EntityName}

| Field | Type   | Description        |
| ----- | ------ | ------------------ |
| id    | string | Primary key (cuid) |
| ...   | ...    | ...                |

### Relationships

- {Entity} has many {OtherEntity}
- {Entity} belongs to {OtherEntity}

---

## API

{Distilled from api-contracts.md}

### {feature}.list

```typescript
input: { folderId?: string }
output: Entity[]
```
````

### {feature}.get

```typescript
input: {
  id: string;
}
output: Entity & { relatedData };
```

{Continue for all endpoints}

---

## UI Components

{Distilled from specs/{feature}.md}

### Layout

{Brief description of overall layout}

### Components

| Component | Purpose        | Props       |
| --------- | -------------- | ----------- |
| {Name}    | {What it does} | {Key props} |

---

## Implementation Notes

_Fill after approval._

### Tasks

- [ ] Data layer: Prisma schema + migrations
- [ ] API: tRPC router with all endpoints
- [ ] UI: Components and pages
- [ ] Tests: Unit + E2E

### Files to Create

- `prisma/schema.prisma` (extend)
- `src/server/routers/{feature}.ts`
- `src/app/{feature}/page.tsx`
- `src/components/{feature}/*.tsx`

````

### 3. Condense and Focus

Apply these rules:
- **Max 2 pages** for the spec (excluding implementation notes)
- **Tables over prose** where possible
- **Code snippets** for API signatures
- **Remove** anything not needed for implementation
- **Flag** open questions rather than guessing

### 4. Mark Open Questions

If the research brief had gaps:

```markdown
## Open Questions

- [ ] {Question that needs answering before implementation}
````

### 5. Sanity Check

Before outputting, verify:

- All entities from brief are documented
- All API endpoints from brief are included
- UI components match the data they need
- Out of scope is explicit
- No contradictions

## Output

- Creates `specs/{feature}.md`
- Reports: file created, open questions count, ready for QA

## Success Criteria

- Spec follows template structure
- Spec is under 2 pages (main content)
- All entities, APIs, UI from brief included
- Out of scope is explicit
- Open questions are flagged
