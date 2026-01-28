# Requirements: /start Command Upgrade

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** start-command-upgrade

## Overview

Upgrade the `/start` command to perform comprehensive environment setup and verification before creating feature branches. This ensures developers have all required dependencies, tooling, and a passing codebase before starting work, reducing mid-workflow disruptions and token waste from discovering environment issues.

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

### US1: One-Command Environment Setup

**As a** developer, **I want** to run `/start [feature]` and have all dependencies installed and verified, **so that** I can begin work with confidence that my environment is ready.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **FR-01:** THE SYSTEM SHALL provide a `/start` command that performs environment setup, tooling verification, and git operations in a single execution.

**Event-driven (triggered by action):**

- **FR-02:** WHEN user runs `/start [feature-name]`, THE SYSTEM SHALL execute five phases in sequence: DEPENDENCIES, TOOLING, VERIFICATION, GIT SETUP, REPORT.

- **FR-03:** WHEN `/start` command completes, THE SYSTEM SHALL output a structured status report showing success/failure of each phase with actionable instructions for failures.

**State-driven (active during state):**

- **FR-04:** WHILE dependency installation is in progress, THE SYSTEM SHALL detect the package manager (pnpm, npm, yarn, bun) based on lock file presence.

**Unwanted behavior (error handling):**

- **FR-05:** IF a phase fails during `/start` execution, THEN THE SYSTEM SHALL continue to subsequent phases but mark overall status as "issues" and provide fix instructions.

- **FR-06:** IF verification checks fail (lint, typecheck, tests), THEN THE SYSTEM SHALL attempt auto-fix for fixable issues (e.g., `pnpm lint --fix`) before reporting to user.

**Prohibitions:**

- **FR-07:** THE SYSTEM SHALL NOT block git operations if verification checks fail; it SHALL warn the user but allow them to proceed.

---

### US2: Automatic Tooling Installation

**As a** developer, **I want** CodeRabbit CLI and other required tools to be installed automatically, **so that** I don't have to manually set up my environment.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **FR-08:** THE SYSTEM SHALL check for required tools (CodeRabbit CLI, GitHub CLI) during the TOOLING phase.

**Event-driven (triggered by action):**

- **FR-09:** WHEN CodeRabbit CLI is not installed, THE SYSTEM SHALL prompt the user for confirmation before installing via `curl -fsSL https://cli.coderabbit.ai/install.sh | sh`.

- **FR-10:** WHEN GitHub CLI is not installed, THE SYSTEM SHALL report the missing tool with installation instructions (cannot auto-install gh CLI).

- **FR-11:** WHEN CodeRabbit CLI is installed but not authenticated, THE SYSTEM SHALL prompt the user to run `coderabbit auth login` and wait for completion.

**Unwanted behavior (error handling):**

- **FR-12:** IF tool installation fails due to permission errors, THEN THE SYSTEM SHALL report the error and suggest using sudo or manual installation.

- **FR-13:** IF the system is running on Windows, THEN THE SYSTEM SHALL skip CodeRabbit CLI installation and warn that it's not available on Windows.

**Recommendations:**

- **FR-14:** THE SYSTEM SHOULD use "prompt" mode as default for tool installation, requiring user confirmation before installing any tools.

---

### US3: Codebase Health Verification

**As a** developer, **I want** lint, typecheck, and test verification to run automatically, **so that** I know the codebase is healthy before I start making changes.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **FR-15:** THE SYSTEM SHALL run quick verification checks (lint, typecheck, tests) during the VERIFICATION phase.

**Event-driven (triggered by action):**

- **FR-16:** WHEN user runs `/start` with `--full` flag, THE SYSTEM SHALL run full verification including build and e2e tests.

- **FR-17:** WHEN lint errors are detected and fixable, THE SYSTEM SHALL automatically run `pnpm lint --fix` and re-check.

**State-driven (active during state):**

- **FR-18:** WHILE verification checks are running, THE SYSTEM SHALL use quick mode by default (skip slow tests like e2e unless `--full` flag is provided).

**Unwanted behavior (error handling):**

- **FR-19:** IF verification checks fail and cannot be auto-fixed, THEN THE SYSTEM SHALL report specific errors with file paths and line numbers.

**Optional feature:**

- **FR-20:** WHERE `--security` flag is provided, THE SYSTEM MAY run `pnpm audit` to check for security vulnerabilities.

---

### US4: State File Output

**As a** developer or CI system, **I want** verification results saved to a JSON file, **so that** I can reference environment status programmatically.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **FR-21:** THE SYSTEM SHALL write a structured state file at `start-status.json` containing all verification results.

**Event-driven (triggered by action):**

- **FR-22:** WHEN `/start` command completes, THE SYSTEM SHALL write the state file with sections for dependencies, tooling, verification, git, and issues array.

**State-driven (active during state):**

- **FR-23:** WHILE each phase executes, THE SYSTEM SHALL collect status data (success/failure, version numbers, error messages) for inclusion in the state file.

---

### US5: Hook Integration

**As a** system integrator, **I want** the environment check to run automatically when `/start` is invoked, **so that** verification happens seamlessly without manual script execution.

#### Acceptance Criteria

**Ubiquitous (always active):**

- **FR-24:** THE SYSTEM SHALL provide a UserPromptSubmit hook that triggers on `/start` command.

**Event-driven (triggered by action):**

- **FR-25:** WHEN `/start` command is detected by the hook, THE SYSTEM SHALL execute `environment-check.cjs` script and inject results into agent context.

**Recommendations:**

- **FR-26:** THE SYSTEM SHOULD support running `environment-check.cjs` as a standalone script for CI/CD pipelines and manual execution.

---

## Non-Functional Requirements

### NFR-01: Performance

THE SYSTEM SHALL complete `/start` command execution in under 5 minutes for quick verification mode (excluding dependency installation time).

THE SYSTEM SHALL complete `/start --full` execution in under 15 minutes including full build and test suite.

### NFR-02: Configuration

THE SYSTEM SHALL read tool requirements and verification commands from `.claude/config/environment.json` configuration file.

THE SYSTEM SHOULD support custom verification commands and auto-fix behaviors via configuration.

### NFR-03: Platform Support

THE SYSTEM SHALL support Linux and macOS platforms.

THE SYSTEM SHOULD handle Windows platform gracefully by skipping unsupported tools (CodeRabbit CLI) and reporting limitations.

### NFR-04: Offline Mode

THE SYSTEM SHALL detect offline mode and skip network-dependent checks (CodeRabbit authentication, GitHub CLI verification).

### NFR-05: CI Environment Detection

THE SYSTEM SHALL detect CI environment (via `process.env.CI`) and skip interactive prompts.

### NFR-06: Output Formatting

THE SYSTEM SHALL use box-drawing characters and color coding (✓ green, ✗ red, ⚠ yellow) for visual status reporting.

### NFR-07: Backward Compatibility

THE SYSTEM SHALL preserve existing `/start` git operations (branch creation, status checks) while adding new verification phases.

### NFR-08: Documentation

THE SYSTEM SHALL update `.claude/commands/start.md` with new workflow documentation.

THE SYSTEM SHALL update `git-agent.md` to integrate environment verification into the start workflow.

### NFR-09: Error Recovery

THE SYSTEM SHOULD provide actionable error messages with specific commands to fix issues (e.g., "Run: coderabbit auth login").

---

## Out of Scope

- Automatic tool updates (checking for newer versions of installed tools)
- Custom verification script support beyond configuration file
- Integration with external monitoring tools (Sentry, DataDog, etc.)
- Parallel execution of verification checks (run sequentially for clarity)
- Rollback of environment changes if issues are found

---

## Dependencies

| Dependency                              | Type     | Status     |
| --------------------------------------- | -------- | ---------- |
| .claude/commands/start.md               | Internal | Ready      |
| .claude/agents/git-agent.md             | Internal | Ready      |
| .claude/scripts/lib/utils.cjs           | Internal | Ready      |
| .claude/scripts/lib/package-manager.cjs | Internal | Ready      |
| Node.js 18+                             | External | Ready      |
| Git 2.0+                                | External | Ready      |
| Package manager (pnpm/npm/yarn/bun)     | External | Ready      |
| CodeRabbit CLI (auto-install)           | External | To Install |
| GitHub CLI (gh)                         | External | Optional   |

---

## Related Specifications

- `specs/local-code-review/` - CodeRabbit CLI integration (this spec ensures it's installed)
- `specs/scripting-opportunities/` - Hooks and scripts infrastructure

---
