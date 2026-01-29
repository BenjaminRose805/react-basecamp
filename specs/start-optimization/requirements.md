# Requirements: /start Command Optimization

> **Status:** Approved
> **Created:** 2026-01-28
> **Spec ID:** start-optimization

## Overview

Optimize the `/start` command and `user-prompt-start.cjs` hook to address 21 identified issues across safety, consistency, DRY, efficiency, and completeness categories. This spec ensures the `/start` command follows established patterns, operates safely with worktrees and git state, and provides a robust foundation for development workflows.

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

### US1: Safe Worktree Management

**As a** developer, **I want** the `/start` command to safely manage git worktrees and branch state, **so that** I don't lose work or create invalid git states.

#### Acceptance Criteria

**SAFETY - S1: Hook Structure Consistency (HIGH)**

- **REQ-S1.1:** THE SYSTEM SHALL NOT create git worktrees from within the `user-prompt-start.cjs` hook.
- **REQ-S1.2:** THE SYSTEM SHALL delegate all git operations to the git-agent via Task tool spawn.
- **REQ-S1.3:** THE HOOK SHALL only inject environment verification context into the agent prompt.

**SAFETY - S2: Branch Existence Validation (HIGH)**

- **REQ-S2.1:** WHEN creating a worktree, THE SYSTEM SHALL check if the target branch already exists.
- **REQ-S2.2:** IF the target branch exists, THEN THE SYSTEM SHALL display an error with branch info and ask the user to choose a different feature name.
- **REQ-S2.3:** THE SYSTEM SHALL validate branch naming follows the pattern `feature/[name]` or `../<repo>--<feature>`.

**SAFETY - S3: Dirty State Protection (HIGH)**

- **REQ-S3.1:** WHEN `/start` is invoked, THE SYSTEM SHALL check for uncommitted changes in the current working directory.
- **REQ-S3.2:** IF uncommitted changes exist, THEN THE SYSTEM SHALL display a warning and block worktree creation.
- **REQ-S3.3:** THE SYSTEM SHALL suggest stashing or committing changes before proceeding.
- **REQ-S3.4:** WHERE `--force` flag is provided, THE SYSTEM MAY bypass dirty state blocking with explicit user confirmation.

**SAFETY - S3b: Critical Dependency Blocking (HIGH)**

- **REQ-S3b.1:** WHEN environment check detects missing critical dependencies, THE SYSTEM SHALL block worktree creation.
- **REQ-S3b.2:** THE SYSTEM SHALL define critical dependencies as: Node.js, package manager (pnpm/npm/yarn), git.
- **REQ-S3b.3:** THE SYSTEM SHALL treat optional tools (Docker, linters) as non-blocking warnings.
- **REQ-S3b.4:** WHERE `--force` flag is provided, THE SYSTEM MAY bypass critical dependency blocking.

**SAFETY - S4: Error Propagation (MEDIUM)**

- **REQ-S4.1:** WHEN state file writes fail, THE SYSTEM SHALL propagate errors to the user.
- **REQ-S4.2:** THE SYSTEM SHALL log all state file operations to `.claude/logs/start-operations.log`.
- **REQ-S4.3:** IF state file write fails, THEN THE SYSTEM SHALL continue with a warning (non-blocking).

**SAFETY - S5: Security Flag Implementation (MEDIUM)**

- **REQ-S5.1:** WHERE `--security` flag is provided, THE SYSTEM SHALL run `pnpm audit` as part of environment checks.
- **REQ-S5.2:** THE SYSTEM SHALL report security vulnerabilities as non-blocking warnings.
- **REQ-S5.3:** THE SYSTEM SHALL save audit results to `start-status.json` under `security_audit` field.

---

### US2: Command Pattern Consistency

**As a** developer, **I want** the `/start` command to follow the same patterns as `/ship`, **so that** the codebase is consistent and maintainable.

#### Acceptance Criteria

**CONSISTENCY - C1: Preview and Agent Delegation (HIGH)**

- **REQ-C1.1:** WHEN `/start` is invoked, THE SYSTEM SHALL display a preview of the execution plan.
- **REQ-C1.2:** THE PREVIEW SHALL show stages, sub-agents, and estimated timing.
- **REQ-C1.3:** THE SYSTEM SHALL wait for user confirmation ([Enter] to proceed, [Esc] to cancel).
- **REQ-C1.4:** THE SYSTEM SHALL spawn sub-agents via Task tool after confirmation.

**CONSISTENCY - C2: Agent Flow Documentation (HIGH)**

- **REQ-C2.1:** THE `git-agent.md` file SHALL document the `/start` flow.
- **REQ-C2.2:** THE FLOW SHALL include a flow diagram showing stages.
- **REQ-C2.3:** THE FLOW SHALL include a sub-agent table with model assignments.
- **REQ-C2.4:** THE DOCUMENTATION SHALL include Task tool code examples.

**CONSISTENCY - C3: Worktree Path Naming (MEDIUM)**

- **REQ-C3.1:** THE SYSTEM SHALL use the naming pattern `../<repo>--<feature>` for worktree paths.
- **REQ-C3.2:** THE SYSTEM SHALL extract `<repo>` from the current directory name.
- **REQ-C3.3:** THE SYSTEM SHALL extract `<feature>` from the branch name (after `feature/` prefix).
- **REQ-C3.4:** THE SYSTEM SHALL validate that the computed path doesn't already exist.

**CONSISTENCY - C4: Flag Parsing (LOW)**

- **REQ-C4.1:** THE SYSTEM SHALL parse flags using a consistent pattern across all hooks.
- **REQ-C4.2:** THE SYSTEM SHALL support boolean flags (`--full`, `--security`, `--force`, `--yes`).
- **REQ-C4.3:** THE SYSTEM SHALL validate flag values and reject unknown flags.

---

### US3: Code Quality and Maintainability

**As a** maintainer, **I want** to eliminate code duplication and improve efficiency, **so that** the codebase is easier to understand and modify.

#### Acceptance Criteria

**DRY - D1: Shared Command Pattern Detection (MEDIUM)**

- **REQ-D1.1:** THE SYSTEM SHALL extract command pattern detection logic to `.claude/scripts/lib/command-utils.cjs`.
- **REQ-D1.2:** THE UTILITY SHALL export `detectCommand(userPrompt)` function.
- **REQ-D1.3:** ALL HOOKS SHALL use the shared `detectCommand()` function.

**DRY - D2: Shared Hook Structure (MEDIUM)**

- **REQ-D2.1:** THE SYSTEM SHALL provide a base hook template in `.claude/scripts/lib/hook-base.cjs`.
- **REQ-D2.2:** THE BASE SHALL include standard structure: read stdin, parse, run, log.
- **REQ-D2.3:** HOOKS SHOULD extend the base template to reduce duplication.

**DRY - D3: Shared Verification Logic (MEDIUM)**

- **REQ-D3.1:** THE SYSTEM SHALL extract shared verification logic to `.claude/scripts/lib/verification-utils.cjs`.
- **REQ-D3.2:** THE UTILITY SHALL export functions used by both `/start` and `/review`.
- **REQ-D3.3:** THE UTILITY SHALL include `runLint()`, `runTypecheck()`, `runTests()`, `runBuild()`.

**DRY - D4: Unified Git Status Formatting (LOW)**

- **REQ-D4.1:** THE SYSTEM SHALL provide a single `getGitStatus()` function in `.claude/scripts/lib/git-utils.cjs`.
- **REQ-D4.2:** THE FUNCTION SHALL accept a `format` parameter (`short`, `long`, `json`).
- **REQ-D4.3:** ALL GIT STATUS OPERATIONS SHALL use this unified function.

**EFFICIENCY - E1: Parallel Execution (MEDIUM)**

- **REQ-E1.1:** WHERE multiple environment checks are independent, THE SYSTEM SHALL execute them in parallel.
- **REQ-E1.2:** THE SYSTEM SHALL use `Promise.all()` for parallel execution of tool checks.
- **REQ-E1.3:** THE SYSTEM SHALL measure and report time savings from parallelization.

**EFFICIENCY - E2: Config Caching (LOW)**

- **REQ-E2.1:** THE SYSTEM SHALL cache config loading results for the duration of hook execution.
- **REQ-E2.2:** THE SYSTEM SHALL avoid redundant `require()` calls for the same config file.

**EFFICIENCY - E3: Package Manager Detection Caching (LOW)**

- **REQ-E3.1:** THE SYSTEM SHALL detect the package manager once per session.
- **REQ-E3.2:** THE SYSTEM SHALL store the result in a module-level variable.
- **REQ-E3.3:** SUBSEQUENT HOOKS SHALL reuse the cached package manager value.

**EFFICIENCY - E4: DNS Timeout for Tool Checks (LOW)**

- **REQ-E4.1:** WHEN checking tool availability via DNS/network, THE SYSTEM SHALL apply a 2-second timeout.
- **REQ-E4.2:** IF the timeout is exceeded, THE SYSTEM SHALL mark the tool as unavailable and continue.

---

### US4: Feature Completeness

**As a** developer, **I want** the `/start` command to provide complete functionality and clear feedback, **so that** I can work efficiently without manual intervention.

#### Acceptance Criteria

**COMPLETENESS - CM1: Start Sub-Agent Documentation (MEDIUM)**

- **REQ-CM1.1:** THE SYSTEM SHALL provide a sub-agent template for start-specific operations.
- **REQ-CM1.2:** THE TEMPLATE SHALL document environment setup, worktree creation, and verification.
- **REQ-CM1.3:** THE `git-agent.md` SHALL reference the start sub-agent in examples.

**COMPLETENESS - CM2: Progress Display (MEDIUM)**

- **REQ-CM2.1:** WHILE `/start` is executing, THE SYSTEM SHALL display real-time progress.
- **REQ-CM2.2:** THE DISPLAY SHALL show current stage, elapsed time, and progress percentage.
- **REQ-CM2.3:** THE DISPLAY SHALL follow the pattern established by `/ship` command.

**COMPLETENESS - CM3: CI Mode Support (LOW)**

- **REQ-CM3.1:** WHERE `--yes` flag is provided, THE SYSTEM SHALL skip all interactive prompts.
- **REQ-CM3.2:** THE SYSTEM SHALL auto-proceed with default choices in CI environments.
- **REQ-CM3.3:** THE SYSTEM SHALL detect CI environments via `CI` environment variable.

**COMPLETENESS - CM4: Schema Validation (LOW)**

- **REQ-CM4.1:** THE SYSTEM SHALL validate `.claude/config/environment.json` against a JSON schema.
- **REQ-CM4.2:** IF validation fails, THEN THE SYSTEM SHALL report specific schema violations.
- **REQ-CM4.3:** THE SCHEMA SHALL be documented in `.claude/schemas/environment.schema.json`.

**COMPLETENESS - CM5: Remove Unused Exports (LOW)**

- **REQ-CM5.1:** THE SYSTEM SHALL NOT export unused functions like `grepFile`.
- **REQ-CM5.2:** THE SYSTEM SHALL audit all library modules for unused exports.
- **REQ-CM5.3:** THE SYSTEM SHALL remove or document the purpose of each exported function.

---

## Non-Functional Requirements

### NFR-1: Performance

THE SYSTEM SHALL complete environment verification in under 30 seconds for quick mode (no `--full` flag).

THE SYSTEM SHALL complete full verification (with `--full` flag) in under 2 minutes.

### NFR-2: Reliability

THE SYSTEM SHALL handle network failures gracefully without blocking critical operations.

THE SYSTEM SHALL preserve user data by blocking destructive operations on dirty working directories.

### NFR-3: Usability

THE SYSTEM SHALL provide clear error messages with actionable next steps.

THE SYSTEM SHALL display progress feedback for operations taking longer than 3 seconds.

### NFR-4: Maintainability

THE SYSTEM SHOULD reduce code duplication by at least 40% through shared utilities.

THE SYSTEM SHALL document all shared utility functions with JSDoc comments.

---

## Out of Scope

- Automated dependency updates (handled by Renovate)
- Full test suite execution during `/start` (reserved for `/review`)
- Cloud service authentication (AWS, GCP, etc.)
- Docker container setup
- Database migrations

---

## Dependencies

| Dependency                      | Type     | Status |
| ------------------------------- | -------- | ------ |
| git-agent.md                    | Internal | Ready  |
| user-prompt-start.cjs           | Internal | Ready  |
| environment-check.cjs           | Internal | Ready  |
| .claude/config/environment.json | Internal | Ready  |
| Task tool                       | External | Ready  |

---

## Decisions

1. **Should /start block on critical environment issues?**
   - **Decision: YES - Block on critical dependencies**
   - Block on missing: Node.js, package manager (pnpm), git
   - Warn (non-blocking) on: Docker, lint errors, optional tools
   - Rationale: Prevents creating broken worktrees; catches issues early

2. **What should happen when worktree/branch already exists?**
   - **Decision: Error and ask user to choose different name**
   - Display existing branch info (last commit, age)
   - Prompt user to provide a different feature name
   - Rationale: Safe, explicit, prevents accidental overwrites

3. **Should environment check results be cached across sessions?**
   - **Decision: NO - Keep current behavior (no caching)**
   - Re-run checks on every `/start` invocation
   - Rationale: Simplicity; always accurate; most users run `/start` once per feature

4. **Should /start create an initial empty commit?**
   - **Decision: NO - Keep current behavior (no commit)**
   - Branch starts at same commit as base branch
   - Rationale: Clean history; standard git behavior; user can add if needed

---
