# Design: Plan Agent Optimization

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-06

## Overview

This design transforms the plan-agent to use parallel analysis sub-agents followed by a sequential spec creation flow. Analysis phases (requirements, dependencies, tasks) run concurrently, then results feed into the writer and QA phases.

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  plan-agent (sequential)                                    │
├─────────────────────────────────────────────────────────────┤
│  ANALYZE requirements (~5 min)                              │
│  ANALYZE dependencies (~3 min)                              │
│  ANALYZE task decomposition (~4 min)                        │
│  CREATE spec files (~8 min)                                 │
│  VALIDATE consistency (~3 min)                              │
├─────────────────────────────────────────────────────────────┤
│  Total: ~23 min, all in single context                      │
└─────────────────────────────────────────────────────────────┘
```

### Target State

**Model Assignments:**

- plan-agent orchestrator: **Opus 4.5**
- requirement-analyzer: **Opus 4.5**
- dependency-analyzer: **Opus 4.5**
- task-decomposer: **Opus 4.5**
- plan-writer: **Sonnet**
- plan-qa: **Haiku**

```text
┌─────────────────────────────────────────────────────────────┐
│  plan-agent (orchestrator, Opus)                            │
└─────────────────────────────────────────────────────────────┘
         │
         ├────────────────┬────────────────┐
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ requirement  │ │ dependency   │ │ task         │
│ analyzer     │ │ analyzer     │ │ decomposer   │
│ (~5 min)     │ │ (~3 min)     │ │ (~4 min)     │
└──────────────┘ └──────────────┘ └──────────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ Aggregate        │
                │ (~5 min parallel)│
                └──────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ plan-writer      │
                │ (~8 min)         │
                └──────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │ plan-qa (haiku)  │
                │ (~3 min)         │
                └──────────────────┘

Total: ~16 min (5 parallel + 8 + 3)
Improvement: ~30% faster
```

---

## Component Design

### 1. Requirement Analyzer Sub-Agent

**File:** `.claude/sub-agents/plan/requirement-analyzer.md`

**Model:** Opus 4.5

**Profile:** research

**Responsibilities:**

- Parse user requirements
- Convert to EARS format
- Identify functional vs non-functional
- Flag ambiguous requirements

**Output:**

```json
{
  "requirements": [
    {
      "id": "REQ-1",
      "type": "functional",
      "ears_pattern": "event-driven",
      "statement": "WHEN user clicks login, THE SYSTEM SHALL authenticate",
      "ambiguities": []
    }
  ],
  "context_summary": "5 functional, 2 non-functional requirements identified..."
}
```

### 2. Dependency Analyzer Sub-Agent

**File:** `.claude/sub-agents/plan/dependency-analyzer.md`

**Model:** Opus 4.5

**Profile:** research

**Responsibilities:**

- Search codebase for related code
- Identify integration points
- Find potential conflicts
- List external dependencies

**Output:**

```json
{
  "internal_dependencies": [{ "file": "src/lib/auth.ts", "impact": "extend" }],
  "external_dependencies": [
    { "package": "jsonwebtoken", "reason": "JWT validation" }
  ],
  "conflicts": [],
  "context_summary": "Extends auth.ts, adds jsonwebtoken dependency..."
}
```

### 3. Task Decomposer Sub-Agent

**File:** `.claude/sub-agents/plan/task-decomposer.md`

**Model:** Opus 4.5

**Profile:** research

**Responsibilities:**

- Break requirements into implementation tasks
- Identify task dependencies
- Estimate relative effort
- Group into phases

**Output:**

```json
{
  "phases": [
    {
      "name": "Setup",
      "tasks": [
        { "id": "T001", "description": "Add JWT dependency", "effort": "small" }
      ]
    }
  ],
  "dependencies": { "T002": ["T001"] },
  "context_summary": "3 phases, 8 tasks, T001→T002→T003 critical path..."
}
```

### 4. Plan Writer Sub-Agent

**File:** `.claude/sub-agents/plan/plan-writer.md`

**Model:** Sonnet

**Profile:** writer

**Responsibilities:**

- Create requirements.md with EARS format
- Create design.md with architecture
- Create tasks.md with phases
- Use aggregated analysis (not raw)

**Input:**

```json
{
  "feature": "user-authentication",
  "analysis_summary": {
    "requirements_summary": "5 functional, 2 NFR...",
    "dependencies_summary": "Extends auth.ts...",
    "tasks_summary": "3 phases, 8 tasks..."
  }
}
```

**Output:**

```json
{
  "files_created": [
    "specs/user-auth/requirements.md",
    "specs/user-auth/design.md",
    "specs/user-auth/tasks.md"
  ],
  "context_summary": "Spec created with 7 requirements, 8 tasks..."
}
```

### 5. Plan QA Sub-Agent

**File:** `.claude/sub-agents/plan/plan-qa.md`

**Profile:** read-only

**Model:** haiku

**Responsibilities:**

- Verify EARS compliance
- Check requirement coverage in design
- Check design coverage in tasks
- Identify gaps

**Output:**

```json
{
  "decision": "PROCEED",
  "checks": {
    "ears_compliance": { "passed": true, "issues": [] },
    "design_coverage": { "passed": true, "coverage": "100%" },
    "task_coverage": { "passed": true, "coverage": "100%" }
  },
  "recommendations": []
}
```

---

## Data Flow

### Full Workflow

```text
User: /plan user-authentication
    │
    ▼
Orchestrator: Spawn parallel analyzers
    │
    ├── Task(requirement-analyzer, run_in_background: true)
    ├── Task(dependency-analyzer, run_in_background: true)
    └── Task(task-decomposer, run_in_background: true)
    │
    ▼
Wait for all (~5 min max)
    │
    ▼
Aggregate summaries:
{
  "requirements_summary": "...",
  "dependencies_summary": "...",
  "tasks_summary": "..."
}
    │
    ▼
Task(plan-writer, analysis_summary)
    │
    └── Creates: specs/user-auth/requirements.md
    └── Creates: specs/user-auth/design.md
    └── Creates: specs/user-auth/tasks.md
    │
    ▼
Task(plan-qa, spec_files, model: haiku)
    │
    └── Returns: { decision: "PROCEED", checks: {...} }
    │
    ▼
User: "Spec created at specs/user-auth/. Ready for review."
```

---

## Dependencies

| Component             | Version  | Purpose              |
| --------------------- | -------- | -------------------- |
| 01-infrastructure     | Required | Templates, protocols |
| 05-context-compaction | Required | Handoff compaction   |
| research skill        | Current  | Analysis patterns    |
