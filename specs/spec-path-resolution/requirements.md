# Requirements: Spec Path Resolution

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** spec-path-resolution

## Goal

Centralize spec path handling to support both flat (`specs/{feature}/`) and hierarchical (`specs/{project}/{feature}/`) directory layouts with a unified resolver utility that validates names, detects directory types, and handles ambiguity.

## User Stories

- As a developer, I want a centralized resolver so I don't have to hardcode paths in 15+ different files
- As a tool author, I want to query spec existence with `resolveSpecPath(name)` and get back the full path and type
- As a system maintainer, I want ambiguous paths to fail fast with clear error messages instead of silently selecting the wrong spec

## Success Criteria

- Resolver utility at `.claude/scripts/lib/spec-resolver.cjs` exports `resolveSpecPath()` and `validateAndNormalizeName()` functions
- All 12 existing standalone specs resolve correctly without changes to directory structure
- Ambiguity detection catches cases where spec names appear in multiple locations
- Support for nested `specs/{project}/{feature}/` alongside flat `specs/{feature}/` layouts
- Name validation enforces kebab-case with deny-list for reserved names (node_modules, dist, build)

## Technical Constraints

- CommonJS module format (.cjs) for compatibility with existing scripts
- Synchronous resolution (no async/await) to keep integration simple
- Only built-in Node.js modules (fs, path) - no new npm dependencies
- Comprehensive unit tests using node:test and node:assert
- O(n) performance acceptable for up to 100 spec directories

## Overview

Centralize spec path handling for 15+ files that currently hardcode `specs/${feature}/` patterns. Create a unified resolver utility at `.claude/scripts/lib/spec-resolver.cjs` that validates spec names, resolves paths across flat and hierarchical layouts (standalone, project-scoped, and feature-scoped specs), detects directory types via marker files, and handles ambiguity with actionable error messages. Update all consumers (implement.md, routing skill, agents, sub-agent templates, protocols) to use the resolver instead of hardcoded paths.

---

## Functional Requirements

### REQ-1: Spec Resolver Utility

#### REQ-1.1: Resolution Function Interface

**EARS (Ubiquitous):** THE SYSTEM SHALL provide a `resolveSpecPath(name, levelHint?)` function that accepts a spec name string and an optional level hint string (`'project'|'feature'|'spec'`) and returns an object containing the resolved path, detected type, and normalized name.

**Acceptance Criteria:**

- Function exported from `.claude/scripts/lib/spec-resolver.cjs` as a CommonJS module
- Accepts two parameters: `name` (string, required), `levelHint` (string, optional)
- Returns `{ path: string, type: 'project'|'feature'|'spec', name: string }`
- `path` is absolute path to the spec directory (e.g., `/full/path/to/specs/my-feature/`)
- `name` is the normalized kebab-case spec name after validation
- Function is synchronous (no async/await, no promises)

#### REQ-1.2: Search Order and Priority

**EARS (Event-driven):** WHEN `resolveSpecPath(name)` is called without a level hint, THE SYSTEM SHALL search in the following priority order: (1) standalone `specs/{name}/` directory, (2) `specs/*/specs.json` with matching name, (3) `specs/*/*/specs.json` with matching name, (4) `specs/*/features.json` with matching name.

**Acceptance Criteria:**

- Search priority: flat > project-scoped > feature-scoped > feature-list
- Standalone directory: `specs/{name}/` exists and contains at least one marker file (`requirements.md`, `design.md`, `tasks.md`, or `spec.json`)
- Project-scoped: `specs/{project}/specs.json` contains `{ "specs": [{ "id": "{name}", ... }] }`
- Feature-scoped: `specs/{project}/{feature}/specs.json` contains `{ "specs": [{ "id": "{name}", ... }] }`
- Feature-list: `specs/{project}/features.json` contains `{ "features": [{ "id": "{name}", ... }] }`
- First match wins; no further directories checked after first valid match found
- O(n) directory scan where n is count of directories in specs/ (acceptable for current scale: ~20 entries)

#### REQ-1.3: Ambiguity Detection and Error Handling

**EARS (Unwanted):** IF multiple spec locations match the same name, THE SYSTEM SHALL report an error listing all matching paths and suggest using a more specific name or restructuring.

**Acceptance Criteria:**

- Error message format: `"Ambiguous spec name '{name}'. Found in multiple locations:\n  1. {path1}\n  2. {path2}\nUse a more specific name or restructure to avoid duplication."`
- All matching paths listed in the error
- Error thrown via `throw new Error()` with descriptive multi-line message
- No arbitrary selection when ambiguity exists (fail-fast)

#### REQ-1.4: Type Detection

**EARS (Ubiquitous):** THE SYSTEM SHALL detect the directory type (project, feature, or spec) by checking for marker files: `project.md` for projects, `feature.md` for features, and `requirements.md`/`design.md`/`tasks.md`/`spec.json` for specs.

**Acceptance Criteria:**

- `type = 'project'` when `project.md` exists in the resolved directory
- `type = 'feature'` when `feature.md` exists in the resolved directory
- `type = 'spec'` when any of `requirements.md`, `design.md`, `tasks.md`, or `spec.json` exists in the resolved directory
- Type detection runs after path resolution, not during search
- If no marker files exist, default to `type = 'spec'` (backward compatibility)
- Helper function `detectDirectoryType(path)` exported for external use

#### REQ-1.5: Path Format Consistency

**EARS (Ubiquitous):** THE SYSTEM SHALL return all resolved paths in absolute format with a trailing slash, ensuring consistent path handling across all consumers.

**Acceptance Criteria:**

- Returned `path` is absolute (starts with `/` on Linux/macOS, drive letter on Windows)
- Returned `path` ends with trailing `/` (e.g., `/home/user/specs/my-feature/`)
- Uses `path.resolve()` to convert relative paths to absolute
- Uses `path.join()` for path concatenation (platform-agnostic)
- No mixed path separators in output (always forward slashes on Linux/macOS)

---

### REQ-2: Name Validation and Normalization

#### REQ-2.1: Kebab-Case Enforcement

**EARS (Ubiquitous):** THE SYSTEM SHALL enforce kebab-case format for all spec names, allowing only lowercase letters, numbers, and hyphens.

**Acceptance Criteria:**

- Valid characters: `[a-z0-9-]` (lowercase letters, digits, hyphens)
- Invalid characters rejected with error: `"Invalid spec name '{name}'. Only lowercase letters, numbers, and hyphens allowed."`
- Multiple consecutive hyphens collapsed to single hyphen (e.g., `"my--feature"` -> `"my-feature"`)
- Leading and trailing hyphens trimmed (e.g., `"-feature-"` -> `"feature"`)
- Empty string after normalization rejected with error: `"Spec name cannot be empty after normalization."`

#### REQ-2.2: Character Restrictions

**EARS (Unwanted):** IF a spec name contains uppercase letters, spaces, underscores, or special characters, THE SYSTEM SHALL reject it with a descriptive error message.

**Acceptance Criteria:**

- Uppercase letters rejected (no automatic case conversion; explicit rejection)
- Spaces rejected
- Underscores rejected (suggest replacement with hyphens)
- Special characters rejected (e.g., `!@#$%^&*()`)
- Error message format: `"Invalid spec name '{name}'. Use lowercase-kebab-case format. Example: 'my-feature-name'"`

**Rationale:** Fixable formatting issues (multiple hyphens, leading/trailing hyphens) are normalized because the user's intent is clear and auto-correction is unambiguous. Character class violations (uppercase, underscores, spaces) are rejected because automatic conversion could cause unexpected name changes (e.g., `MyFeature` -> `myfeature` loses semantic casing). Explicit errors guide users to provide the intended kebab-case name directly.

#### REQ-2.3: Length Limits

**EARS (Ubiquitous):** THE SYSTEM SHALL enforce a maximum length of 50 characters per spec name segment and 200 characters total for the full spec name path.

**Acceptance Criteria:**

- Single segment (standalone spec): max 50 characters
- Multi-segment path (e.g., `project/feature`): max 200 characters total, max 50 characters per segment
- Segment is any part separated by `/` in a hierarchical path
- Error message format: `"Spec name segment too long ({length} chars, max 50). Segment: '{segment}'"`
- Total path length error: `"Full spec path too long ({length} chars, max 200). Path: '{path}'"`

#### REQ-2.4: Reserved Name Rejection

**EARS (Unwanted):** IF a spec name matches a reserved keyword, THE SYSTEM SHALL reject it with a descriptive error message listing the reserved names.

**Acceptance Criteria:**

- Reserved names list: `["node_modules", "dist", "build"]`
- Check is case-insensitive (e.g., `"Build"` also rejected)
- Error message format: `"Reserved spec name '{name}'. Reserved names: node_modules, dist, build"`
- Reserved list maintained in a constant at the top of the module for easy updates

**Rationale:** The `templates` directory contains actual spec templates and must be resolvable via path resolution. Only build artifacts and dependencies are reserved.

#### REQ-2.5: Validation Function Export

**EARS (Ubiquitous):** THE SYSTEM SHALL export a `validateAndNormalizeName(name)` function that performs all validation and normalization steps and returns the normalized name or throws an error.

**Acceptance Criteria:**

- Function signature: `validateAndNormalizeName(name: string): string`
- Returns normalized kebab-case string on success
- Throws descriptive error on failure (invalid chars, reserved name, length violation, empty)
- Follows pattern from `sanitizeFilenameSegment()` in `checkpoint-manager.cjs` (lines 15-22)
- Exported from `.claude/scripts/lib/spec-resolver.cjs` for external validation use

---

### REQ-3: Implement Command Update

#### REQ-3.1: Replace Hardcoded Paths in implement.md

**EARS (Event-driven):** WHEN the `/implement` command checks for spec existence, THE SYSTEM SHALL use `resolveSpecPath(feature)` instead of hardcoded `specs/${feature}/` paths.

**Acceptance Criteria:**

- All `specs/${feature}/` references replaced with `resolveSpecPath(feature).path`
- Affected lines in `.claude/commands/implement.md`: ~20 occurrences including lines 61, 92, 152-158, 349, checkpoint sections, preview sections
- Error message updates: `"Spec not found: {feature}"` changed to include resolver's path suggestions
- No regression in existing spec discovery behavior for all 12 existing standalone specs

#### REQ-3.2: Update Checkpoint Path References

**EARS (Ubiquitous):** THE SYSTEM SHALL update checkpoint path references in implement.md to use resolved paths instead of hardcoded patterns.

**Acceptance Criteria:**

- Checkpoint load/save operations use `resolveSpecPath(feature).path` for spec file reads
- Preview section displays resolved path in CONTEXT block
- Progress output shows resolved path in file references
- All checkpoint context includes `spec_path` field with resolved full path

**Implementation Note:** REQ-3 changes to `.claude/commands/implement.md` should be sequenced after the `design-incremental-execution` spec lands, as both specs modify the same file. Coordinate with `design-incremental-execution` tasks T020-T021 to avoid merge conflicts. Suggested order: implement design-incremental-execution first, then apply REQ-3 changes.

---

### REQ-4: Routing Skill and Agent Updates

#### REQ-4.1: Update routing/SKILL.md Path References

**EARS (Event-driven):** WHEN the routing skill selects an agent, THE SYSTEM SHALL use `resolveSpecPath(feature)` to determine the spec directory for agent selection logic.

**Acceptance Criteria:**

- 3 path references in `.claude/skills/routing/SKILL.md` replaced (lines 28, 108-109)
- Agent selection logic uses resolved path to check for spec markers
- No changes to agent selection algorithm (only path resolution)

#### REQ-4.2: Update Agent Documentation

**EARS (Ubiquitous):** THE SYSTEM SHALL document the use of `resolveSpecPath()` in agent documentation for code-agent.md and ui-agent.md.

**Acceptance Criteria:**

- `code-agent.md` line 162 updated to reference resolved paths
- `ui-agent.md` line 166 updated to reference resolved paths
- Documentation clarifies that agents receive `spec_path` as absolute resolved path
- No changes to agent execution logic (only documentation)

---

### REQ-5: Sub-Agent Infrastructure Update

#### REQ-5.1: Update Handoff Protocol

**EARS (Ubiquitous):** THE SYSTEM SHALL update `.claude/docs/protocols/handoff.md` to document that `spec_path` is always a resolved full path.

**Acceptance Criteria:**

- `spec_path` field documentation updated to state: "Always resolved full absolute path with trailing slash. Use `resolveSpecPath()` to obtain."
- Example handoff payloads show absolute paths (e.g., `/home/user/specs/my-feature/`)
- No changes to handoff payload structure (only field documentation)

#### REQ-5.2: Update Sub-Agent Templates

**EARS (Ubiquitous):** THE SYSTEM SHALL update sub-agent templates (domain-writer.md, domain-researcher.md) to document that `spec_path` input is always a resolved full path.

**Acceptance Criteria:**

- `.claude/templates/sub-agents/domain-writer.md` updated to state: "`spec_path`: Full resolved absolute path to spec directory"
- `.claude/templates/sub-agents/domain-researcher.md` updated similarly
- Input examples show absolute paths
- No changes to template structure or execution logic

#### REQ-5.3: Update Orchestration Protocol

**EARS (Ubiquitous):** THE SYSTEM SHALL update `.claude/docs/protocols/orchestration.md` to document the use of `resolveSpecPath()` in orchestrator logic.

**Acceptance Criteria:**

- Protocol documentation includes note: "All spec paths passed to sub-agents must be resolved via `resolveSpecPath()` before handoff."
- Example orchestration code shows resolver usage
- No changes to orchestration algorithm (only documentation)

---

### REQ-6: Backward Compatibility

#### REQ-6.1: Existing Specs Resolution

**EARS (Ubiquitous):** THE SYSTEM SHALL successfully resolve all 12 existing standalone specs using the new resolver without changes to their directory structure.

**Acceptance Criteria:**

- All standalone specs resolved correctly: checkpoint-infrastructure, command-optimization, design-incremental-execution, design-optimization, legacy-cleanup, pr-19-reconciliation, scripts-automation, start-optimization, templates, unified-templates, agent-optimization, cleanup
- Resolution returns correct absolute path for each
- Type detection returns `'spec'` for all existing specs
- No errors or warnings for any existing spec name
- Backward compatibility verified via unit tests

---

## Non-Functional Requirements

### NFR-1: CommonJS Module Format

**EARS (Ubiquitous):** THE SYSTEM SHALL implement the spec resolver as a CommonJS module following the existing pattern from `command-utils.cjs` and `checkpoint-manager.cjs`.

**Acceptance Criteria:**

- File extension: `.cjs`
- Module exports: `module.exports = { resolveSpecPath, validateAndNormalizeName, detectDirectoryType }`
- Uses `require()` for dependencies (fs, path)
- No ES6 module syntax (no `import`/`export`)
- Compatible with Node.js 18+

### NFR-2: Performance

**EARS (Ubiquitous):** THE SYSTEM SHALL resolve spec paths in O(n) time where n is the count of directories in specs/, with acceptable performance for up to 100 spec directories.

**Acceptance Criteria:**

- Single directory scan (no recursive traversal beyond 2 levels)
- Synchronous file system operations (fs.existsSync, fs.readdirSync)
- Exhaustive search across all 5 stages to detect ambiguity (REQ-1.3). Performance optimized by caching and limiting search scope to specs/ directory tree.
- Typical resolution time: less than 50ms for 20 directories, less than 200ms for 100 directories

### NFR-3: No New Dependencies

**EARS (Ubiquitous):** THE SYSTEM SHALL use only built-in Node.js modules (fs, path) without introducing new npm dependencies.

**Acceptance Criteria:**

- No additions to package.json dependencies
- Uses only `fs`, `path`, and standard JavaScript APIs
- No third-party libraries for path matching, validation, or JSON parsing

### NFR-4: Unit Test Coverage

**EARS (Ubiquitous):** THE SYSTEM SHALL include comprehensive unit tests using `node:test` and `node:assert` following the pattern from `command-utils.test.cjs`.

**Acceptance Criteria:**

- Test file: `.claude/scripts/lib/spec-resolver.test.cjs`
- Test cases: valid name normalization, invalid chars rejection, reserved name rejection, flat resolution, nested resolution, ambiguity error, not-found error, type detection, all 12 existing specs
- Each test case uses `node:assert` for assertions
- Tests run via `node .claude/scripts/lib/spec-resolver.test.cjs`
- All tests pass before integration

---

## Out of Scope

- `--project`, `--feature`, `--spec` command-line flags for explicit hierarchy hints (separate spec: spec-hierarchy-flags)
- New templates for project.md, feature.md, features.json, specs.json (separate spec: spec-hierarchy-templates)
- Changes to `/design` command logic or plan-agent hierarchy routing (separate spec)
- Migration scripts or tools to restructure existing specs
- Automatic spec renaming or path migration
- CI workflow updates to validate spec names on PR
- Web-based spec directory browser
- Spec path caching or index file generation

---

## Dependencies

| Dependency                                          | Type     | Status                                                     |
| --------------------------------------------------- | -------- | ---------------------------------------------------------- |
| `checkpoint-manager.cjs`                            | Module   | Implemented (`.claude/scripts/lib/checkpoint-manager.cjs`) |
| `command-utils.cjs`                                 | Module   | Implemented (`.claude/scripts/lib/command-utils.cjs`)      |
| `design-incremental-execution`                      | Spec     | Approved (modifies overlapping files: implement.md)        |
| Node.js fs module                                   | Built-in | Available                                                  |
| Node.js path module                                 | Built-in | Available                                                  |
| `node:test`                                         | Built-in | Available (Node.js 18+)                                    |
| `node:assert`                                       | Built-in | Available                                                  |
| `.claude/commands/implement.md`                     | Command  | Implemented (requires updates)                             |
| `.claude/skills/routing/SKILL.md`                   | Skill    | Implemented (requires updates)                             |
| `.claude/agents/code-agent.md`                      | Agent    | Implemented (requires updates)                             |
| `.claude/agents/ui-agent.md`                        | Agent    | Implemented (requires updates)                             |
| `.claude/docs/protocols/handoff.md`                 | Protocol | Implemented (requires updates)                             |
| `.claude/docs/protocols/orchestration.md`           | Protocol | Implemented (requires updates)                             |
| `.claude/templates/sub-agents/domain-writer.md`     | Template | Implemented (requires updates)                             |
| `.claude/templates/sub-agents/domain-researcher.md` | Template | Implemented (requires updates)                             |

---
