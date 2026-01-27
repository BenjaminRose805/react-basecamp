# Requirements: Task Tool Binding

> **Status:** Draft
> **Created:** 2026-01-26
> **Updated:** 2026-01-26
> **Spec ID:** agent-opt-09

## Overview

This spec defines the simplified command structure (6 commands) and the binding between documentation and Task tool execution. Users interact with high-level commands; the system handles routing, agents, and git operations internally.

---

## Command Structure

### Commands vs Skills

| Layer        | What It Is          | Who Uses It         | Examples                                                                  |
| ------------ | ------------------- | ------------------- | ------------------------------------------------------------------------- |
| **Commands** | User entry points   | Users invoke these  | `/start`, `/plan`, `/implement`, `/ship`, `/guide`, `/mode`               |
| **Skills**   | Reusable procedures | Agents invoke these | `research`, `tdd-workflow`, `qa-checks`, `preview`, `progress`, `routing` |

**Key distinction:**

- Commands are the 6 things users type
- Skills are internal procedures that agents use to do work
- Users should never need to know about skills

### 6 User Commands

| Command      | Purpose                       | User's Concern                                              |
| ------------ | ----------------------------- | ----------------------------------------------------------- |
| `/start`     | Begin work                    | "I want to start a new feature"                             |
| `/plan`      | Design or reconcile           | "I want to design something" or "I need to fix PR feedback" |
| `/implement` | Build approved spec           | "I'm ready to build this"                                   |
| `/ship`      | Commit + PR + CI + CodeRabbit | "I'm done, send it"                                         |
| `/guide`     | Status, help, orientation     | "Where am I? What's next?"                                  |
| `/mode`      | Switch working modes          | "I want direct tool access"                                 |

### Skills Used by Commands

| Command      | Skills Invoked                                                | Purpose                              |
| ------------ | ------------------------------------------------------------- | ------------------------------------ |
| `/start`     | `preview`                                                     | Show worktree plan                   |
| `/plan`      | `preview`, `progress`, `research`                             | Research patterns, write spec        |
| `/implement` | `preview`, `progress`, `routing`, `tdd-workflow`, `qa-checks` | Route to agents, enforce TDD, verify |
| `/ship`      | `preview`, `progress`, `git-operations`, `pr-operations`      | Commit, PR, CI/CodeRabbit            |
| `/guide`     | (none)                                                        | Informational only                   |
| `/mode`      | (none)                                                        | Immediate switch                     |

### What's Hidden from User

| Hidden Operation                  | Handled By   |
| --------------------------------- | ------------ |
| Git branching                     | `/start`     |
| Agent routing (code/ui/docs/eval) | `/implement` |
| Quality verification              | `/implement` |
| Git commits                       | `/ship`      |
| PR creation                       | `/ship`      |
| CI monitoring                     | `/ship`      |
| CodeRabbit integration            | `/ship`      |

---

## User Stories

### US1: Start New Feature

**As a** developer
**I want** to run `/start` and begin working
**So that** I don't have to think about git branching or worktrees

**Acceptance Criteria:**

- [ ] `/start` prompts for feature name if not provided
- [ ] Creates worktree at `../project-{feature-name}`
- [ ] Creates branch `feature/{feature-name}`
- [ ] Shows preview before execution
- [ ] Instructs user to restart session in new directory
- [ ] Suggests running `/plan` after restart

### US2: Conversational Planning (Define Mode)

**As a** developer
**I want** `/plan` to ask me questions until it understands what I want
**So that** I get a spec that accurately captures my requirements

**Acceptance Criteria:**

- [ ] `/plan` starts a conversation, not a one-shot command
- [ ] Asks clarifying questions until requirements are clear
- [ ] Shows preview of research/write/validate phases
- [ ] Generates spec files (requirements.md, design.md, tasks.md)
- [ ] Asks user to approve or request changes
- [ ] Only marks spec as approved when user confirms

### US3: Reconcile Mode (PR Feedback)

**As a** developer
**I want** `/plan` to automatically detect CodeRabbit comments and create a fix plan
**So that** I can address PR feedback systematically

**Acceptance Criteria:**

- [ ] `/plan` detects pending CodeRabbit comments from previous `/ship`
- [ ] Shows preview of analyze/plan phases
- [ ] Lists all CodeRabbit issues to address
- [ ] Creates fix plan with prioritized tasks
- [ ] Asks user to approve fix plan

### US4: Implement Approved Spec

**As a** developer
**I want** `/implement` to build everything from my approved spec
**So that** I don't have to think about which agent to use or when to verify

**Acceptance Criteria:**

- [ ] `/implement` requires an approved spec (from `/plan`)
- [ ] Shows preview with all stages, agents, sub-agents
- [ ] Routes to appropriate agents based on spec content
- [ ] Follows TDD (red → green) for code tasks
- [ ] Includes all verification (build, types, lint, tests, security)
- [ ] Shows progress during execution
- [ ] Reports completion with files changed and verification results

### US5: Ship with CI and CodeRabbit Integration

**As a** developer
**I want** `/ship` to handle everything from commit to PR approval
**So that** I don't have to manually monitor CI or CodeRabbit

**Acceptance Criteria:**

- [ ] Shows preview with commit/PR/CI/CodeRabbit stages
- [ ] Creates commit with conventional message
- [ ] Creates PR with generated description
- [ ] Waits for CI to pass (reports failure if not)
- [ ] Waits for CodeRabbit review
- [ ] If CodeRabbit has comments: recommends `/plan` to reconcile
- [ ] If clean: offers to merge
- [ ] On subsequent `/ship` after fixes: posts `@coderabbitai resolve`
- [ ] Handles CodeRabbit rate limits (wait or force merge option)

### US6: Guide Command

**As a** developer
**I want** to run `/guide` and understand my current status
**So that** I know where I am and what to do next

**Acceptance Criteria:**

- [ ] Shows current feature and branch
- [ ] Shows progress through flow (start → plan → implement → ship)
- [ ] Shows current task or pending action
- [ ] Suggests next action
- [ ] Lists available commands

### US7: Mode Switching

**As a** developer
**I want** to switch to basic mode for direct tool access
**So that** I can opt out of sub-agent orchestration when needed

**Acceptance Criteria:**

- [ ] `/mode` shows current mode
- [ ] `/mode basic` enables direct tool use, disables previews
- [ ] `/mode dev` restores full orchestration with previews
- [ ] Mode persists until changed

### US8: Preview Before Execution

**As a** developer
**I want** to see what will happen before any command executes
**So that** I can confirm, edit, or cancel

**Acceptance Criteria:**

- [ ] All action commands show preview (start, plan, implement, ship)
- [ ] Preview shows stages, agents, sub-agents, models
- [ ] User can: [Enter] Run, [e] Edit, [?] Details, [Esc] Cancel
- [ ] Basic mode skips previews

### US9: Progress Display During Execution

**As a** developer
**I want** to see progress as commands execute
**So that** I know what's happening and how long it will take

**Acceptance Criteria:**

- [ ] Progress display shows current stage
- [ ] Shows sub-agent status (running, complete, pending)
- [ ] Shows completion times for finished sub-agents
- [ ] Shows what's currently being worked on
- [ ] Shows overall progress bar

### US10: Task Tool Enforcement

**As a** system
**I want** all agent work to go through the Task tool
**So that** context stays isolated and efficient

**Acceptance Criteria:**

- [ ] Agents MUST spawn sub-agents via Task tool
- [ ] Direct tool use (Read, Edit, Bash) only in basic mode
- [ ] Agent files have CRITICAL EXECUTION REQUIREMENT blocks
- [ ] Orchestrator context stays under 10K tokens

---

## Functional Requirements

### REQ-1: Command Structure

The system has exactly 6 user-facing commands:

| Command      | Arguments                                | Modes             |
| ------------ | ---------------------------------------- | ----------------- |
| `/start`     | `[feature-name]` (optional, will prompt) | -                 |
| `/plan`      | None (conversational)                    | define, reconcile |
| `/implement` | None (uses approved spec)                | -                 |
| `/ship`      | None                                     | -                 |
| `/guide`     | None                                     | -                 |
| `/mode`      | `[mode-name]`                            | dev, basic        |

### REQ-2: Preview System

All action commands show preview before execution:

```text
┌─────────────────────────────────────────────────────────────┐
│  /command [context]                                         │
├─────────────────────────────────────────────────────────────┤
│  [Summary of what will happen]                              │
│                                                             │
│  STAGES/PHASES                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. STAGE NAME           sub-agent           Model       ││
│  │    □ Task description                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel           │
└─────────────────────────────────────────────────────────────┘
```

### REQ-3: Progress Display

During execution, show real-time progress:

```text
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: NAME                                  [STATUS]    │
│  ├─ ✓ completed-agent (Model)                   [time]      │
│  ├─ ● running-agent (Model)                     [RUNNING]   │
│  └─ ○ pending-agent (Model)                     [PENDING]   │
│                                                             │
│  Progress: ██████░░░░░░░░░░░░░░ 30%                         │
└─────────────────────────────────────────────────────────────┘
```

### REQ-4: Plan Command Flow

```text
/plan
    │
    ├── No pending CodeRabbit comments
    │   └── Define mode (conversational)
    │       ├── Ask questions until clear
    │       ├── Show preview
    │       ├── Generate spec
    │       └── Ask for approval
    │
    └── Has pending CodeRabbit comments
        └── Reconcile mode
            ├── List issues
            ├── Show preview
            ├── Create fix plan
            └── Ask for approval
```

### REQ-5: Implement Command Flow

```text
/implement
    │
    ├── Check for approved spec
    │   └── None found → "Run /plan first"
    │
    ├── Show preview (all stages, agents, sub-agents)
    │
    ├── On confirm → Execute stages
    │   ├── Route to appropriate agents
    │   ├── TDD for code (red → green)
    │   └── Final verification (build, types, lint, tests, security)
    │
    └── Report completion
```

### REQ-6: Ship Command Flow

```text
/ship
    │
    ├── Show preview
    │
    ├── Stage 1: Commit
    │   ├── change-analyzer → generate message
    │   └── git-executor → create commit
    │
    ├── Stage 2: Create PR
    │   ├── pr-analyzer → generate description
    │   └── git-executor → create PR via gh
    │
    ├── Stage 3: Wait for CI
    │   ├── Pass → Continue
    │   └── Fail → "Run /plan to fix"
    │
    └── Stage 4: Wait for CodeRabbit
        ├── Clean → "Ready to merge"
        ├── Has comments → "Run /plan to reconcile"
        └── Rate limited → "Wait or force merge?"

/ship (after reconcile)
    │
    ├── Post @coderabbitai resolve
    ├── Commit fixes
    ├── Push
    └── Wait for re-review
```

### REQ-7: Task Tool Enforcement

All agent files must include:

```markdown
> **CRITICAL EXECUTION REQUIREMENT**
>
> You MUST use the Task tool to spawn sub-agents for each phase.
> DO NOT execute phases directly in your context.
```

### REQ-8: Basic Mode

When `/mode basic` is active:

- Skip preview display
- Skip sub-agent orchestration
- Allow direct tool use
- Still follow spec if one exists

---

## Non-Functional Requirements

### NFR-1: Context Efficiency

- Orchestrator context < 10K tokens
- Sub-agents run in isolated contexts
- Pass context_summary (500 tokens max) between phases

### NFR-2: User Experience

- Previews are clear and scannable
- Progress updates in real-time
- Error messages are actionable

### NFR-3: Git Invisibility

- User never runs git commands directly
- All git operations are internal to commands
- Only exception: `/start` requires session restart (technical limitation)

---

## Scope

### In Scope

- 6 command files (start, plan, implement, ship, guide, mode)
- Preview system for action commands
- Progress display during execution
- Task tool enforcement in agent files
- CodeRabbit integration in ship workflow
- Basic mode for direct tool access

### Out of Scope

- PR review workflow (solo developer)
- Multiple concurrent features (one worktree at a time)
- Team collaboration features

---

## Removed Commands

| Command                               | Replacement                                      |
| ------------------------------------- | ------------------------------------------------ |
| `/build`                              | Renamed to `/implement`                          |
| `/code`, `/ui`, `/docs`, `/eval`      | Absorbed into `/implement` routing               |
| `/check`, `/verify`                   | Absorbed into `/implement`                       |
| `/fix`                                | Absorbed into `/plan` (reconcile) + `/implement` |
| `/git`                                | Absorbed into `/start` and `/ship`               |
| `/pr`                                 | Absorbed into `/ship`                            |
| `/debug`                              | Absorbed into `/plan`                            |
| `/help`                               | Renamed to `/guide`                              |
| `/context`                            | Renamed to `/mode`                               |
| `/refactor`, `/security`, `/research` | Internal workflows, not user commands            |

---

## Dependencies

| Dependency                    | Status   | Notes                |
| ----------------------------- | -------- | -------------------- |
| Phase 01 (Infrastructure)     | Complete | Templates, protocols |
| Phase 05 (Context Compaction) | Complete | Handoff format       |
| Phase 08 (Architecture V2)    | Complete | Agent definitions    |
| CodeRabbit                    | External | PR review service    |
| GitHub Actions                | External | CI service           |

---

## Success Metrics

| Metric                            | Target                         |
| --------------------------------- | ------------------------------ |
| User commands                     | 6 total                        |
| Preview shown before action       | 100% (except basic mode)       |
| Progress display during execution | 100%                           |
| Orchestrator context              | < 10K tokens                   |
| Git commands visible to user      | 0 (except restart instruction) |
