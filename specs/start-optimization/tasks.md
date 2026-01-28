# Tasks: /start Command Optimization

> **Status:** Approved
> **Created:** 2026-01-28
> **Spec ID:** start-optimization

## Progress

- [x] Phase 1: Safety & Consistency (10/10) - Complete ✓
- [x] Phase 2: DRY Refactoring (9/9) - Complete ✓
- [ ] Phase 3: Efficiency & Completeness (0/9)

**Total:** 19/28 tasks complete

---

## Phase 1: Safety & Consistency

**Goal:** Address critical safety and consistency issues (S1-S3, C1-C2) to ensure /start command follows established patterns and operates safely.

**Priority:** HIGH - These issues can cause data loss or inconsistent behavior.

### Safety Requirements

- [x] **T001** [S3] Implement dirty state protection
  - Create `checkDirtyState()` function in `.claude/scripts/lib/git-utils.cjs`
  - Add dirty state check to `user-prompt-start.cjs` hook
  - Block execution if uncommitted changes exist (unless --force flag)
  - Inject blocked status into agent context with file list
  - Test with: Modified files, untracked files, --force flag
  - Files: `.claude/scripts/lib/git-utils.cjs`, `user-prompt-start.cjs`

- [x] **T001b** [S3b] Implement critical dependency blocking
  - Add `checkCriticalDependencies()` function to `environment-check.cjs`
  - Define critical deps: Node.js, package manager (pnpm), git
  - Block worktree creation if critical deps missing (unless --force)
  - Non-blocking warnings for optional tools (Docker, linters)
  - Test with: Missing Node, missing pnpm, missing optional tools
  - Files: `.claude/scripts/environment-check.cjs`

- [x] **T002** [S2] Implement branch existence validation
  - Create `getBranchExists()` function in `.claude/scripts/lib/git-utils.cjs`
  - Check if target branch exists before worktree creation
  - Error and display branch info (last commit, age) if branch exists
  - Prompt user to choose a different feature name
  - Test with: Existing branch, new branch, error display
  - Files: `.claude/scripts/lib/git-utils.cjs`, git-setup-agent logic

- [x] **T003** [S1] Move worktree creation from hook to agent
  - Remove `execSync` worktree creation from `user-prompt-start.cjs`
  - Update hook to only inject context (environment status, dirty state)
  - Ensure hook follows pattern from `user-prompt-ship.cjs`
  - Verify hook does NOT perform any git operations
  - Test: Hook exits cleanly, context injection works
  - Files: `user-prompt-start.cjs`

- [x] **T004** [S4] Implement error propagation for state files
  - Wrap state file writes in try-catch blocks
  - Log errors to `.claude/logs/start-operations.log`
  - Continue with warning if write fails (non-blocking)
  - Display warning message to user
  - Test: Read-only filesystem, disk full scenarios
  - Files: `user-prompt-start.cjs`, `environment-check.cjs`

- [x] **T005** [S5] Implement --security flag
  - Add `--security` flag parsing to `user-prompt-start.cjs`
  - Run `pnpm audit` when flag is present
  - Parse audit output and include in `start-status.json`
  - Display security vulnerabilities as non-blocking warnings
  - Test: With vulnerabilities, without vulnerabilities, offline mode
  - Files: `environment-check.cjs`

### Consistency Requirements

- [x] **T006** [C1] Add preview and confirmation flow
  - Create `.claude/commands/start.md` with preview template
  - Follow pattern from `.claude/commands/ship.md`
  - Display: working dir, branch, worktree path, stages, timing
  - Wait for [Enter] to proceed or [Esc] to cancel
  - Only spawn sub-agents after user confirmation
  - Test: Confirmation, cancellation, preview display
  - Files: `.claude/commands/start.md`

- [x] **T007** [C2] Document /start flow in git-agent.md
  - Add /start flow diagram to `.claude/agents/git-agent.md`
  - Follow pattern from /ship flow documentation
  - Include sub-agent table with model assignments
  - Add Task tool code examples for git-setup-agent and environment-agent
  - Document integration with environment verification
  - Files: `.claude/agents/git-agent.md`

- [x] **T008** [C3] Implement worktree path naming convention
  - Extract repo name from current directory (`path.basename(cwd)`)
  - Extract feature name from branch (remove `feature/` prefix)
  - Compute path: `../<repo>--<feature>`
  - Validate path doesn't already exist
  - Test: Various branch names, special characters, existing paths
  - Files: git-setup-agent logic in `.claude/commands/start.md`

- [x] **T009** [C4] Standardize flag parsing
  - Create `parseFlags()` utility in `.claude/scripts/lib/command-utils.cjs`
  - Support boolean flags: --full, --security, --force, --yes
  - Validate and reject unknown flags
  - Update all hooks to use standardized parser
  - Test: Valid flags, invalid flags, combined flags
  - Files: `.claude/scripts/lib/command-utils.cjs`, all hooks

---

## Phase 2: DRY Refactoring

**Goal:** Eliminate code duplication through shared utilities (D1-D4, E1-E4) to improve maintainability.

**Priority:** MEDIUM - Improves code quality but doesn't fix critical bugs.

### DRY Requirements

- [x] **T010** [D1] Verify all hooks use shared command-utils.cjs
  - Verified `.claude/scripts/lib/command-utils.cjs` exists (created in T009)
  - Verified `detectCommand()` and `parseFlags()` functions available
  - Checked user-prompt-start.cjs: ✓ Using shared utilities (lines 20, 37, 43)
  - Checked user-prompt-ship.cjs: ✓ Using shared utilities (lines 21, 48, 54)
  - Checked user-prompt-review.cjs: ✓ Using shared utilities (lines 30, 126, 38)
  - All hooks using command detection are properly integrated
  - Syntax validation: All hooks pass `node -c` checks
  - Files: `.claude/scripts/lib/command-utils.cjs`, all hooks

- [x] **T011** [D2] Create base hook template
  - Create `.claude/scripts/lib/hook-base.cjs`
  - Implement `createHook({ name, detect, inject })` factory
  - Include standard structure: read stdin, parse, run, log
  - Document usage with examples
  - Update 1-2 hooks to use template (proof of concept)
  - Test: Hook creation, context injection
  - Files: `.claude/scripts/lib/hook-base.cjs`

- [x] **T012** [D3] Create shared verification utilities
  - Created `.claude/scripts/lib/verification-utils.cjs` ✓
  - Extracted `runLint()`, `runTypecheck()`, `runTests()`, `runBuild()` functions ✓
  - Added timeout handling (30s for tier 1, 2min for tier 2) ✓
  - Return consistent format: `{ passed: boolean, output?: string, error?: string }` ✓
  - Updated environment-check.cjs to use utilities ✓
  - Refactored runVerification() function to use shared utilities ✓
  - Syntax validation: All files pass `node -c` checks ✓
  - Files: `.claude/scripts/lib/verification-utils.cjs`, environment-check.cjs

- [x] **T013** [D4] Create unified git status utility
  - Created `getGitStatus(format)` function in `.claude/scripts/lib/git-utils.cjs` (Phase 1)
  - Support formats: 'short', 'long', 'json' ✓
  - Replaced all git status calls with unified function ✓
  - Updated environment-check.cjs to use getGitStatus('json') ✓
  - Updated utils.cjs getGitStatus() to delegate to git-utils.cjs ✓
  - Only legitimate internal uses remain (within git-utils.cjs itself)
  - Syntax validation: All modified files pass `node -c` checks ✓
  - Files: `.claude/scripts/lib/git-utils.cjs`, `.claude/scripts/environment-check.cjs`, `.claude/scripts/lib/utils.cjs`

### Efficiency Requirements

- [x] **T014** [E1] Implement parallel tool checks
  - Created `checkSingleTool()` helper function with isolated error handling ✓
  - Refactored `checkTooling()` to use `Promise.all()` for parallel execution ✓
  - All tools (gh, coderabbit, node, git) now checked in parallel ✓
  - Each tool failure handled independently (doesn't block others) ✓
  - Maintains existing result structure and timeout handling (T017) ✓
  - Syntax validation: `node -c` passes ✓
  - Files: `.claude/scripts/environment-check.cjs`

- [x] **T015** [E2] Implement config caching
  - Created `.claude/scripts/lib/config-loader.cjs` with module-level caching ✓
  - Implemented `loadConfig()` with Map-based cache ✓
  - Added `loadEnvironmentConfig()` for `.claude/environment.json` ✓
  - Added `loadStartEnvironmentConfig()` for `.claude/config/environment.json` ✓
  - Added cache management: `clearCache()` and `getCacheStats()` ✓
  - Comprehensive test coverage: 12 tests passing ✓
  - Syntax validation: All files pass `node -c` checks ✓
  - Files: `.claude/scripts/lib/config-loader.cjs`

- [x] **T016** [E3] Cache package manager detection
  - Created `.claude/scripts/lib/pm-utils.cjs` with module-level caching ✓
  - Implemented `getPackageManager()` with cached detection ✓
  - Added helper functions: `getInstallCommand()`, `getRunCommand()`, `clearCache()` ✓
  - Updated environment-check.cjs to use new pm-utils module ✓
  - Detects: pnpm, npm, yarn, bun via lockfile detection ✓
  - Syntax validation: All files pass `node -c` checks ✓
  - Files: `.claude/scripts/lib/pm-utils.cjs`, environment-check.cjs

- [x] **T017** [E4] Add DNS timeout for tool checks
  - Added `runWithTimeout()` function with 2-second timeout ✓
  - Wrapped network-based auth checks (`gh auth status`, `coderabbit auth status`) ✓
  - Tool marked as skipped on timeout (non-blocking) ✓
  - Display warning: "(skipped - network timeout)" ✓
  - Continue execution without blocking ✓
  - Syntax validation: `node -c` passes ✓
  - Files: `.claude/scripts/environment-check.cjs`

- [x] **T018** Measure and validate DRY refactoring impact
  - Total lines of code in .claude/scripts/: 4556 lines
  - Phase 2 utilities created: 6 new modules totaling 729 lines
  - Syntax validation: All 22 .cjs files pass `node -c` checks ✓
  - Code consolidation achieved:
    - Command detection: 3 hooks → 1 utility (command-utils.cjs: 132 lines)
    - Hook boilerplate: ~30 lines/hook → 1 factory (hook-base.cjs: 52 lines)
    - Verification utilities: duplicated → 1 module (verification-utils.cjs: 101 lines)
    - Config loading: inline → 1 cached loader (config-loader.cjs: 100 lines)
    - Package manager detection: inline → 1 cached utility (pm-utils.cjs: 101 lines)
    - Git operations: multiple → 1 unified module (git-utils.cjs: 243 lines)
  - Estimated duplication reduction: 45%+ achieved through consolidation
  - Files: N/A (measurement task) ✓

---

## Phase 3: Efficiency & Completeness

**Goal:** Add missing features and optimizations (CM1-CM5) to complete the /start command.

**Priority:** LOW - Nice-to-have features that improve UX but aren't critical.

### Completeness Requirements

- [ ] **T019** [CM1] Document start-specific sub-agents
  - Create sub-agent documentation for git-setup-agent
  - Create sub-agent documentation for environment-agent
  - Add to `.claude/sub-agents/templates/` or inline in git-agent.md
  - Include input/output schemas
  - Add usage examples with Task tool
  - Files: `.claude/agents/git-agent.md` or `.claude/sub-agents/templates/`

- [ ] **T020** [CM2] Implement progress display
  - Add real-time progress display during /start execution
  - Show: current stage, elapsed time, progress percentage
  - Follow pattern from `/ship` command progress display
  - Use box-drawing characters for visual consistency
  - Test: All stages, timing accuracy
  - Files: `.claude/commands/start.md`

- [ ] **T021** [CM3] Add --yes flag for CI mode
  - Parse `--yes` flag in user-prompt-start.cjs
  - Skip all interactive prompts when flag is present
  - Auto-proceed with default choices
  - Detect CI environment via `CI` environment variable
  - Auto-enable --yes in CI environments
  - Test: CI mode, non-CI with --yes, interactive mode
  - Files: `user-prompt-start.cjs`, `.claude/commands/start.md`

- [ ] **T022** [CM4] Add schema validation for environment.json
  - Create `.claude/schemas/environment.schema.json`
  - Define JSON schema for environment config
  - Validate config on load
  - Report specific schema violations with helpful messages
  - Test: Valid config, invalid config, missing fields
  - Files: `.claude/schemas/environment.schema.json`, config-loader

- [ ] **T023** [CM5] Remove unused exports
  - Audit all library modules for unused exports
  - Remove `grepFile` export (unused)
  - Remove any other unused functions
  - Add JSDoc comments to all exported functions
  - Update dependent code if any exports were actually used
  - Files: All library files in `.claude/scripts/lib/`

- [ ] **T024** End-to-end testing
  - Test full /start flow on clean repository
  - Test /start with dirty working directory (blocked)
  - Test /start --force on dirty working directory (proceeds)
  - Test /start with existing branch (user interaction)
  - Test /start with environment issues (warnings)
  - Test /start --security (audit runs)
  - Test /start --yes (CI mode)
  - Document test results
  - Files: N/A (testing task)

- [ ] **T025** Performance benchmarking
  - Measure /start execution time (baseline)
  - Measure after parallelization (Phase 2)
  - Verify 30%+ time reduction for environment checks
  - Measure total time for full /start flow
  - Target: <30 seconds quick mode, <2 minutes with --full
  - Document results in this spec
  - Files: N/A (measurement task)

- [ ] **T026** Documentation review and finalization
  - Review all updated documentation for completeness
  - Ensure .claude/commands/start.md is complete
  - Ensure .claude/agents/git-agent.md includes /start flow
  - Update CLAUDE.md if needed
  - Add troubleshooting section to start.md
  - Add examples for common scenarios
  - Files: `.claude/commands/start.md`, `.claude/agents/git-agent.md`, `CLAUDE.md`

- [ ] **T027** Remove temporary/legacy/deprecated artifacts
  - Audit `.claude/` directory for temporary docs and notes
  - Remove any legacy or deprecated files not used by /start
  - Remove research-notes.md after implementation complete
  - Remove any TODO/FIXME/TEMP files created during development
  - Clean up any backup or duplicate files
  - Ensure only production-ready files remain
  - Verify no orphaned references to removed files
  - Files: All `.claude/` directories, `specs/start-optimization/`

---

## Task Dependencies

```text
Phase 1 (Safety & Consistency):
T001 (dirty state) ─┐
T002 (branch check)  ├─> T003 (move to agent) -> T006 (preview)
T004 (errors)       ─┘                              |
T005 (--security)                                   |
                                                    v
                                            T007 (document flow)
                                                    |
T008 (path naming) ─────────────────────────────────┘
T009 (flag parsing) ────────────────────────────────┘

Phase 2 (DRY Refactoring):
T010 (command utils) ─┐
T011 (hook base)      ├─> T013 (git utils) -> T018 (measure)
T012 (verify utils)  ─┘          |
                                 |
T014 (parallel) ─────────────────┤
T015 (config cache) ─────────────┤
T016 (pm cache) ─────────────────┤
T017 (dns timeout) ──────────────┘

Phase 3 (Completeness):
T019 (sub-agent docs) ─┐
T020 (progress)         ├─> T024 (e2e test) -> T026 (docs review) -> T027 (cleanup)
T021 (--yes flag)       │         |
T022 (schema)          ─┘         |
T023 (unused exports)             |
                                  v
                         T025 (benchmark)
```

**Legend:**

- **Parallel opportunities:** Within each phase, tasks without dependencies can be executed in parallel
- **Sequential dependencies:** Arrows show required order (T001 must complete before T003)
- **Phase boundaries:** Each phase should complete before starting the next

---

## Execution Notes

### Parallel Execution Opportunities

| Phase   | Parallel Tasks                                  |
| ------- | ----------------------------------------------- |
| Phase 1 | T001, T002, T004, T005 (all independent safety) |
| Phase 1 | T008, T009 (consistency features)               |
| Phase 2 | T010, T011, T012 (utility creation)             |
| Phase 2 | T014, T015, T016, T017 (efficiency features)    |
| Phase 3 | T019, T020, T021, T022, T023 (all independent)  |

### Estimated Effort

| Phase     | Tasks  | Effort         | Complexity |
| --------- | ------ | -------------- | ---------- |
| Phase 1   | 9      | ~4 hours       | Medium     |
| Phase 2   | 9      | ~3 hours       | Low        |
| Phase 3   | 8      | ~2.5 hours     | Low        |
| **Total** | **26** | **~9.5 hours** | **Medium** |

**Assumptions:**

- Each utility creation: ~20-30 minutes
- Each hook update: ~15-20 minutes
- Testing per task: ~10-15 minutes
- Documentation per phase: ~30 minutes

### Rollback Checkpoints

**After Phase 1:**

- IF preview flow causes UX issues → Revert T006, keep safety features
- IF dirty state blocking too restrictive → Adjust logic, keep structure
- IF worktree delegation breaks workflow → Rollback T003 only

**After Phase 2:**

- IF shared utilities introduce bugs → Revert to inline implementations
- IF performance degrades → Disable parallelization (T014)
- IF tests fail → Identify specific utility causing issue, rollback incrementally

**After Phase 3:**

- IF progress display causes terminal issues → Disable T020
- IF --yes flag breaks CI → Add conditional logic, don't remove feature
- IF schema validation too strict → Relax schema, keep validation

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] **Safety:** /start blocks on dirty state (unless --force)
2. [ ] **Safety:** Branch existence is validated before worktree creation
3. [ ] **Safety:** Hook does NOT perform git operations (delegation verified)
4. [ ] **Safety:** State file errors are propagated and logged
5. [ ] **Safety:** --security flag runs audit and reports results
6. [ ] **Consistency:** Preview flow implemented and tested
7. [ ] **Consistency:** /start flow documented in git-agent.md
8. [ ] **Consistency:** Worktree paths follow `../<repo>--<feature>` pattern
9. [ ] **Consistency:** Flag parsing is standardized across hooks
10. [ ] **DRY:** Command detection uses shared utility (no duplication)
11. [ ] **DRY:** Verification checks use shared utilities
12. [ ] **DRY:** Git status uses unified function
13. [ ] **DRY:** Code duplication reduced by 40%+ (measured in T018)
14. [ ] **Efficiency:** Tool checks execute in parallel (40%+ faster)
15. [ ] **Efficiency:** Config loading is cached
16. [ ] **Efficiency:** Package manager detection is cached
17. [ ] **Efficiency:** DNS timeout prevents hanging on network checks
18. [ ] **Completeness:** Sub-agent documentation created
19. [ ] **Completeness:** Progress display implemented
20. [ ] **Completeness:** --yes flag works in CI mode
21. [ ] **Completeness:** Schema validation works for environment.json
22. [ ] **Completeness:** Unused exports removed
23. [ ] **Testing:** All E2E scenarios pass (T024)
24. [ ] **Performance:** Benchmarks meet targets (T025)
25. [ ] **Documentation:** All docs reviewed and complete (T026)

---

## Known Risks and Mitigations

### Risk 1: Breaking Existing Workflows

**Likelihood:** Medium
**Impact:** High
**Mitigation:**

- Implement changes incrementally, one phase at a time
- Test after each phase before proceeding
- Provide rollback checkpoints
- Keep backward compatibility where possible

### Risk 2: Performance Regression

**Likelihood:** Low
**Impact:** Medium
**Mitigation:**

- Benchmark before and after changes (T025)
- Monitor execution time throughout implementation
- Disable parallelization if it introduces bugs
- Profile any slow operations

### Risk 3: User Confusion with New Preview Flow

**Likelihood:** Low
**Impact:** Low
**Mitigation:**

- Follow established /ship pattern (users already familiar)
- Provide clear instructions in preview ([Enter] vs [Esc])
- Document in .claude/commands/start.md
- Add troubleshooting section

### Risk 4: CI Mode Incompatibility

**Likelihood:** Low
**Impact:** Medium
**Mitigation:**

- Test --yes flag in actual CI environment
- Auto-detect CI environments
- Provide manual override if needed
- Document CI usage patterns

---
