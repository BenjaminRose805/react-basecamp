# Requirements: [Feature Name]

> **Status:** Draft
> **Created:** [YYYY-MM-DD]
> **Spec ID:** [feature-id]

## Overview

[1-2 sentences describing what we're building and why]

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

### US1: [Story Title]

**As a** [role], **I want** [action], **so that** [benefit].

#### Acceptance Criteria

**Ubiquitous (always active):**

- **REQ-1.1:** THE SYSTEM SHALL [behavior that is always active].

**Event-driven (triggered by action):**

- **REQ-1.2:** WHEN [trigger event], THE SYSTEM SHALL [response].

**State-driven (active during state):**

- **REQ-1.3:** WHILE [system state], THE SYSTEM SHALL [behavior].

**Unwanted behavior (error handling):**

- **REQ-1.4:** IF [error condition], THEN THE SYSTEM SHALL [recovery action].

**Optional feature:**

- **REQ-1.5:** WHERE [feature is enabled], THE SYSTEM SHALL [behavior].

**Prohibitions:**

- **REQ-1.6:** THE SYSTEM SHALL NOT [prohibited behavior].

**Recommendations:**

- **REQ-1.7:** THE SYSTEM SHOULD [recommended behavior].
- **REQ-1.8:** THE SYSTEM SHOULD NOT [discouraged behavior].

**Optional behavior:**

- **REQ-1.9:** THE SYSTEM MAY [optional behavior].

---

### US2: [Story Title]

**As a** [role], **I want** [action], **so that** [benefit].

#### Acceptance Criteria

- **REQ-2.1:** WHEN [condition], THE SYSTEM SHALL [behavior].

- **REQ-2.2:** THE SYSTEM SHALL NOT [prohibited action].

---

## Non-Functional Requirements

### NFR-1: [Requirement Name]

THE SYSTEM SHALL [non-functional requirement].

### NFR-2: Security

THE SYSTEM SHALL NOT [security violation].
THE SYSTEM SHOULD [security best practice].

### NFR-3: Performance

THE SYSTEM SHOULD [performance target].

---

## Out of Scope

- [Feature that might seem related but isn't included]
- [Explicitly excluded functionality]

---

## Dependencies

| Dependency        | Type                | Status          |
| ----------------- | ------------------- | --------------- |
| [Dependency name] | [Internal/External] | [Ready/Pending] |

---
