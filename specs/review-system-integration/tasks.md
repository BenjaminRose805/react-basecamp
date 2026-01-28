# Review System Integration - Tasks

## Task Summary

| ID   | Description                                     | Complexity | Dependencies | Status  |
| ---- | ----------------------------------------------- | ---------- | ------------ | ------- |
| T001 | Refactor user-prompt-review.cjs to context-only | Medium     | -            | Pending |
| T002 | Create user-prompt-ship.cjs hook                | Medium     | -            | Pending |
| T003 | Update settings.json to register ship hook      | Small      | T002         | Pending |
| T004 | Update ship.md to document ship gate            | Small      | T002         | Pending |
| T005 | Update git-agent.md to include state check      | Small      | T002         | Pending |
| T006 | Test full flow (/review → /ship integration)    | Large      | T001-T005    | Pending |

---

## T001: Refactor user-prompt-review.cjs to Context-Injection Only

### Complexity

**Medium** (requires architectural refactoring, not just feature addition)

### Dependencies

None (foundational change)

### Files Affected

- `.claude/scripts/hooks/user-prompt-review.cjs` (primary change)
- `.claude/commands/review.md` (will consume new context format)

### Description

Refactor the review hook from direct execution pattern to context-injection pattern, following user-prompt-start.cjs as a reference.

**Current State:**

- Hook executes all 4 loops directly using execSync
- No preview/confirmation flow
- Violates CLAUDE.md delegation rule

**Target State:**

- Hook detects /review command
- Gathers context (files, scope, options)
- Logs context using logContext()
- No execution (command handles that)

### \_Prompt

```
**Role:** You are a code refactoring sub-agent specializing in hook architecture.

**Task:** Refactor `.claude/scripts/hooks/user-prompt-review.cjs` to follow context-injection pattern.

**Context:**
- Reference pattern: `.claude/scripts/hooks/user-prompt-start.cjs`
- Current hook executes review loops directly (WRONG)
- Target: detect command → gather context → logContext() → exit

**Changes Required:**

1. **Remove direct execution:**
   - Remove all execSync() calls to loop scripts
   - Remove result aggregation logic
   - Remove display logic

2. **Add context detection:**
   - Parse user message for /review command
   - Extract scope parameter (e.g., /review scope=changed)
   - Extract loop options if provided
   - Detect file patterns if specified

3. **Add context gathering:**
   - Get changed files from git (if scope=changed)
   - Count files to review
   - Determine which loops to run (default: all 4)
   - Build context object

4. **Add context injection:**
   - Use logContext() to inject review metadata
   - Include: command, scope, files, loops, options
   - Format matches pattern from user-prompt-start.cjs

**Restrictions:**
- NO execution logic in hook (only detection + context)
- NO sub-agent spawning in hook
- Follow existing hook patterns in codebase
- Maintain compatibility with existing /review usage
- No external dependencies beyond existing helpers

**Success Criteria:**
- Hook detects /review command correctly
- Hook gathers file list and scope
- Hook logs context for command consumption
- Hook exits without executing review
- Zero execSync calls to review scripts
- Code style matches user-prompt-start.cjs

**Validation:**
Run /review command and verify:
1. Hook injects context (check logs)
2. No loops execute from hook
3. Command receives context properly
```

---

## T002: Create user-prompt-ship.cjs Hook

### Complexity

**Medium** (new file, but clear requirements and pattern)

### Dependencies

None (can be developed in parallel with T001)

### Files Affected

- `.claude/scripts/hooks/user-prompt-ship.cjs` (new file)
- `.claude/skills/code-review/loop-state.json` (read only)

### Description

Create new hook to enforce ship gate by reading loop-state.json and validating review status before /ship command executes.

**Responsibilities:**

1. Detect /ship command
2. Read loop-state.json
3. Validate state existence
4. Check commit staleness
5. Check ship_allowed flag
6. Log gate result (blocked or approved)

### \_Prompt

````
**Role:** You are a gate enforcement sub-agent specializing in validation hooks.

**Task:** Create `.claude/scripts/hooks/user-prompt-ship.cjs` to enforce ship gate.

**Context:**
- State file: `.claude/skills/code-review/loop-state.json`
- Schema: { ship_allowed, head_commit, blockers, loop_N_passed }
- Pattern reference: Other user-prompt-*.cjs hooks

**Implementation Requirements:**

1. **Command Detection:**
   - Detect /ship command in user message
   - Handle variations (/ship, /ship --force, etc.)
   - Exit early if not a ship command

2. **State File Reading:**
   - Path: `.claude/skills/code-review/loop-state.json`
   - Handle missing file gracefully (block by default)
   - Handle corrupted JSON (block with error)
   - Parse state object

3. **Validation Checks (in order):**

   a) **State Existence:**
   - If no state file: block with "No review state found"
   - Suggest running /review

   b) **Commit Staleness:**
   - Get current HEAD: `git rev-parse HEAD`
   - Compare to state.head_commit
   - If different: block with "Review state is stale"
   - Show both commits in message

   c) **Ship Allowed Flag:**
   - Check state.ship_allowed === true
   - If false: block with "Review found issues"
   - Include blockers array in context
   - Show which loops failed

4. **Context Logging:**

   **If Blocked:**
   ```javascript
   logContext('Ship gate: BLOCKED', {
     blocked: true,
     reason: '...',
     state_commit: state.head_commit,
     current_commit: currentHead,
     blockers: state.blockers,
     suggestion: 'Run /review to resolve issues'
   });
````

**If Approved:**

```javascript
logContext("Ship gate: APPROVED", {
  blocked: false,
  reviewed_commit: state.head_commit,
  all_loops_passed: true,
});
```

**Restrictions:**

- NO git operations (read-only git rev-parse allowed)
- NO modification of state file
- NO execution of /ship logic (just validate)
- Handle all error cases gracefully
- Clear error messages for each failure mode

**Success Criteria:**

- Hook detects /ship command correctly
- Missing state file blocks ship
- Stale commit blocks ship with both SHAs shown
- Failed review (ship_allowed=false) blocks ship
- Approved review allows ship to proceed
- All error messages are clear and actionable
- No crashes on corrupted/missing files

**Validation:**
Test scenarios:

1. /ship with no state file → blocked
2. /ship with stale state → blocked + commit details
3. /ship with failed loops → blocked + blocker list
4. /ship with all loops passed → approved
5. /ship with corrupted JSON → blocked + error

```

---

## T003: Update settings.json to Register Ship Hook

### Complexity
**Small** (single file, simple addition)

### Dependencies
- T002 (hook must exist first)

### Files Affected
- `.claude/settings.json`

### Description

Register the new user-prompt-ship.cjs hook in settings.json so it runs on every user prompt before /ship command executes.

### _Prompt

```

**Role:** You are a configuration management sub-agent.

**Task:** Register `user-prompt-ship.cjs` hook in `.claude/settings.json`.

**Context:**

- Hook file: `.claude/scripts/hooks/user-prompt-ship.cjs`
- Hook type: userPrompt (runs before command execution)
- Must run BEFORE ship.md sees the command

**Changes Required:**

Find the hooks configuration in `.claude/settings.json`:

```json
{
  "hooks": {
    "userPrompt": [
      ".claude/scripts/hooks/user-prompt-start.cjs",
      ".claude/scripts/hooks/user-prompt-review.cjs"
    ]
  }
}
```

Add the ship hook to the array:

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

**Restrictions:**

- Maintain existing hook order
- Use relative path from project root
- Preserve JSON formatting
- No other changes to settings.json

**Success Criteria:**

- Hook appears in userPrompt array
- Path is correct (matches other hooks)
- JSON is valid
- Hook runs when /ship is invoked

**Validation:**
Run /ship command and verify ship hook executes (check logs).

```

---

## T004: Update ship.md to Document Ship Gate

### Complexity
**Small** (documentation update)

### Dependencies
- T002 (hook must exist to document)

### Files Affected
- `.claude/commands/ship.md`

### Description

Update the /ship command documentation to explain the ship gate behavior, how to handle blocked state, and what to do when approved.

### _Prompt

```

**Role:** You are a documentation sub-agent specializing in command specifications.

**Task:** Update `.claude/commands/ship.md` to document ship gate integration.

**Context:**

- Ship gate implemented in user-prompt-ship.cjs
- Command receives blocked/approved status via logContext
- Must handle both cases appropriately

**Documentation Sections to Add/Update:**

1. **Add MANDATORY Section (at top, after title):**

```markdown
## MANDATORY: Check Ship Gate

The user-prompt-ship.cjs hook has validated review state before this command executes.

**If context shows `blocked: true`:**

- Display: "🚫 Ship gate: BLOCKED"
- Show reason and blocker details from context
- Suggest running /review to resolve issues
- EXIT without performing git operations

**If context shows `blocked: false` or no gate info:**

- Display: "✅ Ship gate: APPROVED" (if approved)
- Proceed to git operations via git-agent.md
```

2. **Update Workflow Section:**

Add gate check as first step before git operations:

```markdown
## Workflow

1. **Gate Check:** Review ship gate status from context
   - If blocked: Show blockers and exit
   - If approved: Proceed to step 2

2. **Delegate to Git Agent:** Spawn git-agent sub-agent via Task tool
   - Task handles commit, push, PR creation
   - Follow git-agent.md instructions
```

3. **Add Troubleshooting Section:**

```markdown
## Troubleshooting

### Ship Blocked: No Review State

**Cause:** No loop-state.json found
**Solution:** Run /review before shipping

### Ship Blocked: Stale Review

**Cause:** Review is for a different commit
**Solution:** Run /review on current HEAD

### Ship Blocked: Failed Loops

**Cause:** Review found issues (see blockers)
**Solution:** Fix issues, run /review again
```

**Restrictions:**

- Follow existing ship.md structure
- Use consistent markdown formatting
- Keep delegation pattern (Task tool for git-agent)
- No execution logic in command (just delegation)

**Success Criteria:**

- Gate check documented as MANDATORY first step
- Both blocked and approved paths explained
- Troubleshooting covers all gate failure modes
- Clear user actions for each scenario
- Maintains consistency with other command docs

**Validation:**

- Markdown renders correctly
- Instructions are actionable
- Covers all gate states

```

---

## T005: Update git-agent.md to Include State Check

### Complexity
**Small** (documentation update)

### Dependencies
- T002 (hook must exist to document)

### Files Affected
- `.claude/agents/git-agent.md`

### Description

Update git-agent.md to document that ship gate validation happens BEFORE git operations, and how to handle the gate result.

### _Prompt

```

**Role:** You are an agent specification sub-agent.

**Task:** Update `.claude/agents/git-agent.md` to document ship gate integration.

**Context:**

- Ship gate runs in user-prompt-ship.cjs hook
- Validation happens BEFORE git-agent receives control
- Agent should respect gate results and not bypass

**Documentation Sections to Add/Update:**

1. **Add Ship Gate Section (after responsibilities, before workflows):**

```markdown
## Ship Gate Integration

When invoked via /ship command:

**Gate Validation (Pre-Execution):**
The user-prompt-ship.cjs hook validates review state BEFORE this agent executes:

- Checks loop-state.json exists
- Validates commit is current (not stale)
- Verifies ship_allowed === true

**Agent Behavior:**

- If context shows `blocked: true`, DO NOT proceed with git operations
- If approved or no gate info, proceed normally
- Never bypass the gate (do not ignore blocked status)

**State File Reference:**

- Location: `.claude/skills/code-review/loop-state.json`
- Schema: { ship_allowed, head_commit, blockers, loop_N_passed }
- Managed by: code-review skill (4-loop system)
```

2. **Update Ship Workflow Section:**

Add gate respect as first step:

```markdown
## Ship Workflow

1. **Respect Gate:** Check context for gate result
   - If blocked: Explain to user, exit without git ops
   - If approved: Proceed to step 2

2. **Commit Changes:** Spawn commit sub-agent
   - Review git status
   - Stage relevant files
   - Generate commit message
   - Execute commit

3. **Push to Remote:** Spawn push sub-agent
   - Determine remote branch
   - Push changes
   - Handle conflicts

4. **Create PR (if needed):** Spawn PR sub-agent
   - Generate PR title/description
   - Create PR via gh CLI
   - Link to issues if applicable
```

**Restrictions:**

- Maintain existing agent structure
- Don't duplicate ship.md content (reference it)
- Keep delegation patterns (Task tool usage)
- No execution logic in docs (patterns only)

**Success Criteria:**

- Gate integration documented clearly
- Agent workflow respects gate results
- Reference to state file location/schema
- Maintains consistency with git-agent patterns

**Validation:**

- Documentation is clear and accurate
- Aligns with actual hook behavior
- References are correct

```

---

## T006: Test Full Flow (/review → /ship Integration)

### Complexity
**Large** (comprehensive end-to-end testing with multiple scenarios)

### Dependencies
- T001 (review hook refactored)
- T002 (ship hook created)
- T003 (hook registered)
- T004 (ship.md updated)
- T005 (git-agent.md updated)

### Files Affected
- All files from T001-T005 (validation only, no changes)
- `.claude/skills/code-review/loop-state.json` (for test setup)

### Description

Comprehensive testing of the refactored review system and ship gate integration across multiple scenarios to ensure all requirements are met.

### _Prompt

```

**Role:** You are a QA validation sub-agent specializing in integration testing.

**Task:** Validate complete /review and /ship integration across all scenarios.

**Context:**

- Review system refactored to use context-injection + agent delegation
- Ship gate enforces review requirements via state file
- Multiple edge cases must be tested

**Test Scenarios:**

### Scenario 1: Fresh Review → Successful Ship

**Setup:**

- Clean branch with changes
- No existing loop-state.json

**Actions:**

1. Run /review
2. Verify preview displayed (loops, scope, resources)
3. Confirm execution
4. Verify sub-agents spawn (not direct execution)
5. Check loop-state.json created with ship_allowed=true
6. Run /ship
7. Verify ship gate approves
8. Verify git operations proceed

**Expected Results:**

- ✅ Preview shows before execution
- ✅ Confirmation required
- ✅ Task tool used (no execSync in hook)
- ✅ State file created correctly
- ✅ Ship gate allows
- ✅ Git operations succeed

---

### Scenario 2: Failed Review → Blocked Ship

**Setup:**

- Branch with intentional issues (e.g., lint errors, failing tests)

**Actions:**

1. Run /review
2. Let loops execute
3. Check loop-state.json has ship_allowed=false
4. Check blockers array populated
5. Run /ship
6. Verify ship gate blocks
7. Verify blockers displayed
8. Verify git operations NOT executed

**Expected Results:**

- ✅ Review detects issues
- ✅ ship_allowed=false in state
- ✅ Blockers listed clearly
- ✅ Ship blocked with clear message
- ✅ No git operations attempted

---

### Scenario 3: Stale Review State

**Setup:**

- Existing loop-state.json from previous commit
- New commit on HEAD (different SHA)

**Actions:**

1. Check loop-state.json head_commit
2. Make new commit (change HEAD)
3. Run /ship (without re-running /review)
4. Verify ship gate detects staleness
5. Verify both commits shown in error
6. Verify git operations NOT executed

**Expected Results:**

- ✅ Gate detects commit mismatch
- ✅ Error shows old vs new commit
- ✅ Suggests re-running /review
- ✅ Ship blocked
- ✅ No git operations

---

### Scenario 4: Missing Review State

**Setup:**

- Clean branch with changes
- No loop-state.json exists

**Actions:**

1. Run /ship directly (without /review)
2. Verify ship gate blocks
3. Verify message explains no review state
4. Verify suggests running /review
5. Verify git operations NOT executed

**Expected Results:**

- ✅ Gate blocks on missing state
- ✅ Clear message about missing review
- ✅ Actionable suggestion (/review)
- ✅ No git operations

---

### Scenario 5: Hook Context Injection

**Setup:**

- Clean branch with changes

**Actions:**

1. Run /review with custom scope: /review scope=src/
2. Verify hook detects command
3. Verify hook logs context (check terminal/logs)
4. Verify hook exits without execution
5. Verify command receives context
6. Verify preview uses context (shows src/ scope)

**Expected Results:**

- ✅ Hook detects /review command
- ✅ logContext() called with correct data
- ✅ No execSync in hook logs
- ✅ Command sees context
- ✅ Preview reflects custom scope

---

### Scenario 6: Corrupted State File

**Setup:**

- Create invalid JSON in loop-state.json

**Actions:**

1. Run /ship
2. Verify ship gate handles corruption gracefully
3. Verify error message is clear
4. Verify suggests manual check
5. Verify git operations NOT executed

**Expected Results:**

- ✅ No crash on bad JSON
- ✅ Clear error about corruption
- ✅ Ship blocked
- ✅ Suggests checking state file

---

### Scenario 7: Partial Loop Execution

**Setup:**

- Manually edit loop-state.json
- Set loop_1_passed=true, loop_2_passed=false

**Actions:**

1. Run /ship
2. Verify gate shows which loops failed
3. Verify blockers displayed
4. Verify ship blocked

**Expected Results:**

- ✅ Gate shows loop status
- ✅ Clear indication Loop 2 failed
- ✅ Blockers from failed loop shown
- ✅ Ship blocked

---

**Validation Checklist:**

For each scenario, verify:

- [ ] Behavior matches requirements (REQ-001 to REQ-006)
- [ ] Error messages are clear and actionable
- [ ] No direct execution in hooks (check logs)
- [ ] Agent delegation via Task tool works
- [ ] State file updated correctly
- [ ] Ship gate enforces correctly

**Success Criteria:**

- All 7 scenarios pass validation
- Zero direct executions in hooks (confirmed via logs)
- Preview/confirmation flow works for /review
- Ship gate blocks all invalid cases
- Ship gate allows only valid cases
- Error messages match design spec
- No crashes or undefined behavior

**Restrictions:**

- Test on actual codebase (not mocks)
- Use real git operations
- Verify state file contents after each test
- Check hook execution logs
- No modifications to production code (test only)

**Deliverable:**
Create test report with:

- Scenario results (pass/fail)
- Screenshots/logs of key validations
- Any issues discovered
- Recommendations for fixes (if needed)

```

---

## Task Dependencies Graph

```

T001 (Refactor review hook) T002 (Create ship hook)
↓ ↓
| T003 (Register hook)
| ↓
| T004 (Update ship.md)
| ↓
+-------------------+----------T005 (Update git-agent.md)
↓
T006 (Integration testing)

```

**Critical Path:** T002 → T003 → T006 (ship gate must exist before testing)

**Parallel Work:** T001 can be done simultaneously with T002-T005

---

## Implementation Order

**Phase 1: Core Refactoring (Foundation)**
1. T001: Refactor review hook (enables proper delegation)

**Phase 2: Gate Creation (Enforcement)**
2. T002: Create ship hook (implements gate)
3. T003: Register hook (activates gate)

**Phase 3: Documentation (Guidance)**
4. T004: Update ship.md (user-facing docs)
5. T005: Update git-agent.md (agent-facing docs)

**Phase 4: Validation (Confidence)**
6. T006: End-to-end testing (proves correctness)

---

## Estimation

| Task | Effort | Reason                                          |
| ---- | ------ | ----------------------------------------------- |
| T001 | 2h     | Refactoring existing code, pattern is clear     |
| T002 | 2h     | New file, multiple validation checks            |
| T003 | 15m    | Simple JSON edit                                |
| T004 | 30m    | Documentation update                            |
| T005 | 30m    | Documentation update                            |
| T006 | 3h     | 7 scenarios, thorough validation                |
| **Total** | **8.25h** | **~1 day of focused work** |

---

## Risk Mitigation

### Risk 1: Breaking Existing /review Usage
**Mitigation:** T001 maintains backward compatibility, T006 validates

### Risk 2: Ship Hook False Positives
**Mitigation:** T006 Scenario 1 tests valid ship, Scenario 3-4 test edge cases

### Risk 3: State File Race Conditions
**Mitigation:** Use atomic writes, document state file locking if needed

### Risk 4: Hook Order Dependencies
**Mitigation:** T003 ensures correct hook registration order

---

## Success Metrics

After completing all tasks:
- ✅ Zero direct executions in hooks (measured by code audit + logs)
- ✅ 100% of /review commands show preview (measured by T006)
- ✅ 100% of /ship commands check gate (measured by T006)
- ✅ All 7 test scenarios pass (measured by T006 report)
- ✅ Documentation accurate and complete (reviewed in T004, T005)
```
