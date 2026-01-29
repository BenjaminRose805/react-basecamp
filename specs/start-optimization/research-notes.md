# /start Command Research Report

## Executive Summary

The `/start` command is designed to set up development environments by verifying dependencies, tooling, and git state, then creating worktrees for feature work. After thorough investigation, I've identified several opportunities for improvement across efficiency, DRY, safety, consistency, and completeness.

---

## 1. Efficiency Issues

### 1.1 Sequential Execution Where Parallel is Possible

**Location:** `.claude/scripts/environment-check.cjs` (lines 366-464)

**Issue:** The `environmentCheck` function executes all 4 phases sequentially:

```javascript
// PHASE 1: Dependencies
results.dependencies = await checkDependencies();
// PHASE 2: Tooling
results.tooling = await checkTooling();
// PHASE 3: Verification
results.verification = await runVerification(options);
// PHASE 4: Git
results.git = checkGit();
```

**Problem:** Phases 2, 3, and 4 are independent of each other and could run in parallel. This is especially wasteful when `--full` mode runs lint, typecheck, tests, and build sequentially.

**Recommendation:** Use `Promise.all()` for independent phases:

```javascript
const [dependencies] = await Promise.all([checkDependencies()]);
// Then in parallel:
const [tooling, verification, git] = await Promise.all([
  checkTooling(),
  runVerification(options),
  Promise.resolve(checkGit()),
]);
```

### 1.2 Redundant Config Loading

**Location:** `.claude/scripts/environment-check.cjs`

**Issue:** `loadConfig()` is called multiple times:

- Line 157 in `checkTooling()`
- Line 229 in `runVerification()`
- Lines 401, 539 in `environmentCheck()` and `generateReport()`

**Recommendation:** Load config once at the beginning and pass it as a parameter.

### 1.3 Package Manager Detection Duplication

**Location:**

- `.claude/scripts/hooks/session-start.cjs` (lines 51-53)
- `.claude/scripts/hooks/user-prompt-start.cjs` (via environment-check.cjs)

**Issue:** Package manager is detected in both hooks independently when `/start` is run after session start.

**Recommendation:** Cache package manager detection result or share state between hooks.

### 1.4 DNS Check on Every Tool Check

**Location:** `.claude/scripts/environment-check.cjs` (lines 98-108)

**Issue:** `isOnline()` is called and awaited, but this could be slow on networks with intermittent connectivity.

**Recommendation:** Add timeout to DNS check or cache result for the session.

---

## 2. DRY (Don't Repeat Yourself) Issues

### 2.1 Command Pattern Detection Duplicated

**Location:** Multiple hook files use similar patterns:

- `.claude/scripts/hooks/user-prompt-start.cjs` (line 23): `const START_PATTERN = /^\/start\b/i;`
- `.claude/scripts/hooks/user-prompt-ship.cjs` (line 23): `const SHIP_PATTERN = /^\/ship\b/i;`
- `.claude/scripts/hooks/user-prompt-review.cjs` (line 32): `const REVIEW_PATTERN = /^\/review\b/i;`

**Recommendation:** Extract to shared utility:

```javascript
// In lib/utils.cjs
function createCommandPattern(command) {
  return new RegExp(`^\/${command}\\b`, "i");
}
```

### 2.2 Duplicate Context Injection Pattern

**Location:** All three user-prompt hooks have nearly identical structure:

- Read stdin JSON
- Check if message matches command pattern
- Parse flags
- Run some check
- Log context with formatted markdown

**Recommendation:** Create a `CommandHook` base class or factory function:

```javascript
function createCommandHook(pattern, flagPatterns, handler) {
  return async function main() {
    const input = await readStdinJson();
    const message = input.message || input.prompt || "";
    if (!message || typeof message !== "string") process.exit(0);
    const trimmed = message.trim();
    if (!pattern.test(trimmed)) process.exit(0);
    const flags = parseFlags(trimmed, flagPatterns);
    await handler(flags, trimmed);
    process.exit(0);
  };
}
```

### 2.3 Verification Logic Duplicated Between /start and /review

**Location:**

- `.claude/scripts/environment-check.cjs` (runVerification, lines 228-323)
- Review hook also runs lint/typecheck/tests

**Issue:** Both `/start` and `/review` run lint, typecheck, and tests with similar logic.

**Recommendation:** Extract shared verification runner to `lib/verification.cjs`.

### 2.4 Git Status Functions Duplicated

**Location:**

- `.claude/scripts/lib/utils.cjs` (getGitStatus, lines 252-269)
- `.claude/scripts/environment-check.cjs` (checkGit, lines 328-361)

**Issue:** Both functions get branch and status, but in different formats.

**Recommendation:** Use a single `getGitInfo()` function that returns all needed data.

---

## 3. Safety Issues

### 3.1 No Worktree Creation in /start Hook

**Location:** `.claude/commands/start.md` (line 82)

**Critical Issue:** The command documentation says:

```bash
git worktree add ../project-{feature-name} -b feature/{feature-name}
```

But the `user-prompt-start.cjs` hook only runs environment checks - it does NOT create the worktree. The actual worktree creation must happen in the agent execution, but:

1. The git-agent.md file documents `/ship` flow but NOT `/start` flow
2. There's no start-specific sub-agent definition
3. The worktree path naming is inconsistent:
   - Command says: `../project-{feature-name}`
   - git-operations skill says: `../<repo>--<feature>`

**Recommendation:**

1. Add /start flow documentation to git-agent.md
2. Define clear worktree naming convention
3. Consider adding worktree creation to the hook for consistency

### 3.2 No Branch Existence Check

**Location:** `.claude/commands/start.md` (lines 159-164)

**Issue:** Error handling table mentions "Branch already exists" but there's no code to check this.

**Recommendation:** Add pre-check before worktree creation:

```bash
git rev-parse --verify feature/{feature-name} 2>/dev/null
```

### 3.3 No Dirty Working Directory Check Before Worktree

**Location:** `.claude/scripts/environment-check.cjs` (checkGit)

**Issue:** While `checkGit()` captures `clean` status, there's no blocking behavior. The command should warn/block if there are uncommitted changes that might be lost.

**Recommendation:** Add blocking behavior or clear warning for dirty state.

### 3.4 Write State File Without Error Propagation

**Location:** `.claude/scripts/environment-check.cjs` (lines 469-485)

**Issue:** `writeStateFile` catches errors and returns false, but this failure is not propagated to the user.

**Recommendation:** Add warning to user when state file write fails.

### 3.5 Security Audit Flag Not Implemented

**Location:** `.claude/commands/start.md` (lines 29, 37)

**Issue:** Documentation mentions `--security` flag for "trufflehog, gitleaks" but there's no implementation in environment-check.cjs.

**Recommendation:** Implement security scanning or remove the flag from documentation.

---

## 4. Consistency Issues

### 4.1 Inconsistent Agent Delegation Pattern

**Location:** Comparing commands:

- `/design` (lines 15-68): Has detailed Task examples with 3 phases
- `/ship` (lines 6-13): Has MANDATORY preview + agent delegation section
- `/start` (line 77): Only says "On user confirmation" but no agent delegation

**Issue:** `/start` doesn't follow the "MANDATORY: Preview and Agent Delegation" pattern used by `/design` and `/ship`.

**Recommendation:** Add explicit agent delegation section to start.md:

```markdown
## MANDATORY: Preview and Agent Delegation

> **Before executing /start:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/git-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly
```

### 4.2 Git Agent Missing /start Flow

**Location:** `.claude/agents/git-agent.md`

**Issue:** The git-agent only documents `/ship` flow (lines 23-40) but not `/start` flow, even though both use git operations.

**Recommendation:** Add `/start` flow documentation:

````markdown
## /start Flow

```text
/start [feature-name]
  │
  ├─► 1. Environment Check (via hook)
  │   └─ Dependencies, tooling, verification
  │
  ├─► git-executor (Haiku)
  │   └─ git worktree add
  │   └─ git checkout -b
  │
  └─► Report Results
      └─ Next steps
```
````

### 4.3 Inconsistent Worktree Path Naming

**Locations:**

- `start.md` (line 82): `../project-{feature-name}`
- `git-operations/SKILL.md` (line 167): `../<repo>--<feature>`

**Recommendation:** Standardize on one convention. The `<repo>--<feature>` pattern is more informative and prevents collisions.

### 4.4 Inconsistent Flag Parsing

**Location:** Comparing hooks:

- `user-prompt-start.cjs` (lines 43-46): Uses object notation `{ full: ..., security: ... }`
- `user-prompt-review.cjs` (lines 39-53): Uses similar pattern but with function
- `user-prompt-ship.cjs` (line 55): Inline regex test for `--force`

**Recommendation:** Create shared flag parsing utility in lib/utils.cjs.

---

## 5. Completeness Issues

### 5.1 Missing Sub-Agent for /start

**Location:** `.claude/sub-agents/git/`

**Issue:** Directory contains `pr-reviewer.md` and `git-executor.md` but no `start-executor.md` or equivalent.

**Recommendation:** Either:

1. Add `start-executor.md` sub-agent for worktree creation
2. Or document that git-executor handles start operations

### 5.2 No Progress Display for /start

**Location:** Comparing to `/ship` (lines 72-86 show progress display)

**Issue:** `/start` has no progress display pattern defined, unlike `/ship` which shows stage progress.

**Recommendation:** Add progress display section to start.md.

### 5.3 Missing --yes/--skip-verification Flags

**Location:** `.claude/commands/start.md` (lines 34-38)

**Issue:** Other commands support skipping confirmation (`/ship --force`). `/start` should have similar option for CI/automation.

**Recommendation:** Add `--yes` flag to skip preview confirmation.

### 5.4 No Environment Config Schema Validation

**Location:** `.claude/config/environment.json` (line 2)

**Issue:** File declares `$schema` but there's no actual JSON schema file referenced.

**Recommendation:** Either remove the `$schema` line or create an actual schema file.

### 5.5 Missing grepFile Usage

**Location:** `.claude/scripts/lib/utils.cjs` (lines 459-474)

**Issue:** `grepFile` is exported but not used anywhere.

**Recommendation:** Use in verification for better error parsing or remove if unused.

---

## 6. Open Questions

### 6.1 Should /start Block on Issues?

Currently, `/start` reports issues but continues. Should critical issues (like missing dependencies) block worktree creation?

### 6.2 What Should Happen When Worktree Already Exists?

Options:

1. Error and suggest cleanup
2. Ask to switch to existing worktree
3. Auto-increment name (e.g., `feature/login-2`)

### 6.3 Should Environment Check Results Be Cached?

If user runs `/start` multiple times in quick succession, should results be cached?

### 6.4 Should /start Create Empty Commit?

Some workflows create an initial empty commit to establish the branch. Should `/start` do this?

---

## Summary of Priority Recommendations

### High Priority (Safety/Correctness)

1. Implement actual worktree creation in /start or document agent delegation clearly
2. Add branch existence check before worktree creation
3. Add dirty working directory blocking
4. Implement or remove --security flag

### Medium Priority (Consistency)

1. Add "MANDATORY: Preview and Agent Delegation" section to start.md
2. Document /start flow in git-agent.md
3. Standardize worktree naming convention
4. Create shared flag parsing utility

### Low Priority (Efficiency/DRY)

1. Parallelize independent environment check phases
2. Cache config loading
3. Extract command hook pattern to shared utility
4. Share verification logic between /start and /review

---

## Files Analyzed

| File                                          | Purpose                             |
| --------------------------------------------- | ----------------------------------- |
| `.claude/commands/start.md`                   | Main command documentation          |
| `.claude/agents/git-agent.md`                 | Agent that should handle /start     |
| `.claude/scripts/hooks/user-prompt-start.cjs` | Hook that runs environment check    |
| `.claude/scripts/hooks/session-start.cjs`     | Session initialization hook         |
| `.claude/scripts/environment-check.cjs`       | Core environment verification logic |
| `.claude/scripts/lib/utils.cjs`               | Shared utilities                    |
| `.claude/scripts/lib/package-manager.cjs`     | Package manager detection           |
| `.claude/skills/git-operations/SKILL.md`      | Git procedures including worktree   |
| `.claude/sub-agents/git/git-executor.md`      | Git command executor sub-agent      |
| `.claude/sub-agents/git/README.md`            | Git sub-agents overview             |
| `.claude/config/environment.json`             | Environment check configuration     |
