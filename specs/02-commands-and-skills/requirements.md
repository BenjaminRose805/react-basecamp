# Requirements: Commands and Skills

> **Status:** Completed
> **Created:** 2026-01-27
> **Consolidated:** 2026-01-28

## Overview

This consolidated specification covers command improvements, skill development, workflow updates, and cleanup activities. All requirements from the following specs have been merged and completed:

- start-command-upgrade (Environment setup and verification before feature branches)
- split-plan-commands (Split /plan into /design, /reconcile, /research)
- agent-optimization/07-workflow-updates (Full-feature workflow improvements)
- agent-optimization/09-task-tool-binding (Ensure all agents use Task tool)
- agent-optimization/10-cleanup-consolidation (Documentation and structure cleanup)
- context-loading-optimization (Optimize .claude/ directory loading)

---

## Command Requirements

### /start Command Upgrade ✓ COMPLETED

**Purpose:** Comprehensive environment setup and verification before creating feature branches.

**FR-01:** THE SYSTEM SHALL provide a `/start` command that performs five phases: DEPENDENCIES, TOOLING, VERIFICATION, GIT SETUP, REPORT.

**FR-02:** WHEN user runs `/start [feature-name]`, THE SYSTEM SHALL:

- Detect package manager (pnpm, npm, yarn, bun) from lock files
- Install dependencies if needed
- Check for required tools (CodeRabbit CLI, GitHub CLI)
- Auto-install CodeRabbit CLI with user confirmation
- Run quick verification (lint, typecheck, tests)
- Auto-fix lint errors when possible
- Create feature branch
- Output structured status report

**FR-03:** THE SYSTEM SHALL support flags:

- `--full` - Run full verification including build and e2e tests
- `--security` - Run `pnpm audit` for security vulnerabilities

**FR-04:** THE SYSTEM SHALL write verification results to `start-status.json` state file.

**FR-05:** THE SYSTEM SHALL complete in <5 minutes (quick mode) or <15 minutes (full mode).

**Integration:**

- UserPromptSubmit hook triggers environment-check.cjs on `/start`
- Hook injects results into agent context
- Supports CI environment (skips interactive prompts)
- Supports offline mode (skips network checks)

---

### /plan Split into Three Commands ✓ COMPLETED

**Purpose:** Eliminate mode detection ambiguity by providing explicit commands for different planning activities.

#### /design Command

**REQ-1:** THE SYSTEM SHALL provide a `/design [feature]` command that creates specifications in `specs/{feature}/` directory.

**REQ-2:** WHEN user runs `/design [feature]`, THE SYSTEM SHALL:

- Spawn domain-researcher sub-agent (Opus) to find existing implementations
- Spawn domain-writer sub-agent (Sonnet) to create spec using EARS format
- Spawn quality-validator sub-agent (Haiku) to validate spec completeness
- Create three files: `requirements.md`, `design.md`, `tasks.md`
- Support conversational clarification during spec creation

**REQ-3:** THE SYSTEM SHALL NOT execute Read, Grep, Glob, Edit, or Write tools directly from orchestrator (delegate to sub-agents).

#### /reconcile Command

**REQ-4:** THE SYSTEM SHALL provide a `/reconcile` command that analyzes and plans fixes for code review feedback.

**REQ-5:** WHEN user runs `/reconcile` without arguments, THE SYSTEM SHALL detect local git changes using `git diff`.

**REQ-6:** WHEN user runs `/reconcile [PR-number]`, THE SYSTEM SHALL fetch GitHub PR feedback using `gh pr view`.

**REQ-7:** WHEN `/reconcile` completes, THE SYSTEM SHALL create `specs/pr-{N}-reconciliation/tasks.md` with categorized fix tasks (critical, major, minor, trivial).

**REQ-8:** THE SYSTEM SHALL NOT implement fixes directly; only design and plan fix tasks.

#### /research Command

**REQ-9:** THE SYSTEM SHALL provide a `/research [topic]` command for exploratory investigation without formal spec creation.

**REQ-10:** WHEN user runs `/research [topic]`, THE SYSTEM SHALL:

- Spawn domain-researcher sub-agent to investigate
- Create `research-notes.md` with findings
- Support iterative exploration with follow-up questions
- NOT create requirements.md, design.md, or tasks.md files

**REQ-11:** THE SYSTEM MAY save research notes to `specs/{topic}/research-notes.md` if user requests persistent storage.

#### Mode Detection Removal

**REQ-12:** THE SYSTEM SHALL remove automatic mode detection from `/plan` command.

**REQ-13:** THE SYSTEM MAY preserve `/plan` as an alias to `/design` for backward compatibility during transition.

---

## Workflow Requirements

### Full-Feature Workflow ✓ COMPLETED

**REQ-WORKFLOW-01:** THE SYSTEM SHALL document end-to-end workflow from spec creation to PR merge in `.claude/workflows/full-feature.md`.

**REQ-WORKFLOW-02:** THE workflow SHALL include seven phases:

1. `/start` - Environment setup and branch creation
2. `/design` - Specification creation
3. `/implement` - Implementation with TDD
4. `/review` - Local code review (4-loop system)
5. `/ship` - Commit and PR creation
6. `/reconcile` - Address PR feedback (if needed)
7. Merge - Final merge after approvals

**REQ-WORKFLOW-03:** THE workflow SHALL emphasize sub-agent delegation at each phase.

---

### Task Tool Binding ✓ COMPLETED

**REQ-TASK-01:** THE SYSTEM SHALL ensure all 7 agents (plan, code, ui, docs, eval, check, git) use Task tool for sub-agent spawning.

**REQ-TASK-02:** THE SYSTEM SHALL NOT allow direct tool usage (Read, Grep, Write, Edit) from orchestrator agents.

**REQ-TASK-03:** THE SYSTEM SHALL document Task tool patterns in each agent file.

**REQ-TASK-04:** THE SYSTEM SHALL include mandatory DELEGATION block in all agent files enforcing Task tool usage.

---

## Cleanup and Consolidation Requirements

### Documentation Cleanup ✓ COMPLETED

**REQ-CLEANUP-01:** THE SYSTEM SHALL reorganize `.claude/docs/` directory:

- Core rules → `.claude/docs/core/`
- Domain patterns → `.claude/docs/patterns/`
- Remove redundant files

**REQ-CLEANUP-02:** THE SYSTEM SHALL consolidate agent documentation:

- One README per agent type
- Remove duplicate instructions
- Update examples to use sub-agent patterns

**REQ-CLEANUP-03:** THE SYSTEM SHALL update root-level documentation:

- CLAUDE.md - Updated command table and architecture
- README.md - Updated project structure
- .claude/README.md - Updated context loading guide

---

### Context Loading Optimization ✓ COMPLETED

**REQ-CONTEXT-01:** THE SYSTEM SHALL implement selective context loading based on command type:

| Command      | Contexts Loaded                                      |
| ------------ | ---------------------------------------------------- |
| `/start`     | git-agent + environment.json + hooks                 |
| `/design`    | plan-agent + templates + profiles + protocols        |
| `/implement` | code/ui/docs/eval-agent + patterns + TDD/EDD skills  |
| `/review`    | code-review skill + review-config.yaml + lib scripts |
| `/ship`      | git-agent + check-agent + hooks                      |
| `/reconcile` | plan-agent + parse-coderabbit lib                    |

**REQ-CONTEXT-02:** THE SYSTEM SHALL NOT load all .claude/ files into every session.

**REQ-CONTEXT-03:** THE SYSTEM SHALL document selective loading strategy in `.claude/docs/context-loading.md`.

**REQ-CONTEXT-04:** THE SYSTEM SHALL achieve 40%+ context reduction on average compared to loading all files.

---

## Skills Requirements

### Code Review Skill ✓ COMPLETED

**REQ-SKILL-01:** THE SYSTEM SHALL provide a `/review` skill that implements 4-loop progressive validation.

**REQ-SKILL-02:** THE `/review` skill SHALL support flags:

- `--free` (Loop 1 only: fast mechanical checks)
- `--claude` (Loop 1+2: add Claude Opus reviewer)
- `--skip-cr` (skip Loop 3 CodeRabbit even if rate allows)
- `--all` (all loops, default)

**REQ-SKILL-03:** THE `/review` skill SHALL document in `.claude/skills/code-review/SKILL.md`.

---

### Preview and Progress Skills ✓ COMPLETED

**REQ-SKILL-04:** THE SYSTEM SHALL provide a `/preview` skill showing execution plan before running commands.

**REQ-SKILL-05:** THE SYSTEM SHALL provide a `/progress` skill showing real-time progress during command execution.

**REQ-SKILL-06:** THE preview skill SHALL allow user confirmation or modification before proceeding.

---

## Hooks Requirements ✓ COMPLETED

**REQ-HOOK-01:** THE SYSTEM SHALL provide UserPromptSubmit hooks for each major command:

- `user-prompt-start.cjs` - Triggers environment check
- `user-prompt-review.cjs` - Triggers 4-loop review
- `user-prompt-ship.cjs` - Checks loop-state.json before allowing ship

**REQ-HOOK-02:** THE SYSTEM SHALL provide PreToolUse hooks:

- `command-mode-detect.cjs` - Route commands to appropriate agents
- `pre-tool-use-task-enforcement.cjs` - Enforce sub-agent delegation

**REQ-HOOK-03:** THE SYSTEM SHALL provide PostToolUse hooks:

- `compaction-tracker.cjs` - Track context usage and suggest compaction

---

## Non-Functional Requirements

### NFR-1: Performance

THE SYSTEM SHALL maintain or improve command execution times compared to previous implementation.

**Targets:**

- `/start`: <5min (quick), <15min (full)
- `/design`: ~16min (unchanged from /plan)
- `/research`: <5min
- `/reconcile`: <8min

### NFR-2: Backward Compatibility

THE SYSTEM SHALL preserve existing command interfaces during transition period.

**Aliases:**

- `/plan` → `/design` (with deprecation notice)

### NFR-3: Documentation

THE SYSTEM SHALL provide comprehensive documentation for all commands in `.claude/commands/`.

THE SYSTEM SHALL include examples and common usage patterns.

### NFR-4: Configuration

THE SYSTEM SHALL support configuration files:

- `.claude/config/environment.json` - Tool requirements and verification commands
- `.claude/config/review-config.yaml` - 4-loop review configuration

### NFR-5: CI/CD Support

THE SYSTEM SHALL support non-interactive execution in CI environments.

THE SYSTEM SHALL detect CI mode via `process.env.CI` and skip prompts.

---

## Out of Scope

- Automatic tool updates or version checking
- Custom verification scripts beyond configuration file
- Integration with external monitoring tools
- Parallel execution of verification checks (sequential for clarity)
- Real-time collaboration features during spec creation
- Version control for specification files
- Rollback of environment changes

---

## Dependencies

All dependencies satisfied:

| Dependency                          | Type     | Status   |
| ----------------------------------- | -------- | -------- |
| Sub-agent infrastructure            | Internal | Complete |
| Git 2.0+                            | External | Ready    |
| Node.js 18+                         | External | Ready    |
| Package manager (pnpm/npm/yarn/bun) | External | Ready    |
| CodeRabbit CLI (auto-install)       | External | Ready    |
| GitHub CLI (gh)                     | External | Ready    |
| 4-loop review system (Spec 03)      | Internal | Complete |
| Hooks system                        | Internal | Ready    |
| Skills system                       | Internal | Ready    |

---

**Status:** All requirements implemented and verified.
**Achievement:** 40% context loading reduction, clear command separation, comprehensive environment setup.
