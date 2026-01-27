# My App

Next.js application with AI-assisted development via specialized agents.

> **📖 New to this workflow?** See the [Developer Workflow Guide](docs/DEVELOPER_WORKFLOW.md) for a comprehensive walkthrough of TDD, SDD, EDD methodologies, MCP server interactions, and your role as the developer/architect.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly (e.g., "What framework is this?" or "Where is the config?"). But any actual work MUST go through an agent.

---

## CRITICAL: Command Execution Pattern

> **When executing any command (`/plan`, `/implement`, `/ship`):**
>
> 1. **Read the agent file first** - Load `.claude/agents/{agent}-agent.md`
> 2. **Follow the CRITICAL EXECUTION REQUIREMENT** in that file
> 3. **Use the Task tool to spawn sub-agents** - NEVER execute directly
> 4. **Pass context_summary between phases** - NOT raw findings
>
> **Anti-patterns (DO NOT DO):**
>
> - Using Read, Grep, Glob directly → spawn researcher sub-agent
> - Using Edit, Write directly → spawn writer sub-agent
> - Using Bash directly → spawn validator/executor sub-agent
>
> **Required pattern:**
>
> ```typescript
> Task({
>   subagent_type: "general-purpose",
>   description: "Research/Write/Validate [feature]",
>   prompt: "...",
>   model: "opus" | "sonnet" | "haiku",
> });
> ```
>
> **Quick Reference:** [.claude/sub-agents/QUICK-REFERENCE.md](.claude/sub-agents/QUICK-REFERENCE.md)

---

## Architecture Overview

The system uses a 5-layer architecture with preview and routing:

```
┌─────────────────────────────────────────────────────────────┐
│  COMMANDS (6)                      User entry points        │
│  /start  /plan  /implement  /ship  /guide  /mode            │
├─────────────────────────────────────────────────────────────┤
│  PREVIEW LAYER                                              │
│  Show execution plan → User confirms → Execute              │
│  (Skipped in basic mode)                                    │
├─────────────────────────────────────────────────────────────┤
│  ROUTING LAYER                                              │
│  Analyze spec → Select agent(s) → Orchestrate               │
├─────────────────────────────────────────────────────────────┤
│  AGENTS (7)            Workers with MCP access              │
│  plan, code, ui, docs, eval, check, git                     │
├─────────────────────────────────────────────────────────────┤
│  SUB-AGENTS (11)       Isolated context execution           │
│  7 consolidated + 4 unique templates                        │
│  Dynamic sizing: 1-7 sub-agents per task                    │
│  63% reduction from 37 domain-specific templates            │
├─────────────────────────────────────────────────────────────┤
│  SKILLS (13)           Reusable procedures                  │
│  research, qa-checks, tdd-workflow, coding-standards,       │
│  eval-harness, backend-patterns, frontend-patterns,         │
│  security-patterns, git-operations, pr-operations,          │
│  routing, preview, progress                                 │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Agent System

For complex tasks, agents can spawn isolated sub-agents via the Task tool. This prevents context overflow by running each phase in a fresh context window.

**Architecture:** 11 consolidated templates (63% reduction from 37 domain-specific)

```
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator (analyzes complexity, selects templates)      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ mode=code   │ ───► │ mode=code   │ ───► │ mode=code   │
│ (isolated)  │      │ (isolated)  │      │ (isolated)  │
└─────────────┘      └─────────────┘      └─────────────┘
```

**Dynamic Sizing:** 1-7 sub-agents spawned based on task complexity

| Task Complexity | Sub-Agents | Pattern                         |
| --------------- | ---------- | ------------------------------- |
| Simple edit     | 1          | writer only                     |
| Standard CRUD   | 3          | researcher → writer → validator |
| Complex feature | 5-7        | Full orchestration              |

**Documentation:** [.claude/sub-agents/README.md](.claude/sub-agents/README.md)

| Component  | Purpose                                                           |
| ---------- | ----------------------------------------------------------------- |
| Templates  | 7 consolidated + 4 unique = 11 total (domain, quality, git, code) |
| Profiles   | read-only, research, writer, full-access                          |
| Protocols  | Handoff format, orchestration patterns                            |
| Heuristics | Dynamic sizing decision tree (lib/sizing-heuristics.md)           |

---

## Commands (6)

The entire workflow uses just 6 commands. Git operations are invisible to the user.

| Command      | Purpose                              | Routes To                    |
| ------------ | ------------------------------------ | ---------------------------- |
| `/start`     | Begin work (worktree + branch)       | git-agent                    |
| `/plan`      | Design spec or reconcile PR feedback | plan-agent                   |
| `/implement` | Build approved spec                  | Routing → code/ui/docs/eval  |
| `/ship`      | Commit + PR + CI + CodeRabbit        | git-agent → check-agent      |
| `/guide`     | Status, help, orientation            | (informational, no agent)    |
| `/mode`      | Switch working modes (dev/basic)     | (immediate effect, no agent) |

### Git is Invisible

Users never run git commands directly. The system handles all version control:

- `/start` creates worktree and branch automatically
- `/ship` handles commit, push, PR creation, CI monitoring, and CodeRabbit review
- `/plan` (reconcile mode) addresses CodeRabbit feedback

### Command Details

**`/start [feature-name]`** - Begin work on a new feature

- Creates worktree at `../project-{name}`
- Creates branch `feature/{name}`
- Outputs restart instructions

**`/plan`** - Conversational spec creation or PR feedback reconciliation

- **Define mode** (no CodeRabbit comments): Ask questions → generate spec → ask approval
- **Reconcile mode** (has CodeRabbit comments): Analyze feedback → create fix plan

**`/implement`** - Execute approved spec

- Requires approved spec from `/plan`
- Routes to appropriate agent(s) based on spec content
- Uses TDD (red → green → refactor)
- Runs final verification (build, types, lint, tests, security)

**`/ship`** - Ship current work

- Stage 1: Commit (change-analyzer → git-executor)
- Stage 2: Create PR (pr-analyzer → git-executor)
- Stage 3: Wait for CI (poll GitHub Actions)
- Stage 4: Wait for CodeRabbit (poll for comments)
- Outcomes: Clean → offer merge | Comments → recommend `/plan` | CI fail → recommend `/plan`

**`/guide`** - Status and help

- Shows current feature and branch
- Shows progress (start → plan → implement → ship)
- Suggests next action
- Lists available commands

**`/mode [dev|basic]`** - Switch working modes

- `dev` (default): Full orchestration with previews
- `basic`: Direct tool use, skip sub-agents and previews

### Implement Routing

`/implement` automatically routes based on spec content:

| Spec Contains                      | Routes To                      |
| ---------------------------------- | ------------------------------ |
| Backend tasks (tRPC, Prisma, API)  | code-agent                     |
| Frontend tasks (React, components) | ui-agent                       |
| Documentation tasks                | docs-agent                     |
| Evaluation tasks                   | eval-agent                     |
| Mixed (backend + frontend)         | implement workflow (code → ui) |

---

## Preview System

Before executing action commands (`/start`, `/plan`, `/implement`, `/ship`), the system shows a preview. Skipped in basic mode.

### Preview Display

```text
┌─────────────────────────────────────────────────────────────────┐
│  /implement user-authentication                                 │
├─────────────────────────────────────────────────────────────────┤
│  Spec: specs/user-authentication/ (approved)                    │
│  Tasks: 12 across 4 phases                                      │
│  TDD: Enabled (red → green → refactor)                          │
│                                                                 │
│  STAGE 1: DATABASE SCHEMA                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: code-agent                                           ││
│  │                                                             ││
│  │ 1. RESEARCH         code-researcher        Opus             ││
│  │    □ Find existing DB patterns                              ││
│  │ 2. TDD-RED          code-writer            Sonnet           ││
│  │    □ Write failing tests                                    ││
│  │ 3. TDD-GREEN        code-writer            Sonnet           ││
│  │    □ Implement to pass tests                                ││
│  │ 4. VALIDATE         code-validator         Haiku            ││
│  │    □ Verify tests pass                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Tools: cclsp, context7, next-devtools                          │
│                                                                 │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel               │
└─────────────────────────────────────────────────────────────────┘
```

### User Actions

| Key     | Action  | Description                       |
| ------- | ------- | --------------------------------- |
| `Enter` | Run     | Execute the plan as shown         |
| `e`     | Edit    | Modify scope or skip phases       |
| `?`     | Details | Show MCP servers, tools, spec ref |
| `Esc`   | Cancel  | Abort without executing           |

### Skip Preview

Use `--yes` to skip preview for automation:

```bash
/implement --yes    # Execute immediately
/ship --yes         # Ship without confirmation
```

---

## Agents (7)

All agents use an **Opus orchestrator** with specialized sub-agents.

### plan-agent

**Domain:** Creating implementation specifications

**MCP Servers:** cclsp

**CLI Tools:** File-based specs in `specs/`

**Phases:** ANALYZE → CREATE → VALIDATE

**Sub-agents:** plan-researcher (Opus), plan-writer (Sonnet), plan-validator (Haiku)

**Skills:** research

### code-agent

**Domain:** Backend implementation using TDD

**MCP Servers:** cclsp, context7, next-devtools

**CLI Tools:** `pnpm test`, file-based specs in `specs/`

**Phases:** RESEARCH → IMPLEMENT → VALIDATE

**Sub-agents:** code-researcher (Opus), code-writer (Sonnet), code-validator (Haiku)

**Skills:** research, tdd-workflow, qa-checks, backend-patterns, coding-standards

### ui-agent

**Domain:** Frontend UI components

**MCP Servers:** cclsp, figma, shadcn, playwright, context7

**CLI Tools:** `pnpm test`, file-based specs in `specs/`

**Phases:** RESEARCH → BUILD → VALIDATE

**Sub-agents:** ui-researcher (Opus), ui-builder (Sonnet), ui-validator (Haiku)

**Skills:** research, tdd-workflow, qa-checks, frontend-patterns, coding-standards

### docs-agent

**Domain:** Documentation

**MCP Servers:** cclsp, context7

**CLI Tools:** File-based specs in `specs/`

**Phases:** RESEARCH → WRITE → VALIDATE

**Sub-agents:** docs-researcher (Opus), docs-writer (Sonnet), docs-validator (Haiku)

**Skills:** research

### eval-agent

**Domain:** LLM evaluation suites

**MCP Servers:** cclsp, context7

**CLI Tools:** `pnpm test`, `pnpm eval`

**Phases:** RESEARCH → CREATE → VALIDATE

**Sub-agents:** eval-researcher (Opus), eval-writer (Sonnet), eval-validator (Haiku)

**Skills:** research, eval-harness

### check-agent

**Domain:** Quality verification (parallel execution)

**MCP Servers:** cclsp, next-devtools

**CLI Tools:** `pnpm test`, `pnpm lint`, `pnpm typecheck`

**Phases:** BUILD → TYPES → LINT → TESTS → SECURITY (parallel)

**Sub-agents:** build-checker, type-checker, lint-checker, test-runner, security-scanner (all Haiku, parallel)

**Skills:** qa-checks, security-patterns

### git-agent

**Domain:** Git operations + PR lifecycle (absorbed pr-agent)

**MCP Servers:** —

**CLI Tools:** `git`, `gh` CLI

**Actions:** status, branch, switch, sync, commit, worktree, cleanup, pr-create, pr-merge, pr-review

**Sub-agents:** change-analyzer (Sonnet), pr-analyzer (Sonnet), pr-reviewer (Opus), git-executor (Haiku)

**Skills:** git-operations, pr-operations

### Removed Agents

| Agent         | Reason                             | Replacement                            |
| ------------- | ---------------------------------- | -------------------------------------- |
| debug-agent   | Investigation is a workflow phase  | investigator sub-agent in fix workflow |
| pr-agent      | PRs are version control operations | Absorbed into git-agent                |
| help-agent    | Not agent work                     | `/guide` command                       |
| context-agent | Not agent work                     | `/mode` command                        |

---

## Standard Development Flow

```
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

### Quick Flows

**New feature (standard):**

```
/start → /plan → /implement → /ship
```

**PR feedback reconciliation:**

```
/plan → /implement → /ship   # /plan detects CodeRabbit comments automatically
```

**Check status:**

```
/guide   # Shows progress and suggests next action
```

**Switch to direct mode:**

```
/mode basic   # Disable orchestration for simple tasks
```

---

## Skills

Reusable procedures that agents invoke. Skills contain no decision-making logic.

| Skill             | Purpose                             | Used By                          |
| ----------------- | ----------------------------------- | -------------------------------- |
| research          | Find existing code, check conflicts | plan, code, ui, docs, eval       |
| qa-checks         | Build, types, lint, tests, security | code, ui, check                  |
| tdd-workflow      | Red-Green-Refactor cycle            | code, ui                         |
| coding-standards  | KISS, DRY, YAGNI                    | code, ui                         |
| eval-harness      | EDD framework, pass@k               | eval                             |
| backend-patterns  | tRPC, Prisma, API                   | code                             |
| frontend-patterns | React, hooks, state                 | ui                               |
| security-patterns | OWASP, vulnerability scan           | check                            |
| git-operations    | Branch, commit procedures           | git                              |
| pr-operations     | PR lifecycle procedures             | git                              |
| routing           | Spec analysis, agent selection      | /implement                       |
| preview           | Execution plan display              | /start, /plan, /implement, /ship |
| progress          | Real-time execution display         | /plan, /implement, /ship         |

---

## Working Modes

Switch mode to adjust orchestration behavior.

| Mode    | Focus          | Behavior                                           |
| ------- | -------------- | -------------------------------------------------- |
| `dev`   | Implementation | Full orchestration, previews, sub-agents (default) |
| `basic` | Direct         | Skip sub-agents, skip previews, direct tool use    |

```bash
/mode           # Show current mode
/mode dev       # Switch to full orchestration (default)
/mode basic     # Switch to direct tool use
```

Use `basic` mode for simple tasks where full orchestration is overkill.

---

## Project Context

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (customize as needed)
- **Testing**: Vitest + Playwright
- **Package Manager**: pnpm

### Key Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm build            # Production build
pnpm test             # Run unit tests (watch mode)
pnpm test:run         # Run unit tests (single run)
pnpm test:e2e         # Run E2E tests
pnpm eval [feature]   # Run LLM evaluations
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks
pnpm format           # Format with Prettier
pnpm quality          # Run all quality checks
```

### Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
│   └── ui/           # Base UI components
├── lib/              # Utility functions
│   └── eval/         # Eval framework types and runners
└── types/            # TypeScript type definitions

e2e/                  # Playwright E2E tests
specs/                # Feature specifications
evals/                # LLM evaluation suites (EDD)
└── {feature}/
    ├── config.ts
    ├── cases/
    ├── graders/
    └── index.ts
```

### File Naming Conventions

| Type       | Pattern              | Example                         |
| ---------- | -------------------- | ------------------------------- |
| Components | PascalCase           | `Button.tsx`, `UserProfile.tsx` |
| Pages      | kebab-case folder    | `app/user-settings/page.tsx`    |
| Utilities  | camelCase            | `formatDate.ts`, `useAuth.ts`   |
| Tests      | `.test.ts(x)` suffix | `Button.test.tsx`               |
| E2E Tests  | `.spec.ts` suffix    | `login.spec.ts`                 |
| Types      | PascalCase           | `User.ts`, `ApiResponse.ts`     |
| Constants  | SCREAMING_SNAKE      | `export const MAX_RETRIES = 3`  |

### Code Quality Rules

These limits are enforced by ESLint:

- `max-lines-per-function`: 30
- `complexity`: 10
- `max-depth`: 4
- `max-params`: 4

### Testing Requirements

- Unit tests for all new components and utilities
- E2E tests for critical user flows
- Coverage thresholds: 70% lines, 60% branches

---

## MCP Servers

### Agent MCP Assignments

| Agent       | MCP Servers                                | CLI Tools                |
| ----------- | ------------------------------------------ | ------------------------ |
| plan-agent  | cclsp                                      | file-based specs         |
| code-agent  | cclsp, context7, next-devtools             | pnpm test, specs/        |
| ui-agent    | cclsp, figma, shadcn, playwright, context7 | pnpm test, specs/        |
| docs-agent  | cclsp, context7                            | specs/                   |
| eval-agent  | cclsp, context7                            | pnpm test, pnpm eval     |
| check-agent | cclsp, next-devtools                       | pnpm test/lint/typecheck |
| git-agent   | —                                          | git, gh CLI              |

**Workflow Sub-agents:**

| Sub-agent         | MCP Servers                              | Used By           |
| ----------------- | ---------------------------------------- | ----------------- |
| investigator      | cclsp, sentry, playwright, next-devtools | fix workflow      |
| refactor-analyzer | cclsp                                    | refactor workflow |
| security-triager  | cclsp                                    | security workflow |

### MCP Server Reference

**Essential (Always Keep):**

| Server         | Purpose                                            |
| -------------- | -------------------------------------------------- |
| **cclsp**      | TypeScript LSP - code intelligence, symbols, types |
| **playwright** | Browser automation - E2E, screenshots              |

**Conditional (Project-Dependent):**

| Server            | Purpose                                          | Keep When                 |
| ----------------- | ------------------------------------------------ | ------------------------- |
| **next-devtools** | Next.js dev tools - routes, build status, errors | Using Next.js 16+         |
| **context7**      | Live docs lookup - prevent hallucinated APIs     | Frequent library usage    |
| **shadcn**        | Component registry - UI primitives               | Using shadcn/ui           |
| **figma**         | Design system - frames, tokens, Code Connect     | Design system integration |
| **sentry**        | Production errors - issues, traces, Seer AI      | Production error tracking |
| **linear**        | Issue tracking - create/update issues, link PRs  | Using Linear for issues   |

**Removed (Replaced with CLI):**

| Former Server     | Replacement                  |
| ----------------- | ---------------------------- |
| ~~github~~        | `gh` CLI (see pr-operations) |
| ~~vitest~~        | `pnpm test` commands         |
| ~~spec-workflow~~ | File-based specs in `specs/` |

See `.claude/docs/conditional-mcp-servers.md` for detailed guidance.

### Setup Commands

**Essential (Always Install):**

```bash
claude mcp add cclsp -- npx cclsp                           # TypeScript LSP
claude mcp add playwright -- npx @playwright/mcp@latest     # Browser automation
```

**Conditional (Project-Dependent):**

```bash
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest  # Next.js 16+ only
claude mcp add context7 -- npx context7-mcp                 # Prevent hallucinated APIs
claude mcp add shadcn -- npx shadcn-mcp                     # shadcn/ui projects
claude mcp add figma -- npx figma-mcp                       # Design system integration
claude mcp add sentry -- npx @sentry/mcp-server             # Production error tracking
claude mcp add linear-server -- npx @anthropic/mcp-linear   # Linear issue tracking
```

**CLI Prerequisites (No MCP Required):**

```bash
# GitHub CLI - replaces github MCP server
gh auth login                                               # Authenticate once

# Vitest - replaces vitest MCP server
pnpm test:run                                               # Run tests
pnpm test:coverage                                          # Coverage report
```

---

## Rules

Comprehensive rules are defined in `.claude/rules/`. Read relevant rules before starting work.

| Rule                                          | Purpose                         | Key Points                                     |
| --------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| [methodology](.claude/rules/methodology.md)   | SDD/TDD/EDD approach            | Specs first, tests before code, evals for LLM  |
| [agents](.claude/rules/agents.md)             | Agent delegation                | Always delegate, use appropriate agent         |
| [coding-style](.claude/rules/coding-style.md) | Immutability, file organization | 30-line functions, no mutation, Zod validation |
| [security](.claude/rules/security.md)         | Security checklist, AI concerns | No secrets, prompt injection prevention        |
| [patterns](.claude/rules/patterns.md)         | tRPC, Prisma, React patterns    | Standard implementations                       |
| [testing](.claude/rules/testing.md)           | TDD, coverage requirements      | 70% coverage, red-green-refactor               |
| [performance](.claude/rules/performance.md)   | Model selection, optimization   | Haiku for validation, Sonnet for coding        |
| [git-workflow](.claude/rules/git-workflow.md) | Commits, branches, PRs          | Conventional commits, quality checks           |
| [hooks](.claude/rules/hooks.md)               | Hook system documentation       | Lifecycle events, custom hooks                 |

---

## Hooks

Automated checks run at various lifecycle points. Defined in `.claude/settings.json`.

### Pre-Commit Hooks

| Trigger      | Check                         | Purpose                           |
| ------------ | ----------------------------- | --------------------------------- |
| `git commit` | `pnpm lint && pnpm typecheck` | Ensure code quality before commit |
| `git push`   | Reminder                      | Confirm tests pass and PR ready   |

### Post-Edit Hooks

| File Pattern                            | Check               | Purpose                       |
| --------------------------------------- | ------------------- | ----------------------------- |
| `*.ts(x)`                               | TypeScript compiler | Catch type errors immediately |
| `*.ts(x), *.js(x)`                      | ESLint              | Lint and auto-fix             |
| `*.ts(x), *.js(x), *.json, *.css, *.md` | Prettier            | Format consistently           |
| `src/**/*.ts(x)`                        | Vitest related      | Run affected tests            |
| `*.ts(x), *.js(x)`                      | console.log check   | Warn about debug statements   |

---

## Model Selection

| Model      | Use For                               | Cost   |
| ---------- | ------------------------------------- | ------ |
| **Haiku**  | Validation, checkers, executors       | Low    |
| **Sonnet** | Writers, builders, code generation    | Medium |
| **Opus**   | Orchestrators, researchers, analyzers | High   |

### Sub-Agent Model Assignment

All agents use an **Opus orchestrator** with specialized sub-agents:

| Role             | Model  | Examples                                                       |
| ---------------- | ------ | -------------------------------------------------------------- |
| Orchestrators    | Opus   | All agent orchestrators (routing, coordination)                |
| Researchers      | Opus   | code-researcher, ui-researcher, docs-researcher                |
| Analyzers        | Opus   | investigator, refactor-analyzer, security-triager, pr-reviewer |
| Writers/Builders | Sonnet | code-writer, ui-builder, docs-writer, pr-analyzer              |
| Validators       | Haiku  | code-validator, ui-validator, all checkers                     |
| Executors        | Haiku  | git-executor, build-checker, test-runner                       |

### Model Distribution (11 consolidated templates)

**Note:** Actual sub-agent count varies per task (1-7 spawned dynamically).

| Model  | Template Types                                    | Use Cases                           |
| ------ | ------------------------------------------------- | ----------------------------------- |
| Opus   | Orchestrators, domain-researcher, code-analyzer   | Research, analysis, coordination    |
| Sonnet | domain-writer, git-content-generator, pr-reviewer | Code generation, content creation   |
| Haiku  | quality-validator, quality-checker, git-executor  | Validation, checking, CLI execution |

**Templates by Model:**

- **Opus (4):** domain-researcher, code-analyzer, spec-analyzer, pr-reviewer
- **Sonnet (4):** domain-writer, git-content-generator, orchestrators
- **Haiku (3):** quality-validator, quality-checker, parallel-executor, git-executor, security-scanner

---

## Design Docs & Guides

### Source Design Documentation

The AI Development Platform design docs are located at `~/basecamp/docs/`:

| Directory       | Contents                                                               |
| --------------- | ---------------------------------------------------------------------- |
| `vision/`       | Platform overview, goals                                               |
| `architecture/` | Data models, API contracts, tech stack, database schema                |
| `specs/`        | Feature specs (prompt-manager, agent-builder, workflow-designer, etc.) |
| `guides/`       | Git workflow, user flows                                               |
| `operations/`   | Agent guardrails, audit logging                                        |
| `future/`       | Deferred features (auth, notifications, cost tracking)                 |

### Developer Workflow Guide

**📖 [docs/DEVELOPER_WORKFLOW.md](docs/DEVELOPER_WORKFLOW.md)** - Comprehensive guide covering:

- Your role as developer/architect in the AI-human partnership
- MCP server interactions (dashboards, tools, integrations)
- Phase-by-phase implementation guide
- Feature examples with full command sequences
- Troubleshooting common issues

---

## Dashboards & Tools

Interactive tools available during development:

| Tool                   | URL/Command                             | Purpose                    |
| ---------------------- | --------------------------------------- | -------------------------- |
| **Next.js Dev Server** | [localhost:3000](http://localhost:3000) | Your application           |
| **Vitest UI**          | `pnpm test:ui`                          | Interactive test runner    |
| **Playwright UI**      | `pnpm test:e2e --ui`                    | E2E test visualization     |
| **Prisma Studio**      | `pnpm prisma studio`                    | Database browser           |
| **Specs Directory**    | `specs/`                                | File-based spec management |

---

## Feature Build Order

Recommended implementation sequence based on dependencies:

| #   | Feature           | Methodology         | Dependencies       |
| --- | ----------------- | ------------------- | ------------------ |
| 1   | Prompt Manager    | SDD + TDD           | None (foundation)  |
| 2   | Agent Builder     | SDD + TDD + **EDD** | Prompts            |
| 3   | Work Item Manager | SDD + TDD           | Agents             |
| 4   | Workflow Designer | SDD + TDD + **EDD** | Work Items, Agents |
| 5   | Execution Engine  | SDD + TDD + **EDD** | Workflows          |
| 6   | Task Queue        | SDD + TDD           | Execution          |
| 7   | Home Dashboard    | SDD + TDD           | All above          |

**EDD required** for features with LLM integration (agent invocation, tool selection, condition evaluation).
