# Git Sub-Agents

Sub-agents for the git-agent orchestrator handling version control and PR management.

## Overview

```text
git-agent (orchestrator, Opus)
├── change-analyzer (Sonnet)
│   └── Analyze diffs, suggest commit messages
├── pr-analyzer (Sonnet)
│   └── Generate PR descriptions
├── pr-reviewer (Opus)
│   └── Thorough code review
└── git-executor (Haiku)
    └── Execute git/gh CLI commands
```

## Sub-Agents

| Sub-Agent                               | Model  | Profile   | Purpose                                             |
| --------------------------------------- | ------ | --------- | --------------------------------------------------- |
| [change-analyzer](./change-analyzer.md) | Sonnet | read-only | Analyze diffs, suggest conventional commit messages |
| [pr-analyzer](./pr-analyzer.md)         | Sonnet | read-only | Generate comprehensive PR descriptions              |
| [pr-reviewer](./pr-reviewer.md)         | Opus   | research  | Thorough security and correctness review            |
| [git-executor](./git-executor.md)       | Haiku  | Bash only | Execute git/gh CLI commands safely                  |

## Orchestration Flows

### Commit Flow

```text
/git commit
    │
    ├─► git-executor: git diff --staged
    │   └─ Returns: diff content, files
    │
    ├─► change-analyzer: analyze diff
    │   └─ Returns: suggested commit message
    │
    └─► git-executor: git commit -m "..."
        └─ Returns: commit hash, success
```

### PR Create Flow

```text
/git pr
    │
    ├─► git-executor: git log main..HEAD, git diff main...HEAD
    │   └─ Returns: commits, full diff
    │
    ├─► pr-analyzer: generate description
    │   └─ Returns: title, body
    │
    └─► git-executor: gh pr create
        └─ Returns: PR URL
```

### PR Review Flow

```text
/git pr review <number>
    │
    ├─► git-executor: gh pr view, gh pr diff
    │   └─ Returns: PR metadata, diff
    │
    ├─► pr-reviewer: analyze changes
    │   └─ Returns: verdict, findings
    │
    └─► git-executor: gh pr review
        └─ Returns: review submitted
```

## Model Selection Rationale

| Sub-Agent       | Model  | Reasoning                                                      |
| --------------- | ------ | -------------------------------------------------------------- |
| change-analyzer | Sonnet | Needs code understanding, commit convention knowledge          |
| pr-analyzer     | Sonnet | Needs to synthesize multiple commits into coherent description |
| pr-reviewer     | Opus   | Requires deep security analysis, nuanced feedback              |
| git-executor    | Haiku  | Simple command execution, parsing output                       |

## Permission Profiles

| Sub-Agent       | Tools                   | Reasoning                         |
| --------------- | ----------------------- | --------------------------------- |
| change-analyzer | Read, Grep, Glob        | Read-only analysis                |
| pr-analyzer     | Read, Grep, Glob        | Read-only analysis                |
| pr-reviewer     | Read, Grep, Glob, cclsp | Needs code navigation for context |
| git-executor    | Bash                    | Must execute commands             |

## Handoff Protocol

All sub-agents follow the standard [handoff protocol](../protocols/handoff.md):

```json
{
  "task_id": "unique-id",
  "phase": "analyze | review | execute",
  "context": {
    /* operation-specific */
  },
  "instructions": "what to do",
  "expected_output": "result type"
}
```

## Context Compaction

The git-agent orchestrator maintains minimal state:

```typescript
{
  state: {
    diff_summary: string | null,      // From git-executor
    commit_message: string | null,    // From change-analyzer
    pr_description: string | null,    // From pr-analyzer
    review_verdict: string | null,    // From pr-reviewer
  }
}
```

**DISCARD:** Full diffs, raw command outputs, detailed findings (after extracting summary).

## Safety Rules

The git-executor enforces these safety rules:

| Operation          | Blocked              |
| ------------------ | -------------------- |
| Force push to main | Always               |
| Reset --hard       | Without confirmation |
| Clean -f           | Without confirmation |
| --no-verify        | Always               |

See [git-executor.md](./git-executor.md) for full safety rules.
