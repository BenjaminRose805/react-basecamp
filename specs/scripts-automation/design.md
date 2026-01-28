# Scripts Automation Design

## 1. Architecture Overview

### 1.1 Directory Structure

```
.claude/
├── scripts/
│   ├── lib/                    # Shared utilities
│   │   ├── git-utils.cjs       # Git command wrappers
│   │   ├── check-utils.cjs     # Test/lint output parsing
│   │   ├── state-utils.cjs     # State file CRUD
│   │   └── ascii-utils.cjs     # Preview box rendering
│   │
│   ├── git/                    # Git operations (8 scripts)
│   │   ├── create-branch.cjs
│   │   ├── get-status.cjs
│   │   ├── prepare-commit.cjs
│   │   ├── create-pr.cjs
│   │   ├── get-pr-comments.cjs
│   │   ├── poll-ci.cjs
│   │   ├── sync-main.cjs
│   │   └── cleanup-branches.cjs
│   │
│   ├── check/                  # Quality checks (4 scripts)
│   │   ├── run-qa-suite.cjs
│   │   ├── security-scan.cjs
│   │   ├── coverage-check.cjs
│   │   └── find-tests.cjs
│   │
│   ├── research/               # Codebase research (4 scripts)
│   │   ├── find-implementations.cjs
│   │   ├── find-patterns.cjs
│   │   ├── query-specs.cjs
│   │   └── analyze-dependencies.cjs
│   │
│   ├── state/                  # State management (3 scripts)
│   │   ├── loop-state.cjs
│   │   ├── review-results.cjs
│   │   └── session-context.cjs
│   │
│   ├── preview/                # ASCII rendering (3 scripts)
│   │   ├── generate.cjs
│   │   ├── templates.cjs
│   │   └── progress.cjs
│   │
│   ├── coderabbit/             # CodeRabbit integration (5 scripts)
│   │   ├── run-local.cjs
│   │   ├── fetch-pr-review.cjs
│   │   ├── parse-findings.cjs
│   │   ├── format-report.cjs
│   │   └── rate-limit.cjs
│   │
│   └── review/                 # Review orchestration (4 scripts)
│       ├── unified-review.cjs
│       ├── loop1-fast.cjs
│       ├── loop1-deep.cjs
│       └── aggregate.cjs
│
└── state/                      # Runtime state files
    ├── loop-state.json
    ├── review-results.json
    ├── session-context.json
    └── rate-limit.json
```

### 1.2 Design Principles

1. **Single Responsibility**: Each script does one thing well
2. **Composable**: Scripts can be chained via stdin/stdout
3. **Fail Open**: Errors don't block, just warn
4. **Deterministic**: Same input produces same output
5. **Observable**: Clear logging for debugging

---

## 2. Consistent API Specification

### 2.1 Module Interface

Every script exports a consistent interface:

```javascript
/**
 * @typedef {Object} ScriptResult
 * @property {boolean} success - Whether execution succeeded
 * @property {*} [data] - Result data on success
 * @property {string} [error] - Error message on failure
 * @property {string[]} [warnings] - Non-fatal warnings
 */

/**
 * @typedef {Object} ScriptOptions
 * @property {boolean} [verbose] - Enable verbose output
 * @property {boolean} [dryRun] - Don't make changes
 * @property {number} [timeout] - Timeout in ms
 */

module.exports = {
  /**
   * Execute the script
   * @param {Object} input - Script-specific input
   * @param {ScriptOptions} options - Execution options
   * @returns {Promise<ScriptResult>}
   */
  execute: async (input, options = {}) => {
    // Implementation
  },
};
```

### 2.2 CLI Wrapper Pattern

Each script includes a CLI wrapper for direct execution:

```javascript
const { execute } = module.exports;

// CLI execution
if (require.main === module) {
  const {
    readStdinJson,
    logContext,
    logError,
  } = require("../lib/io-utils.cjs");

  (async () => {
    try {
      const input = await readStdinJson();
      const result = await execute(input, {
        verbose: process.env.VERBOSE === "1",
      });

      logContext(result);
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      logError(err.message);
      process.exit(2);
    }
  })();
}
```

### 2.3 I/O Conventions

| Stream | Purpose        | Format                      |
| ------ | -------------- | --------------------------- |
| stdin  | Input data     | JSON                        |
| stdout | Claude context | JSON (via `logContext`)     |
| stderr | User messages  | Plain text (via `logError`) |

Exit Codes:

- `0` - Success
- `1` - Error (recoverable)
- `2` - Blocked (stop execution)

---

## 3. Data Schemas

### 3.1 Git Schemas

```typescript
// git/get-status.cjs output
interface GitStatus {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  clean: boolean;
}

interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  oldPath?: string; // for renames
}

// git/prepare-commit.cjs output
interface CommitPreparation {
  suggestedType: "feat" | "fix" | "docs" | "test" | "chore" | "refactor";
  scope: string | null;
  summary: string;
  body: string[];
  files: FileChange[];
  breaking: boolean;
}

// git/create-pr.cjs input
interface PRCreateInput {
  title: string;
  body: string;
  base?: string; // default: main
  draft?: boolean;
  labels?: string[];
}
```

### 3.2 Check Schemas

```typescript
// check/run-qa-suite.cjs output
interface QAResults {
  passed: boolean;
  duration: number; // ms
  results: {
    typecheck: CheckResult;
    lint: LintResult;
    test: TestResult;
    build: BuildResult;
  };
  summary: string;
}

interface CheckResult {
  passed: boolean;
  errors: number;
  warnings?: number;
  details?: string[];
}

interface LintResult extends CheckResult {
  byRule: Record<string, number>;
  autoFixable: number;
}

interface TestResult extends CheckResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}
```

### 3.3 Research Schemas

```typescript
// research/find-implementations.cjs input/output
interface FindImplementationsInput {
  query: string;
  type?: "function" | "class" | "component" | "hook" | "any";
  include?: string[]; // glob patterns
  exclude?: string[];
}

interface Implementation {
  name: string;
  type: string;
  path: string;
  line: number;
  preview: string; // first few lines
}

// research/find-patterns.cjs input
interface FindPatternsInput {
  mode: "hook" | "component" | "api" | "test" | "util";
  limit?: number;
}
```

### 3.4 State Schemas

```typescript
// state/loop-state.cjs
interface LoopState {
  currentLoop: 1 | 2 | 3 | 4;
  feature: string;
  startedAt: string; // ISO
  loops: {
    [key: number]: {
      status: "pending" | "running" | "passed" | "failed";
      findings: Finding[];
      duration?: number;
    };
  };
}

interface Finding {
  id: string;
  severity: "critical" | "warning" | "suggestion" | "nitpick";
  message: string;
  file?: string;
  line?: number;
  source: "lint" | "test" | "security" | "coderabbit" | "llm";
  resolved: boolean;
}

// state/session-context.cjs
interface SessionContext {
  feature: string;
  spec: string;
  branch: string;
  phase: "design" | "implement" | "review" | "ship";
  tasks: Task[];
  lastCommand: string;
  updatedAt: string;
}
```

### 3.5 Preview Schemas

```typescript
// preview/generate.cjs input
interface PreviewInput {
  template: "commit" | "pr" | "qa" | "review" | "custom";
  title: string;
  sections: PreviewSection[];
  actions?: PreviewAction[];
}

interface PreviewSection {
  heading?: string;
  content: string | string[];
  style?: "normal" | "code" | "list" | "table";
}

interface PreviewAction {
  key: string;
  label: string;
  description?: string;
}
```

### 3.6 CodeRabbit Schemas

```typescript
// coderabbit/parse-findings.cjs output
interface CodeRabbitFindings {
  summary: string;
  findings: CRFinding[];
  stats: {
    critical: number;
    warning: number;
    suggestion: number;
    nitpick: number;
  };
}

interface CRFinding {
  severity: "critical" | "warning" | "suggestion" | "nitpick";
  category: string;
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

// coderabbit/rate-limit.cjs
interface RateLimitState {
  allowed: boolean;
  remaining: number;
  limit: number;
  window: number; // seconds
  resetsAt: string; // ISO
  history: { timestamp: string; type: string }[];
}
```

### 3.7 Review Schemas

```typescript
// review/unified-review.cjs output
interface UnifiedReviewResult {
  passed: boolean;
  loops: LoopResult[];
  findings: Finding[];
  summary: {
    total: number;
    critical: number;
    resolved: number;
    blocking: boolean;
  };
  duration: number;
}

interface LoopResult {
  loop: number;
  tier?: number;
  name: string;
  status: "passed" | "failed" | "skipped";
  findings: Finding[];
  duration: number;
}
```

---

## 4. Integration Points

### 4.1 Agent Integration

Agents call scripts via the Bash tool:

```javascript
// From agent perspective
const result = await Bash({
  command: `echo '${JSON.stringify(input)}' | node .claude/scripts/git/get-status.cjs`,
  description: "Get git status",
});

// Parse stdout JSON
const status = JSON.parse(result.stdout);
```

### 4.2 Script Chaining

Scripts can be chained for complex workflows:

```bash
# Example: Review and format
node scripts/coderabbit/run-local.cjs | \
  node scripts/coderabbit/parse-findings.cjs | \
  node scripts/coderabbit/format-report.cjs
```

### 4.3 Hook Integration

Existing hooks can call scripts:

```javascript
// In pre-commit hook
const { execute } = require("./scripts/check/run-qa-suite.cjs");
const result = await execute({ quick: true });
if (!result.success) {
  process.exit(2); // Block commit
}
```

### 4.4 State Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Agent     │────▶│   Script     │────▶│   State     │
│  (caller)   │     │  (executor)  │     │   (file)    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │   stdin/JSON      │   state-utils      │
       │◀──────────────────│◀───────────────────│
       │   stdout/JSON     │   read/write       │
```

---

## 5. Phased Implementation Plan

### Phase 1: Foundation (Priority: Critical)

**Goal**: Establish shared libraries and core infrastructure

| Script                | Dependencies | Estimated Hours |
| --------------------- | ------------ | --------------- |
| `lib/git-utils.cjs`   | None         | 2               |
| `lib/check-utils.cjs` | None         | 2               |
| `lib/state-utils.cjs` | None         | 1.5             |
| `lib/ascii-utils.cjs` | None         | 1.5             |

**Deliverables**:

- All 4 lib utilities with tests
- Shared type definitions
- Documentation

### Phase 2: High Priority Scripts (Priority: High)

**Goal**: Enable core agent workflows

| Script                      | Dependencies       | Estimated Hours |
| --------------------------- | ------------------ | --------------- |
| `git/get-status.cjs`        | git-utils          | 1               |
| `git/create-branch.cjs`     | git-utils          | 1.5             |
| `git/prepare-commit.cjs`    | git-utils          | 2               |
| `check/run-qa-suite.cjs`    | check-utils        | 3               |
| `state/session-context.cjs` | state-utils        | 1.5             |
| `preview/generate.cjs`      | ascii-utils        | 2               |
| `review/loop1-fast.cjs`     | check-utils        | 2               |
| `review/unified-review.cjs` | all review scripts | 3               |

**Deliverables**:

- 8 high-priority scripts with tests
- Basic review loop functional

### Phase 3: Medium Priority Scripts (Priority: Medium)

**Goal**: Complete git workflow and research capabilities

| Script                              | Dependencies | Estimated Hours |
| ----------------------------------- | ------------ | --------------- |
| `git/create-pr.cjs`                 | git-utils    | 2               |
| `git/get-pr-comments.cjs`           | git-utils    | 2               |
| `git/poll-ci.cjs`                   | git-utils    | 1.5             |
| `git/sync-main.cjs`                 | git-utils    | 1.5             |
| `check/security-scan.cjs`           | check-utils  | 2               |
| `check/coverage-check.cjs`          | check-utils  | 1.5             |
| `research/find-implementations.cjs` | None         | 2               |
| `research/find-patterns.cjs`        | None         | 2               |
| `state/loop-state.cjs`              | state-utils  | 1.5             |
| `state/review-results.cjs`          | state-utils  | 1.5             |
| `review/loop1-deep.cjs`             | check-utils  | 2               |

**Deliverables**:

- Complete git workflow
- Research capabilities
- Full review loops

### Phase 4: Lower Priority Scripts (Priority: Low)

**Goal**: Complete all remaining scripts

| Script                              | Dependencies | Estimated Hours |
| ----------------------------------- | ------------ | --------------- |
| `git/cleanup-branches.cjs`          | git-utils    | 1               |
| `check/find-tests.cjs`              | None         | 1               |
| `research/query-specs.cjs`          | None         | 1.5             |
| `research/analyze-dependencies.cjs` | None         | 2               |
| `preview/templates.cjs`             | ascii-utils  | 2               |
| `preview/progress.cjs`              | ascii-utils  | 1.5             |
| `coderabbit/run-local.cjs`          | rate-limit   | 2               |
| `coderabbit/fetch-pr-review.cjs`    | git-utils    | 1.5             |
| `coderabbit/parse-findings.cjs`     | None         | 1.5             |
| `coderabbit/format-report.cjs`      | ascii-utils  | 1               |
| `coderabbit/rate-limit.cjs`         | state-utils  | 1               |
| `review/aggregate.cjs`              | state-utils  | 1.5             |

**Deliverables**:

- All 31 scripts complete
- Full CodeRabbit integration
- Complete preview system

---

## 6. Testing Strategy

### 6.1 Unit Tests

Each script has a corresponding test file:

```
.claude/scripts/
├── git/
│   ├── get-status.cjs
│   └── __tests__/
│       └── get-status.test.cjs
```

### 6.2 Integration Tests

Test script chaining and state management:

```javascript
// __tests__/integration/review-flow.test.cjs
describe("Review Flow", () => {
  it("executes 4-loop review system", async () => {
    // Setup mock git state
    // Run unified-review
    // Verify loop progression
    // Check state persistence
  });
});
```

### 6.3 Coverage Requirements

- Minimum 80% line coverage per script
- 100% coverage for lib utilities
- Integration tests for all agent workflows

---

## 7. Migration Plan

### 7.1 From Existing Hooks

1. Extract reusable logic from current hooks
2. Create new scripts using extracted logic
3. Update hooks to call new scripts
4. Deprecate inline logic in hooks

### 7.2 Backward Compatibility

- Maintain existing stdin/stdout conventions
- Support legacy input formats with adapter
- Gradual migration of agent code
