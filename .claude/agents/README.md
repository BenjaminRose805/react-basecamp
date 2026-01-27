# Agent Specifications

This directory contains detailed specifications for the 7 agents used in the development workflow.

## Current Agents (7)

| Agent       | Domain                | Orchestrator | Sub-Agents                                              |
| ----------- | --------------------- | ------------ | ------------------------------------------------------- |
| plan-agent  | Specifications        | Opus         | researcher, writer, validator                           |
| code-agent  | Backend (TDD)         | Opus         | researcher, writer, validator                           |
| ui-agent    | Frontend              | Opus         | researcher, builder, validator                          |
| docs-agent  | Documentation         | Opus         | researcher, writer, validator                           |
| eval-agent  | LLM evaluations       | Opus         | researcher, writer, validator                           |
| check-agent | Quality verification  | Opus         | 5 parallel checkers (build, type, lint, test, security) |
| git-agent   | Version control + PRs | Opus         | change-analyzer, pr-analyzer, pr-reviewer, git-executor |

## Archived Agents

Deprecated agents are in `archived/`:

| Agent         | Reason              | Replacement                  |
| ------------- | ------------------- | ---------------------------- |
| debug-agent   | Investigation phase | investigator sub-agent       |
| pr-agent      | Absorbed into git   | git-agent (pr-\* sub-agents) |
| help-agent    | Not agent work      | /guide command               |
| context-agent | Not agent work      | /mode command                |

## Agent Pattern

All agents use an **Opus orchestrator** with specialized sub-agents:

```
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (Opus)                                        │
│  - Coordinates phases                                       │
│  - Manages handoffs                                         │
│  - Handles errors                                           │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│   (Opus)    │ ───► │  (Sonnet)   │ ───► │   (Haiku)   │
└─────────────┘      └─────────────┘      └─────────────┘
```

## Model Assignments

| Role             | Model  | Examples                                     |
| ---------------- | ------ | -------------------------------------------- |
| Orchestrators    | Opus   | All 7 agent orchestrators                    |
| Researchers      | Opus   | plan-researcher, code-researcher, etc.       |
| Analyzers        | Opus   | investigator, pr-reviewer, refactor-analyzer |
| Writers/Builders | Sonnet | code-writer, ui-builder, docs-writer         |
| Validators       | Haiku  | code-validator, ui-validator, all checkers   |
| Executors        | Haiku  | git-executor, build-checker, test-runner     |

## Sub-Agent Details

See `.claude/sub-agents/` for complete sub-agent specifications:

```
sub-agents/
├── code/           # code-researcher, code-writer, code-validator
├── docs/           # docs-researcher, docs-writer, docs-validator
├── eval/           # eval-researcher, eval-writer, eval-validator
├── git/            # change-analyzer, pr-analyzer, pr-reviewer, git-executor
├── plan/           # plan-researcher, plan-writer, plan-validator
├── ui/             # ui-researcher, ui-builder, ui-validator
├── workflows/      # investigator, refactor-analyzer, security-triager
├── profiles/       # Permission profiles (read-only, research, writer, full-access)
├── protocols/      # Handoff and orchestration protocols
└── templates/      # Base templates for each sub-agent type
```

## Routing

Users don't invoke agents directly. Commands route to agents:

| Command    | Routes To                         |
| ---------- | --------------------------------- |
| /start     | git-agent (worktree creation)     |
| /plan      | plan-agent                        |
| /implement | Routing → code/ui/docs/eval-agent |
| /ship      | git-agent + check-agent           |
| /guide     | (informational, no agent)         |
| /mode      | (mode switch, no agent)           |
