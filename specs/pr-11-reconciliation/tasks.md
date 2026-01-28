# PR #11 Reconciliation Tasks

**Source**: CodeRabbit review comments on PR #11
**Total Comments**: 30 (1 critical, 4 major, 18 minor, 7 trivial)
**Strategy**: Fix critical/major issues first, batch minor fixes by pattern, skip trivial nitpicks

---

## Phase 1: Critical Fixes (1)

### Task 1.1: Fix Windows Path Normalization Bug

**File**: `.claude/scripts/hooks/pre-tool-use-task-enforcement.cjs`
**Line**: 127
**Severity**: Critical
**Issue**: Path matching fails on Windows due to backslash separators
**Fix Required**: Normalize path separators before pattern matching

```javascript
// Before line 127, add:
const normalizedPath = filePath.replace(/\\/g, "/");
// Then use normalizedPath in pattern.test()
```

**\_Prompt**:

```
Fix Windows path normalization in pre-tool-use-task-enforcement.cjs:127.

Current code uses filePath directly in pattern.test(), which fails on Windows
because patterns use forward slashes but Windows paths use backslashes.

Add path normalization:
1. Before the pattern.test() call on line 127
2. Use: const normalizedPath = filePath.replace(/\\/g, '/')
3. Replace filePath with normalizedPath in the pattern.test() call

Test that patterns like /.claude\/scripts/ match on both Unix and Windows paths.
```

---

## Phase 2: Major Fixes (4)

### Task 2.1: Fix Agent Routing Bug

**File**: `.claude/scripts/hooks/command-mode-detect.cjs`
**Lines**: 26-124
**Severity**: Major
**Issue**: Agent field is string but should be array for proper routing logic
**Fix Required**: Change `/start` mapping from `agent: "git-agent"` to `agents: ["git-agent"]`

**\_Prompt**:

```
Fix agent routing bug in command-mode-detect.cjs.

Current issue: Line 26-124 uses `agent: "git-agent"` (singular string) but the
routing logic expects `agents: ["git-agent"]` (array).

Changes needed:
1. Line ~28: Change `agent: "git-agent"` to `agents: ["git-agent"]`
2. Verify all other command mappings use `agents` array consistently
3. Update any downstream code that expects the old `agent` field

This ensures proper agent routing when commands are executed.
```

### Task 2.2: Update Archived README Command List

**File**: `.claude/archived/README.md`
**Lines**: 112-121
**Severity**: Major
**Issue**: Command list doesn't match PR objectives (shows 8 commands, should show 6)
**Fix Required**: Update to reflect: /start, /plan, /implement, /ship, /guide, /mode

**\_Prompt**:

```
Update command list in archived/README.md lines 112-121 to match PR #11 objectives.

Current: Lists 8 commands
Expected: List 6 commands (/start, /plan, /implement, /ship, /guide, /mode)

Update the table to show:
- /start - Start work (git-agent)
- /plan - Create spec (plan-agent)
- /implement - Build feature (routing-agent)
- /ship - Push & PR (git-agent + check-agent)
- /guide - Status & help
- /mode - Switch dev/basic mode

Remove any deprecated commands not in this list.
```

### Task 2.3: Add Security Scanner Exclusion Patterns

**File**: `.claude/agents/check-agent.md` (security-scanner section)
**Severity**: Major
**Issue**: Missing --exclude patterns for tests/docs/config to reduce noise
**Fix Required**: Add exclusion patterns to security scanner invocation

**\_Prompt**:

```
Add exclusion patterns to security scanner in check-agent.md.

Current: Security scanner runs on all files, creating noise from test fixtures
Expected: Exclude tests, docs, and config files

Add --exclude flags to the security scanner command:
--exclude "**/*.test.ts"
--exclude "**/*.spec.ts"
--exclude "**/test/**"
--exclude "**/docs/**"
--exclude "**/*.config.{js,ts}"

Update the security-scanner sub-agent description to document these exclusions.
```

### Task 2.4: Add Missing Test Coverage in Code Validator

**File**: `.claude/agents/check-agent.md` (code-validator section)
**Severity**: Major
**Issue**: Missing build verification, integration tests, and regression tests
**Fix Required**: Add comprehensive test coverage steps

**\_Prompt**:

```
Add missing test coverage to code-validator in check-agent.md.

Current: Basic unit tests only
Expected: Build verification, integration tests, regression tests

Add these validation steps:
1. Build verification: pnpm build (ensure no build errors)
2. Integration tests: pnpm test:integration (if integration tests exist)
3. Regression tests: Check that existing functionality still works
4. Coverage threshold: Warn if coverage drops below 70%

Update the code-validator sub-agent prompt to include these steps.
```

---

## Phase 3: Minor Fixes - Batch by Pattern (18)

### Task 3.1: Add Language Identifiers to Code Blocks (MD040)

**Files**: 8 files with missing language identifiers
**Severity**: Minor (bulk fix)
**Pattern**: Code blocks without language specified

**Files to fix**:

1. `.claude/agents/docs-agent.md`
2. `.claude/agents/eval-agent.md`
3. `.claude/agents/check-agent.md` (type-checker section)
4. `.claude/agents/check-agent.md` (lint-checker section)
5. `.claude/agents/check-agent.md` (dependency-analyzer section)
6. `.claude/docs/rules/methodology.md`

**\_Prompt**:

````
Fix MD040 linting errors by adding language identifiers to code blocks.

Files affected:
- .claude/agents/docs-agent.md
- .claude/agents/eval-agent.md
- .claude/agents/check-agent.md (3 sections: type-checker, lint-checker, dependency-analyzer)
- .claude/docs/rules/methodology.md

For each file:
1. Find code blocks with triple backticks but no language identifier
2. Add appropriate language: ```bash, ```typescript, ```markdown, ```json
3. Use ```bash for shell commands, ```typescript for code, ```markdown for examples

Verify with: npx markdownlint-cli2 "**/*.md"
````

### Task 3.2: Add Blank Lines Around Tables (MD058)

**Files**: 3 files with table formatting issues
**Severity**: Minor (bulk fix)
**Pattern**: Missing blank lines before/after tables

**Files to fix**:

1. `.claude/agents/git-agent.md` (pr-agent section)
2. `.claude/commands/commands.md` (2 tables)

**\_Prompt**:

```
Fix MD058 linting errors by adding blank lines around tables.

Files affected:
- .claude/agents/git-agent.md (pr-agent section)
- .claude/commands/commands.md (2 tables)

For each table:
1. Ensure blank line BEFORE table
2. Ensure blank line AFTER table
3. Tables use | header | format

Example:
Text before table.

| Column 1 | Column 2 |
| -------- | -------- |
| Value    | Value    |

Text after table.

Verify with: npx markdownlint-cli2 "**/*.md"
```

### Task 3.3: Remove Placeholder Variables

**File**: `.claude/commands/mode.md`
**Severity**: Minor
**Issue**: Contains $ARGUMENTS placeholder that should be removed or documented

**\_Prompt**:

```
Remove or document $ARGUMENTS placeholder in mode.md.

Current: Line contains $ARGUMENTS with no explanation
Expected: Either remove if unused, or document what it represents

If the placeholder is:
- Unused: Remove the line entirely
- Used by CLI: Document it clearly with example values
- Template variable: Show example of proper usage

Update the file to remove ambiguity.
```

### Task 3.4: Fix Undefined Function Reference

**File**: `.claude/skills/routing/SKILL.md`
**Severity**: Minor
**Issue**: References askForClarification() which is not defined in scope

**\_Prompt**:

```
Fix undefined function reference in routing/SKILL.md.

Current: References askForClarification() without definition
Expected: Either define the function or use a built-in approach

Options:
1. If this should be a helper function, define it in the skill
2. If this is meant to be a response to user, replace with direct message
3. If this is from another module, import it properly

Choose the appropriate fix based on the context where it's used.
```

### Task 3.5: Add Bounds Check for Array Access

**File**: `.claude/skills/progress/SKILL.md`
**Severity**: Minor
**Issue**: subAgentIndex may be undefined, needs guard clause

**\_Prompt**:

```
Add bounds check for subAgentIndex in progress/SKILL.md.

Current: subAgentIndex used without checking if defined
Expected: Guard against undefined/null before array access

Add guard clause:
if (typeof subAgentIndex !== 'number' || subAgentIndex < 0) {
  // Handle invalid index case
}

Or use optional chaining if appropriate: subAgents?.[subAgentIndex]

Prevent potential runtime errors from undefined array access.
```

---

## Phase 4: Quick Win Minor Fixes (remaining minor items)

### Task 4.1: Additional Minor Fixes

**Severity**: Minor (individual items, fix if quick)

1. **check-agent.md security section**: Consider excluding node_modules from scans
2. **pr-agent.md**: Fix typo or unclear wording (if present)
3. **Various agent files**: Remove any remaining TODO/FIXME comments if resolved

**\_Prompt**:

```
Review and fix remaining minor issues in agent files.

Quick fixes only:
1. Add node_modules to security scanner exclusions if not present
2. Fix any typos or unclear wording flagged by CodeRabbit
3. Remove resolved TODO/FIXME comments

Skip if fix requires significant refactoring.
```

---

## Phase 5: Trivial (Skip Unless Quick Win)

**Trivial items (7 comments)**: Edge cases, nitpicks, style preferences
**Decision**: Skip unless fix takes < 30 seconds
**Examples**:

- "Consider adding error message here" (already clear)
- "Could use const instead of let" (style preference)
- "Might want to handle edge case X" (extremely rare scenario)

**Rationale**: Focus on functional correctness and major quality issues first.

---

## Execution Order

```
1. Task 1.1 (Critical path fix)
2. Tasks 2.1-2.4 (Major functionality fixes)
3. Task 3.1 (Bulk linting - MD040)
4. Task 3.2 (Bulk linting - MD058)
5. Tasks 3.3-3.5 (Individual minor fixes)
6. Task 4.1 (Quick wins only)
7. Skip Phase 5 entirely
```

## Success Criteria

- [ ] Critical path normalization works on Windows
- [ ] Agent routing uses correct array format
- [ ] Command list matches PR objectives
- [ ] Security scanner excludes noise sources
- [ ] Code validator includes comprehensive checks
- [ ] All MD040 and MD058 linting errors resolved
- [ ] No undefined variables or functions
- [ ] Markdownlint passes: `npx markdownlint-cli2 "**/*.md"`

## Testing Commands

```bash
# Verify fixes
node .claude/scripts/hooks/pre-tool-use-task-enforcement.cjs
node .claude/scripts/hooks/command-mode-detect.cjs
npx markdownlint-cli2 "**/*.md"
pnpm lint
pnpm typecheck
pnpm test
```
