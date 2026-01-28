# /reconcile

Handle code review feedback from 4-loop review system (Claude, local, or GitHub PR).

**IMPORTANT: This command DESIGNS fixes, it does NOT implement them.**

## Usage

- `/reconcile` - Auto-detects review source (claude → local → pr)
- `/reconcile --source claude` - Claude reviewer findings (Loop 2)
- `/reconcile --source local` - Combined findings from all loops
- `/reconcile --source pr` - GitHub PR review comments (Loop 4)

## Source Detection

When no `--source` flag is provided, auto-detection runs in priority order:

1. **Check Claude source**: `.claude/state/claude-review-results.json`
   - If file exists and has findings → use 'claude'
2. **Check Local source**: `.claude/state/loop-state.json`
   - If ship_allowed=false → use 'local'
3. **Check PR source**: `gh pr view --json number,url`
   - If PR exists with comments → use 'pr'
4. **No source found**: Error - "No reconcile source detected"

## MANDATORY: Preview and Agent Delegation

> **Before executing /reconcile:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/plan-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Task Examples

### Source: Claude (Loop 2)

```typescript
// Phase 1: Analyze Claude feedback
Task({
  subagent_type: "general-purpose",
  description: "Analyze Claude reviewer findings",
  prompt: `
You are a domain-researcher sub-agent (mode=reconcile, source=claude).

Load .claude/state/claude-review-results.json and analyze:
- Extract all findings with severity (critical, major, minor)
- Group by file and category
- Identify patterns requiring structural changes

Output: context_summary with categorized Claude findings.
  `,
  model: "opus",
});

// Phase 2: Plan fixes
Task({
  subagent_type: "general-purpose",
  description: "Create fix plan for Claude findings",
  prompt: `
You are a domain-writer sub-agent (mode=reconcile, source=claude).

Context: [context_summary from Phase 1]

Create specs/reconcile-{timestamp}/tasks.md:
- One task per critical/major finding
- Include file, line, message, and fix suggestion
- Priority: critical → major → minor

DO NOT implement fixes - only plan them.
  `,
  model: "sonnet",
});
```

### Source: Local (All Loops)

```typescript
// Phase 1: Analyze all loop findings
Task({
  subagent_type: "general-purpose",
  description: "Analyze combined loop findings",
  prompt: `
You are a domain-researcher sub-agent (mode=reconcile, source=local).

Load .claude/state/loop-state.json and analyze:
- Extract findings from all completed loops (1-4)
- Merge duplicate issues across loops
- Prioritize by severity and frequency

Output: context_summary with unified findings.
  `,
  model: "opus",
});

// Phase 2: Plan fixes
Task({
  subagent_type: "general-purpose",
  description: "Create fix plan for all loop findings",
  prompt: `
You are a domain-writer sub-agent (mode=reconcile, source=local).

Context: [context_summary from Phase 1]

Create specs/reconcile-{timestamp}/tasks.md:
- Consolidated tasks addressing all loop findings
- Mark which loops detected each issue
- Eliminate redundant fixes

DO NOT implement fixes - only plan them.
  `,
  model: "sonnet",
});
```

### Source: PR (Loop 4 Async)

```typescript
// Phase 1: Analyze PR feedback
Task({
  subagent_type: "general-purpose",
  description: "Analyze GitHub PR review comments",
  prompt: `
You are a domain-researcher sub-agent (mode=reconcile, source=pr).

Detect PR: gh pr view --json number,url
Fetch comments: gh api repos/{owner}/{repo}/pulls/{pr}/comments

Analyze actionable feedback (contains: fix, change, update, add, remove):
- Extract review comments by file
- Categorize by severity and type
- Identify patterns and systemic issues

Output: context_summary with categorized PR feedback.
  `,
  model: "opus",
});

// Phase 2: Plan fixes
Task({
  subagent_type: "general-purpose",
  description: "Create fix plan for PR feedback",
  prompt: `
You are a domain-writer sub-agent (mode=reconcile, source=pr).

Context: [context_summary from Phase 1]

Create specs/reconcile-{timestamp}/tasks.md:
- Group tasks by file
- Reference specific PR comment URLs
- Priority order based on reviewer emphasis

DO NOT implement fixes - only plan them.
  `,
  model: "sonnet",
});
```

## Preview

```
┌──────────────────────────────────────────────────────────────────────┐
│ /reconcile - Code Review Reconciliation                             │
├──────────────────────────────────────────────────────────────────────┤
│ Source: [claude|local|pr] (auto-detected)                           │
│                                                                      │
│ Phase 1: ANALYZE                                                     │
│   → domain-researcher (Opus, mode=reconcile, source=[type])          │
│   → Extract and categorize feedback                                  │
│                                                                      │
│ Phase 2: PLAN                                                        │
│   → domain-writer (Sonnet, mode=reconcile, source=[type])            │
│   → Create fix tasks (NO implementation)                             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Output

Creates reconciliation directory based on source:

- **Claude source**: `specs/reconcile-{timestamp}/tasks.md` - Claude reviewer findings
- **Local source**: `specs/reconcile-{timestamp}/tasks.md` - Combined all-loop findings
- **PR source**: `specs/reconcile-{timestamp}/tasks.md` - GitHub PR feedback

Each tasks.md contains:

- Prioritized fix tasks with clear acceptance criteria
- Source references (file:line for claude/local, PR comment URLs for pr)
- Severity categorization

**Note:** Use `/implement` to execute the fix tasks after reconciliation.
