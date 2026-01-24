# My App

Next.js application with AI-assisted development via specialized agents.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly (e.g., "What framework is this?" or "Where is the config?"). But any actual work MUST go through an agent.

## Agent Routing

| Command              | Subcommands                                   | Runs Agents                                           |
| -------------------- | --------------------------------------------- | ----------------------------------------------------- |
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
│  0. DISTILL (when design docs exist)                        │
│     /distill [feature]   → Research docs → Write spec → QA  │
│                                                             │
│     Converts ~/basecamp/docs/ into implementation specs     │
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

```
distill-researcher
├── Reads: docs/specs/{feature}.md
├── Reads: docs/architecture/data-models.md
├── Reads: docs/architecture/database-schema.md
├── Reads: docs/architecture/api-contracts.md
├── Reads: docs/architecture/tech-stack.md
└── Outputs: Research brief with entities, APIs, UI, scope

distill-spec-writer
├── Inputs: Research brief
├── Template: specs/spec-template.md
└── Outputs: specs/{feature}.md (max 2 pages)

distill-qa
├── Validates: Template compliance
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

### Methodology Summary

| Command    | Methodology | For                                 |
| ---------- | ----------- | ----------------------------------- |
| `/distill` | SDD         | Converting design docs to specs     |
| `/spec`    | SDD         | Writing new specs from scratch      |
| `/test`    | TDD         | Writing tests before implementation |
| `/eval`    | EDD         | Evaluating LLM outputs              |
| `/code`    | TDD         | Implementing until tests pass       |
| `/verify`  | —           | Pre-PR verification                 |

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
