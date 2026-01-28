# Requirements: Split /plan into Three Commands

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** split-plan-commands

## Overview

Split the current `/plan` command into three explicit commands: `/design` (conversational spec creation), `/reconcile` (handle code review feedback), and `/research` (exploratory investigation without spec creation). This eliminates the need for mode detection and provides clearer user intent.

---

## Requirement Keywords Reference

This spec uses EARS (Easy Approach to Requirements Syntax) patterns combined with RFC 2119 requirement levels.

### EARS Patterns

| Pattern           | Keyword       | Template                                             |
| ----------------- | ------------- | ---------------------------------------------------- |
| Ubiquitous        | _(none)_      | THE SYSTEM SHALL \<response\>                        |
| Event-driven      | **WHEN**      | WHEN \<trigger\>, THE SYSTEM SHALL \<response\>      |
| State-driven      | **WHILE**     | WHILE \<state\>, THE SYSTEM SHALL \<response\>       |
| Unwanted behavior | **IF...THEN** | IF \<condition\>, THEN THE SYSTEM SHALL \<response\> |
| Optional feature  | **WHERE**     | WHERE \<feature\>, THE SYSTEM SHALL \<response\>     |

### RFC 2119 Requirement Levels

| Keyword                      | Meaning                                      |
| ---------------------------- | -------------------------------------------- |
| **SHALL** / **MUST**         | Absolute requirement                         |
| **SHALL NOT** / **MUST NOT** | Absolute prohibition                         |
| **SHOULD**                   | Recommended (valid exceptions may exist)     |
| **SHOULD NOT**               | Not recommended (valid exceptions may exist) |
| **MAY**                      | Optional                                     |

---

## User Stories

### US1: Create Feature Specifications

**As a** developer, **I want** to run `/design [feature]` to create implementation specifications, **so that** I have clear requirements, design, and tasks before coding.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **REQ-1.1:** THE SYSTEM SHALL provide a `/design` command that creates specifications in `specs/{feature}/` directory.

**Event-driven (triggered by action):**

- **REQ-1.2:** WHEN user runs `/design [feature]`, THE SYSTEM SHALL spawn domain-researcher (Opus), domain-writer (Sonnet), and quality-validator (Haiku) sub-agents in sequence.

- **REQ-1.3:** WHEN `/design` command completes, THE SYSTEM SHALL create three files: `requirements.md`, `design.md`, and `tasks.md` using EARS format.

**State-driven (active during state):**

- **REQ-1.4:** WHILE conversational spec creation is in progress, THE SYSTEM SHALL allow user to provide clarifications and additional context.

**Unwanted behavior (error handling):**

- **REQ-1.5:** IF critical ambiguities are found during research phase, THEN THE SYSTEM SHALL prompt user for clarification before proceeding to write phase.

- **REQ-1.6:** IF specification validation fails, THEN THE SYSTEM SHALL retry domain-writer once with failure details before reporting to user.

**Prohibitions:**

- **REQ-1.7:** THE SYSTEM SHALL NOT execute Read, Grep, Glob, Edit, or Write tools directly from the orchestrator context.

---

### US2: Reconcile Code Review Feedback

**As a** developer, **I want** to run `/reconcile` to analyze and plan fixes for code review feedback, **so that** I can address reviewer comments systematically.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **REQ-2.1:** THE SYSTEM SHALL provide a `/reconcile` command that analyzes code review feedback and creates fix specifications.

**Event-driven (triggered by action):**

- **REQ-2.2:** WHEN user runs `/reconcile` without arguments, THE SYSTEM SHALL detect local git changes using `git diff`.

- **REQ-2.3:** WHEN user runs `/reconcile [PR-number]`, THE SYSTEM SHALL fetch GitHub PR feedback using `gh pr view`.

- **REQ-2.4:** WHEN `/reconcile` command completes, THE SYSTEM SHALL create `specs/pr-{N}-reconciliation/tasks.md` with categorized fix tasks.

**State-driven (active during state):**

- **REQ-2.5:** WHILE analyzing CodeRabbit feedback, THE SYSTEM SHALL categorize issues by severity: critical, major, minor, trivial.

**Unwanted behavior (error handling):**

- **REQ-2.6:** IF no code review feedback is found, THEN THE SYSTEM SHALL report error and suggest checking PR number or local git state.

- **REQ-2.7:** IF GitHub CLI is not installed or authenticated, THEN THE SYSTEM SHALL report error with setup instructions.

**Prohibitions:**

- **REQ-2.8:** THE SYSTEM SHALL NOT implement fixes directly; it SHALL only design and plan the fix tasks.

**Recommendations:**

- **REQ-2.9:** THE SYSTEM SHOULD prioritize critical and major issues over minor and trivial issues in task ordering.

---

### US3: Exploratory Research

**As a** developer, **I want** to run `/research [topic]` to investigate a topic without creating formal specifications, **so that** I can explore ideas and gather information before committing to a design.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **REQ-3.1:** THE SYSTEM SHALL provide a `/research` command that performs exploratory investigation without creating specification files.

**Event-driven (triggered by action):**

- **REQ-3.2:** WHEN user runs `/research [topic]`, THE SYSTEM SHALL spawn domain-researcher sub-agent to investigate the topic.

- **REQ-3.3:** WHEN `/research` command completes, THE SYSTEM SHALL create `research-notes.md` with findings.

**State-driven (active during state):**

- **REQ-3.4:** WHILE research is in progress, THE SYSTEM SHALL support iterative exploration with follow-up questions.

**Optional feature:**

- **REQ-3.5:** THE SYSTEM MAY save research notes to `specs/{topic}/research-notes.md` if user requests persistent storage.

**Prohibitions:**

- **REQ-3.6:** THE SYSTEM SHALL NOT create `requirements.md`, `design.md`, or `tasks.md` files during research mode.

---

### US4: Remove Mode Detection

**As a** system maintainer, **I want** to remove automatic mode detection from `/plan`, **so that** user intent is explicit and command behavior is predictable.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **REQ-4.1:** THE SYSTEM SHALL remove mode detection logic from `/plan` command implementation.

**Event-driven (triggered by action):**

- **REQ-4.2:** WHEN mode detection is removed, THE SYSTEM SHALL deprecate `/plan` command in favor of explicit commands.

**Recommendations:**

- **REQ-4.3:** THE SYSTEM SHOULD update documentation to guide users toward `/design`, `/reconcile`, or `/research` instead of `/plan`.

- **REQ-4.4:** THE SYSTEM MAY preserve `/plan` as an alias to `/design` for backward compatibility during transition period.

---

## Non-Functional Requirements

### NFR-1: Backward Compatibility

THE SYSTEM SHOULD maintain backward compatibility with existing workflows that use `/plan` during a transition period.

### NFR-2: Performance

THE SYSTEM SHALL complete `/design` command execution in approximately 16 minutes (same as current `/plan` performance).

THE SYSTEM SHALL complete `/reconcile` command execution in approximately 8 minutes for typical PR feedback volume.

THE SYSTEM SHALL complete `/research` command execution in approximately 5 minutes for exploratory investigation.

### NFR-3: Documentation

THE SYSTEM SHALL update CLAUDE.md command table with new command mappings.

THE SYSTEM SHALL update command preview displays for each new command.

### NFR-4: Agent Reuse

THE SYSTEM SHOULD reuse existing sub-agent templates (domain-researcher, domain-writer, quality-validator) without modification.

---

## Out of Scope

- Automatic migration of existing `/plan` usage in conversation history
- Integration with external code review tools beyond GitHub CLI
- Real-time collaboration features during spec creation
- Version control for specification files

---

## Dependencies

| Dependency              | Type     | Status |
| ----------------------- | -------- | ------ |
| plan-agent.md           | Internal | Ready  |
| domain-researcher       | Internal | Ready  |
| domain-writer           | Internal | Ready  |
| quality-validator       | Internal | Ready  |
| command-mode-detect.cjs | Internal | Ready  |
| GitHub CLI (gh)         | External | Ready  |
| Git                     | External | Ready  |
| Sub-agent templates     | Internal | Ready  |
| Spec templates          | Internal | Ready  |

---
