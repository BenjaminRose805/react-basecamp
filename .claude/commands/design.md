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

# Level flags (mutually exclusive)
/design feature --project        # Project-level design
/design feature --feature        # Feature-level design
/design feature --spec           # Spec-level design
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
| --project        | Project-level design                | --project        |
| --feature        | Feature-level design                | --feature        |
| --spec           | Spec-level design                   | --spec           |

**Flag combinations:** `--phase` and `--resume` can be combined to resume at a specific phase. `--no-checkpoint` skips interactive checkpoint prompts while still saving checkpoint files. `--dry-run` renders the preview and exits without making any changes.

**Level flags:** `--project`, `--feature`, and `--spec` are mutually exclusive. Only one may be specified. If no level flag is provided, the user will be prompted to select a level interactively.

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

Create spec files in specs/{resolved_path}/ (path resolved via resolveSpecPath()):
- requirements.md (what and why)
- design.md (how and architecture)
- tasks.md (step-by-step implementation)

Note: The path may be nested (e.g., specs/project/feature/) or standalone (e.g., specs/feature/).

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

Verify specs/{resolved_path}/ (path resolved via resolveSpecPath()) contains:
- requirements.md with clear acceptance criteria
- design.md with architecture decisions
- tasks.md with actionable steps

Note: The path may be nested or standalone format.

Report any gaps or inconsistencies.
  `,
  model: "haiku",
});
```

## Preview

**Template:** Read `.claude/skills/preview/templates/command-preview.md` for base layout.

**Variables:**

| Variable          | Value                                             |
| ----------------- | ------------------------------------------------- |
| `{{command}}`     | `design`                                          |
| `{{description}}` | Conversational Spec Creation                      |
| `{{dir}}`         | Working directory                                 |
| `{{branch}}`      | Current git branch                                |
| `{{feature}}`     | Feature name from arguments                       |
| `{{checkpoint}}`  | `.claude/state/design-{{level}}-{{feature}}.json` |

**CONTEXT section** (extends template lines 15-20):

```text
│ CONTEXT                                                              │
│   Feature: {{feature}}                                               │
│   Level: {{level}}                                                   │
│   Checkpoint: {{checkpoint}} (if --resume)                           │
│   Flags: {{active_flags}}                                            │
```

**STAGES section** (extends template lines 22-25):

```text
│ STAGES                                                               │
│   1. RESEARCH (domain-researcher / Opus)                             │
│      → Analyze requirements and gather context for {{level}}         │
│                                                                      │
│   2. WRITE (domain-writer / Sonnet)                                  │
│      → Create {{level}}-appropriate spec files                       │
│                                                                      │
│   3. VALIDATE (quality-validator / Haiku)                            │
│      → Verify {{level}} spec completeness                            │
```

**OUTPUT section** (extends template lines 27-29):

```text
│ OUTPUT                                                               │
│   specs/{{feature}}/                                                 │
│     {{#if level == 'project'}}                                       │
│     ├── project.md (project vision and scope)                        │
│     ├── features.json (feature manifest)                             │
│     └── .project-marker                                              │
│     {{else if level == 'feature'}}                                   │
│     ├── feature.md (feature overview and spec list)                  │
│     ├── specs.json (spec manifest with depends_on DAG)               │
│     └── .feature-marker                                              │
│     {{else if level == 'spec'}}                                      │
│     ├── requirements.md (detailed acceptance criteria)               │
│     ├── design.md (component/API contracts)                          │
│     ├── tasks.md (granular implementation steps)                     │
│     ├── summary.md                                                   │
│     ├── spec.json                                                    │
│     └── meta.yaml                                                    │
│     {{/if}}                                                          │
```

**Rendering steps:**

1. Read `command-preview.md` template
2. Fill variables from feature name and flags
3. Render CONTEXT, STAGES, and OUTPUT sections
4. Use AskUserQuestion tool to confirm: Run / Cancel

## Output

Creates spec directory with level-appropriate files:

**Project level** (`--project`):

- `specs/{feature}/project.md` - Project vision and scope
- `specs/{feature}/features.json` - Feature manifest

**Feature level** (`--feature`):

- `specs/{feature}/feature.md` - Feature overview and spec list
- `specs/{feature}/specs.json` - Spec manifest with depends_on DAG

**Spec level** (`--spec`):

- `specs/{feature}/requirements.md` - Detailed acceptance criteria
- `specs/{feature}/design.md` - Component/API contracts and implementation details
- `specs/{feature}/tasks.md` - Granular implementation steps with dependencies
- `specs/{feature}/summary.md` - Detailed summary with trade-offs
- `specs/{feature}/spec.json` - Complete metadata with task dependencies
- `specs/{feature}/meta.yaml` - Build metadata with task counts

$ARGUMENTS
