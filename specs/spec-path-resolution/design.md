# Design: Spec Path Resolution

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** spec-path-resolution

## Overview

This design introduces a centralized spec resolver utility at `.claude/scripts/lib/spec-resolver.cjs` that validates spec names, resolves paths across flat and hierarchical layouts, detects directory types via marker files, and handles ambiguity with actionable error messages. The resolver replaces 15+ hardcoded `specs/${feature}/` patterns across the codebase, enabling support for project-scoped and feature-scoped specs in future hierarchy implementations.

---

## Architecture

### Current State

```text
Hardcoded spec paths across 15+ files:
    │
    ├── .claude/commands/implement.md (~20 occurrences)
    │   └── specs/${feature}/requirements.md
    │   └── specs/${feature}/design.md
    │   └── specs/${feature}/tasks.md
    │
    ├── .claude/skills/routing/SKILL.md (3 refs)
    │   └── specs/${feature}/spec.json
    │
    ├── .claude/agents/{code-agent,ui-agent}.md
    │   └── specs/${feature}/ path documentation
    │
    └── .claude/templates/sub-agents/*.md
        └── spec_path field references

No validation. No hierarchy support. No centralized logic.
```

### Target State

```text
Centralized resolver at .claude/scripts/lib/spec-resolver.cjs
    │
    ├── resolveSpecPath(name, levelHint?) → { path, type, name }
    │   ├── Search order: flat > project > feature > feature-list
    │   ├── Ambiguity detection (fail-fast)
    │   ├── Type detection via marker files
    │   └── Absolute path with trailing slash
    │
    ├── validateAndNormalizeName(name) → normalizedName | throw
    │   ├── Character check (kebab-case only)
    │   ├── Length limits (50 chars per segment, 200 total)
    │   ├── Reserved name rejection
    │   └── Normalization (collapse hyphens, trim)
    │
    └── detectDirectoryType(path) → 'project'|'feature'|'spec'
        ├── project.md → 'project'
        ├── feature.md → 'feature'
        └── requirements.md/design.md/tasks.md/spec.json → 'spec'

All consumers updated to use resolver instead of hardcoded paths.
```

---

## Component Design

### 1. Module Structure

**File:** `.claude/scripts/lib/spec-resolver.cjs`

**Format:** CommonJS (`.cjs` extension, uses `require()` and `module.exports`)

**Dependencies:**

- `fs` - File system operations (existsSync, readdirSync, readFileSync)
- `path` - Path manipulation (resolve, join, sep)

**Exports:**

```javascript
module.exports = {
  resolveSpecPath,
  validateAndNormalizeName,
  detectDirectoryType,
};
```

**Constants:**

```javascript
const RESERVED_NAMES = ["node_modules", "dist", "build"];
const MAX_SEGMENT_LENGTH = 50;
const MAX_PATH_LENGTH = 200;
const MARKER_FILES = {
  project: "project.md",
  feature: "feature.md",
  spec: ["requirements.md", "design.md", "tasks.md", "spec.json"],
};
```

---

### 2. Name Validation Pipeline

**Function:** `validateAndNormalizeName(name: string): string`

**Pipeline stages:**

```text
Input: name (string)
    │
    ├── 1. Character validation
    │   ├── Test against /^[a-z0-9-]+$/
    │   └── Reject if invalid: throw Error("Invalid spec name '{name}'. Use lowercase-kebab-case format.")
    │
    ├── 2. Normalization
    │   ├── Collapse multiple hyphens: /--+/g → '-'
    │   ├── Trim leading/trailing hyphens: /^-+|-+$/g → ''
    │   └── Check for empty result: throw Error("Spec name cannot be empty after normalization.")
    │
    ├── 3. Reserved name check
    │   ├── Convert to lowercase for check
    │   └── If in RESERVED_NAMES: throw Error("Reserved spec name '{name}'. Reserved: ...")
    │
    └── 4. Length validation
        ├── Segment check (per '/' separator): <= 50 chars
        ├── Total path check: <= 200 chars
        └── Throw on violation with descriptive message
    │
    └── Return: normalized name (string)
```

**Implementation approach:**

- Pattern follows `sanitizeFilenameSegment()` in `checkpoint-manager.cjs` (lines 15-22)
- All errors are thrown synchronously (no error codes, no returns)
- Error messages include the invalid input and suggested format

---

### 3. Path Resolution Algorithm

**Function:** `resolveSpecPath(name: string, levelHint?: string): { path: string, type: string, name: string }`

**Search order:**

```text
Input: name (validated), levelHint (optional)
    │
    ├── 0. Validation
    │   └── name = validateAndNormalizeName(name)
    │
    ├── 1. Standalone directory check
    │   ├── Check: specs/{name}/ exists
    │   ├── Verify: at least one marker file present
    │   └── If match: return immediately (first match wins)
    │
    ├── 2. Project-scoped check
    │   ├── Scan: specs/*/specs.json
    │   ├── Parse JSON: { "specs": [{ "id": "{name}", ... }] }
    │   ├── Match: specs[].id === name
    │   └── If match: return specs/{project}/{name}/
    │
    ├── 3. Feature-scoped check
    │   ├── Scan: specs/*/*/specs.json
    │   ├── Parse JSON: { "specs": [{ "id": "{name}", ... }] }
    │   ├── Match: specs[].id === name
    │   └── If match: return specs/{project}/{feature}/{name}/
    │
    ├── 4. Feature-list check
    │   ├── Scan: specs/*/features.json
    │   ├── Parse JSON: { "features": [{ "id": "{name}", ... }] }
    │   ├── Match: features[].id === name
    │   └── If match: return specs/{project}/{name}/
    │
    ├── 5. Not found
    │   └── throw Error("Spec not found: {name}. Searched: flat, project-scoped, feature-scoped.")
    │
    └── 6. Ambiguity detection
        ├── Track all matching paths during search
        └── If multiple matches: throw Error("Ambiguous spec name '{name}'. Found in:\n  1. {path1}\n  2. {path2}")
```

**Performance characteristics:**

- O(n) where n = directory count in `specs/`
- Exhaustive search across all stages to detect ambiguity (REQ-1.3)
- Synchronous file operations (fs.existsSync, fs.readdirSync)
- JSON parsing is synchronous (fs.readFileSync + JSON.parse)
- Acceptable for current scale (~20 directories)
- Target: <50ms for 20 dirs, <200ms for 100 dirs

---

### 4. Type Detection

**Function:** `detectDirectoryType(path: string): 'project'|'feature'|'spec'`

**Detection logic:**

```text
Input: absolute path to directory
    │
    ├── 1. Check for project.md
    │   ├── fs.existsSync(path.join(path, 'project.md'))
    │   └── If exists: return 'project'
    │
    ├── 2. Check for feature.md
    │   ├── fs.existsSync(path.join(path, 'feature.md'))
    │   └── If exists: return 'feature'
    │
    ├── 3. Check for spec markers
    │   ├── fs.existsSync(path.join(path, 'requirements.md'))
    │   ├── fs.existsSync(path.join(path, 'design.md'))
    │   ├── fs.existsSync(path.join(path, 'tasks.md'))
    │   ├── fs.existsSync(path.join(path, 'spec.json'))
    │   └── If any exists: return 'spec'
    │
    └── 4. Default fallback
        └── return 'spec' (backward compatibility)
```

**Usage:**

- Called after path resolution, not during search
- Exported for external use (e.g., routing skill, agents)
- No errors thrown (always returns a type)

---

### 5. Path Format Consistency

**Requirements:** [REQ-1.5]

**Implementation:**

```javascript
function normalizePath(resolvedPath) {
  // Convert to absolute path
  const absolutePath = path.resolve(resolvedPath);

  // Ensure trailing slash
  return absolutePath.endsWith(path.sep)
    ? absolutePath
    : absolutePath + path.sep;
}
```

**Rules:**

- All returned `path` values are absolute (via `path.resolve()`)
- All paths end with trailing `/` (platform-specific `path.sep`)
- Uses `path.join()` for all path concatenation (cross-platform)
- No mixed separators in output

---

### 6. Consumer Update Strategy

**Phase 1: Implement Command** [REQ-3.1, REQ-3.2]

File: `.claude/commands/implement.md`

**Updates:**

- Replace all `specs/${feature}/` references with `resolveSpecPath(feature).path`
- Affected areas:
  - Spec existence check (line ~61)
  - File reads for requirements.md, design.md, tasks.md (lines ~92, 152-158)
  - Checkpoint path references (line ~349 and throughout checkpoint sections)
  - Preview CONTEXT section (show resolved path)
  - Progress output (show resolved path in file references)
- Error message enhancement: include resolver's "not found" suggestions

**Phase 2: Routing and Agents** [REQ-4.1, REQ-4.2]

Files:

- `.claude/skills/routing/SKILL.md` (3 references, lines ~28, 108-109)
- `.claude/agents/code-agent.md` (line ~162)
- `.claude/agents/ui-agent.md` (line ~166)

**Updates:**

- Replace hardcoded path references with `resolveSpecPath(feature).path`
- Update documentation to clarify agents receive `spec_path` as absolute resolved path
- No changes to agent selection or execution logic (only path resolution)

**Phase 3: Sub-Agent Infrastructure** [REQ-5.1, REQ-5.2, REQ-5.3]

Files:

- `.claude/docs/protocols/handoff.md`
- `.claude/docs/protocols/orchestration.md`
- `.claude/templates/sub-agents/domain-writer.md`
- `.claude/templates/sub-agents/domain-researcher.md`

**Updates:**

- Document that `spec_path` is always a resolved full absolute path
- Add note: "Always resolved via `resolveSpecPath()`. Do not concatenate or manipulate."
- Update examples to show absolute paths (e.g., `/home/user/specs/my-feature/`)
- No changes to handoff payload structure or template logic

---

### 7. Error Handling

**Error types and responses:**

| Error Type                | Trigger                                      | Message                                                                                                                                                   | Action |
| ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Invalid characters        | Name contains uppercase, spaces, underscores | `"Invalid spec name '{name}'. Use lowercase-kebab-case format. Example: 'my-feature-name'"`                                                               | Throw  |
| Reserved name             | Name matches reserved keyword                | `"Reserved spec name '{name}'. Reserved names: templates, node_modules, dist, build"`                                                                     | Throw  |
| Segment too long          | Segment > 50 chars                           | `"Spec name segment too long ({length} chars, max 50). Segment: '{segment}'"`                                                                             | Throw  |
| Path too long             | Full path > 200 chars                        | `"Full spec path too long ({length} chars, max 200). Path: '{path}'"`                                                                                     | Throw  |
| Empty after normalization | Name is only hyphens                         | `"Spec name cannot be empty after normalization."`                                                                                                        | Throw  |
| Not found                 | No matching spec directory                   | `"Spec not found: {name}. Searched: flat, project-scoped, feature-scoped."`                                                                               | Throw  |
| Ambiguous                 | Multiple matches found                       | `"Ambiguous spec name '{name}'. Found in multiple locations:\n  1. {path1}\n  2. {path2}\nUse a more specific name or restructure to avoid duplication."` | Throw  |

**Error propagation:**

- All validation errors thrown synchronously
- No try-catch in resolver (consumers handle errors)
- Error messages are multi-line for clarity
- All errors include actionable suggestions

---

## Data Flow

```text
Consumer (implement.md, routing, agent)
    │
    ├── Call: resolveSpecPath(userInput)
    │
    ├── spec-resolver.cjs:
    │   │
    │   ├── validateAndNormalizeName(userInput)
    │   │   ├── Character check
    │   │   ├── Normalization
    │   │   ├── Reserved name check
    │   │   └── Length validation
    │   │       └── Returns: normalizedName | throws
    │   │
    │   ├── Search for spec:
    │   │   ├── Check: specs/{name}/
    │   │   ├── Scan: specs/*/specs.json
    │   │   ├── Scan: specs/*/*/specs.json
    │   │   ├── Scan: specs/*/features.json
    │   │   └── Returns: resolvedPath | throws
    │   │
    │   ├── detectDirectoryType(resolvedPath)
    │   │   ├── Check: project.md
    │   │   ├── Check: feature.md
    │   │   ├── Check: requirements.md/design.md/tasks.md/spec.json
    │   │   └── Returns: 'project'|'feature'|'spec'
    │   │
    │   └── Return: { path: absolute/path/, type: 'spec', name: normalized-name }
    │
    └── Consumer uses result.path for file operations
```

---

## Testing Strategy

**Unit tests:** `.claude/scripts/lib/spec-resolver.test.cjs`

| Test Case                  | Input                         | Expected Output                                                             |
| -------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| Valid kebab-case name      | `'my-feature'`                | `{ name: 'my-feature', ... }`                                               |
| Uppercase rejection        | `'MyFeature'`                 | Error: "Invalid spec name..."                                               |
| Multiple hyphens           | `'my--feature'`               | `{ name: 'my-feature', ... }`                                               |
| Leading/trailing hyphens   | `'-feature-'`                 | `{ name: 'feature', ... }`                                                  |
| Reserved name              | `'templates'`                 | Error: "Reserved spec name..."                                              |
| Segment too long           | `'a'.repeat(51)`              | Error: "Spec name segment too long..."                                      |
| Standalone spec resolution | `'checkpoint-infrastructure'` | `{ path: '/abs/path/specs/checkpoint-infrastructure/', type: 'spec', ... }` |
| Not found                  | `'nonexistent-spec'`          | Error: "Spec not found..."                                                  |
| Type detection (spec)      | path with `requirements.md`   | `'spec'`                                                                    |
| Type detection (project)   | path with `project.md`        | `'project'`                                                                 |
| Type detection (feature)   | path with `feature.md`        | `'feature'`                                                                 |
| All 12 existing specs      | Each existing spec name       | Correct resolution                                                          |

**Integration test:** [REQ-6.1]

Test that all 12 existing standalone specs resolve correctly:

- checkpoint-infrastructure
- command-optimization
- design-incremental-execution
- design-optimization
- legacy-cleanup
- pr-19-reconciliation
- scripts-automation
- start-optimization
- templates
- unified-templates
- agent-optimization
- cleanup

**Test execution:**

```bash
node .claude/scripts/lib/spec-resolver.test.cjs
```

---

## Files Modified

| File                                                | Action | Description                                |
| --------------------------------------------------- | ------ | ------------------------------------------ |
| `.claude/scripts/lib/spec-resolver.cjs`             | Create | New resolver module                        |
| `.claude/scripts/lib/spec-resolver.test.cjs`        | Create | Unit tests                                 |
| `.claude/commands/implement.md`                     | Modify | Replace ~20 hardcoded path refs            |
| `.claude/skills/routing/SKILL.md`                   | Modify | Replace 3 path refs                        |
| `.claude/agents/code-agent.md`                      | Modify | Update path documentation (line ~162)      |
| `.claude/agents/ui-agent.md`                        | Modify | Update path documentation (line ~166)      |
| `.claude/docs/protocols/handoff.md`                 | Modify | Document resolved `spec_path` field        |
| `.claude/docs/protocols/orchestration.md`           | Modify | Document resolver usage                    |
| `.claude/templates/sub-agents/domain-writer.md`     | Modify | Document `spec_path` as resolved full path |
| `.claude/templates/sub-agents/domain-researcher.md` | Modify | Document `spec_path` as resolved full path |

---

## Dependencies

| Dependency               | Type     | Status                                    |
| ------------------------ | -------- | ----------------------------------------- |
| Node.js fs module        | Built-in | Available                                 |
| Node.js path module      | Built-in | Available                                 |
| `node:test`              | Built-in | Available (Node.js 18+)                   |
| `node:assert`            | Built-in | Available                                 |
| `checkpoint-manager.cjs` | Module   | Implemented (pattern reference)           |
| `command-utils.cjs`      | Module   | Implemented (pattern reference)           |
| All 12 existing specs    | Specs    | Implemented (backward compatibility test) |

---

## Non-Functional Requirements

**Performance:** O(n) scan where n = directory count. Target <50ms for 20 dirs, <200ms for 100 dirs.

**Compatibility:** CommonJS format, Node.js 18+, no new npm dependencies.

**Reliability:** Synchronous operations, fail-fast on errors, comprehensive error messages.

**Maintainability:** Reserved names list as constant, marker files as constant, clear separation of validation/resolution/detection.

---
