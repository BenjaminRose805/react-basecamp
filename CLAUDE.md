# My App

Next.js application with AI-assisted development via specialized agents.

## Core Rule

**ALWAYS delegate work to the appropriate agent. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly (e.g., "What framework is this?" or "Where is the config?"). But any actual work MUST go through an agent.

## Agent Routing

| Command             | Subcommands               | Runs Agents                             |
| ------------------- | ------------------------- | --------------------------------------- |
| `/spec [feature]`   | `research`, `write`, `qa` | spec-researcher → spec-writer → spec-qa |
| `/test [feature]`   | `research`, `write`, `qa` | test-researcher → test-writer → test-qa |
| `/code [feature]`   | `research`, `write`, `qa` | code-researcher → code-writer → code-qa |
| `/ui [component]`   | `research`, `build`, `qa` | ui-researcher → ui-builder → ui-qa      |
| `/docs [topic]`     | `research`, `write`, `qa` | docs-researcher → docs-writer → docs-qa |
| `/debug [issue]`    | —                         | debugger (reactive bug hunting)         |
| `/security [scope]` | —                         | security-auditor                        |
| `/review [PR]`      | —                         | pr-reviewer                             |

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
│  1. DEFINE                                                  │
│     /spec [feature]      → Research → Write → QA            │
│     /ui [component]      → Research → Build → QA (if needed)│
├─────────────────────────────────────────────────────────────┤
│  2. TEST (TDD Red)                                          │
│     /test [feature]      → Research → Write → QA            │
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

**Bug fix:**

```
/debug → /test (add regression test) → /code → /security → /review
```

**PR review:**

```
/security → /review
```

**Individual phases:**

- Use `/code research` to check for conflicts before writing
- Use `/code write` if research already approved
- Use `/code qa` to re-validate after fixes

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
└── types/            # TypeScript type definitions

e2e/                  # Playwright E2E tests
specs/                # Feature specifications
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

See `docs/MCP_SETUP.md` for full setup.

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
