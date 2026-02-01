# Requirements: Unified Templates

> **Status:** Draft
> **Created:** 2026-01-31
> **Spec ID:** unified-templates

## Overview

This specification defines the unified template system for command previews, stage progress displays, error reports, and optimized spec templates. The system provides consistent, structured output across all agent workflows while reducing spec authoring overhead.

---

## User Stories

### US1: Command Preview Display

**As a developer, I want to see an execution preview before any command runs, so that I understand what will happen.**

- **REQ-1.1:** WHEN a command is invoked, THE SYSTEM SHALL display a preview box showing CONTEXT, STAGES, and OUTPUT sections, then prompt the user to confirm (Run) or cancel before proceeding
- **REQ-1.2:** THE SYSTEM SHALL include command-specific sections (PREREQUISITES for /start, OUTPUT for /design, SCOPE for /research, SOURCE for /reconcile, PROGRESS for /implement, RATE LIMIT for /review, COMMIT PREVIEW + PR PREVIEW for /ship)
- **REQ-1.3:** WHERE /ship is running, THE SYSTEM SHALL include DEPLOYMENT STATUS and CHECKS sections showing Vercel integration status

### US2: Stage Progress Display

**As a developer, I want real-time progress during command execution, so that I know what's happening.**

- **REQ-2.1:** WHILE a command is executing, THE SYSTEM SHALL display stage progress with ✓●○✗⊘ indicators
- **REQ-2.2:** THE SYSTEM SHALL show a progress bar with percentage, current stage, and elapsed time

### US3: Error Reporting

**As a developer, I want structured error reports with recovery options, so that I can fix problems quickly.**

- **REQ-3.1:** IF a stage fails, THEN THE SYSTEM SHALL display an error report with stage name, sub-agent, error message, and file:line
- **REQ-3.2:** THE SYSTEM SHALL provide numbered recovery options and a resume command

### US4: Spec Template Optimization

**As a spec author, I want trimmed templates that are concise but complete, so that specs are faster to write.**

- **REQ-4.1:** THE SYSTEM SHALL provide trimmed templates (requirements.md, design.md, tasks.md) containing only their required sections with no boilerplate filler
- **REQ-4.2:** THE SYSTEM SHALL provide new templates (summary.md, meta.yaml, spec.json) containing their required sections
- **REQ-4.3:** WHERE Linear integration is configured, THE SYSTEM SHALL include Linear identifier fields in spec.json

---

## Non-Functional Requirements

- **NFR-1: Template Consistency** - All templates SHALL use `{{double_brace}}` variable syntax
- **NFR-2: No Boilerplate** - Templates SHALL NOT contain reference tables, duplicate examples, or filler sections

---

## Out of Scope

- Checkpoint management implementation
- Sub-agent handoff schema design
- Task parser implementation
- Implementation orchestrator logic
- Migration of existing specs to new template format

---

## Dependencies

- Box-drawing layouts from synthesis.md
- Unicode status indicators: ✓●○✗⊘
- Linear integration schema (linear.identifier, linear.url)
- Vercel deployment status API
