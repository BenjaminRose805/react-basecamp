# /status - Development Status Overview

Show current work state, progress, and what needs attention.

## Usage

```
/status                    # Full status overview
/status git                # Git status only
/status tasks              # Task list only
/status tests              # Test status only
/status phase              # Current development phase
```

## Instructions

When this command is invoked, gather and display:

### 1. Git Status

```bash
git status --short
git branch --show-current
git log --oneline -3
```

Display:

- Current branch
- Uncommitted changes (staged/unstaged)
- Recent commits
- Ahead/behind remote

### 2. Task Progress

Check the task list (if using TaskList tool):

- Pending tasks
- In-progress tasks
- Completed tasks
- Blocked tasks

### 3. Test Status

```bash
pnpm test:run --reporter=dot 2>&1 | tail -5
```

Display:

- Pass/fail count
- Any failing tests
- Coverage summary (if available)

### 4. Build Status

Check for:

- TypeScript errors (`pnpm typecheck`)
- Lint errors (`pnpm lint`)
- Build status (last known)

### 5. Current Phase Detection

Analyze context to determine phase:

| Phase      | Indicators                                     |
| ---------- | ---------------------------------------------- |
| **Spec**   | Working on `specs/*.md`, no implementation yet |
| **Test**   | Writing tests, tests failing (TDD red)         |
| **Code**   | Implementing, tests should be passing          |
| **QA**     | Running verification, fixing issues            |
| **Review** | PR created, awaiting/addressing feedback       |

## Output Format

```
STATUS OVERVIEW
===============

Git:
  Branch:     feat/user-auth
  Status:     3 staged, 1 modified
  Commits:    2 ahead of main

Tasks:
  Pending:    2
  In Progress: 1 (Implement login form)
  Completed:  3
  Blocked:    0

Tests:
  Status:     PASSING (24/24)
  Coverage:   76%

Quality:
  Types:      PASS
  Lint:       2 warnings
  Build:      PASS

Phase:       CODE (implementation)
Last Action: /code write user-auth

SUGGESTED NEXT:
  - Stage and commit current changes: /commit
  - Or continue with: /code qa user-auth
```

## Phase-Specific Suggestions

Based on detected phase, suggest appropriate next commands:

| Current Phase | Suggested Next                   |
| ------------- | -------------------------------- |
| Spec          | `/test [feature]` to write tests |
| Test (red)    | `/code [feature]` to implement   |
| Code          | `/verify` then `/commit`         |
| QA            | Fix issues, then `/security`     |
| Review        | Address feedback, then `/commit` |

## Quick Commands

For each scope:

- `/status git` - Just git information
- `/status tasks` - Just task list
- `/status tests` - Just test results
- `/status phase` - Just phase detection with next suggestion
