# Requirements: Sub-Agent Infrastructure

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-01

## Overview

Establish the foundational infrastructure for sub-agent delegation, including templates, handoff protocols, and orchestration patterns. This enables all subsequent agent optimizations to work consistently.

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

### US1: Sub-Agent Templates

**As a** developer creating new agents, **I want** standardized sub-agent templates, **so that** all sub-agents follow consistent patterns and produce compatible outputs.

#### Acceptance Criteria

- **REQ-1.1:** THE SYSTEM SHALL provide a researcher sub-agent template in `.claude/sub-agents/templates/researcher.md`.

- **REQ-1.2:** THE SYSTEM SHALL provide a writer sub-agent template in `.claude/sub-agents/templates/writer.md`.

- **REQ-1.3:** THE SYSTEM SHALL provide a validator sub-agent template in `.claude/sub-agents/templates/validator.md`.

- **REQ-1.4:** THE SYSTEM SHALL provide a parallel-executor template in `.claude/sub-agents/templates/parallel-executor.md`.

- **REQ-1.5:** Each template SHALL define: role, allowed tools, input format, output format, and behavior rules.

- **REQ-1.6:** Templates SHOULD include examples of proper tool usage and output formatting.

---

### US2: Handoff Protocol

**As an** orchestrating agent, **I want** a structured handoff protocol, **so that** sub-agents receive minimal but sufficient context and return structured results.

#### Acceptance Criteria

- **REQ-2.1:** THE SYSTEM SHALL define a JSON schema for sub-agent requests in `.claude/sub-agents/protocols/handoff.md`.

- **REQ-2.2:** THE SYSTEM SHALL define a JSON schema for sub-agent responses in `.claude/sub-agents/protocols/handoff.md`.

- **REQ-2.3:** WHEN a sub-agent completes, THE SYSTEM SHALL return a `context_summary` field containing compacted findings (max 500 tokens).

- **REQ-2.4:** THE SYSTEM SHALL support three decision values: `PROCEED`, `STOP`, `CLARIFY`.

- **REQ-2.5:** IF a sub-agent returns `STOP`, THEN the orchestrator SHALL halt the workflow and report to the user.

- **REQ-2.6:** IF a sub-agent returns `CLARIFY`, THEN the orchestrator SHALL prompt the user for additional information.

- **REQ-2.7:** The handoff protocol SHOULD include a `tokens_used` field for context tracking.

---

### US3: Tool Permission Profiles

**As a** security-conscious developer, **I want** defined tool permission profiles for each sub-agent role, **so that** sub-agents only have access to tools they need.

#### Acceptance Criteria

- **REQ-3.1:** THE SYSTEM SHALL define a `read-only` profile with tools: Read, Grep, Glob, mcp**cclsp**\*.

- **REQ-3.2:** THE SYSTEM SHALL define a `research` profile with tools: Read, Grep, Glob, WebFetch, WebSearch, mcp**cclsp**_, mcp**context7**_.

- **REQ-3.3:** THE SYSTEM SHALL define a `writer` profile with tools: Read, Write, Edit, Bash, Grep, Glob, mcp**cclsp**\*.

- **REQ-3.4:** THE SYSTEM SHALL define a `full-access` profile with all tools including Task (for sub-agent spawning).

- **REQ-3.5:** Profiles SHALL be documented in `.claude/sub-agents/profiles/`.

- **REQ-3.6:** THE SYSTEM SHALL NOT grant sub-agents tools beyond their defined profile.

---

### US4: Orchestration Patterns

**As an** agent developer, **I want** documented orchestration patterns, **so that** I can implement sequential and parallel sub-agent workflows.

#### Acceptance Criteria

- **REQ-4.1:** THE SYSTEM SHALL document a sequential chain pattern (researcher → writer → validator).

- **REQ-4.2:** THE SYSTEM SHALL document a parallel executor pattern (multiple sub-agents concurrently).

- **REQ-4.3:** THE SYSTEM SHALL document a conditional branch pattern (different sub-agents based on analysis).

- **REQ-4.4:** Orchestration patterns SHALL be documented in `.claude/sub-agents/protocols/orchestration.md`.

- **REQ-4.5:** Each pattern SHALL include pseudocode examples for implementation.

- **REQ-4.6:** THE SYSTEM SHOULD provide a result aggregation strategy for parallel execution.

---

### US5: Sub-Agent Invocation

**As an** orchestrating agent, **I want** to invoke sub-agents using the Task tool, **so that** each sub-agent runs in an isolated context window.

#### Acceptance Criteria

- **REQ-5.1:** WHEN invoking a sub-agent, THE SYSTEM SHALL use the Task tool with appropriate `subagent_type`.

- **REQ-5.2:** THE SYSTEM SHALL pass the handoff request as the Task prompt.

- **REQ-5.3:** THE SYSTEM SHALL specify `allowed_tools` based on the sub-agent's permission profile.

- **REQ-5.4:** THE SYSTEM SHOULD use `model: "haiku"` for validator sub-agents to reduce cost.

- **REQ-5.5:** THE SYSTEM MAY use `run_in_background: true` for parallel sub-agent execution.

- **REQ-5.6:** THE SYSTEM SHALL NOT pass raw context history to sub-agents; only the compacted handoff.

---

## Non-Functional Requirements

### NFR-1: Context Efficiency

THE SYSTEM SHALL reduce context usage by at least 20% compared to monolithic agent execution through context isolation.

### NFR-2: Backward Compatibility

THE SYSTEM SHALL maintain compatibility with existing agent definitions during migration.

### NFR-3: Documentation

THE SYSTEM SHALL provide comprehensive documentation for creating new sub-agents.

### NFR-4: Performance

WHEN using parallel execution, THE SYSTEM SHOULD achieve at least 2x speedup for independent tasks.

---

## Out of Scope

- Creating a custom MCP server for sub-agent management
- Persistent sub-agent memory across sessions
- Cross-session sub-agent state
- External orchestration frameworks (use built-in Task tool)
- Changes to the Task tool itself

---

## Dependencies

| Dependency                       | Type     | Status |
| -------------------------------- | -------- | ------ |
| Task tool (Claude Code built-in) | Internal | Ready  |
| Existing agent definitions       | Internal | Ready  |
| `.claude/` directory structure   | Internal | Ready  |

---
