# Workflow Improvements Proposal: Level-Agnostic Entry Point and Scaled Decision Formats

> **Status:** Proposal
> **Created:** 2026-02-05
> **Author:** Claude Opus 4.5

---

## Executive Summary

This proposal addresses two workflow friction points:

1. **Users must know the level (project/feature/spec/task) before starting work** - but they often just have "something to implement"
2. **Decision documents don't scale** - a 795-line research doc is too much for quick decisions; a 1-paragraph summary is too little for complex projects

**Solution:**
- A new `/work` command that auto-sizes and routes work to the appropriate level
- A decision document format that scales from inline questions (tasks) to full documents with appendices (projects)
- A new "task" level below spec for 5-15 minute work items

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Solution: The /work Command](#solution-the-work-command)
3. [Solution: Scaled Decision Formats](#solution-scaled-decision-formats)
4. [Integration with Existing Commands](#integration-with-existing-commands)
5. [Implementation Plan](#implementation-plan)
6. [Files to Create/Modify](#files-to-createmodify)

---

## Problem Analysis

### Problem 1: Level Selection Friction

**Current flow:**
```
User has idea → Must choose: --project, --feature, --spec → Runs /design
```

**Issues:**
- Users don't know the right level upfront
- Under-scoping leads to multiple iterations
- Over-scoping wastes time on unnecessary artifacts
- Task-level work (5-15 min) has no formal workflow

**Evidence from sizing-heuristics.md:**
```
| Level   | Definition                                      | Threshold                     |
|---------|------------------------------------------------|-------------------------------|
| Project | 3+ features with implementation decisions       | ~weeks of work                |
| Feature | 2+ specs requiring implementation decisions     | ~days of work                 |
| Spec    | 3+ tasks with non-trivial choices              | ~hours of work                |
| Task    | Single prompt, <50% context budget             | 5-15 minutes                  |
```

**Gap:** Tasks have no formal design/implement/ship workflow.

### Problem 2: Decision Document Overload

**Current flow:**
```
/research topic → 795-line research-notes.md → User must extract decisions
```

**Issues:**
- Same format regardless of scope
- No TL;DR or executive summary
- No progressive disclosure
- Decision points buried in prose
- No clear action items

**What users actually need by level:**

| Level   | Decision Format                           | Max Length    |
|---------|-------------------------------------------|---------------|
| Task    | Inline yes/no or pick from 2-3 options    | 1 paragraph   |
| Spec    | Single-page decision brief                | 1 page        |
| Feature | Multi-section with expandable details     | 2-3 pages     |
| Project | Full doc with TL;DR and appendices        | Full document |

---

## Solution: The /work Command

### Overview

A single entry point that:
1. Takes a natural language description of work
2. Auto-sizes it (task/spec/feature/project)
3. Routes to the appropriate workflow
4. Handles task-level work with a lightweight flow

### Usage

```bash
# Let the system figure it out
/work "add user avatar upload"
/work "refactor auth system to support OAuth"
/work "build a complete e-commerce platform"

# Explicit level override (optional)
/work "add avatar" --task      # Force task-level
/work "add avatar" --spec      # Force spec-level
```

### Command File: `.claude/commands/work.md`

```markdown
# /work

Level-agnostic entry point - sizes work and routes to appropriate workflow.

## Usage

```bash
/work "description of work"       # Auto-size and route
/work "description" --task        # Force task-level
/work "description" --spec        # Force spec-level
/work "description" --feature     # Force feature-level
/work "description" --project     # Force project-level
/work "description" --dry-run     # Preview sizing without executing
```

---

## Flags

| Flag       | Description                    | Example     |
|------------|--------------------------------|-------------|
| --task     | Force task-level workflow      | --task      |
| --spec     | Force spec-level workflow      | --spec      |
| --feature  | Force feature-level workflow   | --feature   |
| --project  | Force project-level workflow   | --project   |
| --dry-run  | Preview sizing without action  | --dry-run   |

---

## MANDATORY: Preview and Agent Delegation

> **Before executing /work:**
>
> 1. **Show preview** - Display sizing analysis
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/work-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

---

## Sizing Flow

```text
User: /work "description"
    │
    ▼
PHASE 1: QUICK ANALYSIS
    │
    └── Task(work-sizer / Haiku)
          └── Returns: {
                level: 'task'|'spec'|'feature'|'project',
                confidence: 'high'|'medium'|'low',
                reasoning: string,
                estimated_time: string,
                decision_count: number
              }
    │
    ▼
IF confidence === 'low':
    │
    └── Present sizing options to user:
        "I'm uncertain about the scope. This could be:
         (1) Task: ~15 min, no design decisions
         (2) Spec: ~2 hours, 3-5 decisions
         (3) Feature: ~1 day, 10+ decisions

         Which feels right?"
    │
    ▼
PHASE 2: ROUTE TO WORKFLOW
    │
    ├── level === 'task' → Task workflow (see below)
    │
    ├── level === 'spec' → /design {name} --spec
    │
    ├── level === 'feature' → /design {name} --feature
    │
    └── level === 'project' → /design {name} --project
```

---

## Task Workflow (New)

Tasks are 5-15 minute work items that skip full spec creation.

### Task Flow

```text
/work "description" → sized as task
    │
    ▼
PHASE 1: TASK BRIEF (decision document level: task)
    │
    └── Task(task-researcher / Haiku)
          └── Returns: task-brief.md (inline format, see Decision Formats)
    │
    ▼
CHECKPOINT: Present inline decision
    │
    "Task: Add avatar upload to user profile

     Options:
     (A) Store in S3 with presigned URLs [recommended]
     (B) Store in database as blob

     Proceed with (A)? [yes/no/other]"
    │
    ▼
PHASE 2: IMPLEMENT
    │
    └── Task(task-executor / Sonnet)
          └── Direct implementation, TDD optional for simple tasks
    │
    ▼
PHASE 3: VERIFY
    │
    └── Task(task-validator / Haiku)
          └── Runs: lint, typecheck, test (if applicable)
    │
    ▼
Output: "Task complete. Run /ship to commit."
```

### Task Artifacts

Tasks do NOT create spec directories. Instead:

```
.claude/state/tasks/
└── {timestamp}-{slug}.json
    {
      "description": "original description",
      "decision": "A - S3 with presigned URLs",
      "files_changed": ["src/lib/avatar.ts", "src/components/AvatarUpload.tsx"],
      "started_at": "2026-02-05T10:30:00Z",
      "completed_at": "2026-02-05T10:42:00Z",
      "duration_minutes": 12
    }
```

---

## Preview

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /work - Level-Agnostic Entry Point                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ANALYSIS                                                             │
│   Description: "add user avatar upload"                              │
│   Detected Level: TASK                                               │
│   Confidence: HIGH                                                   │
│   Estimated Time: ~12 minutes                                        │
│   Decisions Required: 1 (storage location)                           │
│                                                                      │
│ REASONING                                                            │
│   • Single, well-defined feature                                     │
│   • Follows existing patterns (file upload)                          │
│   • No architectural decisions needed                                │
│   • Can be implemented in one session                                │
│                                                                      │
│ WORKFLOW                                                             │
│   1. BRIEF (task-researcher / Haiku)                                 │
│      → Quick research, inline decision format                        │
│   2. IMPLEMENT (task-executor / Sonnet)                              │
│      → Direct implementation with TDD                                │
│   3. VERIFY (task-validator / Haiku)                                 │
│      → Lint, typecheck, test                                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Proceed as Task  [S] Promote to Spec  [Esc] Cancel           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Output

Task complete:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ TASK COMPLETE                                                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Description: Add user avatar upload                                  │
│ Duration: 12 minutes                                                 │
│ Decision: S3 with presigned URLs                                     │
│                                                                      │
│ Files Changed:                                                       │
│   M src/lib/avatar.ts                                                │
│   A src/components/AvatarUpload.tsx                                  │
│   A src/lib/__tests__/avatar.test.ts                                 │
│                                                                      │
│ Verification:                                                        │
│   ✓ Lint: PASS                                                       │
│   ✓ Types: PASS                                                      │
│   ✓ Tests: PASS (3/3)                                                │
│                                                                      │
│ Run /ship to commit and create PR.                                   │
└──────────────────────────────────────────────────────────────────────┘
```

$ARGUMENTS
```

### Sizing Heuristics for /work

Extend `.claude/sub-agents/lib/sizing-heuristics.md` with auto-detection rules:

```markdown
## Auto-Sizing Heuristics (for /work command)

### Quick Indicators

| Signal                                    | Likely Level |
|-------------------------------------------|--------------|
| "add", "fix", "update" + single thing     | Task         |
| "implement", "create" + bounded feature   | Spec         |
| "build", "design" + system/capability     | Feature      |
| "platform", "suite", "complete"           | Project      |

### Decision Count Estimation

| Decisions Required | Level    |
|--------------------|----------|
| 0-1                | Task     |
| 2-5                | Spec     |
| 6-15               | Feature  |
| 15+                | Project  |

### Time Estimation

| Estimated Time     | Level    |
|--------------------|----------|
| < 30 minutes       | Task     |
| 30 min - 4 hours   | Spec     |
| 4 hours - 2 days   | Feature  |
| > 2 days           | Project  |

### Confidence Levels

**High Confidence** - Clear signals, matches patterns:
- "fix typo in header" → Task (100%)
- "add Stripe payment integration" → Spec (95%)
- "build user authentication with OAuth, magic links, and 2FA" → Feature (90%)

**Medium Confidence** - Ambiguous scope:
- "improve performance" → Could be task (one fix) or spec (systematic)
- "add search" → Could be spec (basic) or feature (full-text + facets)

**Low Confidence** - Needs clarification:
- "make it better" → Ask for specifics
- "do the thing from the meeting" → Insufficient context
```

---

## Solution: Scaled Decision Formats

### Overview

Decision documents scale with work level. Each level has:
1. A template with appropriate detail
2. A maximum length constraint
3. Progressive disclosure (summary first, details on request)
4. Clear action items

### Decision Format Templates

#### Task Decision Format (Inline)

**Location:** `.claude/templates/decisions/task-decision.md`

```markdown
# Task Decision Template

For tasks (5-15 min), decisions are presented inline during the workflow.
No separate document is created.

## Format

```text
TASK: {{task_description}}

{{context_sentence}}

OPTIONS:
(A) {{option_a}} {{#if recommended}}[recommended]{{/if}}
    {{option_a_one_liner}}
(B) {{option_b}}
    {{option_b_one_liner}}
{{#if option_c}}
(C) {{option_c}}
    {{option_c_one_liner}}
{{/if}}

Proceed with ({{default}})? [yes/no/other]
```

## Rules

- Maximum 1 paragraph of context
- Maximum 3 options
- One-liner trade-off per option
- Always have a recommendation
- Always end with clear action prompt

## Example

```text
TASK: Add avatar upload to user profile

User profiles don't currently support avatars. We need to store and serve images.

OPTIONS:
(A) S3 with presigned URLs [recommended]
    Scalable, CDN-friendly, follows existing file upload patterns
(B) Database blob storage
    Simpler setup but doesn't scale, blocks DB during uploads
(C) Local filesystem
    Development only, not suitable for production

Proceed with (A)? [yes/no/other]
```
```

#### Spec Decision Format (Single Page)

**Location:** `.claude/templates/decisions/spec-decision.md`

```markdown
# Spec Decision Brief

> **Spec:** {{spec_name}}
> **Status:** Awaiting Decision
> **Decision Deadline:** {{deadline}}

---

## TL;DR

{{one_sentence_summary}}

**Recommendation:** {{recommended_option}}

---

## Context (2-3 sentences)

{{brief_context}}

---

## Options

### Option A: {{option_a_name}} [Recommended]

{{option_a_description_2_sentences}}

| Pros | Cons |
|------|------|
| {{pro_1}} | {{con_1}} |
| {{pro_2}} | {{con_2}} |

### Option B: {{option_b_name}}

{{option_b_description_2_sentences}}

| Pros | Cons |
|------|------|
| {{pro_1}} | {{con_1}} |
| {{pro_2}} | {{con_2}} |

### Option C: {{option_c_name}} (if applicable)

{{option_c_description_2_sentences}}

| Pros | Cons |
|------|------|
| {{pro_1}} | {{con_1}} |
| {{pro_2}} | {{con_2}} |

---

## Decision Required

**Question:** {{specific_question}}

**Options:**
- [ ] Option A: {{option_a_name}}
- [ ] Option B: {{option_b_name}}
- [ ] Option C: {{option_c_name}}
- [ ] Other: _______________

**Impact of No Decision:** {{impact}}

---

*Maximum length: 1 page (~500 words)*
```

#### Feature Decision Format (Multi-Section)

**Location:** `.claude/templates/decisions/feature-decision.md`

```markdown
# Feature Decision Document

> **Feature:** {{feature_name}}
> **Status:** Awaiting Decision
> **Decisions Required:** {{decision_count}}
> **Estimated Impact:** {{impact_summary}}

---

## Executive Summary

{{3_4_sentence_summary}}

**Key Recommendations:**
1. {{recommendation_1}}
2. {{recommendation_2}}
3. {{recommendation_3}}

---

## Quick Reference

| Decision Point | Recommendation | Confidence | Page |
|---------------|----------------|------------|------|
| {{decision_1}} | {{rec_1}} | {{conf_1}} | [Jump](#decision-1) |
| {{decision_2}} | {{rec_2}} | {{conf_2}} | [Jump](#decision-2) |
| {{decision_3}} | {{rec_3}} | {{conf_3}} | [Jump](#decision-3) |

---

## Context

### Background

{{background_paragraph}}

### Current State

{{current_state_paragraph}}

### Goals

- {{goal_1}}
- {{goal_2}}
- {{goal_3}}

---

## Decision 1: {{decision_1_title}} {#decision-1}

### Summary

{{decision_1_summary_sentence}}

### Options

<details>
<summary>Option A: {{option_a}} [Recommended]</summary>

{{detailed_description}}

**Trade-offs:**
- Pro: {{pro}}
- Con: {{con}}

**Implementation Effort:** {{effort}}

</details>

<details>
<summary>Option B: {{option_b}}</summary>

{{detailed_description}}

**Trade-offs:**
- Pro: {{pro}}
- Con: {{con}}

**Implementation Effort:** {{effort}}

</details>

### Recommendation

{{recommendation_with_reasoning}}

---

## Decision 2: {{decision_2_title}} {#decision-2}

[Same format as Decision 1]

---

## Decision 3: {{decision_3_title}} {#decision-3}

[Same format as Decision 1]

---

## Action Items

After decisions are made:

- [ ] {{action_item_1}}
- [ ] {{action_item_2}}
- [ ] {{action_item_3}}

---

## Appendix: Supporting Data (Optional)

<details>
<summary>Research Findings</summary>

{{research_summary}}

</details>

<details>
<summary>Technical Constraints</summary>

{{constraints}}

</details>

---

*Maximum length: 2-3 pages (~1500 words)*
*Details hidden in collapsible sections*
```

#### Project Decision Format (Full Document)

**Location:** `.claude/templates/decisions/project-decision.md`

```markdown
# Project Decision Document

> **Project:** {{project_name}}
> **Status:** Awaiting Decision
> **Decision Deadline:** {{deadline}}
> **Stakeholders:** {{stakeholders}}

---

## TL;DR (30-second read)

{{two_sentence_summary}}

**Critical Decision:** {{most_important_decision}}

**Recommended Path:** {{recommended_path}}

**If You Read Nothing Else:** {{key_point}}

---

## Executive Summary (2-minute read)

### Project Overview

{{project_overview_paragraph}}

### Key Findings

1. {{finding_1}}
2. {{finding_2}}
3. {{finding_3}}

### Recommendations Summary

| Area | Recommendation | Confidence | Risk |
|------|---------------|------------|------|
| {{area_1}} | {{rec_1}} | {{conf_1}} | {{risk_1}} |
| {{area_2}} | {{rec_2}} | {{conf_2}} | {{risk_2}} |
| {{area_3}} | {{rec_3}} | {{conf_3}} | {{risk_3}} |

### Timeline Estimate

{{timeline_summary}}

---

## Decision Sections

### Section 1: {{section_1_title}}

#### Quick Take

{{one_paragraph_summary}}

#### Decision Required

**Question:** {{question}}

**Options:**
1. **{{option_1}}** [Recommended] - {{one_liner}}
2. **{{option_2}}** - {{one_liner}}
3. **{{option_3}}** - {{one_liner}}

<details>
<summary>Detailed Analysis</summary>

{{detailed_analysis}}

**Trade-off Matrix:**

| Criteria | Option 1 | Option 2 | Option 3 |
|----------|----------|----------|----------|
| {{criteria_1}} | {{score}} | {{score}} | {{score}} |
| {{criteria_2}} | {{score}} | {{score}} | {{score}} |
| {{criteria_3}} | {{score}} | {{score}} | {{score}} |

**Risk Assessment:**

{{risk_assessment}}

</details>

---

### Section 2: {{section_2_title}}

[Same format as Section 1]

---

### Section 3: {{section_3_title}}

[Same format as Section 1]

---

## Implementation Roadmap

### Phase 1: {{phase_1_name}} ({{duration}})

{{phase_1_summary}}

### Phase 2: {{phase_2_name}} ({{duration}})

{{phase_2_summary}}

### Phase 3: {{phase_3_name}} ({{duration}})

{{phase_3_summary}}

---

## Action Items Checklist

### Immediate (This Week)

- [ ] {{action_1}}
- [ ] {{action_2}}

### Short-Term (This Month)

- [ ] {{action_3}}
- [ ] {{action_4}}

### Long-Term (This Quarter)

- [ ] {{action_5}}
- [ ] {{action_6}}

---

## Appendices

<details>
<summary>Appendix A: Research Methodology</summary>

{{methodology}}

</details>

<details>
<summary>Appendix B: Full Research Findings</summary>

{{full_findings}}

</details>

<details>
<summary>Appendix C: Technical Deep Dives</summary>

{{technical_details}}

</details>

<details>
<summary>Appendix D: Alternative Approaches Considered</summary>

{{alternatives}}

</details>

<details>
<summary>Appendix E: Reference Materials</summary>

{{references}}

</details>

---

*Document Structure:*
- *TL;DR: 30 seconds*
- *Executive Summary: 2 minutes*
- *Decision Sections: 5-10 minutes*
- *Appendices: As needed*

*Total recommended reading time for decision-making: 10-15 minutes*
*Full document with appendices: 30-60 minutes*
```

---

## Integration with Existing Commands

### Command Relationship Diagram

```text
                    ┌─────────────────────────────────────────────┐
                    │                  /work                       │
                    │         (Level-Agnostic Entry)               │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌────────────┐    ┌────────────┐    ┌────────────┐
           │   TASK     │    │   SPEC+    │    │  PROJECT   │
           │  workflow  │    │  workflow  │    │  workflow  │
           │  (new)     │    │ (existing) │    │ (existing) │
           └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
                 │                 │                 │
                 │                 ▼                 │
                 │          ┌──────────┐            │
                 │          │ /design  │◄───────────┘
                 │          └────┬─────┘
                 │               │
                 │               ▼
                 │          ┌──────────┐
                 ├─────────►│/implement│
                 │          └────┬─────┘
                 │               │
                 ▼               ▼
           ┌──────────────────────────┐
           │         /ship            │
           └──────────────────────────┘
```

### How /work Routes to Existing Commands

| Sized Level | Route                                | Decision Format |
|-------------|--------------------------------------|-----------------|
| Task        | Task workflow (inline)               | Inline          |
| Spec        | `/design {name} --spec`              | Spec Brief      |
| Feature     | `/design {name} --feature`           | Feature Doc     |
| Project     | `/design {name} --project`           | Project Doc     |

### Modifications to Existing Commands

#### /design Changes

Add awareness of `/work` routing:

```markdown
## Entry Point

/design can be invoked:
1. **Directly:** `/design feature-name --spec`
2. **Via /work:** Routed after auto-sizing

When routed from /work:
- Skip level selection prompt (already determined)
- Include sizing context in research phase
- Use level-appropriate decision format
```

#### /research Changes

Research output should now respect decision format scaling:

```markdown
## Output Format Selection

Based on calling context:

| Context                    | Output Format                  |
|---------------------------|--------------------------------|
| `/research topic`          | Full research-notes.md         |
| `/work` → task research    | Inline decision format         |
| `/design --spec` research  | Spec decision brief            |
| `/design --feature` research| Feature decision document     |
| `/design --project` research| Project decision document     |
```

#### /ship Changes

Support task-level shipping:

```markdown
## Task Shipping

When shipping task-level work:
- No spec to reference
- Use task state from `.claude/state/tasks/`
- Generate commit message from task description
- Include task ID in commit metadata
```

---

## Implementation Plan

### Phase 1: Decision Format Templates (Week 1)

1. Create `.claude/templates/decisions/` directory
2. Create all four decision templates
3. Update `/research` to use appropriate format
4. Test with existing specs

### Phase 2: Task Workflow (Week 2)

1. Create `.claude/commands/work.md`
2. Create `.claude/agents/work-agent.md`
3. Implement task-level flow
4. Create task state management
5. Update `/ship` for task support

### Phase 3: Auto-Sizing (Week 3)

1. Extend sizing-heuristics.md
2. Implement work-sizer sub-agent
3. Add confidence thresholds
4. Add user override handling

### Phase 4: Integration (Week 4)

1. Update `/design` for /work routing
2. Update `/research` for decision formats
3. End-to-end testing
4. Documentation updates

---

## Files to Create/Modify

### New Files

| File                                           | Purpose                           |
|------------------------------------------------|-----------------------------------|
| `.claude/commands/work.md`                     | New /work command                 |
| `.claude/agents/work-agent.md`                 | Work routing agent                |
| `.claude/templates/decisions/task-decision.md` | Inline decision format            |
| `.claude/templates/decisions/spec-decision.md` | Single-page decision brief        |
| `.claude/templates/decisions/feature-decision.md` | Multi-section decision doc    |
| `.claude/templates/decisions/project-decision.md` | Full decision document       |
| `.claude/sub-agents/templates/task-researcher.md` | Task-level research          |
| `.claude/sub-agents/templates/task-executor.md` | Task implementation             |
| `.claude/sub-agents/templates/work-sizer.md`   | Auto-sizing logic                |

### Modified Files

| File                                           | Changes                           |
|------------------------------------------------|-----------------------------------|
| `.claude/sub-agents/lib/sizing-heuristics.md`  | Add auto-sizing heuristics        |
| `.claude/commands/design.md`                   | Add /work routing awareness       |
| `.claude/commands/research.md`                 | Add decision format selection     |
| `.claude/commands/ship.md`                     | Add task-level shipping           |
| `.claude/agents/plan-agent.md`                 | Add decision format routing       |
| `CLAUDE.md`                                    | Add /work command reference       |

---

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Task persistence** | Prune on `/ship` — delete task state file after successful commit | Git commit is the permanent record; avoids stale state files |
| **Task promotion** | Pause and ask user before promoting to spec | Automatic promotion risks surprising the user; explicit consent preferred |
| **Decision format override** | No override — format always matches level | Keeps the system simple; users who want a different level can use `--spec`/`--feature` flags |
| **Confidence threshold** | High auto-proceeds; medium + low ask user | Medium presents sizing with confirmation prompt; low presents multiple level options to choose from |

---

## Success Metrics

| Metric                                    | Target                    |
|-------------------------------------------|---------------------------|
| Time from idea to started implementation  | < 2 minutes for tasks     |
| Correct level selection rate              | > 90%                     |
| Decision document reading time            | Matches level expectations |
| User override rate                        | < 15%                     |

---

## Conclusion

This proposal introduces:

1. **`/work`** - A single entry point that removes the burden of level selection
2. **Task workflow** - First-class support for 5-15 minute work items
3. **Scaled decision formats** - Documents that match the scope of decisions required

The changes are additive and backward-compatible. Existing `/design`, `/implement`, and `/ship` commands continue to work. The new `/work` command provides an easier path for users who don't want to think about levels upfront.
