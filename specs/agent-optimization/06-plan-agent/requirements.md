# Requirements: Plan Agent Optimization

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-06

## Overview

Optimize the plan-agent by parallelizing independent analysis phases and implementing the 3-agent pattern for spec creation. This enables faster planning and better context isolation for complex feature specs.

---

## User Stories

### US1: Parallel Analysis

**As a** plan-agent orchestrator, **I want** independent analyses to run in parallel, **so that** planning completes faster.

#### Acceptance Criteria

- **REQ-1.1:** WHEN `/plan [feature]` is invoked, THE SYSTEM SHALL spawn analyzers in parallel.

- **REQ-1.2:** THE SYSTEM SHALL run requirement-analyzer, dependency-analyzer, and task-decomposer concurrently.

- **REQ-1.3:** THE SYSTEM SHALL aggregate analysis results before spec creation.

- **REQ-1.4:** THE SYSTEM SHALL achieve at least 2x speedup compared to sequential analysis.

---

### US2: Plan Researcher Sub-Agent

**As a** plan-agent orchestrator, **I want** a dedicated researcher for codebase analysis, **so that** research doesn't bloat spec creation context.

#### Acceptance Criteria

- **REQ-2.1:** THE plan-researcher SHALL analyze requirements for EARS format compliance.

- **REQ-2.2:** THE plan-researcher SHALL identify dependencies on existing code.

- **REQ-2.3:** THE plan-researcher SHALL decompose requirements into tasks.

- **REQ-2.4:** THE plan-researcher SHALL return aggregated `context_summary`.

---

### US3: Plan Writer Sub-Agent

**As a** plan-agent orchestrator, **I want** a dedicated writer for spec creation, **so that** specs are created in a focused context.

#### Acceptance Criteria

- **REQ-3.1:** THE plan-writer SHALL receive aggregated analysis summary.

- **REQ-3.2:** THE plan-writer SHALL create requirements.md following EARS format.

- **REQ-3.3:** THE plan-writer SHALL create design.md with architecture decisions.

- **REQ-3.4:** THE plan-writer SHALL create tasks.md with phased implementation plan.

- **REQ-3.5:** THE plan-writer SHALL NOT perform additional research.

---

### US4: Plan QA Sub-Agent

**As a** plan-agent orchestrator, **I want** spec validation before approval, **so that** specs are complete and consistent.

#### Acceptance Criteria

- **REQ-4.1:** THE plan-qa SHALL verify all EARS requirements have acceptance criteria.

- **REQ-4.2:** THE plan-qa SHALL verify design addresses all requirements.

- **REQ-4.3:** THE plan-qa SHALL verify tasks cover the design.

- **REQ-4.4:** THE plan-qa SHALL check for missing dependencies.

- **REQ-4.5:** THE plan-qa SHOULD use model `haiku` for checklist validation.

---

### US5: Subcommand Support

**As a** developer, **I want** to run plan phases individually, **so that** I can iterate on specific aspects.

#### Acceptance Criteria

- **REQ-5.1:** `/plan research [feature]` SHALL run analysis only.

- **REQ-5.2:** `/plan write [feature]` SHALL run spec creation only.

- **REQ-5.3:** `/plan validate [feature]` SHALL run validation only.

- **REQ-5.4:** `/plan [feature]` (no subcommand) SHALL run full flow.

---

## Non-Functional Requirements

### NFR-1: Performance

WHEN running parallel analysis, THE SYSTEM SHALL complete 2x faster than sequential.

### NFR-2: Context Efficiency

THE plan-agent workflow SHALL use at least 20% less context through sub-agent isolation.

### NFR-3: Spec Quality

THE plan-qa SHALL catch at least 90% of spec inconsistencies.

---

## Out of Scope

- Changes to spec file format
- Automated spec approval
- Integration with external project management tools

---

## Dependencies

| Dependency             | Type     | Status           |
| ---------------------- | -------- | ---------------- |
| 01-infrastructure      | Internal | Required         |
| 05-context-compaction  | Internal | Required         |
| Existing plan-agent.md | Internal | Migration target |
| research skill         | Internal | Ready            |

---
