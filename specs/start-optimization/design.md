# Design: /start Command Optimization

> **Status:** Approved
> **Created:** 2026-01-28
> **Spec ID:** start-optimization

## Overview

This design implements a 3-phase refactoring of the `/start` command and related infrastructure. Phase 1 addresses safety and consistency issues (S1-S3, C1-C2), Phase 2 implements DRY refactoring with shared utilities (D1-D4, E1-E4), and Phase 3 adds completeness features (CM1-CM5). The design follows established patterns from `/ship` command and ensures consistency across the codebase.

---

## Architecture

### Current State

```
/start invoked
    |
    v
user-prompt-start.cjs hook
    |
    ├─ execSync("environment-check.cjs")  <-- PROBLEM: Direct execution
    ├─ Creates worktree in hook           <-- PROBLEM: Hook doing work
    ├─ Duplicated command detection       <-- PROBLEM: Code duplication
    └─ Inject context into prompt

ISSUES:
- No preview/confirmation flow
- Hook creates worktrees (should delegate)
- No branch existence check
- No dirty state protection
- Missing from git-agent.md documentation
```

### Target State (Phase 1 Complete)

```
/start invoked
    |
    v
user-prompt-start.cjs hook
    |
    ├─ Detect /start command (shared utility)
    ├─ Check dirty working directory (BLOCK if dirty)
    ├─ Inject context into prompt
    └─ Hand off to .claude/commands/start.md
        |
        v
    start.md (agent instructions)
        |
        ├─ Show preview (stages, timing, models)
        ├─ Wait for confirmation
        └─ Spawn sub-agents via Task tool
            |
            ├─ git-setup-agent (Haiku)
            │   ├─ Check branch existence
            │   ├─ Validate worktree path
            │   ├─ Create worktree: ../<repo>--<feature>
            │   └─ Switch to new worktree
            |
            └─ environment-agent (Haiku)
                ├─ Run environment-check.cjs
                ├─ Parse results
                └─ Report status
```

### Target State (Phase 2 Complete)

```
Shared Utilities Added:
├─ .claude/scripts/lib/command-utils.cjs
│   └─ detectCommand(userPrompt)
├─ .claude/scripts/lib/verification-utils.cjs
│   ├─ runLint(), runTypecheck(), runTests(), runBuild()
│   └─ Used by /start AND /review
├─ .claude/scripts/lib/git-utils.cjs
│   ├─ getGitStatus(format)
│   ├─ checkDirtyState()
│   └─ getBranchExists(branchName)
└─ .claude/scripts/lib/hook-base.cjs
    └─ createHook({ name, detect, inject })

Parallelization:
- environment-check.cjs uses Promise.all() for tool checks
- Config loading cached per session
- Package manager detection cached
```

### Target State (Phase 3 Complete)

```
Additional Features:
├─ Progress display during execution
├─ --yes flag for CI mode
├─ Schema validation for environment.json
├─ start-specific sub-agent documented
└─ Unused exports removed
```

---

## Component Design

### 1. Preview Display (Phase 1)

**Pattern:** Follow `/ship` command preview format (see `.claude/commands/ship.md`)

**Display:**

```text
┌─────────────────────────────────────────────────────────────┐
│  /start                                                     │
├─────────────────────────────────────────────────────────────┤
│  Working Dir: /home/user/project                            │
│  Branch: feature/start-optimization                         │
│  Worktree: ../project--start-optimization                   │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 0. VALIDATE STATE                                       ││
│  │    └─ Check dirty working directory                     ││
│  │    └─ Check branch existence                            ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 1. SETUP WORKTREE                                       ││
│  │    └─ git-setup-agent (Haiku) - Create worktree         ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. VERIFY ENVIRONMENT                                   ││
│  │    └─ environment-agent (Haiku) - Run checks            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Estimated time: ~30 seconds                                │
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**

| Input                 | Output                 |
| --------------------- | ---------------------- |
| User invokes `/start` | Preview displayed      |
| User presses [Enter]  | Sub-agents spawned     |
| User presses [Esc]    | Command canceled, exit |

**Implementation Notes:**

- Use box-drawing characters (same as environment-check.cjs)
- Display current working directory
- Display computed worktree path
- Show all validation steps
- Include timing estimate

---

### 2. Dirty State Protection (Phase 1)

**Pattern:** Block before preview if working directory has uncommitted changes

**Logic:**

```javascript
// In user-prompt-start.cjs hook
const { checkDirtyState } = require("./lib/git-utils.cjs");

const dirtyState = checkDirtyState();
if (dirtyState.isDirty && !flags.force) {
  logContext({
    blocked: true,
    reason: "dirty_working_directory",
    files: dirtyState.files,
    suggestion: "Commit or stash changes before running /start",
  });
  return; // Hook exits early, agent sees blocked status
}
```

**Error Message (injected into agent context):**

```text
🚫 /start blocked: Dirty working directory

Uncommitted changes:
  M  src/components/Button.tsx
  ?? src/components/NewFile.tsx

Please commit or stash changes before running /start.
Alternatively, use /start --force to bypass this check.
```

---

### 2b. Critical Dependency Blocking (Phase 1)

**Pattern:** Block if critical dependencies are missing; warn on optional tools

**Decision:** Block on Node.js, package manager, git. Warn on Docker, linters.

**Logic:**

```javascript
// In environment-check.cjs
const CRITICAL_DEPS = ["node", "packageManager", "git"];
const OPTIONAL_TOOLS = ["docker", "lint", "typecheck"];

function checkCriticalDependencies(results) {
  const missing = CRITICAL_DEPS.filter(
    (dep) => !results.dependencies[dep]?.installed
  );

  if (missing.length > 0) {
    return {
      blocked: true,
      reason: "missing_critical_dependencies",
      missing: missing,
      suggestion: `Install missing dependencies: ${missing.join(", ")}`,
    };
  }

  // Check optional tools (non-blocking)
  const optionalMissing = OPTIONAL_TOOLS.filter(
    (tool) => !results.tooling[tool]?.available
  );
  if (optionalMissing.length > 0) {
    return {
      blocked: false,
      warnings: optionalMissing.map(
        (tool) => `Optional tool not available: ${tool}`
      ),
    };
  }

  return { blocked: false };
}
```

**Error Display (blocking):**

```text
🚫 /start blocked: Missing critical dependencies

Missing:
  ✗ node - Not installed
  ✗ pnpm - Not installed

Please install the missing dependencies before running /start.
Use /start --force to bypass this check (not recommended).
```

**Warning Display (non-blocking):**

```text
⚠️  /start warning: Optional tools not available

Warnings:
  ⚠ docker - Not installed (optional)
  ⚠ eslint - Not configured (optional)

Proceeding with worktree creation...
```

---

### 3. Branch Existence Check (Phase 1)

**Pattern:** Check in git-setup-agent before creating worktree. Error if branch exists.

**Decision:** Error and ask user to choose different name (prevents accidental overwrites)

**Logic:**

```javascript
// In git-setup-agent (spawned by start.md)
const branchName = "feature/start-optimization";
const branchExists = await getBranchExists(branchName);

if (branchExists) {
  // Get branch info for display
  const lastCommit = execSync(`git log -1 --format="%h %s (%ar)" ${branchName}`)
    .toString()
    .trim();

  // Return error with branch info - user must choose different name
  return {
    status: "error",
    error: "branch_exists",
    message: `Branch '${branchName}' already exists`,
    details: {
      branch: branchName,
      lastCommit: lastCommit,
      suggestion:
        "Please choose a different feature name, e.g., /start login-v2",
    },
  };
}

// Proceed with worktree creation only if branch doesn't exist
execSync(`git worktree add ${worktreePath} -b ${branchName}`);
```

**Error Display:**

```text
🚫 /start blocked: Branch already exists

Branch: feature/start-optimization
Last commit: abc1234 Add login form (2 days ago)

Please choose a different feature name.
Example: /start start-optimization-v2
```

---

### 4. Worktree Path Naming (Phase 1)

**Pattern:** Use `../<repo>--<feature>` format

**Logic:**

```javascript
// In git-setup-agent
const currentDir = process.cwd(); // /home/user/react-basecamp-start-optimization
const repoName = path.basename(currentDir); // react-basecamp-start-optimization
const branchName = "feature/start-optimization";
const featureName = branchName.replace("feature/", ""); // start-optimization

const worktreePath = path.join(currentDir, "..", `${repoName}--${featureName}`); // ../react-basecamp-start-optimization--start-optimization

// Validate path doesn't exist
if (fs.existsSync(worktreePath)) {
  throw new Error(`Worktree path already exists: ${worktreePath}`);
}
```

---

### 5. Shared Utilities (Phase 2)

**command-utils.cjs:**

```javascript
/**
 * Detect command from user prompt
 * @param {string} userPrompt - The user's input
 * @returns {string|null} - Command name or null
 */
function detectCommand(userPrompt) {
  const trimmed = userPrompt.trim().toLowerCase();

  if (trimmed === "/start" || trimmed.startsWith("/start ")) return "start";
  if (trimmed === "/ship" || trimmed.startsWith("/ship ")) return "ship";
  if (trimmed === "/review" || trimmed.startsWith("/review ")) return "review";

  return null;
}

module.exports = { detectCommand };
```

**verification-utils.cjs:**

```javascript
const { execSync } = require("child_process");

function runLint() {
  try {
    execSync("pnpm lint", { stdio: "pipe", timeout: 30000 });
    return { passed: true };
  } catch (error) {
    return { passed: false, output: error.stdout?.toString() };
  }
}

function runTypecheck() {
  try {
    execSync("pnpm typecheck", { stdio: "pipe", timeout: 30000 });
    return { passed: true };
  } catch (error) {
    return { passed: false, output: error.stdout?.toString() };
  }
}

module.exports = { runLint, runTypecheck, runTests, runBuild };
```

**git-utils.cjs:**

```javascript
const { execSync } = require("child_process");

function getGitStatus(format = "short") {
  const output = execSync("git status --porcelain", { encoding: "utf8" });

  if (format === "short") {
    return output.trim();
  } else if (format === "json") {
    const lines = output.trim().split("\n").filter(Boolean);
    return lines.map((line) => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3),
    }));
  } else if (format === "long") {
    return execSync("git status", { encoding: "utf8" });
  }
}

function checkDirtyState() {
  const status = getGitStatus("json");
  return {
    isDirty: status.length > 0,
    files: status,
  };
}

function getBranchExists(branchName) {
  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

module.exports = { getGitStatus, checkDirtyState, getBranchExists };
```

---

### 6. Parallel Execution (Phase 2)

**Before (Sequential):**

```javascript
const gitCheck = checkGitCli(); // ~500ms
const crCheck = checkCodeRabbitCli(); // ~500ms
const nodeCheck = checkNodeVersion(); // ~100ms
// Total: ~1100ms
```

**After (Parallel):**

```javascript
const [gitCheck, crCheck, nodeCheck] = await Promise.all([
  checkGitCli(),
  checkCodeRabbitCli(),
  checkNodeVersion(),
]);
// Total: ~500ms (45% faster)
```

---

## Data Models

### StartContext (Injected by Hook)

```typescript
interface StartContext {
  blocked: boolean;
  reason?: "dirty_working_directory" | "missing_dependencies";
  suggestion?: string;
  dirty_state?: {
    files: Array<{ status: string; file: string }>;
  };
  environment?: {
    status: "ready" | "issues";
    results: EnvironmentCheckResults;
  };
}
```

### EnvironmentCheckResults

```typescript
interface EnvironmentCheckResults {
  package_manager: "pnpm" | "npm" | "yarn" | "bun";
  dependencies_installed: boolean;
  tools: {
    git: { available: boolean; version?: string };
    gh: { available: boolean; version?: string };
    coderabbit: { available: boolean; version?: string };
  };
  verification: {
    lint: { passed: boolean; output?: string };
    typecheck: { passed: boolean; output?: string };
    tests: { passed: boolean; output?: string };
    build: { passed: boolean; output?: string };
  };
  security?: {
    vulnerabilities: number;
    details: string;
  };
}
```

---

## Data Flow

### Phase 1: Preview and Validation

```
User types /start
    |
    v
user-prompt-start.cjs
    ├─ detectCommand() -> 'start'
    ├─ checkDirtyState()
    |   └─ If dirty && !--force -> BLOCK
    ├─ Inject context (blocked status or proceed)
    └─ Hand off to agent
        |
        v
    .claude/commands/start.md
        ├─ Read injected context
        ├─ If blocked -> Display error, exit
        ├─ Display preview
        ├─ Wait for [Enter] or [Esc]
        └─ If confirmed -> Spawn sub-agents
```

### Phase 2: Worktree Setup

```
git-setup-agent (Haiku)
    |
    ├─ Extract branch name from user request
    ├─ Compute worktree path: ../<repo>--<feature>
    ├─ Check branch existence with getBranchExists()
    ├─ If exists -> Ask user (switch/increment/cancel)
    ├─ Validate worktree path doesn't exist
    ├─ Create worktree
    └─ Return { worktree_path, branch_name, status }
```

### Phase 3: Environment Verification

```
environment-agent (Haiku)
    |
    ├─ Run environment-check.cjs script
    ├─ Parse JSON output from start-status.json
    ├─ Display results with color-coded status
    └─ Return { status: 'ready' | 'issues', results }
```

---

## Error Handling

### Error 1: Dirty Working Directory

```
Error: Cannot create worktree with uncommitted changes
```

**Response:**

- Display files with uncommitted changes
- Suggest: `git stash` or `git commit`
- Offer: `/start --force` to bypass

### Error 2: Branch Already Exists

```
Error: Branch 'feature/start-optimization' already exists
```

**Response:**

- Ask user to choose:
  1. Switch to existing branch
  2. Create new branch (auto-increment name)
  3. Cancel
- If user chooses 1: Create worktree pointing to existing branch
- If user chooses 2: Create worktree with new branch (feature/start-optimization-2)

### Error 3: Worktree Path Already Exists

```
Error: Worktree path already exists: ../react-basecamp--start-optimization
```

**Response:**

- Display existing path
- Suggest: Remove existing worktree or choose different branch name
- Provide command: `git worktree remove <path>`

### Error 4: Environment Check Failed

```
Warning: Environment verification detected issues
```

**Response:**

- Display failed checks (lint, typecheck, etc.)
- Mark as non-blocking warning
- Continue with worktree setup
- Save results to start-status.json for later review

---

## Testing Strategy

### Unit Tests

| Test Case                      | Verification                               |
| ------------------------------ | ------------------------------------------ |
| detectCommand('/start')        | Returns 'start'                            |
| detectCommand('/start --full') | Returns 'start'                            |
| checkDirtyState() with changes | Returns { isDirty: true, files: [...] }    |
| checkDirtyState() clean        | Returns { isDirty: false, files: [] }      |
| getBranchExists('main')        | Returns true                               |
| getBranchExists('nonexistent') | Returns false                              |
| getGitStatus('json')           | Returns array of {status, file} objects    |
| Parallel tool checks           | Executes in <600ms (vs ~1100ms sequential) |

### Integration Tests

| Test Case                      | Verification                    |
| ------------------------------ | ------------------------------- |
| /start on clean directory      | Preview shown, worktree created |
| /start on dirty directory      | Blocked with error message      |
| /start --force on dirty        | Proceeds with warning           |
| /start with existing branch    | Asks user to choose action      |
| /start with environment issues | Shows warnings but continues    |
| /start --security              | Runs audit, includes in results |

### E2E Scenarios

| Scenario                               | Expected Outcome                              |
| -------------------------------------- | --------------------------------------------- |
| Clean repo + new branch                | Success: worktree created, env verified       |
| Dirty repo + no --force                | Blocked: error message, suggests fix          |
| Dirty repo + --force                   | Success: warning shown, continues             |
| Branch exists + user chooses switch    | Success: worktree points to existing branch   |
| Branch exists + user chooses increment | Success: new branch created (name-2)          |
| Missing dependencies                   | Warning: dependency check fails, non-blocking |
| Lint errors                            | Warning: lint check fails, non-blocking       |

---

## Implementation Notes

### Why `../<repo>--<feature>` Naming?

1. **Locality:** Worktrees are siblings of the main repo directory, easy to find
2. **Clarity:** Pattern includes both repo and feature name for disambiguation
3. **Consistency:** Follows existing pattern used in the codebase
4. **Filesystem Safe:** Uses `--` separator to avoid special characters

### Why Block on Dirty State?

1. **Safety:** Prevents accidental loss of uncommitted work
2. **User Intent:** /start implies "begin new work", conflicting with uncommitted changes
3. **Git Best Practices:** Worktrees work best with clean state
4. **Escape Hatch:** --force flag available for legitimate edge cases

### Why Haiku for Sub-Agents?

1. **Cost:** Worktree setup and environment checks are deterministic, don't need Sonnet
2. **Speed:** Haiku is faster for simple operations
3. **Consistency:** Matches pattern from /ship (git-executor uses Haiku)

### Why Non-Blocking Environment Checks?

1. **Developer Autonomy:** Developers should decide if warnings are blocking
2. **CI Compatibility:** CI environments may have different requirements
3. **Flexibility:** Some warnings are project-specific (e.g., test coverage)
4. **Ship Gate:** /review and /ship commands enforce quality gates, /start doesn't need to

---

## Security Considerations

### Secret Scanning

- The `--security` flag triggers `pnpm audit` but does NOT scan for secrets
- Secret scanning is performed by /review command (Loop 1 Tier 2)
- /start focuses on environment setup, not code review

### File System Access

- Worktree creation requires write access to parent directory
- Validate paths to prevent directory traversal attacks
- Use `path.resolve()` to canonicalize paths before filesystem operations

### Command Injection

- All git commands use static strings, no user input interpolation
- Branch names are validated against regex before use
- execSync calls use array syntax where possible to avoid shell injection

---

## Alternatives Considered

### Alternative 1: Keep Worktree Creation in Hook

**Rejected:** Violates established pattern. Hooks should only inject context, not perform operations. This pattern is consistently followed by user-prompt-ship.cjs and user-prompt-review.cjs.

### Alternative 2: Use Sonnet for All Sub-Agents

**Rejected:** Overkill for deterministic operations. Worktree setup and environment checks don't require advanced reasoning. Haiku is sufficient and more cost-effective.

### Alternative 3: Block on All Environment Issues

**Rejected:** Too restrictive. Different projects have different quality standards. Non-blocking warnings give developers flexibility. Quality gates are enforced at /review and /ship stages.

### Alternative 4: Worktree Path in Current Directory

**Rejected:** Clutters the main repository directory. Using sibling directories (../) keeps worktrees separate and organized.

---

## Dependencies

### Shared Libraries (Phase 2)

| Library                | Purpose                   | Used By                |
| ---------------------- | ------------------------- | ---------------------- |
| command-utils.cjs      | Command detection         | All hooks              |
| verification-utils.cjs | Lint, test, build checks  | /start, /review        |
| git-utils.cjs          | Git status, branch checks | /start, /ship, /review |
| hook-base.cjs          | Base hook template        | All hooks              |

### External Tools

| Tool          | Purpose                   | Required |
| ------------- | ------------------------- | -------- |
| git           | Worktree management       | Yes      |
| pnpm/npm/yarn | Dependency installation   | Yes      |
| gh            | GitHub CLI (optional)     | No       |
| coderabbit    | CodeRabbit CLI (optional) | No       |

---

## Migration Path

### Phase 1: Safety & Consistency (Core Corrections)

1. Add dirty state check to user-prompt-start.cjs
2. Move worktree creation from hook to start.md agent instructions
3. Add preview display to start.md
4. Document /start flow in git-agent.md
5. Implement branch existence check in git-setup-agent

**Validation:** Test that hook only injects context, all operations delegated to agents

### Phase 2: DRY Refactoring (Shared Utilities)

1. Create .claude/scripts/lib/command-utils.cjs
2. Create .claude/scripts/lib/verification-utils.cjs
3. Create .claude/scripts/lib/git-utils.cjs
4. Update all hooks to use shared utilities
5. Refactor environment-check.cjs to use verification-utils

**Validation:** Test that behavior is unchanged, code duplication reduced by 40%+

### Phase 3: Efficiency & Completeness (Optimization)

1. Add parallel execution to environment-check.cjs
2. Implement config caching
3. Add progress display to start.md
4. Add --yes flag support
5. Add schema validation
6. Remove unused exports

**Validation:** Test that parallel execution reduces time by 30%+, all features work in CI mode

---

## Rollback Plan

### If Phase 1 Issues Found

1. Revert changes to user-prompt-start.cjs
2. Restore direct execSync calls in hook
3. Remove preview from start.md
4. Keep existing behavior as fallback

### If Phase 2 Utilities Cause Issues

1. Revert to inline implementations in hooks
2. Keep shared utilities as optional
3. Gradually migrate one hook at a time

### If Phase 3 Performance Degradation

1. Disable parallel execution
2. Revert to sequential tool checks
3. Profile and identify bottlenecks before re-enabling

---
