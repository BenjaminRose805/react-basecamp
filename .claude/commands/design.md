# /design

Conversational spec creation - turn ideas into implementation specs.

## Usage

```bash
/design feature                  # Create new spec
/design feature --phase=research  # Research phase only
/design feature --phase=write     # Write phase only
/design feature --phase=validate  # Validate phase only
/design feature --resume          # Continue from checkpoint
/design feature --no-checkpoint   # Skip interactive prompts
/design feature --dry-run        # Preview without executing
```

---

## Flags

| Flag             | Description                         | Example          |
| ---------------- | ----------------------------------- | ---------------- |
| --phase=research | Execute research phase only         | --phase=research |
| --phase=write    | Execute write phase only            | --phase=write    |
| --resume         | Resume from checkpoint              | --resume         |
| --no-checkpoint  | Skip interactive checkpoint prompts | --no-checkpoint  |
| --dry-run        | Show preview and exit (no action)   | --dry-run        |

**Flag combinations:** `--phase` and `--resume` can be combined to resume at a specific phase. `--no-checkpoint` skips interactive checkpoint prompts while still saving checkpoint files. `--dry-run` renders the preview and exits without making any changes.

**Dry run behavior:** When `--dry-run` is used, the preview is displayed and the command exits immediately with the message: "Dry run complete. No changes made."

---

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

**Template:** Read `.claude/skills/preview/templates/command-preview.md` for base layout.

**Variables:**

| Variable          | Value                                   |
| ----------------- | --------------------------------------- |
| `{{command}}`     | `design`                                |
| `{{description}}` | Conversational Spec Creation            |
| `{{dir}}`         | Working directory                       |
| `{{branch}}`      | Current git branch                      |
| `{{feature}}`     | Feature name from arguments             |
| `{{checkpoint}}`  | `.claude/state/design-{{feature}}.json` |

**CONTEXT section** (extends template lines 15-20):

```text
│ CONTEXT                                                              │
│   Feature: {{feature}}                                               │
│   Checkpoint: {{checkpoint}} (if --resume)                           │
│   Flags: {{active_flags}}                                            │
```

**STAGES section** (extends template lines 22-25):

```text
│ STAGES                                                               │
│   1. RESEARCH (domain-researcher / Opus)                             │
│      → Analyze requirements and gather context                       │
│                                                                      │
│   2. WRITE (domain-writer / Sonnet)                                  │
│      → Create requirements.md, design.md, tasks.md                   │
│                                                                      │
│   3. VALIDATE (quality-validator / Haiku)                            │
│      → Verify spec completeness                                      │
```

**OUTPUT section** (extends template lines 27-29):

```text
│ OUTPUT                                                               │
│   specs/{{feature}}/                                                 │
│     ├── requirements.md                                              │
│     ├── design.md                                                    │
│     ├── tasks.md                                                     │
│     ├── summary.md                                                   │
│     ├── spec.json                                                    │
│     └── meta.yaml                                                    │
```

**Rendering steps:**

1. Read `command-preview.md` template
2. Fill variables from feature name and flags
3. Render CONTEXT, STAGES, and OUTPUT sections
4. Use AskUserQuestion tool to confirm: Run / Cancel

## Output

Creates spec directory with:

- `specs/{feature}/requirements.md` - What and why
- `specs/{feature}/design.md` - How and architecture
- `specs/{feature}/tasks.md` - Step-by-step implementation
- `specs/{feature}/summary.md` - Human-readable summary with status and key decisions
- `specs/{feature}/spec.json` - Machine-readable metadata with phases, tasks, and Linear identifier
- `specs/{feature}/meta.yaml` - Build metadata with task counts

$ARGUMENTS
