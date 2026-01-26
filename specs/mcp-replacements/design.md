# Design: MCP Server Replacements

> **Status:** Implemented
> **Created:** 2026-01-26
> **Spec ID:** mcp-replacements

## Overview

This design replaces three MCP servers (github, vitest, spec-workflow) with CLI-based alternatives while documenting conditional servers. The approach prioritizes simplicity: use native CLI tools where they provide equivalent functionality, reserving MCP servers for capabilities that genuinely require them (LSP integration, browser automation).

---

## Architecture

### Current State

```text
┌─────────────────────────────────────────────────────────────┐
│  MCP Servers (8 active)                                     │
├─────────────────────────────────────────────────────────────┤
│  cclsp          │ Essential  │ LSP code intelligence        │
│  playwright     │ Essential  │ Browser automation           │
│  github         │ REMOVE     │ → gh CLI                     │
│  vitest         │ REMOVE     │ → pnpm test                  │
│  spec-workflow  │ REMOVE     │ → file-based specs           │
│  next-devtools  │ Conditional│ Next.js 16+ MCP integration  │
│  context7       │ Conditional│ Library doc lookup           │
│  shadcn         │ Conditional│ Component registry           │
└─────────────────────────────────────────────────────────────┘
```

### Target State

```text
┌─────────────────────────────────────────────────────────────┐
│  MCP Servers (5 active)                                     │
├─────────────────────────────────────────────────────────────┤
│  cclsp          │ Essential  │ LSP code intelligence        │
│  playwright     │ Essential  │ Browser automation           │
│  next-devtools  │ Conditional│ Keep if using Next.js 16+    │
│  context7       │ Conditional│ Keep for doc lookup          │
│  shadcn         │ Conditional│ Keep for component discovery │
├─────────────────────────────────────────────────────────────┤
│  CLI/File Replacements                                      │
├─────────────────────────────────────────────────────────────┤
│  gh CLI         │ Replaces   │ All 26 github MCP tools      │
│  pnpm test      │ Replaces   │ All 4 vitest MCP tools       │
│  File-based     │ Replaces   │ spec-workflow dashboard      │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. GitHub CLI Replacement

The `gh` CLI provides 1:1 mapping for all github MCP tools:

| MCP Tool                     | gh CLI Equivalent                                             |
| ---------------------------- | ------------------------------------------------------------- |
| `search_repositories`        | `gh search repos "query"`                                     |
| `create_repository`          | `gh repo create name`                                         |
| `get_file_contents`          | `gh api repos/{owner}/{repo}/contents/{path}`                 |
| `create_or_update_file`      | `gh api -X PUT repos/{owner}/{repo}/contents/{path}`          |
| `push_files`                 | `git add && git commit && git push`                           |
| `create_issue`               | `gh issue create --title "..." --body "..."`                  |
| `list_issues`                | `gh issue list`                                               |
| `get_issue`                  | `gh issue view {number}`                                      |
| `update_issue`               | `gh issue edit {number}`                                      |
| `add_issue_comment`          | `gh issue comment {number} --body "..."`                      |
| `search_issues`              | `gh search issues "query"`                                    |
| `create_pull_request`        | `gh pr create --title "..." --body "..."`                     |
| `list_pull_requests`         | `gh pr list`                                                  |
| `get_pull_request`           | `gh pr view {number}`                                         |
| `get_pull_request_files`     | `gh pr diff {number}`                                         |
| `get_pull_request_status`    | `gh pr checks {number}`                                       |
| `get_pull_request_comments`  | `gh api repos/{owner}/{repo}/pulls/{number}/comments`         |
| `get_pull_request_reviews`   | `gh api repos/{owner}/{repo}/pulls/{number}/reviews`          |
| `create_pull_request_review` | `gh pr review {number} --approve/--comment/--request-changes` |
| `merge_pull_request`         | `gh pr merge {number}`                                        |
| `update_pull_request_branch` | `gh pr update-branch {number}` (or `git merge`)               |
| `fork_repository`            | `gh repo fork {owner}/{repo}`                                 |
| `create_branch`              | `git checkout -b {branch}`                                    |
| `list_commits`               | `git log --oneline`                                           |
| `search_code`                | `gh search code "query" --repo {owner}/{repo}`                |
| `search_users`               | `gh search users "query"`                                     |

**Implementation:** Documentation in skill files. No scripts needed.

### 2. Vitest CLI Replacement

Direct CLI commands replace MCP tools:

| MCP Tool           | CLI Equivalent                                  |
| ------------------ | ----------------------------------------------- |
| `set_project_root` | `cd` (context)                                  |
| `list_tests`       | `find . -name "*.test.ts" -o -name "*.spec.ts"` |
| `run_tests`        | `pnpm test:run [target]`                        |
| `analyze_coverage` | `pnpm test:coverage [target]`                   |

**Optional Enhancement:** Wrapper script for AI-friendly JSON output.

```text
.claude/scripts/tools/
└── vitest-runner.cjs    # Optional: JSON output wrapper
```

### 3. Spec-Workflow Replacement

Replace MCP dashboard with file-based workflow:

| MCP Feature  | File-Based Equivalent                               |
| ------------ | --------------------------------------------------- |
| Create spec  | Create `specs/{feature}/` directory with 3 files    |
| List specs   | `ls specs/` or `find specs -name "requirements.md"` |
| View spec    | Read `specs/{feature}/requirements.md`              |
| Approve spec | Update status field: `Draft` → `Approved`           |
| Track tasks  | Checkboxes in `specs/{feature}/tasks.md`            |
| Dashboard    | N/A (use file explorer or grep for status)          |

**Directory Structure:**

```text
specs/
├── {feature-1}/
│   ├── requirements.md   # Status: Draft | Approved | Implemented
│   ├── design.md
│   └── tasks.md
├── {feature-2}/
│   └── ...
└── spec-template.md      # Template for new specs
```

**Status Workflow:**

```text
Draft → In Review → Approved → In Progress → Implemented
```

Status is tracked via a header field in requirements.md:

```markdown
> **Status:** Approved
```

### 4. Configuration Changes

**File:** `.mcp.json`

```json
{
  "mcpServers": {
    "cclsp": {
      /* unchanged */
    },
    "playwright": {
      /* unchanged */
    },
    "next-devtools": {
      /* unchanged */
    },
    "context7": {
      /* unchanged */
    },
    "shadcn": {
      /* unchanged */
    }
    // github: REMOVED
    // vitest: REMOVED
    // spec-workflow: REMOVED
  }
}
```

### 5. Documentation Updates

Documentation goes into relevant skill files that agents already use:

**GitHub Operations:**

- `.claude/skills/git-operations/SKILL.md` - git CLI commands (branch, commit, etc.)
- `.claude/skills/pr-operations/SKILL.md` - PR CLI commands (create, merge, review)

**Test Operations:**

- `.claude/skills/qa-checks/SKILL.md` - test run/coverage commands
- `.claude/skills/tdd-workflow/SKILL.md` - TDD test commands

**Spec Workflow:**

- `.claude/skills/research/SKILL.md` - file-based spec workflow (or new skill)

**Conditional MCP Servers:**

- `.claude/docs/conditional-mcp-servers.md` - when to keep/remove optional servers

**CLAUDE.md:**

- Update MCP Servers table only (remove github, vitest, spec-workflow)

---

## Data Models

### Vitest Runner Output Schema (Optional)

```typescript
interface TestRunResult {
  success: boolean;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures?: Array<{
    file: string;
    test: string;
    error: string;
  }>;
}

interface CoverageResult {
  lines: { total: number; covered: number; pct: string };
  branches: { total: number; covered: number; pct: string };
  functions: { total: number; covered: number; pct: string };
  statements: { total: number; covered: number; pct: string };
}
```

---

## Data Flow

### GitHub Operations (After)

```text
User Request
    │
    ▼
Claude interprets request
    │
    ▼
Bash tool executes `gh` command
    │
    ▼
gh CLI → GitHub API
    │
    ▼
Output returned to Claude
    │
    ▼
Claude formats response for user
```

### Test Operations (After)

```text
User Request ("run tests")
    │
    ▼
Claude interprets request
    │
    ▼
Bash tool executes `pnpm test:run [target]`
    │
    ▼
Vitest runs tests
    │
    ▼
Output returned to Claude
    │
    ▼
Claude parses and summarizes results
```

---

## Error Handling

### GitHub CLI Not Authenticated

```text
Error: gh: not logged into any GitHub hosts
```

**Response:** Prompt user to run `gh auth login` and provide link to GitHub CLI auth docs.

### Vitest Not Installed

```text
Error: Command 'vitest' not found
```

**Response:** Prompt user to run `pnpm install` to install dependencies.

### Test Failures

Parse test output for failure messages and present structured summary:

- File path
- Test name
- Error message
- Stack trace (first 5 lines)

---

## Testing Strategy

### Unit Tests

Not applicable - changes are configuration and documentation only.

### Integration Tests

| Test Case              | Verification                      |
| ---------------------- | --------------------------------- |
| Claude Code starts     | No MCP connection errors          |
| `gh pr list` works     | Returns PR list                   |
| `gh issue list` works  | Returns issue list                |
| `pnpm test:run` works  | Returns test results              |
| cclsp still works      | `find_definition` returns results |
| playwright still works | `browser_navigate` succeeds       |

### Manual Verification

1. Remove servers from `.mcp.json`
2. Restart Claude Code
3. Verify no startup errors
4. Test each replacement command
5. Verify essential MCP tools still work

---

## Implementation Notes

### Why Remove GitHub MCP?

1. **100% overlap:** Every tool maps to a `gh` command
2. **gh is more powerful:** Supports `gh api` for arbitrary API calls
3. **Already authenticated:** Uses existing git credentials
4. **Native to Claude:** System prompt already includes gh documentation
5. **Reduces complexity:** One less MCP connection to maintain

### Why Remove Vitest MCP?

1. **Simple wrapper:** MCP just calls `vitest` CLI underneath
2. **4 tools only:** Minimal functionality to replace
3. **Standard output:** Test results are easily parseable
4. **pnpm scripts exist:** Already have `test`, `test:run`, `test:coverage`

### Why Remove Spec-Workflow MCP?

1. **File-based is simpler:** Specs are just markdown files in `specs/` directory
2. **No dashboard needed:** File explorer + grep provides sufficient visibility
3. **Version control native:** Git tracks spec changes naturally
4. **Reduces dependencies:** One less external service to run
5. **Portable:** Specs work without any MCP server running

### Why Keep cclsp?

1. **Semantic analysis:** Requires TypeScript compiler integration
2. **Type-aware:** References, definitions, implementations need type info
3. **Refactoring:** Rename operations need AST understanding
4. **No CLI equivalent:** `tsc` doesn't provide interactive LSP features

### Why Keep Playwright?

1. **Browser control:** Requires CDP/WebSocket connection
2. **Accessibility snapshot:** Unique capability for AI understanding
3. **State management:** Maintains browser session across commands
4. **No CLI equivalent:** CLI tools can't interact with live browser

---

## Security Considerations

### GitHub CLI

- Uses OAuth tokens stored by `gh auth`
- Respects repository permissions
- No additional secrets needed in environment

### Test Execution

- Tests run in sandboxed Node.js environment
- No elevated permissions required
- Output is text-only (no binary execution)

---

## Migration Path

1. **Backup:** `cp .mcp.json .mcp.json.backup`
2. **Remove servers:** Edit `.mcp.json` to remove github, vitest
3. **Update docs:** Add CLI commands to relevant skill files
4. **Verify:** Restart Claude Code, test essential operations
5. **Rollback if needed:** `cp .mcp.json.backup .mcp.json`

---

## Alternatives Considered

### Alternative 1: Keep All MCP Servers

**Rejected:** Unnecessary complexity for tools with direct CLI equivalents.

### Alternative 2: Remove All Conditional Servers

**Partially accepted:** spec-workflow removed (file-based is simpler). context7 and shadcn kept as they provide unique value (live doc lookup, component discovery) not easily replicated.

### Alternative 3: Create MCP Wrapper for gh CLI

**Rejected:** Adds complexity without benefit. Direct CLI usage is simpler and more powerful.

---

## Dependencies

| Component | Version | Purpose                 |
| --------- | ------- | ----------------------- |
| gh CLI    | 2.x+    | GitHub operations       |
| Node.js   | 18+     | Optional wrapper script |
| pnpm      | 8+      | Test commands           |
| vitest    | 1.x+    | Test runner             |
