# Sizing Heuristics

Algorithm for determining optimal sub-agent count based on task complexity.

## Overview

**Purpose:** Help orchestrators decide how many sub-agents to spawn (1-7) instead of hardcoded counts.

**When to Use:**

- Before spawning sub-agents in any orchestrator
- When task complexity varies significantly
- When optimizing context window usage and cost

**Benefits:**

- Simple tasks (1 file) use 1 sub-agent (saves context/cost)
- Complex tasks (20 files) use up to 7 sub-agents (prevents overflow)
- Adaptive to task characteristics (files, tasks, modules, effort)

---

## Algorithm

```javascript
/**
 * Determine optimal sub-agent count based on task complexity.
 *
 * @param context - Task complexity metrics
 * @param context.fileCount - Number of files to touch (0 = unknown)
 * @param context.taskCount - Number of discrete tasks/steps
 * @param context.moduleCount - Number of distinct modules/domains
 * @param context.effort - Effort estimate ("small" | "medium" | "large")
 * @returns Sub-agent count (1-7)
 */
function determineSubAgentCount(context) {
  let count = 1; // Start with minimum (1 sub-agent)

  // FILE COUNT CONTRIBUTION (40% weight)
  // Files are the strongest signal of complexity
  if (context.fileCount === 1) {
    count += 0; // Single file = simple task
  } else if (context.fileCount <= 3) {
    count += 1; // Few files = moderate task
  } else if (context.fileCount <= 7) {
    count += 2; // Many files = complex task
  } else {
    count += 3; // Massive files = very complex
  }

  // TASK COUNT CONTRIBUTION (30% weight)
  // Number of discrete steps to complete
  if (context.taskCount <= 2) {
    count += 0; // 1-2 tasks = simple
  } else if (context.taskCount <= 5) {
    count += 1; // 3-5 tasks = moderate
  } else {
    count += 2; // 6+ tasks = complex
  }

  // MODULE SPREAD CONTRIBUTION (20% weight)
  // Cross-module work increases coordination overhead
  if (context.moduleCount > 1) {
    count += 1; // Multiple modules = add 1
  }

  // EFFORT ESTIMATE CONTRIBUTION (10% weight)
  // Subjective complexity assessment
  if (context.effort === "large") {
    count += 1; // Large effort = add 1
  }

  // CAP AT MAXIMUM
  // Never exceed 7 sub-agents (context/coordination limits)
  return Math.min(count, 7);
}
```

---

## Heuristics Table

| Factor         | Weight | Contribution Logic                                   |
| -------------- | ------ | ---------------------------------------------------- |
| **File Count** | 40%    | 1 file = +0, 2-3 files = +1, 4-7 files = +2, 8+ = +3 |
| **Task Count** | 30%    | 1-2 tasks = +0, 3-5 tasks = +1, 6+ tasks = +2        |
| **Modules**    | 20%    | 1 module = +0, 2+ modules = +1                       |
| **Effort**     | 10%    | small/medium = +0, large = +1                        |

**Why These Weights?**

- **Files dominate** because each file = context, testing, integration
- **Tasks matter** but some tasks affect the same files
- **Modules indicate** coordination overhead (cross-domain changes)
- **Effort is subjective** and least reliable (lowest weight)

---

## Examples

### Scenario 1: Fix Typo in README

```javascript
context = {
  fileCount: 1,
  taskCount: 1,
  moduleCount: 1,
  effort: "small",
};
// Calculation: 1 (base) + 0 (1 file) + 0 (1-2 tasks) + 0 (1 module) + 0 (small) = 1
// Result: 1 sub-agent
```

### Scenario 2: Add Simple Endpoint

```javascript
context = {
  fileCount: 2,
  taskCount: 2,
  moduleCount: 1,
  effort: "small",
};
// Calculation: 1 (base) + 1 (2-3 files) + 0 (1-2 tasks) + 0 (1 module) + 0 (small) = 2
// Result: 2 sub-agents
```

### Scenario 3: Add Feature (5 Tasks, 3 Files)

```javascript
context = {
  fileCount: 3,
  taskCount: 5,
  moduleCount: 2,
  effort: "medium",
};
// Calculation: 1 (base) + 1 (2-3 files) + 1 (3-5 tasks) + 1 (2 modules) + 0 (medium) = 4
// Result: 4 sub-agents
```

### Scenario 4: Refactor Module (10 Files)

```javascript
context = {
  fileCount: 10,
  taskCount: 3,
  moduleCount: 1,
  effort: "medium",
};
// Calculation: 1 (base) + 3 (8+ files) + 1 (3-5 tasks) + 0 (1 module) + 0 (medium) = 5
// Result: 5 sub-agents
```

### Scenario 5: Large Feature (20 Files, 12 Tasks)

```javascript
context = {
  fileCount: 20,
  taskCount: 12,
  moduleCount: 4,
  effort: "large",
};
// Calculation: 1 (base) + 3 (8+ files) + 2 (6+ tasks) + 1 (4 modules) + 1 (large) = 8
// Capped: min(8, 7) = 7
// Result: 7 sub-agents (maximum)
```

### Scenario 6: /ship Commit + PR

```javascript
context = {
  fileCount: 0, // Unknown/not applicable
  taskCount: 1, // Single task (commit or PR)
  moduleCount: 1,
  effort: "small",
};
// Calculation: 1 (base) + 0 (fileCount=0) + 0 (1 task) + 0 (1 module) + 0 (small) = 1
// Result: 1 sub-agent
```

---

## Usage in Orchestrators

### Step 1: Analyze Task Complexity

Before spawning sub-agents, gather complexity metrics:

```markdown
## PHASE 1: ANALYZE COMPLEXITY

Determine task complexity:

- How many files will this task touch? (estimate or use cclsp/Grep)
- How many discrete tasks/steps are there?
- How many modules/domains are involved?
- What's the effort estimate? (small/medium/large)
```

### Step 2: Apply Sizing Heuristics

Use the algorithm to determine sub-agent count:

```markdown
## PHASE 2: DETERMINE SUB-AGENT COUNT

Using sizing heuristics from `.claude/sub-agents/lib/sizing-heuristics.md`:

Context:

- fileCount: 5
- taskCount: 4
- moduleCount: 2
- effort: medium

Calculation:
1 (base) + 2 (4-7 files) + 1 (3-5 tasks) + 1 (2 modules) + 0 (medium) = 5

**Decision: Spawn 5 sub-agents**
```

### Step 3: Log Decision Rationale

Always log the reasoning for tuning:

```markdown
## SUB-AGENT SIZING

**Context:**

- Files: 5 (src/server/routers/workItem.ts, src/components/WorkItemCard.tsx, ...)
- Tasks: 4 (schema, API, UI, tests)
- Modules: 2 (backend, frontend)
- Effort: medium

**Calculation:** 1 + 2 + 1 + 1 + 0 = 5 sub-agents

**Rationale:**

- 5 files require significant context
- Cross-module work (backend + frontend)
- 4 tasks benefit from parallel execution
```

### Step 4: Spawn Sub-Agents

Use the calculated count:

```markdown
## PHASE 3: SPAWN SUB-AGENTS

Launch 5 sub-agents in parallel:

1. **researcher-backend** (Opus) - Research backend patterns
2. **researcher-frontend** (Opus) - Research UI patterns
3. **writer-backend** (Sonnet) - Implement API
4. **writer-frontend** (Sonnet) - Implement UI
5. **validator** (Haiku) - Verify integration
```

---

## Logging

### Mandatory Logging Format

Always log sizing decisions in this format:

```markdown
**SUB-AGENT SIZING**

- Files: [count] ([file1, file2, ...])
- Tasks: [count] ([task1, task2, ...])
- Modules: [count] ([module1, module2, ...])
- Effort: [small|medium|large]
- **Calculated:** [count] sub-agents
- **Rationale:** [why this number makes sense]
```

### Why Log?

1. **Transparency** - User understands why N sub-agents were spawned
2. **Tuning** - Collect data to adjust weights over time
3. **Debugging** - Diagnose under/over-spawning issues
4. **Auditability** - Review orchestrator decisions

---

## Tuning Guidelines

### When to Adjust Weights

| Observation                      | Adjustment                    |
| -------------------------------- | ----------------------------- |
| Simple tasks spawn too many      | Increase file count threshold |
| Complex tasks spawn too few      | Decrease file count threshold |
| Cross-module work underestimated | Increase module weight        |
| Effort estimate unreliable       | Decrease effort weight        |
| Consistent over/under-spawning   | Adjust base count or cap      |

### Adjustment Example

If "add simple endpoint" (2 files, 2 tasks) spawns 2 sub-agents but 1 is sufficient:

**Before:**

```javascript
if (context.fileCount <= 3) count += 1; // 2-3 files = +1
```

**After:**

```javascript
if (context.fileCount <= 2)
  count += 0; // 1-2 files = +0
else if (context.fileCount <= 5) count += 1; // 3-5 files = +1
```

### Data Collection

Track these metrics over time:

- **Actual sub-agents spawned** vs **complexity metrics**
- **Context overflow incidents** (too few sub-agents)
- **Wasted context** (too many sub-agents for simple tasks)
- **User feedback** ("Why did this spawn 5 agents?")

---

## Integration Checklist

Before using sizing heuristics in an orchestrator:

- [ ] Read this document (`.claude/sub-agents/lib/sizing-heuristics.md`)
- [ ] Analyze task complexity (files, tasks, modules, effort)
- [ ] Apply algorithm to determine count
- [ ] Log decision in orchestrator output
- [ ] Spawn the calculated number of sub-agents
- [ ] Review sizing after completion (was it correct?)

---

## Special Cases

### Unknown File Count

When file count cannot be estimated (e.g., /ship commit):

```javascript
context = {
  fileCount: 0, // Unknown
  taskCount: 1,
  moduleCount: 1,
  effort: "small",
};
// Result: 1 sub-agent (safe default)
```

### Single Complex File

When 1 file is very complex (e.g., 1000-line refactor):

```javascript
context = {
  fileCount: 1,
  taskCount: 8, // Many tasks in one file
  moduleCount: 1,
  effort: "large",
};
// Calculation: 1 + 0 (1 file) + 2 (6+ tasks) + 0 (1 module) + 1 (large) = 4
// Result: 4 sub-agents (task count dominates)
```

### Cross-Cutting Refactor

When touching many files but simple changes (e.g., rename):

```javascript
context = {
  fileCount: 15, // Many files
  taskCount: 1, // Single task (rename)
  moduleCount: 3, // Spread across modules
  effort: "small", // Simple changes
};
// Calculation: 1 + 3 (8+ files) + 0 (1 task) + 1 (3 modules) + 0 (small) = 5
// Result: 5 sub-agents (file count dominates)
```

---

## References

- **Sub-Agent System:** `.claude/sub-agents/README.md`
- **Orchestrator Patterns:** `.claude/sub-agents/protocols/orchestration-patterns.md`
- **Handoff Protocol:** `.claude/sub-agents/protocols/handoff-protocol.md`
