# Tasks: Checkpoint Infrastructure

## Overview

Implementation plan for checkpoint infrastructure across 4 phases with 7 tasks.

**Critical Path:** T000 → T001 → T002 → T006

**Files:** 4 new files + 3 modified files (utils.cjs, user-prompt-ship.cjs, handoff.md — no new handoff-schema.md, extend existing handoff.md instead)

## Phase 0: Refactor (Prerequisite)

### [ ] T000: Extract getStateDir() to utils.cjs

**Description:** Move `getStateDir()` from `user-prompt-ship.cjs` (local function) into shared `utils.cjs`. Update ship hook to import from utils.

**Dependencies:** None (independent)

**Files:**

- Modify: `.claude/scripts/lib/utils.cjs` (add getStateDir export)
- Modify: `.claude/scripts/hooks/user-prompt-ship.cjs` (replace local function with import)

**Success Criteria:**

- [x] `getStateDir()` exported from `utils.cjs`
- [x] `user-prompt-ship.cjs` imports `getStateDir` from `../lib/utils.cjs`
- [x] Local `getStateDir()` definition removed from `user-prompt-ship.cjs`
- [x] Ship hook still works (no behavior change)

**\_Prompt:**

```text
You are a code-writer sub-agent (mode=code).

TASK: Extract getStateDir() from user-prompt-ship.cjs into shared utils.cjs.

CONTEXT:
- Source: .claude/scripts/hooks/user-prompt-ship.cjs lines 23-26 define getStateDir() locally
- Target: .claude/scripts/lib/utils.cjs (shared utility library)
- Function: getStateDir() returns path.join(getGitRoot() || process.cwd(), '.claude', 'state')

REQUIREMENTS:
1. Add getStateDir() to utils.cjs:
   - Add function with JSDoc annotation
   - Add to module.exports object
   - Uses existing getGitRoot() from same file

2. Update user-prompt-ship.cjs:
   - Add getStateDir to the require('../lib/utils.cjs') destructure
   - Remove local getStateDir() function definition (lines 23-26)
   - No other changes

RESTRICTIONS:
- Zero behavior change — function body stays identical
- No new dependencies
- Keep existing import order

SUCCESS CRITERIA:
- getStateDir exported from utils.cjs
- Ship hook imports it instead of defining locally
- Ship hook behavior unchanged
```

---

## Phase 1: Foundation (Independent Tasks)

### [ ] T001: Implement Token Counter Module

**Description:** Create `.claude/scripts/lib/token-counter.cjs` with token counting and validation functions.

**Dependencies:** None (independent)

**Files:**

- Create: `.claude/scripts/lib/token-counter.cjs`
- Create: `.claude/scripts/lib/token-counter.test.cjs`

**Success Criteria:**

- [x] Module exports `countTokens(text)` returning integer
- [x] Module exports `validateContextSummary(summary, maxTokens?)` returning `{valid, tokenCount, limit, error?}`
- [x] Token counting uses `text.split(/\s+/).filter(Boolean).length`
- [x] Validation rejects >500 tokens with error message
- [x] All tests pass (`node --test token-counter.test.cjs`)
- [x] JSDoc annotations on all exports

**\_Prompt:**

```text
You are a code-writer sub-agent (mode=code).

TASK: Implement token-counter.cjs module for validating context summaries.

CONTEXT:
- Location: .claude/scripts/lib/token-counter.cjs
- Pattern: CJS module with JSDoc annotations
- No external dependencies (use built-in String methods)

REQUIREMENTS:
1. Export countTokens(text) function:
   - Split on whitespace using /\s+/ regex
   - Filter out empty strings
   - Return count as integer
   - Handle null/undefined (return 0)

2. Export validateContextSummary(summary) function:
   - Call countTokens(summary)
   - Check if count <= 500
   - Return {valid: boolean, tokenCount: number, limit: number, error?: string}
   - Error message: "Context summary exceeds 500 token limit (actual: X tokens)"

3. Create tests in token-counter.test.cjs:
   - Use node:test and node:assert
   - Test: countTokens with various inputs
   - Test: validateContextSummary pass/fail cases
   - Test: edge cases (empty, null, very long strings)

RESTRICTIONS:
- Use CJS module pattern (module.exports)
- No TypeScript
- No external dependencies (no tiktoken)
- Follow silent-fail pattern for errors

SUCCESS CRITERIA:
- Module exports 2 functions
- All tests pass
- JSDoc annotations complete
- Matches design.md interface exactly
```

---

## Phase 2: Core Module (Depends on T001)

### [ ] T002: Implement Checkpoint Manager Module

**Description:** Create `.claude/scripts/lib/checkpoint-manager.cjs` with 5 checkpoint management functions.

**Dependencies:** T000 (getStateDir in utils.cjs), T001 (token-counter.cjs)

**Files:**

- Create: `.claude/scripts/lib/checkpoint-manager.cjs`
- Create: `.claude/scripts/lib/checkpoint-manager.test.cjs`
- Create: `.claude/state/` directory (automatically)

**Success Criteria:**

- [x] Module exports 5 functions: loadCheckpoint, saveCheckpoint, updatePhase, completeCheckpoint, getResumePoint
- [x] Uses utils.cjs helpers: readFile, writeFile, ensureDir, getStateDir, logError
- [x] Validates context_summary using token-counter.cjs
- [x] Checkpoint files stored in `.claude/state/{command}-checkpoint.json` or `.claude/state/{command}-{feature}.json`
- [x] `saveCheckpoint()` captures `head_commit` via `git rev-parse HEAD`
- [x] `loadCheckpoint()` warns on stale checkpoint (head_commit mismatch)
- [x] `loadCheckpoint()` distinguishes file-not-found (silent null) from corrupt JSON (warn + null)
- [x] All functions follow silent-fail pattern (return null/false on error)
- [x] ISO 8601 timestamps for started_at, updated_at
- [x] All tests pass
- [x] JSDoc annotations complete

**\_Prompt:**

```text
You are a code-writer sub-agent (mode=code).

TASK: Implement checkpoint-manager.cjs module for command state persistence.

CONTEXT:
- Location: .claude/scripts/lib/checkpoint-manager.cjs
- Dependencies: ./utils.cjs (incl. getStateDir), ./token-counter.cjs
- Pattern: CJS module with silent-fail error handling
- Previous summary: "Token counter module completed. getStateDir() extracted to utils.cjs. All tests passing."

REQUIREMENTS:
1. Implement 5 functions per design.md interface:
   - loadCheckpoint(command, feature=null)
   - saveCheckpoint(command, checkpoint, feature=null)
   - updatePhase(command, phaseName, phaseData, feature=null)
   - completeCheckpoint(command, feature=null)
   - getResumePoint(command, feature=null)

2. File path logic:
   - Use getStateDir() from utils.cjs for base path
   - With feature: {stateDir}/{command}-{feature}.json
   - Without feature: {stateDir}/{command}-checkpoint.json

3. head_commit tracking:
   - saveCheckpoint() captures HEAD via execSync('git rev-parse HEAD')
   - Sets checkpoint.head_commit on every save
   - loadCheckpoint() compares stored head_commit to current HEAD
   - If mismatch: logError warning (non-blocking)

4. loadCheckpoint() error distinction:
   - File not found → return null silently
   - File exists but JSON corrupt → logError("Checkpoint file exists but is corrupt: {path}"), return null
   - Use fs.existsSync before attempting parse

5. Validation on save:
   - Validate each phases[*].context_summary if present
   - Use validateContextSummary() from token-counter.cjs
   - Reject save if any summary >500 tokens

6. Error handling:
   - Wrap all functions in try-catch
   - Use logError(message, error) from utils.cjs
   - Return null/false on error (silent-fail)

7. Create comprehensive tests:
   - Use node:test and node:assert
   - Use temp directories (fs.mkdtempSync)
   - Test all 5 functions
   - Test stale checkpoint warning (mock different HEAD)
   - Test corrupt JSON warning
   - Test validation rejection
   - Cleanup temp files after tests

RESTRICTIONS:
- CJS module pattern only
- No TypeScript
- Must use utils.cjs helpers (getStateDir, readFile, writeFile, ensureDir, logError)
- Silent-fail pattern mandatory

SUCCESS CRITERIA:
- All 5 functions implemented per interface
- head_commit captured on save, compared on load
- Corrupt JSON warns instead of silent null
- Token validation working
- All tests pass
- Matches design.md exactly
```

---

## Phase 3: Documentation (Independent Tasks)

### [ ] T003: Create Checkpoint Schema Documentation

**Description:** Document unified checkpoint schema in `.claude/protocols/checkpoint-schema.md`.

**Dependencies:** None (independent)

**Files:**

- Create: `.claude/protocols/checkpoint-schema.md`

**Success Criteria:**

- [x] TypeScript interface `UnifiedCheckpoint` defined
- [x] Documents all 7 command values
- [x] Documents phase status enum (5 values)
- [x] Documents optional `gate` object for /ship
- [x] Includes command-specific variations table
- [x] Documents enforcement rules (token validation, timestamps, version)
- [x] Matches design.md structure

**\_Prompt:**

```text
You are a docs-writer sub-agent (mode=docs).

TASK: Create checkpoint schema documentation.

CONTEXT:
- Location: .claude/protocols/checkpoint-schema.md
- Audience: Command developers, sub-agent orchestrators
- Purpose: Define unified checkpoint format for all 7 commands

REQUIREMENTS:
1. Document TypeScript interface UnifiedCheckpoint:
   - command: enum of 7 values
   - feature?: string | null (optional, omitted when no feature specified)
   - version: 1
   - timestamps: started_at, updated_at, completed_at?
   - state object: current_phase, completed_phases, pending_phases, current_task?
   - phases map: status, timestamps, context_summary, files, error
   - gate object (optional): ship_allowed, blockers, head_commit

2. Create command-specific variations table:
   - Columns: Command, Typical Phases, Uses gate?, Notes
   - Rows: start, design, reconcile, research, implement, ship, review

3. Document enforcement rules:
   - context_summary validated ≤500 tokens
   - Timestamps in ISO 8601
   - Schema version must be 1

4. Include complete example checkpoint JSON

RESTRICTIONS:
- Markdown format only
- Use TypeScript syntax for interface (code blocks)
- No implementation code

SUCCESS CRITERIA:
- Complete interface definition
- All 7 commands documented
- Variations table complete
- Matches design.md exactly
```

### [ ] T004: Extend Handoff Protocol with Mode and Enforcement

**Description:** Extend existing `.claude/sub-agents/protocols/handoff.md` with `mode` field, `previous_summary` rename, and token enforcement section.

**Dependencies:** None (independent)

**Files:**

- Modify: `.claude/sub-agents/protocols/handoff.md` (3 edits + 1 new section)

**Success Criteria:**

- [x] `mode` field added to Request Schema JSON block and Request Fields table
- [x] `previous_findings` renamed to `previous_summary` in schema and table
- [x] "Enforcement" section appended after Context Summary Guidelines
- [x] Existing anchor `#context-summary-guidelines` remains valid
- [x] No content duplicated — additive changes only
- [x] Matches design.md structure

**\_Prompt:**

```text
You are a docs-writer sub-agent (mode=docs).

TASK: Extend existing handoff protocol with mode field, naming update, and enforcement section.

CONTEXT:
- File: .claude/sub-agents/protocols/handoff.md (412 lines, existing)
- This is NOT a new file — modify the existing one
- 3 sub-agent templates link to #context-summary-guidelines anchor (must remain valid)

REQUIREMENTS:
1. Edit 1 — Add mode to Request Schema (~line 21 JSON block, ~line 39 table):
   JSON: "mode": "plan | code | ui | docs | eval | reconcile | research (required)"
   Table row: | `mode` | enum | Yes | Sub-agent specialization |

2. Edit 2 — Rename previous_findings to previous_summary (~line 27, ~line 44):
   JSON: "previous_summary": "string | null - Summary from previous phase (≤500 tokens)"
   Table: | `context.previous_summary` | string | No | Summary from previous phase (≤500 tokens, validated) |

3. Edit 3 — Append Enforcement section after Context Summary Guidelines (after ~line 331):
   Add ## Enforcement section with:
   - Validator: .claude/scripts/lib/token-counter.cjs
   - Functions: countTokens(text), validateContextSummary(summary)
   - Heuristic: ~4 chars/token
   - Code example showing validation on handoff creation
   - Note on response processing validation
   (~15 lines total)

RESTRICTIONS:
- Modify existing file only — do NOT create new file
- Additive changes — do not remove or restructure existing content
- Preserve all existing anchors (especially #context-summary-guidelines)
- Keep existing formatting style

SUCCESS CRITERIA:
- mode field in request schema and table
- previous_findings renamed to previous_summary
- Enforcement section appended
- Existing links from quality-validator.md, domain-researcher.md, domain-writer.md still work
```

### [ ] T005: Create Integration Configuration

**Description:** Create `.claude/config/integrations.json` with Linear and Vercel settings.

**Dependencies:** None (independent)

**Files:**

- Create: `.claude/config/integrations.json`

**Success Criteria:**

- [x] Valid JSON syntax
- [x] Contains `linear` object with 4 fields
- [x] Contains `vercel` object with 4 fields
- [x] Uses 2-space indentation
- [x] No `linear_client` or PAT-based config
- [x] Matches design.md exact structure

**\_Prompt:**

```text
You are a config-writer sub-agent (mode=code).

TASK: Create integrations configuration file.

CONTEXT:
- Location: .claude/config/integrations.json
- Existing: .claude/config/ directory exists (has environment.json, review-config.yaml)
- Purpose: Configure Linear and Vercel integrations

REQUIREMENTS:
1. Create JSON file with exact structure:
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

2. Format:
   - Valid JSON syntax
   - 2-space indentation
   - No comments (JSON doesn't support comments)

RESTRICTIONS:
- JSON only (no JavaScript)
- No linear_client configuration (using native GitHub automation)
- No PAT or token fields

SUCCESS CRITERIA:
- Valid JSON
- Matches design.md exactly
- All fields present with correct types
```

---

## Phase 4: Validation (Depends on T001, T002, T005)

### [ ] T006: End-to-End Validation

**Description:** Validate all components work together and meet requirements.

**Dependencies:** T001 (token-counter), T002 (checkpoint-manager), T005 (integrations.json)

**Files:**

- Read: All 5 created files
- Verify: `.claude/state/` directory creation
- Verify: `.gitignore` includes `.claude/state/`

**Success Criteria:**

- [x] All unit tests pass (`node --test .claude/scripts/lib/*.test.cjs`)
- [x] Token validation works end-to-end (create checkpoint with >500 token summary, verify rejection)
- [x] Integration config loads successfully (`require('./.claude/config/integrations.json')`)
- [x] Checkpoint manager creates `.claude/state/` directory on first save
- [x] All JSDoc annotations complete and accurate
- [x] Code follows codebase patterns (CJS, silent-fail, utils.cjs usage)
- [x] No TypeScript errors in documentation code examples

**\_Prompt:**

```text
You are a validation sub-agent (mode=eval).

TASK: Perform end-to-end validation of checkpoint infrastructure.

CONTEXT:
- Previous summary: "All 5 files created. Token counter and checkpoint manager implemented with tests. Documentation complete. Integration config added."

REQUIREMENTS:
1. Run all tests:
   - node --test .claude/scripts/lib/token-counter.test.cjs
   - node --test .claude/scripts/lib/checkpoint-manager.test.cjs
   - Verify all tests pass

2. Manual validation scenarios:
   - Create checkpoint with valid context_summary
   - Create checkpoint with >500 token summary (should fail)
   - Load checkpoint (should succeed)
   - Update phase (should add timestamps)
   - Complete checkpoint (should clear current_phase)

3. Configuration validation:
   - Load integrations.json: require('./.claude/config/integrations.json')
   - Verify all expected fields present
   - Verify linear.use_native_automation is true

4. File system validation:
   - Verify .claude/state/ directory created
   - Verify checkpoint files have correct naming pattern
   - Check .gitignore includes .claude/state/

5. Code quality checks:
   - All functions have JSDoc annotations
   - Error handling uses try-catch + logError
   - No direct fs.readFileSync (must use utils.cjs)

RESTRICTIONS:
- Read-only validation (don't modify files)
- Report all issues found

SUCCESS CRITERIA:
- All tests pass
- End-to-end scenarios work
- No code quality issues
- Complete validation report generated
```

---

## Task Summary

| Phase         | Task | Description                        | Dependencies   | Files Changed |
| ------------- | ---- | ---------------------------------- | -------------- | ------------- |
| Refactor      | T000 | Extract getStateDir() to utils.cjs | None           | 2 modified    |
| Foundation    | T001 | Token Counter Module               | None           | 2 created     |
| Core          | T002 | Checkpoint Manager Module          | T000, T001     | 2 created     |
| Documentation | T003 | Checkpoint Schema Docs             | None           | 1 created     |
| Documentation | T004 | Extend Handoff Protocol            | None           | 1 modified    |
| Documentation | T005 | Integration Config                 | None           | 1 created     |
| Validation    | T006 | End-to-End Validation              | T001,T002,T005 | 0 (read-only) |

**Files Summary:** 4 new files created, 3 existing files modified

**Parallel Execution:**

- Immediate: T000, T001, T003, T004, T005 can run in parallel (5 tasks)
- Phase 2: T002 waits for T000 + T001
- Phase 4: T006 waits for T001, T002, T005

**Critical Path:** T000 + T001 (parallel) → T002 → T006

---

## Execution Notes

### For Sub-Agent Orchestrator:

1. Start T000, T001, T003, T004, T005 in parallel (5 tasks)
2. When T000 + T001 both complete, start T002
3. When T001, T002, T005 all complete, start T006
4. T003 and T004 can complete asynchronously (don't block critical path)

### For Human Developer:

1. Review each task's \_Prompt field for exact instructions
2. Copy-paste \_Prompt to sub-agent when ready to execute
3. Verify success criteria before marking task complete
4. Run validation (T006) before considering feature complete

### Testing Commands:

```bash
# Run all tests
node --test .claude/scripts/lib/token-counter.test.cjs
node --test .claude/scripts/lib/checkpoint-manager.test.cjs

# Manual checkpoint test
node -e "
const { saveCheckpoint } = require('./.claude/scripts/lib/checkpoint-manager.cjs');
const cp = {
  command: 'test',
  feature: 'manual',
  version: 1,
  state: { current_phase: null, completed_phases: [], pending_phases: [] },
  phases: {}
};
console.log('Save result:', saveCheckpoint('test', cp, 'manual'));
"

# Verify integrations.json
node -e "console.log(require('./.claude/config/integrations.json'));"
```
