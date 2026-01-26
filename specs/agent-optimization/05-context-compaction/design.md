# Design: Context Compaction System

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-05

## Overview

This design implements a multi-layered context compaction strategy: automatic compaction at sub-agent phase boundaries, structured handoff rules for minimal context transfer, and enhanced hooks for monitoring and suggestions.

---

## Architecture

### Compaction Layers

```text
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Sub-Agent Isolation (already implemented)         │
│  Each sub-agent has fresh context                           │
│  Savings: ~40%                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Handoff Compaction (this spec)                    │
│  context_summary ≤ 500 tokens between phases                │
│  Additional savings: ~20%                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Orchestrator Compaction (this spec)               │
│  Orchestrator discards sub-agent raw outputs                │
│  Additional savings: ~10%                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Manual/Suggested Compaction                       │
│  /compact at natural breakpoints                            │
│  Emergency savings when approaching limits                  │
└─────────────────────────────────────────────────────────────┘

TOTAL SAVINGS: ~50-60% compared to no compaction
```

---

## Component Design

### 1. Handoff Compaction Rules

**File:** `.claude/sub-agents/protocols/handoff.md` (updated)

#### context_summary Guidelines

```markdown
## Context Summary Rules

### Maximum Length

- 500 tokens (~400 words)
- Use bullet points for multiple items
- Prioritize actionable information

### What to INCLUDE

- Key findings relevant to next phase
- Decisions made (PROCEED/STOP/CLARIFY)
- File paths that need attention
- Pattern names to follow
- Constraints to observe

### What to EXCLUDE

- Search queries and grep patterns
- Intermediate thinking steps
- Full file contents
- Error messages already resolved
- Alternative approaches not chosen

### Examples

GOOD (compact, actionable):
"Auth utilities exist in src/lib/auth.ts using JWT with httpOnly cookies.
Extend with loginUser/logoutUser. Follow existing validateToken pattern.
No conflicts found. Recommend: add tests to auth.test.ts."

BAD (verbose, includes process):
"I searched for 'auth' and found several files. First I looked at
src/lib/auth.ts which contains 150 lines of code including imports
from jsonwebtoken and cookie packages. The file exports validateToken
which takes a token string parameter and returns a boolean. I also
checked src/hooks/useAuth.ts but that's just a React hook wrapper.
There was also mention of auth in the README but that's documentation.
After analyzing all this, I think we should..."
```

### 2. Orchestrator Context Management

**Pattern for orchestrators:**

```markdown
## Orchestrator Memory Rules

### After Each Sub-Agent Return

1. Extract context_summary from response
2. Extract decision (PROCEED/STOP/CLARIFY)
3. Extract essential data (files_changed, errors)
4. DISCARD raw response

### State to Maintain

{
"task": {
"id": "task-123",
"feature": "user-auth",
"spec_path": "specs/user-auth/requirements.md"
},
"progress": {
"current_phase": "write",
"completed_phases": ["research"],
"research_summary": "JWT auth exists...", // 500 tokens max
"files_changed": ["src/lib/auth.ts"]
},
"decisions": {
"research": "PROCEED",
"write": "pending"
}
}

### State to Discard

- Raw grep/search outputs
- Full sub-agent responses
- Alternative approaches considered
- Error messages from resolved issues
```

### 3. Compaction Hooks

**File:** `.claude/scripts/hooks/compaction-tracker.cjs`

```javascript
#!/usr/bin/env node
/**
 * Track compaction events and context usage patterns.
 * Fires on PreCompact hook.
 */

const { readStdinJson, appendToLog, logError } = require("../lib/utils.cjs");

async function main() {
  const input = await readStdinJson();

  const event = {
    timestamp: new Date().toISOString(),
    session_id: input.session_id,
    event: "compaction",
    context_before: input.context_tokens || 0,
    tool_calls: input.tool_call_count || 0,
    reason: input.reason || "manual",
  };

  // Log compaction event
  appendToLog(".claude/logs/compaction.json", event, 100);

  logError(
    `[Compaction] Context: ${event.context_before} tokens, ` +
      `${event.tool_calls} tool calls`
  );

  process.exit(0);
}

main();
```

### 4. Enhanced Suggest-Compact Hook

**File:** `.claude/scripts/hooks/suggest-compact.cjs` (updated)

```javascript
#!/usr/bin/env node
/**
 * Suggest compaction at strategic intervals.
 * Fires on PostToolUse for Edit|Write.
 */

const { readStdinJson, logError } = require("../lib/utils.cjs");

// Track state in memory (resets each session)
let toolCallCount = 0;

async function main() {
  const input = await readStdinJson();

  toolCallCount++;

  // Suggest at intervals
  const shouldSuggest =
    toolCallCount === 50 || toolCallCount === 100 || toolCallCount === 150;

  if (shouldSuggest) {
    logError("");
    logError("💡 Consider running /compact to free up context");
    logError(`   (${toolCallCount} tool calls this session)`);
    logError("");
  }

  process.exit(0);
}

main();
```

---

## Data Flow

### Phase Boundary Compaction

```text
Sub-Agent returns:
{
  "task_id": "research-123",
  "phase": "research",
  "status": "complete",
  "decision": "PROCEED",
  "findings": {
    "existing_implementations": [...],  // 2000 tokens
    "conflicts": [...],                  // 500 tokens
    "patterns_found": [...],             // 800 tokens
    "recommendations": [...]             // 400 tokens
  },
  "context_summary": "JWT auth exists...",  // 100 tokens
  "tokens_used": 15000
}

Orchestrator extracts:
{
  "decision": "PROCEED",
  "context_summary": "JWT auth exists...",
  "files_of_interest": ["src/lib/auth.ts"]
}

Orchestrator discards:
- findings.existing_implementations (2000 tokens)
- findings.conflicts (500 tokens)
- findings.patterns_found (800 tokens)
- findings.recommendations (400 tokens)

SAVINGS: 3700 tokens → 150 tokens (~96% reduction for handoff)
```

### Compaction Suggestion Flow

```text
User works on feature...
    │
    ├── Tool call #50
    │   └── Hook: "💡 Consider /compact (50 tool calls)"
    │
    ├── User continues or compacts...
    │
    ├── Tool call #100
    │   └── Hook: "💡 Consider /compact (100 tool calls)"
    │
    └── ...
```

---

## Compaction Metrics

### Target Metrics

| Metric                          | Before       | After          | Target         |
| ------------------------------- | ------------ | -------------- | -------------- |
| Handoff size                    | ~3000 tokens | ~500 tokens    | ≤500 tokens    |
| Orchestrator retained           | All outputs  | Summaries only | ~80% reduction |
| Session tool calls before limit | ~150         | ~300           | 2x improvement |

### Measurement Points

1. Sub-agent response size (tokens_used field)
2. context_summary size (count tokens)
3. Orchestrator state size (serialize and count)
4. Tool calls per session (hook counter)

---

## Implementation Notes

### Why Handoff Compaction?

1. Sub-agent isolation provides fresh context, but handoffs can still bloat
2. Research findings often include 10x more data than needed for writing
3. Structured compaction rules ensure consistent behavior
4. Explicit rules help sub-agents produce better summaries

### Why Orchestrator Discards?

1. Orchestrator only needs to coordinate, not remember details
2. Sub-agents have their own context for their work
3. Keeping raw outputs defeats purpose of isolation
4. Essential state fits in small structure

### Why Suggestion Hooks?

1. Users lose track of session length
2. Proactive suggestions prevent hitting limits
3. Non-blocking allows user to choose timing
4. Logged data helps tune thresholds

---

## Dependencies

| Component         | Version  | Purpose             |
| ----------------- | -------- | ------------------- |
| 01-infrastructure | Required | Handoff protocol    |
| Hooks system      | Current  | Compaction triggers |
| /compact command  | Built-in | Manual compaction   |
