# Research Output System Design

> **Status:** Draft

## Overview

This document defines a structured output system for `/research` that produces focused, organized files instead of a single monolithic `research-notes.md`. The system scales output appropriately based on research scope (task/spec/feature/project) and uses a consistent decision format shared with `/design`.

---

## Core Principles

### 1. Research is Exploration, Not Implementation

**DO NOT INCLUDE in any research output:**
- Actual code implementations
- File creation plans ("create file X with content Y")
- Task lists or implementation steps
- Dependency graphs for implementation ordering
- Timelines or sprint planning

**DO INCLUDE:**
- Options and alternatives
- Trade-offs and comparisons
- Risks and mitigations
- Recommendations with rationale
- Open questions requiring user input
- Pseudocode or interface sketches (when necessary to illustrate concepts)

### 2. Consistent Decision Format

Decisions surface in both `/research` and `/design`. Use the same scaled format regardless of entry point.

### 3. Level-Appropriate Output

Output volume and file count scale with research scope. Don't create unnecessary files for simple research.

---

## Research Output Structure

```
research/{topic}/
├── summary.md          # Always created - TL;DR with recommendations
├── findings.md         # Detailed findings (spec+ level)
├── decisions.md        # Decisions requiring user input (when applicable)
├── options.md          # Options analysis with trade-offs (feature+ level)
├── risks.md            # Risks and mitigations (feature+ level)
└── references.md       # Sources and codebase references (project level)
```

### File Creation by Level

| Level | Files Created |
|-------|--------------|
| Task | `summary.md` only |
| Spec | `summary.md`, `findings.md`, `decisions.md` (if decisions exist) |
| Feature | All except `references.md` |
| Project | All files |

---

## File Templates

### summary.md (All Levels)

```markdown
# {Topic} Research Summary

> **Level:** {task | spec | feature | project}
> **Date:** {YYYY-MM-DD}

## TL;DR

{2-4 sentences summarizing key findings and primary recommendation}

## Key Findings

{For task level: 3-5 bullet points}
{For spec level: 5-8 bullet points}
{For feature level: 8-12 bullet points}
{For project level: 10-15 bullet points}

## Recommendation

{Primary recommendation with brief rationale - 2-3 sentences}

## Next Steps

{What the user should do after reading this}
- {For task: 1-2 next steps}
- {For spec: 2-3 next steps}
- {For feature: 3-5 next steps}
- {For project: 5-7 next steps}

---

## Quick Links

{Only include links to files that were created}
- [Detailed Findings](./findings.md)
- [Decisions Required](./decisions.md)
- [Options Analysis](./options.md)
- [Risks](./risks.md)
- [References](./references.md)
```

**Length Constraints:**
| Level | Max Length |
|-------|-----------|
| Task | ~200 words |
| Spec | ~400 words |
| Feature | ~600 words |
| Project | ~800 words |

**DO NOT INCLUDE:**
- Implementation details
- Code snippets longer than 5 lines
- File paths for files to create
- Task breakdown

---

### findings.md (Spec+ Level)

```markdown
# {Topic} Research Findings

> **Level:** {spec | feature | project}

## Context

{Brief description of what was investigated and why - 2-3 sentences}

## Findings by Category

### {Category 1}

{Organized findings. Use headers that make sense for the topic.}

**What we found:**
- {Finding 1}
- {Finding 2}

**Implications:**
- {Implication 1}

### {Category 2}

...

## Existing Implementations

{What already exists in the codebase that's relevant}

| Location | Description | Relevance |
|----------|-------------|-----------|
| `{path}` | {what it does} | {high/medium/low} |

## Patterns Identified

{Patterns from the codebase that should be followed or avoided}

### Patterns to Follow
- {Pattern}: {where found} - {why to follow}

### Patterns to Avoid
- {Anti-pattern}: {where found} - {why to avoid}

## Constraints Discovered

{Technical, organizational, or other constraints uncovered}

- **{Constraint type}:** {description}

---

**DO NOT INCLUDE:**
- Implementation plans
- Task lists
- Code to write
- File creation specifications
```

**Length Constraints:**
| Level | Max Length |
|-------|-----------|
| Spec | ~800 words |
| Feature | ~1500 words |
| Project | ~2500 words |

---

### decisions.md (When Decisions Exist)

This file uses the same scaled decision format whether populated from `/research` or `/design`.

```markdown
# {Topic} Decisions

> **Level:** {task | spec | feature | project}
> **Status:** Pending User Input

## Overview

{1-2 sentences explaining what decisions are needed and why}

---

{Decisions use scaled format based on level}
```

#### Task-Level Decision Format (Inline)

```markdown
## Decision: {Short title}

**Question:** {The specific question needing an answer}

**Options:**
- **A:** {Option A} - {brief pro/con}
- **B:** {Option B} - {brief pro/con}

**Recommendation:** {A or B} because {one sentence rationale}

**Impact if deferred:** {What happens if we don't decide now}
```

#### Spec-Level Decision Format (Decision Brief)

```markdown
## Decision: {Title}

**Context:** {2-3 sentences on why this decision matters}

**Options:**

### Option A: {Name}
- **Approach:** {1-2 sentences}
- **Pros:** {2-3 bullets}
- **Cons:** {2-3 bullets}
- **Effort:** {low/medium/high}

### Option B: {Name}
- **Approach:** {1-2 sentences}
- **Pros:** {2-3 bullets}
- **Cons:** {2-3 bullets}
- **Effort:** {low/medium/high}

**Recommendation:** {Option X} because {2-3 sentences of rationale}

**Reversibility:** {easy/moderate/difficult} - {why}

**Dependencies:** {What this decision affects}
```

#### Feature-Level Decision Format (Decision Document)

```markdown
## Decision: {Title}

### Context
{3-5 sentences providing full background}

### Problem Statement
{Clear articulation of what needs to be decided}

### Options Analysis

#### Option A: {Name}

**Description:**
{Full paragraph describing the approach}

**Advantages:**
- {Detailed advantage 1}
- {Detailed advantage 2}
- {Detailed advantage 3}

**Disadvantages:**
- {Detailed disadvantage 1}
- {Detailed disadvantage 2}

**Implementation Considerations:**
{What would be involved - NOT a task list, but considerations}

**Risk Assessment:** {Low/Medium/High} - {explanation}

#### Option B: {Name}
{Same structure as Option A}

### Recommendation

**Recommended Option:** {Option X}

**Rationale:**
{Full paragraph explaining why this is the best choice given the context}

**Trade-offs Accepted:**
- {Trade-off 1 we're accepting}
- {Trade-off 2 we're accepting}

### Open Questions
- {Question that might affect this decision}
```

#### Project-Level Decision Format (Full Decision Document)

```markdown
## Decision: {Title}

### Executive Summary
{3-4 sentences for quick understanding}

### Background
{Full context section - 2-3 paragraphs}

### Problem Statement
{Clear, complete articulation}

### Decision Criteria
{What factors matter for this decision}
- {Criterion 1}: {weight/importance}
- {Criterion 2}: {weight/importance}

### Options Analysis

{Each option gets full treatment with all subsections from feature level, plus:}

#### Option A: {Name}

**Alignment with Criteria:**
| Criterion | Score | Notes |
|-----------|-------|-------|
| {Criterion 1} | {1-5} | {explanation} |

**Long-term Implications:**
{Paragraph on future impact}

### Recommendation

{Full section from feature level, plus:}

**Success Metrics:**
- {How we'll know this was the right decision}

**Review Trigger:**
- {Conditions that should cause us to revisit this decision}

### Decision Record

**Status:** Pending
**Proposed:** {date}
**Decided:** {date when user confirms}
**Decided by:** {user}
```

**Length Constraints:**
| Level | Max Length per Decision |
|-------|------------------------|
| Task | ~100 words |
| Spec | ~300 words |
| Feature | ~600 words |
| Project | ~1000 words |

**DO NOT INCLUDE:**
- Implementation steps
- Code to write
- File paths for new files
- Sprint/timeline planning

---

### options.md (Feature+ Level)

```markdown
# {Topic} Options Analysis

> **Level:** {feature | project}

## Overview

{What options are being compared and why - 2-3 sentences}

## Options Comparison

### Option 1: {Name}

**Description:**
{What this option entails - paragraph}

**Characteristics:**
- **Complexity:** {low/medium/high}
- **Risk:** {low/medium/high}
- **Flexibility:** {low/medium/high}
- **Maintenance burden:** {low/medium/high}

**Best suited for:**
{When to choose this option}

**Trade-offs:**
{What you give up}

### Option 2: {Name}
{Same structure}

## Comparison Matrix

| Aspect | Option 1 | Option 2 | Option 3 |
|--------|----------|----------|----------|
| {Aspect 1} | {rating/note} | {rating/note} | {rating/note} |
| {Aspect 2} | {rating/note} | {rating/note} | {rating/note} |

## Recommendation

{Which option and why - brief, as full rationale is in decisions.md if applicable}
```

**Length Constraints:**
| Level | Max Length |
|-------|-----------|
| Feature | ~1000 words |
| Project | ~2000 words |

**DO NOT INCLUDE:**
- Implementation plans for options
- Code examples beyond pseudocode
- Task lists

---

### risks.md (Feature+ Level)

```markdown
# {Topic} Risk Assessment

> **Level:** {feature | project}

## Risk Summary

| Risk | Likelihood | Impact | Severity | Mitigation Status |
|------|-----------|--------|----------|------------------|
| {Risk 1} | {L/M/H} | {L/M/H} | {Critical/High/Medium/Low} | {Identified/Planned/In Place} |

## Detailed Risks

### Risk: {Risk Title}

**Category:** {Technical/Organizational/External/Timeline}

**Description:**
{Full description of the risk - 2-3 sentences}

**Likelihood:** {Low/Medium/High}
{Why this likelihood}

**Impact:** {Low/Medium/High}
{What happens if it occurs}

**Indicators:**
- {Early warning sign 1}
- {Early warning sign 2}

**Mitigation Strategies:**
- {Strategy 1}
- {Strategy 2}

**Contingency (if risk materializes):**
{What to do if it happens}

### Risk: {Risk 2}
{Same structure}

## Risk Dependencies

{Risks that are related or compound}

- {Risk A} + {Risk B} → {Combined effect}

## Monitoring Recommendations

{How to watch for these risks}
```

**Length Constraints:**
| Level | Max Length |
|-------|-----------|
| Feature | ~800 words |
| Project | ~1500 words |

**DO NOT INCLUDE:**
- Risk mitigation implementation plans
- Task lists for risk handling
- Code changes for risk mitigation

---

### references.md (Project Level)

```markdown
# {Topic} References

> **Level:** project

## Codebase References

### Key Files

| File | Purpose | Notes |
|------|---------|-------|
| `{path}` | {what it does} | {why relevant} |

### Related Patterns

| Pattern | Location | Description |
|---------|----------|-------------|
| {Pattern name} | `{path}` | {how it works} |

## External References

### Documentation
- [{Title}]({url}) - {why relevant}

### Articles/Posts
- [{Title}]({url}) - {key takeaway}

### Similar Projects/Examples
- [{Name}]({url}) - {what we can learn}

## Related Specs

| Spec | Relationship |
|------|--------------|
| `specs/{path}` | {how related} |

## Terminology

| Term | Definition | Usage |
|------|-----------|-------|
| {Term} | {Definition} | {How used in this context} |
```

**Length Constraints:** ~500 words max

---

## Decision Format Integration

### How Decisions Surface

```
/research                           /design
    │                                   │
    ▼                                   ▼
research/{topic}/                   [Research Phase]
decisions.md                            │
    │                                   ▼
    │                              specs/{feature}/
    │                              design.md (Architecture Decisions section)
    │                                   │
    └──────────────────────────────────┘
                   │
                   ▼
           Same Decision Format
           Scaled to Level
```

### Decision Lifecycle

1. **Surfaced in Research** (`research/{topic}/decisions.md`)
   - Decisions are identified
   - Options are analyzed
   - Recommendations are made
   - Status: `Pending User Input`

2. **User Confirms** (interactive checkpoint)
   - User reviews and decides
   - Status: `Decided`

3. **Carried to Design** (if `/design` follows)
   - Confirmed decisions inform design.md
   - Recorded in Architecture Decisions section
   - Status: `Implemented` (after code is written)

### Shared Decision Schema

```yaml
decision:
  id: string          # Unique identifier (e.g., "D001")
  title: string       # Short descriptive title
  level: enum         # task | spec | feature | project
  status: enum        # pending | decided | implemented | superseded
  context: string     # Why this decision matters
  options: array      # List of options considered
  recommendation: string  # Recommended option
  rationale: string   # Why recommendation was made
  decided_by: string  # Who made the decision (user)
  decided_at: date    # When decided
  source: enum        # research | design
```

---

## Level Detection

The research agent should auto-detect level based on scope:

```
Level Detection Heuristic:
├── Single file or function → task
├── Single component or module → spec
├── Multiple related components → feature
└── System-wide or multi-feature → project
```

User can override with explicit flags:
```bash
/research topic --task
/research topic --spec
/research topic --feature
/research topic --project
```

---

## Output Examples

### Task-Level Research

Input: `/research "how to add loading state to Button component"`

Output:
```
research/button-loading-state/
└── summary.md (only file)
```

`summary.md` content (~150 words):
```markdown
# Button Loading State Research Summary

> **Level:** task
> **Date:** 2024-01-15

## TL;DR

The existing Button component in `src/components/ui/button.tsx` supports a `disabled` prop but has no loading state. The shadcn/ui pattern uses a combination of `disabled` + spinner icon.

## Key Findings

- Button component at `src/components/ui/button.tsx` uses CVA for variants
- No existing loading pattern in the codebase
- shadcn/ui convention: add `isLoading` prop that disables button and shows spinner
- Lucide React already installed (has Loader2 spinner icon)

## Recommendation

Add `isLoading` prop following shadcn/ui pattern. Use Loader2 icon with animate-spin class.

## Next Steps

- Add `isLoading` prop to Button component
- Show Loader2 icon when loading, hide children or show alongside
```

### Spec-Level Research

Input: `/research "authentication options for the app"`

Output:
```
research/authentication-options/
├── summary.md
├── findings.md
└── decisions.md
```

### Feature-Level Research

Input: `/research "real-time collaboration features" --feature`

Output:
```
research/realtime-collaboration/
├── summary.md
├── findings.md
├── decisions.md
├── options.md
└── risks.md
```

### Project-Level Research

Input: `/research "migrating to microservices architecture" --project`

Output:
```
research/microservices-migration/
├── summary.md
├── findings.md
├── decisions.md
├── options.md
├── risks.md
└── references.md
```

---

## Integration with /design

When `/design` is run after `/research`:

1. **Research Artifacts Inform Design**
   - design.md references decisions from research
   - Risks carry forward to design considerations
   - Options analysis informs architecture decisions

2. **No Duplication**
   - Research stays in `research/{topic}/`
   - Design creates new files in `specs/{feature}/`
   - Cross-references via links, not copy/paste

3. **Decision Continuity**
   - Decisions made in research are recorded
   - Design phase doesn't re-ask decided questions
   - New decisions surface in design.md

---

## Anti-Patterns

### DO NOT in Research Output

1. **Create implementation specs**
   ```markdown
   # BAD - This is implementation, not research
   ## Implementation Plan
   1. Create src/lib/auth.ts
   2. Add AuthProvider component
   3. Update app layout
   ```

2. **Write actual code**
   ```markdown
   # BAD - Research doesn't produce code
   ```typescript
   export function authenticate(credentials: Credentials) {
     // implementation
   }
   ```
   ```

3. **Specify file contents**
   ```markdown
   # BAD - This is design/implement phase work
   ## Files to Create
   - `src/lib/auth.ts`: Contains authenticate(), logout(), refresh()
   - `src/components/AuthProvider.tsx`: Context provider with user state
   ```

4. **Create task lists**
   ```markdown
   # BAD - Tasks belong in specs/tasks.md
   ## Tasks
   - [ ] Create auth module
   - [ ] Add login form
   - [ ] Implement session handling
   ```

### DO in Research Output

1. **Describe options conceptually**
   ```markdown
   # GOOD - Conceptual comparison
   ## Options for Session Management

   ### JWT-based
   Stateless tokens stored client-side...

   ### Session-based
   Server-side sessions with cookie reference...
   ```

2. **Use pseudocode when necessary**
   ```markdown
   # GOOD - Pseudocode to illustrate concept
   ```
   authenticate(credentials):
     validate credentials
     if valid: create session, return token
     else: return error
   ```
   ```

3. **Reference existing code**
   ```markdown
   # GOOD - Reference, don't specify new
   The pattern in `src/lib/session.ts` (lines 45-67) shows
   how the codebase handles secure token storage.
   ```

4. **Identify decisions needed**
   ```markdown
   # GOOD - Surface decisions, don't make implementation choices
   ## Decision: Session Storage Strategy

   **Options:**
   - A: httpOnly cookies (more secure)
   - B: localStorage (simpler)

   **Recommendation:** Option A because of XSS protection
   ```

---

## Implementation Notes

### For Plan Agent

When routing `/research`:

1. Detect level (or accept flag)
2. Create appropriate file set based on level
3. Ensure no implementation content in output
4. Use decision format appropriate to level
5. Store in `research/{topic}/` (not `specs/`)

### For Domain Researcher (mode=research)

Output constraints:

```yaml
allowed_content:
  - findings and observations
  - options and alternatives
  - trade-offs and comparisons
  - risks and concerns
  - recommendations with rationale
  - pseudocode (max 10 lines)
  - interface sketches (conceptual only)
  - open questions

forbidden_content:
  - actual code implementations
  - file creation specifications
  - task lists or checklists
  - implementation timelines
  - dependency installation commands
  - configuration file contents
```

### Validation Checklist

Before completing research output, verify:

- [ ] No actual code (only pseudocode if necessary)
- [ ] No "create file X" instructions
- [ ] No task lists or checkboxes
- [ ] No implementation timelines
- [ ] Decisions use level-appropriate format
- [ ] File count matches level (see table above)
- [ ] Length constraints respected

---

## Summary

This system provides:

1. **Structured output** - Multiple focused files vs one monolith
2. **Level-appropriate scaling** - Right amount of detail for scope
3. **Consistent decisions** - Same format in /research and /design
4. **Clear boundaries** - Research explores, design/implement builds
5. **Actionable results** - Summary always has clear next steps
