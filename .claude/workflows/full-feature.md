---
name: full-feature
description: Complete feature development from planning to PR
---

# Full Feature Workflow

Complete end-to-end feature development orchestrating plan → implement → ship.

## Trigger

- `/feature [name]` (future command)
- Can be invoked manually via sequential `/plan` → `/implement` → `/ship`

## Stages

```text
plan-agent orchestrator (Opus)
├── plan-researcher (Opus) - analyze requirements
├── plan-writer (Sonnet) - write spec
└── plan-validator (Haiku) - verify completeness
    ↓
(APPROVAL GATE - user approves spec)
    ↓
(context compaction)
    ↓
implement workflow
├── code-agent orchestrator (Opus)
│   ├── code-researcher, code-writer, code-validator
├── ui-agent orchestrator (Opus)
│   ├── ui-researcher, ui-builder, ui-validator
    ↓
(context compaction)
    ↓
ship workflow
├── check-agent orchestrator (Opus)
│   ├── build, types, lint, tests, security (parallel)
└── git-agent orchestrator (Opus)
    ├── change-analyzer, pr-analyzer, git-executor
```

## Stage 1: Planning

**Orchestrator:** plan-agent (Opus)

| Sub-agent       | Model  | Task                                     |
| --------------- | ------ | ---------------------------------------- |
| plan-researcher | Opus   | Analyze requirements, find existing code |
| plan-writer     | Sonnet | Write spec with tasks                    |
| plan-validator  | Haiku  | Verify spec completeness                 |

**Output:**

```json
{
  "spec_path": "specs/feature-name/",
  "tasks": 8,
  "spec_summary": "max 500 tokens"
}
```

**Gate:** User must approve spec before proceeding.

---

## Approval Gate

Present spec to user:

```markdown
## Spec Ready: feature-name

### Summary

[Brief description of the feature]

### Tasks

1. Create Prisma model
2. Implement tRPC router
3. Build component
   ...

### Estimated Effort

- Backend: 3 tasks
- Frontend: 2 tasks

[Approve] [Edit] [Cancel]
```

**If approved:** Continue to Stage 2
**If rejected:** Revise spec with feedback

---

## Context Compaction (Stage 1 → Stage 2)

**KEEP:**

- `spec_reference` - Path to spec files
- `spec_summary` - Max 500 token summary
- `task_list` - Brief task descriptions

**DISCARD:**

- Full spec content
- Research findings
- Alternative approaches

---

## Stage 2: Implementation

Run **implement workflow** with spec reference:

**Input:**

```json
{
  "spec_reference": "specs/feature-name/",
  "spec_summary": "from Stage 1"
}
```

**Execution:**

1. code-agent implements backend (reads spec from file)
2. Context compaction (keep files_changed, api_contracts)
3. ui-agent implements frontend (reads spec from file)

**Output:**

```json
{
  "files_changed": ["backend files", "frontend files"],
  "implementation_summary": "max 500 tokens"
}
```

---

## Context Compaction (Stage 2 → Stage 3)

**KEEP:**

- `files_changed` - List of all files created/modified
- `implementation_summary` - Brief summary

**DISCARD:**

- Test details
- Build logs
- Research context

---

## Stage 3: Shipping

Run **ship workflow** with files changed:

**Input:**

```json
{
  "files_changed": ["from Stage 2"],
  "feature_name": "for commit message"
}
```

**Execution:**

1. check-agent runs parallel quality checks
2. Context compaction (keep check_summary)
3. git-agent creates commit + PR

**Output:**

```json
{
  "pr_url": "https://github.com/...",
  "pr_number": 123
}
```

## Input

```
feature: string      # Feature name or description
design_doc?: string  # Path to design doc for distill
```

## Output

```markdown
## Feature Complete: prompt-manager

### Planning

- Spec: `specs/prompt-manager/`
- Tasks: 8 created

### Implementation

| Phase   | Status | Details           |
| ------- | ------ | ----------------- |
| Backend | PASS   | 5 tasks, 15 tests |
| UI      | PASS   | 3 tasks, 8 tests  |

### Quality

| Check    | Status              |
| -------- | ------------------- |
| Types    | PASS                |
| Tests    | PASS (90% coverage) |
| Lint     | PASS                |
| Security | PASS                |

### Pull Request

**URL:** https://github.com/owner/repo/pull/123
**Status:** Open, CI running

### Timeline

- Planning: 10 min
- Backend: 20 min
- UI: 10 min
- Shipping: 3 min
- Total: ~43 min
```

## Context Flow

```text
┌────────────────┐     spec_summary      ┌────────────────┐
│  plan-agent    │ ─────────────────────►│  implement     │
│  (Opus orch)   │       ~500 tokens     │  workflow      │
└────────────────┘                       └────────────────┘
        │                                        │
   USER APPROVAL                          files_changed
        │                                        │
        ▼                                        ▼
┌────────────────┐                       ┌────────────────┐
│  User approves │                       │  ship workflow │
│  or revises    │                       │                │
└────────────────┘                       └────────────────┘
                                                │
                                                ▼
                                         ┌────────────────┐
                                         │  PR created    │
                                         │  github.com/...│
                                         └────────────────┘
```

## Error Handling

| Error                | Handling                       |
| -------------------- | ------------------------------ |
| Spec not approved    | Wait for approval, remind user |
| Implementation fails | Stop, report issues            |
| Quality fails        | Stop at ship phase             |

## Performance Target

| Metric     | Current  | Optimized | Improvement |
| ---------- | -------- | --------- | ----------- |
| Total time | ~45 min  | ~30 min   | 33% faster  |
| Context    | 150k tok | 90k tok   | 40% less    |

## Approval Gates

| After Stage | Gate                        | Action if Fails |
| ----------- | --------------------------- | --------------- |
| Plan        | User approves spec          | Revise          |
| Implement   | Automated (proceed to ship) | N/A             |
| Ship        | CI passes (external)        | Fix and re-run  |

## Notes

- Uses Opus orchestrators at each stage
- Context compaction between ALL stages
- User approval required after planning
- Each stage can be run individually
- For complex features, use individual commands instead
