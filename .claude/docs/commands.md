# Commands Reference

Complete reference for all available commands in the react-basecamp AI development system.

## Command Overview

| Command      | Purpose                              | Routes To                |
| ------------ | ------------------------------------ | ------------------------ |
| `/start`     | Begin work (worktree + branch)       | git worktree             |
| `/plan`      | Design spec or reconcile PR feedback | plan-agent               |
| `/implement` | Build approved spec                  | code/ui/docs/eval agents |
| `/ship`      | Commit + PR + CI + CodeRabbit        | git-agent + check-agent  |
| `/guide`     | Status, help, orientation            | —                        |
| `/mode`      | Switch working modes                 | —                        |

**Note:** Git operations are invisible. Users never run git commands directly.

---

## /start

**Purpose:** Begin work on a new feature by creating a worktree and branch.

**Syntax:**

```bash
/start                    # Prompt for feature name
/start [feature-name]     # Create worktree for feature
```

**What Happens:**

1. Creates git worktree at `../project-{feature-name}`
2. Creates branch `feature/{feature-name}`
3. Outputs restart instructions

**Example:**

```bash
/start user-authentication
# Creates:
#   Worktree: ../react-basecamp-user-authentication
#   Branch: feature/user-authentication
```

**After /start:**

1. Restart Claude session in the new worktree directory
2. Run `/plan` to design your feature

---

## /plan

**Purpose:** Design implementation specs (define mode) or reconcile PR feedback (reconcile mode).

**Syntax:**

```bash
/plan                     # Conversational planning
```

**Mode Detection:**

- **Define mode:** No open PR or no CodeRabbit comments → create new spec
- **Reconcile mode:** Open PR with CodeRabbit comments → create fix plan

**Define Mode Flow:**

1. Ask clarifying questions about the feature
2. Show preview of what will be generated
3. Generate spec files (requirements.md, design.md, tasks.md)
4. Ask for user approval

**Reconcile Mode Flow:**

1. Fetch CodeRabbit comments from open PR
2. Show issues to address
3. Generate fix plan
4. Ask for user approval

**Output:**

- `specs/{feature}/requirements.md` - EARS format requirements
- `specs/{feature}/design.md` - Architecture and approach
- `specs/{feature}/tasks.md` - Phased implementation tasks

**After /plan:**

- Run `/implement` to build the approved spec

---

## /implement

**Purpose:** Build an approved spec. Routes to appropriate agents based on spec content.

**Syntax:**

```bash
/implement                # Build the current spec
```

**Prerequisites:**

- Approved spec must exist in `specs/` directory

**Routing (based on spec content):**
| Spec Contains | Routes To |
| ---------------------------- | ------------------------- |
| Prisma, tRPC, API only | code-agent |
| React, components only | ui-agent |
| Backend + frontend | code-agent → ui-agent |
| Documentation only | docs-agent |
| Evaluation/graders only | eval-agent |

**Execution Flow:**

1. Show preview of stages and sub-agents
2. Execute each stage sequentially
3. Show progress with sub-agent completion times
4. Run final verification (check-agent)
5. Report results

**TDD Enforcement:**
All code/ui agents follow red → green → refactor:

1. Write failing tests first
2. Implement to pass tests
3. Refactor while tests pass

**After /implement:**

- Run `/ship` to commit and create PR

---

## /ship

**Purpose:** Ship current work. Creates commit, pushes, creates PR, monitors CI and CodeRabbit.

**Syntax:**

```bash
/ship                     # Full ship workflow
```

**Stages:**

1. **Commit:** Analyze changes, generate message, create commit
2. **Create PR:** Generate description, create PR via gh CLI
3. **Wait for CI:** Poll GitHub Actions for pass/fail
4. **Wait for CodeRabbit:** Poll for review comments

**Outcomes:**
| Outcome | Next Step |
| -------------------- | ------------------------------ |
| CI passes, approved | Offer to merge |
| CI fails | Recommend `/plan` to fix |
| CodeRabbit comments | Recommend `/plan` to reconcile |
| Rate limited | Wait or force merge |

**Second Ship (after reconcile):**

1. Post `@coderabbitai resolve` on addressed comments
2. Commit and push fixes
3. Re-request review

---

## /guide

**Purpose:** Show current status, available commands, and suggested next action.

**Syntax:**

```bash
/guide                    # Show status and help
```

**Output includes:**

- Current feature and branch
- Progress through workflow (start → plan → implement → ship)
- Suggested next command
- List of available commands

**No preview needed** - informational only.

---

## /mode

**Purpose:** Switch between working modes.

**Syntax:**

```bash
/mode                     # Show current mode
/mode dev                 # Enable full orchestration
/mode basic               # Disable orchestration, previews
```

**Modes:**
| Mode | Previews | Sub-agents | Use Case |
| ------- | -------- | ---------- | ----------------------- |
| `dev` | Yes | Yes | Normal development |
| `basic` | No | No | Quick edits, debugging |

**Immediate effect** - no preview needed.

---

## Quick Reference

```text
/start [name]       Create worktree and branch
/plan               Design spec or reconcile PR
/implement          Build approved spec
/ship               Commit + PR + CI + review
/guide              Status and help
/mode [dev|basic]   Switch working modes
```

## Standard Flow

```text
/start feature-name
  ↓
cd ../project-feature-name
  ↓
/plan
  ↓
(approve spec)
  ↓
/implement
  ↓
/ship
  ↓
(if CodeRabbit comments)
  ↓
/plan (reconcile)
  ↓
/implement
  ↓
/ship
```

## Mode Behavior

| Command      | Dev Mode                    | Basic Mode       |
| ------------ | --------------------------- | ---------------- |
| `/start`     | Preview → execute           | Execute directly |
| `/plan`      | Sub-agents, progress        | Direct execution |
| `/implement` | Preview, progress, parallel | Direct execution |
| `/ship`      | Preview, progress           | Execute directly |
| `/guide`     | Same                        | Same             |
| `/mode`      | Same                        | Same             |
