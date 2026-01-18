# Feature: Agent-Based Development System

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Implement a structured agent-based development workflow that enforces a research → write → QA pattern for all code changes, ensuring quality through specialized agents and systematic validation.

## User Stories

- As a developer, I can use `/spec`, `/test`, `/code`, `/ui`, and `/docs` commands to delegate work to specialized agents.
- As a developer, I can trust that each writing task goes through research (prevent duplicates), implementation, and QA validation.
- As a developer, I can use `/debug`, `/security`, and `/review` for reactive bug hunting, security audits, and PR reviews.

## Success Criteria

- [x] SC-1: Agent instruction files exist in `.claude/agents/` directory
- [x] SC-2: Each writing command has research, writer, and QA agents
- [x] SC-3: CLAUDE.md documents the agent routing and workflow
- [x] SC-4: Spec template and README exist in `specs/` directory
- [x] SC-5: Workflow supports both full flow and individual phases (e.g., `/code research`)

## Technical Constraints

| Constraint   | Value                                           |
| ------------ | ----------------------------------------------- |
| Agent format | Markdown instruction files in `.claude/agents/` |
| Commands     | Slash commands via Claude Code skills           |
| Workflow     | Three-agent pattern: research → write → QA      |

---

## Requirements

### Agent Structure

- [x] REQ-1: Spec agents (spec-researcher, spec-writer, spec-qa)
- [x] REQ-2: Test agents (test-researcher, test-writer, test-qa)
- [x] REQ-3: Code agents (code-researcher, code-writer, code-qa)
- [x] REQ-4: UI agents (ui-researcher, ui-builder, ui-qa)
- [x] REQ-5: Docs agents (docs-researcher, docs-writer, docs-qa)
- [x] REQ-6: Standalone agents (debugger, security-auditor, pr-reviewer)

### Workflow

- [x] REQ-7: Research phase prevents duplicates and identifies conflicts
- [x] REQ-8: Write phase implements following project patterns
- [x] REQ-9: QA phase validates with type checking, tests, and integration checks
- [x] REQ-10: Each command supports subcommands (research, write, qa)

### Documentation

- [x] REQ-11: CLAUDE.md documents all commands and agent routing
- [x] REQ-12: Agent instructions specify MCP servers to use
- [x] REQ-13: Workflow diagram shows standard development flow
- [x] REQ-14: Failure paths documented with recovery steps

---

## Design

### Agent File Structure

```
.claude/agents/
├── spec-researcher.md
├── spec-writer.md
├── spec-qa.md
├── test-researcher.md
├── test-writer.md
├── test-qa.md
├── code-researcher.md
├── code-writer.md
├── code-qa.md
├── ui-researcher.md
├── ui-builder.md
├── ui-qa.md
├── docs-researcher.md
├── docs-writer.md
├── docs-qa.md
├── debugger.md
├── security-auditor.md
└── pr-reviewer.md
```

### Command Flow

```
/command [feature]           → research → write → qa
/command research [feature]  → research only
/command write [feature]     → write only
/command qa [feature]        → qa only
```

---

## Out of Scope

- Custom MCP server implementation
- Automated agent orchestration (manual command invocation)
- Integration with external CI/CD pipelines
- Agent memory/state persistence between sessions

## Dependencies

- None (foundational feature)

## Enables

- `specs/nextjs-demo-app.md` - First spec created using this workflow
- Future feature development following the established pattern
