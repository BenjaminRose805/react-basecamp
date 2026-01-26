# Design: UI Agent 3-Agent Pattern

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-03

## Overview

This design transforms the monolithic ui-agent into an orchestrator that delegates to ui-researcher, ui-builder, and ui-qa sub-agents. The pattern mirrors code-agent but is tailored for frontend component development with design system integration.

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  ui-agent (monolithic)                                      │
├─────────────────────────────────────────────────────────────┤
│  RESEARCH: shadcn lookup, Figma check, existing search      │
│  BUILD: Component implementation, styling, tests            │
│  VALIDATE: Types, tests, accessibility                      │
├─────────────────────────────────────────────────────────────┤
│  All phases in single context → bloat on complex components │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```text
┌─────────────────────────────────────────────────────────────┐
│  ui-agent (orchestrator)                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ui-researcher (isolated)                                   │
│  - shadcn registry check                                    │
│  - Figma design lookup                                      │
│  - Existing component search                                │
│  - Returns: context_summary                                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ui-builder (isolated)                                      │
│  - Component implementation                                 │
│  - TDD for behavior                                         │
│  - Styling with design tokens                               │
│  - Returns: files_changed                                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  ui-qa (isolated)                                           │
│  - Type checking                                            │
│  - Component tests                                          │
│  - Accessibility audit                                      │
│  - Returns: PROCEED/STOP                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. UI-Researcher Sub-Agent

**File:** `.claude/sub-agents/ui/ui-researcher.md`

**Profile:** Read, Grep, Glob, cclsp, shadcn, figma, context7

**Responsibilities:**

- Check shadcn registry for existing primitives
- Check Figma for design specs (if figma MCP available)
- Search src/components/ for existing components
- Identify design patterns and tokens
- Return compact context_summary

**Output:**

```json
{
  "decision": "PROCEED",
  "findings": {
    "shadcn_components": ["Button", "Card"],
    "existing_components": ["src/components/ui/button.tsx"],
    "figma_reference": "frame-id-123",
    "design_tokens": ["--primary", "--radius"],
    "patterns": ["Use cn() for className merging"]
  },
  "context_summary": "Use shadcn Button as base. Extend with custom variant..."
}
```

### 2. UI-Builder Sub-Agent

**File:** `.claude/sub-agents/ui/ui-builder.md`

**Profile:** Read, Write, Edit, Bash, Grep, Glob, cclsp, shadcn

**Responsibilities:**

- Read research context_summary
- Use shadcn CLI to add components if needed
- Implement component following patterns
- Write component tests (TDD)
- Apply design tokens from Figma/research

**Output:**

```json
{
  "status": "complete",
  "files_changed": [
    { "path": "src/components/ui/custom-button.tsx", "action": "created" },
    { "path": "src/components/ui/custom-button.test.tsx", "action": "created" }
  ],
  "shadcn_added": ["button"],
  "context_summary": "Created CustomButton extending shadcn Button..."
}
```

### 3. UI-QA Sub-Agent

**File:** `.claude/sub-agents/ui/ui-qa.md`

**Profile:** Read, Grep, Glob, Bash, cclsp, playwright

**Model:** haiku (cost optimization)

**Responsibilities:**

- Run type checking
- Run component tests
- Check accessibility patterns (aria labels, keyboard nav)
- Optional: Visual snapshot with playwright

**Output:**

```json
{
  "decision": "PROCEED",
  "checks": {
    "types": { "passed": true },
    "tests": { "passed": true, "coverage": 90 },
    "accessibility": { "passed": true, "issues": [] }
  }
}
```

---

## Data Flow

```text
User: /ui UserProfileCard
    │
    ▼
ui-researcher:
    ├── shadcn: Found Card, Avatar
    ├── Figma: frame-user-profile
    ├── Existing: None
    └── Return: { context_summary: "Use shadcn Card+Avatar..." }
    │
    ▼
ui-builder:
    ├── Read: context_summary
    ├── Run: npx shadcn add card avatar
    ├── Create: UserProfileCard.tsx
    ├── Create: UserProfileCard.test.tsx
    └── Return: { files_changed: [...] }
    │
    ▼
ui-qa:
    ├── typecheck → PASS
    ├── tests → PASS
    ├── accessibility → PASS
    └── Return: { decision: "PROCEED" }
    │
    ▼
User: Component complete!
```

---

## Dependencies

| Component         | Version  | Purpose              |
| ----------------- | -------- | -------------------- |
| 01-infrastructure | Required | Templates, protocols |
| shadcn MCP        | Optional | Component registry   |
| figma MCP         | Optional | Design specs         |
| playwright MCP    | Optional | Visual testing       |
