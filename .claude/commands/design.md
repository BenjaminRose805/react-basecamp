# /design

Conversational spec creation - turn ideas into implementation specs.

## MANDATORY: Preview and Agent Delegation

> **Before executing /design:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/plan-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Task Examples

```typescript
// Phase 1: Research requirements
Task({
  subagent_type: "general-purpose",
  description: "Analyze requirements for [feature]",
  prompt: `
You are a domain-researcher sub-agent (mode=design).

Analyze requirements for [feature]:
- Review existing codebase patterns
- Identify dependencies and constraints
- Gather relevant examples and context

Output: context_summary with findings.
  `,
  model: "opus",
});

// Phase 2: Write spec files
Task({
  subagent_type: "general-purpose",
  description: "Create spec files for [feature]",
  prompt: `
You are a domain-writer sub-agent (mode=design).

Context: [context_summary from Phase 1]

Create spec files in specs/[feature]/:
- requirements.md (what and why)
- design.md (how and architecture)
- tasks.md (step-by-step implementation)

Follow templates from .claude/templates/.
  `,
  model: "sonnet",
});

// Phase 3: Validate completeness
Task({
  subagent_type: "general-purpose",
  description: "Verify spec completeness for [feature]",
  prompt: `
You are a quality-validator sub-agent (mode=design).

Verify specs/[feature]/ contains:
- requirements.md with clear acceptance criteria
- design.md with architecture decisions
- tasks.md with actionable steps

Report any gaps or inconsistencies.
  `,
  model: "haiku",
});
```

## Preview

```
┌──────────────────────────────────────────────────────────────────────┐
│ /design - Conversational Spec Creation                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Phase 1: RESEARCH                                                    │
│   → domain-researcher (Opus)                                         │
│   → Analyze requirements and gather context                          │
│                                                                      │
│ Phase 2: WRITE                                                       │
│   → domain-writer (Sonnet)                                           │
│   → Create requirements.md, design.md, tasks.md                      │
│                                                                      │
│ Phase 3: VALIDATE                                                    │
│   → quality-validator (Haiku)                                        │
│   → Verify spec completeness                                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run  [Esc] Cancel                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Output

Creates spec directory with:

- `specs/{feature}/requirements.md` - What and why
- `specs/{feature}/design.md` - How and architecture
- `specs/{feature}/tasks.md` - Step-by-step implementation

$ARGUMENTS
