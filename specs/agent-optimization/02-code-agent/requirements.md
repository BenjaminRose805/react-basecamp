# Requirements: Code Agent 3-Agent Pattern

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-02

## Overview

Split the monolithic code-agent into three specialized sub-agents (code-researcher, code-writer, code-qa) that operate in isolated context windows. This enables working on longer specs without context overflow while maintaining quality through the research → implement → validate pattern.

---

## User Stories

### US1: Code Researcher Sub-Agent

**As a** code-agent orchestrator, **I want** a dedicated researcher sub-agent, **so that** research activities don't bloat the implementation context.

#### Acceptance Criteria

- **REQ-1.1:** WHEN `/code research [feature]` is invoked, THE SYSTEM SHALL spawn a code-researcher sub-agent.

- **REQ-1.2:** THE code-researcher SHALL search for existing implementations related to the feature.

- **REQ-1.3:** THE code-researcher SHALL identify naming conflicts and pattern violations.

- **REQ-1.4:** THE code-researcher SHALL return a decision: `PROCEED`, `STOP`, or `CLARIFY`.

- **REQ-1.5:** THE code-researcher SHALL return a `context_summary` of max 500 tokens for the writer.

- **REQ-1.6:** THE code-researcher SHALL use the `research` tool profile (Read, Grep, Glob, WebFetch, WebSearch, cclsp, context7).

- **REQ-1.7:** IF conflicts are found, THEN THE code-researcher SHALL return `STOP` with conflict details.

---

### US2: Code Writer Sub-Agent

**As a** code-agent orchestrator, **I want** a dedicated writer sub-agent, **so that** implementation occurs in a fresh context without research noise.

#### Acceptance Criteria

- **REQ-2.1:** WHEN `/code implement [feature]` is invoked (after research), THE SYSTEM SHALL spawn a code-writer sub-agent.

- **REQ-2.2:** THE code-writer SHALL receive only the `context_summary` from research, NOT raw search results.

- **REQ-2.3:** THE code-writer SHALL follow TDD: write tests first, then implementation.

- **REQ-2.4:** THE code-writer SHALL keep functions under 30 lines per project standards.

- **REQ-2.5:** THE code-writer SHALL return a list of files changed and tests written.

- **REQ-2.6:** THE code-writer SHALL use the `writer` tool profile (Read, Write, Edit, Bash, Grep, Glob, cclsp).

- **REQ-2.7:** THE code-writer SHOULD read the spec file if one exists in `specs/`.

- **REQ-2.8:** THE code-writer SHALL NOT perform research activities (use researcher for that).

---

### US3: Code QA Sub-Agent

**As a** code-agent orchestrator, **I want** a dedicated QA sub-agent, **so that** validation occurs in a fresh context focused only on quality checks.

#### Acceptance Criteria

- **REQ-3.1:** WHEN `/code validate [feature]` is invoked (after implementation), THE SYSTEM SHALL spawn a code-qa sub-agent.

- **REQ-3.2:** THE code-qa SHALL run type checking on changed files.

- **REQ-3.3:** THE code-qa SHALL run linting on changed files.

- **REQ-3.4:** THE code-qa SHALL run tests related to changes.

- **REQ-3.5:** THE code-qa SHALL check for security issues (no console.log, no hardcoded secrets).

- **REQ-3.6:** THE code-qa SHALL return `PROCEED` if all checks pass, `STOP` if any fail.

- **REQ-3.7:** THE code-qa SHOULD use model `haiku` to reduce cost (checklist-based work).

- **REQ-3.8:** THE code-qa MAY run checks in parallel (types, lint, tests, security are independent).

---

### US4: Full Code Workflow

**As a** developer, **I want** `/code [feature]` to orchestrate all three sub-agents automatically, **so that** I get the full research → implement → validate flow with context isolation.

#### Acceptance Criteria

- **REQ-4.1:** WHEN `/code [feature]` is invoked without subcommand, THE SYSTEM SHALL run research → implement → validate sequentially.

- **REQ-4.2:** THE orchestrator SHALL pass `context_summary` between phases, NOT full results.

- **REQ-4.3:** IF research returns `STOP`, THEN THE orchestrator SHALL halt and report to user.

- **REQ-4.4:** IF research returns `CLARIFY`, THEN THE orchestrator SHALL prompt user and re-run research.

- **REQ-4.5:** IF validation returns `STOP`, THEN THE orchestrator SHALL re-run writer with failure details (max 2 retries).

- **REQ-4.6:** THE orchestrator SHALL report final status to user with summary of changes.

---

### US5: Backward Compatibility

**As a** developer with existing workflows, **I want** the new code-agent to maintain the same command interface, **so that** my existing usage patterns still work.

#### Acceptance Criteria

- **REQ-5.1:** THE command `/code [feature]` SHALL continue to work as before.

- **REQ-5.2:** THE command `/code research [feature]` SHALL work (research phase only).

- **REQ-5.3:** THE command `/code implement [feature]` SHALL work (implement phase only).

- **REQ-5.4:** THE command `/code validate [feature]` SHALL work (validate phase only).

- **REQ-5.5:** THE SYSTEM SHALL NOT require changes to CLAUDE.md command documentation.

---

## Non-Functional Requirements

### NFR-1: Context Efficiency

THE code-agent workflow SHALL use at least 25% less total context compared to monolithic execution by isolating each phase.

### NFR-2: Quality Maintenance

THE code-agent workflow SHALL maintain the same output quality as monolithic execution.

### NFR-3: Error Recovery

IF any sub-agent fails, THEN THE orchestrator SHALL provide clear error messages and recovery options.

### NFR-4: Observability

THE orchestrator SHOULD log sub-agent invocations and results for debugging.

---

## Out of Scope

- Changes to the `/code` command syntax
- Changes to the TDD workflow skill
- Changes to coding standards skill
- Persistent memory between code-agent sessions
- Integration with external CI systems

---

## Dependencies

| Dependency                                         | Type     | Status           |
| -------------------------------------------------- | -------- | ---------------- |
| 01-infrastructure (sub-agent templates, protocols) | Internal | Required first   |
| Existing code-agent.md                             | Internal | Migration target |
| tdd-workflow skill                                 | Internal | Ready            |
| coding-standards skill                             | Internal | Ready            |

---
