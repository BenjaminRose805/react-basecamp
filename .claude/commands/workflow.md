# /workflow - Workflow Orchestration

Analyzes current state and guides you to the appropriate next action.

## Usage

```
/workflow              # Analyze state and suggest/execute next command
```

## Instructions

When this command is invoked:

### Step 1: Quick State Check

```bash
git status --short
git log --oneline -3
```

### Step 2: Decision Logic

```
Analyze state:
├── New session / confused?
│   └── Execute: /status
│
├── Starting new feature?
│   └── Execute: /plan [feature]
│
├── Have uncommitted changes?
│   ├── Ready to commit? → /commit
│   └── Not ready? → Show status, suggest continuing
│
├── Tests passing, code complete?
│   └── Execute: /verify → /pr
│
├── End of session?
│   └── Execute: /recap
│
└── Unsure?
    └── Execute: /next
```

### Step 3: Execute or Guide

Either:

1. **Execute** the appropriate command directly
2. **Guide** with a recommendation if context is unclear

## Available Commands

| Command   | When                              |
| --------- | --------------------------------- |
| `/status` | Start of session, need overview   |
| `/plan`   | Starting new feature              |
| `/next`   | Unsure what to do                 |
| `/commit` | Changes ready to commit           |
| `/pr`     | Feature done, verification passed |
| `/recap`  | End of session                    |

## Model

Use: **Haiku** (lightweight orchestration)
