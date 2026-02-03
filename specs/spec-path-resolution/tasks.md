# Tasks: Spec Path Resolution

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** spec-path-resolution

## Progress

**Total:** 16/16 tasks complete

**Critical Path:** T001 -> T002 -> T003 -> T006 -> T009 -> T016

**Files:** 1 new module + 1 test file + 10 modified files

---

## Phase 1: Core Resolver

### T001: Create spec-resolver.cjs module scaffold [REQ-1.1, NFR-1]

Create the basic module structure for `.claude/scripts/lib/spec-resolver.cjs` with CommonJS exports, required dependencies, and constant definitions. Establish the module interface with three exported functions (stubbed implementations).

**File:** `.claude/scripts/lib/spec-resolver.cjs`

**Changes:**

- Create new file with CommonJS format (`.cjs` extension)
- Add `require()` statements for `fs` and `path` modules
- Define constants: `RESERVED_NAMES`, `MAX_SEGMENT_LENGTH`, `MAX_PATH_LENGTH`, `MARKER_FILES`
- Export three functions: `resolveSpecPath`, `validateAndNormalizeName`, `detectDirectoryType`
- Add JSDoc comments for each function signature
- Stub function implementations (return null or throw "Not implemented")

**\_Prompt:**
**Role:** Backend Developer | **Task:** Create `.claude/scripts/lib/spec-resolver.cjs` as a CommonJS module. Add `const fs = require('fs')` and `const path = require('path')` at the top. Define constants: `RESERVED_NAMES = ['node_modules', 'dist', 'build']`, `MAX_SEGMENT_LENGTH = 50`, `MAX_PATH_LENGTH = 200`, `MARKER_FILES = { project: 'project.md', feature: 'feature.md', spec: ['requirements.md', 'design.md', 'tasks.md', 'spec.json'] }`. Export stub functions via `module.exports = { resolveSpecPath, validateAndNormalizeName, detectDirectoryType }`. Add JSDoc for each: `resolveSpecPath(name, levelHint)` returns `{ path: string, type: string, name: string }`, `validateAndNormalizeName(name)` returns `string`, `detectDirectoryType(path)` returns `'project'|'feature'|'spec'`. Stub implementations: throw `new Error('Not implemented')`. | **Restrictions:** No implementation logic yet. CommonJS only (no ES6 imports). Follow pattern from `checkpoint-manager.cjs`. | **Success:** Module exists with correct exports, constants, and JSDoc. All functions throw "Not implemented".

---

### T002: Implement validateAndNormalizeName() [REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5]

Implement the full validation and normalization pipeline for spec names: character check, normalization (collapse hyphens, trim), reserved name rejection, and length validation. Follow the pattern from `sanitizeFilenameSegment()` in `checkpoint-manager.cjs`.

**File:** `.claude/scripts/lib/spec-resolver.cjs`

**Changes:**

- Replace stub implementation with full validation pipeline
- Character validation: test against `/^[a-z0-9-]+$/`, throw on invalid
- Normalization: collapse multiple hyphens (`/--+/g` -> `-`), trim leading/trailing hyphens (`/^-+|-+$/g` -> `''`)
- Check for empty string after normalization, throw descriptive error
- Reserved name check: lowercase comparison against `RESERVED_NAMES` array
- Length validation: per-segment check (split by `/`), total path check
- All errors thrown with descriptive multi-line messages

**\_Prompt:**
**Role:** Backend Developer | **Task:** Implement `validateAndNormalizeName(name)` in `.claude/scripts/lib/spec-resolver.cjs`. Pipeline: (1) check characters match `/^[a-z0-9-]+$/`, throw `Error("Invalid spec name '" + name + "'. Use lowercase-kebab-case format. Example: 'my-feature-name'")` if invalid, (2) normalize: `name = name.replace(/--+/g, '-').replace(/^-+|-+$/g, '')`, (3) check if empty, throw `Error("Spec name cannot be empty after normalization.")`, (4) check reserved: if `RESERVED_NAMES.includes(name.toLowerCase())`, throw `Error("Reserved spec name '" + name + "'. Reserved names: " + RESERVED_NAMES.join(', '))`, (5) validate length: split by `/`, check each segment <= 50 chars, check total <= 200 chars, throw with segment/total details on violation. Return normalized name. Follow pattern from `sanitizeFilenameSegment()` in `checkpoint-manager.cjs` (lines 15-22). | **Restrictions:** No async. Throw on all errors. No error codes. Include invalid input in error messages. | **Success:** `validateAndNormalizeName('my--feature')` returns `'my-feature'`. `validateAndNormalizeName('MyFeature')` throws. `validateAndNormalizeName('templates')` throws. Empty/long names throw.

---

### T003: Implement resolveSpecPath() with search order [REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.5]

Implement the core path resolution function with the 4-stage search order: flat standalone, project-scoped (specs.json), feature-scoped (nested specs.json), and feature-list (features.json). Include ambiguity detection and not-found error handling.

**File:** `.claude/scripts/lib/spec-resolver.cjs`

**Changes:**

- Replace stub implementation with full search algorithm
- Call `validateAndNormalizeName(name)` at start
- Stage 1: Check `specs/{name}/` directory exists and has marker files
- Stage 2: Scan `specs/*/specs.json`, parse JSON, check for matching `specs[].id`
- Stage 3: Scan `specs/*/*/specs.json` (2-level nested), parse JSON, match `specs[].id`
- Stage 4: Scan `specs/*/features.json`, parse JSON, match `features[].id`
- Track all matches in array, throw ambiguity error if length > 1
- Call `detectDirectoryType()` on resolved path
- Return `{ path: normalizePath(resolved), type, name: normalized }`
- Throw not-found error if no matches

**\_Prompt:**
**Role:** Backend Developer | **Task:** Implement `resolveSpecPath(name, levelHint)` in `.claude/scripts/lib/spec-resolver.cjs`. (1) `name = validateAndNormalizeName(name)`, (2) search in order: check `specs/{name}/` dir exists with marker files (any of `MARKER_FILES.spec`), scan `specs/*/specs.json` for `{ "specs": [{"id": name}] }`, scan `specs/*/*/specs.json` for same, scan `specs/*/features.json` for `{ "features": [{"id": name}] }`. Use `fs.readdirSync('specs')` for scanning, `fs.existsSync()` for checks, `fs.readFileSync() + JSON.parse()` for JSON. Track all matches in `matches = []`. Exhaustive search across all 5 stages. Collect all matches. Detect ambiguity if count > 1. Return single match or report ambiguity error with all matches. If `matches.length > 1`, throw `Error("Ambiguous spec name '" + name + "'. Found in multiple locations:\n  1. " + matches[0] + "\n  2. " + matches[1] + "\nUse a more specific name or restructure to avoid duplication.")`. If `matches.length === 0`, throw `Error("Spec not found: " + name + ". Searched: flat, project-scoped, feature-scoped.")`. (3) `type = detectDirectoryType(matches[0])`, (4) return `{ path: normalizePath(matches[0]), type, name }`. Add helper `normalizePath(p)` that uses `path.resolve()` and ensures trailing `path.sep`. | **Restrictions:** Synchronous only. Must complete all stage searches before returning. Collect all matches, then check count for ambiguity (REQ-1.3). Use `path.join()` for all concatenation. | **Success:** Resolves all 12 existing standalone specs. Throws on ambiguous or not-found. Returns absolute paths with trailing slash.

---

### T004: Implement detectDirectoryType() [REQ-1.4]

Implement the marker file detection logic to determine if a directory is a project, feature, or spec. Check for `project.md`, `feature.md`, or spec marker files in order, returning the first match.

**File:** `.claude/scripts/lib/spec-resolver.cjs`

**Changes:**

- Replace stub implementation with marker file checks
- Check 1: `fs.existsSync(path.join(path, 'project.md'))` -> return `'project'`
- Check 2: `fs.existsSync(path.join(path, 'feature.md'))` -> return `'feature'`
- Check 3: Loop through `MARKER_FILES.spec`, if any exist -> return `'spec'`
- Default fallback: return `'spec'` (backward compatibility)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Implement `detectDirectoryType(dirPath)` in `.claude/scripts/lib/spec-resolver.cjs`. (1) check `fs.existsSync(path.join(dirPath, 'project.md'))`, if true return `'project'`, (2) check `fs.existsSync(path.join(dirPath, 'feature.md'))`, if true return `'feature'`, (3) loop through `MARKER_FILES.spec` array, check `fs.existsSync(path.join(dirPath, markerFile))`, if any true return `'spec'`, (4) default: return `'spec'` (backward compatibility for directories without marker files). Use the `path` module for joining. No errors thrown. | **Restrictions:** Always return a type, never throw. Check order: project > feature > spec > default. | **Success:** `detectDirectoryType('/path/with/project.md')` returns `'project'`. `detectDirectoryType('/path/with/requirements.md')` returns `'spec'`. Empty dir returns `'spec'`.

---

### T005: Write unit tests (spec-resolver.test.cjs) [NFR-4]

Create comprehensive unit tests using `node:test` and `node:assert` to verify validation, resolution, type detection, and all error conditions. Test all 12 existing specs for backward compatibility.

**File:** `.claude/scripts/lib/spec-resolver.test.cjs`

**Changes:**

- Create new test file following pattern from `command-utils.test.cjs`
- Use `const test = require('node:test')` and `const assert = require('node:assert')`
- Test cases: valid name normalization, invalid characters, reserved names, length violations, standalone resolution, not-found, ambiguity (mocked), type detection with different markers, all 12 existing specs
- Each test uses `test('description', () => { assert.equal/throws(...) })`
- Run via `node .claude/scripts/lib/spec-resolver.test.cjs`

**\_Prompt:**
**Role:** Test Engineer | **Task:** Create `.claude/scripts/lib/spec-resolver.test.cjs` with unit tests using `node:test` and `node:assert`. Test `validateAndNormalizeName()`: valid kebab-case, uppercase rejection, multiple hyphens normalization, leading/trailing hyphens, reserved name rejection, segment too long, path too long, empty after normalization. Test `resolveSpecPath()`: all 12 existing standalone specs resolve correctly (checkpoint-infrastructure, command-optimization, design-incremental-execution, design-optimization, legacy-cleanup, pr-19-reconciliation, scripts-automation, start-optimization, templates, unified-templates, agent-optimization, cleanup), not-found error, returns absolute path with trailing slash. Test `detectDirectoryType()`: mocked directories with project.md, feature.md, requirements.md, design.md, tasks.md, spec.json, empty dir. Follow pattern from `command-utils.test.cjs`. Each test: `test('desc', () => { assert.equal/assert.throws(...) })`. | **Restrictions:** Use `node:test` and `node:assert` only. No external test frameworks. Test against actual specs directory for integration. | **Success:** All tests pass. Run via `node .claude/scripts/lib/spec-resolver.test.cjs`. Coverage: validation, resolution, type detection, errors, all 12 existing specs.

---

## Phase 2: Implement Command Update

### T006: Replace hardcoded paths in implement.md [REQ-3.1]

Replace all `specs/${feature}/` references in `.claude/commands/implement.md` with calls to `resolveSpecPath(feature).path`. Update spec existence check, file read paths, and error messages.

**File:** `.claude/commands/implement.md`

**Changes:**

- Identify all `specs/${feature}/` references (~20 occurrences)
- Replace with: `const { path: specPath } = require('.claude/scripts/lib/spec-resolver.cjs').resolveSpecPath(feature)` (once at top)
- Update file paths: `specPath + 'requirements.md'` instead of `specs/${feature}/requirements.md`
- Update error messages to include resolver's suggestions
- Update spec existence check to use resolver (catch not-found error)

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `.claude/commands/implement.md` to use spec resolver. (1) Add a MANDATORY step after parsing arguments: "Resolve spec path: Use `resolveSpecPath(feature)` from `.claude/scripts/lib/spec-resolver.cjs` to obtain the absolute spec directory path. Store in `specPath` variable for use throughout." (2) Document that spec existence check is now handled by resolver (throws if not found). (3) Update all file path references: `${specPath}requirements.md`, `${specPath}design.md`, `${specPath}tasks.md`, `${specPath}summary.md`, `${specPath}spec.json`. Identify affected sections: lines ~61 (spec check), ~92 (file reads), ~152-158 (task parsing), ~349 (checkpoint). (4) Update error handling: catch resolver errors and display with message "Spec not found: {feature}. Error: {resolver error message}". (5) Note that this enables future hierarchy support without further changes to implement.md. | **Restrictions:** Do not change implement.md logic, only path references. Add resolver call once at top, use result throughout. Preserve existing error handling structure. | **Success:** All `specs/${feature}/` patterns replaced with `specPath` variable. Resolver called once. Errors display resolver's suggestions.

---

### T007: Update checkpoint path references in implement.md [REQ-3.2]

Update checkpoint-related path references in `implement.md` to use resolved spec paths. Ensure checkpoint context includes `spec_path` field with the full resolved path.

**File:** `.claude/commands/implement.md`

**Changes:**

- Update checkpoint load/save operations to use `specPath` variable
- Update preview CONTEXT section to display resolved path
- Update progress output to show resolved path in file references
- Ensure all checkpoint context objects include `spec_path: specPath` field

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update checkpoint path references in `.claude/commands/implement.md` to use resolved spec path. (1) In checkpoint load section, add `spec_path: specPath` to checkpoint context (where `specPath` is from `resolveSpecPath()`). (2) In preview CONTEXT section, update display to show "Spec: {specPath}" (resolved path). (3) In progress output sections, ensure file references use `specPath + filename`. (4) In checkpoint save operations, ensure `spec_path` field is included in all checkpoint data. Search for checkpoint references in sections: preview (~lines 73-93), checkpoint load (~line 349), progress output. | **Restrictions:** Do not modify checkpoint schema. Only add/update `spec_path` field value to use resolved path. Keep existing checkpoint logic unchanged. | **Success:** Preview shows resolved absolute path. Checkpoint context includes `spec_path` with full resolved path. Progress output uses resolved paths.

---

### T008: Update preview section path display [REQ-3.2]

Update the preview section in `implement.md` to display the resolved spec path in the CONTEXT block, showing the full absolute path instead of the shorthand `specs/${feature}/` pattern.

**File:** `.claude/commands/implement.md`

**Changes:**

- Update preview template or documentation to show resolved path
- CONTEXT section should display: `Spec: {absolute-path-with-trailing-slash}`
- Example: `Spec: /home/user/react-basecamp/specs/my-feature/`

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update the preview section in `.claude/commands/implement.md` to display resolved spec path. In the CONTEXT block of the preview (referenced from command-preview.md or shown inline), update the spec path display to show the full absolute path: `Spec: {specPath}` where `specPath` is the result of `resolveSpecPath(feature).path`. Update the example to show an absolute path with trailing slash: `Spec: /home/user/react-basecamp/specs/design-incremental-execution/`. If preview uses template variables, update the template variable mapping to pass `spec_path` instead of constructing `specs/${feature}/`. | **Restrictions:** Only update path display. Do not change preview structure or other CONTEXT fields. Follow existing preview format from design.md. | **Success:** Preview CONTEXT shows absolute resolved path with trailing slash. Example matches the pattern `/abs/path/specs/{feature}/`.

---

## Phase 3: Routing and Agent Updates

### T009: Update routing/SKILL.md path references [REQ-4.1]

Replace hardcoded path references in the routing skill with resolver calls. Update agent selection logic to use resolved paths for checking spec markers.

**File:** `.claude/skills/routing/SKILL.md`

**Changes:**

- Replace 3 path references (lines ~28, 108-109) with resolver calls
- Update agent selection logic to use `resolveSpecPath(feature).path`
- Update spec marker checks to use resolved path
- No changes to agent selection algorithm

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update `.claude/skills/routing/SKILL.md` to use spec resolver. (1) Identify 3 hardcoded path references (lines ~28, 108-109). (2) Replace with resolver: `const { path: specPath } = require('.claude/scripts/lib/spec-resolver.cjs').resolveSpecPath(feature)`. (3) Update agent selection logic to use `specPath` for checking spec.json or other marker files. (4) Document that resolver is called once at routing time to determine spec location. (5) Note: agent selection algorithm unchanged, only path resolution centralized. | **Restrictions:** Do not modify agent selection rules. Only replace hardcoded path construction. Add resolver call in routing preparation phase. | **Success:** 3 path references replaced. Agent selection uses `specPath` variable. No logic changes beyond path resolution.

---

### T010: Update code-agent.md path documentation [REQ-4.2]

Update the code-agent documentation to clarify that agents receive `spec_path` as an absolute resolved path. Update line ~162 reference and any path construction examples.

**File:** `.claude/agents/code-agent.md`

**Changes:**

- Update path documentation at line ~162
- Clarify that `spec_path` is always absolute with trailing slash
- Add note: "Resolved via `resolveSpecPath()`. Do not concatenate or manipulate."
- Update examples to show absolute paths

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/agents/code-agent.md` to document resolved spec paths. (1) Find path documentation at line ~162. (2) Update to state: "`spec_path`: Full resolved absolute path to spec directory. Always includes trailing slash. Example: `/home/user/react-basecamp/specs/my-feature/`. Resolved via `resolveSpecPath()` in routing. Do not concatenate segments or manipulate the path; use as-is for file operations." (3) Update any example handoffs to show absolute paths instead of `specs/${feature}/`. | **Restrictions:** Documentation only. No changes to agent execution logic. Preserve existing input field structure. | **Success:** Documentation clarifies `spec_path` is absolute resolved path. Examples show full paths with trailing slashes.

---

### T011: Update ui-agent.md path documentation [REQ-4.2]

Update the ui-agent documentation to clarify that agents receive `spec_path` as an absolute resolved path. Update line ~166 reference and any path construction examples.

**File:** `.claude/agents/ui-agent.md`

**Changes:**

- Update path documentation at line ~166
- Clarify that `spec_path` is always absolute with trailing slash
- Add note: "Resolved via `resolveSpecPath()`. Do not concatenate or manipulate."
- Update examples to show absolute paths

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/agents/ui-agent.md` to document resolved spec paths. (1) Find path documentation at line ~166. (2) Update to state: "`spec_path`: Full resolved absolute path to spec directory. Always includes trailing slash. Example: `/home/user/react-basecamp/specs/my-ui-feature/`. Resolved via `resolveSpecPath()` in routing. Do not concatenate segments or manipulate the path; use as-is for file operations." (3) Update any example handoffs to show absolute paths instead of `specs/${feature}/`. | **Restrictions:** Documentation only. No changes to agent execution logic. Preserve existing input field structure. | **Success:** Documentation clarifies `spec_path` is absolute resolved path. Examples show full paths with trailing slashes.

---

### T012: Update agent handoff spec_path field [REQ-4.2]

Ensure that all agent handoff calls from the routing skill and orchestrator pass `spec_path` as the resolved absolute path (result of `resolveSpecPath().path`), not a constructed string.

**File:** `.claude/skills/routing/SKILL.md` (handoff section)

**Changes:**

- Update handoff payload construction to use `resolveSpecPath().path`
- Example: `spec_path: resolveSpecPath(feature).path` instead of `spec_path: 'specs/' + feature + '/'`
- Verify all handoff examples show absolute paths

**\_Prompt:**
**Role:** Backend Developer | **Task:** Update agent handoff in `.claude/skills/routing/SKILL.md` to pass resolved `spec_path`. (1) Find handoff payload construction (where sub-agents are spawned). (2) Update `spec_path` field to use resolver result: `spec_path: resolveSpecPath(feature).path`. (3) Update handoff examples in documentation to show absolute paths: `{ spec_path: "/home/user/react-basecamp/specs/my-feature/", ... }`. (4) Ensure resolver is called before handoff, so path is available in handoff payload. | **Restrictions:** No changes to handoff payload structure. Only update how `spec_path` value is obtained. All other fields unchanged. | **Success:** Handoff passes absolute resolved path. Examples show full paths. Resolver called before handoff.

---

## Phase 4: Sub-Agent Infrastructure

### T013: Update handoff protocol documentation [REQ-5.1]

Update `.claude/docs/protocols/handoff.md` to document that `spec_path` is always a resolved full absolute path with trailing slash, obtained via `resolveSpecPath()`.

**File:** `.claude/docs/protocols/handoff.md`

**Changes:**

- Update `spec_path` field documentation
- State: "Always resolved full absolute path with trailing slash. Use `resolveSpecPath()` to obtain."
- Update example handoff payloads to show absolute paths
- No changes to handoff payload structure

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/docs/protocols/handoff.md` to document resolved `spec_path`. (1) Find `spec_path` field documentation. (2) Update description: "`spec_path` (string): Full resolved absolute path to the spec directory, including trailing slash. Obtained via `resolveSpecPath(feature).path` from `.claude/scripts/lib/spec-resolver.cjs`. Do not construct manually. Example: `/home/user/react-basecamp/specs/my-feature/`." (3) Update all example handoff payloads to show absolute paths instead of relative paths or constructed strings. | **Restrictions:** Documentation only. Do not change handoff schema. Preserve all other field definitions unchanged. | **Success:** `spec_path` documentation states "resolved full absolute path". Examples show absolute paths with trailing slashes.

---

### T014: Update domain-writer.md template [REQ-5.2]

Update the domain-writer sub-agent template to document that the `spec_path` input is always a resolved full absolute path. Update input field documentation and examples.

**File:** `.claude/templates/sub-agents/domain-writer.md`

**Changes:**

- Update `spec_path` input field documentation
- State: "Full resolved absolute path to spec directory"
- Update input examples to show absolute paths
- No changes to template structure or execution logic

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/templates/sub-agents/domain-writer.md` to document `spec_path` as resolved. (1) Find `spec_path` input field documentation. (2) Update to: "`spec_path` (string, required): Full resolved absolute path to spec directory. Includes trailing slash. Example: `/home/user/react-basecamp/specs/my-feature/`. Use directly for file writes; do not manipulate." (3) Update any input examples to show absolute paths. | **Restrictions:** Documentation only. No changes to domain-writer logic or output. Preserve template structure unchanged. | **Success:** Input documentation clarifies `spec_path` is absolute resolved. Examples show full paths.

---

### T015: Update domain-researcher.md template [REQ-5.2]

Update the domain-researcher sub-agent template to document that the `spec_path` input is always a resolved full absolute path. Update input field documentation and examples.

**File:** `.claude/templates/sub-agents/domain-researcher.md`

**Changes:**

- Update `spec_path` input field documentation
- State: "Full resolved absolute path to spec directory"
- Update input examples to show absolute paths
- No changes to template structure or execution logic

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Update `.claude/templates/sub-agents/domain-researcher.md` to document `spec_path` as resolved. (1) Find `spec_path` input field documentation. (2) Update to: "`spec_path` (string, required): Full resolved absolute path to spec directory. Includes trailing slash. Example: `/home/user/react-basecamp/specs/my-feature/`. Use directly for file reads; do not manipulate." (3) Update any input examples to show absolute paths. | **Restrictions:** Documentation only. No changes to domain-researcher logic. Preserve template structure unchanged. | **Success:** Input documentation clarifies `spec_path` is absolute resolved. Examples show full paths.

---

## Phase 5: Validation and Integration

### T016: Integration test with all 12 existing specs [REQ-6.1, NFR-4]

Create an integration test that resolves all 12 existing standalone specs and verifies that each resolves to the correct absolute path with type `'spec'`. Ensure no existing spec is broken by the resolver.

**File:** `.claude/scripts/lib/spec-resolver.test.cjs` (extend existing)

**Changes:**

- Add integration test section to existing test file
- Test all 12 existing specs: checkpoint-infrastructure, command-optimization, design-incremental-execution, design-optimization, legacy-cleanup, pr-19-reconciliation, scripts-automation, start-optimization, templates, unified-templates, agent-optimization, cleanup
- For each spec: `const result = resolveSpecPath(specName)`, verify `result.path` is absolute and ends with trailing slash, verify `result.type === 'spec'`, verify `result.name === specName`
- Test runs against actual `specs/` directory (integration, not mocked)

**\_Prompt:**
**Role:** Test Engineer | **Task:** Add integration test to `.claude/scripts/lib/spec-resolver.test.cjs` for all 12 existing specs. Create test section "Integration: All existing specs". For each spec name in array `['checkpoint-infrastructure', 'command-optimization', 'design-incremental-execution', 'design-optimization', 'legacy-cleanup', 'pr-19-reconciliation', 'scripts-automation', 'start-optimization', 'templates', 'unified-templates', 'agent-optimization', 'cleanup']`, call `resolveSpecPath(name)` and assert: (1) `result.path` is absolute (starts with `/` on Linux or drive letter on Windows), (2) `result.path` ends with trailing slash (path.sep), (3) `result.type === 'spec'`, (4) `result.name === name`, (5) directory exists at `result.path` (fs.existsSync). Use `test('resolves ' + name, () => { ... })` for each. This test runs against actual file system (integration). | **Restrictions:** No mocking. Test against real specs/ directory. All 12 specs must pass. If any fail, test must fail with descriptive error. | **Success:** All 12 existing specs resolve correctly. Test output shows 12 passing integration tests. No existing spec broken by resolver.

---

## Task Dependencies

```text
Phase 1 (Core Resolver):
  T001 (module scaffold)
  T002 (validateAndNormalizeName) ─── depends on ──→ T001
  T003 (resolveSpecPath)          ─── depends on ──→ T001, T002
  T004 (detectDirectoryType)      ─── depends on ──→ T001
  T005 (unit tests)               ─── depends on ──→ T002, T003, T004

Phase 2 (Implement Command):
  T006 (replace paths)            ─── depends on ──→ T003
  T007 (checkpoint paths)         ─── depends on ──→ T006
  T008 (preview path)             ─── depends on ──→ T006

Phase 3 (Routing and Agents):
  T009 (routing paths)            ─── depends on ──→ T003
  T010 (code-agent docs)          ─── depends on ──→ T009
  T011 (ui-agent docs)            ─── depends on ──→ T009
  T012 (handoff spec_path)        ─── depends on ──→ T009

Phase 4 (Sub-Agent Infrastructure):
  T013 (handoff protocol)         ─── depends on ──→ T012
  T014 (domain-writer template)   ─── depends on ──→ T012
  T015 (domain-researcher template)─── depends on ──→ T012

Phase 5 (Validation and Integration):
  T016 (integration test)         ─── depends on ──→ T005, T006, T009
```

**Critical Path:** T001 -> T002 -> T003 -> T006 -> T009 -> T016

---

## Completion Criteria

All tasks are complete WHEN:

1. [x] Module `.claude/scripts/lib/spec-resolver.cjs` exists with 3 exported functions (T001)
2. [x] `validateAndNormalizeName()` validates kebab-case, reserved names, and length limits (T002)
3. [x] `resolveSpecPath()` searches flat > project > feature, detects ambiguity, returns absolute paths (T003)
4. [x] `detectDirectoryType()` identifies project/feature/spec via marker files (T004)
5. [x] Unit tests cover validation, resolution, type detection, errors (T005)
6. [x] `implement.md` uses resolver for all spec path references (~20 occurrences) (T006)
7. [x] Checkpoint context includes `spec_path` with resolved absolute path (T007)
8. [x] Preview displays resolved absolute path (T008)
9. [x] Routing skill uses resolver for agent selection (3 refs) (T009)
10. [x] Agent documentation clarifies `spec_path` is resolved absolute path (T010-T011)
11. [x] Agent handoff passes resolved path, not constructed string (T012)
12. [x] Handoff protocol documents `spec_path` as resolved full path (T013)
13. [x] Sub-agent templates document `spec_path` input format (T014-T015)
14. [x] Integration test verifies all 12 existing specs resolve correctly (T016)

---
