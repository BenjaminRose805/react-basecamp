# Requirements: .claude/ Directory Cleanup

## Overview

Aggressively clean up the `.claude/` directory to maintain only the 7 essential commands and their supporting infrastructure. Remove legacy hooks, deprecated workflows, and unused sub-agent templates while preserving core functionality.

## Business Requirements

**BR-1**: When the user executes available commands, the system shall support ONLY the following 7 commands:

- /start
- /research
- /design
- /reconcile
- /implement
- /review
- /ship

**BR-2**: When cleaning up legacy code, the system shall remove all deprecated commands (/guide, /mode, /plan) and their references.

**BR-3**: When maintaining the agent system, the system shall preserve all 7 core agents:

- git-agent.md
- plan-agent.md
- code-agent.md
- ui-agent.md
- docs-agent.md
- eval-agent.md
- check-agent.md

## Functional Requirements

**FR-1**: When updating hook registrations, the system shall remove all references to deleted hooks from `settings.json` BEFORE deleting the hook files.

**FR-2**: When cleaning up hook files, the system shall delete the following 14 hooks:

- pre-tool-use-doc-warning.cjs
- pre-tool-use-dev-tip.cjs
- pre-tool-use-task-enforcement.cjs
- post-tool-use-console-check.cjs
- post-tool-use-eslint.cjs
- post-tool-use-prettier.cjs
- post-tool-use-typecheck.cjs
- post-tool-use-vitest.cjs
- post-tool-use-pr-created.cjs
- stop-console-check.cjs
- suggest-compact.cjs
- pre-compact.cjs
- compaction-tracker.cjs
- start-spec-dashboard.cjs

**FR-3**: When cleaning up command files, the system shall delete:

- commands/guide.md
- commands/mode.md
- commands/plan.md

**FR-4**: When cleaning up directories, the system shall remove:

- agents/archived/
- workflows/
- examples/
- tests/
- sub-agents/profiles/

**FR-5**: When cleaning up sub-agent templates, the system shall delete:

- sub-agents/code-analyzer.md
- sub-agents/git-content-generator.md
- sub-agents/parallel-executor.md
- sub-agents/quality-checker.md
- sub-agents/spec-analyzer.md

**FR-6**: When cleaning up documentation files, the system shall delete:

- sub-agents/code/README.md
- sub-agents/docs/README.md
- sub-agents/eval/README.md
- sub-agents/plan/README.md
- sub-agents/ui/README.md
- sub-agents/workflows/README.md
- sub-agents/QUICK-REFERENCE.md
- sub-agents/README.md

**FR-7**: When cleaning up scripts, the system shall delete:

- scripts/install-tools.cjs
- scripts/measure-tokens.cjs
- scripts/lib/free-checks.cjs
- scripts/lib/rate-limit-tracker.cjs
- scripts/lib/claude-reviewer.cjs
- scripts/lib/loop-controller.cjs
- scripts/lib/secret-scanner.cjs

**FR-8**: When cleaning up documentation, the system shall delete:

- docs/commands.md
- docs/conditional-mcp-servers.md
- docs/context-loading.md
- docs/rules/hooks.md
- docs/rules/performance.md

**FR-9**: When cleaning up sub-agent library files, the system shall delete:

- sub-agents/lib/inject-rules.cjs
- sub-agents/lib/README.md

**FR-10**: When updating CLAUDE.md, the system shall remove /guide and /mode from the command table.

**FR-11**: When completing cleanup, the system shall remove all empty directories.

## Preservation Requirements

**PR-1**: When cleaning up files, the system shall preserve all core scripts:

- scripts/lib/utils.cjs
- scripts/lib/security-patterns.cjs
- scripts/lib/package-manager.cjs

**PR-2**: When cleaning up hooks, the system shall preserve core hooks:

- hooks/session-start.cjs
- hooks/session-end.cjs
- hooks/user-prompt-start.cjs
- hooks/user-prompt-ship.cjs
- hooks/user-prompt-review.cjs
- hooks/command-mode-detect.cjs
- hooks/pre-tool-use-bash.cjs
- hooks/pre-tool-use-file.cjs
- hooks/pre-tool-use-git-push.cjs
- hooks/post-tool-use.cjs

**PR-3**: When cleaning up sub-agent templates, the system shall preserve:

- sub-agents/domain-researcher.md
- sub-agents/domain-writer.md
- sub-agents/quality-validator.md

**PR-4**: When cleaning up sub-agent protocols, the system shall preserve:

- sub-agents/orchestration.md
- sub-agents/handoff.md

**PR-5**: When cleaning up sub-agent library, the system shall preserve:

- sub-agents/lib/sizing-heuristics.md

**PR-6**: When cleaning up sub-agent git files, the system shall preserve:

- sub-agents/git/git-executor.md
- sub-agents/git/pr-reviewer.md

**PR-7**: When cleaning up sub-agent check files, the system shall preserve:

- sub-agents/check/code-validator.md
- sub-agents/check/security-scanner.md

**PR-8**: When cleaning up config files, the system shall preserve:

- settings.json
- settings.local.json
- cclsp.json
- package-manager.json

**PR-9**: When cleaning up directories, the system shall preserve:

- state/
- logs/

**PR-10**: When cleaning up documentation, the system shall preserve all files in:

- docs/rules/\*.md (except hooks.md and performance.md)

## Acceptance Criteria

**AC-1**: After cleanup, the `.claude/commands/` directory contains exactly 7 command files.

**AC-2**: After cleanup, the `settings.json` file contains no references to deleted hooks.

**AC-3**: After cleanup, all 14 legacy hooks have been deleted from the `hooks/` directory.

**AC-4**: After cleanup, all deprecated directories (archived/, workflows/, examples/, tests/, profiles/) no longer exist.

**AC-5**: After cleanup, the CLAUDE.md command table lists only 7 commands.

**AC-6**: After cleanup, all preserved core functionality (agents, hooks, scripts, configs) remains intact and functional.

**AC-7**: After cleanup, no empty directories remain in the `.claude/` structure.

**AC-8**: After cleanup, the git working directory shows only intentional changes (no accidental deletions of preserved files).

## Success Metrics

- Total files deleted: 40+
- Total directories removed: 5
- Reduction in `.claude/` complexity: ~50%
- Zero regressions in core command functionality
- Clean git diff showing only intended deletions
