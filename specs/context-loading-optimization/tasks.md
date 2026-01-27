# Context Loading Optimization Tasks

## Overview

Implementation broken into 4 phases with clear dependencies. Each phase is independently testable and can be validated before proceeding.

**Total Estimated Effort**: 4-6 hours

## Phase 1: Create Sub-Agent Rule Bundles

**Goal**: Create role-specific rule bundles for sub-agents without changing loading behavior

**Duration**: 1-2 hours

**Dependencies**: None

### Task 1.1: Create Sub-Agent Rule Injector Utility

**File**: `.claude/sub-agents/lib/inject-rules.cjs`

**Steps**:

1. Create CommonJS utility module (project uses ES modules, this needs CJS for agent templates)
2. Define role-to-rules mapping:
   ```javascript
   const roleRuleMap = {
     "code-researcher": ["patterns.md", "coding-style.md"],
     "code-writer": ["patterns.md", "coding-style.md"],
     "ui-researcher": ["patterns.md", "coding-style.md"],
     "ui-builder": ["patterns.md", "coding-style.md"],
     "plan-researcher": ["methodology.md"],
     "plan-writer": ["methodology.md"],
     "quality-validator": ["testing.md"],
     "quality-checker": ["testing.md"],
     "git-executor": ["git-workflow.md"],
     "security-scanner": ["security.md"],
     "pr-reviewer": ["git-workflow.md", "security.md"],
   };
   ```
3. Export `injectRulesForRole(role)` function:
   - Read rule files from `.claude/rules/`
   - Combine with separators (`---`)
   - Return formatted string for Task prompt injection
4. Calculate and log token counts per role
5. Validate token counts within targets (2,000-4,000 per role)

**Validation**:

- Import and call function: `injectRulesForRole('code-writer')`
- Verify rule content returned
- Check token counts in output
- Manually review rule content for completeness

**Acceptance Criteria**:

- [ ] Utility module exports injectRulesForRole function
- [ ] All 11 sub-agent roles mapped to rules
- [ ] Token counts within targets (2,000-4,000)
- [ ] No duplicate content within role bundles
- [ ] All implementation rules covered by at least one role

### Task 1.2: Update Sub-Agent Templates

**Files**: `.claude/sub-agents/templates/*.md`

**Steps**:

1. Update each sub-agent template to use `injectRulesForRole()`
2. Add rule injection to Task prompt construction:
   ```javascript
   const { injectRulesForRole } = require("../lib/inject-rules.cjs");
   const prompt = basePrompt + injectRulesForRole("code-writer");
   ```
3. Update templates for all 11 sub-agent roles
4. Ensure rule injection happens before Task tool call

**Validation**:

- Template contains rule injection call
- Role name matches roleRuleMap
- Rule injection occurs in correct location

**Acceptance Criteria**:

- [ ] All 11 sub-agent templates updated
- [ ] Rule injection added to prompt construction
- [ ] No syntax errors in templates
- [ ] Templates still valid after update

### Task 1.3: Test Rule Injection

**File**: Manual testing

**Steps**:

1. Create test agent that spawns code-writer sub-agent
2. Verify sub-agent receives patterns.md and coding-style.md
3. Check token count of injected rules (~3,200 tokens)
4. Test with multiple sub-agent roles
5. Verify no duplicate rule content

**Validation**:

- Sub-agent receives correct rules for role
- Token counts within targets
- Rules properly formatted in prompt

**Acceptance Criteria**:

- [ ] Rule injection works for all roles tested
- [ ] Token counts verified (2,000-4,000)
- [ ] No errors during injection
- [ ] Rules readable in sub-agent context

**Phase 1 Completion Criteria**:

- Sub-agent rule injector utility created
- All 11 sub-agent templates updated with rule injection
- Rule injection tested and working
- Token counts logged and within targets (2,000-4,000 per role)
- No changes to orchestrator loading yet (safe checkpoint)

---

## Phase 2: Update Orchestrator Loading

**Goal**: Add orchestrator rule loading hook and reduce redundant injections

**Duration**: 1-2 hours

**Dependencies**: Phase 1 complete

### Task 2.1: Create Orchestrator Rule Loader Hook

**File**: `.claude/scripts/hooks/load-orchestrator-rules.cjs`

**Steps**:

1. Create CommonJS hook script
2. Import utilities: `const { logContext, readStdinJson } = require('../lib/utils.cjs');`
3. Read command state from `.claude/state/command-mode.json`
4. If no command active, exit 0 (no injection)
5. Check if command needs orchestrator rules:
   ```javascript
   const commands = ["plan", "implement", "ship"];
   if (!commands.includes(state.command)) {
     process.exit(0); // Not a command that needs agents.md
   }
   ```
6. Load agents.md and inject via stdout:
   ```javascript
   const agentsRules = fs.readFileSync(".claude/rules/agents.md", "utf-8");
   logContext(
     `\n<orchestrator-rules>\n${agentsRules}\n</orchestrator-rules>\n`
   );
   ```
7. Add error handling (log to stderr, exit 0 on failure - don't block)
8. Add token count logging for debugging (~2,700 tokens)

**Validation**:

- Test manually: Create command-mode.json with `{"command": "plan"}`
- Run: `echo '{}' | node .claude/scripts/hooks/load-orchestrator-rules.cjs`
- Verify agents.md content in stdout

**Acceptance Criteria**:

- [ ] Hook reads command state correctly
- [ ] Loads agents.md only (~2,700 tokens)
- [ ] Injects to stdout (not stderr)
- [ ] Error handling doesn't block execution
- [ ] Works for all 3 commands (plan, implement, ship)

### Task 2.2: Register Orchestrator Rule Loader in settings.json

**File**: `.claude/settings.json`

**Steps**:

1. Find `UserPromptSubmit` hook section
2. Add new hook AFTER `command-mode-detect.cjs`:
   ```json
   {
     "type": "command",
     "command": "node .claude/scripts/hooks/load-orchestrator-rules.cjs"
   }
   ```
3. Order matters: command-mode-detect → load-orchestrator-rules
4. Preserve existing hooks

**Validation**:

- settings.json is valid JSON
- Hook order correct
- No syntax errors

**Acceptance Criteria**:

- [ ] Hook registered in settings.json
- [ ] Appears after command-mode-detect
- [ ] JSON valid
- [ ] Other hooks preserved

### Task 2.3: Update user-prompt-submit Hook (Eliminate All Injection)

**File**: `.claude/scripts/hooks/user-prompt-submit.cjs`

**Steps**:

1. Remove ALL stdout injection code
2. Remove git status injection (query via Bash when needed)
3. Remove CONTEXT.md injection (read via Read tool when needed)
4. Remove TODO.md injection (read via Read tool when needed)
5. Keep command detection logic (stderr logging only)
6. Add comment explaining zero-injection approach

**Validation**:

- Run hook manually
- Verify NO stdout output (0 tokens)
- Verify command detection still works (stderr only)

**Acceptance Criteria**:

- [ ] All stdout injection removed
- [ ] Git status queried on demand, not injected
- [ ] CONTEXT.md read on demand, not injected
- [ ] TODO.md read on demand, not injected
- [ ] Command detection preserved (stderr only)
- [ ] Comments explain zero-injection approach

### Task 2.4: Update session-start Hook (Eliminate Injection)

**File**: `.claude/scripts/hooks/session-start.cjs`

**Steps**:

1. Remove ALL stdout injection code
2. Remove git status injection
3. Remove CONTEXT.md injection
4. Remove TODO.md injection
5. Add stderr logging only (user-visible status messages)
6. Add comment explaining zero-injection approach

**Validation**:

- Run hook manually
- Verify NO stdout output (0 tokens to context)
- Verify stderr messages appear (user visibility)

**Acceptance Criteria**:

- [ ] All stdout injection removed
- [ ] Git status queried on demand, not injected
- [ ] CONTEXT.md read on demand, not injected
- [ ] TODO.md read on demand, not injected
- [ ] Stderr logging for user visibility only
- [ ] Comments explain zero-injection approach

**Phase 2 Completion Criteria**:

- Orchestrator rule loader hook working
- Registered in settings.json
- Orchestrators load agents.md only (~2,700 tokens)
- user-prompt-submit ALL injection eliminated
- session-start ALL injection eliminated
- Token injection per prompt reduced from ~550 to 0 tokens (100% reduction)

---

## Phase 3: Slim CLAUDE.md

**Goal**: Remove duplicated content from CLAUDE.md, reducing from ~8,600 to ~3,000 tokens

**Duration**: 1-2 hours

**Dependencies**: Phase 2 complete (bundles loading correctly)

### Task 3.1: Identify Content to Remove

**File**: `CLAUDE.md` (analysis only)

**Steps**:

1. Create checklist of sections to remove:
   - [ ] TDD workflow details (lines ~220-280 in methodology section)
   - [ ] Model selection tables (lines ~550-650 in model selection section)
   - [ ] Commit message format examples (lines ~380-420 in git workflow section)
   - [ ] Code quality limits table (lines ~280-320 in coding style section)
   - [ ] Security checklist details (lines ~470-530 in security section)
   - [ ] Testing requirements details (lines ~320-370 in testing section)
   - [ ] Detailed agent workflows (lines ~150-200 in agents section)
2. Mark sections with `<!-- REMOVE: moved to {rule}.md bundle -->`
3. Do NOT remove yet (just mark)

**Validation**:

- All marked sections have corresponding content in rule bundles
- No unique content will be lost

**Acceptance Criteria**:

- [ ] All duplicate sections identified
- [ ] Marked with comments
- [ ] Verified present in bundles
- [ ] Total marked content ~5,600 tokens

### Task 3.2: Create Slim CLAUDE.md Draft

**File**: `CLAUDE.md.new` (temporary)

**Steps**:

1. Copy current CLAUDE.md to CLAUDE.md.new
2. Remove marked sections
3. Add rule loading explanation section:

   ```markdown
   ## Rules and Methodology

   Detailed rules are loaded intelligently:

   - **Orchestrators** (top-level agents) load only agents.md for delegation rules
   - **Sub-agents** get role-specific rules injected when spawned:
     - Researchers/writers: patterns.md, coding-style.md
     - Quality validators: testing.md
     - Git executors: git-workflow.md
     - Security scanners: security.md

   This architecture ensures rules are loaded only when needed, reducing orchestrator token overhead by 79%.

   All rules are available in `.claude/rules/` for reference.
   ```

4. Replace detailed sections with summaries + references:
   - TDD: "See methodology.md for full TDD workflow (loaded by plan/code/ui sub-agents)"
   - Model selection: "See performance.md for model assignment rules"
   - Commit format: "See git-workflow.md for commit conventions (loaded by git sub-agents)"
   - Code quality: "See coding-style.md for ESLint limits (loaded by code/ui sub-agents)"
5. Keep essential navigation content:
   - Commands overview (6 commands)
   - Agent list (7 agents)
   - Tech stack
   - Project structure
   - MCP server table
   - File naming conventions

**Validation**:

- Count tokens in new file (use script or online tool)
- Target: ~3,000 tokens
- Ensure no broken links
- Verify all commands still referenced

**Acceptance Criteria**:

- [ ] New file created
- [ ] Duplicate content removed
- [ ] Rule bundle references added
- [ ] Essential navigation preserved
- [ ] Token count ~3,000 (±500)

### Task 3.3: Test Slim CLAUDE.md

**File**: Temporary swap for testing

**Steps**:

1. Backup current: `cp CLAUDE.md CLAUDE.md.backup`
2. Swap in new: `cp CLAUDE.md.new CLAUDE.md`
3. Start new Claude Code session
4. Run each command to verify functionality:
   - `/guide` - should show status
   - `/plan` - should load plan bundle
   - `/implement` - should load implement bundle
   - `/ship` - should load ship bundle
5. Check for missing information errors
6. Restore backup if issues found

**Validation**:

- All commands work
- No "missing information" errors
- Bundles load correctly
- User experience unchanged

**Acceptance Criteria**:

- [ ] All commands tested
- [ ] No functionality loss
- [ ] Bundles loading verified
- [ ] User experience acceptable

### Task 3.4: Finalize CLAUDE.md

**File**: `CLAUDE.md`

**Steps**:

1. If testing passed (Task 3.3):
   - Delete backup: `rm CLAUDE.md.backup`
   - Delete temp: `rm CLAUDE.md.new`
   - Commit new CLAUDE.md
2. If testing failed:
   - Restore backup: `cp CLAUDE.md.backup CLAUDE.md`
   - Document issues
   - Revise Task 3.2
3. Add migration notes to CONTEXT.md

**Validation**:

- Final CLAUDE.md committed
- Token count verified
- All commands working

**Acceptance Criteria**:

- [ ] CLAUDE.md finalized
- [ ] Token count ~3,000
- [ ] All tests passing
- [ ] Migration documented

**Phase 3 Completion Criteria**:

- CLAUDE.md reduced to ~3,000 tokens
- No functionality loss
- Orchestrators load agents.md only
- Sub-agents receive role-specific rules via injection
- Session start <5,000 tokens total

---

## Phase 4: Validation and Documentation

**Goal**: Verify token savings and document changes

**Duration**: 30 minutes - 1 hour

**Dependencies**: Phase 3 complete

### Task 4.1: Create Token Measurement Script

**File**: `.claude/scripts/measure-tokens.cjs`

**Steps**:

1. Create script to measure token consumption
2. Use simple heuristic: `chars / 4` (Claude's approx ratio)
3. Measure:
   - CLAUDE.md
   - Each rule bundle (plan, implement, ship)
   - session-start hook output
   - user-prompt-submit hook output
4. Calculate totals per command scenario
5. Output comparison table (before/after)

**Validation**:

- Run script: `node .claude/scripts/measure-tokens.cjs`
- Verify numbers match design targets

**Acceptance Criteria**:

- [ ] Script measures all context sources
- [ ] Outputs comparison table
- [ ] Targets met or explained
- [ ] Can run in CI

### Task 4.2: Add Token Measurement to CI

**File**: `.github/workflows/quality.yml` (or similar)

**Steps**:

1. Add job step: "Validate Token Budget"
2. Run: `pnpm build:bundles`
3. Run: `pnpm validate:bundles`
4. Run: `node .claude/scripts/measure-tokens.cjs`
5. Fail if token counts exceed targets by >10%

**Validation**:

- Push to CI
- Verify job runs
- Check thresholds enforced

**Acceptance Criteria**:

- [ ] CI job added
- [ ] Token validation runs
- [ ] Thresholds enforced
- [ ] Clear failure messages

### Task 4.3: Update Documentation

**Files**:

- `.claude/docs/context-loading.md` (new)
- `CONTEXT.md` (update)
- `.claude/sub-agents/QUICK-REFERENCE.md` (update)

**Steps**:

1. Create `.claude/docs/context-loading.md`:
   - Explain bundle system
   - Document token budgets
   - Show command-rule mapping
   - Troubleshooting guide
2. Update `CONTEXT.md`:
   - Add note about context optimization
   - Mention bundle system
   - Keep under 300 chars
3. Update `.claude/sub-agents/QUICK-REFERENCE.md`:
   - Note that bundles load automatically
   - Reference context-loading.md for details

**Validation**:

- Documentation accurate
- No dead links
- Under length limits

**Acceptance Criteria**:

- [ ] New doc created
- [ ] Existing docs updated
- [ ] All references valid
- [ ] Clear explanations

### Task 4.4: Final Token Budget Verification

**File**: Test session

**Steps**:

1. Start fresh Claude Code session
2. Measure session start tokens (should be ~3,175)
3. Run `/plan test-feature` command
4. Measure total tokens (should be <20,000)
5. Run `/implement` command
6. Measure total tokens (should be <24,000)
7. Run `/ship` command
8. Measure total tokens (should be <20,000)
9. Document actual measurements
10. Compare to targets from requirements.md

**Validation**:

- All commands under token targets
- Session start <5,000 tokens
- No functionality loss

**Acceptance Criteria**:

- [ ] Session start: <5,000 tokens ✓
- [ ] /plan total: <20,000 tokens ✓
- [ ] /implement total: <24,000 tokens ✓
- [ ] /ship total: <20,000 tokens ✓
- [ ] All commands functional ✓

**Phase 4 Completion Criteria**:

- Token measurements documented
- CI validation in place
- Documentation complete
- All targets met or explained
- Feature ready for production use

---

## Rollback Plan

If critical issues found at any phase:

### Phase 1 Rollback

- Remove inject-rules utility
- Revert sub-agent template changes from git
- No impact (injection not used in orchestrators yet)

### Phase 2 Rollback

- Remove load-orchestrator-rules hook from settings.json
- Restore user-prompt-submit.cjs from git
- Restore session-start.cjs from git
- Keep sub-agent rule injection (harmless)

### Phase 3 Rollback

- Restore CLAUDE.md from backup
- Keep hooks and sub-agent injection (harmless)
- Document issues for future attempt

### Phase 4 Rollback

- Remove CI checks
- Delete documentation
- Keep implementation (proven working)

---

## Post-Implementation Tasks

After all phases complete:

1. **Performance Monitoring**
   - Track token usage over 1 week
   - Identify any edge cases
   - Gather user feedback

2. **Optimization Opportunities**
   - Consider skill file compression (separate spec)
   - Consider sub-agent template consolidation (already done)
   - Consider dynamic bundle loading (future)

3. **Maintenance**
   - Add rule bundle regeneration to pre-commit hook
   - Schedule quarterly token budget review
   - Monitor for CLAUDE.md content creep

---

## Success Metrics

| Metric                    | Target  | How to Measure                    |
| ------------------------- | ------- | --------------------------------- |
| Session start tokens      | <5,000  | Run measure-tokens.cjs            |
| /plan total tokens        | <20,000 | Test session + measure            |
| /implement total tokens   | <24,000 | Test session + measure            |
| /ship total tokens        | <20,000 | Test session + measure            |
| Hook injection per prompt | 0       | Measure user-prompt-submit output |
| Zero functionality loss   | 100%    | Test all commands                 |
| Bundle generation time    | <1s     | Time build:bundles script         |
| CI validation time        | <10s    | Check CI job duration             |

---

## Dependencies Summary

| Phase   | Depends On | Blocks             |
| ------- | ---------- | ------------------ |
| Phase 1 | None       | Phase 2            |
| Phase 2 | Phase 1    | Phase 3            |
| Phase 3 | Phase 2    | Phase 4            |
| Phase 4 | Phase 3    | Production release |

Each phase has a clear completion checkpoint. Do not proceed to next phase until current phase validation passes.
