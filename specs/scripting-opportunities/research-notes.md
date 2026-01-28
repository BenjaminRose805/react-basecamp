# Research Notes: Scripting Opportunities

> **Date:** 2026-01-27
> **Status:** Research Complete
> **Decision:** PROCEED when ready to implement

## Executive Summary

Found **8 prioritized opportunities** for dedicated scripts to automate repetitive agent processes. The highest-value targets are **CI/CodeRabbit polling** and **PR comment fetching**, which together could save **7,000-19,000 tokens per workflow**.

**Recommendation:** 5 well-defined hooks + 3 well-defined scripts.

---

## Current Scripts Inventory

### Existing Hooks (10)

| Script                              | Purpose                                                      | Trigger          |
| ----------------------------------- | ------------------------------------------------------------ | ---------------- |
| `command-mode-detect.cjs`           | Detects `/plan`, `/implement`, `/ship` commands              | UserPromptSubmit |
| `pre-tool-use-task-enforcement.cjs` | Warns when direct tools used instead of Task                 | PreToolUse       |
| `pre-tool-use-bash.cjs`             | Blocks dangerous commands, runs lint+typecheck before commit | PreToolUse       |
| `post-tool-use.cjs`                 | Audit logging of all tool operations                         | PostToolUse      |
| `post-tool-use-pr-created.cjs`      | Extracts and displays PR URL                                 | PostToolUse      |
| `post-tool-use-eslint.cjs`          | Runs ESLint autofix on edited files                          | PostToolUse      |
| `post-tool-use-typecheck.cjs`       | Runs TypeScript check on edited files                        | PostToolUse      |
| `suggest-compact.cjs`               | Suggests `/compact` after 50+ tool calls                     | PreToolUse       |
| `compaction-tracker.cjs`            | Logs compaction events with session info                     | PreCompact       |
| `session-start.cjs`                 | Ensures directories exist, detects package manager           | SessionStart     |

### Existing Libraries (2)

| Script                      | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `lib/utils.cjs`             | Cross-platform utilities (file ops, git helpers, stdin parsing) |
| `lib/security-patterns.cjs` | Dangerous command detection patterns                            |

### Existing CLI Tools (2)

| Script                      | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `measure-tokens.cjs`        | Estimates token consumption of context files |
| `setup-package-manager.cjs` | Package manager setup                        |

---

## Command Analysis

### /ship

**Current Agent Overhead:**

- git-writer (Sonnet): Analyze diff, generate commit message, execute git commands
- git-executor (Haiku): Create PR, poll CI status, poll CodeRabbit

**Scriptable Steps:**

| Step                | Current                   | Scriptable?                      | Token Impact |
| ------------------- | ------------------------- | -------------------------------- | ------------ |
| `git diff --stat`   | Agent reads output        | **YES** - Script outputs summary | High         |
| `git status`        | Agent reads output        | **YES** - Script pre-parses      | Medium       |
| `git log --oneline` | Agent reads output        | **YES** - Script formats         | Medium       |
| `git add <files>`   | Agent executes            | Partially (needs judgment)       | Low          |
| `git commit`        | Agent executes            | No (message needs AI)            | -            |
| `git push`          | Agent executes            | **YES** - Trivial automation     | Low          |
| `gh pr create`      | Agent executes            | Partially (title/body need AI)   | -            |
| Poll CI status      | Agent polls 30s intervals | **YES** - Script can poll        | **High**     |
| Poll CodeRabbit     | Agent polls 30s intervals | **YES** - Script can poll        | **High**     |
| Extract PR URL      | Hook exists               | Already done                     | -            |

**Token Savings Potential:** **HIGH** (5,000-15,000 tokens)

### /design

**Current Agent Overhead:**

- domain-researcher (Opus): Analyze requirements, find patterns
- domain-writer (Sonnet): Create spec files
- quality-validator (Haiku): Verify completeness

**Scriptable Steps:**

| Step                      | Current                   | Scriptable?                       | Token Impact |
| ------------------------- | ------------------------- | --------------------------------- | ------------ |
| Create spec directory     | Agent uses mkdir          | **YES** - Script scaffolds        | Low          |
| Create template files     | Agent writes from scratch | **YES** - Script copies templates | Medium       |
| Validate EARS format      | Agent reads and checks    | **YES** - Script validates regex  | Medium       |
| Check for duplicate specs | Agent searches            | **YES** - Script checks existence | Low          |

**Token Savings Potential:** **MEDIUM** (800-2,000 tokens)

### /implement

**Current Agent Overhead:**

- code-researcher (Opus): Find patterns, check conflicts
- code-writer (Sonnet): TDD implementation
- code-validator (Haiku): Run quality checks

**Scriptable Steps:**

| Step                       | Current             | Scriptable?                        | Token Impact |
| -------------------------- | ------------------- | ---------------------------------- | ------------ |
| Parse tasks from tasks.md  | Agent reads/parses  | **YES** - Script extracts tasks    | Medium       |
| Check for naming conflicts | Agent searches      | Partially (script can pre-scan)    | Medium       |
| Run typecheck              | Agent via Bash      | **YES** - Already hooked           | Low          |
| Run lint                   | Agent via Bash      | **YES** - Already hooked           | Low          |
| Run tests                  | Agent via Bash      | **YES** - Script can run+summarize | Medium       |
| Calculate coverage         | Agent parses output | **YES** - Script extracts %        | Low          |

**Token Savings Potential:** **MEDIUM** (800-2,300 tokens)

### /reconcile

**Current Agent Overhead:**

- domain-researcher (Opus): Analyze PR feedback
- domain-writer (Sonnet): Create fix tasks

**Scriptable Steps:**

| Step                      | Current               | Scriptable?                      | Token Impact |
| ------------------------- | --------------------- | -------------------------------- | ------------ |
| Fetch PR comments         | Agent uses `gh api`   | **YES** - Script fetches+formats | **High**     |
| Fetch CodeRabbit comments | Agent searches output | **YES** - Script parses          | **High**     |
| Categorize by severity    | Agent judges          | No (AI judgment needed)          | -            |
| Create reconciliation dir | Agent uses mkdir      | **YES** - Script scaffolds       | Low          |

**Token Savings Potential:** **HIGH** (2,000-4,000 tokens)

---

## Prioritized Opportunities

| Priority | Task                      | Command    | Tokens Saved     | Complexity | Type              |
| -------- | ------------------------- | ---------- | ---------------- | ---------- | ----------------- |
| **1**    | CI/CodeRabbit Polling     | /ship      | **5,000-15,000** | Moderate   | Hook + Background |
| **2**    | PR Comment Fetching       | /reconcile | **2,000-4,000**  | Simple     | Hook              |
| **3**    | Git Diff Pre-Summary      | /ship      | **1,000-3,000**  | Simple     | Hook              |
| **4**    | Task Extraction           | /implement | 500-1,500        | Simple     | Script            |
| **5**    | Spec Template Scaffolding | /design    | 500-1,000        | Simple     | Hook              |
| **6**    | Test Coverage Extraction  | /implement | 300-800          | Simple     | Hook              |
| **7**    | EARS Format Validation    | /design    | 300-800          | Simple     | Script            |
| **8**    | PR Template Generation    | /ship      | 500-1,000        | Moderate   | Script            |

---

## Integration Recommendation

### Pattern Classification

| Pattern                        | Use When                                      | Example           |
| ------------------------------ | --------------------------------------------- | ----------------- |
| **A: Event Hook**              | Predictable trigger, automatic action         | Lint on file save |
| **B: Script**                  | Agent needs explicit control, variable timing | Parse tasks.md    |
| **C: Background + State File** | Long-running, agent checks later              | CI polling        |

### Well-Defined Hooks (5 opportunities)

| Opportunity               | Trigger                            | Hook Behavior                                |
| ------------------------- | ---------------------------------- | -------------------------------------------- |
| **Git Diff Summary**      | `PostToolUse` when `git diff`      | Append stats to tool output                  |
| **PR Comment Pre-fetch**  | `UserPromptSubmit` on `/reconcile` | Fetch to `.claude/state/pr-{n}-feedback.md`  |
| **Spec Scaffolding**      | `UserPromptSubmit` on `/design`    | Create `specs/{feature}/` with templates     |
| **Test Coverage Extract** | `PostToolUse` when `pnpm test`     | Append coverage % to output                  |
| **CI Polling Start**      | `PostToolUse` when `gh pr create`  | Start background poller, write to state file |

### Well-Defined Scripts (3 opportunities)

| Opportunity         | Why Script?                  | Interface                                  |
| ------------------- | ---------------------------- | ------------------------------------------ |
| **Task Extraction** | Agent decides when to parse  | `extract-tasks.cjs <path>` -> JSON         |
| **EARS Validation** | On-demand validation         | `validate-spec.cjs <path>` -> JSON         |
| **PR Template Gen** | Needs agent-provided context | `generate-pr-body.cjs` (stdin) -> markdown |

---

## Hook Specifications

### 1. Git Diff Summary (`post-tool-use-git-diff.cjs`)

```javascript
// Trigger: PostToolUse when tool_name === "Bash" && command.includes("git diff")
// Action: Parse diff output, compute stats
// Output: Append structured summary to tool result

{
  trigger: "PostToolUse",
  condition: (result) => result.tool === "Bash" && /^git diff/.test(result.input.command),
  action: (result) => {
    const stats = parseDiffStats(result.output);
    return {
      ...result,
      output: result.output + `\n\n---\n**Summary:** ${stats.files} files, +${stats.insertions}/-${stats.deletions}`
    };
  }
}
```

**Why hook:** Every `git diff` benefits from summary. No agent decision needed.

### 2. PR Feedback Pre-fetch (`user-prompt-reconcile.cjs`)

```javascript
// Trigger: UserPromptSubmit when message matches /^\/reconcile\s+(\d+|PR#?\d+)/
// Action: Fetch PR comments, format, write to state file
// Output: Inject "Feedback pre-fetched to .claude/state/pr-{n}-feedback.md"

{
  trigger: "UserPromptSubmit",
  condition: (prompt) => /^\/reconcile\s+/.test(prompt.message),
  action: async (prompt) => {
    const prNum = extractPRNumber(prompt.message);
    const feedback = await fetchPRFeedback(prNum);  // gh api calls
    const formatted = formatFeedback(feedback);     // categorize, extract line refs
    writeState(`pr-${prNum}-feedback.md`, formatted);
    return { inject: `PR #${prNum} feedback pre-fetched (${feedback.comments.length} comments)` };
  }
}
```

**Why hook:** Always needed for `/reconcile`. Pre-fetching saves agent from raw API parsing.

### 3. Spec Scaffolding (`user-prompt-design.cjs`)

```javascript
// Trigger: UserPromptSubmit when message matches /^\/design\s+(\S+)/
// Action: Create spec directory with template files
// Output: Inject "Scaffolded specs/{feature}/ with templates"

{
  trigger: "UserPromptSubmit",
  condition: (prompt) => /^\/design\s+/.test(prompt.message),
  action: (prompt) => {
    const feature = extractFeatureName(prompt.message);
    const specDir = `specs/${feature}`;
    if (!fs.existsSync(specDir)) {
      copyTemplates('specs/templates/', specDir);
      return { inject: `Scaffolded ${specDir}/ with requirement, design, tasks templates` };
    }
    return { inject: `Spec directory ${specDir}/ already exists` };
  }
}
```

**Why hook:** Mechanical scaffolding. Agent shouldn't spend tokens creating empty files.

### 4. Test Coverage Extract (`post-tool-use-test-coverage.cjs`)

```javascript
// Trigger: PostToolUse when Bash command includes "pnpm test" or "vitest"
// Action: Extract coverage percentage from output
// Output: Append coverage summary

{
  trigger: "PostToolUse",
  condition: (result) => result.tool === "Bash" && /pnpm (test|vitest)|vitest/.test(result.input.command),
  action: (result) => {
    const coverage = extractCoverage(result.output);  // regex for coverage table
    if (coverage) {
      return {
        ...result,
        output: result.output + `\n\n**Coverage:** ${coverage.statements}% statements, ${coverage.branches}% branches`
      };
    }
    return result;
  }
}
```

**Why hook:** Coverage parsing is always useful. Consistent format helps agent.

### 5. CI Polling Background (`post-tool-use-pr-created.cjs` enhancement)

```javascript
// Trigger: PostToolUse when gh pr create succeeds
// Action: Extract PR number, start background polling process
// Output: Inject "CI polling started, status at .claude/state/pr-{n}-status.json"

{
  trigger: "PostToolUse",
  condition: (result) => result.tool === "Bash" && /gh pr create/.test(result.input.command) && result.exitCode === 0,
  action: async (result) => {
    const prUrl = extractPRUrl(result.output);
    const prNum = extractPRNumber(prUrl);

    // Start background poller (detached process)
    spawn('node', ['.claude/scripts/poll-pr-status.cjs', prNum], {
      detached: true,
      stdio: 'ignore'
    }).unref();

    return {
      inject: `CI/review polling started for PR #${prNum}. Check .claude/state/pr-${prNum}-status.json when ready.`
    };
  }
}
```

**Why hook + background:** Polling must happen automatically after PR creation. Agent just checks state file when needed instead of polling loop.

---

## Script Specifications

### `extract-tasks.cjs`

**Usage:**

```bash
node .claude/scripts/extract-tasks.cjs specs/feature/tasks.md
```

**Output:**

```json
{
  "tasks": [
    {
      "id": "T001",
      "description": "Create tRPC router",
      "status": "pending",
      "prompt": "Role: Backend Developer | Task: ...",
      "blockedBy": []
    }
  ],
  "stats": { "total": 12, "completed": 3, "pending": 9 }
}
```

### `validate-spec.cjs`

**Usage:**

```bash
node .claude/scripts/validate-spec.cjs specs/feature/requirements.md
```

**Output:**

```json
{
  "valid": false,
  "issues": [
    {
      "line": 15,
      "type": "missing_ears",
      "message": "Requirement R003 missing 'shall' keyword"
    },
    {
      "line": 23,
      "type": "missing_criteria",
      "message": "Requirement R005 has no acceptance criteria"
    }
  ]
}
```

### `generate-pr-body.cjs`

**Usage:**

```bash
echo '{"title":"Add auth","changes":["src/lib/auth.ts"],"commits":["feat: add JWT utils"]}' | node .claude/scripts/generate-pr-body.cjs
```

**Output:** Markdown PR body following template.

---

## Open Questions

1. **Polling timeout:** How long should CI script wait before timing out? (Current agent behavior: 30min for CI, 10min for CodeRabbit)

2. **State file location:** Use `.claude/state/` (current pattern) or a more structured approach?

3. **Error handling:** When scripts fail, should they:
   - Return empty/default output (silent fail)
   - Return error JSON for agent to handle
   - Log to stderr and let agent proceed

4. **Token measurement:** How to accurately measure token savings? Current `measure-tokens.cjs` uses chars/4 heuristic.

---

## Key Files Referenced

- `.claude/scripts/hooks/` - All existing hook implementations
- `.claude/scripts/lib/utils.cjs` - Shared utilities
- `.claude/agents/git-agent.md` - Git workflow definition
- `.claude/commands/ship.md` - Ship command definition
- `.claude/commands/reconcile.md` - Reconcile command definition

---

## Related Specs

- `specs/local-code-review/` - CodeRabbit CLI integration (review workflow)
- `specs/start-command-upgrade/` - Environment setup (installs tooling)

---

## Next Steps

When ready to implement:

1. Start with **CI/CodeRabbit Polling** (highest token savings)
2. Add **PR Comment Pre-fetch** (second highest, simple)
3. Add **Git Diff Summary** (complements /ship workflow)
4. Add remaining hooks and scripts as needed

Run `/design scripting-opportunities` to create full implementation spec.
