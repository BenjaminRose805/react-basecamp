# Design: Task Tool Binding

> **Status:** Draft
> **Created:** 2026-01-26
> **Updated:** 2026-01-26
> **Spec ID:** agent-opt-09

## Overview

This design specifies the 6-command user interface, preview system, progress display, and Task tool enforcement. The user interacts with simple commands; the system handles all complexity internally.

---

## Architecture

### System Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  USER COMMANDS (6)                    User entry points     │
│  /start  /plan  /implement  /ship  /guide  /mode            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SKILLS: preview, routing                                   │
│  Show execution plan → User confirms → Route to agent       │
│  (Preview skipped in basic mode)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT LAYER (7 agents, Opus orchestrators)                 │
│  plan, code, ui, docs, eval, check, git                     │
│  [Agents invoke skills to do work]                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SKILLS: tdd-workflow, qa-checks, research, patterns, etc.  │
│  Reusable procedures invoked by agents                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SUB-AGENT LAYER (via Task tool)                            │
│  Opus: researchers, analyzers                               │
│  Sonnet: writers, builders                                  │
│  Haiku: validators, checkers, executors                     │
└─────────────────────────────────────────────────────────────┘
```

### Layer Definitions

| Layer          | What It Is                                    | Examples                                                                  |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| **Commands**   | User entry points - the 6 things users invoke | `/start`, `/plan`, `/implement`, `/ship`, `/guide`, `/mode`               |
| **Skills**     | Reusable procedures - agents invoke these     | `preview`, `routing`, `research`, `tdd-workflow`, `qa-checks`, `progress` |
| **Agents**     | Workers - process commands using skills       | plan-agent, code-agent, ui-agent, git-agent                               |
| **Sub-Agents** | Isolated executors - spawned via Task tool    | code-researcher, code-writer, code-validator                              |

### Skill → Command Mapping

| Skill            | Used By Commands                 | Purpose                                    |
| ---------------- | -------------------------------- | ------------------------------------------ |
| `preview`        | /start, /plan, /implement, /ship | Show execution plan before action          |
| `routing`        | /implement                       | Detect spec type, select appropriate agent |
| `progress`       | /plan, /implement, /ship         | Real-time execution display                |
| `research`       | (via agents)                     | Find existing code, check conflicts        |
| `tdd-workflow`   | (via agents)                     | Red-Green-Refactor cycle                   |
| `qa-checks`      | (via agents)                     | Build, types, lint, tests, security        |
| `git-operations` | (via agents)                     | Branch, commit procedures                  |
| `pr-operations`  | (via agents)                     | PR lifecycle procedures                    |

---

## Command Designs

### `/start`

**Purpose:** Begin work on a new feature

**Flow:**

```text
User: /start [feature-name]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  If no feature-name provided:                               │
│  → Ask: "What feature are you starting work on?"            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /start user-authentication                              ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Creating new workspace for: user-authentication         ││
│  │                                                         ││
│  │ ACTIONS                                                 ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. CREATE WORKTREE                                  │ ││
│  │ │    Path: ../project-user-authentication             │ ││
│  │ │    Branch: feature/user-authentication              │ ││
│  │ │                                                     │ ││
│  │ │ 2. NEXT STEPS                                       │ ││
│  │ │    → Restart session in new worktree                │ ││
│  │ │    → Run /plan to begin designing                   │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit name  [Esc] Cancel                ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on confirm)
┌─────────────────────────────────────────────────────────────┐
│  Execute:                                                   │
│  1. git worktree add ../project-{name} -b feature/{name}    │
│  2. Display restart instructions                            │
└─────────────────────────────────────────────────────────────┘
```

**Output:**

```text
✓ Worktree created at ../project-user-authentication
✓ Branch feature/user-authentication created

Please restart your session in the new directory:
  cd ../project-user-authentication

Then run /plan to begin designing.
```

---

### `/plan`

**Purpose:** Conversational spec creation or PR feedback reconciliation

**Mode Detection:**

```text
/plan
  │
  ├── Check for pending CodeRabbit comments (from /ship state)
  │   │
  │   ├── Has comments → Reconcile mode
  │   │
  │   └── No comments → Define mode
```

#### Define Mode

**Flow:**

```text
User: /plan
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  CONVERSATION PHASE                                         │
│                                                             │
│  Claude: "What would you like to build?"                    │
│  User: "A login system with email/password"                 │
│                                                             │
│  Claude: "Let me understand better:                         │
│           1. Password requirements?                         │
│           2. JWT or server sessions?                        │
│           3. Password reset needed?                         │
│           4. Rate limiting?"                                │
│                                                             │
│  User: "8 char min, JWT, yes, yes"                          │
│                                                             │
│  Claude: "Got it. Here's what I'll do:"                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /plan user-authentication                               ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Mode: Define                                            ││
│  │ Feature: User authentication with email/password        ││
│  │                                                         ││
│  │ PHASES                                                  ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. RESEARCH         plan-researcher        Opus     │ ││
│  │ │    □ Search existing auth patterns                  │ ││
│  │ │    □ Check for conflicts                            │ ││
│  │ │    □ Identify integration points                    │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 2. WRITE            plan-writer            Sonnet   │ ││
│  │ │    □ Create requirements.md (EARS format)           │ ││
│  │ │    □ Create design.md (architecture)                │ ││
│  │ │    □ Create tasks.md (phased work items)            │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 3. VALIDATE         plan-validator         Haiku    │ ││
│  │ │    □ Verify EARS compliance                         │ ││
│  │ │    □ Check acceptance criteria                      │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ Output: specs/user-authentication/                      ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on confirm)
┌─────────────────────────────────────────────────────────────┐
│  PROGRESS DISPLAY                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PHASE 1: RESEARCH                          [COMPLETE]   ││
│  │ ├─ ✓ plan-researcher (Opus)                [3.2s]       ││
│  │ │   Found: session.ts, email.ts - no conflicts          ││
│  │                                                         ││
│  │ PHASE 2: WRITE                             [RUNNING]    ││
│  │ ├─ ● plan-writer (Sonnet)                  [RUNNING]    ││
│  │ │   Writing: specs/user-authentication/design.md        ││
│  │                                                         ││
│  │ PHASE 3: VALIDATE                          [PENDING]    ││
│  │ └─ ○ plan-validator (Haiku)                             ││
│  │                                                         ││
│  │ Progress: ██████████░░░░░░░░░░ 50%                      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on completion)
┌─────────────────────────────────────────────────────────────┐
│  APPROVAL REQUEST                                           │
│                                                             │
│  Spec created at specs/user-authentication/:                │
│                                                             │
│    requirements.md - 8 functional requirements              │
│    design.md       - JWT + Prisma architecture              │
│    tasks.md        - 4 phases, 12 tasks                     │
│                                                             │
│  Key decisions:                                             │
│    • JWT with 1hr expiry, refresh tokens                    │
│    • Prisma for user storage                                │
│    • Rate limit: 5 attempts per 15 min                      │
│                                                             │
│  Does this spec look good? Any changes needed?              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (user approves)
┌─────────────────────────────────────────────────────────────┐
│  Spec approved. Run /implement when ready to build.         │
└─────────────────────────────────────────────────────────────┘
```

#### Reconcile Mode

**Flow:**

```text
User: /plan
         │
         ▼ (CodeRabbit comments detected)
┌─────────────────────────────────────────────────────────────┐
│  Claude: "I see CodeRabbit left 3 comments on PR #42.       │
│           Let me create a fix plan."                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /plan (reconcile PR #42)                                ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Mode: Reconcile                                         ││
│  │ PR: #42 - Add user authentication                       ││
│  │ CodeRabbit comments: 3                                  ││
│  │                                                         ││
│  │ ISSUES TO ADDRESS                                       ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. [Security] Use bcrypt, not SHA256                │ ││
│  │ │ 2. [Performance] Add index on email column          │ ││
│  │ │ 3. [Style] Use early returns in validatePassword()  │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ PHASES                                                  ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. ANALYZE          plan-researcher        Opus     │ ││
│  │ │    □ Review each CodeRabbit comment                 │ ││
│  │ │    □ Identify affected files                        │ ││
│  │ │    □ Assess fix complexity                          │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 2. PLAN             plan-writer            Sonnet   │ ││
│  │ │    □ Create fix plan with tasks                     │ ││
│  │ │    □ Prioritize by severity                         │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

### `/implement`

**Purpose:** Execute approved spec (signals user approval)

**Flow:**

```text
User: /implement
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Check for approved spec                                    │
│  ├── Found → Continue                                       │
│  └── Not found → "Run /plan first to create a spec"         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /implement user-authentication                          ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Spec: specs/user-authentication/ (approved)             ││
│  │ Tasks: 12 across 4 phases                               ││
│  │ TDD: Enabled (red → green → refactor)                   ││
│  │                                                         ││
│  │ STAGE 1: DATABASE SCHEMA                                ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ Agent: code-agent                                   │ ││
│  │ │                                                     │ ││
│  │ │ 1. RESEARCH         code-researcher        Opus     │ ││
│  │ │    □ Find existing DB patterns                      │ ││
│  │ │    □ Check Prisma schema                            │ ││
│  │ │                                                     │ ││
│  │ │ 2. TDD-RED          code-writer            Sonnet   │ ││
│  │ │    □ Write failing tests for User model             │ ││
│  │ │                                                     │ ││
│  │ │ 3. TDD-GREEN        code-writer            Sonnet   │ ││
│  │ │    □ Implement User model + migration               │ ││
│  │ │                                                     │ ││
│  │ │ 4. VALIDATE         code-validator         Haiku    │ ││
│  │ │    □ Verify tests pass                              │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ STAGE 2: AUTH MUTATIONS                                 ││
│  │ └─ [Same pattern]                                       ││
│  │                                                         ││
│  │ STAGE 3: PASSWORD RESET                                 ││
│  │ └─ [Same pattern]                                       ││
│  │                                                         ││
│  │ STAGE 4: FINAL VERIFICATION                             ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ Agent: check-agent (parallel)              Haiku    │ ││
│  │ │    □ build-checker                                  │ ││
│  │ │    □ type-checker                                   │ ││
│  │ │    □ lint-checker                                   │ ││
│  │ │    □ test-runner                                    │ ││
│  │ │    □ security-scanner                               │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ Tools: cclsp, context7, next-devtools                   ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on confirm)
┌─────────────────────────────────────────────────────────────┐
│  PROGRESS DISPLAY                                           │
│  [Real-time updates as stages execute]                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on completion)
┌─────────────────────────────────────────────────────────────┐
│  Implementation complete!                                   │
│                                                             │
│  Files created:                                             │
│    • prisma/migrations/..._add_user.sql                     │
│    • src/lib/user.ts                                        │
│    • src/lib/auth.ts                                        │
│    • src/server/routers/auth.ts                             │
│    • + 5 test files                                         │
│                                                             │
│  Verification:                                              │
│    ✓ Build:    PASS                                         │
│    ✓ Types:    PASS (0 errors)                              │
│    ✓ Lint:     PASS (0 errors)                              │
│    ✓ Tests:    PASS (23/23, 87% coverage)                   │
│    ✓ Security: PASS                                         │
│                                                             │
│  Run /ship when ready to create PR.                         │
└─────────────────────────────────────────────────────────────┘
```

**Routing Logic:**

```text
/implement routes based on spec content:
    │
    ├── Backend tasks (tRPC, Prisma, API) → code-agent
    ├── Frontend tasks (React, components) → ui-agent
    ├── Documentation tasks → docs-agent
    ├── Evaluation tasks → eval-agent
    └── Mixed → implement workflow (code → ui)
```

---

### `/ship`

**Purpose:** Commit, create PR, wait for CI and CodeRabbit

**Flow:**

```text
User: /ship
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /ship                                                   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Feature: user-authentication                            ││
│  │ Branch: feature/user-authentication                     ││
│  │ Changes: 8 files, +342 -12                              ││
│  │                                                         ││
│  │ STAGES                                                  ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. COMMIT                                           │ ││
│  │ │    Agent: git-agent                                 │ ││
│  │ │    ├─ change-analyzer (Sonnet) - Generate message   │ ││
│  │ │    └─ git-executor (Haiku) - Create commit          │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 2. CREATE PR                                        │ ││
│  │ │    Agent: git-agent                                 │ ││
│  │ │    ├─ pr-analyzer (Sonnet) - Generate description   │ ││
│  │ │    └─ git-executor (Haiku) - Create PR via gh CLI   │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 3. WAIT FOR CI                                      │ ││
│  │ │    □ Monitor GitHub Actions                         │ ││
│  │ │    □ Report pass/fail                               │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 4. WAIT FOR CODERABBIT                              │ ││
│  │ │    □ Monitor CodeRabbit review                      │ ││
│  │ │    □ Report comments or approval                    │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit  [Esc] Cancel                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (on confirm)
┌─────────────────────────────────────────────────────────────┐
│  PROGRESS DISPLAY                                           │
│  [Shows each stage as it completes]                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  OUTCOME HANDLING                                           │
│                                                             │
│  CI passed + CodeRabbit clean:                              │
│  → "PR #42 is ready to merge. Merge now? (yes/no)"          │
│                                                             │
│  CI passed + CodeRabbit has comments:                       │
│  → "CodeRabbit found 3 issues. Run /plan to reconcile."     │
│                                                             │
│  CI failed:                                                 │
│  → "CI failed: [error]. Run /plan to fix."                  │
│                                                             │
│  CodeRabbit rate limited:                                   │
│  → "CodeRabbit hit limit. Wait or force merge? (wait/force)"│
└─────────────────────────────────────────────────────────────┘
```

**Second Ship (after reconcile):**

```text
User: /ship (after fixing CodeRabbit comments)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ /ship (fixes for PR #42)                                ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ PR: #42 (existing)                                      ││
│  │ Fixes: 3 CodeRabbit comments addressed                  ││
│  │                                                         ││
│  │ STAGES                                                  ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ 1. RESOLVE THREADS                                  │ ││
│  │ │    □ Post @coderabbitai resolve comment             │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 2. COMMIT & PUSH                                    │ ││
│  │ │    □ Commit fixes                                   │ ││
│  │ │    □ Push to PR branch                              │ ││
│  │ ├─────────────────────────────────────────────────────┤ ││
│  │ │ 3. WAIT FOR RE-REVIEW                               │ ││
│  │ │    □ Wait for CI                                    │ ││
│  │ │    □ Wait for CodeRabbit re-review                  │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ [Enter] Run  [e] Edit  [Esc] Cancel                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

### `/guide`

**Purpose:** Show status, help, and next action

**No preview needed - informational only**

```text
User: /guide
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Guide                                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CURRENT STATUS                                             │
│  Feature: user-authentication                               │
│  Branch: feature/user-authentication                        │
│                                                             │
│  PROGRESS                                                   │
│  ✓ /start     Worktree created                              │
│  ✓ /plan      Spec approved                                 │
│  ✓ /implement Complete (12/12 tasks)                        │
│  ◉ /ship      Waiting for CodeRabbit                        │
│                                                             │
│  SUGGESTED ACTION                                           │
│  CodeRabbit left 3 comments. Run /plan to reconcile.        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  COMMANDS                                                   │
│  /start     Begin new feature (worktree + branch)           │
│  /plan      Design spec or reconcile PR feedback            │
│  /implement Build approved spec                             │
│  /ship      Commit + PR + CI + CodeRabbit                   │
│  /guide     This help                                       │
│  /mode      Switch modes (current: dev)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### `/mode`

**Purpose:** Switch working modes

**No preview needed - immediate switch**

```text
User: /mode

Current mode: dev

Available modes:
  dev   - Full orchestration with previews (default)
  basic - Direct tool use, skip sub-agents
```

```text
User: /mode basic

Switched to basic mode.

  Sub-agent orchestration: DISABLED
  Previews: DISABLED
  Direct tool use: ENABLED

Run /mode dev to restore full orchestration.
```

---

## Task Tool Enforcement

### Agent MUST Directive

Add to TOP of Instructions section in ALL agent files:

````markdown
## Instructions

> **CRITICAL EXECUTION REQUIREMENT**
>
> You MUST use the Task tool to spawn sub-agents for each phase.
> DO NOT execute phases directly in your context.
> Each sub-agent runs in an ISOLATED context window.
>
> **Anti-patterns (DO NOT DO):**
>
> - Using Read, Grep, Glob directly (spawn researcher)
> - Using Edit, Write directly (spawn writer)
> - Using Bash directly (spawn validator/executor)
> - Using MCP tools directly (spawn appropriate sub-agent)
>
> **Required pattern:**
>
> ```
> Task({ subagent_type: "general-purpose", ... })
> ```

[Rest of instructions...]
````

### Tool-to-Profile Mapping

| Profile     | Allowed Tools                                         | Use Case              |
| ----------- | ----------------------------------------------------- | --------------------- |
| read-only   | Read, Glob, Grep, mcp**cclsp**find*, mcp**cclsp**get* | Code review, analysis |
| research    | read-only + WebFetch, WebSearch, mcp**context7**\*    | Documentation lookup  |
| writer      | research + Write, Edit, Bash, mcp**cclsp**rename\_\*  | Implementation        |
| full-access | All tools including Task                              | Orchestration         |

---

## State Management

### Session State

Track across commands:

```json
{
  "feature": "user-authentication",
  "branch": "feature/user-authentication",
  "spec_path": "specs/user-authentication/",
  "spec_approved": true,
  "pr_number": 42,
  "coderabbit_comments": [
    { "id": 1, "body": "Use bcrypt...", "resolved": false }
  ],
  "flow_progress": {
    "start": "complete",
    "plan": "complete",
    "implement": "complete",
    "ship": "waiting_coderabbit"
  }
}
```

### CodeRabbit Comment Detection

On `/plan`, check for pending comments:

```text
gh api repos/{owner}/{repo}/pulls/{pr}/comments
  → Filter for coderabbitai[bot] author
  → Filter for unresolved threads
  → If any found → Reconcile mode
```

---

## File Changes

### Commands to Create

| File                            | Purpose             |
| ------------------------------- | ------------------- |
| `.claude/commands/start.md`     | New command         |
| `.claude/commands/implement.md` | Replaces build.md   |
| `.claude/commands/guide.md`     | Replaces help.md    |
| `.claude/commands/mode.md`      | Replaces context.md |

### Commands to Update

| File                       | Changes                                 |
| -------------------------- | --------------------------------------- |
| `.claude/commands/plan.md` | Add conversational flow, reconcile mode |
| `.claude/commands/ship.md` | Add CI/CodeRabbit integration           |

### Commands to Remove/Archive

| File         | Reason                          |
| ------------ | ------------------------------- |
| `build.md`   | Renamed to implement.md         |
| `code.md`    | Absorbed into implement routing |
| `ui.md`      | Absorbed into implement routing |
| `docs.md`    | Absorbed into implement routing |
| `eval.md`    | Absorbed into implement routing |
| `check.md`   | Absorbed into implement         |
| `git.md`     | Absorbed into start/ship        |
| `pr.md`      | Absorbed into ship              |
| `debug.md`   | Absorbed into plan              |
| `help.md`    | Renamed to guide.md             |
| `context.md` | Renamed to mode.md              |

### Agents to Update

| File              | Changes                                  |
| ----------------- | ---------------------------------------- |
| All 7 agent files | Add CRITICAL EXECUTION REQUIREMENT block |

### CLAUDE.md Updates

Replace command documentation with new 6-command structure.

---

## Dependencies

| Component      | Required | Purpose                          |
| -------------- | -------- | -------------------------------- |
| Task tool      | Built-in | Sub-agent spawning               |
| gh CLI         | Required | PR creation, CodeRabbit comments |
| git            | Required | Worktree, commit                 |
| CodeRabbit     | External | PR review                        |
| GitHub Actions | External | CI                               |
