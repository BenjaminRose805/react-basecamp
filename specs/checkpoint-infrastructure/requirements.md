# Requirements: Checkpoint Infrastructure

## Overview

Implement checkpoint/state management infrastructure for all 7 commands to enable resumability, context handoffs, and integration tracking.

## Functional Requirements

### R1: Token Counter Module

**EARS:** The system shall provide a token counting module that validates context summaries do not exceed 500 tokens.

**Acceptance Criteria:**

- Module exports `countTokens(text)` function returning integer token count
- Module exports `validateContextSummary(summary, maxTokens?)` function returning `{valid: boolean, tokenCount: number, limit: number, error?: string}`
- Token counting uses approximation: `text.split(/\s+/).filter(Boolean).length` for simplicity
- Validation rejects summaries >500 tokens with descriptive error message
- Module follows CJS pattern with JSDoc annotations

### R2: Checkpoint Manager Module

**EARS:** The system shall provide a checkpoint manager that persists command execution state to `.claude/state/` directory.

**Acceptance Criteria:**

- Module exports 5 functions: `loadCheckpoint`, `saveCheckpoint`, `updatePhase`, `completeCheckpoint`, `getResumePoint`
- All 5 functions accept an optional `feature` parameter to select the checkpoint file:
  - With feature: `.claude/state/{command}-{feature}.json`
  - Without feature: `.claude/state/{command}-checkpoint.json`
- File paths resolved via `getStateDir()` from `utils.cjs` (returns `.claude/state/` relative to git root)
- Uses `utils.cjs` helpers: `readFile`, `writeFile`, `ensureDir`, `getStateDir`, `logError`
- All functions follow silent-fail pattern (return null/default on error)
- Checkpoint schema includes: command, feature, version:1, head_commit, state (current_phase, completed_phases, pending_phases), phases map
- `head_commit` captured via `git rev-parse HEAD` on every save
- `loadCheckpoint()` warns (via `logError`) if stored `head_commit` differs from current HEAD (stale detection)
- ISO 8601 timestamps for `started_at`, `updated_at`
- Uses shared `getStateDir()` from `utils.cjs` for state directory path

### R3: Unified Checkpoint Schema Documentation

**EARS:** The system shall provide documentation defining the unified checkpoint schema for all 7 commands.

**Acceptance Criteria:**

- Document located at `.claude/protocols/checkpoint-schema.md`
- Defines TypeScript interface `UnifiedCheckpoint` with complete type definitions
- Documents `command` enum: start|design|reconcile|research|implement|ship|review
- Documents `phases` map structure with status enum: pending|in_progress|complete|failed|skipped
- Documents phase properties: status, started_at, updated_at, context_summary (≤500 tokens), files_created, files_modified, error
- Documents optional `gate` object for `/ship` command: ship_allowed, blockers[], head_commit
- Includes command-specific variations table showing which fields each command uses

### R4: Sub-Agent Handoff Schema Enhancement

**EARS:** The system shall extend the existing handoff protocol with `mode` field, `previous_summary` naming, and token validation enforcement.

**Acceptance Criteria:**

- Extends existing `.claude/sub-agents/protocols/handoff.md` (no new file)
- Adds `mode` field to request schema: `plan|code|ui|docs|eval|reconcile|research`
- Renames `previous_findings` to `previous_summary` in request schema and field table
- Adds "Enforcement" section documenting programmatic 500-token validation via `token-counter.cjs`
- Existing anchor links (`#context-summary-guidelines`) remain valid
- No duplication of existing content — additive changes only

### R5: Integration Configuration File

**EARS:** When integration features are enabled, the system shall load configuration from `.claude/config/integrations.json`.

**Acceptance Criteria:**

- File located at `.claude/config/integrations.json`
- Contains `linear` object: `enabled: true`, `team: "Basecamp"`, `branch_prefix: "feature"`, `use_native_automation: true`
- Contains `vercel` object: `enabled: true`, `wait_for_preview: true`, `preview_timeout_ms: 300000`, `require_preview_success: false`
- Valid JSON syntax with 2-space indentation
- No `linear_client` or PAT-based configuration (uses native GitHub automation)

### R6: Token Validation Enforcement

**EARS:** While processing sub-agent handoffs, the system shall enforce the 500-token limit on context summaries.

**Acceptance Criteria:**

- All checkpoint save operations validate `context_summary` using token counter
- Handoff protocol validation rejects payloads with >500 token summaries
- Validation errors provide clear messages: "Context summary exceeds 500 token limit (actual: X tokens)"
- Token counting performed before file writes

### R7: State Directory Standardization

**EARS:** The system shall standardize all command state storage to `.claude/state/` directory.

**Acceptance Criteria:**

- Directory `.claude/state/` created if not exists
- Checkpoint files follow naming pattern: `{command}-checkpoint.json` or `{command}-{feature}.json`
- Directory not tracked in git (added to `.gitignore` if needed)
- No state files stored outside `.claude/state/`

## Non-Functional Requirements

### NFR1: Error Handling

**EARS:** When errors occur during checkpoint operations, the system shall log errors and continue execution.

**Acceptance Criteria:**

- All checkpoint operations use try-catch blocks
- Errors logged via `logError` from `utils.cjs`
- Functions return null/default values on error (silent-fail pattern)
- No thrown exceptions propagate to caller
- `loadCheckpoint()` distinguishes "file not found" (silent null) from "corrupt JSON" (warn + null)

### NFR2: Testing Coverage

**EARS:** The system shall provide automated tests for checkpoint manager and token counter modules.

**Acceptance Criteria:**

- Tests use `node:test` and `node:assert` (Node.js built-in test runner)
- Tests cover: save/load/update operations, token counting accuracy, validation rules
- Tests use temporary directories for file operations
- Tests cleanup temp files after execution

### NFR3: Code Quality

**EARS:** The system shall follow established codebase patterns for JavaScript modules.

**Acceptance Criteria:**

- CJS module pattern: `const x = require(...)` + `module.exports = { ... }`
- JSDoc annotations for all exported functions with `@param` and `@returns`
- Consistent error handling patterns matching `utils.cjs`
- No TypeScript (runtime code is CJS)
