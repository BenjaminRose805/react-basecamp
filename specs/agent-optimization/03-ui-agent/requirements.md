# Requirements: UI Agent 3-Agent Pattern

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-03

## Overview

Split the monolithic ui-agent into three specialized sub-agents (ui-researcher, ui-builder, ui-qa) that operate in isolated context windows. This mirrors the code-agent pattern for frontend component development.

---

## User Stories

### US1: UI Researcher Sub-Agent

**As a** ui-agent orchestrator, **I want** a dedicated researcher sub-agent, **so that** design exploration doesn't bloat the building context.

#### Acceptance Criteria

- **REQ-1.1:** WHEN `/ui research [component]` is invoked, THE SYSTEM SHALL spawn a ui-researcher sub-agent.

- **REQ-1.2:** THE ui-researcher SHALL check shadcn registry for existing components.

- **REQ-1.3:** THE ui-researcher SHALL check Figma designs if figma MCP is available.

- **REQ-1.4:** THE ui-researcher SHALL search for existing components in `src/components/`.

- **REQ-1.5:** THE ui-researcher SHALL identify design patterns and styling conventions.

- **REQ-1.6:** THE ui-researcher SHALL return `context_summary` of max 500 tokens.

- **REQ-1.7:** THE ui-researcher SHALL use profile: Read, Grep, Glob, cclsp, shadcn, figma, context7.

---

### US2: UI Builder Sub-Agent

**As a** ui-agent orchestrator, **I want** a dedicated builder sub-agent, **so that** component building occurs in a fresh context.

#### Acceptance Criteria

- **REQ-2.1:** WHEN `/ui build [component]` is invoked, THE SYSTEM SHALL spawn a ui-builder sub-agent.

- **REQ-2.2:** THE ui-builder SHALL receive only `context_summary` from research.

- **REQ-2.3:** THE ui-builder SHALL follow TDD for component behavior.

- **REQ-2.4:** THE ui-builder SHALL use shadcn/ui primitives when available.

- **REQ-2.5:** THE ui-builder SHALL follow frontend-patterns skill guidelines.

- **REQ-2.6:** THE ui-builder SHALL return list of files changed.

- **REQ-2.7:** THE ui-builder SHALL use profile: Read, Write, Edit, Bash, Grep, Glob, cclsp, shadcn.

---

### US3: UI QA Sub-Agent

**As a** ui-agent orchestrator, **I want** a dedicated QA sub-agent, **so that** UI validation is thorough and isolated.

#### Acceptance Criteria

- **REQ-3.1:** WHEN `/ui validate [component]` is invoked, THE SYSTEM SHALL spawn a ui-qa sub-agent.

- **REQ-3.2:** THE ui-qa SHALL run type checking on component files.

- **REQ-3.3:** THE ui-qa SHALL run component tests.

- **REQ-3.4:** THE ui-qa SHALL check accessibility patterns.

- **REQ-3.5:** THE ui-qa MAY run visual regression tests via playwright.

- **REQ-3.6:** THE ui-qa SHALL return `PROCEED` or `STOP` with check results.

- **REQ-3.7:** THE ui-qa SHOULD use model `haiku` for cost optimization.

---

### US4: Full UI Workflow

**As a** developer, **I want** `/ui [component]` to orchestrate all three sub-agents, **so that** I get the full research → build → validate flow.

#### Acceptance Criteria

- **REQ-4.1:** WHEN `/ui [component]` is invoked, THE SYSTEM SHALL run research → build → validate.

- **REQ-4.2:** THE orchestrator SHALL pass `context_summary` between phases.

- **REQ-4.3:** IF research returns `STOP`, THEN THE orchestrator SHALL halt and report.

- **REQ-4.4:** IF validation fails, THE orchestrator SHALL retry builder (max 2 retries).

---

## Non-Functional Requirements

### NFR-1: Context Efficiency

THE ui-agent workflow SHALL use at least 20% less context compared to monolithic execution.

### NFR-2: Design Fidelity

THE ui-builder SHALL maintain fidelity to Figma designs when provided.

---

## Out of Scope

- Changes to `/ui` command syntax
- New MCP server integrations
- Visual design tool creation

---

## Dependencies

| Dependency           | Type     | Status           |
| -------------------- | -------- | ---------------- |
| 01-infrastructure    | Internal | Required first   |
| Existing ui-agent.md | Internal | Migration target |
| shadcn MCP           | External | Optional         |
| figma MCP            | External | Optional         |

---
