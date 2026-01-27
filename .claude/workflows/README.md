# Workflows

Workflows orchestrate multiple agents in sequence to complete complex tasks. Each workflow defines a chain of stages with specific handoff protocols.

## Overview

| Workflow     | Trigger         | Chain                                    | Use Case             |
| ------------ | --------------- | ---------------------------------------- | -------------------- |
| implement    | `/implement`    | code-agent → ui-agent                    | Full-stack features  |
| fix          | `/fix`          | investigate → (code\|ui) → check         | Bug fixes            |
| refactor     | `/refactor`     | check → analyze → (code\|ui) → check     | Code restructuring   |
| ship         | `/ship`         | check → git (commit + PR)                | Release changes      |
| review       | `/review [PR#]` | git (checkout) → check → git (review)    | PR code review       |
| full-feature | (future)        | plan → implement → ship                  | End-to-end feature   |
| security     | `/security`     | check(sec) → triage → (code\|ui) → check | Vulnerability fixes  |
| research     | `/research`     | researcher (read-only)                   | Codebase exploration |

---

## Workflow Selection Guide

### By Intent

| You Want To...                        | Use Workflow      | Command               |
| ------------------------------------- | ----------------- | --------------------- |
| Build a new feature (backend + UI)    | implement         | `/build [feature]`    |
| Build backend only                    | (routes to agent) | `/build [api/router]` |
| Build UI only                         | (routes to agent) | `/build [component]`  |
| Fix a bug                             | fix               | `/fix [issue]`        |
| Restructure code (no behavior change) | refactor          | `/refactor [scope]`   |
| Ship current work                     | ship              | `/ship`               |
| Review a pull request                 | review            | `/review [PR#]`       |
| Fix security vulnerabilities          | security          | `/security [scope]`   |
| Explore/understand code               | research          | `/research [topic]`   |

### By Task Complexity

| Complexity     | Recommended Approach                                   |
| -------------- | ------------------------------------------------------ |
| Simple fix     | `/fix [issue]` - investigates and routes automatically |
| Backend change | `/build [api]` - routes to code-agent                  |
| UI change      | `/build [component]` - routes to ui-agent              |
| Full feature   | `/build [feature]` - runs implement workflow           |
| Major refactor | `/refactor [scope]` - ensures tests pass before/after  |
| Security audit | `/security` - full audit → triage → fix → re-audit     |

---

## Workflow Details

### 1. implement

**Trigger:** `/build [feature]` when full-stack is detected

**Chain:**

```text
code-agent orchestrator (Opus)
├── code-researcher (Opus)
├── code-writer (Sonnet)
└── code-validator (Haiku)
    ↓ (context compaction)
ui-agent orchestrator (Opus)
├── ui-researcher (Opus)
├── ui-builder (Sonnet)
└── ui-validator (Haiku)
```

**Purpose:** Complete feature implementation with backend first, then frontend.

**Gates:**

- code-agent must PASS before ui-agent starts
- ui-agent must PASS to complete

**Context Flow:**

```text
┌────────────────┐                      ┌────────────────┐
│  code-agent    │ ──────────────────── │   ui-agent     │
│  (Opus orch)   │   files_changed,     │  (Opus orch)   │
│                │   api_contracts,     │                │
│  Backend impl  │   context_summary    │  Frontend impl │
└────────────────┘                      └────────────────┘
```

**Performance:** 25% faster, 37% less context through compaction

---

### 2. fix

**Trigger:** `/fix [issue]`

**Chain:**

```text
INVESTIGATE (investigator sub-agent, Opus)
    ↓
    ├── backend → code-agent
    ├── frontend → ui-agent
    └── unclear → Ask user
    ↓
VERIFY (check-agent, parallel Haiku)
```

**Purpose:** Investigate bugs, identify root cause, route to appropriate agent, verify fix.

**Stages:**

1. **INVESTIGATE** - Opus sub-agent searches codebase, checks git history, identifies affected files, classifies as backend/frontend
2. **FIX** - Routes to code-agent or ui-agent based on classification
3. **VERIFY** - check-agent runs parallel checks (types, lint, tests)

**Context Flow:**

```text
┌────────────────┐     context_summary    ┌────────────────┐
│  investigator  │ ─────────────────────► │   Fix Agent    │
│  (Opus)        │       ~500 tokens      │  (code/ui)     │
└────────────────┘                        └────────────────┘
                                                  │
                                           files_changed
                                                  ▼
                                          ┌────────────────┐
                                          │  check-agent   │
                                          │  (parallel)    │
                                          └────────────────┘
```

---

### 3. refactor

**Trigger:** `/refactor [scope]`

**Chain:**

```text
BASELINE (check-agent - capture passing tests)
    ↓
ANALYZE (refactor-analyzer sub-agent, Opus)
    ↓
REFACTOR (code-agent OR ui-agent)
    ↓
VERIFY (check-agent - same tests pass)
```

**Purpose:** Safely restructure code while preserving behavior.

**Stages:**

1. **BASELINE** - Capture passing tests and coverage before changes
2. **ANALYZE** - Opus sub-agent identifies safe transformations and risks
3. **REFACTOR** - Apply structural changes (no behavior changes)
4. **VERIFY** - Ensure all baseline tests still pass

**Constraint:** DO NOT change behavior, only structure.

**Context Flow:**

```text
┌────────────────┐     baseline_state     ┌────────────────┐
│  check-agent   │ ─────────────────────► │  refactor-     │
│  (baseline)    │       ~200 tokens      │  analyzer      │
└────────────────┘                        └────────────────┘
                                                  │
                                           context_summary
                                                  ▼
                                          ┌────────────────┐
                                          │   code/ui      │
                                          │   agent        │
                                          └────────────────┘
                                                  │
                                           files_changed
                                                  ▼
                                          ┌────────────────┐
                                          │  check-agent   │
                                          │  (verify)      │
                                          └────────────────┘
```

---

### 4. ship

**Trigger:** `/ship`

**Chain:**

```text
check-agent (BUILD → TYPES → LINT → TESTS → SECURITY)
    ↓
git-agent (commit if needed → push → PR)
```

**Purpose:** Quality verification followed by git operations to create PR.

**Gates:**

- All checks must PASS before git operations
- Branch must be pushed before PR creation

---

### 5. review

**Trigger:** `/review [PR#]`

**Chain:**

```text
check-agent (verify PR branch)
    ↓
git-agent (review PR)
```

**Purpose:** Review a pull request with quality verification.

**Steps:**

1. Checkout PR branch
2. Run quality checks
3. Analyze code changes
4. Provide verdict (APPROVE, REQUEST_CHANGES, COMMENT)

---

### 6. full-feature (future)

**Trigger:** Reserved for future orchestration

**Chain:**

```text
plan-agent (ANALYZE → CREATE → VALIDATE)
    ↓
implement workflow (code-agent → ui-agent)
    ↓
ship workflow (check-agent → git-agent)
```

**Purpose:** End-to-end feature development from planning to PR.

---

### 7. security

**Trigger:** `/security [scope]`

**Chain:**

```text
AUDIT (check-agent security-scanner)
    ↓
TRIAGE (security-triager sub-agent, Opus)
    ↓
FIX (code-agent OR ui-agent OR git-agent)
    ↓
RE-AUDIT (check-agent security-scanner)
```

**Purpose:** Comprehensive security scanning with prioritized remediation.

**Stages:**

1. **AUDIT** - Run security scans (pnpm audit, OWASP patterns, secrets)
2. **TRIAGE** - Opus sub-agent prioritizes (CRITICAL → HIGH → MEDIUM → LOW)
3. **FIX** - Route to appropriate agent based on vulnerability scope
4. **RE-AUDIT** - Verify CRITICAL and HIGH vulnerabilities resolved

**Priority Order:** Fix CRITICAL and HIGH first; MEDIUM/LOW reported but optional.

**Context Flow:**

```text
┌────────────────┐    vulnerabilities    ┌────────────────┐
│  check-agent   │ ───────────────────► │  security-     │
│  (audit)       │      raw list        │  triager       │
└────────────────┘                      └────────────────┘
                                                │
                                         prioritized +
                                         context_summary
                                                ▼
                                        ┌────────────────┐
                                        │  code/ui/git   │
                                        │  agent         │
                                        └────────────────┘
                                                │
                                         files_changed
                                                ▼
                                        ┌────────────────┐
                                        │  check-agent   │
                                        │  (re-audit)    │
                                        └────────────────┘
```

---

### 8. research

**Trigger:** `/research [topic]`

**Chain:**

```text
RESEARCH (researcher sub-agent, Opus)
    ↓
Report findings (no changes made)
```

**Purpose:** Read-only codebase exploration and analysis.

**Profile:** read-only (Read, Grep, Glob, cclsp)

**Constraints:**

- NO file modifications
- NO code generation
- Read and report only

**Use For:**

- Understanding existing architecture
- Finding implementation patterns
- Exploring how features work
- Preparing for implementation decisions

---

## Command → Workflow Mapping

| Scenario                            | Command       | Routes To             |
| ----------------------------------- | ------------- | --------------------- |
| New feature (from spec)             | `/implement`  | code-agent → ui-agent |
| Full-stack implementation           | `/implement`  | Based on spec content |
| Backend-only (spec says so)         | `/implement`  | code-agent            |
| Frontend-only (spec says so)        | `/implement`  | ui-agent              |
| Bug fix                             | `/plan` first | Then `/implement`     |
| Refactor with behavior preservation | `/plan` first | Then `/implement`     |
| Security audit + fixes              | `/plan` first | Then `/implement`     |
| Ship to PR                          | `/ship`       | check → git           |

---

## Model Distribution

| Role             | Model  | Sub-agents                                         |
| ---------------- | ------ | -------------------------------------------------- |
| Orchestrators    | Opus   | All workflow orchestrators                         |
| Researchers      | Opus   | code-researcher, ui-researcher, investigator, etc. |
| Analyzers        | Opus   | refactor-analyzer, security-triager, pr-reviewer   |
| Writers/Builders | Sonnet | code-writer, ui-builder, docs-writer               |
| Validators       | Haiku  | code-validator, ui-validator, all checkers         |

---

## Error Handling

| Workflow Error                 | Recovery                                         |
| ------------------------------ | ------------------------------------------------ |
| Investigation fails (fix)      | Report findings, ask for more context            |
| Classification unclear (fix)   | Ask user to choose backend/frontend              |
| Baseline tests fail (refactor) | Stop, suggest `/fix` first                       |
| Verify fails (refactor)        | Rollback changes, report broken tests            |
| Check fails (ship)             | Stop, report issues, fix and re-run `/implement` |
| Security CRITICAL unresolved   | STOP, escalate to user immediately               |

---

## Files

| Workflow     | Definition File                     |
| ------------ | ----------------------------------- |
| implement    | `.claude/workflows/implement.md`    |
| fix          | `.claude/workflows/fix.md`          |
| refactor     | `.claude/workflows/refactor.md`     |
| ship         | `.claude/workflows/ship.md`         |
| review       | `.claude/workflows/review.md`       |
| full-feature | `.claude/workflows/full-feature.md` |
| security     | `.claude/workflows/security.md`     |
| research     | `.claude/workflows/research.md`     |
