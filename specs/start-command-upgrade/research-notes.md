# Research Notes: /start Command Upgrade

> **Date:** 2026-01-27
> **Status:** Research Complete
> **Decision:** PROCEED when ready to implement

## Executive Summary

Upgrade the `/start` command to handle full environment setup and verification, including CodeRabbit CLI installation. This ensures developers can run a single command to get a fully working environment.

**Goal:** One command to rule them all - `/start` guarantees everything works.

---

## Problem Statement

Current `/start` behavior:

- Basic git operations (branch creation, etc.)
- No dependency verification
- No tooling installation
- No health checks

Issues:

- Developers hit errors mid-workflow due to missing tools
- CodeRabbit CLI needs manual installation
- No verification that lint/typecheck/tests pass before starting work
- Agent wastes tokens discovering environment issues

Proposed `/start` behavior:

- Install all dependencies
- Install and configure tooling (CodeRabbit CLI, etc.)
- Verify environment health
- Report ready status or actionable errors

---

## Current /start Implementation

### Location

`.claude/commands/start.md` or handled by `git-agent.md`

### Current Capabilities

| Feature                | Status |
| ---------------------- | ------ |
| Create feature branch  | Yes    |
| Check git status       | Yes    |
| Install dependencies   | No     |
| Install CodeRabbit CLI | No     |
| Verify tooling         | No     |
| Health checks          | No     |

---

## Proposed /start Workflow

```
/start [feature-name]
  │
  ├── Phase 1: DEPENDENCIES
  │   ├── Detect package manager (pnpm/npm/yarn)
  │   ├── Install node dependencies if needed
  │   └── Run postinstall scripts (husky, etc.)
  │
  ├── Phase 2: TOOLING
  │   ├── Check CodeRabbit CLI installed
  │   │   └── If missing: install automatically
  │   ├── Check CodeRabbit authenticated
  │   │   └── If not: prompt user to authenticate
  │   └── Check other required tools (gh cli, etc.)
  │
  ├── Phase 3: VERIFICATION
  │   ├── pnpm lint (quick check)
  │   ├── pnpm typecheck (type errors?)
  │   ├── pnpm test (tests pass?)
  │   └── coderabbit --version (CLI works?)
  │
  ├── Phase 4: GIT SETUP
  │   ├── Check current branch
  │   ├── Create feature branch if needed
  │   ├── Check for uncommitted changes
  │   └── Sync with remote
  │
  └── Phase 5: REPORT
      ├── Environment status
      ├── Tools status
      ├── Codebase health
      └── Ready to work / Issues to fix
```

---

## Installation Requirements

### Node Dependencies

```bash
# Detect package manager
if [ -f "pnpm-lock.yaml" ]; then
  pnpm install
elif [ -f "yarn.lock" ]; then
  yarn install
else
  npm install
fi
```

### CodeRabbit CLI

**Check:**

```bash
command -v coderabbit || command -v cr
```

**Install (if missing):**

```bash
# Linux/macOS
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Or via Homebrew (macOS)
brew install coderabbit
```

**Verify:**

```bash
coderabbit --version
```

### CodeRabbit Authentication

**Check:**

```bash
# Check if authenticated (may need to test with actual command)
coderabbit auth status 2>/dev/null || echo "not authenticated"
```

**Authenticate (if needed):**

```bash
coderabbit auth login
# Opens browser for OAuth flow
```

### GitHub CLI

**Check:**

```bash
command -v gh && gh auth status
```

**Install (if missing):**

```bash
# macOS
brew install gh

# Linux
# See https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

---

## Verification Checks

### Quick Health Checks

| Check      | Command                | Pass Criteria        |
| ---------- | ---------------------- | -------------------- |
| Lint       | `pnpm lint --quiet`    | Exit code 0          |
| TypeCheck  | `pnpm typecheck`       | Exit code 0          |
| Tests      | `pnpm test --run`      | Exit code 0          |
| CodeRabbit | `coderabbit --version` | Returns version      |
| Git        | `git status`           | Not in detached HEAD |
| GitHub     | `gh auth status`       | Authenticated        |

### Optional Deep Checks

| Check          | Command         | When                 |
| -------------- | --------------- | -------------------- |
| Build          | `pnpm build`    | If `--full` flag     |
| E2E Tests      | `pnpm test:e2e` | If `--full` flag     |
| Security Audit | `pnpm audit`    | If `--security` flag |

---

## Hook vs Script Integration

### Option A: UserPromptSubmit Hook (Recommended)

```javascript
// user-prompt-start.cjs
// Trigger: UserPromptSubmit on /start

{
  trigger: "UserPromptSubmit",
  condition: (prompt) => /^\/start/.test(prompt.message),
  action: async (prompt) => {
    const results = {
      dependencies: await checkDependencies(),
      tooling: await checkTooling(),
      verification: await runVerification(),
    };

    writeState('start-status.json', results);

    const summary = formatStartSummary(results);
    return { inject: summary };
  }
}
```

**Pros:**

- Runs automatically when `/start` is invoked
- Results injected into agent context
- Agent can proceed or handle issues

### Option B: Standalone Script

```bash
node .claude/scripts/environment-check.cjs
```

**Pros:**

- Can be run independently
- Can be used in CI/CD
- More portable

### Recommendation: Both

- Hook calls the script for `/start` command
- Script can also be run manually or in CI

---

## Output Format

### Success Output

```
┌─────────────────────────────────────────────────────────────┐
│ /start - Environment Ready                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ DEPENDENCIES                                                │
│   ✓ pnpm install (node_modules up to date)                  │
│                                                             │
│ TOOLING                                                     │
│   ✓ CodeRabbit CLI v1.2.3                                   │
│   ✓ CodeRabbit authenticated                                │
│   ✓ GitHub CLI authenticated                                │
│                                                             │
│ VERIFICATION                                                │
│   ✓ Lint: passed                                            │
│   ✓ TypeCheck: passed                                       │
│   ✓ Tests: 42 passed                                        │
│                                                             │
│ GIT                                                         │
│   Branch: feature/my-feature (created)                      │
│   Status: clean                                             │
│   Remote: up to date                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ✓ Ready to work!                                            │
└─────────────────────────────────────────────────────────────┘
```

### Failure Output (Actionable)

```
┌─────────────────────────────────────────────────────────────┐
│ /start - Issues Found                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ DEPENDENCIES                                                │
│   ✓ pnpm install                                            │
│                                                             │
│ TOOLING                                                     │
│   ✗ CodeRabbit CLI not installed                            │
│     → Run: curl -fsSL https://cli.coderabbit.ai/install.sh | sh
│   ✗ CodeRabbit not authenticated                            │
│     → Run: coderabbit auth login                            │
│                                                             │
│ VERIFICATION                                                │
│   ✓ Lint: passed                                            │
│   ✗ TypeCheck: 3 errors                                     │
│     → src/lib/auth.ts:45 - Type 'string' not assignable     │
│     → src/lib/auth.ts:67 - Property 'foo' does not exist    │
│     → src/api/users.ts:12 - Missing return type             │
│   ✓ Tests: passed                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ✗ Fix issues above before proceeding                        │
└─────────────────────────────────────────────────────────────┘
```

---

## State File Format

```json
{
  "timestamp": "2026-01-27T10:30:00Z",
  "status": "ready" | "issues",
  "dependencies": {
    "status": "ok",
    "packageManager": "pnpm",
    "nodeModulesExists": true
  },
  "tooling": {
    "coderabbit": {
      "installed": true,
      "version": "1.2.3",
      "authenticated": true
    },
    "github": {
      "installed": true,
      "authenticated": true,
      "user": "username"
    }
  },
  "verification": {
    "lint": { "status": "pass", "errors": 0, "warnings": 2 },
    "typecheck": { "status": "pass", "errors": 0 },
    "tests": { "status": "pass", "passed": 42, "failed": 0 }
  },
  "git": {
    "branch": "feature/my-feature",
    "clean": true,
    "ahead": 0,
    "behind": 0
  },
  "issues": []
}
```

---

## Auto-Fix Capabilities

Some issues can be fixed automatically:

| Issue                        | Auto-Fix                | Command           |
| ---------------------------- | ----------------------- | ----------------- |
| Missing node_modules         | Yes                     | `pnpm install`    |
| Missing CodeRabbit CLI       | Yes (with confirmation) | `curl ... \| sh`  |
| CodeRabbit not authenticated | No (requires browser)   | Prompt user       |
| Lint errors                  | Partial                 | `pnpm lint --fix` |
| Type errors                  | No                      | Report to user    |
| Test failures                | No                      | Report to user    |
| Outdated dependencies        | Optional                | `pnpm update`     |

### Auto-Fix Flow

```
/start
  │
  ├── Check environment
  │
  ├── Issues found?
  │   │
  │   ├── Auto-fixable issues?
  │   │   ├── Yes → Fix automatically
  │   │   └── Re-check
  │   │
  │   └── Manual issues?
  │       └── Report with instructions
  │
  └── All clear → Ready to work
```

---

## SessionStart Hook Integration

Could also integrate with existing `session-start.cjs` hook:

```javascript
// Enhance session-start.cjs to run environment checks
// on every new session

{
  trigger: "SessionStart",
  action: async () => {
    // Quick checks only (don't slow down session start)
    const quickStatus = await quickEnvironmentCheck();

    if (quickStatus.issues.length > 0) {
      return {
        inject: `⚠️ Environment issues detected. Run /start to fix.`
      };
    }

    return {}; // Silent if all good
  }
}
```

---

## Configuration

### `.claude/config/environment.json`

```json
{
  "requiredTools": [
    {
      "name": "coderabbit",
      "check": "coderabbit --version",
      "install": "curl -fsSL https://cli.coderabbit.ai/install.sh | sh",
      "installPrompt": "Install CodeRabbit CLI for local code review?"
    },
    {
      "name": "gh",
      "check": "gh --version",
      "install": null,
      "installPrompt": "GitHub CLI required. See https://cli.github.com"
    }
  ],
  "verification": {
    "lint": { "command": "pnpm lint --quiet", "required": true },
    "typecheck": { "command": "pnpm typecheck", "required": true },
    "tests": { "command": "pnpm test --run", "required": false }
  },
  "autoFix": {
    "dependencies": true,
    "lint": true,
    "tools": "prompt"
  }
}
```

---

## Implementation Components

| Component               | Type          | Purpose                      |
| ----------------------- | ------------- | ---------------------------- |
| `/start` command        | Slash command | Entry point                  |
| `user-prompt-start.cjs` | Hook          | Orchestrate checks on /start |
| `environment-check.cjs` | Script        | Reusable environment checker |
| `install-tools.cjs`     | Script        | Tool installation helper     |
| `start-status.json`     | State file    | Store check results          |
| `environment.json`      | Config        | Required tools and checks    |

---

## Edge Cases

### 1. Offline Mode

```javascript
if (!(await isOnline())) {
  return {
    inject: `⚠️ Offline mode: Skipping CodeRabbit checks. Local tools verified.`,
  };
}
```

### 2. CI Environment

```javascript
if (process.env.CI) {
  // Skip interactive prompts
  // Skip tool installation (should be in CI config)
  // Focus on verification only
}
```

### 3. Windows Support

```javascript
// CodeRabbit CLI doesn't support Windows yet
if (process.platform === "win32") {
  return {
    inject: `⚠️ CodeRabbit CLI not available on Windows. Using remote review only.`,
  };
}
```

### 4. Permission Errors

```javascript
// Handle sudo requirements gracefully
try {
  await installCodeRabbit();
} catch (e) {
  if (e.message.includes("permission denied")) {
    return {
      inject: `CodeRabbit install failed. Try: sudo curl -fsSL ... | sh`,
    };
  }
}
```

---

## Open Questions

1. **Auto-install tools?** Should we automatically install CodeRabbit CLI, or always prompt?

2. **Verification depth:** Run full test suite on `/start`, or just quick checks?

3. **Session start integration:** Should session-start hook do quick checks, or leave it all to `/start`?

4. **Failure behavior:** If verification fails, should `/start` block further work or just warn?

5. **Config file location:** Use `.claude/config/` or keep in hook/script?

---

## Related Specs

- `specs/scripting-opportunities/` - Hooks and scripts infrastructure
- `specs/local-code-review/` - CodeRabbit CLI (this ensures it's installed)

---

## Next Steps

When ready to implement:

1. **Create environment check script** - Core verification logic
2. **Create `/start` command** - Entry point with full workflow
3. **Create UserPromptSubmit hook** - Auto-run on `/start`
4. **Add configuration** - Required tools and checks
5. **Test on fresh clone** - Verify install flow works

Run `/design start-command-upgrade` to create full implementation spec.
