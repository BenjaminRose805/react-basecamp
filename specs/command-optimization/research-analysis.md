# /research Command Analysis

## Phase 1: Analysis Results

---

## 1. Command Flow

### Trigger

- User invokes `/research [topic]`
- Routed to `plan-agent` as the orchestrator

### Execution Path

```text
User: /research [topic]
    │
    ▼
Command Handler (.claude/commands/research.md)
    │
    ├── 1. Show preview (execution plan)
    ├── 2. Wait for [Enter] confirmation or [Esc] cancel
    │
    ▼
plan-agent (Orchestrator - Opus)
    │
    ├── Parse topic, prepare investigation context
    │
    ▼
PHASE 1: INVESTIGATE (single phase)
    │
    └── Task(domain-researcher mode=research, model: opus)
          │
          └── Returns: findings, code_refs, recommendations, open_questions
    │
    ▼
Create research-notes.md with findings
    │
    ▼
Report findings to user (NO spec files)
```

### Single-Phase Flow

Unlike `/design` which has 4 phases (RESEARCH → WRITE → VALIDATE → potential retry), `/research` has only **one phase**: INVESTIGATE.

- **No WRITE phase**: Does not create requirements.md, design.md, or tasks.md
- **No VALIDATE phase**: No quality-validator check
- **No spec creation**: Only outputs research-notes.md

---

## 2. Sub-Agent Spawning

### domain-researcher Invocation

**Template Location:** `.claude/sub-agents/templates/domain-researcher.md`

**Invocation Pattern:**

```typescript
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

### Mode Parameter

- **Mode:** `research`
- **Note:** The domain-researcher template only defines modes: `plan | code | ui | docs | eval`
- **Gap Identified:** `research` mode is NOT defined in domain-researcher.md valid modes

### Model Used

- **Model:** Opus (same as /design's research phase)

### Handoff Contents

**From research.md command:**

- Topic/question to investigate
- Instruction to NOT create spec files

**Expected from domain-researcher:**

- findings
- code_refs
- recommendations
- open_questions

---

## 3. Inputs/Outputs

### Arguments Accepted

From `research.md`:

```
$ARGUMENTS
```

The command accepts a topic/question as the argument (free-form text).

### Files Read During Research

Based on research skill (`.claude/skills/research/SKILL.md`):

| Search Type              | Files/Patterns                            |
| ------------------------ | ----------------------------------------- |
| Existing implementations | `**/*<feature>*`                          |
| Naming conflicts         | `export.*<name>`                          |
| Patterns                 | `export function`, `export const.*Router` |
| Specs                    | `specs/<feature>/*.md`                    |

### Output Created

**Primary Output:** `research-notes.md`

**Output Location:** Unclear - not specified where research-notes.md is created (project root? specs directory?)

**Output Format:** Markdown with findings and insights (unstructured)

### User Display

From plan-agent.md, after research flow:

- "Report findings to user (NO spec files)"
- No structured output format defined for /research specifically

---

## 4. Relationship to /design

### Does /research Output Feed Into /design?

**Current State: NO explicit integration**

| Aspect         | /research                          | /design                       |
| -------------- | ---------------------------------- | ----------------------------- |
| Research phase | domain-researcher (mode=research)  | domain-researcher (mode=plan) |
| Mode used      | `research` (undefined in template) | `plan` (defined)              |
| Output         | research-notes.md                  | specs/{feature}/\*.md         |
| Reusability    | Not structured for reuse           | Consumes its own research     |

### Handoff Between Commands

**No clear handoff mechanism exists.**

- `/research` creates `research-notes.md` but `/design` doesn't look for or consume it
- `/design` runs its own domain-researcher in `mode=plan`, which duplicates research effort
- No shared context or state between commands

### Can /design Skip Research If /research Was Already Run?

**Currently: NO**

- No detection mechanism for existing research-notes.md
- No way to pass research findings to /design
- /design always runs its full RESEARCH phase

---

## 5. Optimization Opportunities

### 5.1 Mode Definition Gap

**Issue:** `research` mode is invoked but not defined in domain-researcher.md

```yaml
# Defined modes:
mode: plan | code | ui | docs | eval

# Invoked mode:
mode: research  # NOT DEFINED
```

**Fix:** Either:

1. Add `research` mode to domain-researcher.md
2. Map `research` to an existing mode (e.g., `plan`)

### 5.2 Output Location Ambiguity

**Issue:** Where does research-notes.md get created?

**Fix:** Specify output path: `specs/{topic}/research-notes.md` or `research/{topic}.md`

### 5.3 Output Format Not Structured for Reuse

**Issue:** research-notes.md is free-form markdown, not structured for /design consumption

**Current format (implied):**

```markdown
# Findings

[unstructured text]
```

**Suggested structured format:**

```json
{
  "decision": "PROCEED | STOP | CLARIFY",
  "findings": {...},
  "context_summary": "...",
  "recommendations": [...]
}
```

### 5.4 No Integration with /design

**Issue:** /research and /design don't share findings

**Fix:**

1. Create `specs/{feature}/research-notes.md` during /research
2. Have /design check for existing research-notes.md
3. Skip/abbreviate RESEARCH phase if recent research exists

### 5.5 Duplicate Research Effort

**Issue:** If user runs `/research feature` then `/design feature`, research is done twice:

- Once in /research (mode=research)
- Again in /design (mode=plan)

**Fix:** Define handoff protocol where /design consumes /research output

### 5.6 Preview Format Differences

**Issue:** Preview format differs from other commands

```
/research preview:
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

**Note:** Format is similar to other commands but simpler (single phase)

### 5.7 Research Skill vs /research Command Overlap

**Issue:** `.claude/skills/research/SKILL.md` provides detailed research guidance but command doesn't reference it

**Fix:** research.md should explicitly invoke the research skill or inherit its patterns

---

## Summary Table

| Dimension           | Current State         | Issue                   | Priority |
| ------------------- | --------------------- | ----------------------- | -------- |
| Mode parameter      | `research`            | Not defined in template | High     |
| Output location     | Unspecified           | Ambiguous path          | Medium   |
| Output format       | Unstructured markdown | Not reusable            | High     |
| /design integration | None                  | Duplicate effort        | High     |
| Skill usage         | Not referenced        | Inconsistency           | Low      |
| Preview             | Single-phase format   | Consistent ✓            | N/A      |

---

## Recommendations for Phase 2

1. **Define `research` mode** in domain-researcher.md with clear search patterns
2. **Standardize output path** to `specs/{feature}/research-notes.md`
3. **Structure output** as JSON for machine consumption
4. **Add handoff protocol** between /research → /design
5. **Detect existing research** in /design to skip redundant work
