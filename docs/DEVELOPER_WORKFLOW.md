# Developer Workflow Guide

A comprehensive guide for implementing features using the AI-assisted development workflow with TDD, SDD, EDD, and BDD methodologies.

---

## Table of Contents

1. [Overview](#overview)
2. [The 6 Commands](#the-6-commands)
3. [Your Role as Developer](#your-role-as-developer)
4. [The Complete Workflow](#the-complete-workflow)
5. [MCP Server Interactions](#mcp-server-interactions)
6. [Feature Implementation Examples](#feature-implementation-examples)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This workflow combines four methodologies:

| Methodology               | Principle                     | When Used             |
| ------------------------- | ----------------------------- | --------------------- |
| **SDD** (Spec-Driven)     | Specs before code             | All features          |
| **TDD** (Test-Driven)     | Tests before implementation   | All features          |
| **EDD** (Eval-Driven)     | Evaluations for LLM behavior  | LLM features only     |
| **BDD** (Behavior-Driven) | User stories drive acceptance | Integrated into specs |

### The AI-Human Partnership

```text
┌─────────────────────────────────────────────────────────────┐
│  YOU (Developer/Architect)                                  │
│  • Define what to build                                     │
│  • Review and approve specs                                 │
│  • Make architectural decisions                             │
│  • Approve PRs and deployments                              │
│  • Handle edge cases AI can't resolve                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AI AGENTS (Executor)                                       │
│  • Research existing code                                   │
│  • Write specs, tests, code                                 │
│  • Run validations                                          │
│  • Create PRs                                               │
│  • Report issues for your decision                          │
└─────────────────────────────────────────────────────────────┘
```

---

## The 6 Commands

The entire workflow uses just **6 user-facing commands**. Git operations are handled automatically.

| Command      | Purpose                     | What Happens                                       |
| ------------ | --------------------------- | -------------------------------------------------- |
| `/start`     | Begin work on a feature     | Creates worktree + branch, outputs restart info    |
| `/plan`      | Design spec or reconcile PR | Conversational spec creation or CodeRabbit fixes   |
| `/implement` | Build the approved spec     | Routes to agents, TDD workflow, final verification |
| `/ship`      | Ship current work           | Commit → PR → CI → CodeRabbit review               |
| `/guide`     | Status and help             | Shows progress and suggests next action            |
| `/mode`      | Switch working modes        | `dev` (full orchestration) or `basic` (direct)     |

### Git is Invisible

Users never run git commands directly. The system handles all version control:

- `/start` creates worktree and branch automatically
- `/ship` handles commit, push, PR creation, CI monitoring, and CodeRabbit review
- `/plan` (reconcile mode) addresses CodeRabbit feedback

### Standard Development Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  1. START                                                   │
│     /start [feature]  → Create worktree + branch            │
│     (Restart session in new worktree)                       │
├─────────────────────────────────────────────────────────────┤
│  2. PLAN                                                    │
│     /plan             → Conversational spec creation        │
│     Preview → Confirm → Generate spec → Ask approval        │
├─────────────────────────────────────────────────────────────┤
│  3. IMPLEMENT                                               │
│     /implement        → Build approved spec with TDD        │
│     Preview → Confirm → Execute → Final verification        │
├─────────────────────────────────────────────────────────────┤
│  4. SHIP                                                    │
│     /ship             → Commit → PR → CI → CodeRabbit       │
│     If clean: offer merge                                   │
│     If comments: run /plan to reconcile                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Your Role as Developer

### Decision Points (Where You're Needed)

| Phase         | Your Action                                   | AI Waits For             |
| ------------- | --------------------------------------------- | ------------------------ |
| **Start**     | Tell AI what feature to build                 | Feature name/description |
| **Plan**      | Review spec, approve or request changes       | Spec approval            |
| **Implement** | Resolve blockers, answer clarifying questions | Decisions on ambiguity   |
| **Ship**      | Review PR, handle CodeRabbit feedback         | PR approval              |

### How to Give Instructions

**Good instructions:**

```text
Build the Prompt Manager feature from the design docs at ../docs/specs/prompt-manager.md
```

**Better instructions:**

```text
Build Prompt Manager:
- Focus on basic phase features only (no array/object variables)
- Use TipTap for the rich text editor
- Skip auth (single user for now)
```

### Monitoring Progress

1. **Claude Code terminal** - See agent output in real-time
2. **Specs directory** - Track specs at `specs/`
3. **Linear** - Track issues and link PRs
4. **GitHub** - Review PRs and CI status

---

## The Complete Workflow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE IMPLEMENTATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   YOU        │  "Build the Prompt Manager feature"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: START                                                              │
│  Command: /start prompt-manager                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Creates worktree and branch:                                                │
│  ├── Worktree: ../project-prompt-manager/                                    │
│  ├── Branch: feature/prompt-manager                                          │
│  └── Outputs: Restart instructions for new worktree                          │
│                                                                              │
│  >> Restart Claude Code in the new worktree to continue                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PLAN (SDD)                                                         │
│  Command: /plan                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Conversational spec creation:                                               │
│  ├── AI asks clarifying questions                                            │
│  ├── Gathers requirements                                                    │
│  ├── Shows preview of spec generation plan                                   │
│  └── Generates spec files in specs/prompt-manager/                           │
│                                                                              │
│  Sub-agents:                                                                 │
│  ├── plan-researcher (Opus) - Find existing patterns                         │
│  ├── plan-writer (Sonnet) - Generate spec documents                          │
│  └── plan-validator (Haiku) - Verify EARS compliance                         │
│                                                                              │
│  Output:                                                                     │
│  ├── specs/prompt-manager/requirements.md                                    │
│  ├── specs/prompt-manager/design.md                                          │
│  └── specs/prompt-manager/tasks.md                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review spec files
│              │  Approve or request changes
└──────┬───────┘
       │ (after approval)
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: IMPLEMENT (TDD)                                                    │
│  Command: /implement                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Routes to appropriate agent(s) based on spec content:                       │
│  ├── Backend (tRPC, Prisma, API) → code-agent                                │
│  ├── Frontend (React, components) → ui-agent                                 │
│  ├── Documentation → docs-agent                                              │
│  ├── LLM evaluations → eval-agent                                            │
│  └── Mixed (backend + frontend) → code-agent → ui-agent                      │
│                                                                              │
│  TDD Workflow (per task):                                                    │
│  ├── RED: Write failing tests                                                │
│  ├── GREEN: Implement until tests pass                                       │
│  └── REFACTOR: Clean up while keeping tests green                            │
│                                                                              │
│  Final Verification (parallel):                                              │
│  ├── build-checker (Haiku) - pnpm build                                      │
│  ├── type-checker (Haiku) - pnpm typecheck                                   │
│  ├── lint-checker (Haiku) - pnpm lint                                        │
│  ├── test-runner (Haiku) - pnpm test:run                                     │
│  └── security-scanner (Haiku) - vulnerability scan                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review implementation
│              │  Test in browser (pnpm dev → localhost:3000)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: SHIP                                                               │
│  Command: /ship                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Stage 1: COMMIT                                                             │
│  ├── change-analyzer (Sonnet) - Analyze changes, draft message               │
│  └── git-executor (Haiku) - Create commit                                    │
│                                                                              │
│  Stage 2: CREATE PR                                                          │
│  ├── pr-analyzer (Sonnet) - Draft PR title and summary                       │
│  └── git-executor (Haiku) - Push and create PR via gh CLI                    │
│                                                                              │
│  Stage 3: WAIT FOR CI                                                        │
│  └── Poll GitHub Actions until complete                                      │
│                                                                              │
│  Stage 4: WAIT FOR CODERABBIT                                                │
│  └── Poll for CodeRabbit review comments                                     │
│                                                                              │
│  Outcomes:                                                                   │
│  ├── Clean: Offer to merge PR                                                │
│  └── Comments: Recommend /plan to reconcile                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review PR in GitHub
│              │  If CodeRabbit comments: /plan to reconcile
│              │  If clean: approve and merge
└──────────────┘
```

---

## MCP Server Interactions

### Essential MCP Servers

| Server         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| **cclsp**      | TypeScript LSP - code intelligence, symbols, types |
| **playwright** | Browser automation - E2E tests, screenshots        |

### Conditional MCP Servers

| Server            | Purpose                       | Keep When                 |
| ----------------- | ----------------------------- | ------------------------- |
| **next-devtools** | Next.js dev tools, errors     | Using Next.js 16+         |
| **context7**      | Live docs lookup              | Frequent library usage    |
| **shadcn**        | Component registry            | Using shadcn/ui           |
| **figma**         | Design system, frames, tokens | Design system integration |
| **sentry**        | Production errors, Seer AI    | Production error tracking |
| **linear**        | Issue tracking, link PRs      | Using Linear for issues   |

### CLI Tools (No MCP Required)

| Tool        | Usage             | Replaces      |
| ----------- | ----------------- | ------------- |
| `gh` CLI    | GitHub operations | github MCP    |
| `pnpm test` | Run tests         | vitest MCP    |
| File-based  | Specs in `specs/` | spec-workflow |

### 1. cclsp (TypeScript LSP)

**How AI uses it:**

- Go-to-definition, find references
- Real-time type errors as it codes
- Rename symbols across codebase

**Your interactions:**

- Invisible to you (AI uses it internally)
- Ensures type-safe code

### 2. Playwright (Browser Automation)

**How AI uses it:**

- E2E testing during `/implement`
- Visual verification of UI components
- Screenshot comparison

**Your interactions:**

- Run E2E tests manually: `pnpm test:e2e`
- View test UI: `pnpm test:e2e --ui`

### 3. context7 (Library Documentation)

**How AI uses it:**

- Looks up current API documentation before using libraries
- Prevents hallucinated or deprecated APIs

**Your interactions:**

- Generally invisible to you
- Ensures AI uses correct Prisma, tRPC, React APIs

### 4. shadcn/ui (Component Registry)

**How AI uses it:**

- Searches for existing components before building custom
- Gets correct component APIs (no hallucination)
- Finds pre-built blocks (login forms, dashboards)

**Your interactions:**

- Ask AI what shadcn components are available
- Request specific components: "Use the shadcn DataTable for the prompt list"

### 5. Figma (Design)

**How AI uses it:**

- Extracts design tokens, spacing, colors
- Matches implementation to design specs

**Your interactions:**

- Share Figma file URLs with AI
- Select frames in Figma for AI to reference
- Review UI against designs

### 6. Next.js DevTools

**How AI uses it:**

- Gets build errors in real-time
- Checks dev server status

**Your interactions:**

- Run `pnpm dev` to start dev server
- AI detects and fixes errors automatically

### 7. Linear (Issue Tracking)

**How AI uses it:**

- Checks for existing related issues before creating specs
- Links PRs to issues with `Fixes BAS-XXX`
- Updates issue status as work progresses

**Your interactions:**

- Create issues for features you want built
- Review AI-created issues
- Prioritize backlog

### 8. Sentry (Production Errors)

**How AI uses it:**

- Checks Sentry for production errors during investigation
- Looks for security-related error patterns

**Your interactions:**

- Monitor Sentry dashboard for new issues
- Tell AI to investigate specific errors

---

## Feature Implementation Examples

### Example 1: Prompt Manager (CRUD - No LLM)

```bash
# 1. Start the feature
/start prompt-manager
# → Restart in new worktree

# 2. Plan the spec
/plan
# → Answer questions, review spec, approve

# 3. Implement with TDD
/implement
# → Watch TDD workflow, review at localhost:3000

# 4. Ship to PR
/ship
# → Review PR, handle CodeRabbit if needed

# 5. Merge in GitHub
```

### Example 2: Agent Builder (With LLM - Needs Evals)

```bash
# 1. Start
/start agent-builder

# 2. Plan (mention LLM features)
/plan
# → "This needs evaluations for tool selection accuracy"

# 3. Implement (will include evals for LLM features)
/implement
# → Runs eval-agent for LLM touchpoints
# → Runs code-agent for backend
# → Runs ui-agent for frontend

# 4. Run evals separately if needed
pnpm eval agent-builder

# 5. Ship
/ship
```

### Example 3: Bug Fix

```bash
# 1. Start with fix/ prefix
/start fix/prompt-variable-persistence

# 2. Plan (reconcile mode if from PR feedback)
/plan
# → Investigates issue, creates fix plan

# 3. Implement fix
/implement

# 4. Ship
/ship
```

### Example 4: Parallel Development with Worktrees

```bash
# Terminal 1: Feature A
/start prompt-manager
cd ../project-prompt-manager
/plan
/implement

# Terminal 2: Feature B (truly parallel!)
/start agent-builder
cd ../project-agent-builder
/plan
/implement

# When ready, ship each independently
/ship
```

---

## Dashboard and Tool URLs

| Tool              | URL/Command                             | Purpose                    |
| ----------------- | --------------------------------------- | -------------------------- |
| **Next.js Dev**   | [localhost:3000](http://localhost:3000) | Your application           |
| **Vitest UI**     | `pnpm test:ui`                          | Interactive test runner    |
| **Playwright UI** | `pnpm test:e2e --ui`                    | E2E test runner            |
| **Prisma Studio** | `pnpm prisma studio`                    | Database browser           |
| **Specs**         | `specs/`                                | File-based spec management |

---

## Troubleshooting

### Tests Not Running

```bash
# Run tests directly
pnpm test:run

# Check for issues
pnpm typecheck
```

### context7 Not Finding Docs

```bash
# Verify it's running
claude mcp list | grep context7

# Test manually
# Ask AI: "Look up the Prisma findMany API using context7"
```

### Build Failures

```bash
# Check build output
pnpm build

# Common fixes
pnpm typecheck   # Fix type errors first
pnpm lint        # Then lint errors
```

### Linear Not Linking Issues

```bash
# Check Linear MCP authentication
# May need to re-authenticate via Linear OAuth
```

---

## Quick Reference

### Commands

| Command      | Purpose                        |
| ------------ | ------------------------------ |
| `/start`     | Begin work (worktree + branch) |
| `/plan`      | Design spec or reconcile PR    |
| `/implement` | Build approved spec with TDD   |
| `/ship`      | Commit → PR → CI → CodeRabbit  |
| `/guide`     | Status and help                |
| `/mode`      | Switch dev/basic mode          |

### Agents (Internal)

| Agent       | Domain                | Routes From   |
| ----------- | --------------------- | ------------- |
| plan-agent  | Specifications        | /plan         |
| code-agent  | Backend (TDD)         | /implement    |
| ui-agent    | Frontend              | /implement    |
| docs-agent  | Documentation         | /implement    |
| eval-agent  | LLM evaluations       | /implement    |
| check-agent | Quality verification  | /implement    |
| git-agent   | Version control + PRs | /start, /ship |

### Build Order (from design docs)

1. **Prompt Manager** - Foundation (CRUD)
2. **Agent Builder** - Depends on prompts (LLM)
3. **Work Item Manager** - Depends on agents (CRUD)
4. **Workflow Designer** - Depends on work items, agents (LLM)
5. **Execution Engine** - Depends on workflows (LLM)
6. **Task Queue** - Depends on execution (CRUD)
7. **Home Dashboard** - Depends on all above (CRUD)

---

## Related Documents

- [CLAUDE.md](../CLAUDE.md) - Project configuration and agent routing
- [MCP_SETUP.md](./MCP_SETUP.md) - MCP server installation
- [Design Docs](../../docs/) - Source design documentation
