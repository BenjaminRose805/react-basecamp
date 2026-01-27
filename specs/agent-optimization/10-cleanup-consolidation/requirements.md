# Requirements: Cleanup & Consolidation

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-10

## Overview

Post-implementation cleanup to remove stale references, update documentation, and ensure consistency across all files after the agent optimization upgrade (specs 01-09). The codebase currently has 66 uncommitted changes and numerous references to deprecated commands, agents, and MCP servers that need to be cleaned up.

---

## User Stories

### US1: Remove Stale Command References

**As a** developer reading documentation, **I want** all command references to be accurate, **so that** I don't get confused by outdated instructions.

#### Acceptance Criteria

- **REQ-1.1:** THE SYSTEM SHALL NOT contain references to `/context` (replaced by `/mode`).

- **REQ-1.2:** THE SYSTEM SHALL NOT contain references to `/debug` (absorbed into `/plan` reconcile mode).

- **REQ-1.3:** THE SYSTEM SHALL NOT contain references to `/build` outside of archived files (replaced by `/implement`).

- **REQ-1.4:** THE SYSTEM SHALL NOT contain references to `/code`, `/ui`, `/docs`, `/eval` as user-facing commands in primary documentation (absorbed into `/implement` routing).

- **REQ-1.5:** THE SYSTEM SHALL NOT contain references to `/pr` (absorbed into `/ship`).

- **REQ-1.6:** THE SYSTEM SHALL NOT contain references to `/branch` (absorbed into `/start` and `/ship`).

- **REQ-1.7:** THE SYSTEM SHALL NOT contain references to `/verify` (absorbed into `/implement`).

- **REQ-1.8:** THE SYSTEM SHALL NOT contain references to `/check` as a user command (absorbed into `/implement`).

---

### US2: Remove Stale Agent References

**As a** developer, **I want** documentation to only reference active agents, **so that** I understand the current system architecture.

#### Acceptance Criteria

- **REQ-2.1:** THE SYSTEM SHALL NOT contain active references to `debug-agent` outside archived folders.

- **REQ-2.2:** THE SYSTEM SHALL NOT contain active references to `pr-agent` outside archived folders (absorbed into git-agent).

- **REQ-2.3:** THE SYSTEM SHALL NOT contain active references to `help-agent` outside archived folders.

- **REQ-2.4:** THE SYSTEM SHALL NOT contain active references to `context-agent` outside archived folders.

- **REQ-2.5:** THE agents README SHALL accurately describe the current 7-agent architecture.

---

### US3: Remove Stale MCP Server References

**As a** developer setting up the project, **I want** MCP documentation to reflect current requirements, **so that** I don't install deprecated servers.

#### Acceptance Criteria

- **REQ-3.1:** THE SYSTEM SHALL NOT contain references to `spec-workflow` MCP server (replaced with file-based specs).

- **REQ-3.2:** THE SYSTEM SHALL NOT contain references to `vitest` MCP server (replaced with `pnpm test` CLI).

- **REQ-3.3:** THE SYSTEM SHALL NOT contain references to `github` MCP server (replaced with `gh` CLI).

---

### US4: Fix Naming Inconsistencies

**As a** developer, **I want** consistent terminology throughout the codebase, **so that** I can understand relationships between components.

#### Acceptance Criteria

- **REQ-4.1:** ALL sub-agent references SHALL use "validator" naming (not "qa") for consistency with implementation.

- **REQ-4.2:** ALL model assignment documentation SHALL show researchers as Opus (not Sonnet).

- **REQ-4.3:** THE command names in workflows SHALL match the command names in CLAUDE.md.

---

### US5: Remove or Update Stale Files

**As a** system maintainer, **I want** no orphaned or stale files, **so that** the codebase is clean and maintainable.

#### Acceptance Criteria

- **REQ-5.1:** THE `.claude/contexts/` directory SHALL be removed or fully updated (currently entirely stale).

- **REQ-5.2:** ALL deleted command files in git status SHALL be committed or reverted.

- **REQ-5.3:** THE `.claude/agents/README.md` SHALL be rewritten to reflect current architecture.

---

### US6: Update Developer Documentation

**As a** new developer, **I want** accurate documentation, **so that** I can onboard without confusion.

#### Acceptance Criteria

- **REQ-6.1:** THE `docs/DEVELOPER_WORKFLOW.md` SHALL be updated to remove 100+ stale command references.

- **REQ-6.2:** THE `docs/MCP_SETUP.md` SHALL be updated to remove references to deprecated MCP servers.

- **REQ-6.3:** THE `CONTRIBUTING.md` SHALL be updated with current command structure.

- **REQ-6.4:** THE `.github/PULL_REQUEST_TEMPLATE.md` SHALL be updated with current verification commands.

---

## Non-Functional Requirements

### NFR-1: No Functionality Changes

This spec is cleanup-only. No new features, no behavior changes.

### NFR-2: Commit Hygiene

All changes SHALL be committed in logical groupings (not one giant commit).

### NFR-3: Verification

After cleanup, a grep search for deprecated patterns SHALL return zero results outside archived folders.

---

## Out of Scope

- Implementing Spec 09 (Task Tool Binding) - separate spec
- Adding new features or workflows
- Changing agent behavior or model assignments (only documentation)
- Modifying archived files (they serve as historical reference)

---

## Dependencies

| Dependency            | Type     | Status   |
| --------------------- | -------- | -------- |
| 01-infrastructure     | Internal | Complete |
| 04-check-agent        | Internal | Complete |
| 05-context-compaction | Internal | Complete |
| 08-architecture-v2    | Internal | Complete |

---
