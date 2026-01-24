# GitHub App Integrations

External services integrated with this repository via GitHub Apps.

## Overview

| Integration                     | Purpose             | Trigger         |
| ------------------------------- | ------------------- | --------------- |
| [Renovate](#renovate)           | Dependency updates  | Scheduled       |
| [Linear](#linear)               | Issue tracking      | PR/commit links |
| [Lighthouse CI](#lighthouse-ci) | Performance testing | PR checks       |
| [Vercel](#vercel)               | Deployment          | Push to main/PR |
| [CoderabbitAI](#coderabbitai)   | AI code review      | PR opened       |
| [CodeCov](#codecov)             | Coverage reporting  | PR checks       |
| [Claude](#claude)               | AI assistant        | Manual/API      |

---

## Renovate

**Purpose:** Automated dependency updates

**What it does:**

- Scans package.json for outdated dependencies
- Creates PRs to update packages
- Groups related updates (e.g., all ESLint packages)
- Respects semver and update schedules

**Configuration:** `renovate.json` (if customized)

**Best practices:**

- Set automerge for patch updates
- Group major updates for review
- Pin dependencies in production
- Schedule updates for low-traffic times

**Workflow integration:**

- Renovate PR → CI runs → Auto-merge (if configured) or manual review

---

## Linear

**Purpose:** Issue and project tracking

**What it does:**

- Links commits/PRs to Linear issues
- Updates issue status based on PR state
- Provides bidirectional sync

### Branch Naming Convention

Use this format to auto-link branches to Linear issues:

```
<type>/<issue-id>-<description>
```

**Examples:**

```bash
feat/ABC-123-user-authentication
fix/ABC-456-login-redirect-bug
refactor/ABC-789-api-cleanup
```

### Commit Message Convention

Include the issue ID in commits:

```
<type>: <description> [ABC-123]
```

**Examples:**

```bash
feat: add login form [ABC-123]
fix: resolve redirect loop [ABC-456]
```

### PR Linking

Link PRs to Linear issues in the description:

```markdown
Fixes ABC-123
Closes ABC-456
Related to ABC-789
```

### Workflow Integration

```
1. Create Linear issue (or use /plan to reference existing)
2. Create branch: git checkout -b feat/ABC-123-feature-name
3. Commit with ID: feat: add feature [ABC-123]
4. PR description: Fixes ABC-123
5. Linear auto-updates issue status on PR merge
```

**Best practices:**

- Always include issue ID in branch name
- Reference issues in commits for traceability
- Use Linear's cycle planning for sprints
- Track velocity metrics in Linear

---

## Lighthouse CI

**Purpose:** Performance, accessibility, SEO, and best practices auditing

**What it does:**

- Runs Lighthouse audits on PRs
- Compares against baseline/budget
- Blocks PRs that regress performance
- Tracks metrics over time

**Configuration:** `lighthouserc.js` or `.lighthouserc.json`

**Metrics tracked:**

- Performance score
- Accessibility score
- Best practices score
- SEO score
- Core Web Vitals (LCP, FID, CLS)

**Best practices:**

- Set performance budgets
- Fail PRs below thresholds
- Track trends over time
- Test critical user paths

**Workflow integration:**

- Part of `/verify` checks
- Blocks `/pr` if scores regress

---

## Vercel

**Purpose:** Application deployment and hosting (optimized for Next.js)

**What it does:**

- Auto-deploys on push to main (production)
- Auto-creates preview deployments for every PR
- Handles CDN, SSL, and edge functions
- Zero-config for Next.js apps

**Configuration:** `vercel.json` (optional), Vercel Dashboard

**Best practices:**

- Use preview deployments for PR testing
- Set environment variables in Vercel Dashboard
- Use Vercel Analytics for performance monitoring
- Enable Speed Insights for Core Web Vitals

**Workflow integration:**

- Push to main → Auto-deploy to production
- PR opened → Auto-deploy preview with unique URL
- PR comment with preview link (automatic)

**No GitHub Actions needed** - Vercel's GitHub integration handles everything.

---

## CoderabbitAI

**Purpose:** AI-powered code review

**What it does:**

- Automatically reviews PRs
- Suggests improvements
- Catches bugs and security issues
- Provides inline comments

**Configuration:** `.coderabbit.yaml` (if customized)

**Best practices:**

- Use as first-pass review
- Configure review depth
- Set up custom rules
- Combine with human review

**Workflow integration:**

- PR opened → CoderabbitAI reviews → Address feedback → Human review
- Complements `/review` command

---

## CodeCov

**Purpose:** Code coverage tracking and enforcement

**What it does:**

- Collects coverage reports from CI
- Tracks coverage trends
- Comments on PRs with coverage diff
- Blocks PRs that reduce coverage

**Configuration:** `codecov.yml`

**Best practices:**

- Set coverage thresholds (70% minimum)
- Track per-file coverage
- Require coverage on new code
- Review uncovered lines in PRs

**Workflow integration:**

- Tests run → Coverage uploaded → PR check passes/fails
- Part of `/verify tests` phase

---

## Claude

**Purpose:** AI-assisted development

**What it does:**

- Code generation and review
- Documentation writing
- Bug investigation
- Architecture planning

**Configuration:** `.claude/` directory

**Best practices:**

- Use specialized agents for tasks
- Follow SDD/TDD/EDD methodology
- Leverage MCP servers for context
- Use hooks for automation

**Workflow integration:**

- Central to all development via commands
- See `CLAUDE.md` for full workflow

---

## Integration Matrix

How integrations work together:

| Stage       | Integrations Used      |
| ----------- | ---------------------- |
| Planning    | Linear, Claude         |
| Development | Claude                 |
| Testing     | CodeCov, Lighthouse CI |
| Code Review | CoderabbitAI, Claude   |
| Deployment  | Vercel                 |
| Maintenance | Renovate               |

## CI/CD Pipeline with Integrations

```
Push/PR
├── GitHub Actions
│   ├── Build & Type Check
│   ├── Lint
│   ├── Unit Tests → CodeCov
│   ├── E2E Tests
│   └── Lighthouse CI
├── Vercel Preview Deploy (automatic)
├── CoderabbitAI Review
├── Human Review
└── Merge
    └── Vercel Production Deploy (automatic)
```

## Recommended Configuration Files

```
repo/
├── renovate.json           # Renovate config
├── .coderabbit.yaml        # CoderabbitAI config
├── codecov.yml             # CodeCov config
├── lighthouserc.js         # Lighthouse CI config
├── vercel.json             # Vercel config (optional)
└── .github/
    └── workflows/
        ├── ci.yml          # Main CI pipeline
        └── lighthouse.yml  # Lighthouse CI
```

**Note:** No deploy workflow needed - Vercel auto-deploys via GitHub integration.
