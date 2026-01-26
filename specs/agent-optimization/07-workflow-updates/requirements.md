# Requirements: Workflow Updates

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-07

## Overview

Update workflow definitions to leverage the new sub-agent architecture. This includes updating implement, ship, review, and full-feature workflows to use orchestrated agents with parallel execution and context compaction.

---

## User Stories

### US1: Implement Workflow Update

**As a** developer using `/build`, **I want** the implement workflow to use optimized agents, **so that** I benefit from context isolation and parallel checks.

#### Acceptance Criteria

- **REQ-1.1:** THE implement workflow SHALL use the updated code-agent orchestrator.

- **REQ-1.2:** THE implement workflow SHALL use the updated ui-agent orchestrator.

- **REQ-1.3:** THE implement workflow SHALL pass compact context between code and ui phases.

- **REQ-1.4:** THE implement workflow SHALL report aggregated results from both agents.

---

### US2: Ship Workflow Update

**As a** developer using `/ship`, **I want** quality checks to run in parallel, **so that** shipping is faster.

#### Acceptance Criteria

- **REQ-2.1:** THE ship workflow SHALL use the updated check-agent with parallel checks.

- **REQ-2.2:** THE ship workflow SHALL achieve at least 2x speedup in check phase.

- **REQ-2.3:** THE ship workflow SHALL use git-agent for commit operations.

- **REQ-2.4:** THE ship workflow SHALL use pr-agent for PR creation.

- **REQ-2.5:** THE ship workflow SHALL pass minimal context between phases.

---

### US3: Review Workflow Update

**As a** developer reviewing PRs, **I want** parallel check execution, **so that** review verification is faster.

#### Acceptance Criteria

- **REQ-3.1:** THE review workflow SHALL use parallel check-agent.

- **REQ-3.2:** THE review workflow SHALL provide comprehensive check results to pr-agent.

- **REQ-3.3:** THE review workflow SHALL complete verification phase 2x faster.

---

### US4: Full-Feature Workflow

**As a** developer building complete features, **I want** a unified workflow from plan to ship, **so that** I can execute the full development lifecycle efficiently.

#### Acceptance Criteria

- **REQ-4.1:** THE full-feature workflow SHALL orchestrate: plan → implement → ship.

- **REQ-4.2:** THE full-feature workflow SHALL use optimized agents at each stage.

- **REQ-4.3:** THE full-feature workflow SHALL compact context between stages.

- **REQ-4.4:** THE full-feature workflow SHALL provide progress updates at stage transitions.

- **REQ-4.5:** THE full-feature workflow MAY be invoked with `/feature [name]`.

---

### US5: Workflow Documentation

**As a** developer, **I want** updated workflow documentation, **so that** I understand how workflows use sub-agents.

#### Acceptance Criteria

- **REQ-5.1:** THE workflow documentation SHALL include sub-agent flow diagrams.

- **REQ-5.2:** THE workflow documentation SHALL document context handoffs.

- **REQ-5.3:** THE workflow documentation SHALL include performance expectations.

- **REQ-5.4:** CLAUDE.md SHALL reference updated workflow documentation.

---

## Non-Functional Requirements

### NFR-1: Performance

ALL workflows SHALL complete at least 30% faster through parallel execution.

### NFR-2: Context Efficiency

ALL workflows SHALL use at least 25% less context through sub-agent isolation.

### NFR-3: Reliability

Workflow failures SHALL provide clear recovery instructions.

---

## Out of Scope

- New workflow types beyond implement, ship, review, full-feature
- External CI/CD integration
- Workflow persistence across sessions

---

## Dependencies

| Dependency            | Type     | Status   |
| --------------------- | -------- | -------- |
| 01-infrastructure     | Internal | Required |
| 02-code-agent         | Internal | Required |
| 03-ui-agent           | Internal | Required |
| 04-check-agent        | Internal | Required |
| 05-context-compaction | Internal | Required |
| 06-plan-agent         | Internal | Required |

---
