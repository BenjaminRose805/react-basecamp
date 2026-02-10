# Sizing Heuristics

Guidelines for determining appropriate sizing at each level of the hierarchy (project → feature → spec → task).

## Overview

**Purpose:** Ensure work is decomposed at the correct level of abstraction based on implementation decisions required, not file counts or conceptual categories.

**Core Principle:** The presence of **implementation decisions** determines the appropriate level, not volume of work.

> "If a unit of work can be fully described as a single bash command or file write, it belongs at a lower level."

---

## Level Definitions

| Level | Definition | Minimum Threshold |
|-------|-----------|-------------------|
| **Project** | A body of work requiring multiple features with distinct deliverables | 3+ features, each with implementation decisions |
| **Feature** | A shippable capability requiring multiple specs | 2+ specs, each requiring implementation decisions |
| **Spec** | A coherent unit requiring multiple tasks with non-trivial choices | 3+ tasks AND implementation decisions during execution |
| **Task** | A single prompt completable within one agent's context window | Fits in <50% of context budget (input + output) |

---

## The Decision Test

Before creating any breakdown, apply this test:

### Project Level
```
Q: "How many specs with implementation decisions will this project require?"
A: If fewer than 3 specs total across all features → This is a feature, not a project
```

### Feature Level
```
Q: "Does each proposed spec require 3+ tasks AND non-trivial implementation choices?"
A: If a spec can be implemented with a single bash command → It's a task, not a spec
A: If all specs combined have <6 tasks → This is a single spec, not a feature
```

### Spec Level
```
Q: "Will implementing this require decisions during execution?"
A: If the implementation is predetermined (just copy files, run commands) → It's a task list, not a spec
A: If it can be done in <5 minutes of Claude Code time → Collapse into parent
```

### Task Level
```
Q: "Can this be described, executed, and verified within 50% of the agent's context budget?"
A: If it requires multiple agent turns to complete → Split into multiple tasks
A: Tasks should be 5-15 minutes of agent execution time
```

---

## Decision-Based Sizing (Primary Heuristic)

**Key insight:** Decisions, not volume, determine complexity.

| Work Type | Has Decisions? | Correct Level |
|-----------|---------------|---------------|
| "Copy 38 files to new directory" | No (predetermined list) | Task |
| "Design a JSON schema for profiles" | Yes (structure choices) | Spec |
| "Implement assembly script" | Yes (algorithm choices) | Spec |
| "Run `mkdir -p` and `cp` commands" | No (mechanical) | Task |
| "Choose between overlay vs generator approach" | Yes (architectural) | Feature |

### Red Flags: Over-Decomposition

If you see these patterns, the work is over-decomposed:

- **Spec that's a single bash command** → Should be a task
- **Feature with specs that have no decisions** → Should be a single spec
- **Project where all features are mechanical** → Should be a single feature
- **Tasks estimated at "2 minutes each"** → Probably over-split

### Red Flags: Under-Decomposition

If you see these patterns, the work needs more breakdown:

- **Task requiring 20+ minutes of agent time** → Should be multiple tasks
- **Spec requiring 10+ implementation decisions** → Should be multiple specs
- **Feature touching 5+ distinct domains** → Should be multiple features

---

## Context Window Sizing (Task Level)

Tasks must fit within an agent's effective context window.

### Context Budget Allocation

```
Total Context Window: 200K tokens (example)
├── System prompt + instructions: ~10K tokens
├── Codebase context (files read): ~40K tokens
├── Task description + requirements: ~5K tokens
├── Working memory (intermediate results): ~20K tokens
├── Output generation: ~25K tokens
└── Safety margin: ~100K tokens (50% reserved)
```

**Rule:** A task should be completable with <50% of the context budget consumed.

### Task Duration Heuristic

Based on [Augment Code's research](https://www.augmentcode.com/blog/how-we-built-tasklist):

> "Agents plan, execute, and report in a way that mirrors how you chunk work into 5-15 minute steps"

| Task Duration | Interpretation |
|---------------|----------------|
| < 1 minute | Too granular (combine with related tasks) |
| 1-5 minutes | Simple task (appropriate for mechanical work) |
| 5-15 minutes | Standard task (appropriate for most implementation) |
| 15-30 minutes | Complex task (verify it can't be split) |
| > 30 minutes | Over-scoped (must be split) |

---

## Sizing Validation Gates

### Gate 1: Project Creation

Before creating a project, verify:

```markdown
## PROJECT SIZING VALIDATION

1. List all features this project will contain:
   - Feature A: [description]
   - Feature B: [description]
   - Feature C: [description]

2. For each feature, does it require 2+ specs with decisions?
   - Feature A: [yes/no] - [why]
   - Feature B: [yes/no] - [why]
   - Feature C: [yes/no] - [why]

3. Decision:
   - If 3+ features with decisions → Create project
   - If <3 features → Collapse to feature level
   - If all work is mechanical → Collapse to single spec
```

### Gate 2: Feature Creation

Before creating a feature, verify:

```markdown
## FEATURE SIZING VALIDATION

1. List all specs this feature will contain:
   - Spec A: [description]
   - Spec B: [description]

2. For each spec, what implementation decisions are required?
   - Spec A: [list decisions or "none - mechanical"]
   - Spec B: [list decisions or "none - mechanical"]

3. Can any spec be implemented with a single command?
   - Spec A: [yes/no]
   - Spec B: [yes/no]

4. Decision:
   - If 2+ specs with decisions → Create feature
   - If <2 specs with decisions → Collapse to spec level
   - If all specs are single commands → Collapse to task list
```

### Gate 3: Spec Creation

Before creating a spec, verify:

```markdown
## SPEC SIZING VALIDATION

1. List all tasks this spec will require:
   - Task 1: [description]
   - Task 2: [description]
   - Task 3: [description]

2. What implementation decisions will be made during execution?
   - [List decisions, or "none - work is predetermined"]

3. Estimated total implementation time: [X minutes]

4. Can the entire spec be done with a single bash command?
   - [yes/no] - Command: [command if yes]

5. Decision:
   - If 3+ tasks AND decisions required → Create spec
   - If <3 tasks or no decisions → Collapse to task in parent spec
   - If single command → Add as task to parent, not standalone spec
```

### Gate 4: Task Creation

Before creating a task, verify:

```markdown
## TASK SIZING VALIDATION

1. Can this task be completed in a single agent turn?
   - [yes/no]

2. Estimated context consumption:
   - Files to read: [count] (~[X]K tokens)
   - Output to generate: (~[X]K tokens)
   - Total: [X]K tokens ([X]% of budget)

3. Estimated duration: [X] minutes

4. Decision:
   - If <50% context budget AND 5-15 min → Appropriate task size
   - If >50% context budget → Split into subtasks
   - If <1 min → Combine with related task
```

---

## Collapse-Upward Recommendation

When validation fails, recommend collapsing:

```markdown
## SIZING RECOMMENDATION: COLLAPSE UPWARD

The proposed [project/feature/spec] does not meet minimum thresholds.

**Reason:** [Specific reason - e.g., "All specs can be implemented with single commands"]

**Recommendation:** Collapse this [level] into [parent level] as:
- [How it should be restructured]

**Example:**
Instead of:
  Feature: core-reorganization
    Spec: directory-structure
    Spec: agent-migration
    Spec: config-migration

Recommend:
  Spec: core-reorganization
    Task: Create directory structure
    Task: Copy agent files
    Task: Copy config files
```

---

## Examples

### Example 1: Over-Decomposed (BAD)

```
Project: multi-stack-template
  Feature: core-reorganization          ← No decisions, just file copying
    Spec: directory-structure           ← Single mkdir command
    Spec: agent-migration               ← Single cp command
    Spec: config-migration              ← Single cp command
  Feature: stack-profile-system         ← Has decisions (schema design)
    Spec: profile-schema                ← Has decisions
    Spec: profile-reader                ← Has decisions
```

**Problem:** `core-reorganization` feature has no implementation decisions.

**Fix:** Collapse `core-reorganization` to a single task within another spec.

### Example 2: Correctly Sized (GOOD)

```
Project: multi-stack-template
  Feature: template-extraction
    Spec: core-and-overlay-structure    ← Decisions: directory layout, what's generic vs specific
      Task: Create core directory and copy generic files
      Task: Create react-nextjs overlay directory
      Task: Design and implement stack-profile.json schema
      Task: Build assembly script (init.cjs)
      Task: Validate round-trip assembly
    Spec: python-fastapi-overlay        ← Decisions: Python patterns, security rules
      Task: Create Python-specific agent overrides
      Task: Create Python coding standards skill
      Task: Create Python security patterns skill
      Task: Validate Python stack assembly
  Feature: update-mechanism             ← Decisions: merge strategy, conflict resolution
    Spec: upgrade-system
      Task: Design 3-way merge approach
      Task: Implement diff detection
      Task: Implement update.cjs script
      Task: Handle conflict resolution UX
```

**Why this works:**
- Each spec requires implementation decisions during execution
- Tasks are 5-15 minute chunks
- No spec is a single bash command
- Features deliver distinct, shippable capabilities

### Example 3: File Copying is a Task, Not a Spec

```markdown
## INCORRECT (Over-decomposed)
Spec: agent-migration
  Task: Copy plan-agent.md
  Task: Copy git-agent.md
  Task: Copy prune-agent.md
  Task: Copy docs-agent.md
  Task: Copy eval-agent.md

## CORRECT (Right-sized)
Task: Copy generic agent files to core/
  Command: cp .claude/agents/{plan,git,prune,docs,eval}-agent.md core/.claude/agents/
```

---

## Integration with Plan Agent

The plan-agent MUST apply sizing validation at each level:

1. **Before project-level research:** "Will this require 3+ features with decisions?"
2. **Before feature-level research:** "Will this require 2+ specs with decisions?"
3. **Before spec-level research:** "Will this require 3+ tasks with decisions?"
4. **Before task decomposition:** "Can each task fit in 50% of context budget?"

If validation fails, the plan-agent should:
1. Log the sizing validation result
2. Recommend collapsing to the appropriate level
3. Ask the user to confirm before proceeding with a smaller scope

---

## Auto-Sizing Heuristics (for /work command)

When sizing work from a natural language description, use these signals:

### Quick Keyword Signals

| Signal                                    | Likely Level |
|-------------------------------------------|--------------|
| "add", "fix", "update" + single thing     | Task         |
| "implement", "create" + bounded feature   | Spec         |
| "build", "design" + system/capability     | Feature      |
| "platform", "suite", "complete", "migrate"| Project      |

### Decision Count Estimation

| Decisions Required | Level    |
|--------------------|----------|
| 0-1                | Task     |
| 2-5                | Spec     |
| 6-15               | Feature  |
| 15+                | Project  |

### Confidence Levels

**High Confidence** - Clear signals, matches patterns:
- "fix typo in header" --> Task (100%)
- "add Stripe payment integration" --> Spec (95%)
- "build user auth with OAuth, magic links, and 2FA" --> Feature (90%)

**Medium Confidence** - Ambiguous scope:
- "improve performance" --> Could be task (one fix) or spec (systematic)
- "add search" --> Could be spec (basic) or feature (full-text + facets)

**Low Confidence** - Needs clarification:
- "make it better" --> Ask for specifics
- "do the thing from the meeting" --> Insufficient context

### Complexity Indicators

**Task-level (0-1 decisions):**
- Single file change
- Follows existing pattern exactly
- "Fix", "tweak", "adjust"
- Clear, predetermined solution

**Spec-level (2-5 decisions):**
- Multiple related files
- Some design choices needed
- "Implement", "add feature"
- Bounded scope, single capability

**Feature-level (6-15 decisions):**
- Multiple components/modules
- Architectural choices
- "Build system", "add capability"
- Shippable unit, multiple specs

**Project-level (15+ decisions):**
- Cross-cutting concerns
- Multiple features
- "Platform", "migrate", "rewrite"
- Weeks of work, multiple features

---

## References

- [Augment Code: How We Built Tasklist](https://www.augmentcode.com/blog/how-we-built-tasklist) - 5-15 minute task sizing
- [Anthropic: Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Context budget management
- [Factory.ai: The Context Window Problem](https://factory.ai/news/context-window-problem) - Scaling beyond token limits
