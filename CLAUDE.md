# My App

Next.js application with AI-assisted development via specialized agents.

> **📖 New to this workflow?** See the [Developer Workflow Guide](docs/DEVELOPER_WORKFLOW.md) for a comprehensive walkthrough of TDD, SDD, EDD methodologies, MCP server interactions, and your role as the developer/architect.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly (e.g., "What framework is this?" or "Where is the config?"). But any actual work MUST go through an agent.

---

## Architecture Overview

The system uses a 4-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  COMMANDS (13)         User entry points                    │
│  /plan, /build, /code, /ui, /docs, /eval, /check,          │
│  /git, /pr, /ship, /debug, /help, /context                 │
├─────────────────────────────────────────────────────────────┤
│  WORKFLOWS (4)         Orchestration chains                 │
│  implement, ship, review, full-feature                      │
├─────────────────────────────────────────────────────────────┤
│  AGENTS (11)           Workers with MCP access              │
│  plan, code, ui, docs, eval, check, git, pr,               │
│  debug, help, context                                       │
├─────────────────────────────────────────────────────────────┤
│  SKILLS (10)           Reusable procedures                  │
│  research, qa-checks, tdd-workflow, coding-standards,      │
│  eval-harness, backend-patterns, frontend-patterns,         │
│  security-patterns, git-operations, pr-operations           │
└─────────────────────────────────────────────────────────────┘
```

### Sub-Agent System

For complex tasks, agents can spawn isolated sub-agents via the Task tool. This prevents context overflow by running each phase in a fresh context window.

```
┌─────────────────────────────────────────────────────────────┐
│  Orchestrator (lightweight, coordinates phases)             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Researcher  │      │   Writer    │      │  Validator  │
│ (isolated)  │ ───► │ (isolated)  │ ───► │ (isolated)  │
└─────────────┘      └─────────────┘      └─────────────┘
```

**Documentation:** [.claude/sub-agents/README.md](.claude/sub-agents/README.md)

| Component | Purpose                                          |
| --------- | ------------------------------------------------ |
| Templates | researcher, writer, validator, parallel-executor |
| Profiles  | read-only, research, writer, full-access         |
| Protocols | Handoff format, orchestration patterns           |

---

## Command Routing

| Command           | Routes To          | Subcommands                                     |
| ----------------- | ------------------ | ----------------------------------------------- |
| `/plan [feature]` | plan-agent         | spec, distill, slice                            |
| `/build`          | implement-workflow | —                                               |
| `/code [feature]` | code-agent         | research, implement, validate                   |
| `/ui [component]` | ui-agent           | research, build, validate                       |
| `/docs [topic]`   | docs-agent         | research, write, validate                       |
| `/eval [feature]` | eval-agent         | research, create, validate                      |
| `/check [scope]`  | check-agent        | build, types, lint, tests, security             |
| `/git [action]`   | git-agent          | branch, switch, sync, commit, worktree, cleanup |
| `/pr [action]`    | pr-agent           | create, draft, merge, review                    |
| `/ship`           | ship-workflow      | —                                               |
| `/debug [issue]`  | debug-agent        | —                                               |
| `/help [topic]`   | help-agent         | guide, topic, next, recap                       |
| `/context [mode]` | context-agent      | dev, review, research                           |

### Subcommand Usage

Each agent command supports phases:

```bash
/code [feature]           # Full flow: research → implement → validate
/code research [feature]  # Research only
/code implement [feature] # Implement only (after research)
/code validate [feature]  # Validate only (after implement)
```

---

## Workflows

Workflows orchestrate multiple agents in sequence.

### implement (for /build)

```
code-agent → ui-agent
```

Full-stack implementation: backend first, then frontend.

### ship (for /ship)

```
check-agent → git-agent → pr-agent
```

Quality verification, commit, and create PR.

### review (for /pr review)

```
check-agent → pr-agent
```

Run quality checks on PR branch, then analyze and provide verdict.

### full-feature (future)

```
plan-agent → implement-workflow → ship-workflow
```

Complete feature from spec to PR.

---

## Agents

### plan-agent

**Domain:** Creating implementation specifications

**MCP Servers:** cclsp

**CLI Tools:** File-based specs in `specs/`

**Phases:** ANALYZE → CREATE → VALIDATE

**Skills:** research

### code-agent

**Domain:** Backend implementation using TDD

**MCP Servers:** cclsp, context7, next-devtools

**CLI Tools:** `pnpm test`, file-based specs in `specs/`

**Phases:** RESEARCH → IMPLEMENT → VALIDATE

**Skills:** research, tdd-workflow, qa-checks, backend-patterns, coding-standards

### ui-agent

**Domain:** Frontend UI components

**MCP Servers:** cclsp, figma, shadcn, playwright, context7

**CLI Tools:** `pnpm test`, file-based specs in `specs/`

**Phases:** RESEARCH → BUILD → VALIDATE

**Skills:** research, tdd-workflow, qa-checks, frontend-patterns, coding-standards

### docs-agent

**Domain:** Documentation

**MCP Servers:** cclsp, context7

**CLI Tools:** File-based specs in `specs/`

**Phases:** RESEARCH → WRITE → VALIDATE

**Skills:** research

### eval-agent

**Domain:** LLM evaluation suites

**MCP Servers:** cclsp, context7

**CLI Tools:** `pnpm test`, `pnpm eval`

**Phases:** RESEARCH → CREATE → VALIDATE

**Skills:** research, eval-harness

### check-agent

**Domain:** Quality verification

**MCP Servers:** cclsp, next-devtools

**CLI Tools:** `pnpm test`, `pnpm lint`, `pnpm typecheck`

**Phases:** BUILD → TYPES → LINT → TESTS → SECURITY

**Skills:** qa-checks, security-patterns

### git-agent

**Domain:** Git operations

**MCP Servers:** —

**CLI Tools:** `git`, `gh` CLI

**Actions:** status, branch, switch, sync, commit, worktree, cleanup

**Skills:** git-operations

### pr-agent

**Domain:** Pull request lifecycle

**MCP Servers:** —

**CLI Tools:** `gh` CLI (pr create, pr merge, pr review)

**Actions:** create, draft, merge, review

**Skills:** pr-operations

### debug-agent

**Domain:** Bug investigation

**MCP Servers:** cclsp, sentry, playwright, next-devtools

**CLI Tools:** `pnpm test`, `gh` CLI

**Phases:** GATHER → ANALYZE → REPORT

**Skills:** research

### help-agent

**Domain:** User assistance

**MCP Servers:** (none required)

**Actions:** guide, topic, next, recap

### context-agent

**Domain:** Working mode management

**MCP Servers:** (none required)

**Actions:** show, dev, review, research

---

## Standard Development Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. PLAN                                                    │
│     /plan [feature]   → Create spec, get approval           │
├─────────────────────────────────────────────────────────────┤
│  2. BUILD                                                   │
│     /build            → code-agent → ui-agent               │
│     or                                                      │
│     /code [feature]   → Backend only                        │
│     /ui [component]   → Frontend only                       │
├─────────────────────────────────────────────────────────────┤
│  3. EVAL (LLM features only)                                │
│     /eval [feature]   → Create evaluation suite             │
├─────────────────────────────────────────────────────────────┤
│  4. CHECK                                                   │
│     /check            → Build, types, lint, tests, security │
├─────────────────────────────────────────────────────────────┤
│  5. SHIP                                                    │
│     /ship             → check → commit → PR                 │
│     or                                                      │
│     /git commit       → Create commit                       │
│     /pr create        → Create PR                           │
└─────────────────────────────────────────────────────────────┘
```

### Quick Flows

**New feature:**

```
/plan → /build → /check → /ship
```

**Bug fix:**

```
/debug → /code → /check → /ship
```

**PR review:**

```
/pr review 123
```

**LLM feature:**

```
/plan → /eval → /build → /check → /ship
```

---

## Skills

Reusable procedures that agents invoke. Skills contain no decision-making logic.

| Skill             | Purpose                             | Used By                           |
| ----------------- | ----------------------------------- | --------------------------------- |
| research          | Find existing code, check conflicts | plan, code, ui, docs, eval, debug |
| qa-checks         | Build, types, lint, tests, security | code, ui, check                   |
| tdd-workflow      | Red-Green-Refactor cycle            | code, ui                          |
| coding-standards  | KISS, DRY, YAGNI                    | code, ui                          |
| eval-harness      | EDD framework, pass@k               | eval                              |
| backend-patterns  | tRPC, Prisma, API                   | code                              |
| frontend-patterns | React, hooks, state                 | ui                                |
| security-patterns | OWASP, vulnerability scan           | check                             |
| git-operations    | Branch, commit procedures           | git                               |
| pr-operations     | PR lifecycle procedures             | pr                                |

---

## Contexts (Working Modes)

Switch context to adjust agent behavior.

| Mode       | Focus          | Behavior                                |
| ---------- | -------------- | --------------------------------------- |
| `dev`      | Implementation | Code first, TDD, atomic commits         |
| `review`   | Quality        | Security first, thorough analysis       |
| `research` | Exploration    | Read first, no changes without approval |

```bash
/context dev       # Switch to implementation mode
/context review    # Switch to review mode
/context research  # Switch to exploration mode
```

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

| Agent         | MCP Servers                                | CLI Tools         |
| ------------- | ------------------------------------------ | ----------------- |
| plan-agent    | cclsp                                      | file-based specs  |
| code-agent    | cclsp, context7, next-devtools             | pnpm test, specs/ |
| ui-agent      | cclsp, figma, shadcn, playwright, context7 | pnpm test, specs/ |
| docs-agent    | cclsp, context7                            | specs/            |
| eval-agent    | cclsp, context7                            | pnpm test         |
| check-agent   | cclsp, next-devtools                       | pnpm test         |
| git-agent     | —                                          | git, gh CLI       |
| pr-agent      | —                                          | gh CLI            |
| debug-agent   | cclsp, sentry, playwright, next-devtools   | pnpm test, gh CLI |
| help-agent    | —                                          | —                 |
| context-agent | —                                          | —                 |

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

| Model      | Use For                         | Cost   |
| ---------- | ------------------------------- | ------ |
| **Haiku**  | Validation, simple tasks        | Low    |
| **Sonnet** | Main development, coding        | Medium |
| **Opus**   | Architecture, complex reasoning | High   |

### Agent Model Assignment

| Agent       | Model  | Reasoning              |
| ----------- | ------ | ---------------------- |
| plan-agent  | Sonnet | Complex analysis       |
| code-agent  | Sonnet | Code generation        |
| ui-agent    | Sonnet | Component building     |
| check-agent | Haiku  | Checklist verification |
| git-agent   | Haiku  | Simple operations      |
| pr-agent    | Sonnet | PR descriptions        |
| debug-agent | Sonnet | Investigation skills   |

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
