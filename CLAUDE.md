# My App

Next.js application with AI-assisted development via specialized agents.

> **📖 New to this workflow?** See the [Developer Workflow Guide](docs/DEVELOPER_WORKFLOW.md) for a comprehensive walkthrough of TDD, SDD, EDD methodologies, MCP server interactions, and your role as the developer/architect.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly (e.g., "What framework is this?" or "Where is the config?"). But any actual work MUST go through an agent.

## Agent Routing

| Command              | Subcommands                                   | Runs Agents                                           |
| -------------------- | --------------------------------------------- | ----------------------------------------------------- |
| `/slice [feature]`   | `analyze`, `plan`, `create`                   | slice-analyzer → slice-planner → slice-creator        |
| `/distill [feature]` | `research`, `write`, `qa`                     | distill-researcher → distill-spec-writer → distill-qa |
| `/spec [feature]`    | `research`, `write`, `qa`                     | spec-researcher → spec-writer → spec-qa               |
| `/test [feature]`    | `research`, `write`, `qa`                     | test-researcher → test-writer → test-qa               |
| `/eval [feature]`    | `research`, `write`, `qa`                     | eval-researcher → eval-writer → eval-qa               |
| `/code [feature]`    | `research`, `write`, `qa`                     | code-researcher → code-writer → code-qa               |
| `/ui [component]`    | `research`, `build`, `qa`                     | ui-researcher → ui-builder → ui-qa                    |
| `/docs [topic]`      | `research`, `write`, `qa`                     | docs-researcher → docs-writer → docs-qa               |
| `/debug [issue]`     | —                                             | debugger (reactive bug hunting)                       |
| `/security [scope]`  | —                                             | security-auditor                                      |
| `/review [PR]`       | —                                             | pr-reviewer                                           |
| `/verify [scope]`    | `build`, `types`, `lint`, `tests`, `security` | verification-loop (pre-PR checks)                     |
| `/context [mode]`    | `dev`, `review`, `research`                   | context-loader (switch working mode)                  |
| `/branch [action]`   | `start`, `switch`, `sync`, `list`, `cleanup`  | Git branch management (always start here)             |
| `/worktree [action]` | `add`, `remove`, `switch`, `status`           | Parallel development with git worktrees               |
| `/commit`            | —                                             | Create conventional commit                            |
| `/pr`                | `draft`                                       | Create pull request                                   |
| `/status [scope]`    | `git`, `tasks`, `tests`, `phase`              | Development status overview                           |
| `/sync-linear`       | `--create-missing`                            | Sync specs with Linear issues                         |

### Subcommand Usage

Each writing command supports three phases:

```
/code [feature]           # Full flow: research → write → qa
/code research [feature]  # Research only
/code write [feature]     # Write only (after research)
/code qa [feature]        # QA only (after write)
```

## Workflow

Standard feature development flow:

```
┌─────────────────────────────────────────────────────────────┐
│  0a. SLICE (for large features with 10+ capabilities)       │
│     /slice [feature]     → Analyze → Plan → Create specs    │
│                                                             │
│     Breaks large features into vertical slices (5-10 tasks) │
│     Creates multiple specs: feature-crud, feature-variables │
├─────────────────────────────────────────────────────────────┤
│  0b. DISTILL (when design docs exist)                       │
│     /distill [feature]   → Research docs → Write spec → QA  │
│                                                             │
│     Converts ~/basecamp/docs/ into implementation specs     │
│     Use for single slices, not huge features                │
├─────────────────────────────────────────────────────────────┤
│  1. DEFINE                                                  │
│     /spec [feature]      → Research → Write → QA            │
│     /ui [component]      → Research → Build → QA (if needed)│
├─────────────────────────────────────────────────────────────┤
│  2. TEST (TDD Red)                                          │
│     /test [feature]      → Research → Write → QA            │
├─────────────────────────────────────────────────────────────┤
│  2b. EVAL (EDD - for LLM features only)                     │
│     /eval [feature]      → Research → Write → QA            │
│                                                             │
│     Only for: agent-builder, execution-engine, etc.         │
│     Creates evaluation suites for non-deterministic outputs │
├─────────────────────────────────────────────────────────────┤
│  3. IMPLEMENT (TDD Green)                                   │
│     /code [feature]      → Research → Write → QA            │
│                                                             │
│     ❌ QA fails? → /code write to fix → /code qa again      │
│     ✓ QA passes? → proceed to security                      │
├─────────────────────────────────────────────────────────────┤
│  4. SECURITY                                                │
│     /security [scope]    → Vulnerability scan               │
│                                                             │
│     ❌ Issues found? → /code to fix → /security again       │
│     ✓ All clear? → proceed to review                        │
├─────────────────────────────────────────────────────────────┤
│  5. REVIEW                                                  │
│     /review staged       → Final quality gate               │
│                                                             │
│     ❌ Changes requested? → /code → /code qa → back to 4    │
│     ✓ Approved? → proceed to document                       │
├─────────────────────────────────────────────────────────────┤
│  6. DOCUMENT                                                │
│     /docs [update]       → Research → Write → QA            │
└─────────────────────────────────────────────────────────────┘
```

**Key principles:**

- Every writing command runs: research → write → QA
- QA validates immediately after writing (not a separate step)
- `/debug` is for reactive bug hunting, not routine validation
- `/security` and `/review` are the final gates before merge

## Write Protocol

**Three-agent pattern for all writing tasks:**

```
┌─────────────────────────────────────────────────────────────┐
│  RESEARCHER AGENT (e.g., code-researcher)                   │
├─────────────────────────────────────────────────────────────┤
│  1. Search for existing implementations                     │
│     → Does similar code already exist?                      │
│     → Can we extend/modify instead of create?               │
│                                                             │
│  2. Check for conflicts                                     │
│     → Will this duplicate functionality?                    │
│     → Are there naming conflicts?                           │
│                                                             │
│  3. Identify consolidation opportunities                    │
│     → Can this be merged with existing code?                │
│                                                             │
│  4. Report: PROCEED, STOP, or CLARIFY                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  WRITER AGENT (e.g., code-writer)                           │
├─────────────────────────────────────────────────────────────┤
│  Prerequisite: Research returned PROCEED                    │
│                                                             │
│  1. Review research findings                                │
│  2. Read the spec                                           │
│  3. Implement following patterns                            │
│  4. Sanity check (types, build, imports)                    │
│  5. Report: Files changed, ready for QA                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  QA AGENT (e.g., code-qa)                                   │
├─────────────────────────────────────────────────────────────┤
│  DEEP VALIDATION                                            │
│                                                             │
│  1. Type checking                                           │
│  2. Test execution                                          │
│  3. Integration verification                                │
│  4. Regression checks                                       │
│                                                             │
│  Report: PASS or FAIL (with specific issues)                │
└─────────────────────────────────────────────────────────────┘
```

**Separation of concerns:**

- **Researcher** = Prevent duplicates, find conflicts, recommend approach
- **Writer** = Do the work, follow patterns, basic sanity
- **QA** = Deep validation, catch issues before security/review
- **Security** = Vulnerability scan
- **Reviewer** = Final quality gate

## Standalone Agents

These agents don't follow the research → write → qa pattern:

| Agent              | Purpose                | When to Use                                |
| ------------------ | ---------------------- | ------------------------------------------ |
| `debugger`         | Reactive bug hunting   | User reports bug, Sentry error, flaky test |
| `security-auditor` | Vulnerability scanning | Before review, after auth/API changes      |
| `pr-reviewer`      | Final quality gate     | After QA and security pass                 |

**Important:** `/debug` is for investigating reported issues, not routine validation. Use `/code qa` for post-implementation validation.

## Failure Paths

| Step                            | Failure                                           | Recovery |
| ------------------------------- | ------------------------------------------------- | -------- |
| `/code qa` finds type errors    | `/code write [feature]` → `/code qa` again        |
| `/code qa` finds test failures  | `/code write [feature]` → `/code qa` again        |
| `/security` finds vulnerability | `/code [feature]` → `/security` again             |
| `/review` requests changes      | `/code [feature]` → `/security` → `/review` again |
| `/review` needs more tests      | `/test [feature]` → `/code` if needed → `/review` |

## When to Use Each Agent

**Standard flow (new feature):**

```
/spec → /test → /code → /security → /review → /docs
```

**From design docs (AI Platform features):**

```
/distill → /test → /eval (if LLM) → /code → /security → /review → /docs
```

**LLM feature (agent-builder, execution-engine):**

```
/distill → /test → /eval → /code → /security → /review
```

**Bug fix:**

```
/debug → /test (add regression test) → /code → /security → /review
```

**PR review:**

```
/security → /review
```

**Individual phases:**

- Use `/distill research` to see what docs exist for a feature
- Use `/code research` to check for conflicts before writing
- Use `/code write` if research already approved
- Use `/code qa` to re-validate after fixes
- Use `/eval` only for features with LLM integration

---

## Project Context (for agents)

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
pnpm eval --smoke     # Quick eval smoke test
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

### MCP Servers

See `docs/MCP_SETUP.md` for full setup, or `.claude/mcp-configs/mcp-servers.json` for server configurations.

**Required:**

```bash
claude mcp add cclsp -- npx cclsp                           # TypeScript LSP
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest  # Next.js DevTools
claude mcp add playwright -- npx @playwright/mcp@latest     # Browser automation
claude mcp add vitest -- npx vitest-mcp                     # Test runner
claude mcp add github -- npx @anthropic/mcp-github          # GitHub integration
```

**Recommended:**

```bash
claude mcp add context7 -- npx context7-mcp                 # Prevent hallucinated APIs
claude mcp add spec-workflow -- npx -y @pimzino/spec-workflow-mcp@latest .  # SDD workflow
```

---

## Extended Commands

### /distill - Design Doc to Spec

Bridges comprehensive design documentation to implementation-ready specs.

**When to use:**

- You have existing design docs (like ~/basecamp/docs/)
- Starting a new feature that's already been designed
- Need to extract actionable specs from architecture docs

**Agents:** See `.claude/agents/distill-*.md`

```text
distill-researcher
├── Reads: docs/specs/{feature}.md
├── Reads: docs/architecture/data-models.md
├── Reads: docs/architecture/database-schema.md
├── Reads: docs/architecture/api-contracts.md
├── Reads: docs/architecture/tech-stack.md
└── Outputs: Research brief with entities, APIs, UI, scope

distill-spec-writer
├── Inputs: Research brief
├── Templates: .spec-workflow/templates/*.md
├── Outputs: .spec-workflow/specs/{feature}/
│   ├── requirements.md (EARS format, dashboard approval)
│   ├── design.md (architecture, dashboard approval)
│   └── tasks.md (with _Prompt fields, dashboard approval)
└── Dashboard: http://localhost:5000

distill-qa
├── Validates: Template compliance
├── Validates: Dashboard approvals obtained
├── Validates: Source traceability
├── Validates: Internal consistency
└── Reports: PASS or FAIL with issues
```

**Example:**

```bash
/distill prompt-manager           # Full flow
/distill research prompt-manager  # Just see what docs exist
/distill write prompt-manager     # Write spec from research
/distill qa prompt-manager        # Validate the spec
```

### /eval - Evaluation-Driven Development

Creates evaluation suites for LLM features where traditional tests don't work.

**When to use:**

- Features with LLM/AI integration
- Non-deterministic outputs
- Agent responses, tool selection, guardrails

**Skip for:**

- CRUD features (prompt-manager, work-item-manager)
- Deterministic logic (workflow-designer UI)

**Agents:** See `.claude/agents/eval-*.md`

```
eval-researcher
├── Identifies: LLM touchpoints in the feature
├── Determines: What dimensions to evaluate
├── Suggests: Test cases (happy, edge, adversarial)
└── Recommends: Grading strategy (code vs LLM-judge)

eval-writer
├── Creates: evals/{feature}/config.ts
├── Creates: evals/{feature}/cases/*.ts
├── Creates: evals/{feature}/graders/*.ts
└── Creates: evals/{feature}/index.ts

eval-qa
├── Validates: Structure and completeness
├── Runs: Dry run with mock responses
├── Optionally: Smoke run with real LLM
└── Reports: PASS or FAIL with coverage
```

**Example:**

```bash
/eval agent-builder           # Full flow
/eval research agent-builder  # Identify LLM touchpoints
/eval write agent-builder     # Create eval suite
/eval qa agent-builder        # Validate and dry run
```

**Running evals:**

```bash
pnpm eval agent-builder           # Full suite
pnpm eval agent-builder --smoke   # Quick check
pnpm eval agent-builder --case simple-request  # Single case
```

### /context - Working Mode

Switch between different working modes to adjust behavior and priorities.

**Contexts:** See `.claude/contexts/`

**Usage:**

```bash
/context dev       # Implementation mode
/context review    # Code review mode
/context research  # Exploration mode
```

**Available Modes:**

| Mode       | Focus                 | When to Use                                   |
| ---------- | --------------------- | --------------------------------------------- |
| `dev`      | Active implementation | Writing code, running tests, committing       |
| `review`   | Quality assurance     | Code review, security checks, PR review       |
| `research` | Exploration           | Understanding codebase, investigating options |

**Mode Behaviors:**

- **dev**: Code first, TDD workflow, atomic commits, favor Edit/Write/Bash
- **review**: Security first, thorough analysis, favor Read/Grep/Bash
- **research**: Read first, document findings, no code changes without approval

### /verify - Pre-PR Verification

Multi-phase verification before creating a PR. Runs all quality gates.

**Skill:** See `.claude/skills/verification-loop/SKILL.md`

**Phases:**

1. Build check (`pnpm build`)
2. Type check (`pnpm typecheck`)
3. Lint check (`pnpm lint`)
4. Test suite (`pnpm test:run --coverage`)
5. Security scan (secrets, console.log)
6. Diff review (changed files)

**Output:** Verification report with READY/NOT READY status

**Usage:**

```bash
/verify              # Full verification (all phases)
/verify build        # Build check only
/verify types        # Type check only
/verify lint         # Lint check only
/verify tests        # Tests with coverage
/verify security     # Security scan only
```

**Quality Gates:**

| Check    | Requirement                | Blocking |
| -------- | -------------------------- | -------- |
| Build    | Must pass                  | Yes      |
| Types    | 0 errors                   | Yes      |
| Lint     | 0 errors                   | Yes      |
| Tests    | All pass, 70%+ coverage    | Yes      |
| Security | No secrets, no console.log | Yes      |

### /branch - Git Branch Management

**CRITICAL: Always use `/branch start` before any new work.**

Manages git branches with enforced conventions. Never work directly on main.

**Usage:**

```bash
/branch                        # Show current branch status
/branch start <feature>        # Create and switch to feature branch
/branch switch <branch>        # Switch to existing branch
/branch sync                   # Sync current branch with main
/branch list                   # List all branches
/branch cleanup                # Delete merged branches
```

**Branch naming conventions:**

| Prefix      | Use For           | Example                  |
| ----------- | ----------------- | ------------------------ |
| `feature/`  | New features      | `feature/prompt-manager` |
| `fix/`      | Bug fixes         | `fix/auth-timeout`       |
| `refactor/` | Code improvements | `refactor/api-cleanup`   |
| `docs/`     | Documentation     | `docs/api-reference`     |

**Integration with workflow:**

```bash
/branch start prompt-manager    # Step 0: ALWAYS start here
    ↓
/distill prompt-manager         # Step 1: Create spec
    ↓
/test prompt-manager            # Step 2: Write tests
    ↓
/code prompt-manager            # Step 3: Implement
    ↓
/branch sync                    # Step 4: Sync with main
    ↓
/verify → /pr                   # Step 5-6: Verify and PR
```

### /worktree - Parallel Development

Work on multiple features simultaneously using git worktrees.

**Why worktrees?**

- Work on feature A while feature B's tests run
- No stashing or losing state when switching
- Review PRs while coding in another branch
- Compare implementations side-by-side

**Usage:**

```bash
/worktree                       # List all worktrees
/worktree add <feature>         # Create worktree for feature
/worktree remove <feature>      # Remove worktree (keeps branch)
/worktree status                # Status of all worktrees
/worktree switch <feature>      # Tell Claude to work in different worktree
```

**Directory structure:**

```text
~/basecamp/
├── react-basecamp/                   # Main worktree (main branch)
├── react-basecamp--prompt-manager/   # Worktree for prompt-manager
├── react-basecamp--workflow-designer/ # Worktree for workflow feature
└── docs/                             # Design docs (shared)
```

**Example workflow:**

```bash
# Terminal 1: Main feature
/worktree add prompt-manager
cd ../react-basecamp--prompt-manager
/code prompt-manager

# Terminal 2: Quick bug fix (in main repo)
cd ../react-basecamp
/branch start fix/auth-bug
/code fix/auth-bug
/pr
```

### /commit - Create Conventional Commits

Creates well-formatted commits following conventional commit spec.

**Usage:**

```bash
/commit                    # Analyze staged changes, create commit
/commit --amend            # Amend last commit (use carefully)
```

**Commit types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

### /pr - Create Pull Request

Creates PR with comprehensive description based on all commits in branch.

**Usage:**

```bash
/pr                        # Create PR from current branch
/pr draft                  # Create as draft PR
```

### /status - Development Status

Shows current work state, progress, and suggested next actions.

**Usage:**

```bash
/status                    # Full status overview
/status git                # Git status only
/status tasks              # Task list only
/status phase              # Current phase with next suggestion
```

### Methodology Summary

| Command        | Methodology | For                                 |
| -------------- | ----------- | ----------------------------------- |
| `/branch`      | —           | Git branch management (start here)  |
| `/worktree`    | —           | Parallel development                |
| `/distill`     | SDD         | Converting design docs to specs     |
| `/spec`        | SDD         | Writing new specs from scratch      |
| `/test`        | TDD         | Writing tests before implementation |
| `/eval`        | EDD         | Evaluating LLM outputs              |
| `/code`        | TDD         | Implementing until tests pass       |
| `/verify`      | —           | Pre-PR verification                 |
| `/commit`      | —           | Create conventional commit          |
| `/pr`          | —           | Create pull request                 |
| `/sync-linear` | —           | Sync specs with Linear issues       |

---

## Rules

Comprehensive rules are defined in `.claude/rules/`. Read relevant rules before starting work.

| Rule                                          | Purpose                         | Key Points                                     |
| --------------------------------------------- | ------------------------------- | ---------------------------------------------- |
| [methodology](.claude/rules/methodology.md)   | SDD/TDD/EDD approach            | Specs first, tests before code, evals for LLM  |
| [agents](.claude/rules/agents.md)             | 3-agent pattern, delegation     | Always delegate, researcher → writer → qa      |
| [coding-style](.claude/rules/coding-style.md) | Immutability, file organization | 30-line functions, no mutation, Zod validation |
| [security](.claude/rules/security.md)         | Security checklist, AI concerns | No secrets, prompt injection prevention        |
| [patterns](.claude/rules/patterns.md)         | tRPC, Prisma, React patterns    | Standard implementations                       |
| [testing](.claude/rules/testing.md)           | TDD, coverage requirements      | 70% coverage, red-green-refactor               |
| [performance](.claude/rules/performance.md)   | Model selection, optimization   | Haiku for QA, Sonnet for coding                |
| [git-workflow](.claude/rules/git-workflow.md) | Commits, branches, PRs          | Conventional commits, quality checks           |
| [hooks](.claude/rules/hooks.md)               | Hook system documentation       | Lifecycle events, custom hooks                 |

### Quick Rule References

**Before writing code:**

- Read `methodology.md` - Understand SDD/TDD/EDD flow
- Read `agents.md` - Know which agent to use

**While coding:**

- Follow `coding-style.md` - Immutability, small functions
- Follow `patterns.md` - Use established patterns

**Before committing:**

- Check `security.md` - No secrets, validated inputs
- Check `testing.md` - 70% coverage minimum
- Follow `git-workflow.md` - Conventional commits

---

## Skills

Reusable workflows and procedures defined in `.claude/skills/`.

| Skill                                                          | Purpose                       | Command           |
| -------------------------------------------------------------- | ----------------------------- | ----------------- |
| [verification-loop](.claude/skills/verification-loop/SKILL.md) | Pre-PR quality checks         | `/verify`         |
| [tdd-workflow](.claude/skills/tdd-workflow/SKILL.md)           | Red-Green-Refactor cycle      | `/test` + `/code` |
| [coding-standards](.claude/skills/coding-standards/SKILL.md)   | KISS, DRY, YAGNI principles   | All code work     |
| [backend-patterns](.claude/skills/backend-patterns/SKILL.md)   | tRPC, Prisma, API patterns    | `/code`           |
| [frontend-patterns](.claude/skills/frontend-patterns/SKILL.md) | React, hooks, state patterns  | `/code`, `/ui`    |
| [security-review](.claude/skills/security-review/SKILL.md)     | Security checklist, OWASP     | `/security`       |
| [eval-harness](.claude/skills/eval-harness/SKILL.md)           | EDD framework, pass@k metrics | `/eval`           |

### Verification Loop

Multi-phase verification before creating PRs:

```
Build → Types → Lint → Tests → Security → Diff Review
```

All phases must pass for READY status.

### TDD Workflow

Standard cycle for all implementation:

```
1. RED: Write failing test
2. GREEN: Minimal implementation to pass
3. REFACTOR: Clean up while staying green
4. REPEAT: Next behavior
```

### Coding Standards

Applied to all code:

- **KISS**: Simplest solution that works
- **DRY**: Extract duplication after 3 occurrences
- **YAGNI**: Don't build for hypothetical futures

---

## Contexts

Working modes that adjust behavior and priorities. See `.claude/contexts/`.

### Available Modes

| Mode         | Focus                 | Behavior                             |
| ------------ | --------------------- | ------------------------------------ |
| **dev**      | Active implementation | Code first, TDD, atomic commits      |
| **review**   | Quality assurance     | Security first, thorough analysis    |
| **research** | Exploration           | Read first, no code without approval |

### dev (Development)

**Use when:** Actively implementing features, fixing bugs, writing code.

**Priorities:**

1. Working code
2. Test coverage
3. Clean implementation

**Tools:** Edit, Write, Bash (commands), Task agents

### review (Code Review)

**Use when:** Reviewing PRs, auditing code, quality checks.

**Priorities:**

1. Security vulnerabilities
2. Correctness
3. Maintainability
4. Performance

**Tools:** Read, Grep, Glob, Bash (verification)

### research (Exploration)

**Use when:** Understanding codebase, investigating options, learning.

**Priorities:**

1. Understanding
2. Documentation
3. Options analysis
4. Recommendations

**Tools:** Read, Glob, Grep, WebSearch, Task (Explore agent)

**Rule:** No code modifications without explicit approval.

### Switching Contexts

```bash
/context dev       # Switch to implementation mode
/context review    # Switch to review mode
/context research  # Switch to exploration mode
```

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

### Session Hooks

| Event         | Action                  | Purpose                              |
| ------------- | ----------------------- | ------------------------------------ |
| Session Start | Load context, detect PM | Resume with previous state           |
| Session End   | Persist state           | Save for next session                |
| Pre-Compact   | Save state              | Preserve context before compaction   |
| Stop          | Final checks            | console.log scan, pattern extraction |

### Compaction Reminders

After 50+ edit/write operations, a reminder suggests manual compaction at logical breakpoints:

- After completing research
- After finishing a feature
- Before starting unrelated work

---

## Model Selection

Choose appropriate models based on task complexity. See `.claude/rules/performance.md`.

| Model      | Use For                                   | Cost   |
| ---------- | ----------------------------------------- | ------ |
| **Haiku**  | QA agents, verification, simple tasks     | Low    |
| **Sonnet** | Main development, coding, orchestration   | Medium |
| **Opus**   | Architecture, complex reasoning, research | High   |

### Agent Model Assignment

| Agent Type       | Model  | Reasoning                      |
| ---------------- | ------ | ------------------------------ |
| \*-researcher    | Sonnet | Read-heavy, moderate reasoning |
| \*-writer        | Sonnet | Complex generation             |
| \*-qa            | Haiku  | Checklist-based verification   |
| security-auditor | Sonnet | Security expertise             |
| pr-reviewer      | Sonnet | Comprehensive review           |
| debugger         | Sonnet | Investigation skills           |

### Context Window Management

**Strategic compaction points:**

- After completing research, before implementation
- After finishing a feature, before starting next
- When switching between unrelated tasks
- After 50+ tool calls (hook will remind)

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

| Tool                        | URL/Command                             | Purpose                                       |
| --------------------------- | --------------------------------------- | --------------------------------------------- |
| **Spec Workflow Dashboard** | [localhost:5000](http://localhost:5000) | Spec management, approvals, progress tracking |
| **Next.js Dev Server**      | [localhost:3000](http://localhost:3000) | Your application                              |
| **Vitest UI**               | `pnpm test:ui`                          | Interactive test runner                       |
| **Playwright UI**           | `pnpm test:e2e --ui`                    | E2E test visualization                        |
| **Prisma Studio**           | `pnpm prisma studio`                    | Database browser                              |

### Your Interaction Points

| Phase               | Your Action              | Where                           |
| ------------------- | ------------------------ | ------------------------------- |
| **Spec Approval**   | Review and approve specs | Spec Dashboard (localhost:5000) |
| **Test Review**     | Approve test strategy    | Terminal output                 |
| **Eval Thresholds** | Define pass criteria     | Terminal conversation           |
| **UI Review**       | Visual verification      | Browser (localhost:3000)        |
| **Security Triage** | Prioritize findings      | Terminal output                 |
| **PR Approval**     | Final merge decision     | GitHub                          |

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
