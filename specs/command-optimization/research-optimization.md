# /research Command Optimization

## Phase 2: Optimization Recommendations

---

## 1. Relationship to /design

### Should /research Output Be Reusable by /design?

**YES** - This is the primary optimization opportunity.

| Current State                                      | Proposed State                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| /research creates unstructured `research-notes.md` | /research creates structured `research.json` + `research-notes.md` |
| /design ignores /research output                   | /design checks for existing `research.json`                        |
| Research runs twice if both commands used          | /design skips/abbreviates research if recent                       |
| No shared state                                    | Shared via `specs/{feature}/` directory                            |

### Can /design Skip Research If /research Was Already Run?

**Proposed: YES, with conditions**

```text
/design [feature]
    │
    ├── Check: Does specs/{feature}/research.json exist?
    │   │
    │   ├── YES + recent (< 1 hour) + same topic
    │   │   └── Skip RESEARCH phase, use existing research.json
    │   │
    │   ├── YES + stale (> 1 hour)
    │   │   └── Prompt: "Research found from [time]. Use existing? [Y/n]"
    │   │
    │   └── NO
    │       └── Run full RESEARCH phase
    │
    ▼
    Continue to WRITE phase...
```

### File Format for /design Consumption

**Proposed: Dual output (machine + human readable)**

| File                                | Purpose                      | Consumer            |
| ----------------------------------- | ---------------------------- | ------------------- |
| `specs/{feature}/research.json`     | Machine-readable, structured | /design (automatic) |
| `specs/{feature}/research-notes.md` | Human-readable, narrative    | Developer review    |

---

## 2. Output Format

### Is research-notes.md the Right Output?

**KEEP for human readability, ADD structured format for machine consumption.**

### Proposed Structured Format (research.json)

```json
{
  "version": 1,
  "feature": "user-auth",
  "created_at": "2026-01-28T10:00:00Z",
  "topic": "Original /research query",

  "decision": "PROCEED | STOP | CLARIFY",

  "findings": {
    "existing_implementations": [
      {
        "file": "src/lib/auth.ts",
        "description": "Session-based auth utilities",
        "relevance": "high",
        "lines": "1-45"
      }
    ],
    "conflicts": [],
    "patterns_found": [
      {
        "file": "src/server/routers/user.ts",
        "pattern": "tRPC router with Zod validation",
        "recommendation": "Follow this pattern for auth router"
      }
    ]
  },

  "context_summary": "Auth utilities at src/lib/auth.ts (session-based). Follow src/server/routers/user.ts pattern. No conflicts. Recommend: extend auth.ts, create auth router.",

  "recommendations": [
    "Extend src/lib/auth.ts with JWT helpers",
    "Create new router at src/server/routers/auth.ts",
    "Add tests in src/server/routers/auth.test.ts"
  ],

  "open_questions": ["Should sessions be stored in DB or Redis?"],

  "files_to_read": ["src/lib/auth.ts", "src/server/routers/user.ts"]
}
```

### Should It Match /design's domain-researcher Output?

**YES** - The format should be compatible with what /design's research phase produces.

**Alignment with domain-researcher output schema:**

| Field                             | domain-researcher    | /research output     | Match? |
| --------------------------------- | -------------------- | -------------------- | ------ |
| decision                          | PROCEED/STOP/CLARIFY | PROCEED/STOP/CLARIFY | ✓      |
| findings.existing_implementations | Yes                  | Yes                  | ✓      |
| findings.conflicts                | Yes                  | Yes                  | ✓      |
| findings.patterns_found           | Yes                  | Yes                  | ✓      |
| context_summary                   | Yes (≤500 tokens)    | Yes (≤500 tokens)    | ✓      |
| recommendations                   | Yes                  | Yes                  | ✓      |

---

## 3. Sub-Agent Consistency

### Is domain-researcher (mode=research) Invoked the Same as in /design?

**NO** - Critical inconsistency identified.

| Aspect                    | /research                 | /design                                                  |
| ------------------------- | ------------------------- | -------------------------------------------------------- |
| Mode parameter            | `research`                | `plan`                                                   |
| Mode defined in template? | **NO**                    | Yes                                                      |
| Sub-tasks                 | Single investigative task | 3 parallel analyzers (requirements, dependencies, tasks) |
| Output                    | research-notes.md         | context_summary → writer                                 |

### Should the Handoff Be Identical?

**YES for the output format, NO for the invocation pattern.**

**Rationale:**

- `/research` is exploratory (single-pass investigation)
- `/design` is structured (parallel analysis → write → validate)
- Output should be compatible so /design can consume /research findings

### Proposed: Add `research` Mode to domain-researcher.md

````yaml
# Add to domain-researcher.md mode parameter
mode: plan | code | ui | docs | eval | research

### mode: research (NEW)

Exploratory investigation without spec creation:

```typescript
// Search locations (broad)
src/**/*           // All source code
specs/**/*         // Existing specs
docs/**/*          // Documentation

// Look for
- Existing implementations matching topic
- Related patterns and conventions
- Potential conflicts or dependencies
- Integration points
````

```

---

## 4. Preview/Progress

### How Do Other Commands Preview?

| Command | Preview Format | Phases Shown |
|---------|----------------|--------------|
| /design | ASCII box, 3 phases | RESEARCH → WRITE → VALIDATE |
| /implement | ASCII box, varies by agent | RESEARCH → WRITE/BUILD → VALIDATE |
| /ship | ASCII box, 4 stages | VALIDATE → COMMIT → PR → MONITOR |
| /review | Unclear | 4 loops |
| /research | ASCII box, 1 phase | INVESTIGATE |

**Current /research preview is consistent** with other commands (ASCII box format).

### Should /research Preview Areas to Investigate?

**YES** - Add specificity to the preview.

**Current:**
```

Phase 1: INVESTIGATE
→ domain-researcher (Opus, mode=research)
→ Explore codebase and gather insights

```

**Proposed:**
```

Phase 1: INVESTIGATE
→ domain-researcher (Opus, mode=research)
→ Search areas:
• Source code: src/**/\*
• Existing specs: specs/**/_
• Documentation: docs/\*\*/_
→ Looking for: existing implementations, patterns, conflicts

```

### Progress Indicators

**Current:** Not clearly documented.

**Proposed:** Adopt unified progress template from cross-command-analysis:

```

/research - Exploratory Investigation

Stage 1/1: INVESTIGATE
● Running: domain-researcher (Opus)
├── Searching src/\*_/_ for related patterns...
└── Elapsed: 45s

[==============================] 100% | Stage 1/1 | 2m 15s elapsed

Findings: 3 existing implementations, 2 patterns identified
Decision: PROCEED

```

---

## 5. Scope Control

### Can User Scope Research to Specific Directories/Files?

**Currently: NO**

### Should There Be a `--scope` Flag?

**YES** - High value for large codebases.

**Proposed flags:**

| Flag | Purpose | Example |
|------|---------|---------|
| `--scope=<path>` | Limit search to specific directory | `/research auth --scope=src/server` |
| `--files=<glob>` | Limit to specific file patterns | `/research auth --files="*.ts"` |
| `--exclude=<glob>` | Exclude directories/files | `/research auth --exclude="node_modules,dist"` |
| `--depth=<n>` | Limit directory traversal depth | `/research auth --depth=3` |

**Updated preview with scope:**

```

┌──────────────────────────────────────────────────────────────────────┐
│ /research - Exploratory Investigation │
├──────────────────────────────────────────────────────────────────────┤
│ │
│ CONTEXT │
│ Topic: "user authentication" │
│ Scope: src/server/\*_/_ (limited) │
│ │
│ Phase 1: INVESTIGATE │
│ → domain-researcher (Opus, mode=research) │
│ → Search scoped to: src/server/ │
│ │
├──────────────────────────────────────────────────────────────────────┤
│ [Enter] Run [Esc] Cancel [?] Help │
└──────────────────────────────────────────────────────────────────────┘

````

---

## Deliverables

### 1. Proposed Changes (Specific File Changes)

| File | Change | Priority |
|------|--------|----------|
| `.claude/sub-agents/templates/domain-researcher.md` | Add `research` mode with search patterns | High |
| `.claude/commands/research.md` | Add `--scope`, `--files`, `--exclude` flags | Medium |
| `.claude/commands/research.md` | Specify output location: `specs/{feature}/` | High |
| `.claude/commands/research.md` | Add dual output (research.json + research-notes.md) | High |
| `.claude/commands/design.md` | Add research.json detection and skip logic | High |
| `.claude/agents/plan-agent.md` | Update /research flow to produce structured output | High |
| `.claude/skills/progress/SKILL.md` | Add /research progress template | Low |

### 2. Unified Patterns Adopted

| Pattern | Source | Adopted From |
|---------|--------|--------------|
| Structured JSON output | research.json schema | domain-researcher output format |
| ≤500 token context_summary | context_summary field | All commands via handoff protocol |
| ASCII box preview | Preview format | /design, /implement, /ship |
| Progress indicators | Stage status display | cross-command-analysis template |
| State file location | `specs/{feature}/` | /design output convention |
| Decision enum | PROCEED/STOP/CLARIFY | domain-researcher template |

### 3. /research-Specific Optimizations

#### 3.1 Dual Output Format

```text
/research auth
    │
    └── Creates:
        ├── specs/auth/research.json     # Machine-readable (for /design)
        └── specs/auth/research-notes.md # Human-readable (for review)
````

#### 3.2 Design Integration Protocol

```text
/design auth
    │
    ├── Check specs/auth/research.json
    │   ├── Exists + fresh → Use as input, skip RESEARCH
    │   ├── Exists + stale → Prompt user
    │   └── Missing → Run full RESEARCH
    │
    ▼
    WRITE phase with research context...
```

#### 3.3 Scope Flags for Targeted Research

```bash
# Full codebase research (default)
/research "user authentication"

# Scoped to backend
/research "user authentication" --scope=src/server

# Scoped to specific files
/research "user authentication" --files="**/auth*.ts"

# Exclude test files
/research "user authentication" --exclude="**/*.test.ts"
```

#### 3.4 Output Location Standardization

**Before:** Unclear (root? somewhere?)

**After:**

```
specs/
└── {feature}/
    ├── research.json       # Created by /research
    ├── research-notes.md   # Created by /research
    ├── requirements.md     # Created by /design
    ├── design.md           # Created by /design
    └── tasks.md            # Created by /design
```

#### 3.5 Mode Definition in Template

Add to `.claude/sub-agents/templates/domain-researcher.md`:

````markdown
### mode: research

Exploratory investigation without spec creation:

```typescript
// Search locations (configurable via --scope)
src/**/*           // Source code
specs/**/*         // Existing specs
docs/**/*          // Documentation
.claude/**/*       // Claude configuration

// Look for
- Existing implementations matching topic
- Related patterns and conventions
- Potential conflicts or dependencies
- Integration points and APIs
- Testing patterns
```
````

**Output:** Structured research.json + human-readable research-notes.md

**Decision criteria:**

- PROCEED: No blocking issues, clear path forward
- STOP: Critical conflict or existing implementation covers need
- CLARIFY: Ambiguous requirements or multiple valid approaches

```

---

## Implementation Priority

### Phase 1: Foundation (Tier 1 from cross-command-analysis)

1. **Add `research` mode to domain-researcher.md** (1 hour)
2. **Specify output location in research.md** (30 min)
3. **Define research.json schema** (1 hour)

### Phase 2: Integration (Tier 2)

4. **Update research.md to produce dual output** (2 hours)
5. **Add research.json detection to design.md** (2 hours)
6. **Update plan-agent.md research flow** (2 hours)

### Phase 3: Enhancement (Tier 2-3)

7. **Add --scope, --files, --exclude flags** (4 hours)
8. **Add progress indicators** (2 hours)
9. **Update preview with scope display** (1 hour)

---

## Summary

| Issue | Solution | Impact |
|-------|----------|--------|
| `research` mode undefined | Add to domain-researcher.md | Fixes template gap |
| Output location unclear | Standardize to `specs/{feature}/` | Enables /design integration |
| Unstructured output | Add research.json | Machine-consumable |
| No /design integration | Add detection + skip logic | Eliminates duplicate work |
| No scope control | Add --scope, --files flags | Faster targeted research |
| Progress unclear | Add unified progress template | Better UX |

**Total estimated effort:** ~15 hours

**Key benefit:** Users can run `/research` then `/design` without repeating the research phase, saving ~5 minutes per spec creation.
```
