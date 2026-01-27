# Tasks: Sub-Agent Consolidation & Dynamic Sizing

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** sub-agent-consolidation

## Progress

- [ ] Phase 1: Create Consolidated Templates (7 tasks)
- [ ] Phase 2: Add Sizing Heuristics (1 task)
- [ ] Phase 3: Update plan-agent (1 task)
- [ ] Phase 4: Update code-agent (1 task)
- [ ] Phase 5: Update ui-agent (1 task)
- [ ] Phase 6: Update docs-agent (1 task)
- [ ] Phase 7: Update eval-agent (1 task)
- [ ] Phase 8: Update check-agent (1 task)
- [ ] Phase 9: Update git-agent (1 task)
- [ ] Phase 10: Remove Obsolete Templates (1 task)
- [ ] Phase 11: Update Documentation (2 tasks)
- [ ] Phase 12: Verification (2 tasks)

**Total:** 0/20 tasks complete

---

## Phase 1: Create Consolidated Templates

Create 7 new consolidated templates with mode parameter support.

### T001 [REQ-1.1, REQ-1.2, REQ-1.3] Create domain-researcher template

**File:** `.claude/sub-agents/templates/domain-researcher.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `domain-researcher` template that replaces 5 domain-specific researchers (plan, code, ui, docs, eval).

**Context:**

- Current 5 researchers are functionally identical except for search patterns
- All use: Read, Grep, Glob, mcp**cclsp**\*
- All output: JSON with decision (PROCEED/STOP/CLARIFY) and findings
- Model: Opus

**Requirements:**

1. Accept `mode` parameter: plan | code | ui | docs | eval
2. Validate mode parameter (error if invalid)
3. Use mode-specific search patterns:
   - plan: Search specs/, similar features
   - code: Search tRPC routers, Prisma models, API endpoints
   - ui: Search React components, hooks, UI patterns
   - docs: Search existing documentation
   - eval: Search eval suites, graders
4. Maintain identical behavior to current researchers
5. Include mode in all log messages for debugging

**Restrictions:**

- Do NOT change orchestrator logic
- Do NOT add new modes beyond the 5 specified
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates mode parameter
- [ ] All 5 modes have search patterns defined
- [ ] Output format matches current researchers
- [ ] Mode is logged for debugging
```

---

### T002 [REQ-2.1, REQ-2.2, REQ-2.3] Create domain-writer template

**File:** `.claude/sub-agents/templates/domain-writer.md`

**Effort:** Large

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `domain-writer` template that replaces 5 domain-specific writers (plan, code, ui, docs, eval).

**Context:**

- Current 5 writers differ in implementation patterns:
  - code: TDD (red-green-refactor), tRPC/Prisma patterns
  - ui: TDD (red-green-refactor), React/hooks patterns
  - docs: Markdown standards, no TDD
  - eval: EDD (evals before code), evaluation framework
  - plan: EARS format specs (When/While/The system shall)
- All use: Read, Write, Edit, Grep, Glob, Bash, mcp**cclsp**\*
- All output: JSON with status (complete/failed) and files_changed
- Model: Sonnet

**Requirements:**

1. Accept `mode` parameter: code | ui | docs | eval | plan
2. Validate mode parameter (error if invalid)
3. Use mode-specific patterns:
   - code: TDD workflow, backend patterns skill
   - ui: TDD workflow, frontend patterns skill
   - docs: Documentation standards
   - eval: EDD workflow, eval-harness skill
   - plan: EARS format, spec template
4. Maintain identical behavior to current writers
5. Include mode in all log messages

**Restrictions:**

- Do NOT skip TDD for code/ui modes
- Do NOT skip EARS format for plan mode
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates mode parameter
- [ ] All 5 modes have implementation patterns defined
- [ ] TDD enforced for code/ui modes
- [ ] EARS format enforced for plan mode
- [ ] Output format matches current writers
```

---

### T003 [REQ-3.1, REQ-3.2, REQ-3.3] Create quality-validator template

**File:** `.claude/sub-agents/templates/quality-validator.md`

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `quality-validator` template that replaces 5 domain validators.

**Context:**

- Current 5 validators are identical (domain-agnostic)
- All run: pnpm typecheck, pnpm test:run, pnpm build
- All output: JSON with status (PASS/FAIL) and check results
- Model: Haiku

**Requirements:**

1. NO mode parameter (domain-agnostic)
2. Run 3 checks: typecheck, tests, build
3. Collect errors from all checks
4. Output JSON with status and errors
5. Maintain identical behavior to current validators

**Restrictions:**

- Do NOT skip any of the 3 checks
- Do NOT add domain-specific logic
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] All 3 checks run (typecheck, tests, build)
- [ ] Errors collected from failed checks
- [ ] Output format matches current validators
```

---

### T004 [REQ-4.1, REQ-4.2, REQ-4.3] Create quality-checker template

**File:** `.claude/sub-agents/templates/quality-checker.md`

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `quality-checker` template that replaces 4 quality checkers (build, type, lint, test).

**Context:**

- Current 4 checkers just run a pnpm command and report output
- Used by check-agent for parallel validation
- Model: Haiku

**Requirements:**

1. Accept `check_type` parameter: build | type | lint | test | security
2. Validate check_type parameter (error if invalid)
3. Map check_type to pnpm command:
   - build → pnpm build
   - type → pnpm typecheck
   - lint → pnpm lint
   - test → pnpm test:run
   - security → pnpm audit (+ pattern checks)
4. Output JSON with check_type, status, output, duration_ms
5. Maintain identical behavior to current checkers

**Restrictions:**

- Do NOT run multiple checks (1 check per invocation)
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates check_type parameter
- [ ] All 5 check types have commands defined
- [ ] Duration tracked for performance monitoring
- [ ] Output format matches current checkers
```

---

### T005 [REQ-5.1] Create spec-analyzer template

**File:** `.claude/sub-agents/templates/spec-analyzer.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `spec-analyzer` template that replaces 3 plan analyzers (spec-analyzer, spec-reviewer, spec-formatter) and reconciliation-analyzer.

**Context:**

- spec-analyzer: Analyzes spec completeness and clarity
- spec-reviewer: Reviews spec against patterns
- spec-formatter: Formats spec to EARS standard
- reconciliation-analyzer: Analyzes CodeRabbit comments for action items
- Model: Opus

**Requirements:**

1. Accept `mode` parameter: analyze | review | format | reconcile
2. Validate mode parameter (error if invalid)
3. Use mode-specific analysis:
   - analyze: Check completeness (goal, scope, acceptance criteria)
   - review: Review against coding-standards, patterns
   - format: Ensure EARS format (When/While/The system shall)
   - reconcile: Parse CodeRabbit comments, extract action items
4. Output JSON with findings, recommendations, context_summary
5. Maintain identical behavior to current analyzers

**Restrictions:**

- Do NOT implement changes (analysis only)
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates mode parameter
- [ ] All 4 modes have analysis logic defined
- [ ] reconcile mode parses CodeRabbit comments correctly
- [ ] Output format matches current analyzers
```

---

### T006 [REQ-5.2] Create git-content-generator template

**File:** `.claude/sub-agents/templates/git-content-generator.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `git-content-generator` template that replaces change-analyzer, pr-analyzer, and content-generator.

**Context:**

- change-analyzer: Analyzes git diff, generates commit message
- pr-analyzer: Analyzes feature branch, generates PR description
- content-generator: General content generation for /ship
- Model: Sonnet

**Requirements:**

1. Accept `mode` parameter: commit | pr | general
2. Validate mode parameter (error if invalid)
3. Use mode-specific generation:
   - commit: Run git diff, analyze changes, generate conventional commit message
   - pr: Run git log, analyze feature, generate PR title + body
   - general: General content generation (fallback)
4. Output JSON with content_type, title, body, metadata
5. Maintain identical behavior to current generators

**Restrictions:**

- Do NOT execute git commands (analysis only)
- Do NOT change commit message format (conventional commits)
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates mode parameter
- [ ] commit mode generates conventional commit messages
- [ ] pr mode generates comprehensive PR descriptions
- [ ] Output format matches current generators
```

---

### T007 [REQ-5.3] Create code-analyzer template

**File:** `.claude/sub-agents/templates/code-analyzer.md`

**Effort:** Large

**\_Prompt:**

```markdown
**Role:** Template writer for sub-agent infrastructure

**Task:** Create a consolidated `code-analyzer` template that replaces workflow-analyzer, investigator, refactor-analyzer, and fix-investigator.

**Context:**

- workflow-analyzer: Analyzes spec content for routing decisions
- investigator: Investigates errors, runtime failures, test failures
- refactor-analyzer: Analyzes code for refactoring opportunities
- fix-investigator: Analyzes bug reports and error messages
- Model: Opus

**Requirements:**

1. Accept `mode` parameter: workflow | debug | refactor | fix
2. Validate mode parameter (error if invalid)
3. Use mode-specific analysis:
   - workflow: Parse spec, identify routing (code/ui/docs/eval)
   - debug: Read error messages, check logs, identify root cause
   - refactor: Analyze code smells, duplication, complexity
   - fix: Parse bug report, identify affected code, recommend fix
4. Output JSON with mode, analysis, recommendations, context_summary
5. Maintain identical behavior to current analyzers

**Restrictions:**

- Do NOT implement fixes (analysis only)
- Do NOT change output format (must be JSON)

**Success Criteria:**

- [ ] Template validates mode parameter
- [ ] All 4 modes have analysis logic defined
- [ ] workflow mode correctly identifies routing decisions
- [ ] debug mode reads error messages and logs
- [ ] Output format matches current analyzers
```

---

## Phase 2: Add Sizing Heuristics

Add dynamic sizing logic to shared utilities.

### T008 [REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4] Create sizing heuristics utility

**File:** `.claude/sub-agents/lib/sizing-heuristics.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Sub-agent infrastructure developer

**Task:** Create a reusable sizing heuristics utility that orchestrators can use to determine sub-agent count.

**Context:**

- Current system always spawns 3 sub-agents (hardcoded)
- Simple tasks waste context (1 file change doesn't need 3 agents)
- Complex tasks need more breakdown (20 files need >3 agents)

**Requirements:**

1. Create `determineSubAgentCount(context)` function
2. Accept context object with:
   - fileCount: number of files to change
   - taskCount: number of tasks from spec
   - moduleCount: number of modules affected
   - effort: "small" | "medium" | "large"
3. Use weighted heuristics:
   - File count: 40% weight
   - Task count: 30% weight
   - Module spread: 20% weight
   - Effort estimate: 10% weight
4. Return 1-7 sub-agents (cap at 7)
5. Log decision rationale to `.claude/logs/orchestrator-decisions.json`

**Restrictions:**

- Do NOT hardcode agent count
- Do NOT exceed 7 sub-agents (max)
- Do NOT return 0 (minimum is 1)

**Success Criteria:**

- [ ] Function accepts context object
- [ ] Heuristics produce reasonable counts (1-7)
- [ ] Decisions logged for tuning
- [ ] Examples match expected counts (see design.md)
```

---

## Phase 3: Update plan-agent

Update plan-agent orchestrator to use consolidated templates and dynamic sizing.

### T009 [REQ-7.4, REQ-8.2] Update plan-agent orchestrator

**File:** `.claude/agents/plan-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update plan-agent to use consolidated templates (domain-researcher, domain-writer, quality-validator) and dynamic sizing.

**Context:**

- Current plan-agent always spawns 3 sub-agents: plan-researcher, plan-writer, plan-validator
- New system should spawn 1-3 sub-agents based on complexity
- Simple specs (like fixing typo in README) should use 1 sub-agent

**Requirements:**

1. Import sizing heuristics utility
2. Estimate context:
   - fileCount: estimate from spec description
   - taskCount: count tasks in spec
   - moduleCount: estimate module spread
   - effort: small/medium/large
3. Call `determineSubAgentCount(context)`
4. Spawn appropriate number of sub-agents:
   - 1 agent: Just domain-writer (mode=plan)
   - 2 agents: domain-researcher (mode=plan) + domain-writer (mode=plan)
   - 3+ agents: domain-researcher + domain-writer + quality-validator
5. Pass mode="plan" to domain agents
6. Maintain identical output (spec files in specs/)

**Restrictions:**

- Do NOT change plan-agent behavior (only template selection)
- Do NOT skip validation for complex specs
- Do NOT break spec file format

**Success Criteria:**

- [ ] Sizing heuristics determine agent count
- [ ] Simple specs use 1 agent (domain-writer only)
- [ ] Complex specs use 3 agents (researcher + writer + validator)
- [ ] Output specs are identical to current implementation
```

---

## Phase 4: Update code-agent

### T010 [REQ-7.4, REQ-8.3, REQ-8.4] Update code-agent orchestrator

**File:** `.claude/agents/code-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update code-agent to use consolidated templates (domain-researcher, domain-writer, quality-validator) and dynamic sizing.

**Context:**

- Current code-agent always spawns 3 sub-agents: code-researcher, code-writer, code-validator
- New system should spawn 1-4 sub-agents based on complexity
- Simple endpoints should use 2 sub-agents (researcher + writer)

**Requirements:**

1. Import sizing heuristics utility
2. Estimate context from spec:
   - fileCount: count files in spec tasks
   - taskCount: count tasks in spec
   - moduleCount: count modules (tRPC routers, Prisma models, utils)
   - effort: from spec or "medium" default
3. Call `determineSubAgentCount(context)`
4. Spawn appropriate number of sub-agents:
   - 1 agent: Just domain-writer (mode=code) - rare, only for trivial changes
   - 2 agents: domain-researcher (mode=code) + domain-writer (mode=code)
   - 3+ agents: domain-researcher + domain-writer + quality-validator
5. Pass mode="code" to domain agents
6. Maintain TDD workflow (tests before implementation)

**Restrictions:**

- Do NOT skip TDD (always required for code-agent)
- Do NOT skip validation for production code
- Do NOT change output format

**Success Criteria:**

- [ ] Sizing heuristics determine agent count
- [ ] Simple endpoints use 2 agents (researcher + writer)
- [ ] Complex features use 3-4 agents
- [ ] TDD workflow maintained (red-green-refactor)
- [ ] Output matches current implementation
```

---

## Phase 5: Update ui-agent

### T011 [REQ-7.4, REQ-8.4] Update ui-agent orchestrator

**File:** `.claude/agents/ui-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update ui-agent to use consolidated templates (domain-researcher, domain-writer, quality-validator) and dynamic sizing.

**Context:**

- Current ui-agent always spawns 3 sub-agents: ui-researcher, ui-builder, ui-validator
- New system should spawn 1-4 sub-agents based on complexity
- Simple components should use 2 sub-agents (researcher + builder)

**Requirements:**

1. Import sizing heuristics utility
2. Estimate context from spec:
   - fileCount: count component files in spec
   - taskCount: count tasks in spec
   - moduleCount: count components/hooks/utils
   - effort: from spec or "medium" default
3. Call `determineSubAgentCount(context)`
4. Spawn appropriate number of sub-agents:
   - 1 agent: Just domain-writer (mode=ui) - rare, only for trivial changes
   - 2 agents: domain-researcher (mode=ui) + domain-writer (mode=ui)
   - 3+ agents: domain-researcher + domain-writer + quality-validator
5. Pass mode="ui" to domain agents
6. Maintain TDD workflow (component tests before implementation)

**Restrictions:**

- Do NOT skip TDD (always required for ui-agent)
- Do NOT skip validation for production components
- Do NOT change output format

**Success Criteria:**

- [ ] Sizing heuristics determine agent count
- [ ] Simple components use 2 agents (researcher + builder)
- [ ] Complex features use 3-4 agents
- [ ] TDD workflow maintained
- [ ] Output matches current implementation
```

---

## Phase 6: Update docs-agent

### T012 [REQ-7.4] Update docs-agent orchestrator

**File:** `.claude/agents/docs-agent.md`

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update docs-agent to use consolidated templates (domain-researcher, domain-writer, quality-validator) and dynamic sizing.

**Context:**

- Current docs-agent always spawns 3 sub-agents: docs-researcher, docs-writer, docs-validator
- New system should spawn 1-3 sub-agents based on complexity
- Simple docs (like adding 1 section to README) should use 1 sub-agent

**Requirements:**

1. Import sizing heuristics utility
2. Estimate context from spec:
   - fileCount: count doc files in spec
   - taskCount: count tasks in spec
   - moduleCount: 1 (docs are usually single module)
   - effort: from spec or "small" default
3. Call `determineSubAgentCount(context)`
4. Spawn appropriate number of sub-agents:
   - 1 agent: Just domain-writer (mode=docs)
   - 2 agents: domain-researcher (mode=docs) + domain-writer (mode=docs)
   - 3+ agents: domain-researcher + domain-writer + quality-validator
5. Pass mode="docs" to domain agents

**Restrictions:**

- Do NOT change documentation standards
- Do NOT skip validation for large documentation updates
- Do NOT change output format

**Success Criteria:**

- [ ] Sizing heuristics determine agent count
- [ ] Simple doc updates use 1 agent (writer only)
- [ ] Complex docs use 2-3 agents
- [ ] Output matches current implementation
```

---

## Phase 7: Update eval-agent

### T013 [REQ-7.4] Update eval-agent orchestrator

**File:** `.claude/agents/eval-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update eval-agent to use consolidated templates (domain-researcher, domain-writer, quality-validator) and dynamic sizing.

**Context:**

- Current eval-agent always spawns 3 sub-agents: eval-researcher, eval-writer, eval-validator
- New system should spawn 1-4 sub-agents based on complexity
- Eval suites require careful validation (EDD methodology)

**Requirements:**

1. Import sizing heuristics utility
2. Estimate context from spec:
   - fileCount: count eval files (config, cases, graders)
   - taskCount: count eval dimensions
   - moduleCount: count features being evaluated
   - effort: from spec or "medium" default
3. Call `determineSubAgentCount(context)`
4. Spawn appropriate number of sub-agents:
   - 1 agent: Just domain-writer (mode=eval) - rare
   - 2 agents: domain-researcher (mode=eval) + domain-writer (mode=eval)
   - 3+ agents: domain-researcher + domain-writer + quality-validator
5. Pass mode="eval" to domain agents
6. Maintain EDD workflow (evals before implementation)

**Restrictions:**

- Do NOT skip EDD (always required for eval-agent)
- Do NOT skip validation (evals must run correctly)
- Do NOT change output format

**Success Criteria:**

- [ ] Sizing heuristics determine agent count
- [ ] Simple evals use 2 agents (researcher + writer)
- [ ] Complex evals use 3-4 agents
- [ ] EDD workflow maintained
- [ ] Output matches current implementation
```

---

## Phase 8: Update check-agent

### T014 [REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4] Update check-agent orchestrator

**File:** `.claude/agents/check-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update check-agent to use consolidated quality-checker template for parallel execution.

**Context:**

- Current check-agent spawns 4 parallel sub-agents: build-checker, type-checker, lint-checker, test-runner
- New system should spawn multiple quality-checker instances with different check_type parameters
- Parallel execution must be preserved (performance critical)

**Requirements:**

1. NO dynamic sizing (always run all checks in parallel)
2. Spawn 5 quality-checker instances in parallel:
   - quality-checker (check_type=build)
   - quality-checker (check_type=type)
   - quality-checker (check_type=lint)
   - quality-checker (check_type=test)
   - quality-checker (check_type=security)
3. Wait for all to complete
4. Aggregate results (all must pass)
5. Report overall PASS/FAIL

**Restrictions:**

- Do NOT run checks sequentially (must be parallel)
- Do NOT skip any checks
- Do NOT change output format

**Success Criteria:**

- [ ] All 5 checks run in parallel
- [ ] Results aggregated correctly
- [ ] Performance matches current implementation (parallel)
- [ ] Output matches current implementation
```

---

## Phase 9: Update git-agent

### T015 [REQ-5.2, REQ-8.1] Update git-agent orchestrator

**File:** `.claude/agents/git-agent.md`

**Effort:** Medium

**\_Prompt:**

```markdown
**Role:** Agent orchestrator developer

**Task:** Update git-agent to use consolidated git-content-generator and preserve git-executor.

**Context:**

- Current git-agent uses: change-analyzer, pr-analyzer, git-executor
- New system uses: git-content-generator (mode=commit/pr), git-executor
- /ship should spawn just 1 content generator (not 3 sub-agents)

**Requirements:**

1. NO dynamic sizing for git operations (always 1 generator + 1 executor)
2. For commits:
   - Spawn git-content-generator (mode=commit)
   - Spawn git-executor (execute commit)
3. For PRs:
   - Spawn git-content-generator (mode=pr)
   - Spawn git-executor (create PR)
4. Maintain identical output (commit messages, PR descriptions)

**Restrictions:**

- Do NOT change commit message format (conventional commits)
- Do NOT change PR description format
- Do NOT skip git-executor (command execution required)

**Success Criteria:**

- [ ] /ship spawns 1 content generator + 1 executor
- [ ] Commit messages match current implementation
- [ ] PR descriptions match current implementation
- [ ] git-executor still handles all git commands
```

---

## Phase 10: Remove Obsolete Templates

Clean up old sub-agent files.

### T016 [All consolidation requirements] Remove obsolete sub-agent templates

**Files:** 26 sub-agent template files

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Cleanup engineer

**Task:** Remove 26 obsolete sub-agent template files that have been replaced by consolidated templates.

**Files to Remove:**

- plan-researcher.md, code-researcher.md, ui-researcher.md, docs-researcher.md, eval-researcher.md
- plan-writer.md, code-writer.md, ui-builder.md, docs-writer.md, eval-writer.md
- plan-validator.md, code-validator.md, ui-validator.md, docs-validator.md, eval-validator.md
- build-checker.md, type-checker.md, lint-checker.md, test-runner.md
- spec-analyzer.md, spec-reviewer.md, spec-formatter.md
- change-analyzer.md, pr-analyzer.md
- workflow-analyzer.md, investigator.md, refactor-analyzer.md
- task-decomposer.md, reconciliation-analyzer.md, reconciliation-executor.md, spec-creator.md, content-generator.md, fix-investigator.md

**Keep These (Unique):**

- git-executor.md
- pr-reviewer.md
- security-scanner.md
- parallel-executor.md

**Requirements:**

1. Delete each obsolete file
2. Commit with message: "chore: remove obsolete sub-agent templates (consolidated)"
3. Verify no broken references in agent files

**Restrictions:**

- Do NOT remove unique sub-agents (git-executor, pr-reviewer, security-scanner, parallel-executor)
- Do NOT remove orchestrator files

**Success Criteria:**

- [ ] 26 files removed
- [ ] 4 unique sub-agents preserved
- [ ] No broken references in agent files
- [ ] Committed to git
```

---

## Phase 11: Update Documentation

Update docs to reflect consolidation.

### T017 Update sub-agents README

**File:** `.claude/sub-agents/README.md`

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Documentation writer

**Task:** Update sub-agents README to document the 11 consolidated templates.

**Requirements:**

1. Update template count: 37 → 11
2. Document 7 consolidated templates with mode parameters
3. Document 4 unique templates (no mode parameters)
4. Add section on dynamic sizing heuristics
5. Add examples of sub-agent count for different scenarios
6. Update token savings calculation (63% reduction)

**Restrictions:**

- Do NOT change template file format
- Do NOT add templates beyond the 11 specified

**Success Criteria:**

- [ ] Template count accurate (11)
- [ ] All mode parameters documented
- [ ] Sizing heuristics explained
- [ ] Examples included
```

---

### T018 Update CLAUDE.md architecture diagram

**File:** `CLAUDE.md`

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Documentation writer

**Task:** Update CLAUDE.md architecture diagram to show consolidated sub-agents (11 instead of 37).

**Requirements:**

1. Update sub-agent count in architecture diagram
2. Add note about dynamic sizing (1-7 sub-agents per task)
3. Update token savings section
4. Add examples of adaptive sizing

**Restrictions:**

- Do NOT change agent count (still 7 agents)
- Do NOT change command count (still 6 commands)

**Success Criteria:**

- [ ] Sub-agent count updated (11)
- [ ] Dynamic sizing documented
- [ ] Token savings updated (63%)
- [ ] Examples added
```

---

## Phase 12: Verification

Verify consolidation and test backward compatibility.

### T019 [NFR-3] Run backward compatibility tests

**Effort:** Large

**\_Prompt:**

```markdown
**Role:** QA engineer

**Task:** Verify that all 7 agents produce identical outputs before and after consolidation.

**Test Scenarios:**

1. **plan-agent:** Create spec for "add user authentication"
   - Expected: Spec with requirements, design, tasks
2. **code-agent:** Implement tRPC router for work items
   - Expected: Router file + tests
3. **ui-agent:** Build button component
   - Expected: Component file + tests
4. **docs-agent:** Document API endpoint
   - Expected: Markdown documentation
5. **eval-agent:** Create eval suite for agent builder
   - Expected: Eval config + cases + graders
6. **check-agent:** Verify code quality
   - Expected: Pass/fail on build/type/lint/test
7. **git-agent:** Commit changes and create PR
   - Expected: Commit message + PR description

**Requirements:**

1. Run each test scenario with current implementation (baseline)
2. Run each test scenario with consolidated templates (after)
3. Diff outputs (must be identical)
4. Document any differences
5. Fix differences before approval

**Restrictions:**

- Do NOT approve if outputs differ
- Do NOT skip any test scenarios

**Success Criteria:**

- [ ] All 7 test scenarios run
- [ ] Outputs are identical (diff = 0)
- [ ] No behavioral regressions
```

---

### T020 [NFR-1, NFR-4] Measure token savings and performance

**Effort:** Small

**\_Prompt:**

```markdown
**Role:** Performance analyst

**Task:** Measure token savings and performance impact of consolidation.

**Metrics to Collect:**

1. **Token Savings:**
   - Total tokens before consolidation (sum of all 37 templates)
   - Total tokens after consolidation (sum of 11 templates)
   - Savings percentage
2. **Context Efficiency:**
   - Average sub-agent count before (always 3)
   - Average sub-agent count after (based on workload mix)
   - Context overhead reduction
3. **Performance:**
   - Template selection time (orchestrator overhead)
   - Total execution time for test scenarios

**Requirements:**

1. Count tokens in all template files
2. Log sub-agent counts during verification tests
3. Measure orchestrator decision time
4. Document findings in spec

**Restrictions:**

- Do NOT optimize for metrics (measure actual behavior)

**Success Criteria:**

- [ ] Token savings >= 60%
- [ ] Context overhead reduction >= 30%
- [ ] Template selection time < 100ms
- [ ] No performance regression on test scenarios
```

---

## Task Dependencies

```text
Phase 1: Create Consolidated Templates (Parallel)
T001 ─┬─ T002 ─┬─ T003 ─┬─ T004 ─┬─ T005 ─┬─ T006 ─┬─ T007
      │        │        │        │        │        │
      └────────┴────────┴────────┴────────┴────────┘
                       │
                       ▼
Phase 2: Sizing Heuristics
T008 (shared utility)
      │
      ▼
Phase 3-9: Update Orchestrators (Can be Sequential or Parallel)
T009 (plan-agent)
      │
      ▼
T010 (code-agent)
      │
      ▼
T011 (ui-agent)
      │
      ▼
T012 (docs-agent)
      │
      ▼
T013 (eval-agent)
      │
      ▼
T014 (check-agent)
      │
      ▼
T015 (git-agent)
      │
      ▼
Phase 10: Cleanup
T016 (remove obsolete templates)
      │
      ▼
Phase 11: Documentation (Parallel)
T017 ─┬─ T018
      │
      └───┘
      │
      ▼
Phase 12: Verification (Sequential)
T019 (backward compatibility)
      │
      ▼
T020 (performance measurement)
```

---

## Parallel Execution Opportunities

| Phase | Parallel Tasks                                    |
| ----- | ------------------------------------------------- |
| 1     | T001-T007 (all template creation can be parallel) |
| 11    | T017-T018 (documentation updates)                 |

**Note:** Phases 3-9 (orchestrator updates) can be done in parallel if multiple developers are available, or sequentially for safer rollout.

---

## Estimated Effort

| Phase              | Tasks  | Effort        |
| ------------------ | ------ | ------------- |
| Create Templates   | 7      | ~6 hours      |
| Sizing Heuristics  | 1      | ~2 hours      |
| Update plan-agent  | 1      | ~2 hours      |
| Update code-agent  | 1      | ~2 hours      |
| Update ui-agent    | 1      | ~2 hours      |
| Update docs-agent  | 1      | ~1 hour       |
| Update eval-agent  | 1      | ~2 hours      |
| Update check-agent | 1      | ~2 hours      |
| Update git-agent   | 1      | ~2 hours      |
| Remove Obsolete    | 1      | ~1 hour       |
| Documentation      | 2      | ~2 hours      |
| Verification       | 2      | ~6 hours      |
| **Total**          | **20** | **~30 hours** |

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] 7 consolidated templates created with mode parameters
2. [ ] 4 unique templates preserved (git-executor, pr-reviewer, security-scanner, parallel-executor)
3. [ ] Sizing heuristics utility created and tested
4. [ ] All 7 agent orchestrators updated to use consolidated templates
5. [ ] All 7 agent orchestrators use dynamic sizing
6. [ ] 26 obsolete template files removed
7. [ ] Documentation updated (sub-agents README, CLAUDE.md)
8. [ ] Backward compatibility verified (all 7 agents produce identical outputs)
9. [ ] Token savings >= 60% achieved
10. [ ] Context overhead reduction >= 30% achieved
11. [ ] Template selection time < 100ms
12. [ ] All changes committed to git

---
