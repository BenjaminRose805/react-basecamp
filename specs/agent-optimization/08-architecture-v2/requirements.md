# Requirements: Architecture V2

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-08

## Overview

Comprehensive architectural revision that consolidates agents, expands workflows, simplifies the user interface to 5 core commands, and adds a preview system. This spec supersedes and extends phases 02, 03, 06, and 07 with updated model assignments and new components.

---

## User Stories

### US1: Agent Consolidation

**As a** system architect, **I want** to consolidate overlapping agents, **so that** each agent owns exactly one domain with no gaps or overlaps.

#### Acceptance Criteria

- **REQ-1.1:** THE SYSTEM SHALL have exactly 7 agents: plan-agent, code-agent, ui-agent, docs-agent, eval-agent, check-agent, git-agent.

- **REQ-1.2:** THE git-agent SHALL absorb all pr-agent responsibilities (PR create, review, merge).

- **REQ-1.3:** THE debug-agent SHALL be removed; investigation becomes a workflow phase.

- **REQ-1.4:** THE help-agent SHALL be removed; replaced with built-in `/help` command.

- **REQ-1.5:** THE context-agent SHALL be removed; replaced with built-in `/context` command.

---

### US2: Minimal User Commands

**As a** developer, **I want** minimal commands to memorize, **so that** I can focus on work instead of learning the system.

#### Acceptance Criteria

- **REQ-2.1:** THE SYSTEM SHALL expose 5 core commands: `/plan`, `/build`, `/fix`, `/check`, `/ship`.

- **REQ-2.2:** THE `/build` command SHALL automatically route to appropriate agent(s) based on what is being built.

- **REQ-2.3:** THE `/fix` command SHALL automatically investigate, route to correct agent, and verify.

- **REQ-2.4:** THE SYSTEM MAY expose optional power commands: `/route`, `/research`, `/refactor`, `/git`.

- **REQ-2.5:** THE SYSTEM SHALL NOT require users to know agent names or workflow names.

---

### US3: Preview System

**As a** developer, **I want** to see what will happen before execution, **so that** I can verify the plan and make adjustments.

#### Acceptance Criteria

- **REQ-3.1:** WHEN a command is entered, THE SYSTEM SHALL display a preview before execution.

- **REQ-3.2:** THE preview SHALL show: detected intent, workflow/agent, phases, sub-agents, tasks, tools, models.

- **REQ-3.3:** THE preview SHALL allow: proceed, cancel, or edit scope.

- **REQ-3.4:** THE preview MAY be skipped with a `--yes` flag for automation.

---

### US4: Real-Time Progress

**As a** developer, **I want** to see progress during execution, **so that** I know what's happening and can estimate completion.

#### Acceptance Criteria

- **REQ-4.1:** DURING execution, THE SYSTEM SHALL display current phase and task.

- **REQ-4.2:** THE SYSTEM SHALL show completed tasks with checkmarks and timing.

- **REQ-4.3:** THE SYSTEM SHALL show pending tasks with status indicators.

- **REQ-4.4:** THE SYSTEM SHALL show sub-agent outputs as they complete.

---

### US5: Expanded Workflows

**As a** developer, **I want** workflows for all common work types, **so that** every task has a clear execution path.

#### Acceptance Criteria

- **REQ-5.1:** THE SYSTEM SHALL provide 8 workflows: implement, fix, refactor, ship, review, full-feature, security, research.

- **REQ-5.2:** THE fix workflow SHALL: investigate → route to (code OR ui) → verify.

- **REQ-5.3:** THE refactor workflow SHALL: verify → restructure → verify (behavior unchanged).

- **REQ-5.4:** THE security workflow SHALL: audit → fix → re-audit.

- **REQ-5.5:** THE research workflow SHALL use read-only profile with no file modifications.

---

### US6: Opus Model Utilization

**As a** system architect, **I want** Opus 4.5 used for reasoning tasks, **so that** routing and analysis decisions are high quality.

#### Acceptance Criteria

- **REQ-6.1:** ALL orchestrators SHALL use Opus 4.5 model.

- **REQ-6.2:** ALL researcher sub-agents SHALL use Opus 4.5 model.

- **REQ-6.3:** ALL analyzer sub-agents SHALL use Opus 4.5 model (investigator, pr-reviewer, refactor-analyzer, security-triager).

- **REQ-6.4:** ALL writer/builder sub-agents SHALL use Sonnet model.

- **REQ-6.5:** ALL validator/checker sub-agents SHALL use Haiku model.

---

### US7: Routing Layer

**As a** developer, **I want** automatic routing based on my intent, **so that** I don't have to choose the right agent manually.

#### Acceptance Criteria

- **REQ-7.1:** WHEN `/build [what]` is invoked, THE SYSTEM SHALL analyze [what] and route to appropriate agent(s).

- **REQ-7.2:** THE routing layer SHALL detect: backend (code-agent), frontend (ui-agent), full-stack (implement workflow), docs (docs-agent), eval (eval-agent).

- **REQ-7.3:** WHEN `/fix [what]` is invoked, THE SYSTEM SHALL investigate first, then route based on findings.

- **REQ-7.4:** THE `/route` command SHALL show routing analysis without executing.

---

## Non-Functional Requirements

### NFR-1: Backward Compatibility

Existing commands (`/code`, `/ui`, `/docs`, `/eval`, `/check`, `/git`) SHALL continue to work for power users.

### NFR-2: Context Efficiency

All workflows SHALL maintain 30-40% context savings through sub-agent isolation.

### NFR-3: Performance

Parallel-capable workflows SHALL achieve at least 2x speedup over sequential execution.

### NFR-4: Discoverability

The preview system SHALL teach users about the system through transparency.

---

## Out of Scope

- Changes to sub-agent template format (use existing from 01-infrastructure)
- Changes to handoff protocol (use existing from 05-context-compaction)
- External integrations (CI/CD, notifications)
- Persistent memory between sessions

---

## Dependencies

| Dependency            | Type     | Status   |
| --------------------- | -------- | -------- |
| 01-infrastructure     | Internal | Complete |
| 04-check-agent        | Internal | Complete |
| 05-context-compaction | Internal | Complete |

---
