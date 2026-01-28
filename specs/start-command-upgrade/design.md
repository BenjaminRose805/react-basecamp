# Design: /start Command Upgrade

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** start-command-upgrade

## Overview

This design extends the current `/start` command from basic git operations to a comprehensive environment setup system. The upgrade adds five phases (DEPENDENCIES, TOOLING, VERIFICATION, GIT SETUP, REPORT) that execute sequentially, with auto-fix capabilities for common issues and structured output for both human and machine consumption.

---

## Architecture

### Current State

```
User runs /start [feature-name]
    |
    v
git-agent.md handles command
    |
    v
Git operations only:
    - Check current branch
    - Create feature branch
    - Check for uncommitted changes
    - Sync with remote
    |
    v
Ready to work (no environment verification)
```

### Target State

```
User runs /start [feature-name]
    |
    v
user-prompt-start.cjs hook detects /start
    |
    v
Execute environment-check.cjs script
    |
    v
PHASE 1: DEPENDENCIES
    - Detect package manager (pnpm/npm/yarn/bun)
    - Install node_modules if missing
    - Run postinstall scripts (husky, etc.)
    |
    v
PHASE 2: TOOLING
    - Check CodeRabbit CLI (install if missing with prompt)
    - Check GitHub CLI (report if missing)
    - Verify authentication status
    |
    v
PHASE 3: VERIFICATION
    - Run lint (with auto-fix if issues found)
    - Run typecheck (report errors)
    - Run tests (quick mode by default, full if --full flag)
    |
    v
PHASE 4: GIT SETUP (existing logic)
    - Check current branch
    - Create feature branch
    - Check uncommitted changes
    - Sync with remote
    |
    v
PHASE 5: REPORT
    - Display status summary (success/issues)
    - Write start-status.json
    - Inject summary into agent context
    |
    v
git-agent.md receives environment status
    |
    v
Proceed with feature development OR fix issues
```

---

## Component Design

### 1. Core Environment Check Script

**File:** `.claude/scripts/environment-check.cjs`

**Purpose:** Reusable script that performs all environment checks and returns structured results.

**Interface:**

```javascript
// Entry point
async function environmentCheck(options = {}) {
  return {
    status: 'ready' | 'issues',
    dependencies: { ... },
    tooling: { ... },
    verification: { ... },
    git: { ... },
    issues: [ ... ]
  };
}

// Phase functions
async function checkDependencies()   // PHASE 1
async function checkTooling()        // PHASE 2
async function runVerification()     // PHASE 3
async function checkGit()            // PHASE 4
function generateReport(results)     // PHASE 5
```

**Dependencies:**

- `.claude/scripts/lib/utils.cjs` - `commandExists()`, `runCommand()`, `isGitRepo()`
- `.claude/scripts/lib/package-manager.cjs` - `getPackageManager()`, `getRunCommand()`
- `.claude/config/environment.json` - Configuration for required tools and checks

---

### 2. Tool Installation Helper

**File:** `.claude/scripts/install-tools.cjs`

**Purpose:** Handle automatic installation of missing tools with user prompts.

**Interface:**

```javascript
// Install CodeRabbit CLI
async function installCodeRabbit(options = { prompt: true }) {
  if (options.prompt) {
    const confirmed = await promptUser("Install CodeRabbit CLI?");
    if (!confirmed) return { installed: false, skipped: true };
  }

  // Linux/macOS
  if (process.platform !== "win32") {
    await runCommand("curl -fsSL https://cli.coderabbit.ai/install.sh | sh");
    return { installed: true };
  }

  // Windows
  return { installed: false, unsupported: true };
}

// Check authentication
async function checkCodeRabbitAuth() {
  try {
    const result = await runCommand("coderabbit auth status");
    return { authenticated: true };
  } catch (e) {
    return { authenticated: false };
  }
}
```

**Error Handling:**

- Permission errors → Suggest sudo
- Network errors → Suggest manual installation
- Platform unsupported → Skip with warning

---

### 3. Configuration Schema

**File:** `.claude/config/environment.json`

**Schema:**

```json
{
  "requiredTools": [
    {
      "name": "coderabbit",
      "check": "coderabbit --version",
      "install": "curl -fsSL https://cli.coderabbit.ai/install.sh | sh",
      "installPrompt": "Install CodeRabbit CLI for local code review?",
      "authCheck": "coderabbit auth status",
      "platforms": ["linux", "darwin"]
    },
    {
      "name": "gh",
      "check": "gh --version",
      "install": null,
      "installPrompt": "GitHub CLI required. Install: https://cli.github.com",
      "authCheck": "gh auth status",
      "platforms": ["linux", "darwin", "win32"]
    }
  ],
  "verification": {
    "lint": {
      "command": "pnpm lint --quiet",
      "autoFix": "pnpm lint --fix",
      "required": true
    },
    "typecheck": {
      "command": "pnpm typecheck",
      "autoFix": null,
      "required": true
    },
    "tests": {
      "command": "pnpm test --run",
      "autoFix": null,
      "required": false
    },
    "build": {
      "command": "pnpm build",
      "autoFix": null,
      "required": false,
      "fullOnly": true
    }
  },
  "autoFix": {
    "dependencies": true,
    "lint": true,
    "tools": "prompt"
  }
}
```

---

### 4. State File Schema

**File:** `start-status.json` (output)

**Schema:**

```json
{
  "timestamp": "2026-01-27T10:30:00Z",
  "status": "ready" | "issues",
  "dependencies": {
    "status": "ok" | "error",
    "packageManager": "pnpm" | "npm" | "yarn" | "bun",
    "nodeModulesExists": true | false,
    "installRequired": false,
    "installTime": 0
  },
  "tooling": {
    "coderabbit": {
      "installed": true | false,
      "version": "1.2.3" | null,
      "authenticated": true | false,
      "skipped": false,
      "unsupported": false
    },
    "github": {
      "installed": true | false,
      "version": "2.40.0" | null,
      "authenticated": true | false,
      "user": "username" | null
    }
  },
  "verification": {
    "lint": {
      "status": "pass" | "fail" | "fixed" | "skipped",
      "errors": 0,
      "warnings": 2,
      "autoFixed": false
    },
    "typecheck": {
      "status": "pass" | "fail" | "skipped",
      "errors": 0,
      "details": []
    },
    "tests": {
      "status": "pass" | "fail" | "skipped",
      "passed": 42,
      "failed": 0,
      "skipped": 0,
      "duration": 5.2
    },
    "build": {
      "status": "pass" | "fail" | "skipped",
      "duration": 12.5
    }
  },
  "git": {
    "branch": "feature/my-feature",
    "clean": true | false,
    "ahead": 0,
    "behind": 0,
    "remote": "origin",
    "upToDate": true
  },
  "issues": [
    {
      "phase": "tooling" | "verification" | "git",
      "severity": "critical" | "warning" | "info",
      "message": "CodeRabbit CLI not authenticated",
      "fix": "coderabbit auth login"
    }
  ]
}
```

---

### 5. UserPromptSubmit Hook

**File:** `.claude/scripts/hooks/user-prompt-start.cjs`

**Purpose:** Intercept `/start` command and inject environment check results.

**Implementation:**

```javascript
module.exports = {
  name: "user-prompt-start",
  trigger: "UserPromptSubmit",

  condition(prompt) {
    return /^\/start\b/i.test(prompt.message);
  },

  async action(prompt) {
    const { environmentCheck } = require("../environment-check.cjs");
    const { generateReport } = require("../environment-check.cjs");

    // Run environment check
    const results = await environmentCheck({
      fullMode: prompt.message.includes("--full"),
      securityMode: prompt.message.includes("--security"),
      skipPrompts: process.env.CI === "true",
    });

    // Format summary for terminal
    const summary = generateReport(results);

    // Return injection
    return {
      inject: summary,
      state: results,
    };
  },
};
```

**Hook Registration:** Add to `.claude/settings.json`:

```json
{
  "hooks": [
    {
      "file": "hooks/user-prompt-start.cjs",
      "enabled": true
    }
  ]
}
```

---

## Data Flow

### Phase 1: Dependencies

```
1. Detect package manager
   - Check for pnpm-lock.yaml → pnpm
   - Check for yarn.lock → yarn
   - Check for package-lock.json → npm
   - Check for bun.lockb → bun

2. Check node_modules
   - Exists? → Skip installation
   - Missing? → Run install command

3. Run postinstall scripts (automatic via package manager)

Output: { status: 'ok', packageManager: 'pnpm', installRequired: false }
```

### Phase 2: Tooling

```
1. Check CodeRabbit CLI
   - command -v coderabbit
   - Not found? → Prompt for installation
   - If confirmed → curl install script
   - Verify: coderabbit --version

2. Check CodeRabbit auth
   - coderabbit auth status
   - Not authenticated? → Prompt user to login

3. Check GitHub CLI
   - command -v gh
   - Not found? → Report installation instructions
   - gh auth status → Check authentication

Output: { coderabbit: { installed, version, authenticated }, github: { ... } }
```

### Phase 3: Verification

```
1. Run lint
   - pnpm lint --quiet
   - Errors found? → Run pnpm lint --fix
   - Re-check after fix

2. Run typecheck
   - pnpm typecheck
   - Parse errors (file:line format)
   - No auto-fix available

3. Run tests
   - Quick mode: pnpm test --run
   - Full mode: pnpm test --run --coverage

4. Run build (if --full flag)
   - pnpm build
   - Report build time

Output: { lint: { status, errors, autoFixed }, typecheck: { ... }, tests: { ... } }
```

### Phase 4: Git Setup

```
1. Check current branch
   - git branch --show-current

2. Check for uncommitted changes
   - git status --porcelain

3. Create feature branch (if [feature-name] provided)
   - git checkout -b feature/[feature-name]

4. Sync with remote
   - git fetch origin
   - Check ahead/behind

Output: { branch, clean, ahead, behind }
```

### Phase 5: Report

```
1. Aggregate results from all phases

2. Determine overall status
   - All phases "ok" → status: 'ready'
   - Any phase has issues → status: 'issues'

3. Generate terminal output
   - Box-drawing characters
   - Color codes (✓ green, ✗ red, ⚠ yellow)
   - Actionable fix instructions

4. Write start-status.json

5. Return summary to hook for injection

Output: Formatted string + JSON file
```

---

## Error Handling Strategy

### Recoverable Errors (Warn and Continue)

| Error Type             | Handling                              |
| ---------------------- | ------------------------------------- |
| Missing node_modules   | Auto-install with package manager     |
| Lint errors (fixable)  | Run `pnpm lint --fix`, re-check       |
| Missing CodeRabbit CLI | Prompt for installation               |
| Test failures          | Report but don't block git operations |

### Blocking Errors (Require User Action)

| Error Type                        | Handling                     |
| --------------------------------- | ---------------------------- |
| Node.js not installed             | Report error, cannot proceed |
| Git not available                 | Report error, cannot proceed |
| Permission denied (sudo required) | Report with sudo suggestion  |

### Edge Case Handling

| Case                | Handling                                   |
| ------------------- | ------------------------------------------ |
| Offline mode        | Skip CodeRabbit/GitHub checks, warn user   |
| CI environment      | Skip interactive prompts, auto-install off |
| Windows platform    | Skip CodeRabbit (unsupported), warn user   |
| Detached HEAD state | Report warning, skip branch creation       |

---

## Output Format

### Success Output (Terminal)

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
│   ✓ GitHub CLI v2.40.0 (authenticated as username)          │
│                                                             │
│ VERIFICATION                                                │
│   ✓ Lint: passed (0 errors, 2 warnings)                     │
│   ✓ TypeCheck: passed                                       │
│   ✓ Tests: 42 passed in 5.2s                                │
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

### Failure Output (Terminal)

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
│   ✓ GitHub CLI v2.40.0 (authenticated)                      │
│                                                             │
│ VERIFICATION                                                │
│   ✓ Lint: passed (auto-fixed 3 errors)                      │
│   ✗ TypeCheck: 3 errors                                     │
│     → src/lib/auth.ts:45 - Type 'string' not assignable     │
│     → src/lib/auth.ts:67 - Property 'foo' does not exist    │
│     → src/api/users.ts:12 - Missing return type             │
│   ✓ Tests: 42 passed                                        │
│                                                             │
│ GIT                                                         │
│   Branch: feature/my-feature (created)                      │
│   Status: clean                                             │
│   Remote: up to date                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚠ Fix issues above before proceeding                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Reusable Infrastructure

### Existing Utilities (from codebase)

| Utility               | Location                                  | Purpose                                   |
| --------------------- | ----------------------------------------- | ----------------------------------------- |
| `commandExists()`     | `.claude/scripts/lib/utils.cjs`           | Check if command is available             |
| `runCommand()`        | `.claude/scripts/lib/utils.cjs`           | Execute shell command with error handling |
| `isGitRepo()`         | `.claude/scripts/lib/utils.cjs`           | Verify current directory is a git repo    |
| `getPackageManager()` | `.claude/scripts/lib/package-manager.cjs` | Detect pnpm/npm/yarn/bun                  |
| `getRunCommand()`     | `.claude/scripts/lib/package-manager.cjs` | Get run command for detected PM           |

### New Components (to create)

| Component               | Purpose                             |
| ----------------------- | ----------------------------------- |
| `environment-check.cjs` | Main environment check orchestrator |
| `install-tools.cjs`     | Tool installation with prompts      |
| `user-prompt-start.cjs` | Hook to trigger on /start           |
| `environment.json`      | Configuration for checks and tools  |

---

## Testing Strategy

### Unit Tests

| Test Case                 | Verification                             |
| ------------------------- | ---------------------------------------- |
| Package manager detection | Correctly identifies pnpm/npm/yarn/bun   |
| Tool installation prompt  | User confirmation works                  |
| Auto-fix detection        | Lint auto-fix triggers on fixable errors |
| State file schema         | Output matches defined JSON schema       |

### Integration Tests

| Test Case             | Verification                         |
| --------------------- | ------------------------------------ |
| Full /start execution | All 5 phases complete successfully   |
| Missing dependencies  | Auto-install works                   |
| Missing tools         | Prompts user correctly               |
| Verification failures | Reports errors with actionable fixes |
| Offline mode          | Skips network checks gracefully      |
| CI mode               | Skips prompts, non-interactive       |

### Manual Testing

| Test Case            | Verification                      |
| -------------------- | --------------------------------- |
| Fresh clone scenario | /start installs everything needed |
| Windows platform     | Skips CodeRabbit, warns user      |
| Permission errors    | Suggests sudo when needed         |
| User cancels prompt  | Skips tool, continues workflow    |

---

## Security Considerations

### Install Scripts

- CodeRabbit CLI install uses curl|sh pattern (common but has security implications)
- Verify script URL is HTTPS
- Prompt user before executing (prompt mode default)
- Document manual installation alternative

### Authentication Checks

- CodeRabbit auth status may expose API tokens in output → handle securely
- GitHub CLI auth status is safe (only shows username)

### State File

- `start-status.json` may contain sensitive info (usernames, file paths)
- Add to `.gitignore` if not already present
- Avoid logging full command outputs (may contain secrets)

---

## Alternatives Considered

### Alternative 1: SessionStart Hook Instead of UserPromptSubmit

**Rejected:** SessionStart runs on every new session, which would slow down startup. UserPromptSubmit on `/start` is more explicit and only runs when user intends to start work.

### Alternative 2: Separate Commands (/check-env, /start)

**Rejected:** Two-command flow adds friction. Single `/start` command provides better UX ("one command to rule them all").

### Alternative 3: Auto-Install All Tools Without Prompts

**Rejected:** Installing tools without user knowledge is invasive. "Prompt" mode respects user control while still offering convenience.

---

## Dependencies

| Component                                 | Version           | Purpose                          |
| ----------------------------------------- | ----------------- | -------------------------------- |
| Node.js                                   | 18+               | Script execution runtime         |
| Git                                       | 2.0+              | Git operations                   |
| Package manager                           | pnpm/npm/yarn/bun | Dependency installation          |
| CodeRabbit CLI                            | Latest            | Local code review (auto-install) |
| GitHub CLI                                | Latest            | PR operations (optional)         |
| `.claude/scripts/lib/utils.cjs`           | Current           | Command utilities                |
| `.claude/scripts/lib/package-manager.cjs` | Current           | Package manager detection        |

---
