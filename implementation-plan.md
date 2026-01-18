# Shared Development Configs Implementation Plan

> **Purpose:** Create a centralized repository for development tooling that can be shared across your React/Next.js projects, optimized for AI-assisted development with Claude Code.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1: Repository Setup](#phase-1-repository-setup)
4. [Phase 2: ESLint Config Package](#phase-2-eslint-config-package)
5. [Phase 3: Prettier Config Package](#phase-3-prettier-config-package)
6. [Phase 4: TypeScript Config Package](#phase-4-typescript-config-package)
7. [Phase 5: Quality Scripts Package](#phase-5-quality-scripts-package)
8. [Phase 6: Husky/Git Hooks](#phase-6-huskygit-hooks)
9. [Phase 7: Claude Code Integration](#phase-7-claude-code-integration)
10. [Phase 8: MCP Server Integration](#phase-8-mcp-server-integration)
11. [Phase 9: Spec-Driven Development](#phase-9-spec-driven-development)
12. [Phase 10: Test-Driven AI Workflow](#phase-10-test-driven-ai-workflow)
13. [Phase 11: AI-Enhanced GitHub Workflows](#phase-11-ai-enhanced-github-workflows)
14. [Phase 12: Integration Into Existing Projects](#phase-12-integration-into-existing-projects)
15. [Maintenance & Versioning](#maintenance--versioning)
16. [Tool Reference](#tool-reference)

---

## Overview

### Problem Statement

Each React/Next.js project currently has its own implementation of:

- ESLint configuration
- Prettier configuration
- TypeScript configuration
- CI/CD workflows
- Git hooks
- Quality checking scripts

Additionally, when using AI coding agents like Claude Code:

- Agents may hallucinate non-existent packages (research shows 5-21% of AI-recommended packages don't exist)
- No guardrails to catch AI-generated code issues before commit
- No integration with Next.js dev server for real-time error feedback
- Inconsistent CLAUDE.md files leading to unpredictable AI behavior

### Solution

Create a single GitHub repository (`react-basecamp`) that:

1. Publishes shareable npm packages for React/Next.js configs
2. Hosts reusable GitHub Actions workflows
3. Provides CLI scripts for quality checks
4. Integrates with Claude Code via hooks, subagents, and MCP
5. Can be versioned and updated across all React/Next.js projects

### Target Projects

React/Next.js web applications (e.g., orchestrator-dashboard)

---

## Architecture

### Repository Structure

The `react-basecamp` repository will be organized as a pnpm monorepo with the following structure:

- `.github/workflows/` - CI for this repo, auto-publish, and reusable workflows
- `packages/` - Contains all publishable npm packages:
  - `eslint-config/` - React/Next.js ESLint rules
  - `prettier-config/` - Prettier config with Tailwind plugin
  - `tsconfig/` - React/Next.js TypeScript config
  - `quality-scripts/` - CLI for dead code, duplicates, dead UI, circular deps, secrets
- `templates/` - Husky hooks, GitHub CI templates, CLAUDE.md template, Claude Code hooks

### Package Naming

Using npm scoped packages under your namespace:

| Package    | Name                            | Purpose                   |
| ---------- | ------------------------------- | ------------------------- |
| ESLint     | `@benjaminrose/eslint-config`   | Shareable ESLint rules    |
| Prettier   | `@benjaminrose/prettier-config` | Shareable Prettier config |
| TypeScript | `@benjaminrose/tsconfig`        | Shareable TSConfig base   |
| Scripts    | `@benjaminrose/quality-scripts` | CLI for quality checks    |

> **Note:** Replace `@benjaminrose` with your preferred npm scope.

---

## Phase 1: Repository Setup

### Tasks

1. Create GitHub repository (`react-basecamp`)
2. Initialize pnpm workspace
3. Create workspace configuration
4. Create root package.json with workspace scripts
5. Set up npm organization (if not already done)

### Deliverables

- [x] GitHub repository created
- [x] pnpm workspace configured
- [x] npm scope ready for publishing

---

## Phase 2: ESLint Config Package

### Purpose

Centralize all ESLint rules for React/Next.js projects.

### Key Rules

**Dead Code Prevention:**

- `no-empty-function`
- `unused-imports/no-unused-imports`
- `@typescript-eslint/no-unused-vars`

**Code Complexity (matches CLAUDE.md limits):**

- `max-lines-per-function`: 30
- `complexity`: 10
- `max-depth`: 4
- `max-params`: 4

**Import Organization:**

- `import/no-duplicates`
- `import/no-cycle`
- `import/order`

**React-Specific:**

- `react-hooks/rules-of-hooks`
- `react-hooks/exhaustive-deps`
- `react/button-has-type`
- `react/jsx-no-target-blank`

**Next.js-Specific (`@next/eslint-plugin-next`):**

- `@next/next/no-img-element` - Enforce next/image usage
- `@next/next/no-html-link-for-pages` - Enforce next/link usage
- `@next/next/no-sync-scripts` - Prevent synchronous scripts
- `@next/next/google-font-display` - Proper font loading

**Accessibility (`eslint-plugin-jsx-a11y`):**

- `jsx-a11y/alt-text` - Images must have alt text
- `jsx-a11y/anchor-is-valid` - Valid anchor elements
- `jsx-a11y/click-events-have-key-events` - Keyboard accessibility
- `jsx-a11y/no-static-element-interactions` - Proper interactive elements

**Best Practices:**

- `no-console` (warn for log, allow warn/error)
- `eqeqeq`
- `curly`
- `no-var`
- `prefer-const`
- `prefer-template`

### Deliverables

- [x] ESLint config with dead code, React, Next.js, and a11y rules
- [x] README with usage examples
- [ ] Published to npm

---

## Phase 3: Prettier Config Package

### Purpose

Consistent code formatting across all React/Next.js projects.

### Configuration

The package will export a config with:

- Standard settings (semi, singleQuote, tabWidth, trailingComma, printWidth, etc.)
- Tailwind CSS plugin for class sorting

### Deliverables

- [x] Prettier config package
- [x] README with usage examples
- [ ] Published to npm

---

## Phase 4: TypeScript Config Package

### Purpose

Consistent TypeScript settings with strict mode for React/Next.js.

### Configuration

- Strict mode enabled (noUnusedLocals, noUnusedParameters, exactOptionalPropertyTypes, etc.)
- DOM and JSX libs
- Bundler module resolution
- React JSX transform

### Deliverables

- [x] TypeScript config for React/Next.js
- [x] README with usage examples
- [ ] Published to npm

---

## Phase 5: Quality Scripts Package

### Purpose

Provide CLI tools for detecting dead code, duplicates, dead UI elements, and other quality issues.

### CLI Commands

- `quality-check all` - Run all quality checks
- `quality-check dead-code` - Find unused files, exports, and dependencies (Knip wrapper)
- `quality-check duplicates` - Find duplicate code blocks (jscpd wrapper)
- `quality-check dead-ui` - Find dead UI elements (empty handlers, placeholder links)
- `quality-check circular` - Find circular dependencies (Madge wrapper)
- `quality-check secrets` - Scan for accidentally committed secrets (Gitleaks wrapper)
- `quality-check packages` - Verify all dependencies exist in npm registry (hallucination protection)

### Dead UI Patterns Detected

- Empty onClick handlers
- Undefined/null onClick
- Placeholder href (`#`)
- Empty onSubmit
- Disabled without reason
- TODO in handlers

### Package Hallucination Check

AI coding agents sometimes recommend non-existent packages. This check:

- Verifies all dependencies in package.json exist in npm registry
- Runs after any package.json modification
- Blocks commits if hallucinated packages are detected

### Deliverables

- [x] CLI with commander.js
- [x] Dead code check (Knip wrapper)
- [x] Duplicate check (jscpd wrapper)
- [x] Dead UI check (custom regex patterns)
- [x] Circular dependency check (Madge wrapper)
- [x] Secrets check (Gitleaks wrapper)
- [x] Package existence check (npm registry verification)
- [x] Console and JSON reporters
- [x] README with usage examples
- [ ] Published to npm

---

## Phase 6: Husky/Git Hooks

### Purpose

Provide standardized git hooks that can be copied into projects.

### Hook Templates

**pre-commit:**

- lint-staged
- Dead UI check on staged files
- Secrets scan
- Package existence check (if package.json modified)

**pre-push:**

- Prevent direct pushes to master/main
- Type check
- Dead code check
- E2E smoke tests

**commit-msg:**

- Conventional commit format validation

### Deliverables

- [x] pre-commit hook template
- [x] pre-push hook template
- [x] commit-msg hook template
- [x] Installation script
- [x] README with customization guide

---

## Phase 7: Claude Code Integration

### Purpose

Provide guardrails and automation for AI-assisted development with Claude Code.

### Claude Code Hooks

Claude Code hooks are shell commands that execute automatically when Claude uses specific tools. Unlike CLAUDE.md instructions (which are suggestions), hooks are **guaranteed to execute**.

**PostToolUse Hooks:**

| Trigger                          | Action                              |
| -------------------------------- | ----------------------------------- |
| After editing `.ts`/`.tsx` files | Run `tsc --noEmit` on changed files |
| After editing `.ts`/`.tsx` files | Run `eslint --fix` on changed files |
| After editing `package.json`     | Run package existence check         |
| After any file edit              | Run Prettier on changed files       |

**PreToolUse Hooks:**

| Trigger                   | Action                            |
| ------------------------- | --------------------------------- |
| Before Bash `git commit`  | Run full quality check            |
| Before Bash `npm install` | Verify package exists in registry |

### Subagents

Specialized AI agents with scoped permissions for specific tasks:

| Subagent           | Tools                         | Purpose                               |
| ------------------ | ----------------------------- | ------------------------------------- |
| `code-reviewer`    | Read, Grep, Glob (read-only)  | Review code without modification risk |
| `security-auditor` | Read, Grep, Glob (read-only)  | Security-focused code review          |
| `test-writer`      | Read, Grep, Glob, Edit, Write | Generate tests for existing code      |
| `docs-writer`      | Read, Grep, Glob, Edit, Write | Generate documentation                |

### CLAUDE.md Template

Provide a standardized CLAUDE.md template following best practices:

**Structure:**

- Keep under 200 lines
- Use file:line references, not code snippets
- Hierarchical: root CLAUDE.md + subdirectory overrides
- Let linters handle style (don't repeat ESLint rules)
- Focus on project-specific context, not generic rules

**Required Sections:**

- Project overview (1-2 sentences)
- Tech stack
- Key commands (`npm run dev`, `npm test`, etc.)
- Architecture notes (where things live)
- Anti-patterns specific to this project

### Deliverables

- [x] Claude Code hooks configuration template
- [x] Subagent definitions
- [x] CLAUDE.md template
- [x] Documentation on hook customization
- [x] Installation script for Claude Code setup

---

## Phase 8: MCP Server Integration

### Purpose

Enable Claude Code to access development tools, error monitoring, and design context through Model Context Protocol servers.

### What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI agents to interact with applications through a standardized interface. Multiple MCP servers can be configured to give Claude access to different tools.

### Recommended MCP Servers

#### 1. TypeScript LSP MCP (Required)

Give Claude IDE-like code intelligence capabilities. Navigates codebases in 50ms vs 45 seconds with text search.

**Setup:** `npx cclsp` (Claude Code LSP)

| Tool              | What It Does                      |
| ----------------- | --------------------------------- |
| `goto_definition` | Jump to where a symbol is defined |
| `find_references` | Find all usages of a symbol       |
| `hover`           | Get type information for a symbol |
| `diagnostics`     | Get real-time TypeScript errors   |
| `rename_symbol`   | Rename across the codebase        |

**Benefits:**

- Claude understands types and relationships instantly
- Accurate refactoring with full reference tracking
- No more "I can't find that function" issues

#### 2. Next.js DevTools MCP (Required)

Access live Next.js dev server state for real-time error detection.

**Setup:** `npx -y next-devtools-mcp@latest`

| Tool                   | What It Does                                             |
| ---------------------- | -------------------------------------------------------- |
| `get_errors`           | Retrieve build, runtime, and type errors from dev server |
| `get_logs`             | Access development server logs                           |
| `get_page_metadata`    | Query routes, pages, and component metadata              |
| `get_project_metadata` | Get project structure and config                         |

#### 4. Playwright MCP (Required)

Browser automation for testing and verification. Uses accessibility tree instead of screenshots.

**Setup:** `npx @playwright/mcp@latest`

| Tool               | What It Does                          |
| ------------------ | ------------------------------------- |
| `browser_navigate` | Navigate to URLs                      |
| `browser_click`    | Click elements by accessibility label |
| `browser_snapshot` | Get accessibility tree snapshot       |
| `browser_type`     | Type into form fields                 |

**Benefits:**

- Claude can verify UI changes in a real browser
- Test user flows without screenshots
- Validate that changes work as expected

#### 5. Sentry MCP (Recommended)

AI-powered error monitoring and debugging.

**Setup:** `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`

| Tool               | What It Does                           |
| ------------------ | -------------------------------------- |
| `get_sentry_issue` | Retrieve full issue context            |
| `search_issues`    | Natural language search for errors     |
| `get_issue_events` | Get error occurrences and stack traces |

**Benefits:**

- Claude can see production errors directly
- Root cause analysis with full context
- Can suggest fixes based on error patterns

#### 6. Figma MCP (Optional - for design-to-code)

Bridge between Figma designs and React code generation.

**Setup:** Download from Figma and run locally

| Tool            | What It Does                                    |
| --------------- | ----------------------------------------------- |
| `get_code`      | Get React/Tailwind code for selected Figma node |
| `get_image`     | Export images from Figma                        |
| `get_variables` | Get design tokens and variables                 |

**Benefits:**

- Claude can read Figma designs directly
- Generates code matching design tokens
- Reduces designer-to-developer handoff time by 50-70%

#### 7. Storybook MCP (Optional - for component libraries)

Access Storybook documentation and component props.

**Setup:** `npx storybook-mcp`

| Tool                 | What It Does                      |
| -------------------- | --------------------------------- |
| `getComponentList`   | List all components in Storybook  |
| `getComponentsProps` | Get detailed props for components |

**Benefits:**

- Claude understands your component library
- Generates correct prop usage
- Discovers existing components before creating new ones

### MCP Configuration Summary

| Server                 | Priority    | Use Case                                        |
| ---------------------- | ----------- | ----------------------------------------------- |
| cclsp (TypeScript LSP) | Required    | Code intelligence, go-to-definition, references |
| next-devtools-mcp      | Required    | Dev server errors, project context              |
| @playwright/mcp        | Required    | Browser testing, UI verification                |
| Sentry MCP             | Recommended | Production error debugging                      |
| Figma MCP              | Optional    | Design-to-code workflow                         |
| Storybook MCP          | Optional    | Component library context                       |

### Deliverables

- [x] MCP configuration template with all servers
- [x] Setup documentation for each server
- [ ] Integration with Claude Code hooks (auto-check errors after edits)
- [x] Troubleshooting guide for MCP connections

---

## Phase 9: Spec-Driven Development

### Purpose

Establish a specification-first workflow where features are designed before code is written, reducing AI hallucinations and rework.

### What is Spec-Driven Development?

SDD is a development paradigm that uses well-crafted specifications as prompts for AI coding agents. Instead of coding first and writing docs later, you start with specifications that become the source of truth.

**Key insight:** "Fixing ideas on paper is cheaper than fixing code later."

### The Four-Phase Workflow

| Phase         | What Happens                                                                                    | Output       |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| **Specify**   | Define what you're building and why. Focus on user journeys, experiences, and success criteria. | `spec.md`    |
| **Plan**      | Get technical. Define stack, architecture, constraints.                                         | `plan.md`    |
| **Tasks**     | Break down into small, testable chunks. Each task is implementable and testable in isolation.   | `tasks.md`   |
| **Implement** | AI generates code against the spec, with clear success criteria.                                | Code + tests |

### Relationship to TDD

| Methodology | Focus                     | Starting Point |
| ----------- | ------------------------- | -------------- |
| **SDD**     | What and why              | Specification  |
| **BDD**     | Behavior across system    | User stories   |
| **TDD**     | Correctness at code level | Tests          |

SDD precedes both TDD and BDD. Write the spec first, then derive tests from it.

### Spec Template

Provide a standardized spec template with sections for:

**Required Sections:**

- **Goal**: 1-2 sentences on what we're building
- **User Stories**: Who uses this and how
- **Success Criteria**: How we know it's done (measurable)
- **Technical Constraints**: Stack, patterns, limitations
- **Out of Scope**: What we're explicitly NOT building

**Optional Sections:**

- **Edge Cases**: Known tricky scenarios
- **Dependencies**: What this feature depends on
- **Risks**: What could go wrong

### Integration with Claude Code

**Workflow:**

1. Write spec in `specs/feature-name.md`
2. Claude reads spec before any implementation
3. Claude generates tasks from spec
4. Each task references back to spec section
5. PR description links to spec for review

**CLAUDE.md Integration:**
Add instruction: "Before implementing any feature, check for a spec in `specs/`. If no spec exists, ask the user to create one or offer to draft one together."

### GitHub Spec-Kit Integration

Optionally integrate with GitHub's [spec-kit](https://github.com/github/spec-kit) for structured spec workflows:

- Predefined spec templates
- Task generation from specs
- Progress tracking

### Deliverables

- [x] Spec template (`templates/specs/spec.md`)
- [x] Example spec for reference (`templates/specs/example-user-profile.md`)
- [x] CLAUDE.md instructions for spec-first workflow
- [x] GitHub issue template linking to specs (`templates/github/ISSUE_TEMPLATE/`)
- [x] Documentation on when to write specs vs. just code (`templates/specs/README.md`)

---

## Phase 10: Test-Driven AI Workflow

### Purpose

Establish a workflow where AI-generated code is automatically verified through tests.

### Philosophy

AI coding agents work best with TDD because:

- Tests provide clear success criteria
- Failed tests trigger self-correction loops
- Test coverage prevents regression

### Workflow

1. **Before coding:** AI reads existing tests or writes new ones
2. **During coding:** AI runs tests after each significant change
3. **After coding:** CI enforces coverage thresholds

### Test Coverage Requirements

| Metric            | Threshold   | Enforcement  |
| ----------------- | ----------- | ------------ |
| Line coverage     | 70% minimum | CI blocks PR |
| Branch coverage   | 60% minimum | CI blocks PR |
| New code coverage | 80% minimum | CI blocks PR |

### Claude Code Hook Integration

**PostToolUse Hook:**

- After editing source files, run related tests
- If tests fail, Claude sees the failure and self-corrects

### Vitest Integration

Configure Vitest for:

- Watch mode during development
- Coverage reporting
- Snapshot testing for components

### Playwright Integration

Configure Playwright for:

- E2E smoke tests (fast, critical paths)
- Full E2E suite (comprehensive)
- Visual regression testing

### Deliverables

- [x] Vitest configuration template
- [x] Playwright configuration template
- [ ] Coverage threshold enforcement in CI (Phase 11)
- [x] Claude Code hooks for test-after-edit
- [x] Documentation on TDD workflow with AI

---

## Phase 11: AI-Enhanced GitHub Workflows

### Purpose

Centralize CI/CD workflows with AI integration capabilities, leveraging the tools and patterns established in phases 6-10.

### Standard Workflows

These provide foundational CI/CD:

- `reusable-quality.yml` - Lint, typecheck, dead code, duplicates, dead UI
- `reusable-test.yml` - Unit tests with coverage thresholds
- `reusable-security.yml` - npm audit, Gitleaks, package existence verification
- `reusable-e2e.yml` - Playwright E2E tests
- `reusable-build.yml` - Production build, bundle analysis, Lighthouse

All workflows accept inputs for customization (node version, working directory, which checks to run, etc.).

### AI-Enhanced Workflows

These workflows leverage Claude Code and the AI tooling from phases 7-10:

**AI Code Review (`reusable-ai-review.yml`):**

- Runs Claude Code to review PR changes
- Checks against quality rules and patterns from CLAUDE.md
- Posts review comments directly on PR
- Can be configured to block merge on critical issues

**Spec Validation (`reusable-spec-validation.yml`):**

- Verifies spec files exist for new features
- Validates spec format against template
- Checks that implementation matches spec requirements
- Links PRs to their corresponding specs

**AI-Generated PR Descriptions (`reusable-pr-description.yml`):**

- Analyzes commits and diffs
- Generates structured PR summary
- Includes test plan based on changes
- Links to relevant specs

**Test Coverage Analysis (`reusable-ai-coverage.yml`):**

- AI analyzes code changes
- Suggests missing test cases
- Identifies edge cases not covered
- Runs after standard test workflow

**AI Release Notes (`reusable-ai-changelog.yml`):**

- Generates changelog from commits + specs
- Groups changes by type (feature, fix, etc.)
- Highlights breaking changes
- Creates draft GitHub release

### Security Workflow Enhancements

The security workflow includes:

- Package existence verification (catches hallucinated dependencies)
- Lockfile integrity check
- Dependency review for PRs

### Deliverables

**Standard CI:**

- [x] Reusable quality workflow
- [x] Reusable test workflow
- [x] Reusable security workflow (with package verification)
- [x] Reusable E2E workflow
- [x] Reusable build workflow
- [x] Auto-publish workflow for packages

**AI-Enhanced:**

- [x] AI code review workflow
- [x] Spec validation workflow
- [x] AI-generated PR description workflow
- [x] AI test coverage analysis workflow
- [x] AI changelog/release notes workflow

**Documentation:**

- [x] How to compose workflows
- [x] How to customize AI review rules
- [x] Rate limiting and cost management for AI workflows

---

## Phase 12: Integration Into Existing Projects

### Migration Steps

1. Install packages
2. Update ESLint config
3. Update Prettier config
4. Update TypeScript config
5. Add quality scripts to package.json
6. Update CI workflow to use reusable workflows
7. Update git hooks
8. Set up Claude Code hooks
9. Configure MCP servers (LSP, Next.js DevTools, Playwright, etc.)
10. Add CLAUDE.md
11. Create specs directory and initial spec template

### Migration Checklist

**orchestrator-dashboard**:

- [ ] Install packages
- [ ] Migrate ESLint config
- [ ] Migrate Prettier config
- [ ] Migrate TypeScript config
- [ ] Add quality scripts
- [ ] Update CI workflow
- [ ] Update git hooks
- [ ] Set up Claude Code hooks
- [ ] Configure MCP servers (cclsp, next-devtools-mcp, playwright-mcp)
- [ ] Create CLAUDE.md
- [ ] Set up specs directory
- [ ] Run full quality check
- [ ] Fix any issues found

---

## Maintenance & Versioning

### Versioning Strategy

Use semantic versioning for all packages:

- **MAJOR**: Breaking changes (rule changes that cause new errors)
- **MINOR**: New features (new optional rules, new checks)
- **PATCH**: Bug fixes

### Release Process

1. Make changes in react-basecamp repo
2. Update CHANGELOG.md
3. Bump version in affected package(s)
4. Create GitHub release
5. Auto-publish workflow publishes to npm
6. Consumer projects update with `npm update`

### Keeping Projects Updated

**Option A: Dependabot** - Configure to group `@benjaminrose/*` packages for weekly updates.

**Option B: Manual updates** - Run `npm update` for the shared packages.

---

## Tool Reference

### Tools Included in Quality Scripts

| Tool                      | Check Type    | What It Finds                       |
| ------------------------- | ------------- | ----------------------------------- |
| **Knip**                  | Dead code     | Unused files, exports, dependencies |
| **jscpd**                 | Duplicates    | Copy-pasted code blocks             |
| **Madge**                 | Architecture  | Circular dependencies               |
| **Custom: dead-ui**       | Dead UI       | Empty handlers, placeholder links   |
| **Gitleaks**              | Security      | Committed secrets                   |
| **Custom: package-check** | Hallucination | Non-existent npm packages           |

### ESLint Rules Summary

| Category       | Rules                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| Dead Code      | `no-empty-function`, `unused-imports/no-unused-imports`, `@typescript-eslint/no-unused-vars` |
| Complexity     | `max-lines-per-function` (30), `complexity` (10), `max-depth` (4), `max-params` (4)          |
| Imports        | `import/no-duplicates`, `import/no-cycle`, `import/order`                                    |
| React          | `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react/button-has-type`         |
| Next.js        | `@next/next/no-img-element`, `@next/next/no-html-link-for-pages`                             |
| Accessibility  | `jsx-a11y/alt-text`, `jsx-a11y/click-events-have-key-events`                                 |
| Best Practices | `no-console`, `eqeqeq`, `curly`, `prefer-const`, `prefer-template`                           |

### Claude Code Integration Summary

| Component | Purpose                                      |
| --------- | -------------------------------------------- |
| Hooks     | Automatic quality checks after AI edits      |
| Subagents | Specialized agents for review, testing, docs |
| CLAUDE.md | Project context for AI understanding         |

### MCP Servers Summary

| Server                 | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| cclsp (TypeScript LSP) | Code intelligence, go-to-definition, references |
| next-devtools-mcp      | Dev server errors, project metadata             |
| @playwright/mcp        | Browser automation, UI verification             |
| Sentry MCP             | Production error monitoring                     |
| Figma MCP              | Design-to-code generation                       |
| Storybook MCP          | Component library context                       |

---

## Summary

| Component                       | Purpose                        | Update Mechanism     |
| ------------------------------- | ------------------------------ | -------------------- |
| `@benjaminrose/eslint-config`   | Consistent linting rules       | npm update           |
| `@benjaminrose/prettier-config` | Consistent formatting          | npm update           |
| `@benjaminrose/tsconfig`        | Consistent TypeScript settings | npm update           |
| `@benjaminrose/quality-scripts` | CLI for quality checks         | npm update           |
| Reusable GitHub Workflows       | Consistent CI/CD               | Auto (workflow_call) |
| Husky Templates                 | Consistent git hooks           | Manual copy          |
| Claude Code Hooks               | AI guardrails                  | Manual copy          |
| MCP Configuration               | AI dev server access           | Manual setup         |
| CLAUDE.md Template              | AI context                     | Manual copy          |
| Spec Template                   | Spec-driven development        | Manual copy          |

**Total phases**: 12
**Packages to publish**: 4
**Standard workflows**: 6 (quality, test, security, E2E, build, publish)
**AI-enhanced workflows**: 5 (review, spec validation, PR description, coverage, changelog)
**MCP servers**: 6 (3 required, 3 optional)

Once implemented, adding a new quality check or rule update becomes:

1. Update react-basecamp repo
2. Publish new version
3. All React/Next.js projects get update via `npm update` or Dependabot

### AI Development Benefits

With this setup, Claude Code can:

- Navigate code instantly via LSP (50ms vs 45 seconds)
- See build/type errors in real-time via MCP
- Self-correct via test failures
- Be blocked from committing bad code via hooks
- Have consistent context via CLAUDE.md
- Work from clear specs, reducing hallucinations
- Never introduce hallucinated packages
