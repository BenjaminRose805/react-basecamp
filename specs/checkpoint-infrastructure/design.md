# Design: Checkpoint Infrastructure

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Command Executors                        │
│     (/start, /design, /implement, /ship, /review, etc.)         │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ uses
             v
┌─────────────────────────────────────────────────────────────────┐
│              checkpoint-manager.cjs (Core Module)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ loadCheckpoint()   saveCheckpoint()   updatePhase()      │   │
│  │ completeCheckpoint()   getResumePoint()                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────┬────────────────────────────────┬────────────────────┬─────┘
      │                                │                    │
      │ validates                      │ uses               │ stores
      v                                v                    v
┌─────────────────┐        ┌─────────────────┐   ┌──────────────────┐
│ token-counter   │        │   utils.cjs     │   │  .claude/state/  │
│     .cjs        │        │   (existing)    │   │    *.json        │
│                 │        │                 │   │                  │
│ countTokens()   │        │ readFile()      │   │ {command}-       │
│ validateContext │        │ writeFile()     │   │ checkpoint.json  │
│    Summary()    │        │ ensureDir()     │   │                  │
└─────────────────┘        └─────────────────┘   └──────────────────┘
      ^                                                    ^
      │ references                                         │ documents
      │                                                    │
┌─────┴───────────────────────────────────────────────────┴─────┐
│              .claude/protocols/ (Documentation)               │
│  ┌──────────────────────┐                                     │
│  │ checkpoint-schema.md │                                     │
│  │                      │                                     │
│  │ UnifiedCheckpoint    │                                     │
│  │ interface            │                                     │
│  └──────────────────────┘                                     │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│    .claude/sub-agents/protocols/handoff.md (Extended)         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Existing: request/response schemas, context guidelines  │  │
│  │ NEW: mode field, previous_summary rename, enforcement   │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         .claude/config/integrations.json (Configuration)         │
│  { "linear": {...}, "vercel": {...} }                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Token Counter Module (`.claude/scripts/lib/token-counter.cjs`)

Validate context summaries stay within 500-token limit.

**Interface:**

```javascript
/**
 * Maximum allowed tokens for context summaries.
 * Adjust this value to find the right balance between
 * context richness and context window budget.
 */
const MAX_SUMMARY_TOKENS = 500;

/**
 * Count tokens in text using word-based approximation
 * @param {string} text - Text to count tokens in
 * @returns {number} Approximate token count
 */
function countTokens(text) {
  // Implementation: text.split(/\s+/).filter(Boolean).length
}

/**
 * Validate context summary token count
 * @param {string} summary - Context summary to validate
 * @param {number} [maxTokens] - Override max tokens (defaults to MAX_SUMMARY_TOKENS)
 * @returns {{valid: boolean, tokenCount: number, limit: number, error?: string}}
 */
function validateContextSummary(summary, maxTokens = MAX_SUMMARY_TOKENS) {
  // Implementation:
  // 1. Call countTokens(summary)
  // 2. Check if count <= maxTokens
  // 3. Return validation result with limit included
  // 4. Error message: "Context summary exceeds {maxTokens} token limit (actual: X tokens)"
}

module.exports = {
  MAX_SUMMARY_TOKENS,
  countTokens,
  validateContextSummary,
};
```

**Implementation Details:**

- Token counting uses simple whitespace splitting for speed/simplicity
- Not GPT-accurate but consistent across codebase
- No external dependencies (no tiktoken)
- Returns descriptive error: "Context summary exceeds 500 token limit (actual: X tokens)"

**Error Handling:**

- Handle null/undefined input gracefully (return 0 for countTokens)
- Handle non-string input (coerce to string)

### 2. Checkpoint Manager Module (`.claude/scripts/lib/checkpoint-manager.cjs`)

Manage command execution state persistence.

**Dependencies:**

```javascript
const {
  readFile,
  writeFile,
  ensureDir,
  getGitRoot,
  getStateDir,
  logError,
} = require("./utils.cjs");
const { validateContextSummary } = require("./token-counter.cjs");
const path = require("path");
const { execSync } = require("child_process");
```

**Interface:**

```javascript
/**
 * Load checkpoint for a command
 * @param {string} command - Command name (start|design|implement|ship|review|reconcile|research)
 * @param {string} [feature] - Optional feature name for feature-specific checkpoints
 * @returns {Object|null} Checkpoint object or null if not found/error
 */
function loadCheckpoint(command, feature = null) {
  // Implementation:
  // 1. Build file path using getStateDir(): {stateDir}/{command}-checkpoint.json or {command}-{feature}.json
  // 2. Check if file exists (fs.existsSync)
  // 3. If not exists: return null silently (expected case)
  // 4. If exists: call readFile(path), parse JSON
  // 5. If JSON.parse fails: logError("Checkpoint file corrupt: {path}"), return null
  // 6. Compare checkpoint.head_commit to current HEAD — warn if different (stale checkpoint)
  // 7. Return parsed checkpoint
}

/**
 * Save checkpoint for a command
 * @param {string} command - Command name
 * @param {Object} checkpoint - Checkpoint data
 * @param {string} [feature] - Optional feature name
 * @returns {boolean} True if saved successfully, false otherwise
 */
function saveCheckpoint(command, checkpoint, feature = null) {
  // Implementation:
  // 1. Validate checkpoint.state.context_summary if present
  // 2. Validate each phase.context_summary if present
  // 3. Capture head_commit via execSync('git rev-parse HEAD')
  // 4. Set checkpoint.head_commit = captured HEAD
  // 5. Ensure state directory exists via ensureDir(getStateDir())
  // 6. Add/update metadata: updated_at timestamp
  // 7. Write JSON with 2-space indentation
  // 8. Return success boolean
}

/**
 * Update a specific phase in checkpoint
 * @param {string} command - Command name
 * @param {string} phaseName - Phase to update
 * @param {Object} phaseData - Phase data (status, context_summary, files, etc.)
 * @param {string} [feature] - Optional feature name
 * @returns {boolean} True if updated successfully, false otherwise
 */
function updatePhase(command, phaseName, phaseData, feature = null) {
  // Implementation:
  // 1. Load existing checkpoint
  // 2. If no checkpoint, create new one with defaults
  // 3. Update phases[phaseName] with phaseData
  // 4. Update state.current_phase if status is in_progress
  // 5. Add phaseName to completed_phases if status is complete
  // 6. Remove from pending_phases if status is complete/failed
  // 7. Add timestamps (started_at if new, updated_at always)
  // 8. Save checkpoint
}

/**
 * Mark checkpoint as complete
 * @param {string} command - Command name
 * @param {string} [feature] - Optional feature name
 * @returns {boolean} True if marked complete, false otherwise
 */
function completeCheckpoint(command, feature = null) {
  // Implementation:
  // 1. Load checkpoint
  // 2. Set state.current_phase = null
  // 3. Clear pending_phases
  // 4. Add completed_at timestamp
  // 5. Save checkpoint
}

/**
 * Get resume point from checkpoint
 * @param {string} command - Command name
 * @param {string} [feature] - Optional feature name
 * @returns {{phase: string|null, summary: string|null}} Resume point info
 */
function getResumePoint(command, feature = null) {
  // Implementation:
  // 1. Load checkpoint
  // 2. Return { phase: state.current_phase, summary: last completed phase's context_summary }
  // 3. Return { phase: null, summary: null } if no checkpoint or complete
}

module.exports = {
  loadCheckpoint,
  saveCheckpoint,
  updatePhase,
  completeCheckpoint,
  getResumePoint,
};
```

**Checkpoint File Structure:**

```json
{
  "command": "implement",
  "feature": "checkpoint-infrastructure",
  "version": 1,
  "head_commit": "d36b6b4a1e2f3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "started_at": "2026-01-29T10:30:00.000Z",
  "updated_at": "2026-01-29T11:45:00.000Z",
  "state": {
    "current_phase": "implementation",
    "completed_phases": ["research", "design"],
    "pending_phases": ["validation", "documentation"],
    "current_task": "T002"
  },
  "phases": {
    "research": {
      "status": "complete",
      "started_at": "2026-01-29T10:30:00.000Z",
      "updated_at": "2026-01-29T10:45:00.000Z",
      "context_summary": "Analyzed existing codebase patterns...",
      "files_created": [],
      "files_modified": []
    },
    "design": {
      "status": "complete",
      "started_at": "2026-01-29T10:45:00.000Z",
      "updated_at": "2026-01-29T11:00:00.000Z",
      "context_summary": "Designed 5-file architecture...",
      "files_created": ["specs/checkpoint-infrastructure/requirements.md"]
    },
    "implementation": {
      "status": "in_progress",
      "started_at": "2026-01-29T11:00:00.000Z",
      "updated_at": "2026-01-29T11:45:00.000Z",
      "context_summary": "Implemented token-counter.cjs, in progress: checkpoint-manager.cjs",
      "files_created": [".claude/scripts/lib/token-counter.cjs"],
      "files_modified": []
    }
  }
}
```

**State Directory:**

- Location: `.claude/state/` (relative to git root)
- Created automatically by `ensureDir()` on first save
- Not tracked in git (verify `.gitignore` includes `.claude/state/`)

**Error Handling Strategy:**

- All functions wrapped in try-catch
- Errors logged via `logError(message, error)` to stderr
- Silent-fail pattern: return null/false/default on error
- No exceptions thrown to caller
- `loadCheckpoint()` distinguishes two null cases:
  - File not found → return null silently (normal first-run case)
  - File exists but corrupt JSON → `logError("Checkpoint file exists but is corrupt: {path}")`, return null
- `loadCheckpoint()` warns on stale checkpoint:
  - If `checkpoint.head_commit !== currentHead` → `logError("Checkpoint is stale (saved at {saved}, current HEAD is {current})")`
  - Still returns the checkpoint (non-blocking warning)
- Example:

```javascript
function loadCheckpoint(command, feature = null) {
  try {
    const filePath = path.join(
      getStateDir(),
      getCheckpointFilename(command, feature)
    );
    if (!fs.existsSync(filePath)) return null; // No checkpoint — expected
    const data = readFile(filePath);
    if (!data) return null;
    let checkpoint;
    try {
      checkpoint = JSON.parse(data);
    } catch (parseError) {
      logError(
        `Checkpoint file exists but is corrupt: ${filePath}`,
        parseError
      );
      return null;
    }
    // Stale detection
    const currentHead = getCurrentHead();
    if (
      currentHead &&
      checkpoint.head_commit &&
      checkpoint.head_commit !== currentHead
    ) {
      logError(
        `Checkpoint is stale (saved at ${checkpoint.head_commit.slice(0, 7)}, current HEAD is ${currentHead.slice(0, 7)})`
      );
    }
    return checkpoint;
  } catch (error) {
    logError(`Failed to load checkpoint`, error);
    return null;
  }
}
```

### 3. Checkpoint Schema Documentation (`.claude/protocols/checkpoint-schema.md`)

Define unified checkpoint schema for all commands.

**Structure:**

````markdown
# Checkpoint Schema

## Overview

Unified checkpoint schema (v1) for all 7 commands.

## TypeScript Interface

```typescript
interface UnifiedCheckpoint {
  command:
    | "start"
    | "design"
    | "reconcile"
    | "research"
    | "implement"
    | "ship"
    | "review";
  feature?: string | null;
  version: 1;
  head_commit?: string | null; // git rev-parse HEAD at last save
  started_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  completed_at?: string; // ISO 8601
  state: {
    current_phase: string | null;
    completed_phases: string[];
    pending_phases: string[];
    current_task?: string; // Task ID like "T002"
  };
  phases: {
    [phaseName: string]: {
      status: "pending" | "in_progress" | "complete" | "failed" | "skipped";
      started_at?: string;
      updated_at?: string;
      context_summary?: string; // ≤500 tokens
      files_created?: string[];
      files_modified?: string[];
      error?: string;
    };
  };
  gate?: {
    // Optional, used by /ship
    ship_allowed: boolean;
    blockers: string[];
    head_commit?: string;
  };
}
```
````

## Command-Specific Variations Table

| Command   | Typical Phases             | Uses gate? | Notes                          |
| --------- | -------------------------- | ---------- | ------------------------------ |
| start     | branch, issue-creation     | No         | Simple 2-phase workflow        |
| design    | research, planning, specs  | No         | 3-phase: research→plan→write   |
| reconcile | analysis, reconciliation   | No         | Compare plan vs implementation |
| research  | discovery, synthesis       | No         | 2-phase research workflow      |
| implement | implementation, validation | No         | Code generation + tests        |
| ship      | pre-flight, commit, push   | Yes        | Uses gate to block if errors   |
| review    | analysis, feedback         | No         | Review existing code           |

## Enforcement Rules

- context_summary validated on save (≤500 tokens)
- Timestamps in ISO 8601 format
- Schema version must be 1

### 4. Handoff Protocol Extension (`.claude/sub-agents/protocols/handoff.md`)

Extend existing handoff protocol with `mode` field, `previous_summary` naming, and token enforcement.

**Key Design Decision:**

- EXTEND existing file — no new file created
- Additive changes only — existing anchors remain valid
- Three edits to existing content, one new section appended

### Edit 1: Add `mode` to Request Schema (line ~21)

Add to JSON block:

```json
"mode": "plan | code | ui | docs | eval | reconcile | research (required)"
```

Add row to Request Fields table:

```text
| `mode` | enum | Yes | Sub-agent specialization (plan/code/ui/docs/eval/reconcile/research) |
```

Mode values:

- `plan`: Research/design/documentation tasks
- `code`: Implementation tasks (lib, scripts, logic)
- `ui`: UI component implementation
- `docs`: Documentation writing
- `eval`: Testing/validation tasks
- `reconcile`: Compare plan vs implementation
- `research`: Investigation and discovery

### Edit 2: Rename `previous_findings` → `previous_summary` (line ~27, ~44)

In Request Schema JSON block:

```json
// Before:
"previous_findings": "string | null - Summary from previous phase"
// After:
"previous_summary": "string | null - Summary from previous phase (≤500 tokens)"
```

In Request Fields table:

```text
// Before:
| `context.previous_findings` | string | No | Summary from previous phase |
// After:
| `context.previous_summary`  | string | No | Summary from previous phase (≤500 tokens, validated) |
```

### Edit 3: Append "Enforcement" section (after Context Summary Guidelines)

````markdown
## Enforcement

The 500-token context_summary limit is enforced programmatically by orchestrators:

- **Validator:** `.claude/scripts/lib/token-counter.cjs`
- **Functions:** `countTokens(text)`, `validateContextSummary(summary)`
- **Heuristic:** Whitespace-delimited word count approximation (`countTokens` splits on `/\s+/` and filters empty strings; ~4 characters per token is a separate writer guideline, not the algorithm)
- **Behavior:** Orchestrators must call `validateContextSummary()` before
  passing context between phases. Summaries exceeding 500 tokens are rejected.

### On Handoff Creation

```javascript
const { validateContextSummary } = require("../scripts/lib/token-counter.cjs");

if (handoffData.context.previous_summary) {
  const result = validateContextSummary(handoffData.context.previous_summary);
  if (!result.valid) {
    logError(result.error); // "Context summary exceeds 500 token limit (actual: X tokens)"
  }
}
```
````

### On Response Processing

- Sub-agent responses with `context_summary` field are validated
- Responses >500 tokens logged as warnings
- Orchestrator decides whether to truncate or reject

### 5. Integration Configuration (`.claude/config/integrations.json`)

Configure Linear and Vercel integrations.

**File Content:**

```json
{
  "linear": {
    "enabled": true,
    "team": "Basecamp",
    "branch_prefix": "feature",
    "use_native_automation": true
  },
  "vercel": {
    "enabled": true,
    "wait_for_preview": true,
    "preview_timeout_ms": 300000,
    "require_preview_success": false
  }
}
```

**Field Descriptions:**

- `linear.enabled`: Enable Linear integration (issue creation, status updates)
- `linear.team`: Linear team name for issue assignment
- `linear.branch_prefix`: Git branch prefix for Linear issues (e.g., "feature/BAS-6")
- `linear.use_native_automation`: Use GitHub native automation instead of PAT-based client
- `vercel.enabled`: Enable Vercel preview deployments
- `vercel.wait_for_preview`: Block /ship until preview deployment completes
- `vercel.preview_timeout_ms`: Max wait time for preview (5 minutes)
- `vercel.require_preview_success`: Fail /ship if preview deployment fails

**Usage:**

```javascript
const integrations = require("./.claude/config/integrations.json");

if (integrations.linear.enabled) {
  // Use native GitHub automation (no linear-client.cjs needed)
  console.log("Linear integration enabled via native GitHub automation");
}
```

## Testing Strategy

### Token Counter Tests (`.claude/scripts/lib/token-counter.test.cjs`)

```javascript
const test = require("node:test");
const assert = require("node:assert");
const { countTokens, validateContextSummary } = require("./token-counter.cjs");

test("countTokens returns word count", () => {
  assert.strictEqual(countTokens("hello world"), 2);
  assert.strictEqual(countTokens("  multiple   spaces  "), 2);
});

test("validateContextSummary passes for ≤500 tokens", () => {
  const summary = "short summary";
  const result = validateContextSummary(summary);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.tokenCount, 2);
});

test("validateContextSummary fails for >500 tokens", () => {
  const summary = Array(501).fill("word").join(" ");
  const result = validateContextSummary(summary);
  assert.strictEqual(result.valid, false);
  assert.match(result.error, /exceeds 500 token limit/);
});
```

### Checkpoint Manager Tests (`.claude/scripts/lib/checkpoint-manager.test.cjs`)

```javascript
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const {
  loadCheckpoint,
  saveCheckpoint,
  updatePhase,
} = require("./checkpoint-manager.cjs");

test("saveCheckpoint creates file in .claude/state/", async () => {
  const tmpDir = fs.mkdtempSync("/tmp/checkpoint-test-");
  process.env.GIT_ROOT = tmpDir; // Mock git root

  const checkpoint = {
    command: "design",
    feature: "test-feature",
    version: 1,
    state: { current_phase: null, completed_phases: [], pending_phases: [] },
    phases: {},
  };

  const success = saveCheckpoint("design", checkpoint, "test-feature");
  assert.strictEqual(success, true);

  const filePath = path.join(tmpDir, ".claude/state/design-test-feature.json");
  assert.strictEqual(fs.existsSync(filePath), true);

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true });
});

test("updatePhase adds timestamps", async () => {
  // Similar setup with temp dir
  // Test that started_at and updated_at are added
});

test("validateContextSummary on save rejects >500 tokens", async () => {
  // Test that saveCheckpoint returns false if context_summary is too long
});
```

**Test Execution:**

```bash
node --test .claude/scripts/lib/token-counter.test.cjs
node --test .claude/scripts/lib/checkpoint-manager.test.cjs
```

## Dependencies

### Internal Dependencies

- `utils.cjs`: Provides readFile, writeFile, ensureDir, getGitRoot, getStateDir, logError
- `token-counter.cjs`: Used by checkpoint-manager for validation

### Refactors (Change #14)

- Extract `getStateDir()` from `user-prompt-ship.cjs` (lines 23-26) into `utils.cjs`
- Update `user-prompt-ship.cjs` to import `getStateDir` from `utils.cjs` instead of defining locally
- `checkpoint-manager.cjs` imports `getStateDir` from `utils.cjs`
- Function: `function getStateDir() { return path.join(getGitRoot() || process.cwd(), '.claude', 'state'); }`

### External Dependencies

- Node.js built-in: `fs`, `path`, `node:test`, `node:assert`
- No npm packages required

## Migration Considerations

### Existing State Files

- Currently no standardized checkpoint storage
- New `.claude/state/` directory will be created on first use
- No migration needed (fresh start)

### .gitignore Updates

- Verify `.claude/state/` is in `.gitignore`
- Checkpoint files should not be committed to git

## Future Enhancements

1. **Binary Token Counting:** Replace word-based approximation with tiktoken for GPT-accurate counts
2. **Checkpoint Compression:** Archive old checkpoints after command completion
3. **Checkpoint Diffing:** Show what changed between checkpoint saves
4. **Recovery Mode:** Auto-resume from last checkpoint on command restart
5. **Checkpoint Webhooks:** Notify external systems (Linear, Slack) on phase completion
