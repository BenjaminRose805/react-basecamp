# Context Loading Optimization Requirements

## Overview

Reduce token consumption in Claude Code sessions from ~47,000 to <15,000 tokens per command by implementing intelligent context loading that only loads rules and documentation needed for specific commands.

## Goals

- **Primary**: Reduce token consumption by 68% (47K → 15K tokens per command)
- **Secondary**: Eliminate redundant context injection across hooks
- **Tertiary**: Maintain zero functionality loss during optimization

## User Stories

### US1: Minimal Base Context

**WHILE** a Claude Code session starts
**WHEN** no command has been executed yet
**THEN** the system **SHALL** load only core CLAUDE.md content
**AND** the system **SHALL NOT** load any rule files
**AND** the total token count **SHALL** be less than 5,000 tokens

**Acceptance Criteria:**

- Session start loads <5,000 tokens of context
- Core CLAUDE.md includes: commands overview, agent list, tech stack, project structure
- No rule files loaded until command execution
- All functionality remains accessible through commands

### US2: Sub-Agent Rule Loading

**WHILE** executing a command (/plan, /implement, /ship)
**WHEN** the orchestrator spawns sub-agents for execution
**THEN** the system **SHALL** inject role-specific rules into sub-agent prompts
**AND** the orchestrator **SHALL** load only agents.md (~2,700 tokens)
**AND** the total token count for orchestrator **SHALL** be less than 6,000 tokens

**Acceptance Criteria:**

- Orchestrators load: agents.md only (~2,700 tokens)
- Sub-agents get role-specific rules injected in Task prompt:
  - code-researcher, code-writer: patterns.md, coding-style.md (~3,200 tokens)
  - ui-researcher, ui-builder: patterns.md, coding-style.md, frontend-patterns (~3,500 tokens)
  - plan-researcher, plan-writer: methodology.md (~2,500 tokens)
  - quality-validator, quality-checker: testing.md (~1,500 tokens)
  - git-executor: git-workflow.md (~1,000 tokens)
  - security-scanner: security.md (~1,800 tokens)
  - pr-reviewer: git-workflow.md, security.md (~2,800 tokens)
- Rules loaded only when sub-agent is spawned, not at orchestrator level
- /start, /guide, /mode load no additional rules (0 tokens)

### US3: Eliminated Hook Overhead

**WHILE** hooks execute during session lifecycle
**WHEN** context is injected via stdout
**THEN** the system **SHALL** inject NOTHING to stdout by default
**AND** the system **SHALL** query git status on demand via Bash
**AND** the system **SHALL** read CONTEXT.md and TODO.md on demand via Read
**AND** the total hook overhead **SHALL** be 0 tokens per prompt

**Acceptance Criteria:**

- user-prompt-submit.cjs outputs nothing to stdout (0 tokens)
- Git status queried via Bash when needed, not injected
- CONTEXT.md read via Read tool when needed, not injected
- TODO.md read via Read tool when needed, not injected
- Total hook injection per prompt = 0 tokens

### US4: Compressed CLAUDE.md

**WHILE** maintaining CLAUDE.md as the primary documentation
**WHEN** content duplicates information in rule files
**THEN** the system **SHALL** remove the duplication from CLAUDE.md
**AND** the system **SHALL** reference rule bundles instead
**AND** the CLAUDE.md token count **SHALL** be reduced to ~3,000 tokens

**Acceptance Criteria:**

- CLAUDE.md reduced from ~8,600 to ~3,000 tokens (65% reduction)
- Removed sections: TDD details, model selection tables, commit formats, code quality limits
- Retained sections: commands, agent overview, tech stack, MCP servers, file structure
- References to rule bundles added with clear loading behavior
- All removed content remains accessible via command-specific rule bundles

## Non-Functional Requirements

### NFR1: Token Budget Compliance

**Target Token Allocation:**

| Context Layer                          | Current    | Target             | Reduction |
| -------------------------------------- | ---------- | ------------------ | --------- |
| Base (CLAUDE.md)                       | 8,600      | 3,000              | 65%       |
| Rules (orchestrator)                   | 13,000     | 2,700\*            | 79%       |
| Rules (sub-agents)                     | 0          | 2,000-4,000\*\*    | N/A       |
| Skills (/plan)                         | 12,500     | 12,500             | 0%        |
| Hooks (per prompt)                     | 550        | 0                  | 100%      |
| Sub-agents (per task)                  | 12,000     | 12,000             | 0%        |
| **Session Start Total**                | **21,650** | **3,000**          | **86%**   |
| **Orchestrator Total**                 | **23,150** | **5,700\*\*\***    | **75%**   |
| **/plan Total (with sub-agents)**      | **47,150** | **23,700\*\*\*\*** | **50%**   |
| **/implement Total (with sub-agents)** | **47,650** | **27,200\*\*\*\*** | **43%**   |
| **/ship Total (with sub-agents)**      | **46,650** | **23,700\*\*\*\*** | **49%**   |

\*Orchestrators load agents.md only (2,700 tokens)
\*\*Sub-agents get role-specific rules injected when spawned
\*\*\*CLAUDE.md (3,000) + agents.md (2,700)
\*\*\*\*Includes orchestrator + sub-agent rule injections

### NFR2: Performance

- Rule bundle loading via hooks must complete in <100ms
- No measurable latency impact on command execution
- File I/O operations cached where possible

### NFR3: Maintainability

- Rule bundles auto-generated from source rules (no manual duplication)
- Clear documentation on which commands load which rules
- Validation script to verify token counts after changes

### NFR4: Compatibility

- No changes to user-facing command syntax
- No changes to agent behavior or capabilities
- Backwards compatible with existing specs and workflows

## Out of Scope

- Optimizing skill file sizes (kept for future work)
- Compressing sub-agent templates (kept for future work)
- Dynamic rule loading based on context window usage (future enhancement)
- Intelligent caching of rules across sessions (future enhancement)

## Success Metrics

| Metric                    | Target  | Measurement                               |
| ------------------------- | ------- | ----------------------------------------- |
| Session start tokens      | <5,000  | Count tokens in session-start hook output |
| /plan command tokens      | <20,000 | Base + rules + skills                     |
| /implement command tokens | <24,000 | Base + rules + skills                     |
| /ship command tokens      | <20,000 | Base + rules + skills                     |
| Hook injection per prompt | 0       | Count tokens in user-prompt-submit output |
| Zero functionality loss   | 100%    | All existing commands and features work   |

## Risks and Mitigations

| Risk                               | Impact | Mitigation                                    |
| ---------------------------------- | ------ | --------------------------------------------- |
| Missing rules for command          | High   | Comprehensive mapping table, validation tests |
| CLAUDE.md becomes too sparse       | Medium | User testing, incremental reduction           |
| Hook loading fails silently        | High   | Error handling, fallback to session start     |
| Token count measurement inaccurate | Medium | Use Claude's tokenizer API for validation     |
| Rule bundle drift from source      | Medium | Auto-generation script with CI checks         |

## Dependencies

- Existing hook system (.claude/scripts/hooks/)
- settings.json hook configuration
- Current CLAUDE.md structure
- Rule files in .claude/rules/

## Constraints

- Must maintain all current functionality
- Cannot break existing command workflows
- Must be testable without full Claude Code session
- Changes must be reversible if issues found
