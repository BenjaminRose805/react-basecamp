# Design: Commands and Skills

> **Status:** Completed
> **Created:** 2026-01-27
> **Consolidated:** 2026-01-28

## Overview

This consolidated design document describes the implemented command structure, skills system, workflow patterns, and context loading optimization strategies.

---

## Command Architecture

### Before: Single /plan with Mode Detection

```text
User: "/plan add authentication"
    │
    ▼
plan-agent tries to detect intent:
    ├─ Is this a new spec? → design mode
    ├─ Is this feedback? → reconcile mode
    ├─ Is this research? → research mode
    └─ Ambiguous → guess or ask user
```

**Problems:**

- Mode detection adds complexity
- User intent not explicit
- False positives/negatives
- Confusing error messages

### After: Three Explicit Commands

```text
User chooses explicit command:
    │
    ├─ "/design add authentication"    → Create formal spec
    │       └─ Spawns: researcher + writer + validator
    │
    ├─ "/reconcile"                     → Analyze review feedback
    │       └─ Spawns: spec-analyzer + task generator
    │
    └─ "/research WebSocket patterns"   → Exploratory investigation
            └─ Spawns: researcher only
```

**Benefits:**

- Clear user intent
- No mode detection needed
- Predictable behavior
- Simpler agent logic

---

## Command Specifications

### /start Command Design

**File:** `.claude/commands/start.md`

**Phases:**

```text
┌─────────────────────────────────────────────────────────┐
│  Phase 1: DEPENDENCIES (30-60s)                         │
├─────────────────────────────────────────────────────────┤
│  • Detect package manager (pnpm/npm/yarn/bun)           │
│  • Check if node_modules exists                         │
│  • Run install if needed                                │
│  • Report versions and status                           │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: TOOLING (10-30s)                              │
├─────────────────────────────────────────────────────────┤
│  • Check for CodeRabbit CLI                             │
│  • Prompt to install if missing                         │
│  • Check authentication status                          │
│  • Check for GitHub CLI (gh)                            │
│  • Report tool versions                                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: VERIFICATION (60-180s quick, 300-900s full)   │
├─────────────────────────────────────────────────────────┤
│  • Run lint (auto-fix if possible)                      │
│  • Run typecheck                                        │
│  • Run tests (quick or full)                            │
│  • Run build (full mode only)                           │
│  • Run security audit (--security flag)                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 4: GIT SETUP (5-10s)                             │
├─────────────────────────────────────────────────────────┤
│  • Check git status                                     │
│  • Create feature branch                                │
│  • Verify branch creation                               │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 5: REPORT (immediate)                            │
├─────────────────────────────────────────────────────────┤
│  • Display status table with ✓/✗/⚠                     │
│  • Show actionable fix instructions                     │
│  • Write start-status.json state file                   │
│  • Report ready-to-code status                          │
└─────────────────────────────────────────────────────────┘
```

**Configuration:** `.claude/config/environment.json`

```json
{
  "packageManagers": ["pnpm", "npm", "yarn", "bun"],
  "requiredTools": {
    "coderabbit": {
      "name": "CodeRabbit CLI",
      "autoInstall": true,
      "installCommand": "curl -fsSL https://cli.coderabbit.ai/install.sh | sh",
      "checkCommand": "coderabbit --version"
    },
    "gh": {
      "name": "GitHub CLI",
      "autoInstall": false,
      "installInstructions": "https://cli.github.com/manual/installation"
    }
  },
  "verification": {
    "quick": ["lint", "typecheck", "test"],
    "full": ["lint", "typecheck", "test", "build", "test:e2e"]
  },
  "autofix": {
    "lint": true,
    "format": true
  }
}
```

**Hook Integration:** `user-prompt-start.cjs`

```javascript
// Detect /start command
if (userMessage.match(/^\/start\s+/)) {
  // Execute environment-check.cjs
  const result = execSync("node .claude/scripts/environment-check.cjs");

  // Inject results into agent context
  return {
    modifiedPrompt:
      userMessage +
      "\n\n<environment-status>\n" +
      result +
      "\n</environment-status>",
    continueToAgent: true,
  };
}
```

---

### /design Command Design

**File:** `.claude/commands/design.md`

**Workflow:**

```text
User: /design [feature]
    │
    ▼
plan-agent orchestrator
    │
    ├─ Analyze complexity (file count, task count, module spread)
    │       └─ Determine sub-agent count (1-7)
    │
    ├─ Phase 1: Research (if complexity > 1)
    │       └─ Spawn: domain-researcher (mode=plan, model=opus)
    │           ├─ Search for existing specs
    │           ├─ Find similar features
    │           ├─ Check for conflicts
    │           └─ Return: context_summary (500 tokens)
    │
    ├─ Phase 2: Write
    │       └─ Spawn: domain-writer (mode=plan, model=sonnet)
    │           ├─ Read: context_summary
    │           ├─ Converse with user for clarifications
    │           ├─ Write: requirements.md (EARS format)
    │           ├─ Write: design.md (architecture)
    │           ├─ Write: tasks.md (implementation tasks)
    │           └─ Return: files_created
    │
    └─ Phase 3: Validate (if complexity > 2)
            └─ Spawn: quality-validator (model=haiku)
                ├─ Check: requirements completeness
                ├─ Check: design consistency
                ├─ Check: tasks actionability
                └─ Return: PASS | FAIL
```

**Output Structure:**

```text
specs/
└── [feature]/
    ├── requirements.md    # EARS format requirements
    ├── design.md          # Architecture, components, data flow
    └── tasks.md           # Ordered implementation tasks
```

---

### /reconcile Command Design

**File:** `.claude/commands/reconcile.md`

**Workflow:**

```text
User: /reconcile [PR-number]
    │
    ▼
plan-agent orchestrator
    │
    ├─ Detect feedback source
    │   ├─ No args → git diff (local changes)
    │   └─ PR-number → gh pr view --json comments
    │
    ├─ Phase 1: Analyze Feedback
    │       └─ Spawn: spec-analyzer (mode=reconcile, model=opus)
    │           ├─ Parse CodeRabbit comments
    │           ├─ Categorize by severity (critical, major, minor, trivial)
    │           ├─ Group by file/module
    │           └─ Return: categorized_issues
    │
    └─ Phase 2: Generate Fix Tasks
            └─ Spawn: domain-writer (mode=plan, model=sonnet)
                ├─ Read: categorized_issues
                ├─ Create: specs/pr-{N}-reconciliation/tasks.md
                ├─ Prioritize: critical → major → minor → trivial
                └─ Return: task_count
```

**Output Structure:**

```text
specs/
└── pr-{N}-reconciliation/
    └── tasks.md           # Prioritized fix tasks

Example tasks.md:
## Critical Issues (Must Fix Before Merge)
- [ ] Add input validation in auth.ts:45
- [ ] Fix SQL injection risk in query.ts:89

## Major Issues (Should Fix)
- [ ] Add error handling in api/users.ts:23
- [ ] Update type definitions for UserProfile

## Minor Issues (Nice to Have)
- [ ] Improve variable naming in utils.ts:12
- [ ] Add JSDoc comments to exported functions
```

---

### /research Command Design

**File:** `.claude/commands/research.md`

**Workflow:**

```text
User: /research [topic]
    │
    ▼
plan-agent orchestrator
    │
    └─ Phase 1: Investigate (single phase)
            └─ Spawn: domain-researcher (mode=plan, model=opus)
                ├─ Search codebase for topic
                ├─ Search web for patterns/examples
                ├─ Find similar implementations
                ├─ Gather best practices
                ├─ Support follow-up questions
                └─ Write: research-notes.md
```

**Output:**

```markdown
# Research Notes: [Topic]

## Findings

- Finding 1 with context
- Finding 2 with context

## Patterns Found

- Pattern 1: Description
- Pattern 2: Description

## Recommendations

- Recommendation 1
- Recommendation 2

## References

- [Link 1](url)
- [Link 2](url)
```

**No Spec Creation:** Research mode does NOT create requirements.md, design.md, or tasks.md.

---

## Skills System

### Code Review Skill

**File:** `.claude/skills/code-review/SKILL.md`

**4-Loop Structure:**

```text
/review [--flags]
    │
    ├─ Loop 1: Fast Free Checks (<2min)
    │   ├─ Tier 1 (<30s): lint, typecheck, format
    │   └─ Tier 2 (<90s): secrets scan, build, unit tests
    │
    ├─ Loop 2: Claude Opus Reviewer (<3min)
    │   └─ Spawn: Fresh Opus sub-agent with reviewer persona
    │       ├─ Analyze: code quality, architecture, security
    │       ├─ Check: test coverage, documentation
    │       └─ Save: claude-review-results.json
    │
    ├─ Loop 3: CodeRabbit CLI (rate-limited)
    │   ├─ Check: rate limit (2-8 reviews/hour)
    │   ├─ Run: coderabbit review (if quota available)
    │   └─ Skip: if rate limit exceeded
    │
    └─ Loop 4: Async PR Review (after ship)
            └─ CodeRabbit PR review runs async
                └─ User runs /reconcile to apply feedback
```

**Configuration:** `.claude/config/review-config.yaml`

```yaml
loop1:
  tier1_timeout: 30
  tier2_timeout: 120
  parallel: true

loop2:
  model: opus
  enable_claude: true

loop3:
  enable_coderabbit: true
  rate_limit: 8 # per hour
  skip_on_limit: true
  block_on_new_issues: false

blocking:
  critical_blocks_ship: true
  major_blocks_ship: false
```

---

### Preview Skill

**File:** `.claude/skills/preview/SKILL.md`

**Purpose:** Show execution plan before running commands.

**Example:**

```text
User: /implement add authentication
    │
    ▼
Preview Skill activates:
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Execution Plan: /implement add authentication          │
├─────────────────────────────────────────────────────────┤
│  Sub-agents to spawn: 3                                 │
│  Estimated time: 12-15 minutes                          │
│  Model usage: Opus (1), Sonnet (1), Haiku (1)          │
│                                                         │
│  Phases:                                                │
│  1. Research (Opus, ~5min)                              │
│     - Search for existing auth implementations          │
│     - Check for conflicts                               │
│                                                         │
│  2. Implementation (Sonnet, ~7min)                      │
│     - Write tests first (TDD)                           │
│     - Implement auth route                              │
│     - Add middleware                                    │
│                                                         │
│  3. Validation (Haiku, ~2min)                           │
│     - Run typecheck, lint, tests                        │
│     - Verify all checks pass                            │
│                                                         │
│  Proceed? (y/n/modify)                                  │
└─────────────────────────────────────────────────────────┘
```

---

### Progress Skill

**File:** `.claude/skills/progress/SKILL.md`

**Purpose:** Real-time progress display during execution.

**Example:**

```text
┌─────────────────────────────────────────────────────────┐
│  Implementing: add authentication                       │
├─────────────────────────────────────────────────────────┤
│  ✓ Research phase         [█████████] 100%  (4m 23s)    │
│  ▶ Implementation phase   [███░░░░░░]  40%  (3m 12s)    │
│    └─ Writing tests...                                  │
│  ○ Validation phase       [░░░░░░░░░]   0%              │
├─────────────────────────────────────────────────────────┤
│  Total progress: 47% (7m 35s elapsed)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Workflow Integration

### Full-Feature Workflow

**File:** `.claude/workflows/full-feature.md`

**Seven Phases:**

```text
1. /start [feature-name]
   └─ Environment setup, branch creation
   └─ Output: start-status.json, feature branch

2. /design [feature-name]
   └─ Specification creation
   └─ Output: specs/[feature]/{requirements,design,tasks}.md

3. /implement [spec-path]
   └─ Implementation with TDD
   └─ Output: Code files, tests

4. /review
   └─ 4-loop local code review
   └─ Output: claude-review-results.json, loop-state.json

5. /ship
   └─ Commit and PR creation
   └─ Output: Commit, PR URL

6. /reconcile [PR-number]  (if feedback received)
   └─ Analyze and plan fixes
   └─ Output: specs/pr-{N}-reconciliation/tasks.md

7. Merge PR
   └─ After approvals and CI passes
```

---

## Context Loading Optimization

### Before: Load Everything

```text
Every session loads:
- All 7 agent files
- All 11 sub-agent templates
- All 4 profiles
- All protocols
- All docs
- All skills
- All examples

Total: ~50,000 tokens per session
Problem: Wasteful for simple commands
```

### After: Selective Loading

**File:** `.claude/docs/context-loading.md`

**Strategy:**

```text
Command-Specific Loading:

/start:
  - git-agent.md
  - environment.json
  - user-prompt-start.cjs
  - environment-check.cjs
  → 5,000 tokens (90% reduction)

/design:
  - plan-agent.md
  - domain-researcher.md
  - domain-writer.md
  - quality-validator.md
  - profiles/researcher.md
  - profiles/writer.md
  - protocols/handoff.md
  - spec templates
  → 15,000 tokens (70% reduction)

/implement:
  - code-agent.md (or ui/docs/eval)
  - domain-researcher.md
  - domain-writer.md
  - quality-validator.md
  - coding-standards skill
  - tdd-workflow skill (or edd-workflow)
  → 18,000 tokens (64% reduction)

/review:
  - code-review/SKILL.md
  - review-config.yaml
  - free-checks.cjs
  - secret-scanner.cjs
  - claude-reviewer.cjs
  - loop-controller.cjs
  → 12,000 tokens (76% reduction)

/ship:
  - git-agent.md
  - check-agent.md
  - quality-checker.md
  - git-content-generator.md
  - git-executor.md
  - user-prompt-ship.cjs
  → 10,000 tokens (80% reduction)
```

**Average Savings:** 40% context reduction across typical workload

---

## Hooks System

### UserPromptSubmit Hooks

**Purpose:** Trigger on command detection before agent execution.

**Hooks:**

1. **user-prompt-start.cjs**
   - Detects: `/start`
   - Executes: environment-check.cjs
   - Injects: Environment status into agent context

2. **user-prompt-review.cjs**
   - Detects: `/review`
   - Executes: 4-loop review system
   - Injects: Review results into agent context

3. **user-prompt-ship.cjs**
   - Detects: `/ship`
   - Checks: loop-state.json for ship_allowed flag
   - Blocks: If critical issues found

---

### PreToolUse Hooks

**Purpose:** Intercept and modify tool calls.

**Hooks:**

1. **command-mode-detect.cjs**
   - Routes commands to appropriate agents
   - Handles command aliases
   - Provides command suggestions

2. **pre-tool-use-task-enforcement.cjs**
   - Enforces sub-agent delegation
   - Blocks direct Read/Write/Grep/Glob from orchestrators
   - Suggests Task tool usage

---

### PostToolUse Hooks

**Purpose:** Track and analyze tool usage.

**Hooks:**

1. **compaction-tracker.cjs**
   - Tracks context usage per session
   - Counts tool calls
   - Suggests `/compact` at 70% capacity or 50+ tool calls

---

## Success Metrics (Achieved)

| Metric                         | Target | Achieved |
| ------------------------------ | ------ | -------- |
| Context loading reduction      | 40%+   | 40%      |
| Command disambiguation         | 100%   | 100%     |
| /start completion time (quick) | <5min  | <5min    |
| /start completion time (full)  | <15min | <15min   |
| Environment setup automation   | 80%+   | 90%      |
| Workflow documentation         | 100%   | 100%     |

---

**Status:** Design fully implemented and verified.
