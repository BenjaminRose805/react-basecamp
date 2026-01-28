# PR #12 Reconciliation Tasks

**Source:** CodeRabbit PR #12 Review (64 actionable comments)
**Created:** 2026-01-27
**Status:** Draft

---

## Priority 1: Runtime Stability (Hook Null Checks)

### Task 1.1: Fix readStdinJson() null check in compaction-tracker.cjs

**Files:** `.claude/scripts/hooks/compaction-tracker.cjs`

**Issue:** readStdinJson() can return null, but code assumes valid object

**Changes Required:**

- Add null check after readStdinJson() call
- Return early or use fallback if stdin is null
- Prevent runtime errors when stdin stream fails

**\_Prompt:**

```
Fix null safety in compaction-tracker.cjs:

1. Read .claude/scripts/hooks/compaction-tracker.cjs
2. Locate readStdinJson() call
3. Add null check: if (!parsed) { return; }
4. Ensure graceful handling when stdin is unavailable
5. Verify no other null-unsafe patterns exist in file
```

---

### Task 1.2: Validate commandMode.agents array in pre-tool-use-task-enforcement.cjs

**Files:** `.claude/scripts/hooks/pre-tool-use-task-enforcement.cjs`

**Issue:** agents array may be empty or missing, causing runtime errors

**Changes Required:**

- Add array existence and bounds check before access
- Validate commandMode.agents?.length > 0
- Handle edge case where agents array is undefined

**\_Prompt:**

```
Fix array validation in pre-tool-use-task-enforcement.cjs:

1. Read .claude/scripts/hooks/pre-tool-use-task-enforcement.cjs
2. Find all commandMode.agents access points
3. Add guards: if (!commandMode.agents?.length) { return; }
4. Prevent index out of bounds errors
5. Test edge cases where agents array is empty/missing
```

---

### Task 1.3: Fix state cleanup in command-mode-detect.cjs

**Files:** `.claude/scripts/hooks/command-mode-detect.cjs`

**Issue:** State persists incorrectly between tool calls

**Changes Required:**

- Review state management lifecycle
- Add proper cleanup logic for command mode transitions
- Ensure state resets when appropriate

**\_Prompt:**

```
Fix state management in command-mode-detect.cjs:

1. Read .claude/scripts/hooks/command-mode-detect.cjs
2. Identify state variables that persist across calls
3. Add cleanup logic for mode transitions
4. Ensure state resets when command completes
5. Verify no stale state leaks between commands
```

---

### Task 1.4: Add bounds checks in progress/SKILL.md

**Files:** `.claude/skills/progress/SKILL.md`

**Issue:** currentStage index access without bounds validation, division by zero risk

**Changes Required:**

- Add currentStage bounds check (0 <= index < stages.length)
- Add division by zero guard for progress calculations
- Validate stage array is non-empty before calculations

**\_Prompt:**

```
Fix bounds validation in progress skill:

1. Read .claude/skills/progress/SKILL.md
2. Find currentStage index usage in code blocks
3. Add: if (currentStage < 0 || currentStage >= stages.length) { /* error */ }
4. Add division by zero guard: if (stages.length === 0) { return 0; }
5. Ensure all array access is bounds-safe
```

---

## Priority 2: Agent Naming Consolidation

### Task 2.1: Rename eval-\* references to domain-researcher

**Files:**

- `.claude/agents/eval-agent.md`
- `.claude/skills/eval-harness/eval/README.md`

**Issue:** Old naming (eval-researcher, eval-analyzer) conflicts with consolidated names

**Changes Required:**

- Replace "eval-researcher" → "domain-researcher"
- Replace "eval-analyzer" → "domain-researcher"
- Update Task tool examples with new names
- Ensure consistency with .claude/sub-agents/lib/README.md

**\_Prompt:**

```
Consolidate eval-* agent naming:

1. Read .claude/sub-agents/lib/README.md to confirm canonical names
2. Read .claude/agents/eval-agent.md
3. Replace all "eval-researcher" → "domain-researcher"
4. Replace all "eval-analyzer" → "domain-researcher"
5. Read .claude/skills/eval-harness/eval/README.md
6. Apply same replacements
7. Verify Task tool examples use correct subagent_type
```

---

### Task 2.2: Rename plan-\* references to domain-writer

**Files:**

- `.claude/agents/plan-agent.md`

**Issue:** Old naming (plan-researcher) conflicts with consolidated names

**Changes Required:**

- Replace "plan-researcher" → "domain-researcher"
- Update Task tool subagent_type in examples
- Ensure consistency with consolidated naming scheme

**\_Prompt:**

```
Consolidate plan-* agent naming:

1. Read .claude/agents/plan-agent.md
2. Replace "plan-researcher" → "domain-researcher"
3. Update Task tool examples to use subagent_type: "domain-researcher"
4. Verify no other plan-* variants remain
5. Check consistency with other agent files
```

---

### Task 2.3: Rename requirement-analyzer to domain-researcher

**Files:**

- `.claude/agents/eval-agent.md`

**Issue:** requirement-analyzer is legacy name for domain-researcher

**Changes Required:**

- Replace "requirement-analyzer" → "domain-researcher"
- Update documentation strings
- Ensure Task tool examples use correct subagent_type

**\_Prompt:**

```
Replace requirement-analyzer naming:

1. Read .claude/agents/eval-agent.md
2. Find all "requirement-analyzer" references
3. Replace with "domain-researcher"
4. Update Task tool subagent_type values
5. Verify consistency across file
```

---

## Priority 3: Grep Exclusion Standardization

### Task 3.1: Add config file exclusions to security-scanner.md

**Files:** `.claude/sub-agents/profiles/security-scanner.md`

**Issue:** Grep examples don't exclude config files, causing noise in results

**Changes Required:**

- Add --glob exclusions for common config files
- Match patterns from quality-checker.md
- Exclude: package*.json, tsconfig*.json, \*.config.{js,ts,cjs,mjs}

**\_Prompt:**

```
Standardize grep exclusions in security-scanner:

1. Read .claude/sub-agents/profiles/quality-checker.md for exclusion patterns
2. Read .claude/sub-agents/profiles/security-scanner.md
3. Add --glob exclusions to all Grep examples:
   - "!package*.json"
   - "!tsconfig*.json"
   - "!*.config.{js,ts,cjs,mjs}"
4. Ensure consistency with quality-checker patterns
5. Update all code blocks with Grep tool usage
```

---

### Task 3.2: Standardize grep exclusions in quality-checker.md

**Files:** `.claude/sub-agents/profiles/quality-checker.md`

**Issue:** Some Grep examples missing exclusions used elsewhere in file

**Changes Required:**

- Ensure all Grep examples have consistent --glob exclusions
- Verify config file patterns match security-scanner
- Make exclusion list reusable across all examples

**\_Prompt:**

```
Verify grep exclusion consistency in quality-checker:

1. Read .claude/sub-agents/profiles/quality-checker.md
2. Extract all Grep tool examples
3. Verify each has --glob exclusions
4. Ensure patterns match: !package*.json, !tsconfig*.json, !*.config.*
5. Standardize any missing or inconsistent exclusions
```

---

## Priority 4: Tool Permission Conflicts

### Task 4.1: Fix Task usage example in writer.md

**Files:** `.claude/sub-agents/profiles/writer.md`

**Issue:** Example shows Task tool usage but writer profile denies Task tool access

**Changes Required:**

- Remove Task tool example from writer.md, OR
- Update writer profile to allow Task tool (if delegation is intended)
- Clarify writer scope: direct implementation vs delegation

**\_Prompt:**

```
Resolve Task tool conflict in writer profile:

1. Read .claude/sub-agents/profiles/writer.md
2. Find "DENIED_TOOLS" section
3. Find Task tool usage examples
4. Decide: Remove examples OR allow Task tool
5. If removing: Delete Task tool example blocks
6. If allowing: Remove Task from denied tools, add usage guidelines
7. Update documentation to clarify delegation policy
```

---

### Task 4.2: Fix context7 reference in domain-writer.md

**Files:** `.claude/sub-agents/templates/domain-writer.md`

**Issue:** Template references context7 tool but denies mcp**context7**\* tools

**Changes Required:**

- Remove context7 references from examples, OR
- Allow mcp**context7**\* tools if documentation lookup is intended
- Clarify documentation access strategy for writers

**\_Prompt:**

```
Resolve context7 tool conflict in domain-writer:

1. Read .claude/sub-agents/templates/domain-writer.md
2. Find "DENIED_TOOLS" section (check for mcp__context7__*)
3. Find context7 tool references in examples
4. Decide: Remove references OR allow context7 tools
5. If removing: Delete context7 usage examples, suggest alternatives
6. If allowing: Remove mcp__context7__* from denied tools
7. Update documentation access strategy
```

---

## Priority 5: MD040 Bulk Fixes (Linting)

### Task 5.1: Add language identifiers to code blocks (Batch 1)

**Files:**

- `README.md`
- `.claude/commands/guide.md`
- `.claude/commands/implement.md`
- `.claude/docs/context-loading.md`

**Issue:** ~40+ code blocks missing language identifiers (MD040)

**Changes Required:**

- Add language identifiers to all code fences
- Use: bash, typescript, javascript, markdown, json, yaml
- Ensure consistent formatting

**\_Prompt:**

````
Fix MD040 in documentation batch 1:

1. Read each file in batch:
   - README.md
   - .claude/commands/guide.md
   - .claude/commands/implement.md
   - .claude/docs/context-loading.md

2. For each file:
   - Find code blocks: ``` without language
   - Determine language from content
   - Add identifier: ```bash, ```typescript, etc.
   - Preserve all other formatting

3. Common patterns:
   - Shell commands → bash
   - Import statements → typescript
   - JSON examples → json
   - YAML config → yaml

4. Use Edit tool for each replacement
````

---

### Task 5.2: Add language identifiers to code blocks (Batch 2)

**Files:**

- `.claude/sub-agents/profiles/code-validator.md`
- `.claude/docs/QUICK-REFERENCE.md`
- `.claude/sub-agents/profiles/code-analyzer.md`

**Issue:** Multiple code blocks missing language identifiers

**Changes Required:**

- Add language identifiers to all code fences
- Match patterns from batch 1
- Ensure consistency across all files

**\_Prompt:**

```
Fix MD040 in documentation batch 2:

1. Read each file in batch:
   - .claude/sub-agents/profiles/code-validator.md
   - .claude/docs/QUICK-REFERENCE.md
   - .claude/sub-agents/profiles/code-analyzer.md

2. Apply same MD040 fixes as batch 1
3. Add language identifiers to all code blocks
4. Use Edit tool for each replacement
5. Verify no blocks remain without identifiers
```

---

### Task 5.3: Add language identifiers to code blocks (Batch 3)

**Files:**

- `.claude/sub-agents/profiles/domain-researcher.md`
- `.claude/sub-agents/profiles/git-content-generator.md`
- `.claude/sub-agents/profiles/parallel-executor.md`

**Issue:** Final batch of MD040 violations

**Changes Required:**

- Add language identifiers to all code fences
- Complete MD040 remediation across codebase
- Final consistency verification

**\_Prompt:**

````
Fix MD040 in documentation batch 3:

1. Read each file in batch:
   - .claude/sub-agents/profiles/domain-researcher.md
   - .claude/sub-agents/profiles/git-content-generator.md
   - .claude/sub-agents/profiles/parallel-executor.md

2. Apply same MD040 fixes as previous batches
3. Add language identifiers to all code blocks
4. Use Edit tool for each replacement
5. Final verification: grep for ``` without language across all fixed files
````

---

## Summary

**Total Tasks:** 14
**Priority 1 (Runtime):** 4 tasks
**Priority 2 (Naming):** 3 tasks
**Priority 3 (Grep):** 2 tasks
**Priority 4 (Permissions):** 2 tasks
**Priority 5 (Linting):** 3 tasks

**Estimated Effort:**

- Priority 1-2: 1-2 hours (critical fixes)
- Priority 3-4: 30-60 minutes (standardization)
- Priority 5: 1-2 hours (bulk edits)

**Next Steps:**

1. Execute Priority 1 tasks first (runtime stability)
2. Execute Priority 2-4 in parallel (no dependencies)
3. Execute Priority 5 last (cosmetic, can be batched)
4. Run validation: `pnpm lint && pnpm typecheck`
5. Create PR with fixes
