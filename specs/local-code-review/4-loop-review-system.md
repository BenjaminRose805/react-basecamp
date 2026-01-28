# Research Notes: 4-Loop Review System

> **Date:** 2026-01-28
> **Status:** Research Complete
> **Decision:** PROCEED when ready to implement
> **Builds On:** specs/local-code-review/research-notes.md

## Executive Summary

Expand the local code review system from a single CodeRabbit integration to a **4-loop review system** that maximizes code quality while respecting rate limits and costs:

1. **Loop 1: Free Checks** - Unlimited, fast mechanical validation
2. **Loop 2: Claude Review** - Opus-powered AI review (paid subscription, unlimited)
3. **Loop 3: CodeRabbit Local** - Second opinion (rate limited)
4. **Loop 4: PR Review** - Remote safety net (async)

**Key insight:** User pays for Claude Code subscription, so Claude review is "free" at point of use. Use it as primary AI reviewer, CodeRabbit becomes optional second opinion.

---

## Problem Statement

Current `/review` only uses CodeRabbit CLI which is rate limited (2-8/hr). This creates bottlenecks:

- Can't iterate quickly on fixes
- Waste rate-limited reviews on code with mechanical errors
- Single point of AI review

**Solution:** Layer multiple review loops with increasing cost/thoroughness. Use free checks first, then Claude (unlimited), then CodeRabbit (limited).

---

## 4-Loop Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           4-LOOP SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /implement                                                             │
│       │                                                                 │
│       ▼                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  LOOP 1: FREE CHECKS                     [Free, Unlimited, <2m]   ║  │
│  ║  lint → typecheck → format → secrets → build → test               ║  │
│  ║       fail? → fix → ↺       pass? → ▼                             ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│       │                                                                 │
│       ▼                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  LOOP 2: CLAUDE REVIEW                   [Paid, Unlimited, ~2m]   ║  │
│  ║  spawn Opus reviewer → analyze diff → categorize issues           ║  │
│  ║       issues? → /reconcile claude → /implement → ↺ Loop 1         ║  │
│  ║       clean? → ▼                                                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│       │                                                                 │
│       ▼                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  LOOP 3: CODERABBIT LOCAL                [Rate Limited, 2-8/hr]   ║  │
│  ║  rate_limited? → skip (Claude approved, safe to ship)             ║  │
│  ║  available? → coderabbit CLI → second opinion                     ║  │
│  ║       issues? → /reconcile local → /implement → ↺ Loop 1          ║  │
│  ║       clean? → ▼                                                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│       │                                                                 │
│       ▼                                                                 │
│    /ship → PR                                                           │
│       │                                                                 │
│       ▼                                                                 │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║  LOOP 4: PR REVIEW                       [Async, Safety Net]      ║  │
│  ║  wait for CodeRabbit PR feedback                                  ║  │
│  ║       approved? → MERGE ✓                                         ║  │
│  ║       feedback? → /reconcile pr → /implement → ↺ Loop 1           ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Loop 1: Free Check Loop

### Purpose

Catch mechanical issues before any AI review. These checks are free and unlimited.

### Tier 1 Checks (Fast, <30s total)

| Check        | Command                      | Catches                          |
| ------------ | ---------------------------- | -------------------------------- |
| Lint         | `pnpm lint`                  | Style, unused vars, bad patterns |
| Typecheck    | `pnpm typecheck`             | Type errors, missing imports     |
| Format       | `pnpm format:check`          | Formatting inconsistencies       |
| Secrets      | Custom regex scan            | API keys, tokens, passwords      |
| Conflicts    | `grep -r "<<<<<<" src/`      | Unresolved merge conflicts       |
| Console logs | `grep -r "console.log" src/` | Debug statements (warn)          |

### Tier 2 Checks (Medium, <2min)

| Check      | Command         | Catches                    |
| ---------- | --------------- | -------------------------- |
| Build      | `pnpm build`    | Build errors, missing deps |
| Unit tests | `pnpm test:run` | Logic errors, regressions  |
| Dep audit  | `pnpm audit`    | Known vulnerabilities      |

### Behavior

- **All tier 1 must pass** before tier 2 runs
- **All tier 2 must pass** before Loop 2 (Claude review)
- Failures show specific errors with file:line
- User fixes and re-runs `/review`

### Secret Scanner Patterns

```javascript
const SECRET_PATTERNS = [
  { name: "AWS Key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "GitHub Token", pattern: /ghp_[a-zA-Z0-9]{36}/ },
  {
    name: "Generic API Key",
    pattern: /api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/,
  },
  {
    name: "Generic Secret",
    pattern: /secret['"]?\s*[:=]\s*['"][^'"]{10,}['"]/,
  },
  { name: "Private Key", pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: "Password Assignment", pattern: /password\s*[:=]\s*['"][^'"]+['"]/ },
  {
    name: "Hardcoded JWT",
    pattern: /eyJ[a-zA-Z0-9]{10,}\.eyJ[a-zA-Z0-9]{10,}/,
  },
];
```

---

## Loop 2: Claude Review Loop

### Purpose

Primary AI code review using Claude Opus. Since user pays for Claude Code subscription, this is unlimited at point of use.

### Why Opus

- **Most thorough** - Best at catching subtle issues
- **Best reasoning** - Can understand complex logic and edge cases
- **Worth the cost** - User is paying for subscription anyway
- **Consistent quality** - Don't compromise on review thoroughness

### Reviewer Agent Design

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Opus code review",
  prompt: `You are a senior code reviewer using Claude Opus. You did NOT write this code.
You are reviewing code written by another developer (or AI). Be thorough and critical.

## Changes to Review
${git_diff_output}

## Project Standards
${claude_md_content}

## Review Checklist

### Security (CRITICAL)
- [ ] Input validation on all user inputs
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization properly enforced
- [ ] No hardcoded secrets or credentials
- [ ] Proper error messages (no sensitive data leakage)

### Logic (CRITICAL/IMPORTANT)
- [ ] Edge cases handled (null, undefined, empty, boundary values)
- [ ] Race conditions prevented
- [ ] Error handling is comprehensive
- [ ] State management is correct
- [ ] Async/await used properly (no floating promises)

### Performance (IMPORTANT)
- [ ] No N+1 query patterns
- [ ] No unnecessary re-renders in React
- [ ] No memory leaks (cleanup in useEffect, etc.)
- [ ] Efficient algorithms for data size

### Code Quality (IMPORTANT/MINOR)
- [ ] Follows project patterns from CLAUDE.md
- [ ] DRY - no unnecessary duplication
- [ ] KISS - not over-engineered
- [ ] Clear naming and intent
- [ ] Proper TypeScript types (no 'any' abuse)

### Tests (IMPORTANT)
- [ ] Adequate test coverage for new code
- [ ] Tests are meaningful (not just coverage padding)
- [ ] Edge cases tested

## Output Format

Return a JSON object:
{
  "decision": "CLEAN" | "ISSUES",
  "critical": [
    {
      "file": "src/path/to/file.ts",
      "line": 45,
      "issue": "SQL injection vulnerability",
      "suggestion": "Use parameterized queries"
    }
  ],
  "important": [...],
  "minor": [...],
  "summary": "Brief 1-2 sentence overview"
}

Be thorough but fair. Only flag real issues, not style preferences already handled by lint.
If the code is genuinely good, say so - don't invent issues.`,
  model: "opus", // ALWAYS use Opus for reviews
});
```

### Fresh Agent Benefits

| Problem               | Solution                                       |
| --------------------- | ---------------------------------------------- |
| Self-review bias      | Fresh agent with no memory of writing the code |
| Familiarity blindness | Explicitly told "you did NOT write this"       |
| Confirmation bias     | Separate context window, reviewer persona      |

### Output

Results written to `.claude/state/claude-review-results.json`:

```json
{
  "timestamp": "2026-01-28T10:30:00Z",
  "model": "opus",
  "decision": "ISSUES",
  "critical": [...],
  "important": [...],
  "minor": [...],
  "summary": "Found 1 critical SQL injection issue and 3 important edge case gaps",
  "diff_reviewed": "abc123..def456"
}
```

---

## Loop 3: CodeRabbit Local Loop

### Purpose

Second opinion from CodeRabbit CLI. Rate limited but provides different perspective.

### Rate Limits

| Plan          | Reviews/Hour |
| ------------- | ------------ |
| Free/Lite/OSS | 2            |
| Trial         | 5            |
| Pro           | 8            |

### Behavior

- **If rate limited:** Skip - Claude already approved, safe to ship
- **If available:** Run for second opinion
- **If finds issues Claude missed:** Valuable learning, fix and loop back

### When CodeRabbit Adds Value

- Different training data/perspective than Claude
- May catch domain-specific patterns
- Validates Claude's review (agreement = high confidence)
- Catches rare edge cases

### Skip Conditions

```javascript
if (rate_limited && claude_review_passed) {
  // Safe to skip - we have AI approval from Claude
  return { skip: true, reason: "Claude approved, CodeRabbit rate limited" };
}
```

---

## Loop 4: PR Review Loop

### Purpose

Final async safety net. Remote CodeRabbit reviews the PR with full context.

### Additional Context Available

- PR title and description
- Linked issues
- Full diff in GitHub's UI
- Team learnings from past reviews
- Cross-file patterns

### Behavior

- Runs automatically when PR is created
- Wait for feedback (minutes to hours)
- If approved → Merge
- If feedback → `/reconcile pr` → Loop back to Loop 1

---

## `/reconcile` Command Updates

### Sources

| Command             | Source                                     | Loop   |
| ------------------- | ------------------------------------------ | ------ |
| `/reconcile`        | Auto-detect (claude → local → pr)          | Any    |
| `/reconcile claude` | `.claude/state/claude-review-results.json` | Loop 2 |
| `/reconcile local`  | `.claude/state/review-results.json`        | Loop 3 |
| `/reconcile pr`     | GitHub PR comments                         | Loop 4 |
| `/reconcile pr 123` | Specific PR number                         | Loop 4 |

### Auto-Detection Logic

```javascript
function detectSource(args) {
  // Explicit source
  if (args.includes("claude")) return { type: "claude" };
  if (args.includes("local")) return { type: "local" };
  if (args.includes("pr")) return { type: "pr", pr: extractPR(args) };

  // Auto-detect by freshness
  const claudeResults = ".claude/state/claude-review-results.json";
  const localResults = ".claude/state/review-results.json";

  if (isFresh(claudeResults, 30 * 60 * 1000)) {
    return { type: "claude", file: claudeResults };
  }
  if (isFresh(localResults, 30 * 60 * 1000)) {
    return { type: "local", file: localResults };
  }

  // Check for PR feedback
  const currentPR = getCurrentBranchPR();
  if (currentPR && hasUnresolvedComments(currentPR)) {
    return { type: "pr", pr: currentPR };
  }

  return { type: "none", message: "Run /review first" };
}
```

---

## `/review` Command Updates

### Flags

```bash
/review              # Full: Loop 1 + Loop 2 + Loop 3 (if available)
/review --free       # Loop 1 only (skip AI)
/review --claude     # Loop 1 + Loop 2 only (skip CodeRabbit)
/review --skip-cr    # Alias for --claude
```

### Output Display

```
┌─────────────────────────────────────────────────────────────────┐
│  /review - CODE REVIEW                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LOOP 1: FREE CHECKS                                            │
│  ✓ Lint:         PASS                                           │
│  ✓ Typecheck:    PASS                                           │
│  ✓ Format:       PASS                                           │
│  ✓ Secrets:      PASS (0 detected)                              │
│  ✓ Build:        PASS (12.3s)                                   │
│  ✓ Tests:        PASS (45/45)                                   │
│                                                                 │
│  LOOP 2: CLAUDE REVIEW (Opus)                                   │
│  ✓ Review:       PASS (0 critical, 0 important, 2 minor)        │
│    Minor issues (not blocking):                                 │
│    • src/utils/format.ts:12 - Consider extracting constant      │
│    • src/lib/cache.ts:45 - Add JSDoc for public function        │
│                                                                 │
│  LOOP 3: CODERABBIT LOCAL                                       │
│  ⚠ Skipped:      Rate limited (2/2 used)                        │
│    Claude review passed - safe to proceed                       │
│                                                                 │
│  ✓ Ready to ship!                                               │
│  Run /ship to create PR.                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Management

### Loop State

```javascript
// .claude/state/loop-state.json
{
  "current_loop": 2,
  "loop1": {
    "status": "passed",
    "tier1_passed": true,
    "tier2_passed": true,
    "last_run": "2026-01-28T10:30:00Z",
    "checks": {
      "lint": "pass",
      "typecheck": "pass",
      "format": "pass",
      "secrets": "pass",
      "build": "pass",
      "test": "pass"
    }
  },
  "loop2": {
    "status": "passed",
    "model": "opus",
    "last_review": "2026-01-28T10:31:00Z",
    "result_file": ".claude/state/claude-review-results.json",
    "issues": { "critical": 0, "important": 0, "minor": 2 }
  },
  "loop3": {
    "status": "skipped",
    "reason": "rate_limited",
    "reviews_used": 2,
    "limit": 2,
    "next_available": "2026-01-28T11:00:00Z"
  },
  "loop4": {
    "status": "pending",
    "pr_number": null
  }
}
```

### Rate Limit State

```javascript
// .claude/state/rate-limit-state.json
{
  "coderabbit": {
    "reviews_used": 2,
    "limit": 2,
    "hour_started": "2026-01-28T10:00:00Z",
    "next_available": "2026-01-28T11:00:00Z",
    "last_review": "2026-01-28T10:25:00Z"
  }
}
```

---

## Configuration

```yaml
# .claude/config/review-config.yaml
loops:
  loop1:
    tier1:
      lint: true
      typecheck: true
      format: true
      secrets: true
      conflicts: true
      console_logs: warn # warn only, don't block
    tier2:
      build: true
      test: true
      audit: warn # warn on moderate, block on high/critical

  loop2:
    enabled: true
    model: opus # ALWAYS opus for reviews

  loop3:
    enabled: true
    skip_if_claude_passed: true # Skip if rate limited but Claude approved

thresholds:
  audit_severity: high # Block on high+critical
  secrets_block: true # Block on any secret detected
```

---

## Implementation Components

| Component                                      | Type   | Purpose                         |
| ---------------------------------------------- | ------ | ------------------------------- |
| `.claude/commands/review.md`                   | UPDATE | 4-loop documentation, new flags |
| `.claude/commands/reconcile.md`                | UPDATE | claude/local/pr sources         |
| `.claude/scripts/hooks/user-prompt-review.cjs` | UPDATE | Orchestrate 4 loops             |
| `.claude/scripts/lib/free-checks.cjs`          | NEW    | Tier 1 + Tier 2 checks          |
| `.claude/scripts/lib/claude-reviewer.cjs`      | NEW    | Spawn Opus reviewer agent       |
| `.claude/scripts/lib/secret-scanner.cjs`       | NEW    | Custom secret detection         |
| `.claude/scripts/lib/rate-limit-tracker.cjs`   | NEW    | Track CodeRabbit usage          |
| `.claude/scripts/lib/loop-controller.cjs`      | NEW    | Manage loop state               |
| `.claude/skills/code-review/SKILL.md`          | UPDATE | Document 4-loop system          |
| `.claude/config/review-config.yaml`            | NEW    | Configurable checks             |

---

## Workflow Summary

### Complete Flow

```
research → design → implement
                        ↓
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             │
    LOOP 1: Free checks                │
         │                             │
         ├── fail → fix → ↺            │
         │                             │
         ▼                             │
    LOOP 2: Claude review (Opus)       │
         │                             │
         ├── issues → reconcile →──────┘
         │            implement
         ▼
    LOOP 3: CodeRabbit (if available)
         │
         ├── issues → reconcile → implement → ↺ Loop 1
         │
         ▼
    /ship → PR created
         │
         ▼
    LOOP 4: PR review
         │
         ├── feedback → reconcile → implement → ↺ Loop 1
         │
         ▼
    approved → MERGE ✓
```

### Key Invariants

1. **Nothing reaches Loop 2 without passing Loop 1**
2. **Nothing ships without passing Loop 1 + Loop 2**
3. **Loop 3 is optional if rate limited (Claude already approved)**
4. **PR feedback always goes back through Loop 1 + Loop 2**

---

## Expected Outcomes

| Metric                  | Before                 | After                          |
| ----------------------- | ---------------------- | ------------------------------ |
| Issues caught before PR | ~60% (CodeRabbit only) | ~95% (Free + Claude + CR)      |
| CodeRabbit credits used | 2-8 per iteration      | 0-2 (Claude handles most)      |
| Time to clean review    | Variable               | Predictable (free checks fast) |
| Review thoroughness     | Single AI opinion      | Multi-layer validation         |

---

## Open Questions

1. **Claude review caching:** Should we skip Claude review if diff unchanged since last review?

2. **Parallel execution:** Can Loop 2 and Loop 3 run in parallel for speed?

3. **Learning loop:** Should we track when CodeRabbit catches something Claude missed (improve prompts)?

4. **Cost tracking:** Should we show estimated API cost for Claude reviews?

---

## Next Steps

When ready to implement:

1. **Update `/review` command** - Add 4-loop orchestration
2. **Create free-checks.cjs** - Tier 1 + Tier 2 checks
3. **Create claude-reviewer.cjs** - Opus reviewer agent
4. **Create secret-scanner.cjs** - Custom secret detection
5. **Update `/reconcile` command** - Add claude source
6. **Create loop-controller.cjs** - State management
7. **Create review-config.yaml** - Configuration
8. **Test the full loop** - All 4 loops end-to-end

Run `/design 4-loop-review-system` to create full implementation spec.
