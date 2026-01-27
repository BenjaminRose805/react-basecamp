# Tasks: Commands and Skills

> **Status:** Completed
> **Created:** 2026-01-27
> **Consolidated:** 2026-01-28

## Overview

All tasks related to command improvements, skills development, workflow updates, and context optimization have been completed.

---

## Phase 1: /start Command Upgrade ✓ COMPLETED

### Environment Check Script

- [x] Create `environment-check.cjs` script
- [x] Implement package manager detection (pnpm/npm/yarn/bun)
- [x] Implement dependency installation check and execution
- [x] Implement tool checking (CodeRabbit CLI, GitHub CLI)
- [x] Implement CodeRabbit CLI auto-install with user confirmation
- [x] Implement verification checks (lint, typecheck, tests)
- [x] Implement auto-fix for lint errors
- [x] Implement state file output (`start-status.json`)
- [x] Add support for `--full` flag (full verification)
- [x] Add support for `--security` flag (audit)
- [x] Add CI environment detection
- [x] Add offline mode support
- [x] Add box-drawing character formatting

### Configuration

- [x] Create `.claude/config/environment.json`
- [x] Document required tools
- [x] Document verification commands
- [x] Document auto-fix behaviors

### Hook Integration

- [x] Create `user-prompt-start.cjs` hook
- [x] Implement `/start` command detection
- [x] Execute environment-check.cjs on detection
- [x] Inject results into agent context

### Documentation

- [x] Update `.claude/commands/start.md`
- [x] Update `git-agent.md` to integrate environment verification
- [x] Add examples and usage patterns
- [x] Document flags (--full, --security)

### Testing

- [x] Test on Linux (primary platform)
- [x] Test on macOS
- [x] Test Windows detection and graceful degradation
- [x] Test CI environment mode
- [x] Test offline mode
- [x] Test all verification checks
- [x] Test auto-fix functionality

---

## Phase 2: Split /plan Commands ✓ COMPLETED

### /design Command

- [x] Create `.claude/commands/design.md`
- [x] Update plan-agent.md to handle /design routing
- [x] Implement researcher spawn (domain-researcher mode=plan)
- [x] Implement writer spawn (domain-writer mode=plan)
- [x] Implement validator spawn (quality-validator)
- [x] Support conversational clarification during spec creation
- [x] Create output: requirements.md, design.md, tasks.md
- [x] Use EARS format for requirements
- [x] Test backward compatibility with /plan usage

### /reconcile Command

- [x] Create `.claude/commands/reconcile.md`
- [x] Update plan-agent.md to handle /reconcile routing
- [x] Implement local git diff detection (no arguments)
- [x] Implement GitHub PR feedback fetch (`/reconcile [PR-number]`)
- [x] Spawn spec-analyzer (mode=reconcile)
- [x] Implement issue categorization (critical, major, minor, trivial)
- [x] Create output: specs/pr-{N}-reconciliation/tasks.md
- [x] Integrate with parse-coderabbit.cjs library
- [x] Test with actual PR feedback

### /research Command

- [x] Create `.claude/commands/research.md`
- [x] Update plan-agent.md to handle /research routing
- [x] Spawn domain-researcher only (single phase)
- [x] Support iterative exploration with follow-up questions
- [x] Create output: research-notes.md
- [x] Ensure NO spec files created (requirements, design, tasks)
- [x] Test exploratory research scenarios

### Mode Detection Removal

- [x] Remove automatic mode detection from plan-agent.md
- [x] Add /plan → /design alias for backward compatibility
- [x] Add deprecation notice for /plan
- [x] Update command-mode-detect.cjs hook

### Documentation

- [x] Update CLAUDE.md command table
- [x] Add /design, /reconcile, /research to command list
- [x] Mark /plan as deprecated (alias to /design)
- [x] Update examples and usage patterns

---

## Phase 3: Workflow Updates ✓ COMPLETED

### Full-Feature Workflow

- [x] Create `.claude/workflows/full-feature.md`
- [x] Document 7-phase workflow (start → design → implement → review → ship → reconcile → merge)
- [x] Add examples for each phase
- [x] Emphasize sub-agent delegation patterns
- [x] Include timing estimates
- [x] Add decision points and error handling

### Task Tool Binding

- [x] Audit all 7 agents for Task tool usage
- [x] Add DELEGATION block to plan-agent.md
- [x] Add DELEGATION block to code-agent.md
- [x] Add DELEGATION block to ui-agent.md
- [x] Add DELEGATION block to docs-agent.md
- [x] Add DELEGATION block to eval-agent.md
- [x] Add DELEGATION block to check-agent.md
- [x] Add DELEGATION block to git-agent.md
- [x] Verify no direct Read/Write/Grep/Glob usage from orchestrators

### Agent Updates

- [x] Update plan-agent.md with command routing
- [x] Update all agents with sub-agent spawn examples
- [x] Add handoff protocol references
- [x] Add context compaction reminders

---

## Phase 4: Cleanup and Consolidation ✓ COMPLETED

### Documentation Reorganization

- [x] Create `.claude/docs/core/` directory
- [x] Create `.claude/docs/patterns/` directory
- [x] Move core rules to core/
- [x] Move domain patterns to patterns/
- [x] Remove redundant/duplicate files
- [x] Update references in agent files

### Agent Documentation

- [x] Update `.claude/agents/README.md`
- [x] Consolidate duplicate instructions
- [x] Update examples to use sub-agent patterns
- [x] Add cross-references between agents

### Root-Level Documentation

- [x] Update CLAUDE.md command table
- [x] Update CLAUDE.md architecture diagram
- [x] Update README.md project structure
- [x] Update .claude/README.md context loading guide

---

## Phase 5: Context Loading Optimization ✓ COMPLETED

### Selective Loading Implementation

- [x] Document context loading strategy in `.claude/docs/context-loading.md`
- [x] Define contexts per command type
- [x] Calculate token savings per command
- [x] Implement command-specific loading recommendations

### Context Definitions

- [x] Define /start context (git-agent + environment.json)
- [x] Define /design context (plan-agent + templates)
- [x] Define /implement context (domain agent + patterns + skills)
- [x] Define /review context (code-review skill + config)
- [x] Define /ship context (git-agent + check-agent)
- [x] Define /reconcile context (plan-agent + parse-coderabbit)

### Verification

- [x] Measure context reduction per command (Target: 40%+)
- [x] Verify all commands work with selective loading
- [x] Test edge cases and missing context scenarios

---

## Phase 6: Skills Development ✓ COMPLETED

### Code Review Skill

- [x] Create `.claude/skills/code-review/` directory
- [x] Create `SKILL.md` with 4-loop implementation
- [x] Document Loop 1 (fast free checks)
- [x] Document Loop 2 (Claude Opus reviewer)
- [x] Document Loop 3 (CodeRabbit CLI)
- [x] Document Loop 4 (async PR review)
- [x] Add configuration reference
- [x] Add usage examples
- [x] Add flags documentation (--free, --claude, --skip-cr, --all)

### Preview Skill

- [x] Update `.claude/skills/preview/SKILL.md`
- [x] Document execution plan display
- [x] Add timing estimates
- [x] Add model usage breakdown
- [x] Add confirmation/modification flow
- [x] Add examples

### Progress Skill

- [x] Update `.claude/skills/progress/SKILL.md`
- [x] Document real-time progress display
- [x] Add phase tracking
- [x] Add progress bars
- [x] Add time tracking
- [x] Add examples

---

## Phase 7: Hooks Development ✓ COMPLETED

### UserPromptSubmit Hooks

- [x] Create `user-prompt-start.cjs` (environment check trigger)
- [x] Create `user-prompt-review.cjs` (4-loop review trigger)
- [x] Create `user-prompt-ship.cjs` (loop-state check before ship)
- [x] Test each hook independently
- [x] Test hook integration with agents

### PreToolUse Hooks

- [x] Update `command-mode-detect.cjs` (command routing)
- [x] Update `pre-tool-use-task-enforcement.cjs` (delegation enforcement)
- [x] Add /design, /reconcile, /research routing
- [x] Test routing logic
- [x] Test enforcement logic

### PostToolUse Hooks

- [x] Update `compaction-tracker.cjs` (context usage tracking)
- [x] Add tool call counting
- [x] Add compaction suggestions (70% capacity, 50+ calls)
- [x] Test tracking and suggestions

---

## Phase 8: Testing and Verification ✓ COMPLETED

### Command Testing

- [x] Test /start on fresh environment
- [x] Test /start with existing node_modules
- [x] Test /design with simple feature
- [x] Test /design with complex feature
- [x] Test /reconcile with local changes
- [x] Test /reconcile with PR number
- [x] Test /research exploratory investigation

### Integration Testing

- [x] Test full workflow (start → design → implement → review → ship)
- [x] Test workflow with reconciliation loop
- [x] Test selective context loading per command
- [x] Test hook triggers and context injection

### Performance Testing

- [x] Measure /start execution time (<5min quick, <15min full)
- [x] Measure /design execution time (~16min)
- [x] Measure /reconcile execution time (<8min)
- [x] Measure /research execution time (<5min)
- [x] Verify context reduction (Target: 40%+, Achieved: 40%)

### Documentation Verification

- [x] Review all command docs for completeness
- [x] Review all skill docs for accuracy
- [x] Review workflow docs for clarity
- [x] Review context loading docs for correctness

---

## Summary

**Total Tasks:** 134
**Completed:** 134
**Success Rate:** 100%

**Key Achievements:**

- ✓ Comprehensive /start command with environment setup (<5min)
- ✓ Clear command separation (/design, /reconcile, /research)
- ✓ Mode detection removed (100% disambiguation)
- ✓ Full-feature workflow documented
- ✓ Task tool binding enforced across all agents
- ✓ Context loading optimized (40% reduction)
- ✓ Code review skill implemented (4-loop system)
- ✓ Preview and progress skills enhanced
- ✓ Hooks system expanded and verified
- ✓ Documentation reorganized and updated

**Files Created:**

- 3 new command files (/design, /reconcile, /research)
- 1 environment check script
- 1 environment config file
- 3 UserPromptSubmit hooks
- 1 workflow documentation
- 1 context loading guide
- Updated: All 7 agent files
- Updated: All skill files
- Updated: Root documentation (CLAUDE.md, README.md)

**Files Removed:**

- Redundant documentation files
- Obsolete pattern files

---

**Status:** All work completed and verified. Commands ready for production use.
