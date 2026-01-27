# /plan

Conversational spec creation or PR feedback reconciliation.

## MANDATORY: Preview and Agent Delegation

> **Before executing /plan:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/plan-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Task Examples

### Researcher (Opus)

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze requirements for [feature]",
  prompt: `You are a requirement-analyzer sub-agent.
TASK: Analyze requirements for [feature]
OUTPUT: { "decision": "PROCEED|STOP|CLARIFY", "context_summary": "...", "requirements": [...] }
Use Read, Grep, Glob, mcp__cclsp__* tools.`,
  model: "opus",
  run_in_background: true,
});
```

### Writer (Sonnet)

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Write spec for [feature]",
  prompt: `Create spec files:
- specs/[feature]/requirements.md (EARS format)
- specs/[feature]/design.md
- specs/[feature]/tasks.md
INPUT SUMMARY: ${analysis_summary}`,
  model: "sonnet",
});
```

### Validator (Haiku)

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Validate spec",
  prompt: `Validate specs/[feature]/: EARS compliance, acceptance criteria, _Prompt fields.
Return: { "passed": true/false, "issues": [...] }`,
  model: "haiku",
});
```

## Mode Detection

- Has CodeRabbit comments → **Reconcile mode** (analyze PR feedback)
- Otherwise → **Define mode** (conversational spec creation)

## Preview (Define Mode)

```text
┌─────────────────────────────────────────────────────────────┐
│  /plan [feature]                                            │
├─────────────────────────────────────────────────────────────┤
│  Mode: Define                                               │
│                                                             │
│  PHASES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. RESEARCH         plan-researcher        Opus         ││
│  │ 2. WRITE            plan-writer            Sonnet       ││
│  │ 3. VALIDATE         plan-validator         Haiku        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

## Preview (Reconcile Mode)

```text
┌─────────────────────────────────────────────────────────────┐
│  /plan (reconcile PR #N)                                    │
├─────────────────────────────────────────────────────────────┤
│  Mode: Reconcile                                            │
│  CodeRabbit comments: N                                     │
│                                                             │
│  PHASES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. ANALYZE          plan-researcher        Opus         ││
│  │ 2. PLAN             plan-writer            Sonnet       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

## Output

Creates `specs/{feature}/`: requirements.md, design.md, tasks.md

$ARGUMENTS
