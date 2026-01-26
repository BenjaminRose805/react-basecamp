# Requirements: MCP Server Replacements

> **Status:** Implemented
> **Created:** 2026-01-26
> **Spec ID:** mcp-replacements

## Goal

Reduce MCP server complexity by replacing 3 servers (github, vitest, spec-workflow) that can be fully replicated with CLI tools, file-based workflows, or lightweight scripts. This simplifies the development environment from 8 to 5 MCP servers while maintaining full functionality.

---

## User Stories

### US1: Remove GitHub MCP Server

**As a** developer, **I want** GitHub operations to use the `gh` CLI instead of an MCP server, **so that** I have fewer dependencies and can use the more powerful native CLI.

#### Acceptance Criteria

- **REQ-1.1:** WHEN the github MCP server is removed from `.mcp.json`, THE SYSTEM SHALL continue to function without errors on Claude Code startup.

- **REQ-1.2:** WHEN a user requests a GitHub operation (create PR, list issues, etc.), THE SYSTEM SHALL execute the equivalent `gh` CLI command via Bash tool.

- **REQ-1.3:** THE SYSTEM SHALL document `gh` CLI equivalents in the relevant skill files (`.claude/skills/git-operations/SKILL.md` and `.claude/skills/pr-operations/SKILL.md`).

- **REQ-1.4:** IF the `gh` CLI is not authenticated, THEN THE SYSTEM SHALL display a clear error message with instructions to run `gh auth login`.

---

### US2: Remove Vitest MCP Server

**As a** developer, **I want** test operations to use direct CLI commands instead of an MCP server, **so that** I reduce MCP connection overhead for simple operations.

#### Acceptance Criteria

- **REQ-2.1:** WHEN the vitest MCP server is removed from `.mcp.json`, THE SYSTEM SHALL continue to function without errors on Claude Code startup.

- **REQ-2.2:** WHEN a user requests to list test files, THE SYSTEM SHALL use glob/find commands to discover `*.test.ts` and `*.spec.ts` files.

- **REQ-2.3:** WHEN a user requests to run tests, THE SYSTEM SHALL execute `pnpm test:run [target]` via Bash tool.

- **REQ-2.4:** WHEN a user requests test coverage analysis, THE SYSTEM SHALL execute `pnpm test:coverage [target]` via Bash tool.

- **REQ-2.5:** WHERE AI-friendly JSON output is needed, THE SYSTEM SHALL provide a wrapper script that parses vitest output into structured format.

---

### US3: Document Conditional MCP Servers

**As a** developer, **I want** clear documentation on which MCP servers to keep per-project, **so that** I can make informed decisions about my MCP configuration.

#### Acceptance Criteria

- **REQ-3.1:** THE SYSTEM SHALL document criteria for keeping/removing each conditional MCP server (next-devtools, context7, shadcn).

- **REQ-3.2:** THE SYSTEM SHALL provide alternative approaches for each conditional server's functionality.

- **REQ-3.3:** THE SYSTEM SHALL identify which MCP servers are essential and cannot be replaced (cclsp, playwright).

---

### US4: Remove Spec-Workflow MCP Server

**As a** developer, **I want** spec management to use file-based workflows instead of an MCP server, **so that** I reduce dependencies and use simpler file-based spec tracking.

#### Acceptance Criteria

- **REQ-4.1:** WHEN the spec-workflow MCP server is removed from `.mcp.json`, THE SYSTEM SHALL continue to function without errors on Claude Code startup.

- **REQ-4.2:** THE SYSTEM SHALL store specs in `specs/{feature}/` directory with requirements.md, design.md, and tasks.md files.

- **REQ-4.3:** THE SYSTEM SHALL document the file-based spec workflow in `.claude/skills/research/SKILL.md` as replacement for the dashboard.

- **REQ-4.4:** WHERE spec approval is needed, THE SYSTEM SHALL use a status field in requirements.md (Draft → Approved → Implemented).

---

### US5: Maintain Rollback Capability

**As a** developer, **I want** the ability to rollback MCP changes, **so that** I can recover if replacements don't work as expected.

#### Acceptance Criteria

- **REQ-5.1:** WHEN MCP configuration is modified, THE SYSTEM SHALL preserve a backup of the original `.mcp.json` as `.mcp.json.backup` in the same directory.

- **REQ-5.2:** THE SYSTEM SHALL document the rollback procedure in the spec.

- **REQ-5.3:** IF a replacement approach fails, THEN THE SYSTEM SHALL provide clear instructions to restore original functionality.

---

## Success Criteria

- [x] `.mcp.json` reduced from 8 to 5 MCP servers
- [x] Claude Code starts without MCP errors
- [x] `gh` CLI commands documented in git-operations and pr-operations skills
- [x] Vitest CLI commands documented in qa-checks and tdd-workflow skills
- [x] File-based spec workflow documented in research skill
- [x] Conditional MCP servers guide created
- [x] CLAUDE.md updated with new server configuration
- [x] All validation tests pass (gh CLI, pnpm test, cclsp, playwright)
- [x] Backup file preserved for rollback

---

## Technical Constraints

- Must use `gh` CLI v2.0+ (authenticated)
- Must use pnpm as package manager for test commands
- Node.js 18+ required for any wrapper scripts
- MCP servers removed must have 100% CLI equivalent functionality
- Essential servers (cclsp, playwright) cannot be replaced

---

## Non-Functional Requirements

### NFR-1: No Functionality Loss

THE SYSTEM SHALL maintain 100% of existing capabilities through CLI equivalents or scripts.

### NFR-2: Startup Performance

WHEN Claude Code starts, THE SYSTEM SHALL initialize faster with fewer MCP connections (target: 3 fewer servers = ~3-6 seconds faster startup).

### NFR-3: Documentation Completeness

THE SYSTEM SHALL provide comprehensive CLI command reference covering all removed MCP tool functionality.

---

## Out of Scope

- Replacing cclsp (essential for semantic code intelligence)
- Replacing playwright (essential for browser automation)
- Modifying the MCP protocol or infrastructure
- Changes to the hook system
- Removing MCP servers from other projects (e.g., orchestrator-dashboard)

---

## Dependencies

| Dependency  | Type            | Status                              |
| ----------- | --------------- | ----------------------------------- |
| `gh` CLI    | External tool   | Must be installed and authenticated |
| Node.js 18+ | Runtime         | Required for wrapper scripts        |
| pnpm        | Package manager | Required for test commands          |

---
