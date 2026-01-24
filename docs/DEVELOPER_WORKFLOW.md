# Developer Workflow Guide

A comprehensive guide for implementing features using the AI-assisted development workflow with TDD, SDD, EDD, and BDD methodologies.

---

## Table of Contents

1. [Overview](#overview)
2. [Git Workflow](#git-workflow)
3. [Your Role as Developer](#your-role-as-developer)
4. [MCP Server Interactions](#mcp-server-interactions)
5. [The Complete Workflow](#the-complete-workflow)
6. [Phase-by-Phase Guide](#phase-by-phase-guide)
7. [Feature Implementation Examples](#feature-implementation-examples)
8. [Troubleshooting](#troubleshooting)

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

```
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

## Git Workflow

### Golden Rule: Never Work on Main

**Direct pushes to `main` are blocked.** The pre-push hook enforces this automatically.

### Git Commands

Use these commands to manage git state throughout your workflow:

| Command                   | Purpose                           |
| ------------------------- | --------------------------------- |
| `/branch`                 | Show current branch status        |
| `/branch start <feature>` | Create and switch to new branch   |
| `/branch switch <name>`   | Switch to existing branch         |
| `/branch sync`            | Sync with main (rebase)           |
| `/branch cleanup`         | Delete merged branches            |
| `/worktree add <feature>` | Create worktree for parallel work |
| `/worktree status`        | Status of all worktrees           |
| `/commit`                 | Create conventional commit        |
| `/pr`                     | Create pull request               |
| `/status`                 | Full development status           |

### Starting a Feature

**Step 1: Create a feature branch using `/branch`**

```bash
# Use the /branch command to create your feature branch
/branch start prompt-manager
```

This will:

- Ensure you're starting from a clean state
- Pull latest main
- Create `feature/prompt-manager` branch
- Switch to the new branch

**Step 2: Then start the AI workflow**

```bash
# Now you can work with AI agents
/distill prompt-manager
```

### Branch Naming Conventions

| Prefix      | Use For          | Example                       |
| ----------- | ---------------- | ----------------------------- |
| `feature/`  | New features     | `feature/prompt-manager`      |
| `fix/`      | Bug fixes        | `fix/variable-persistence`    |
| `docs/`     | Documentation    | `docs/developer-workflow`     |
| `refactor/` | Code refactoring | `refactor/api-error-handling` |
| `test/`     | Test additions   | `test/workflow-integration`   |

### Commit Conventions

Use conventional commits with AI co-authorship:

```
<type>: <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `ci`

**Examples:**

```bash
feat: add prompt variable validation
fix: resolve race condition in task queue
docs: add developer workflow guide
test: add integration tests for workflow router
```

### The Complete Git + AI Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. CREATE BRANCH (use /branch command)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  /branch start prompt-manager                                               │
│                                                                             │
│  Creates feature/prompt-manager and switches to it                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. AI DEVELOPMENT PHASES                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  /distill prompt-manager    → Creates spec, you approve                     │
│  /test prompt-manager       → Writes tests (TDD red)                        │
│  /code prompt-manager       → Implements (TDD green)                        │
│  /ui PromptEditor           → Builds UI                                     │
│                                                                             │
│  Use /commit when ready to commit changes                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. VERIFICATION (AI runs these)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  /verify                    → Build, types, lint, tests, security           │
│  /security                  → Vulnerability scan                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. SYNC & PR (use /branch sync and /pr)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  /branch sync               → Rebase on latest main                         │
│  /pr                        → Push and create PR with summary               │
│                                                                             │
│  Pre-push hook runs: typecheck, tests, dead code, circular deps             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. MERGE (you do this in GitHub)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Review PR in GitHub                                                        │
│  Approve and merge (squash recommended)                                     │
│  /branch cleanup            → Delete merged branches locally                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pre-Push Checks (Automatic)

When you push, these checks run automatically:

| Check             | Blocking     | Purpose                      |
| ----------------- | ------------ | ---------------------------- |
| Branch protection | Yes          | Prevents direct push to main |
| TypeScript        | Yes          | No type errors               |
| Tests             | Yes          | All tests pass               |
| Dead code         | No (warning) | Identifies unused code       |
| Circular deps     | Yes          | No circular imports          |

### When to Commit

AI agents commit at logical checkpoints:

| Phase      | Commit After                   |
| ---------- | ------------------------------ |
| `/distill` | Spec file created              |
| `/test`    | Test files created             |
| `/code`    | Each component/module complete |
| `/ui`      | Each UI component complete     |

You can also ask AI to commit at any point:

```
"Commit the current progress"
```

### Handling Multiple Features (Worktrees)

Use git worktrees for true parallel development without stashing:

```bash
# Create worktrees for parallel work
/worktree add prompt-manager      # Creates ../react-basecamp--prompt-manager/
/worktree add agent-builder       # Creates ../react-basecamp--agent-builder/

# Terminal 1: Working on prompt-manager
cd ../react-basecamp--prompt-manager
/code prompt-manager

# Terminal 2: Working on agent-builder (fully parallel!)
cd ../react-basecamp--agent-builder
/code agent-builder

# Terminal 3: Quick bug fix in main repo
cd ../react-basecamp
/branch start fix/auth-bug
/code fix/auth-bug
/pr
```

**Why worktrees?**

- No stashing or context switching
- Each worktree has independent working directory
- Run tests in one while coding in another
- Compare implementations side-by-side

**Check worktree status:**

```bash
/worktree status    # Shows status of all worktrees
```

**Cleanup after merge:**

```bash
/worktree remove prompt-manager   # Removes worktree (branch preserved)
/branch cleanup                   # Deletes merged branches
```

### Recovery Commands

If something goes wrong:

```bash
# Check current status
/status git

# Undo last commit, keep changes
git reset --soft HEAD~1

# Discard all uncommitted changes
git checkout -- .

# Start fresh
/branch switch main
/branch start fresh-attempt
```

### Branch Cleanup

After PR is merged:

```bash
# Use /branch cleanup to delete all merged branches
/branch cleanup

# Or delete a specific branch
/branch switch main
git branch -d feature/prompt-manager
```

### Worktree Cleanup

After feature is complete:

```bash
# List all worktrees
/worktree

# Remove worktree (keeps branch for PR)
/worktree remove prompt-manager

# After PR merges, clean up the branch
/branch cleanup
```

---

## Your Role as Developer

### Decision Points (Where You're Needed)

| Phase        | Your Action                                       | AI Waits For             |
| ------------ | ------------------------------------------------- | ------------------------ |
| **Start**    | Tell AI what feature to build                     | Feature name/description |
| **Distill**  | Review extracted spec, approve or request changes | Spec approval            |
| **Test**     | Review test strategy, approve coverage            | Test plan approval       |
| **Eval**     | Define success criteria for LLM behavior          | Eval thresholds          |
| **Code**     | Resolve blockers, answer clarifying questions     | Decisions on ambiguity   |
| **UI**       | Provide design guidance if no Figma               | Design decisions         |
| **Security** | Acknowledge and prioritize findings               | Risk acceptance          |
| **Review**   | Final approval before merge                       | PR approval              |

### How to Give Instructions

**Good instructions:**

```
Build the Prompt Manager feature from the design docs at ../docs/specs/prompt-manager.md
```

**Better instructions:**

```
Build Prompt Manager:
- Start with /distill to create implementation spec from ../docs/specs/prompt-manager.md
- Focus on basic phase features only (no array/object variables)
- Use TipTap for the rich text editor
- Skip auth (single user for now)
```

### Monitoring Progress

1. **Claude Code terminal** - See agent output in real-time
2. **Spec Workflow Dashboard** - Track specs at http://localhost:5000
3. **Linear** - Track issues and link PRs
4. **GitHub** - Review PRs and CI status

---

## MCP Server Interactions

### 1. Spec Workflow Dashboard

**URL:** http://localhost:5000 (starts automatically when spec-workflow MCP is active)

**What you see:**

- List of all specs with status (Draft, In Review, Approved, Implemented)
- Progress indicators for each spec
- Approval workflow buttons
- Implementation logs

**How to interact:**

```
┌─────────────────────────────────────────────────────────────┐
│  SPEC WORKFLOW DASHBOARD                                    │
│  http://localhost:5000                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Specs                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ prompt-manager          [██████████] 100%  ✅ Done  │   │
│  │ agent-builder           [████░░░░░░]  40%  🔶 Code  │   │
│  │ workflow-designer       [░░░░░░░░░░]   0%  📝 Draft │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📄 Selected: agent-builder                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Status: In Progress                                 │   │
│  │ Phase: Implementation                               │   │
│  │                                                     │   │
│  │ Tasks:                                              │   │
│  │ ✅ 1. Create Prisma schema                          │   │
│  │ ✅ 2. Create tRPC router                            │   │
│  │ 🔶 3. Create AgentConfigForm component              │   │
│  │ ⬜ 4. Create ToolSelector component                 │   │
│  │ ⬜ 5. Write E2E tests                               │   │
│  │                                                     │   │
│  │ [Approve Spec] [Request Changes] [View Logs]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Your actions in the dashboard:**

- **Approve Spec** - Allow implementation to proceed
- **Request Changes** - Send spec back for revision with comments
- **View Logs** - See what the AI has done

**CLI equivalent:**

```bash
# AI can also interact via commands:
"List my specs"           # Shows all specs
"Approve spec agent-builder"  # Approves a spec
"Show progress for prompt-manager"  # Detailed view
```

#### Implementation Logs (log-implementation)

A key feature of spec-workflow is **implementation logging**. Every agent that writes code, tests, or UI logs what it created:

```
.spec-workflow/specs/prompt-manager/
├── requirements.md
├── design.md
├── tasks.md
└── Implementation Logs/
    ├── task-1-prisma-schema.json
    ├── task-2-trpc-router.json
    ├── test-suite.json
    └── ui-components.json
```

**What gets logged:**

| Phase       | Artifacts Logged                            |
| ----------- | ------------------------------------------- |
| `/code`     | API endpoints, functions, database models   |
| `/test`     | Test suites, fixtures, mocks, helpers       |
| `/ui`       | Components, patterns, design tokens         |
| `/security` | Findings, remediation status, passed checks |

**Why this matters:**

1. **Prevents duplication** - Future agents search logs before writing new code
2. **Maintains patterns** - "How did we do X in feature Y?"
3. **Enables reuse** - Test fixtures, mocks, and utilities are discoverable
4. **Tracks progress** - See what was built across sessions

**Example: Test researcher finding existing fixtures**

```bash
# AI searches implementation logs before writing tests:
grep -r "fixtures\|mocks" .spec-workflow/specs/*/Implementation\ Logs/

# Finds:
# prompt-manager/test-suite.json:
#   fixtures: [{ name: "mockUser", file: "src/test/fixtures/user.ts" }]
#   mocks: [{ name: "mockApiClient", file: "src/test/mocks/api.ts" }]
```

The researcher then tells the test writer: "Reuse mockUser and mockApiClient from prompt-manager."

### 2. Linear (Issue Tracking)

**How AI uses it:**

- Checks for existing related issues before creating specs
- Links PRs to issues with `Fixes BAS-XXX`
- Updates issue status as work progresses

**Your interactions:**

- Create issues for features you want built
- Review AI-created issues
- Prioritize backlog

**Example flow:**

```
You: Create issue "Build Prompt Manager" in Linear
AI: /distill prompt-manager
    → Finds Linear issue BAS-123
    → Links spec to issue
    → Creates PR with "Fixes BAS-123"
```

### 3. GitHub

**How AI uses it:**

- Searches for related PRs and discussions
- Creates PRs with proper formatting
- Responds to review comments

**Your interactions:**

- Review PRs in GitHub UI
- Approve or request changes
- Merge when ready

### 4. Sentry (Production Errors)

**How AI uses it:**

- `/debug` checks Sentry for production errors
- `/security` looks for security-related error patterns
- `/code qa` verifies fixes resolve reported issues

**Your interactions:**

- Monitor Sentry dashboard for new issues
- Tell AI to investigate: `/debug the authentication error in Sentry`

### 5. Figma (Design)

**How AI uses it:**

- `/ui research` extracts design tokens, spacing, colors
- `/ui build` matches implementation to design specs

**Your interactions:**

- Share Figma file URLs with AI
- Select frames in Figma for AI to reference
- Review UI against designs

**Example:**

```
You: Build the PromptEditor component matching this Figma frame:
     https://figma.com/file/xxx/AI-Platform?node-id=123
```

### 6. shadcn/ui (Component Registry)

**How AI uses it:**

- Searches for existing components before building custom
- Gets correct component APIs (no hallucination)
- Finds pre-built blocks (login forms, dashboards)

**Your interactions:**

- Ask AI what shadcn components are available
- Request specific components: "Use the shadcn DataTable for the prompt list"

**Example:**

```bash
# AI can search the registry:
"What shadcn components would work for a workflow designer?"
# Returns: Card, Dialog, DropdownMenu, Sheet, Tabs, etc.

# Add components:
"Add the Table and Dialog components from shadcn"
# AI runs: npx shadcn@latest add table dialog
```

### 7. Context7 (Library Documentation)

**How AI uses it:**

- Looks up current API documentation before using libraries
- Prevents hallucinated or deprecated APIs

**Your interactions:**

- Generally invisible to you
- Ensures AI uses correct Prisma, tRPC, React APIs

### 8. Vitest + Playwright (Testing)

**How AI uses them:**

- Runs tests during `/test`, `/code`, `/verify`
- Gets structured output optimized for AI consumption

**Your interactions:**

- Review test results in terminal
- Run tests manually: `pnpm test` or `pnpm test:e2e`

### 9. cclsp (TypeScript LSP)

**How AI uses it:**

- Go-to-definition, find references
- Real-time type errors as it codes
- Rename symbols across codebase

**Your interactions:**

- Invisible to you (AI uses it internally)
- Ensures type-safe code

### 10. Next.js DevTools

**How AI uses it:**

- Gets build errors in real-time
- Checks dev server status

**Your interactions:**

- Run `pnpm dev` to start dev server
- AI detects and fixes errors automatically

---

## The Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE IMPLEMENTATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   YOU        │  "Build the Prompt Manager feature"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: DISTILL (SDD)                                                      │
│  Command: /distill prompt-manager                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  distill-researcher                                                          │
│  ├── Reads ../docs/specs/prompt-manager.md                                   │
│  ├── Reads ../docs/architecture/data-models.md                               │
│  ├── Reads ../docs/architecture/api-contracts.md                             │
│  ├── Reads ../docs/architecture/database-schema.md                           │
│  ├── Checks Linear for related issues                                        │
│  └── Outputs: Research brief with entities, APIs, UI, scope                  │
│                                                                              │
│  distill-spec-writer                                                         │
│  ├── Creates specs/prompt-manager.md                                         │
│  ├── Registers in spec-workflow dashboard                                    │
│  └── Status: Draft → Awaiting Approval                                       │
│                                                                              │
│  distill-qa                                                                  │
│  └── Validates template compliance, source traceability                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review spec in dashboard (http://localhost:5000)
│              │  Click [Approve Spec] or [Request Changes]
└──────┬───────┘
       │ (after approval)
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: TEST (TDD Red)                                                     │
│  Command: /test prompt-manager                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  test-researcher                                                             │
│  ├── Reads specs/prompt-manager.md                                           │
│  ├── Identifies test scenarios from acceptance criteria                      │
│  ├── Checks existing test patterns                                           │
│  └── Outputs: Test plan with coverage strategy                               │
│                                                                              │
│  test-writer                                                                 │
│  ├── Creates src/server/routers/prompt.test.ts                               │
│  ├── Creates src/components/prompt/__tests__/*.test.tsx                      │
│  ├── Creates e2e/prompt-manager.spec.ts                                      │
│  └── Verifies tests FAIL (TDD red phase)                                     │
│                                                                              │
│  test-qa                                                                     │
│  └── Validates test structure, coverage plan                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review test plan
│              │  "Looks good" or "Add tests for X edge case"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2b: EVAL (EDD) - Only for LLM features                                │
│  Command: /eval agent-builder                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Skip for: prompt-manager, work-item-manager, task-queue (deterministic)     │
│  Use for: agent-builder, execution-engine, workflow-designer (LLM features)  │
│                                                                              │
│  eval-researcher                                                             │
│  ├── Identifies LLM touchpoints                                              │
│  ├── Defines evaluation dimensions                                           │
│  └── Recommends grading strategy                                             │
│                                                                              │
│  eval-writer                                                                 │
│  ├── Creates evals/agent-builder/config.ts                                   │
│  ├── Creates evals/agent-builder/cases/*.ts                                  │
│  └── Creates evals/agent-builder/graders/*.ts                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Define eval thresholds
│              │  "pass@1 should be 80% for tool selection"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: CODE (TDD Green)                                                   │
│  Command: /code prompt-manager                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  code-researcher                                                             │
│  ├── Checks for existing implementations                                     │
│  ├── Identifies patterns to follow                                           │
│  ├── Checks Linear/GitHub for context                                        │
│  └── Outputs: PROCEED, STOP, or CLARIFY                                      │
│                                                                              │
│  code-writer                                                                 │
│  ├── Extends prisma/schema.prisma                                            │
│  ├── Creates src/server/routers/prompt.ts                                    │
│  ├── Creates src/lib/services/prompt-service.ts                              │
│  ├── Uses cclsp for real-time diagnostics                                    │
│  ├── Uses context7 to verify APIs                                            │
│  └── Runs tests until GREEN                                                  │
│                                                                              │
│  code-qa                                                                     │
│  ├── Runs pnpm typecheck                                                     │
│  ├── Runs pnpm test:run                                                      │
│  ├── Verifies 70%+ coverage                                                  │
│  └── Reports: PASS or FAIL                                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼ (if FAIL, loop back to code-writer)
       │
       ▼ (if PASS)
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: UI                                                                 │
│  Commands: /ui PromptList, /ui PromptEditor, /ui VariableEditor              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ui-researcher                                                               │
│  ├── Searches shadcn for existing components                                 │
│  ├── Gets design specs from Figma (if available)                             │
│  ├── Identifies patterns in existing UI                                      │
│  └── Recommends composition strategy                                         │
│                                                                              │
│  ui-builder                                                                  │
│  ├── Adds required shadcn components                                         │
│  ├── Creates src/components/prompt/*.tsx                                     │
│  ├── Creates src/app/prompts/page.tsx                                        │
│  ├── Uses playwright to verify rendering                                     │
│  └── Implements all states (hover, focus, disabled, loading)                 │
│                                                                              │
│  ui-qa                                                                       │
│  ├── Accessibility check                                                     │
│  ├── Visual verification via playwright                                      │
│  └── Component test execution                                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review UI in browser (pnpm dev → http://localhost:3000)
│              │  "Looks good" or "Adjust spacing on X"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 5: VERIFY                                                             │
│  Command: /verify                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Runs all quality gates:                                                     │
│  ├── Build: pnpm build                                                       │
│  ├── Types: pnpm typecheck (0 errors required)                               │
│  ├── Lint: pnpm lint (0 errors required)                                     │
│  ├── Tests: pnpm test:run --coverage (70%+ required)                         │
│  ├── Security: No secrets, no console.log                                    │
│  └── Diff: Review all changed files                                          │
│                                                                              │
│  Output: READY or NOT READY with issues list                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 6: SECURITY                                                           │
│  Command: /security                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  security-auditor                                                            │
│  ├── Scans for OWASP Top 10                                                  │
│  ├── Checks for hardcoded secrets                                            │
│  ├── Reviews auth/authz patterns                                             │
│  ├── Checks Sentry for security-related errors                               │
│  └── Reports: CRITICAL, HIGH, MEDIUM, LOW issues                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review security findings
│              │  CRITICAL/HIGH must be fixed
│              │  MEDIUM/LOW - your judgment
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  PHASE 7: REVIEW                                                             │
│  Command: /review                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  pr-reviewer                                                                 │
│  ├── Analyzes full commit history                                            │
│  ├── Reviews all changed files                                               │
│  ├── Checks spec compliance                                                  │
│  ├── Verifies test coverage                                                  │
│  ├── Creates PR with summary and test plan                                   │
│  └── Links to Linear issue                                                   │
│                                                                              │
│  Output: GitHub PR URL                                                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   YOU        │  Review PR in GitHub
│              │  Approve and merge
│              │  Update spec status to "Implemented" in dashboard
└──────────────┘
```

---

## Phase-by-Phase Guide

### Phase 1: Distill (Design Docs → Spec)

**When to use:** You have design documentation and want to create an implementation spec.

**Your input:**

```bash
/distill prompt-manager
```

**What happens:**

1. AI reads design docs from `../docs/`
2. Extracts entities, APIs, UI requirements
3. Creates `specs/prompt-manager.md`
4. Registers in spec-workflow dashboard

**Your action:**

1. Open http://localhost:5000
2. Review the generated spec
3. Click **Approve** or **Request Changes**

**If requesting changes:**

```
/distill write prompt-manager
# with feedback: "Add error handling for duplicate names"
```

### Phase 2: Test (TDD Red)

**When to use:** After spec is approved, before any implementation.

**Your input:**

```bash
/test prompt-manager
```

**What happens:**

1. AI reads the spec
2. Writes failing tests based on acceptance criteria
3. Verifies tests fail (red phase)

**Your action:**

- Review test coverage strategy
- Suggest additional test cases if needed

**Manual verification:**

```bash
pnpm test:run
# Should see failures (expected - TDD red)
```

### Phase 2b: Eval (EDD - LLM Features Only)

**When to use:** For features with LLM integration.

**Features requiring evals:**

- agent-builder (model selection, tool configuration)
- execution-engine (agent orchestration, response handling)
- workflow-designer (condition evaluation if using LLM)

**Features NOT requiring evals:**

- prompt-manager (CRUD)
- work-item-manager (CRUD)
- task-queue (deterministic)
- home-dashboard (aggregation)

**Your input:**

```bash
/eval agent-builder
```

**Your action:**

- Define pass thresholds (e.g., "pass@1 > 80%")
- Review evaluation dimensions

**Running evals:**

```bash
pnpm eval agent-builder           # Full suite
pnpm eval agent-builder --smoke   # Quick check
```

### Phase 3: Code (TDD Green)

**When to use:** After tests are written and failing.

**Your input:**

```bash
/code prompt-manager
```

**What happens:**

1. AI researches existing code patterns
2. Implements until tests pass
3. Runs quality checks

**Your action:**

- Answer clarifying questions
- Resolve blockers

**If code-qa fails:**

```bash
/code write prompt-manager  # Fix specific issues
/code qa prompt-manager     # Re-validate
```

### Phase 4: UI

**When to use:** After backend is implemented.

**Your input:**

```bash
/ui PromptList
/ui PromptEditor
/ui VariableEditor
```

**What happens:**

1. AI searches shadcn for components
2. Gets design specs from Figma (if provided)
3. Builds components following patterns
4. Verifies with playwright

**Providing design context:**

```bash
/ui PromptEditor
# "Use the design from Figma: https://figma.com/file/xxx?node-id=123"
# "Follow the same pattern as WorkItemEditor"
```

**Your action:**

- Review in browser at http://localhost:3000
- Provide feedback on visual/UX issues

### Phase 5: Verify

**When to use:** Before security and review.

**Your input:**

```bash
/verify
```

**Or run specific checks:**

```bash
/verify build    # Build only
/verify types    # Type check only
/verify tests    # Tests only
/verify security # Security scan only
```

**Your action:**

- Review verification report
- Ensure all gates pass

### Phase 6: Security

**When to use:** Before creating PR.

**Your input:**

```bash
/security
```

**Your action:**

- Review findings by severity
- CRITICAL/HIGH must be fixed
- MEDIUM/LOW at your discretion

**If issues found:**

```bash
/code prompt-manager  # Fix security issues
/security             # Re-scan
```

### Phase 7: Review

**When to use:** All checks pass, ready for PR.

**Your input:**

```bash
/review
```

**What happens:**

1. AI creates PR with summary
2. Links to Linear issue
3. Includes test plan

**Your action:**

1. Review PR in GitHub
2. Approve and merge
3. Update spec status in dashboard

---

## Feature Implementation Examples

### Example 1: Prompt Manager (CRUD - No LLM)

```bash
# 0. CREATE BRANCH FIRST (always!)
/branch start prompt-manager

# 1. Create implementation spec from design docs
/distill prompt-manager
# → Review and approve in dashboard (http://localhost:5000)

# 2. Write failing tests
/test prompt-manager
# → Verify tests fail (pnpm test:run)

# 3. Implement until tests pass
/code prompt-manager
# → Verify tests pass

# 4. Build UI components
/ui PromptList
/ui PromptEditor
/ui VariableEditor
/ui FolderTree
# → Review at http://localhost:3000/prompts

# 5. Pre-PR verification
/verify

# 6. Security scan
/security

# 7. Sync with main and create PR
/branch sync
/pr
# → Review and approve in GitHub
# → Squash merge

# 8. Cleanup
/branch cleanup
```

### Example 2: Agent Builder (With LLM - Needs Evals)

```bash
# 0. CREATE BRANCH FIRST
/branch start agent-builder

# 1. Create implementation spec
/distill agent-builder

# 2. Write failing tests (deterministic behavior)
/test agent-builder

# 3. Write evaluations (LLM behavior)
/eval agent-builder
# Define: tool selection accuracy, model config validation

# 4. Implement
/code agent-builder

# 5. Run evals
pnpm eval agent-builder
# Iterate until pass@1 > 80%

# 6. Build UI
/ui AgentConfigForm
/ui ToolSelector
/ui ModelSettings

# 7. Verify, Security
/verify
/security

# 8. Sync and create PR
/branch sync
/pr
# → Review and approve in GitHub

# 9. Cleanup after merge
/branch cleanup
```

### Example 3: Bug Fix

```bash
# 0. CREATE BRANCH (use fix/ prefix for bugs)
/branch start fix/prompt-variable-persistence

# 1. Investigate the bug
/debug "Prompt variables not saving correctly"
# AI checks Sentry, reproduces, finds root cause

# 2. Add regression test
/test prompt-manager
# "Add test for variable persistence edge case"

# 3. Fix the bug
/code prompt-manager

# 4. Verify
/verify

# 5. Create PR
/branch sync
/pr
# → Review and approve in GitHub

# 6. Cleanup
/branch cleanup
```

### Example 4: Parallel Development with Worktrees

```bash
# Working on multiple features simultaneously

# Create worktrees for each feature
/worktree add prompt-manager
/worktree add agent-builder

# Terminal 1: Work on prompt-manager
cd ../react-basecamp--prompt-manager
/distill prompt-manager
/test prompt-manager
/code prompt-manager

# Terminal 2: Work on agent-builder (truly parallel!)
cd ../react-basecamp--agent-builder
/distill agent-builder
/eval agent-builder
/code agent-builder

# Check status of all worktrees
/worktree status

# When prompt-manager is ready
cd ../react-basecamp--prompt-manager
/verify
/pr

# Cleanup after merge
/worktree remove prompt-manager
/branch cleanup
```

---

## Dashboard and Tool URLs

| Tool              | URL                   | Purpose                    |
| ----------------- | --------------------- | -------------------------- |
| **Spec Workflow** | http://localhost:5000 | Spec management, approvals |
| **Next.js Dev**   | http://localhost:3000 | Your application           |
| **Vitest UI**     | `pnpm test:ui`        | Interactive test runner    |
| **Playwright UI** | `pnpm test:e2e --ui`  | E2E test runner            |
| **Prisma Studio** | `pnpm prisma studio`  | Database browser           |

---

## Troubleshooting

### Spec Workflow Dashboard Not Loading

```bash
# Check if MCP server is running
claude mcp list

# Restart if needed
claude mcp remove spec-workflow
claude mcp add spec-workflow -- npx -y @pimzino/spec-workflow-mcp@latest
```

### Tests Not Running

```bash
# Check vitest is installed
pnpm test:run

# If MCP issues
claude mcp remove vitest
claude mcp add vitest -- npx -y @djankies/vitest-mcp
```

### Context7 Not Finding Docs

```bash
# Verify it's running
claude mcp list | grep context7

# Test manually
# Ask AI: "Look up the Prisma findMany API using context7"
```

### Linear Not Linking Issues

```bash
# Check Linear MCP authentication
# May need to re-authenticate via Linear OAuth
```

---

## Quick Reference

### Commands

| Command              | Phase | Purpose                 |
| -------------------- | ----- | ----------------------- |
| `/distill [feature]` | SDD   | Design docs → Spec      |
| `/spec [feature]`    | SDD   | Write spec from scratch |
| `/test [feature]`    | TDD   | Write failing tests     |
| `/eval [feature]`    | EDD   | Write LLM evaluations   |
| `/code [feature]`    | TDD   | Implement until green   |
| `/ui [component]`    | —     | Build UI components     |
| `/verify`            | —     | Pre-PR quality gates    |
| `/security`          | —     | Vulnerability scan      |
| `/review`            | —     | Create PR               |
| `/debug [issue]`     | —     | Investigate bugs        |

### Subcommands

Each writing command supports phases:

```bash
/code prompt-manager           # Full flow
/code research prompt-manager  # Research only
/code write prompt-manager     # Write only
/code qa prompt-manager        # QA only
```

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
- [Spec Template](../specs/spec-template.md) - Spec format
