# /research

Exploratory investigation without spec creation.

**IMPORTANT: This is lightweight exploration - NO formal spec files are created.**

## MANDATORY: Preview and Agent Delegation

> **Before executing /research:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/plan-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Task Examples

```typescript
// Phase 1: Investigate
Task({
  subagent_type: "general-purpose",
  description: "Research [topic/question]",
  prompt: `
You are a domain-researcher sub-agent (mode=research).

Investigate: [topic/question]

Tasks:
- Search codebase for relevant patterns
- Analyze existing implementations
- Identify constraints and dependencies
- Gather examples and documentation

Output: research-notes.md with findings.

DO NOT create requirements.md, design.md, or tasks.md.
This is exploratory research only.
  `,
  model: "opus",
});
```

## Preview

```
┌──────────────────────────────────────────────────────────────────────┐
│ /research - Exploratory Investigation                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Phase 1: INVESTIGATE                                                 │
│   → domain-researcher (Opus, mode=research)                          │
│   → Explore codebase and gather insights                             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Output

Creates lightweight notes:

- `research-notes.md` - Findings and insights

**Note:** This does NOT create requirements.md, design.md, or tasks.md.
Use `/design` if you need formal spec files.

$ARGUMENTS
