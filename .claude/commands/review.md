# /review - Local Code Review

Run local CodeRabbit code review before shipping to catch issues early.

## Usage

```bash
/review                # Review all uncommitted changes
```

---

## MANDATORY: Preview and Agent Delegation

> **STOP. Before executing /review, you MUST:**
>
> 1. **Show preview** - Display the execution plan (see Preview section below)
> 2. **Get confirmation** - Wait for user to press [Enter] to run or [Esc] to cancel
> 3. **Load agent file** - Read `.claude/agents/plan-agent.md` (review uses planning/analysis)
> 4. **Follow CRITICAL EXECUTION REQUIREMENT** - Found in the agent file
> 5. **Use Task tool** - Spawn sub-agents for each phase, NEVER execute directly
>
> **If you skip the preview or execute tools directly, you are doing it wrong.**

---

## Task Tool Examples

### Spawn Review Researcher

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze uncommitted changes for review",
  prompt: `You are a review-researcher sub-agent.

TASK: Analyze current uncommitted changes
GOAL: Prepare context for code review

STEPS:
1. Run git status to see all uncommitted changes
2. Run git diff --stat to see change summary
3. Identify files changed and scope of changes
4. Check if any staged vs unstaged differences

OUTPUT FORMAT:
{
  "decision": "PROCEED | STOP",
  "context_summary": "max 500 tokens for review agent",
  "files_changed": [...],
  "scope": "backend | frontend | docs | mixed"
}

Use Bash, Read tools.`,
  model: "haiku",
});
```

### Spawn Review Executor

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Execute local code review",
  prompt: `You are a review-executor sub-agent.

TASK: Run local code review workflow
CONTEXT: ${research_summary}

WORKFLOW:
1. FAST CHECKS (no rate limit)
   - Run: pnpm lint --quiet
   - Run: pnpm typecheck
   - If failed, STOP and report errors

2. AI REVIEW (rate limited)
   - Stage changes: git add -A
   - Run: coderabbit --prompt-only --type uncommitted --no-color
   - Parse output into categories

3. REPORT
   - Write results to .claude/state/review-results.json
   - Return categorized summary

Use Bash tool.
Return: { "status": "pass | fail", "issues": {...}, "context_summary": "..." }`,
  model: "sonnet",
});
```

### Spawn Review Reporter

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Format and present review results",
  prompt: `You are a review-reporter sub-agent.

TASK: Format review results for user
ISSUES: ${review_results}

FORMAT OUTPUT:
1. Fast checks status (lint, typecheck)
2. CRITICAL issues (security, bugs)
3. IMPORTANT issues (performance, patterns)
4. MINOR issues (style, naming)

Present as ASCII table.
Suggest next steps based on severity.

Use Read tool for state file.
Return: { "report": "formatted report text" }`,
  model: "haiku",
});
```

---

## Examples

```bash
/review    # Review all uncommitted changes locally
```

## Prerequisites

- CodeRabbit CLI installed (`curl -fsSL https://cli.coderabbit.ai/install.sh | sh`)
- Authenticated (`coderabbit auth login`)
- If not installed, run `/start` to install tools

## What Happens

1. **FAST CHECKS**: Run lint and typecheck (free, no rate limit)
2. **AI REVIEW**: Run CodeRabbit CLI on uncommitted changes
3. **PARSE**: Extract and categorize issues by severity
4. **REPORT**: Display issues with suggestions
5. **NEXT STEPS**: Guide user to fix or ship

## Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /review                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Scope: 5 files changed (3 backend, 2 frontend)                 │
│  Changes: +127 -43 lines                                        │
│                                                                 │
│  STAGE 1: FAST CHECKS                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: review-executor              Haiku                   ││
│  │    □ pnpm lint                                              ││
│  │    □ pnpm typecheck                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  STAGE 2: AI REVIEW                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: review-executor              Sonnet                  ││
│  │    □ Stage changes (git add -A)                             ││
│  │    □ CodeRabbit CLI review                                  ││
│  │    □ Parse and categorize                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  STAGE 3: REPORT                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: review-reporter              Haiku                   ││
│  │    □ Format results                                         ││
│  │    □ Display categorized issues                             ││
│  │    □ Suggest next steps                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Rate limit: 2-8 reviews/hour (depends on plan)                 │
│                                                                 │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel               │
└─────────────────────────────────────────────────────────────────┘
```

## Progress Display

During execution:

```text
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: FAST CHECKS                              [COMPLETE]   │
│  ├─ ✓ Lint                                         [0.8s]       │
│  └─ ✓ Typecheck                                    [1.2s]       │
│                                                                 │
│  STAGE 2: AI REVIEW                                [RUNNING]    │
│  ├─ ✓ Stage changes                                [0.1s]       │
│  ├─ ● CodeRabbit CLI                               [RUNNING]    │
│  └─ ○ Parse results                                [PENDING]    │
│                                                                 │
│  Progress: ██████████░░░░░░░░░░ 50%                             │
└─────────────────────────────────────────────────────────────────┘
```

## Output

### Clean (No Issues)

```text
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL REVIEW COMPLETE                                          │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Lint:      PASS                                              │
│  ✓ Typecheck: PASS (0 errors)                                   │
│  ✓ CodeRabbit: No issues found                                  │
│                                                                 │
│  Ready to ship!                                                 │
│  Run /ship to create PR.                                        │
└─────────────────────────────────────────────────────────────────┘
```

### With Issues

```text
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL REVIEW COMPLETE                                          │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Lint:      PASS                                              │
│  ✓ Typecheck: PASS (0 errors)                                   │
│  ⚠ CodeRabbit: 6 issues found                                   │
│                                                                 │
│  CRITICAL (1):                                                  │
│    • src/api/auth.ts:45                                         │
│      SQL injection - use parameterized queries                  │
│                                                                 │
│  IMPORTANT (2):                                                 │
│    • src/lib/cache.ts:23                                        │
│      Race condition in cache update                             │
│    • src/components/Form.tsx:89                                 │
│      Missing error boundary for async data                      │
│                                                                 │
│  MINOR (3):                                                     │
│    • src/utils/format.ts:12 - Use const instead of let          │
│    • src/lib/date.ts:34 - Extract magic number to constant      │
│    • src/hooks/useAuth.ts:67 - Add JSDoc comment                │
│                                                                 │
│  Fix critical issues before shipping.                           │
│  Run /implement or fix manually, then /review again.            │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limited

```text
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL REVIEW INCOMPLETE                                        │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Lint:      PASS                                              │
│  ✓ Typecheck: PASS (0 errors)                                   │
│  ⚠ CodeRabbit: Rate limited (2/hour on free plan)               │
│                                                                 │
│  Local checks passed. Remote CodeRabbit will review on PR.      │
│  Proceed with /ship?                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Review Workflow

Recommended loop:

```
code → /review → issues? → fix → /review → clean → /ship
```

## Severity Levels

| Level     | Blocks Ship | Examples                          |
| --------- | ----------- | --------------------------------- |
| CRITICAL  | Yes         | Security, data loss, crashes      |
| IMPORTANT | Optional    | Performance, patterns, edge cases |
| MINOR     | No          | Style, naming, comments           |

## Mode Behavior

| Mode  | Preview | Sub-agents | Fast Checks | AI Review |
| ----- | ------- | ---------- | ----------- | --------- |
| dev   | Yes     | Yes        | Yes         | Yes       |
| basic | No      | No         | Yes         | Yes       |

## Error Handling

| Scenario               | Handling                                 |
| ---------------------- | ---------------------------------------- |
| CLI not installed      | Error: Run /start to install tools       |
| Not authenticated      | Error: Run coderabbit auth login         |
| Lint/type errors       | Report errors, skip AI review            |
| Rate limited           | Report local check status, suggest /ship |
| No uncommitted changes | Info: No changes to review               |
| CLI unavailable        | Warn: Proceed with local checks only     |

## Skills Used

- `code-review` - Execute review workflow
- `preview` - Show execution plan
- `progress` - Real-time status display

## After /review

Based on results:

1. **Clean** → Run `/ship` to create PR
2. **Issues found** → Fix manually or run `/implement`, then `/review` again
3. **Rate limited** → If local checks pass, optionally proceed to `/ship`

## Dual Review Strategy

Local `/review` + Remote CodeRabbit on PR:

- **Local** catches 80-90% of issues before PR
- **Remote** acts as safety net with full PR context
- Reduces feedback cycles from 2-3 to 0-1
- Saves 10,000-30,000 tokens per feature
