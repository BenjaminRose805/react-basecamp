# Requirements: Context Compaction System

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-05

## Overview

Implement a context compaction system that automatically reduces context size at phase boundaries and provides manual compaction triggers. This complements sub-agent isolation by ensuring handoffs are minimal and orchestrator context stays lean.

---

## User Stories

### US1: Phase Boundary Compaction

**As an** orchestrator, **I want** automatic context compaction between sub-agent phases, **so that** context doesn't accumulate across the workflow.

#### Acceptance Criteria

- **REQ-1.1:** WHEN a sub-agent returns, THE SYSTEM SHALL extract only the `context_summary` for the next phase.

- **REQ-1.2:** THE orchestrator SHALL NOT retain raw sub-agent outputs in its context.

- **REQ-1.3:** THE `context_summary` SHALL be max 500 tokens.

- **REQ-1.4:** THE SYSTEM SHALL preserve essential state (task_id, feature, spec_path).

- **REQ-1.5:** THE SYSTEM SHOULD log compaction events for debugging.

---

### US2: Handoff Compaction Rules

**As a** sub-agent developer, **I want** clear rules for what to include in context_summary, **so that** handoffs are consistently compact.

#### Acceptance Criteria

- **REQ-2.1:** THE context_summary SHALL include actionable findings only.

- **REQ-2.2:** THE context_summary SHALL NOT include search queries or intermediate steps.

- **REQ-2.3:** THE context_summary SHALL NOT include full file contents.

- **REQ-2.4:** THE context_summary SHALL use bullet points for multiple items.

- **REQ-2.5:** THE context_summary SHALL prioritize information needed by the next phase.

---

### US3: Manual Compaction Trigger

**As a** developer in a long session, **I want** to manually trigger context compaction, **so that** I can extend my session without restarting.

#### Acceptance Criteria

- **REQ-3.1:** WHEN the user invokes `/compact`, THE SYSTEM SHALL summarize the conversation.

- **REQ-3.2:** THE compaction SHALL preserve current task state.

- **REQ-3.3:** THE compaction SHALL preserve recent decisions and findings.

- **REQ-3.4:** THE compaction SHOULD reduce context by at least 50%.

---

### US4: Compaction Hooks

**As a** system administrator, **I want** hooks that trigger on compaction events, **so that** I can track context usage patterns.

#### Acceptance Criteria

- **REQ-4.1:** THE SYSTEM SHALL fire a `PreCompact` hook before compaction.

- **REQ-4.2:** THE SYSTEM SHALL fire a `PostCompact` hook after compaction (via existing hooks).

- **REQ-4.3:** Hooks SHALL receive context size before/after compaction.

- **REQ-4.4:** Hooks MAY log compaction events to `.claude/logs/`.

---

### US5: Compaction Suggestions

**As a** developer approaching context limits, **I want** proactive compaction suggestions, **so that** I don't hit limits unexpectedly.

#### Acceptance Criteria

- **REQ-5.1:** WHEN context exceeds 70% capacity, THE SYSTEM SHOULD suggest compaction.

- **REQ-5.2:** WHEN 50+ tool calls have occurred, THE SYSTEM SHOULD suggest compaction.

- **REQ-5.3:** Suggestions SHALL NOT be blocking (user can dismiss).

- **REQ-5.4:** THE SYSTEM SHALL track tool call count via hooks.

---

## Non-Functional Requirements

### NFR-1: Context Savings

THE compaction system SHALL achieve at least 30% context reduction across a typical workflow.

### NFR-2: Information Preservation

THE compaction system SHALL NOT lose critical information needed for task completion.

### NFR-3: Transparency

THE SYSTEM SHALL clearly indicate when compaction occurs and what was preserved.

---

## Out of Scope

- Automatic compaction without user awareness
- Cross-session context persistence
- External context storage systems
- Changes to Claude Code's built-in /compact command

---

## Dependencies

| Dependency                           | Type     | Status   |
| ------------------------------------ | -------- | -------- |
| 01-infrastructure (handoff protocol) | Internal | Required |
| Existing hooks system                | Internal | Ready    |
| suggest-compact.cjs hook             | Internal | Ready    |

---
