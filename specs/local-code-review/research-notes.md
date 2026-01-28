# Research Notes: Local Code Review (CodeRabbit CLI)

> **Date:** 2026-01-27
> **Status:** Research Complete
> **Decision:** PROCEED when ready to implement

## Executive Summary

Integrate CodeRabbit CLI for local code review before shipping. Combined with remote CodeRabbit on PRs, this creates a **dual review workflow** that catches 80-90% of issues locally, reducing PR feedback cycles from 2-3 to 0-1.

**Estimated token savings:** 10,000-30,000 per feature workflow.

---

## Problem Statement

Current workflow:

```
/ship → PR → wait 5-30min → /reconcile → /implement → /ship again
```

Issues:

- Feedback comes late (after PR creation)
- Multiple round trips waste tokens on polling + reconciliation
- Slow iteration cycle

Proposed workflow:

```
code → /review → fix → /review → /ship (clean) → PR → remote review (safety net)
```

---

## CodeRabbit CLI Overview

### Installation

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
coderabbit auth login  # Browser OAuth
```

- Available on macOS (Intel/Apple Silicon) and Linux
- Homebrew: `brew install coderabbit`
- Windows not yet supported

### Authentication

```bash
coderabbit auth login
# or
cr auth login
```

Browser-based OAuth flow - redirects to sign in, copies access token back to CLI.

### Basic Usage

```bash
coderabbit                    # Interactive mode
coderabbit --plain            # Plain text output
coderabbit --prompt-only      # Minimal output for AI agents
cr review --plain             # Shorthand alias
```

---

## CLI Capabilities

| Feature                    | Supported | Notes                                   |
| -------------------------- | --------- | --------------------------------------- |
| Review uncommitted changes | Yes       | `--type uncommitted`                    |
| Review staged changes      | Yes       | Part of uncommitted workflow            |
| Review committed changes   | Yes       | `--type committed --base-commit HEAD~1` |
| Review specific branch     | Yes       | `--base <branch>`                       |
| AI-parseable output        | Yes       | `--prompt-only` flag                    |
| JSON output                | No        | Markdown-style only                     |
| Offline mode               | No        | Requires internet                       |
| Configuration files        | Yes       | Detects `.coderabbit.yaml`, `CLAUDE.md` |

### CLI Flags

| Flag                      | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `--plain`                 | Plain text output with detailed feedback        |
| `--prompt-only`           | Minimal output for AI agent consumption         |
| `-t, --type <type>`       | Review scope: `all`, `committed`, `uncommitted` |
| `--base <branch>`         | Comparison baseline branch                      |
| `--base-commit <commit>`  | Specific commit as comparison point             |
| `-c, --config <files...>` | Custom instruction files                        |
| `--cwd <path>`            | Working directory                               |
| `--no-color`              | Disable colored output                          |

### Rate Limits

| Plan          | Reviews/Hour |
| ------------- | ------------ |
| Free/Lite/OSS | 2            |
| Trial         | 5            |
| Pro           | 8            |

**Important:** Rate limits require strategic usage - run free checks (lint, typecheck) first, save CodeRabbit for final review.

---

## Output Format

### `--prompt-only` (Recommended for agents)

```markdown
## src/api/auth.ts

**3 suggestion(s)**

### 1. Lines 45: SQL injection - use parameterized queries

### 2. Lines 67-69: Missing input validation on user ID

### 3. Lines 89: Hardcoded secret should use env variable
```

Each finding includes:

- File path
- Line number(s)
- Problem description
- Suggested fix

This format is parseable and can feed directly into `/implement`.

### `--plain` (More detailed)

Includes full context and code suggestions, but more verbose.

---

## Configuration

CodeRabbit reads from `.coderabbit.yaml` in repository root:

```yaml
# .coderabbit.yaml
language: "en-US"
early_access: false

reviews:
  profile: "chill" # or "assertive" for stricter reviews
  request_changes_workflow: true
  high_level_summary: true
  auto_review:
    enabled: true
    drafts: false

chat:
  auto_reply: true
```

Also auto-detects:

- `CLAUDE.md` - Team coding guidelines
- `.cursorrules` - Cursor-specific rules

---

## Dual CodeRabbit Workflow

### Why Both Local and Remote?

| Review     | Purpose                       | Catches                                       |
| ---------- | ----------------------------- | --------------------------------------------- |
| **Local**  | Fast iteration, fix before PR | 80-90% of issues                              |
| **Remote** | Safety net, second opinion    | Edge cases, PR-context issues, team learnings |

### Remote CodeRabbit Benefits

- Full PR context (title, description, linked issues)
- Team learnings (patterns from past reviews)
- Cross-file analysis in GitHub's diff view
- Human reviewer coordination
- Catches things local review might miss

### Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DUAL CODERABBIT WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LOCAL LOOP (fast iteration)          REMOTE LOOP (safety net)    │
│   ─────────────────────────────        ────────────────────────    │
│                                                                     │
│   code changes                                                      │
│        │                                                            │
│        ▼                                                            │
│   /review ◄──────┐                                                  │
│        │         │                                                  │
│        ▼         │                                                  │
│   issues? ──yes──┘                                                  │
│        │    (fix locally)                                           │
│        no                                                           │
│        │                                                            │
│        ▼                                                            │
│   /ship ────────────────────────► PR created                        │
│                                        │                            │
│                                        ▼                            │
│                                   Remote CodeRabbit                 │
│                                        │                            │
│                                        ▼                            │
│                                   issues? ──yes──► /reconcile       │
│                                        │                  │         │
│                                        no                 ▼         │
│                                        │            /implement      │
│                                        ▼                  │         │
│                                   ✓ Merge            /ship ◄────────┘
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Expected Outcomes

| Metric                | Before (remote only)       | After (dual)   |
| --------------------- | -------------------------- | -------------- |
| Issues caught locally | 0%                         | 80-90%         |
| PR feedback cycles    | 2-3                        | 0-1            |
| Time to merge         | 30-60 min                  | 10-20 min      |
| Token usage           | High (polling + reconcile) | Low (clean PR) |

---

## New `/review` Command

### Purpose

Run local CodeRabbit review before shipping. Catches issues early, reduces PR cycles.

### Prerequisites

- CodeRabbit CLI installed
- Authenticated via `coderabbit auth login`

### Workflow

```
/review
  │
  ├── Phase 1: FAST CHECKS (no rate limit)
  │   ├── pnpm lint
  │   ├── pnpm typecheck
  │   └── pnpm test (optional)
  │
  ├── Phase 2: AI REVIEW (rate limited)
  │   ├── git add -A (stage changes)
  │   ├── coderabbit --prompt-only --type uncommitted
  │   └── Parse output into categorized issues
  │
  └── Phase 3: REPORT
      ├── CRITICAL: Security, bugs, data loss
      ├── IMPORTANT: Performance, patterns
      └── MINOR: Style, naming
```

### Integration Options

#### Option A: New Command (Recommended)

Create `/review` as a new slash command that:

1. Runs fast checks first (free)
2. Runs CodeRabbit CLI
3. Parses and categorizes output
4. Displays actionable issues

#### Option B: Pre-Ship Hook

Add to `/ship` workflow:

1. Before PR creation, run local review
2. If issues found, stop and report
3. User fixes, then runs `/ship` again

#### Option C: Both

- `/review` for explicit local review
- Pre-ship hook as safety gate

---

## Hook Specification (`user-prompt-review.cjs`)

```javascript
// Trigger: UserPromptSubmit on /review
// Action: Run fast checks, then CodeRabbit CLI
// Output: Write results to state file, inject summary

{
  trigger: "UserPromptSubmit",
  condition: (prompt) => /^\/review/.test(prompt.message),
  action: async () => {
    // 1. Run fast checks first (free, no rate limit)
    const lintResult = await runCommand('pnpm lint --quiet');
    const typeResult = await runCommand('pnpm typecheck');

    if (lintResult.failed || typeResult.failed) {
      return {
        inject: `Fix lint/type errors before AI review:\n${lintResult.errors}\n${typeResult.errors}`
      };
    }

    // 2. Stage changes
    await runCommand('git add -A');

    // 3. Run CodeRabbit review
    const review = await runCommand('coderabbit --prompt-only --type uncommitted --no-color');

    // 4. Parse and categorize
    const issues = parseCodeRabbitOutput(review.stdout);
    const categorized = categorizeIssues(issues);

    // 5. Write to state file
    writeState('review-results.md', formatReviewResults(categorized));

    // 6. Return summary
    const summary = `Review complete: ${issues.critical.length} critical, ${issues.important.length} important, ${issues.minor.length} minor`;
    return { inject: summary };
  }
}
```

---

## Sample Session

```bash
# 1. Make code changes
vim src/api/auth.ts

# 2. Run local review
/review

# Output:
# ┌─────────────────────────────────────────────────────────────┐
# │ Local CodeRabbit Review                                     │
# ├─────────────────────────────────────────────────────────────┤
# │ ✓ Lint: passed                                              │
# │ ✓ Typecheck: passed                                         │
# │                                                             │
# │ CRITICAL (1):                                               │
# │   src/api/auth.ts:45 - SQL injection vulnerability          │
# │                                                             │
# │ IMPORTANT (2):                                              │
# │   src/lib/cache.ts:23 - Race condition in cache update      │
# │   src/components/Form.tsx:89 - Missing error boundary       │
# │                                                             │
# │ MINOR (3):                                                  │
# │   src/utils/format.ts:12 - Use const instead of let         │
# │   ...                                                       │
# ├─────────────────────────────────────────────────────────────┤
# │ Run /implement to fix, then /review again                   │
# └─────────────────────────────────────────────────────────────┘

# 3. Fix issues
/implement  # Agent reads review-results.md, fixes issues

# 4. Re-review
/review
# Output: ✓ No issues found - ready to ship!

# 5. Ship clean
/ship  # PR created, remote CodeRabbit should approve quickly
```

---

## Rate Limit Strategy

Since CodeRabbit CLI is rate limited (2-8/hour):

1. **Gate with free checks** - Lint, typecheck, tests must pass first
2. **Batch changes** - Review once after multiple fixes, not after each
3. **Skip if clean** - If no code changes since last review, skip
4. **Fallback mode** - If rate limited, proceed with local checks only + warning

### Rate Limit Detection

```javascript
const review = await runCommand("coderabbit --prompt-only --type uncommitted");

if (review.stderr.includes("rate limit")) {
  return {
    inject: `⚠️ CodeRabbit rate limited. Local checks passed. Proceed with /ship? Remote review will still run on PR.`,
  };
}
```

---

## Alternative: Qodo Merge (Self-Hosted)

If CodeRabbit rate limits are too restrictive, Qodo Merge (formerly PR-Agent) offers self-hosted option:

```bash
docker run --rm -it \
  -e OPENAI.KEY=<key> \
  codiumai/pr-agent:latest \
  --pr_url <url> review
```

**Pros:** No rate limits, full control
**Cons:** Requires own API keys, more setup

---

## Open Questions

1. **Rate limit handling:** Block and wait, warn and proceed, or skip to remote?

2. **Review scope:** All changes or only staged? (Recommend: staged only for control)

3. **Severity threshold:** Block `/ship` on CRITICAL only, or IMPORTANT too?

4. **Integration point:** New `/review` command vs pre-ship hook vs both?

5. **Offline handling:** What to do when CodeRabbit CLI unavailable?

6. **State file format:** How to structure `review-results.md` for easy agent parsing?

---

## Implementation Components

| Component                | Type          | Purpose                            |
| ------------------------ | ------------- | ---------------------------------- |
| `/review` command        | Slash command | Entry point for local review       |
| `user-prompt-review.cjs` | Hook          | Run fast checks + CodeRabbit CLI   |
| `parse-coderabbit.cjs`   | Library       | Parse `--prompt-only` output       |
| `review-results.md`      | State file    | Store categorized issues for agent |

---

## Related Specs

- `specs/scripting-opportunities/` - General automation hooks and scripts
- `specs/start-command-upgrade/` - Environment setup (installs CodeRabbit CLI)

---

## Next Steps

When ready to implement:

1. **Install CodeRabbit CLI** locally and test
2. **Create `/review` command** definition
3. **Create hook** `user-prompt-review.cjs`
4. **Create parser** for CodeRabbit output
5. **Test the loop** - review → fix → review → ship

Run `/design local-code-review` to create full implementation spec.
