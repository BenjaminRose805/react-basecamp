# My App

Next.js application with AI-assisted development via specialized agents.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

## Commands

### Implementation Commands

| Command              | Purpose               | Pattern                   |
| -------------------- | --------------------- | ------------------------- |
| `/distill [feature]` | Design docs → spec    | researcher → writer → qa  |
| `/spec [feature]`    | Write new spec        | researcher → writer → qa  |
| `/test [feature]`    | Write tests (TDD)     | researcher → writer → qa  |
| `/eval [feature]`    | Write LLM evals (EDD) | researcher → writer → qa  |
| `/code [feature]`    | Implement feature     | researcher → writer → qa  |
| `/ui [component]`    | Build UI component    | researcher → builder → qa |
| `/docs [topic]`      | Write documentation   | researcher → writer → qa  |

### Standalone Commands

| Command           | Purpose             |
| ----------------- | ------------------- |
| `/debug [issue]`  | Investigate bugs    |
| `/security`       | Vulnerability scan  |
| `/review [PR]`    | Final quality gate  |
| `/verify`         | Pre-PR verification |
| `/context [mode]` | Switch working mode |

### Workflow Commands

| Command     | Purpose                    |
| ----------- | -------------------------- |
| `/status`   | See current state          |
| `/plan`     | Break down feature         |
| `/next`     | Get guidance on next step  |
| `/commit`   | Create conventional commit |
| `/pr`       | Create pull request        |
| `/recap`    | Summarize session          |
| `/workflow` | Auto-route to next command |
| `/guide`    | Interactive project tutor  |

### Subcommand Usage

```bash
/code [feature]           # Full flow: research → write → qa
/code research [feature]  # Research only
/code write [feature]     # Write only
/code qa [feature]        # QA only
```

---

## Workflow

```
/status → /plan → /spec → /test → /code → /security → /review → /pr
                    ↓        ↓       ↓
                 /commit  /commit  /commit
```

**Standard flows:**

- New feature: `/spec → /test → /code → /security → /review`
- From design docs: `/distill → /test → /code → /security → /review`
- LLM feature: `/distill → /test → /eval → /code → /security → /review`
- Bug fix: `/debug → /test → /code → /security → /review`

---

## Project Context

**Tech Stack:** Next.js 15, TypeScript, Vitest, Playwright, pnpm

**Key Commands:**

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm test:run     # Unit tests
pnpm test:e2e     # E2E tests
pnpm typecheck    # Type checking
pnpm lint         # Linting
pnpm quality      # All quality checks
```

**Structure:**

```
src/
├── app/          # Next.js App Router
├── components/   # React components
├── lib/          # Utilities
└── types/        # TypeScript types

specs/            # Feature specifications
evals/            # LLM evaluation suites
e2e/              # Playwright tests
```

**Quality Rules:** 30-line functions, 70% coverage, no console.log

---

## Quick Reference

| Need to...             | Use                  |
| ---------------------- | -------------------- |
| Start session          | `/status`            |
| Plan new feature       | `/plan [feature]`    |
| Write spec             | `/spec [feature]`    |
| Write tests first      | `/test [feature]`    |
| Implement              | `/code [feature]`    |
| Check security         | `/security`          |
| Create PR              | `/verify` then `/pr` |
| Get guidance           | `/next`              |
| End session            | `/recap`             |
| Learn about the system | `/guide`             |
| Not sure what to do    | `/workflow`          |

---

## Detailed Documentation

| Topic        | Location                        |
| ------------ | ------------------------------- |
| Agents       | `.claude/agents/`               |
| Commands     | `.claude/commands/`             |
| Rules        | `.claude/rules/`                |
| Skills       | `.claude/skills/`               |
| Contexts     | `.claude/contexts/`             |
| MCP Setup    | `docs/MCP_SETUP.md`             |
| Hooks        | `.claude/rules/hooks.md`        |
| Methodology  | `.claude/rules/methodology.md`  |
| Git Workflow | `.claude/rules/git-workflow.md` |
