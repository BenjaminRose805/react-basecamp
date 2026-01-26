# Design: Workflow Updates

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-07

## Overview

This design updates all workflow definitions to leverage the optimized sub-agent architecture. Each workflow becomes a meta-orchestrator that coordinates agent orchestrators, with context compaction at stage boundaries.

---

## Architecture

### Workflow Hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│  WORKFLOW LAYER (meta-orchestrators)                        │
├─────────────────────────────────────────────────────────────┤
│  implement-workflow                                         │
│  ship-workflow                                              │
│  review-workflow                                            │
│  full-feature-workflow                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT ORCHESTRATORS                                        │
├─────────────────────────────────────────────────────────────┤
│  plan-agent ──► plan-researcher, plan-writer, plan-qa       │
│  code-agent ──► code-researcher, code-writer, code-qa       │
│  ui-agent ──► ui-researcher, ui-builder, ui-qa              │
│  check-agent ──► build, types, lint, tests, security        │
│  git-agent ──► (direct operations)                          │
│  pr-agent ──► (direct operations)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  SUB-AGENTS (isolated contexts)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Implement Workflow

**File:** `.claude/workflows/implement.md`

```markdown
# Workflow: implement

## Trigger

/build

## Stages

### Stage 1: Backend (code-agent)

1. Invoke code-agent orchestrator
2. Receive: { files_changed, context_summary }
3. Compact: Keep only files_changed and summary

### Stage 2: Frontend (ui-agent)

1. Invoke ui-agent orchestrator
2. Pass: backend context_summary as reference
3. Receive: { files_changed, context_summary }

### Stage 3: Report

1. Aggregate all files_changed
2. Report to user

## Context Flow

code-agent ──► { files_changed: [...], summary: "..." }
│
▼ (compact)
ui-agent ◄── { backend_context: "summary only" }
│
▼
Report ◄── { all_files: [...] }
```

### 2. Ship Workflow

**File:** `.claude/workflows/ship.md`

```markdown
# Workflow: ship

## Trigger

/ship

## Stages

### Stage 1: Quality Checks (check-agent)

1. Invoke check-agent orchestrator (parallel checks)
2. If FAIL: Report issues, stop
3. If PASS: Continue

### Stage 2: Commit (git-agent)

1. Stage changed files
2. Create commit with conventional format
3. Push to remote

### Stage 3: PR (pr-agent)

1. Create PR with template
2. Include check summary
3. Return PR URL

## Context Flow

check-agent ──► { checks: {...}, summary: "..." }
│
▼ (compact)
git-agent ◄── { files_to_commit: [...] }
│
▼
pr-agent ◄── { check_summary: "...", branch: "..." }

## Performance Target

- Check phase: 30s (parallel) vs 60s (sequential)
- Total: ~2 min
```

### 3. Review Workflow

**File:** `.claude/workflows/review.md`

```markdown
# Workflow: review

## Trigger

/pr review [number]

## Stages

### Stage 1: Checkout

1. Fetch PR branch
2. Switch to branch

### Stage 2: Quality Checks (check-agent)

1. Run parallel checks
2. Collect results

### Stage 3: Analysis (pr-agent)

1. Analyze PR diff
2. Review against checks
3. Provide verdict

## Context Flow

check-agent ──► { checks: {...} }
│
▼
pr-agent ◄── { checks, diff_summary }
│
▼
User ◄── { verdict, comments }
```

### 4. Full-Feature Workflow

**File:** `.claude/workflows/full-feature.md`

```markdown
# Workflow: full-feature

## Trigger

/feature [name] (future command)

## Stages

### Stage 1: Plan (plan-agent)

1. Run parallel analysis
2. Create spec files
3. Await user approval
4. If rejected: Revise

### Stage 2: Implement (implement-workflow)

1. Run code-agent
2. Run ui-agent
3. Receive all files changed

### Stage 3: Ship (ship-workflow)

1. Run quality checks (parallel)
2. Create commit
3. Create PR

## Context Flow

plan-agent ──► { spec_summary: "...", approval: true }
│
▼ (compact)
implement-workflow ◄── { spec_reference: "specs/feature/..." }
│
▼ (compact)
ship-workflow ◄── { files_changed: [...] }
│
▼
User ◄── { pr_url: "..." }

## Approval Gates

- After Stage 1: User approves spec
- After Stage 2: Automated (proceed to ship)
- After Stage 3: Complete

## Performance Target

Total: ~30 min for medium feature (vs ~45 min sequential)
```

---

## Data Flow

### Full-Feature Example

```text
User: /feature user-authentication
    │
    ▼
[Stage 1: Plan]
plan-agent orchestrator
    ├── requirement-analyzer ─┐
    ├── dependency-analyzer  ─┼─► parallel
    └── task-decomposer ─────┘
                │
                ▼
    plan-writer ──► specs/user-auth/*.md
                │
                ▼
    plan-qa ──► PROCEED
                │
                ▼
User: "Spec ready. Approve to continue."
    │
    ▼ (user approves)
    │
[Stage 2: Implement]
implement-workflow
    │
    ├── code-agent orchestrator
    │   ├── code-researcher ─┐
    │   ├── code-writer ─────┼─► sequential
    │   └── code-qa ─────────┘
    │
    └── ui-agent orchestrator
        ├── ui-researcher ─┐
        ├── ui-builder ────┼─► sequential
        └── ui-qa ─────────┘
                │
                ▼
[Stage 3: Ship]
ship-workflow
    │
    ├── check-agent orchestrator
    │   ├── build-checker ───┐
    │   ├── type-checker ────┤
    │   ├── lint-checker ────┼─► parallel (after build)
    │   ├── test-runner ─────┤
    │   └── security-scanner ┘
    │
    ├── git-agent ──► commit
    │
    └── pr-agent ──► PR created
                │
                ▼
User: "Feature complete! PR: github.com/..."
```

---

## Performance Analysis

### Workflow Timing Comparison

| Workflow     | Current | Optimized | Improvement |
| ------------ | ------- | --------- | ----------- |
| implement    | ~20 min | ~15 min   | 25% faster  |
| ship         | ~5 min  | ~3 min    | 40% faster  |
| review       | ~8 min  | ~5 min    | 37% faster  |
| full-feature | ~45 min | ~30 min   | 33% faster  |

### Context Usage Comparison

| Workflow     | Current     | Optimized  | Savings |
| ------------ | ----------- | ---------- | ------- |
| implement    | 80k tokens  | 50k tokens | 37%     |
| ship         | 30k tokens  | 20k tokens | 33%     |
| review       | 40k tokens  | 25k tokens | 37%     |
| full-feature | 150k tokens | 90k tokens | 40%     |

---

## Dependencies

| Component             | Version  | Purpose        |
| --------------------- | -------- | -------------- |
| All agent specs       | Required | Orchestrators  |
| 05-context-compaction | Required | Stage handoffs |
| CLAUDE.md             | Current  | Documentation  |
