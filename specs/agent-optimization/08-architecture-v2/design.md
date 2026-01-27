# Design: Architecture V2

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-08

## Overview

This design defines the comprehensive architecture including agent consolidation, user interface, preview system, routing layer, and expanded workflows. All components leverage the sub-agent infrastructure from Phase 01.

---

## Architecture

### System Layers

```text
┌─────────────────────────────────────────────────────────────────┐
│  USER LAYER (5 commands)                                        │
│  /plan    /build    /fix    /check    /ship                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  PREVIEW LAYER                                                  │
│  Show execution plan → User confirms → Execute                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ROUTING LAYER                                                  │
│  Analyze intent → Select agent(s) → Select workflow             │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW LAYER (8 workflows)                                   │
│  implement, fix, refactor, ship, review,                        │
│  full-feature, security, research                               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT LAYER (7 agents, all use Opus orchestrators)             │
│  plan, code, ui, docs, eval, check, git                         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUB-AGENT LAYER (27 sub-agents)                                │
│  Opus: orchestrators, researchers, analyzers                    │
│  Sonnet: writers, builders                                      │
│  Haiku: validators, checkers, executors                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Agent Consolidation

#### Final Agent List (7 agents)

| Agent       | Domain                  | Absorbed From |
| ----------- | ----------------------- | ------------- |
| plan-agent  | Specifications          | -             |
| code-agent  | Backend implementation  | -             |
| ui-agent    | Frontend implementation | -             |
| docs-agent  | Documentation           | -             |
| eval-agent  | LLM evaluations         | -             |
| check-agent | Quality verification    | -             |
| git-agent   | Version control + PRs   | pr-agent      |

#### Removed Agents (4 agents)

| Agent         | Reason                            | Replacement                            |
| ------------- | --------------------------------- | -------------------------------------- |
| debug-agent   | Investigation is a workflow phase | investigator sub-agent in fix workflow |
| pr-agent      | PRs are version control           | Absorbed into git-agent                |
| help-agent    | Not agent work                    | Built-in `/help` command               |
| context-agent | Not agent work                    | Built-in `/context` command            |

#### Git-Agent Expansion

```text
git-agent (orchestrator, Opus)
├── change-analyzer (Sonnet)
│   └── Analyze diff, suggest commit message
├── pr-analyzer (Sonnet)
│   └── Generate PR description
├── pr-reviewer (Opus)
│   └── Review PR code thoroughly
└── git-executor (Haiku)
    └── Execute git/gh CLI commands
```

---

### 2. User Interface

#### Core Commands (5)

| Command          | Intent            | Routes To                |
| ---------------- | ----------------- | ------------------------ |
| `/plan [what]`   | Design something  | plan-agent               |
| `/build [what]`  | Create something  | Routing layer → agent(s) |
| `/fix [what]`    | Correct something | fix workflow             |
| `/check [scope]` | Verify something  | check-agent              |
| `/ship`          | Ship current work | ship workflow            |

#### Optional Power Commands

| Command             | Intent               | Routes To                  |
| ------------------- | -------------------- | -------------------------- |
| `/route [what]`     | Preview routing only | Routing layer (no execute) |
| `/research [topic]` | Explore only         | research workflow          |
| `/refactor [scope]` | Restructure code     | refactor workflow          |
| `/git [action]`     | Direct git ops       | git-agent                  |
| `/code [feature]`   | Backend only         | code-agent                 |
| `/ui [component]`   | Frontend only        | ui-agent                   |
| `/docs [topic]`     | Docs only            | docs-agent                 |
| `/eval [feature]`   | Evals only           | eval-agent                 |

---

### 3. Routing Layer

#### Build Routing

```text
/build [what]
    │
    ▼
Analyze [what]:
    │
    ├── Contains "API", "endpoint", "route", "database", "prisma"
    │   └── Backend → code-agent
    │
    ├── Contains "component", "form", "button", "page", "UI"
    │   └── Frontend → ui-agent
    │
    ├── Contains "feature" or spec exists with both backend/frontend
    │   └── Full-stack → implement workflow (code → ui)
    │
    ├── Contains "README", "docs", "documentation"
    │   └── Documentation → docs-agent
    │
    ├── Contains "eval", "test LLM", "grader"
    │   └── Evaluation → eval-agent
    │
    └── Unclear
        └── Ask user for clarification
```

#### Fix Routing

```text
/fix [what]
    │
    ▼
fix workflow:
    │
    ├── STAGE 1: Investigate (investigator sub-agent, Opus)
    │   ├── Search codebase for [what]
    │   ├── Check recent git changes
    │   ├── Identify affected files
    │   └── Classify: backend OR frontend OR unclear
    │
    ├── STAGE 2: Fix (based on classification)
    │   ├── Backend → code-agent
    │   ├── Frontend → ui-agent
    │   └── Unclear → Ask user
    │
    └── STAGE 3: Verify (check-agent)
```

---

### 4. Preview System

#### Preview Display Format

```text
┌─────────────────────────────────────────────────────────────────┐
│  /build login form                                              │
├─────────────────────────────────────────────────────────────────┤
│  Detected: Frontend component                                   │
│  Scope: Login form UI                                           │
│                                                                 │
│  Agent: ui-agent                                                │
│                                                                 │
│  PHASES                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. RESEARCH              ui-researcher         Opus         ││
│  │    □ Find existing auth components                          ││
│  │    □ Check shadcn form primitives                           ││
│  │    □ Review design patterns                                 ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 2. BUILD                 ui-builder            Sonnet       ││
│  │    □ Create LoginForm component                             ││
│  │    □ Write component tests                                  ││
│  │    □ Add form validation                                    ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 3. VALIDATE              ui-validator          Haiku        ││
│  │    □ Type check                                             ││
│  │    □ Run tests                                              ││
│  │    □ Accessibility audit                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Tools: shadcn, cclsp, playwright, context7                     │
│                                                                 │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel               │
└─────────────────────────────────────────────────────────────────┘
```

#### Multi-Workflow Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /fix login timeout                                             │
├─────────────────────────────────────────────────────────────────┤
│  Detected: Bug fix                                              │
│  Scope: Login timeout issue                                     │
│                                                                 │
│  Workflow: fix                                                  │
│                                                                 │
│  STAGE 1: INVESTIGATE                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sub-agent: investigator                        Opus         ││
│  │    □ Search codebase for login + timeout                    ││
│  │    □ Check recent git changes                               ││
│  │    □ Identify root cause                                    ││
│  │    □ Classify: backend or frontend                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  STAGE 2: FIX                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: TBD (based on Stage 1 findings)                      ││
│  │    → If backend: code-agent                                 ││
│  │    → If frontend: ui-agent                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  STAGE 3: VERIFY                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent (parallel)                  Haiku        ││
│  │    □ type-checker                                           ││
│  │    □ lint-checker                                           ││
│  │    □ test-runner                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Progress Display

```text
┌─────────────────────────────────────────────────────────────────┐
│  /build user authentication                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: BACKEND                                    [RUNNING]  │
│  Agent: code-agent                                              │
│  ├─ ✓ code-researcher (Opus)                        [2.1s]      │
│  │   Found: No existing auth, will use NextAuth pattern         │
│  ├─ ● code-writer (Sonnet)                          [RUNNING]   │
│  │   Writing: src/lib/auth.ts                                   │
│  └─ ○ code-validator (Haiku)                        [PENDING]   │
│                                                                 │
│  STAGE 2: FRONTEND                                   [PENDING]  │
│  Agent: ui-agent                                                │
│  ├─ ○ ui-researcher (Opus)                                      │
│  ├─ ○ ui-builder (Sonnet)                                       │
│  └─ ○ ui-validator (Haiku)                                      │
│                                                                 │
│  Progress: ██████░░░░░░░░░░░░░░ 30%                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Expanded Workflows

#### Workflow Definitions

| Workflow     | Trigger                         | Chain                                  |
| ------------ | ------------------------------- | -------------------------------------- |
| implement    | `/build [feature]` (full-stack) | code-agent → ui-agent                  |
| fix          | `/fix [issue]`                  | investigate → (code OR ui) → check     |
| refactor     | `/refactor [scope]`             | check → (code OR ui) → check           |
| ship         | `/ship`                         | check → git (commit + push + PR)       |
| review       | `/review [PR#]`                 | git (checkout) → check → git (review)  |
| full-feature | `/feature [name]`               | plan → implement → ship                |
| security     | `/security [scope]`             | check(sec) → (code OR ui) → check(sec) |
| research     | `/research [topic]`             | researcher sub-agent (read-only)       |

#### New Workflow: fix

**File:** `.claude/workflows/fix.md`

```text
┌─────────────────────────────────────────────────────────────────┐
│  fix workflow                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: INVESTIGATE                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sub-agent: investigator (Opus)                              ││
│  │ Profile: research (read-only + search)                      ││
│  │                                                             ││
│  │ Tasks:                                                      ││
│  │   1. Search codebase for issue-related terms                ││
│  │   2. Check git log for recent changes                       ││
│  │   3. Identify affected files                                ││
│  │   4. Diagnose root cause                                    ││
│  │   5. Classify: backend OR frontend                          ││
│  │                                                             ││
│  │ Output: {                                                   ││
│  │   classification: "backend" | "frontend" | "unclear",       ││
│  │   affected_files: [...],                                    ││
│  │   root_cause: "description",                                ││
│  │   context_summary: "max 500 tokens"                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 2: FIX                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Route based on classification:                              ││
│  │                                                             ││
│  │ backend → code-agent                                        ││
│  │   ├─ code-researcher (Opus) - additional context            ││
│  │   ├─ code-writer (Sonnet) - implement fix                   ││
│  │   └─ code-validator (Haiku) - verify fix                    ││
│  │                                                             ││
│  │ frontend → ui-agent                                         ││
│  │   ├─ ui-researcher (Opus) - additional context              ││
│  │   ├─ ui-builder (Sonnet) - implement fix                    ││
│  │   └─ ui-validator (Haiku) - verify fix                      ││
│  │                                                             ││
│  │ unclear → Ask user for classification                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 3: VERIFY                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent                                          ││
│  │ Sub-agents (parallel, all Haiku):                           ││
│  │   - type-checker                                            ││
│  │   - lint-checker                                            ││
│  │   - test-runner                                             ││
│  │   - security-scanner (if security-related fix)              ││
│  │                                                             ││
│  │ Output: PASS → Report success                               ││
│  │         FAIL → Retry Stage 2 (max 2 retries)                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### New Workflow: refactor

**File:** `.claude/workflows/refactor.md`

```text
┌─────────────────────────────────────────────────────────────────┐
│  refactor workflow                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: BASELINE                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent                                          ││
│  │ Purpose: Establish passing baseline before changes          ││
│  │                                                             ││
│  │ Sub-agents (parallel):                                      ││
│  │   - type-checker                                            ││
│  │   - test-runner (capture coverage + passing tests)          ││
│  │                                                             ││
│  │ Output: baseline_state { tests: [...], coverage: N% }       ││
│  │                                                             ││
│  │ Gate: All tests must pass before proceeding                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 2: ANALYZE                                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sub-agent: refactor-analyzer (Opus)                         ││
│  │ Profile: research (read-only)                               ││
│  │                                                             ││
│  │ Tasks:                                                      ││
│  │   1. Analyze scope for refactoring                          ││
│  │   2. Identify safe transformations                          ││
│  │   3. Plan refactoring steps                                 ││
│  │   4. Identify risks                                         ││
│  │                                                             ││
│  │ Output: {                                                   ││
│  │   transformations: [...],                                   ││
│  │   risks: [...],                                             ││
│  │   context_summary: "max 500 tokens"                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 3: REFACTOR                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Route to appropriate agent:                                 ││
│  │   backend scope → code-agent                                ││
│  │   frontend scope → ui-agent                                 ││
│  │                                                             ││
│  │ Constraint: DO NOT change behavior, only structure          ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 4: VERIFY                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent                                          ││
│  │                                                             ││
│  │ Verification:                                               ││
│  │   - All baseline tests still pass                           ││
│  │   - Coverage >= baseline coverage                           ││
│  │   - Types still pass                                        ││
│  │                                                             ││
│  │ Output: PASS → Report success                               ││
│  │         FAIL → Rollback, report issues                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### New Workflow: security

**File:** `.claude/workflows/security.md`

```text
┌─────────────────────────────────────────────────────────────────┐
│  security workflow                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: AUDIT                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent (security-scanner only)                  ││
│  │                                                             ││
│  │ Checks:                                                     ││
│  │   - pnpm audit                                              ││
│  │   - OWASP patterns                                          ││
│  │   - Hardcoded secrets                                       ││
│  │   - Injection vulnerabilities                               ││
│  │                                                             ││
│  │ Output: vulnerabilities []                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 2: TRIAGE                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sub-agent: security-triager (Opus)                          ││
│  │                                                             ││
│  │ Tasks:                                                      ││
│  │   1. Prioritize vulnerabilities (CRITICAL, HIGH, MEDIUM)    ││
│  │   2. Identify remediation steps                             ││
│  │   3. Classify affected scope (backend/frontend)             ││
│  │                                                             ││
│  │ Output: {                                                   ││
│  │   prioritized: [...],                                       ││
│  │   remediation_plan: [...],                                  ││
│  │   context_summary: "max 500 tokens"                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 3: FIX                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Route to appropriate agent:                                 ││
│  │   backend vulnerabilities → code-agent                      ││
│  │   frontend vulnerabilities → ui-agent                       ││
│  │   dependency vulnerabilities → git-agent (update deps)      ││
│  │                                                             ││
│  │ Constraint: Fix CRITICAL and HIGH priority first            ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  STAGE 4: RE-AUDIT                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent (security-scanner)                       ││
│  │                                                             ││
│  │ Verification:                                               ││
│  │   - CRITICAL vulnerabilities resolved                       ││
│  │   - HIGH vulnerabilities resolved                           ││
│  │   - Report remaining MEDIUM/LOW                             ││
│  │                                                             ││
│  │ Output: PASS → Report success                               ││
│  │         FAIL → Retry Stage 3 for remaining issues           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### New Workflow: research

**File:** `.claude/workflows/research.md`

```text
┌─────────────────────────────────────────────────────────────────┐
│  research workflow                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Single-stage, read-only exploration                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sub-agent: researcher (Opus)                                ││
│  │ Profile: read-only (Read, Grep, Glob, cclsp)                ││
│  │                                                             ││
│  │ Tasks:                                                      ││
│  │   1. Search codebase for topic-related code                 ││
│  │   2. Read and understand relevant files                     ││
│  │   3. Identify patterns and architecture                     ││
│  │   4. Document findings                                      ││
│  │                                                             ││
│  │ Constraints:                                                ││
│  │   - NO file modifications                                   ││
│  │   - NO code generation                                      ││
│  │   - Read and report only                                    ││
│  │                                                             ││
│  │ Output: {                                                   ││
│  │   findings: [...],                                          ││
│  │   architecture_notes: "...",                                ││
│  │   recommendations: [...] (optional)                         ││
│  │ }                                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7. Model Assignment Table

| Agent           | Sub-Agent         | Role                 | Model  |
| --------------- | ----------------- | -------------------- | ------ |
| **plan-agent**  | orchestrator      | Route phases         | Opus   |
|                 | plan-researcher   | Analyze requirements | Opus   |
|                 | plan-writer       | Write spec           | Sonnet |
|                 | plan-validator    | Verify completeness  | Haiku  |
| **code-agent**  | orchestrator      | Route phases         | Opus   |
|                 | code-researcher   | Find patterns        | Opus   |
|                 | code-writer       | Implement TDD        | Sonnet |
|                 | code-validator    | Verify code          | Haiku  |
| **ui-agent**    | orchestrator      | Route phases         | Opus   |
|                 | ui-researcher     | Find components      | Opus   |
|                 | ui-builder        | Build component      | Sonnet |
|                 | ui-validator      | Verify UI            | Haiku  |
| **docs-agent**  | orchestrator      | Route phases         | Opus   |
|                 | docs-researcher   | Find gaps            | Opus   |
|                 | docs-writer       | Write docs           | Sonnet |
|                 | docs-validator    | Verify docs          | Haiku  |
| **eval-agent**  | orchestrator      | Route phases         | Opus   |
|                 | eval-researcher   | Identify dimensions  | Opus   |
|                 | eval-writer       | Create cases         | Sonnet |
|                 | eval-validator    | Run evals            | Haiku  |
| **check-agent** | orchestrator      | Route checks         | Opus   |
|                 | build-checker     | Compile              | Haiku  |
|                 | type-checker      | TypeScript           | Haiku  |
|                 | lint-checker      | ESLint               | Haiku  |
|                 | test-runner       | Vitest               | Haiku  |
|                 | security-scanner  | Vulnerabilities      | Haiku  |
| **git-agent**   | orchestrator      | Route operations     | Opus   |
|                 | change-analyzer   | Commit message       | Sonnet |
|                 | pr-analyzer       | PR description       | Sonnet |
|                 | pr-reviewer       | Code review          | Opus   |
|                 | git-executor      | CLI commands         | Haiku  |
| **Workflows**   | investigator      | Bug diagnosis        | Opus   |
|                 | refactor-analyzer | Safe changes         | Opus   |
|                 | security-triager  | Prioritize vulns     | Opus   |

**Model Distribution:**

- Opus: 18 (orchestrators + researchers + analyzers)
- Sonnet: 8 (writers + builders)
- Haiku: 11 (validators + checkers + executors)

---

## Dependencies

| Component             | Version  | Purpose              |
| --------------------- | -------- | -------------------- |
| 01-infrastructure     | Complete | Templates, protocols |
| 04-check-agent        | Complete | Parallel checks      |
| 05-context-compaction | Complete | Handoff rules        |
| Task tool             | Built-in | Sub-agent spawning   |

---
