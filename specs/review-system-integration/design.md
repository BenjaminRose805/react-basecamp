# Review System Integration - Design

## Architecture Overview

This design addresses the separation of concerns between hooks (context injection) and commands (business logic execution), ensuring proper delegation patterns and ship gate enforcement.

---

## Current State Problems

### Problem 1: Hook Executes Business Logic

**Current Flow (INCORRECT):**

```
User: /review
  ↓
user-prompt-review.cjs hook
  ↓
execSync("node loop-1.cjs") ← WRONG: Hook executing directly
  ↓
execSync("node loop-2.cjs")
  ↓
execSync("node loop-3.cjs")
  ↓
execSync("node loop-4.cjs")
  ↓
Loop results displayed
```

**Issues:**

- Violates CLAUDE.md core rule (no direct execution)
- Bypasses preview/confirmation flow
- No agent delegation via Task tool
- Synchronous blocking execution

### Problem 2: Missing Ship Gate

**Current Flow (INCORRECT):**

```
User: /review
  ↓
Loop results written to loop-state.json
  ↓
(state file exists but unused)
  ↓
User: /ship
  ↓
git-agent.md ← NO GATE CHECK
  ↓
Git operations proceed (unreviewed code can ship)
```

**Issues:**

- code-review/SKILL.md documents pre-ship-check.cjs but it doesn't exist
- No enforcement of review requirements
- State file effectively unused for gating

---

## Target Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ /review Command Flow                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User: /review                                               │
│    ↓                                                         │
│  user-prompt-review.cjs (HOOK)                               │
│    ├─ Detect /review command                                │
│    ├─ Gather context (files, scope, options)                │
│    └─ logContext("Review requested", {...})                 │
│    ↓                                                         │
│  review.md (COMMAND) ← Claude receives context               │
│    ├─ Display preview:                                       │
│    │   • Loops to execute: 1-4                               │
│    │   • Scope: changed files                                │
│    │   • Resources: 4 sub-agents (Opus/Sonnet)              │
│    ├─ Ask for confirmation                                   │
│    └─ Wait for user approval                                 │
│    ↓                                                         │
│  User confirms                                               │
│    ↓                                                         │
│  Task() spawns Loop 1 sub-agent                              │
│    ↓                                                         │
│  Task() spawns Loop 2 sub-agent (if Loop 1 passed)          │
│    ↓                                                         │
│  Task() spawns Loop 3 sub-agent (if Loop 2 passed)          │
│    ↓                                                         │
│  Task() spawns Loop 4 sub-agent (if Loop 3 passed)          │
│    ↓                                                         │
│  Update loop-state.json:                                     │
│    {                                                         │
│      ship_allowed: true/false,                               │
│      head_commit: "abc123",                                  │
│      blockers: [...]                                         │
│    }                                                         │
│    ↓                                                         │
│  Display summary to user                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ /ship Command Flow (with Gate)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User: /ship                                                 │
│    ↓                                                         │
│  user-prompt-ship.cjs (HOOK)                                 │
│    ├─ Detect /ship command                                   │
│    ├─ Read loop-state.json                                   │
│    ├─ Check: state exists?                                   │
│    │   NO → logContext("No review state", {warn: true})     │
│    │   YES → Continue                                        │
│    ├─ Check: head_commit === git HEAD?                       │
│    │   NO → logContext("Stale review", {block: true})       │
│    │   YES → Continue                                        │
│    ├─ Check: ship_allowed === true?                          │
│    │   NO → logContext("Ship blocked", {blockers: [...]})   │
│    │   YES → logContext("Ship approved", {})                │
│    └─ Exit hook                                              │
│    ↓                                                         │
│  ship.md (COMMAND) ← Claude receives gate result             │
│    ├─ If blocked: Display blockers, suggest /review          │
│    │   └─ Exit without git operations                        │
│    └─ If approved: Proceed with git-agent.md                 │
│        ↓                                                     │
│      git-agent.md                                            │
│        ├─ Task() spawn commit agent                          │
│        ├─ Task() spawn push agent                            │
│        └─ Task() spawn PR agent (if needed)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Hook: user-prompt-review.cjs (REFACTORED)

**Role:** Context injection only (no execution)

**Pattern:** Follow user-prompt-start.cjs

```javascript
// user-prompt-review.cjs
const { logContext } = require("../lib/context-helpers.cjs");
const { detectReviewCommand } = require("../lib/command-detection.cjs");

module.exports = async function userPromptReview(userMessage) {
  const reviewCmd = detectReviewCommand(userMessage);
  if (!reviewCmd) return; // Not a /review command

  // Gather context (read git status, count files, etc.)
  const context = {
    command: "/review",
    scope: reviewCmd.scope || "changed",
    files: getChangedFiles(),
    loops: reviewCmd.loops || [1, 2, 3, 4],
    options: reviewCmd.options || {},
  };

  // Inject context for command to consume
  logContext("Review command detected", context);

  // Hook ends here - NO EXECUTION
};
```

**Key Points:**

- Detect command from user message
- Gather metadata (scope, files, options)
- Log context for command consumption
- No sub-agent spawning
- No script execution

---

### 2. Hook: user-prompt-ship.cjs (NEW)

**Role:** Ship gate enforcement via state validation

```javascript
// user-prompt-ship.cjs
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { logContext } = require("../lib/context-helpers.cjs");

const STATE_FILE = ".claude/skills/code-review/loop-state.json";

module.exports = async function userPromptShip(userMessage) {
  // Detect /ship command
  if (!/\/ship\b/.test(userMessage)) return;

  // Read review state
  let state;
  try {
    const statePath = path.join(process.cwd(), STATE_FILE);
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch (err) {
    // No state file = no review = block by default
    logContext("Ship gate: No review state", {
      blocked: true,
      reason: "No review state found",
      suggestion: "Run /review before shipping",
    });
    return;
  }

  // Check commit staleness
  const currentHead = execSync("git rev-parse HEAD", {
    encoding: "utf8",
  }).trim();
  if (state.head_commit !== currentHead) {
    logContext("Ship gate: Stale review", {
      blocked: true,
      reason: "Review state is for a different commit",
      state_commit: state.head_commit,
      current_commit: currentHead,
      suggestion: "Run /review on current HEAD",
    });
    return;
  }

  // Check ship_allowed flag
  if (!state.ship_allowed) {
    logContext("Ship gate: BLOCKED", {
      blocked: true,
      reason: "Review found issues",
      loop_results: {
        loop_1: state.loop_1_passed,
        loop_2: state.loop_2_passed,
        loop_3: state.loop_3_passed,
        loop_4: state.loop_4_passed,
      },
      blockers: state.blockers || [],
      suggestion: "Fix issues and run /review again",
    });
    return;
  }

  // All checks passed
  logContext("Ship gate: APPROVED", {
    blocked: false,
    reviewed_commit: state.head_commit,
    all_loops_passed: true,
  });
};
```

**Key Points:**

- Read loop-state.json
- Validate state existence
- Check commit staleness
- Check ship_allowed flag
- Log blocking context or approval

---

### 3. Command: review.md (UPDATED)

**Role:** Preview, confirmation, agent delegation

````markdown
# /review - Local Code Review

You are executing the /review command.

## MANDATORY: Preview and Confirmation

Before executing, display:

- Loops to execute: [1, 2, 3, 4] or subset from context
- Scope: files/patterns from context
- Resource requirements: X sub-agents, model tier
- Estimated time: ~Y minutes

Ask: "Proceed with review? (yes/no)"
Wait for explicit confirmation before continuing.

## Execution Pattern

For each loop (1-4):
Task({
subagent_type: "quality-checker",
description: "Loop [N]: [Description]",
prompt: `
Execute Loop [N] of 4-loop progressive validation.

      Files: [from context]
      Focus: [loop-specific criteria]

      Output: Write findings to loop-state.json
    `,
    model: "opus" // or "sonnet" based on loop

});

After all loops complete:

- Read loop-state.json
- Display summary to user
- Show ship_allowed status

## State File Update

Each loop sub-agent updates:

```json
{
  "head_commit": "abc123",
  "loop_N_passed": true/false,
  "ship_allowed": all_passed,
  "blockers": ["issue1", "issue2"]
}
```
````

````

---

### 4. Command: ship.md (UPDATED)

**Role:** Check gate result, delegate to git-agent if approved

```markdown
# /ship - Ship Changes

You are executing the /ship command.

## MANDATORY: Check Ship Gate

The user-prompt-ship.cjs hook has checked review state.

If context shows `blocked: true`:
  - Display: "Ship gate: BLOCKED"
  - Show blocker details from context
  - Suggest: "Run /review to resolve issues"
  - EXIT without git operations

If context shows `blocked: false`:
  - Display: "Ship gate: APPROVED"
  - Proceed to git-agent.md delegation

## Git Operations (if approved)

Delegate to git-agent.md:
  Task({
    subagent_type: "git-agent",
    description: "Execute ship workflow",
    prompt: "Follow git-agent.md to commit, push, create PR",
    model: "sonnet"
  });
````

---

### 5. Agent: git-agent.md (UPDATED)

**Role:** Document ship gate integration

```markdown
# Git Agent

## Ship Workflow

When invoked via /ship:

1. Ship gate has already validated review state (via user-prompt-ship.cjs)
2. If you see blocked=true in context, do not proceed
3. If approved, execute standard git workflow:
   - Commit changes
   - Push to remote
   - Create PR (if needed)

## State File Integration

The ship gate uses `.claude/skills/code-review/loop-state.json`:

- ship_allowed: Gate pass/fail
- head_commit: Review validity check
- blockers: Issue details

This check happens BEFORE git-agent executes.
```

---

## Data Model

### loop-state.json Schema

```typescript
interface LoopState {
  head_commit: string; // Git SHA for review validity
  timestamp: string; // ISO 8601 timestamp
  loop_1_passed: boolean; // Compilation + basic checks
  loop_2_passed: boolean; // Standards compliance
  loop_3_passed: boolean; // Security + performance
  loop_4_passed: boolean; // Integration + e2e
  ship_allowed: boolean; // Overall gate (all loops passed)
  blockers: string[]; // Human-readable issue list
  loop_details: {
    // Detailed results per loop
    [key: string]: {
      passed: boolean;
      issues: Array<{
        severity: "error" | "warning";
        message: string;
        file?: string;
        line?: number;
      }>;
    };
  };
}
```

**Location:** `.claude/skills/code-review/loop-state.json`

---

## Hook Registration

### .claude/settings.json Update

```json
{
  "hooks": {
    "userPrompt": [
      ".claude/scripts/hooks/user-prompt-start.cjs",
      ".claude/scripts/hooks/user-prompt-review.cjs",
      ".claude/scripts/hooks/user-prompt-ship.cjs"
    ]
  }
}
```

**Order matters:** Ship hook must run before ship.md sees user message.

---

## Sequence Diagrams

### Review Flow (Corrected)

```
User          Hook              Command         Sub-Agents       State File
 |             |                 |                |                |
 |--/review--->|                 |                |                |
 |             |--detect-------->|                |                |
 |             |--logContext---->|                |                |
 |             |                 |--preview------>|                |
 |<------------+-----------------|                |                |
 |                               |                |                |
 |--confirm------------------->  |                |                |
 |                               |--Task(Loop1)-->|                |
 |                               |                |--execute------>|
 |                               |                |                |--write-->
 |                               |<--result-------|                |
 |                               |--Task(Loop2)-->|                |
 |                               |                |--execute------>|
 |                               |                |                |--write-->
 |                               |     (repeat for loops 3-4)      |
 |                               |                |                |
 |<--summary---------------------|                |                |
```

### Ship Flow (with Gate)

```
User          Hook              Command         Git Agent        State File
 |             |                 |                |                |
 |--/ship----->|                 |                |                |
 |             |--detect---------|                |                |
 |             |                 |                |<--read---------|
 |             |--validate-------|                |                |
 |             |--logContext---->|                |                |
 |             |                 |                |                |
 |             |  (if blocked)   |                |                |
 |<------------+--error----------|                |                |
 |                               |                |                |
 |             |  (if approved)  |                |                |
 |             |                 |--Task(ship)--->|                |
 |             |                 |                |--commit------->|
 |             |                 |                |--push--------->|
 |<------------+-----------------+<--done---------|                |
```

---

## Error Handling

### Missing State File

- **Behavior:** Block ship, suggest /review
- **Message:** "No review state found. Run /review before shipping."

### Stale State

- **Behavior:** Block ship, show commits, suggest re-review
- **Message:** "Review state is for commit {old}, current HEAD is {new}. Run /review again."

### Failed Loops

- **Behavior:** Block ship, show which loops failed, display blockers
- **Message:** "Loop {N} failed: {blocker details}. Fix issues and re-run /review."

### Corrupted State File

- **Behavior:** Block ship, suggest manual check
- **Message:** "Cannot read review state file. Check .claude/skills/code-review/loop-state.json."

---

## Migration Path

### Phase 1: Hook Refactoring

1. Update user-prompt-review.cjs to context-only pattern
2. Update review.md to handle preview/confirmation
3. Test /review command still works

### Phase 2: Ship Gate Creation

1. Create user-prompt-ship.cjs hook
2. Update settings.json to register hook
3. Test ship blocking works

### Phase 3: Documentation

1. Update ship.md with gate behavior
2. Update git-agent.md with state integration
3. Update code-review/SKILL.md with hook references

### Phase 4: Validation

1. Test full flow: /review → /ship
2. Test edge cases (no state, stale state, failed loops)
3. Verify no direct execution in hooks

---

## Success Criteria

1. **Delegation:** All review execution via Task tool, zero execSync in hooks
2. **Preview:** /review shows plan before execution, waits for confirmation
3. **Gate:** /ship blocks when ship_allowed=false, shows blockers
4. **Staleness:** /ship detects commit mismatch, requires re-review
5. **Patterns:** Hooks follow context-injection pattern consistently

---

## References

- CLAUDE.md: Core delegation rule
- user-prompt-start.cjs: Hook pattern reference
- code-review/SKILL.md: 4-loop system documentation
- loop-state.json: State file schema
