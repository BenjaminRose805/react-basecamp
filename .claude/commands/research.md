# /research

Exploratory investigation with structured output - NO spec files created.

## Usage

```bash
/research "topic"               # Auto-detect level
/research "topic" --task        # Force task-level (summary only)
/research "topic" --spec        # Force spec-level
/research "topic" --feature     # Force feature-level
/research "topic" --project     # Force project-level (all files)
/research "topic" --dry-run     # Preview without executing
```

---

## MANDATORY: Preview and Agent Delegation

> **Before executing /research:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/plan-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

---

## Structured Output

Research creates organized files in `research/{topic}/`:

| Level | Files Created |
|-------|--------------|
| Task | `summary.md` only |
| Spec | `summary.md`, `findings.md`, `decisions.md` (if decisions exist) |
| Feature | All except `references.md` |
| Project | All files |

### File Templates

Templates in `.claude/templates/research/`:

- `summary.md` - TL;DR with recommendations (all levels)
- `findings.md` - Detailed findings (spec+)
- `decisions.md` - Decisions requiring user input (when applicable)
- `options.md` - Options analysis with trade-offs (feature+)
- `risks.md` - Risks and mitigations (feature+)
- `references.md` - Sources and codebase references (project only)

---

## Level Detection

Auto-detect level based on scope:

```
Level Detection Heuristic:
+-- Single file or function --> task
+-- Single component or module --> spec
+-- Multiple related components --> feature
+-- System-wide or multi-feature --> project
```

---

## Task Examples

```typescript
// Phase 1: Investigate with structured output
Task({
  subagent_type: "general-purpose",
  description: "Research [topic/question]",
  prompt: `
You are a domain-researcher sub-agent (mode=research).

Investigate: [topic/question]
Level: [detected or specified level]

Tasks:
- Search codebase for relevant patterns
- Analyze existing implementations
- Identify constraints and dependencies
- Gather examples and documentation
- Surface any decisions that need user input

Output: Create files in research/{topic}/ based on level:
- Task: summary.md only
- Spec: summary.md, findings.md, decisions.md (if needed)
- Feature: summary.md, findings.md, decisions.md, options.md, risks.md
- Project: All files including references.md

Use templates from .claude/templates/research/

CRITICAL CONSTRAINTS:
- NO actual code implementations
- NO file creation specifications
- NO task lists or checklists
- NO implementation timelines
- Decisions use format from .claude/templates/decisions/
  `,
  model: "opus",
});
```

---

## Preview

```
+----------------------------------------------------------------------+
| /research - Structured Exploratory Investigation                     |
+----------------------------------------------------------------------+
|                                                                      |
| CONTEXT                                                              |
|   Topic: "{{topic}}"                                                 |
|   Detected Level: {{TASK|SPEC|FEATURE|PROJECT}}                      |
|                                                                      |
| PHASE 1: INVESTIGATE                                                 |
|   --> domain-researcher (Opus, mode=research)                        |
|   --> Explore codebase and gather insights                           |
|                                                                      |
| OUTPUT (based on level)                                              |
|   research/{{topic}}/                                                |
|   +-- summary.md (always)                                            |
|   +-- findings.md (spec+)                                            |
|   +-- decisions.md (if decisions needed)                             |
|   +-- options.md (feature+)                                          |
|   +-- risks.md (feature+)                                            |
|   +-- references.md (project only)                                   |
|                                                                      |
+----------------------------------------------------------------------+
| [Enter] Run  [Esc] Cancel                                            |
+----------------------------------------------------------------------+
```

---

## Output Constraints

### DO NOT INCLUDE in research output:

- Actual code implementations
- File creation plans ("create file X with content Y")
- Task lists or implementation steps
- Dependency graphs for implementation ordering
- Timelines or sprint planning
- Configuration file contents
- Dependency installation commands

### DO INCLUDE:

- Options and alternatives
- Trade-offs and comparisons
- Risks and mitigations
- Recommendations with rationale
- Open questions requiring user input
- Pseudocode or interface sketches (max 10 lines, when necessary)
- References to existing code

---

## Decision Format

When decisions are needed, use the scaled format from `.claude/templates/decisions/`:

| Level | Decision Format |
|-------|----------------|
| Task | Inline (~100 words) |
| Spec | Decision brief (~300 words) |
| Feature | Decision document (~600 words) |
| Project | Full decision doc (~1000 words) |

This format is shared with `/design` for consistency.

---

## Integration with /design

When `/design` follows `/research`:

1. **Research artifacts inform design** - decisions from research carry forward
2. **No duplication** - Research stays in `research/`, design creates `specs/`
3. **Decision continuity** - Confirmed decisions don't need re-asking

---

## Note

This does NOT create requirements.md, design.md, or tasks.md.
Use `/design` if you need formal spec files.

$ARGUMENTS
