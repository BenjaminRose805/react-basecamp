# Research Notes: Unified Templates

> **Date:** 2026-01-31
> **Status:** Complete
> **Researcher:** domain-researcher (Opus)

## Verdict: PROCEED

The unified-templates spec is sound and implementable. No blockers were found. Seven amendments are recommended: (1) make `linear` optional in spec.json, (2) adopt `{{double_brace}}` or `__UPPER_SNAKE__` variable syntax instead of single `{curly_brace}`, (3) treat line targets as soft budgets with +/-5 tolerance, (4) add a note that existing specs are NOT migrated, (5) document that checkpoint infrastructure is out-of-scope and error-report.md will render placeholder text, (6) clarify that spec.json and meta.yaml share 3 fields intentionally (single source of truth is meta.yaml; spec.json is a build artifact), (7) mark T009 as weakly depending on T008 since both define `status` and `created` fields that should be consistent.

---

## A. Concerns, Edge Cases, Risk

### Q1: Existing spec migration

**Finding: Existing specs will NOT break and do NOT need migration.**

Evidence:

- 10 `requirements.md` files exist across specs: `01-sub-agent-infrastructure`, `02-commands-and-skills`, `03-review-system`, `agent-optimization`, `legacy-cleanup`, `cleanup`, `start-optimization`, `scripts-automation`, `unified-templates`, plus the template itself (`specs/templates/requirements.md`).
- Only 2 of these 10 files use the current 125-line template structure with the EARS/RFC2119 reference tables: `specs/templates/requirements.md` (the template itself, line 13-36) and `specs/start-optimization/requirements.md` (line 12-36). The other 8 specs deviate significantly from the template.
- Structural diversity is extreme:
  - `specs/cleanup/requirements.md` uses BR/FR/PR/AC numbering (no EARS tables, no blockquote header)
  - `specs/legacy-cleanup/requirements.md` uses REQ-001 with Type/Priority fields
  - `specs/scripts-automation/requirements.md` uses REQ-LIB/REQ-GIT/REQ-CHK numbering with JSON examples
  - `specs/agent-optimization/requirements.md` uses a flat list format with success criteria checkboxes
- The trimming only modifies `specs/templates/requirements.md` -- the template file. Existing specs generated from the old template are already written and finalized. They reference no template dynamically.
- **Recommendation:** Add an explicit note to the spec: "Existing specs are not migrated. The trimmed templates apply only to newly-created specs going forward."

### Q2: Conditional command sections in command-preview.md

**Finding: It is a single file with conditional sections, not 7 separate files.**

Evidence:

- `specs/unified-templates/design.md` lines 38-57 describe `command-preview.md` as one component with "variable sections" and "command-specific extensions." Each command adds specific blocks (e.g., /start adds PREREQUISITES, /ship adds COMMIT PREVIEW + PR PREVIEW + DEPLOYMENT STATUS + CHECKS).
- The synthesis at `specs/command-optimization/synthesis.md` lines 9-53 confirms a single file at `.claude/skills/preview/templates/command-preview.md` with a table of per-command additional sections.
- The existing preview skill at `.claude/skills/preview/SKILL.md` (450 lines) already demonstrates this pattern: it has a single `SKILL.md` file with separate sections for `/start Preview`, `/plan Preview`, `/implement Preview`, `/ship Preview` -- each with its own box-drawing layout. See lines 79-245.
- **How conditional rendering works:** The agent rendering the preview inspects the command name and includes/excludes sections. The template uses `{curly_brace}` variables and `(if applicable)` markers (synthesis line 22-25). The rendering agent fills in the applicable sections and omits the rest. This is template-level conditionality, not runtime rendering -- the agent chooses which sections to populate.
- **Risk:** The single-file approach for command-preview.md could become very long if all 7 command-specific blocks are verbose. The existing SKILL.md is already 450 lines. However, the new template is purely a layout reference, not executable code. Keeping it in one file is manageable.

### Q3: Linear configuration when not configured

**Finding: The `linear` block should be OPTIONAL in spec.json.**

Evidence:

- Synthesis section 6.4.2 (`specs/command-optimization/synthesis.md` lines 884-901) proposes a `.claude/config/integrations.json` file with `"linear": { "enabled": true, ... }`. This file does **not** currently exist -- only `.claude/config/review-config.yaml` and `.claude/config/environment.json` exist.
- Synthesis section 6.1.6 (lines 752-763) shows `linear` as a block in spec.json with `identifier` and `url` fields.
- The unified-templates design.md (line 145-149) includes the `linear` block directly in the spec.json schema without an `"enabled"` guard.
- Since Linear integration is a setup-time configuration, and many users/projects may not have Linear configured, the `linear` block must be **optional**. If Linear is not configured:
  - spec.json should omit the `linear` key entirely (not include it with null values)
  - The template should mark it with a comment: `// Optional: Include if Linear is configured`
- **Recommendation:** Amend spec.json schema to mark `linear` as optional. Add `"linear?":` notation or a comment in the template. The requirement REQ-4.3 ("SHALL include Linear identifier fields in spec.json") should be softened to "SHALL include Linear identifier fields in spec.json WHEN Linear integration is configured."

### Q4: `{curly_brace}` variable syntax conflicts with code blocks

**Finding: Real conflict exists. The current convention is ambiguous.**

Evidence:

- The template variable syntax `{curly_brace}` (NFR-1 in `specs/unified-templates/requirements.md` line 49) directly conflicts with:
  - **JSON examples** in templates: `{ "name": "{feature}" }` -- are the outer braces JSON or variables?
  - **TypeScript interfaces**: `interface ModelName { id: string; }` -- both the template and code use `{}`
  - **Template literals** in code examples: `${variable}` in TypeScript code blocks
- Searching `.claude/skills/` and `.claude/agents/` for `{variable}` patterns reveals pervasive use of curly braces in:
  - Code examples (TypeScript/JSON throughout)
  - File path templates: `specs/{feature}/`, `.claude/state/{command}-checkpoint.json`
  - Template variables in agents: `{agent-name}`, `{domain}`, `{phase-2-name}`
- The existing `SKILL.md` for preview (line 41) uses `{command}`, `{description}`, `{path}` etc. inside box-drawing layouts. Within box layouts, the convention is clear because there is no surrounding code. But when mixed with JSON or TypeScript, ambiguity arises.
- **Options:**
  1. `{{double_braces}}` -- Jinja/Mustache style, unambiguous
  2. `__UPPER_SNAKE__` -- e.g., `__FEATURE_NAME__`, never conflicts with code
  3. `${variable}` -- shell/template-literal style, conflicts with TypeScript
  4. `<variable>` -- XML style, conflicts with JSX
- **Recommendation:** Switch to `{{double_braces}}` for template variables. This is the industry standard (Handlebars, Jinja2, Mustache, Django templates) and never appears in JSON, TypeScript, or markdown code blocks. Update NFR-1 to: "All templates SHALL use `{{double_brace}}` variable syntax."

### Q5: Line target feasibility with +/-2 tolerance

**Finding: The +/-2 tolerance is tight but achievable for requirements.md and tasks.md. Design.md is the riskiest.**

**requirements.md (target: 55 lines):**

Minimum line count by section:

- Header block (title + blank + blockquote status/created/spec_id + blank): 5 lines
- `---` separator: 1 line
- Overview (heading + blank + text + blank): 4 lines
- `---` separator: 1 line
- User Stories heading: 1 line
- US1 (story heading + As-a line + blank + heading + 3 EARS patterns with REQ-IDs): ~12 lines
- `---` separator: 1 line
- NFR section (heading + 2-3 items): ~5 lines
- `---` separator: 1 line
- Out of Scope (heading + 2 bullets): ~4 lines
- `---` separator: 1 line
- Dependencies (heading + table header + table row): ~5 lines

**Total minimum: ~42 lines. Target 55 provides ~13 lines of comfortable padding.** Feasible.

**design.md (target: 70 lines):**

Minimum line count by section (per design.md component 5):

- Header block: 5 lines
- Overview: 4 lines
- Architecture (heading + current + target, minimal): 10 lines
- Component Design (heading + component description + I/O table): 25 lines is tight for any real component
- Data Models (heading + interface skeleton): 8 lines
- Data Flow (heading + diagram): 8 lines
- Error Handling (heading + scenario): 5 lines
- Testing Strategy (heading + table): 5 lines

**Total minimum: ~70 lines. Exactly at target with zero margin.** The +/-2 tolerance helps, but this is the tightest fit. Component Design at 25 lines means roughly 4-5 components with 5 lines each. This is doable for templates (which use placeholder content) but may feel cramped.

**tasks.md (target: 45 lines):**

Minimum line count by section (per design.md component 6):

- Header block: 5 lines
- Progress summary: 4 lines
- Phase sections (2 phases x ~10 lines each with compact task format): 22 lines
- Task Dependencies (heading + graph): 5 lines
- Completion Criteria (heading + 3 items): 5 lines

**Total minimum: ~41 lines. Target 45 with 4 lines of padding.** Feasible.

**Recommendation:** Change tolerance from +/-2 to +/-5 lines. This gives design.md necessary breathing room without abandoning the goal. Update completion criteria line 131 accordingly.

### Q6: Error template checkpoint infrastructure

**Finding: Checkpoint infrastructure does not exist yet. The error template will render placeholder text.**

Evidence:

- Searching for "checkpoint" in `.claude/` returned **zero results**. No checkpoint files, no checkpoint manager, no resume commands exist anywhere in the `.claude/` directory.
- The synthesis (section 3, lines 329-427) defines the checkpoint schema extensively, but it is entirely **proposed future work** -- not yet implemented.
- The priority matrix (synthesis section 4.1, line 443) shows checkpoint infrastructure as **#1 P0** -- the highest priority foundational item. The unified templates spec (#6 P1, #7 P1, #19 P3, #24 P4) all have lower priority.
- The `specs/unified-templates/requirements.md` line 56 explicitly lists "Checkpoint management implementation" as **Out of Scope**.
- **What happens when checkpoint doesn't exist:** The error template (`error-report.md`) will contain `{checkpoint_path}` and `{resume_cmd}` variables. When rendered by an agent before checkpoint infrastructure exists:
  - `{checkpoint_path}` should render as "N/A" or "Checkpoint not available"
  - `{resume_cmd}` should render as "Re-run the command manually"
- The design.md line 172 states: "IF template variables are not filled, THEN leave placeholder with `{variable_name}` syntax for manual completion."
- **Recommendation:** Add a fallback note to the error-report.md template design: "When checkpoint infrastructure is not available, render checkpoint fields as 'N/A - checkpoint support pending' rather than leaving raw variable syntax."

### Q7: summary.md overlap with requirements.md Overview

**Finding: summary.md serves a distinct audience and purpose. The overlap is intentional and minimal.**

Evidence:

- Synthesis section 1.6 (lines 193-213) describes summary.md as a "Quick human review (~25 lines)" -- specifically for stakeholder consumption.
- The design.md (lines 113-119) specifies summary.md contains: feature name + status badge, one-paragraph summary, key decisions (bullet list), links to full specs.
- requirements.md's Overview section is 1-2 sentences focused on _what we're building and why_ (template line 9). It is embedded within a detailed technical document (55+ lines) that includes EARS requirements, NFRs, dependencies, etc.
- **Audience difference:**
  - `summary.md`: Project managers, stakeholders, or developers doing a quick triage of "what is this spec about?" without opening multiple files. It is a dashboard-style entry point.
  - `requirements.md`: Implementers who need the full requirement detail, acceptance criteria, and dependency information.
- **Use cases for summary.md:**
  1. `/implement` agent quickly checking spec status before starting
  2. A developer skimming through `specs/` directory to find a specific feature
  3. A stakeholder reviewing progress without reading technical details
  4. A script (like `research/query-specs.cjs` per REQ-RES-003) that needs to display a summary of all specs
- The overlap with Overview is intentional: summary.md _extracts and expands_ the Overview into a standalone quick-reference document that also includes status, decisions, and navigation links.
- **Recommendation:** No change needed. The overlap is by design and serves different consumption patterns.

---

## B. Clarity on What, Why, Impact

### Q8: Exact template cuts

**requirements.md: 125 lines -> 55 lines (cut 70 lines)**

| Section                               | Current Lines  | After Lines | Action                                                                                                                                                                                                  |
| ------------------------------------- | -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header (title + status block)         | 1-6 (6)        | 1-5 (5)     | Keep, trim blank line                                                                                                                                                                                   |
| Overview                              | 7-11 (5)       | 6-10 (5)    | Keep as-is                                                                                                                                                                                              |
| **EARS Patterns table**               | **13-26 (14)** | **CUT**     | **Remove entirely**                                                                                                                                                                                     |
| **RFC 2119 table**                    | **28-36 (9)**  | **CUT**     | **Remove entirely**                                                                                                                                                                                     |
| Separator                             | 37 (1)         | 11 (1)      | Keep                                                                                                                                                                                                    |
| User Stories heading                  | 39 (1)         | 12 (1)      | Keep                                                                                                                                                                                                    |
| US1 (one story + all 9 EARS examples) | 41-79 (39)     | 13-30 (~18) | **Keep 1 story with 3 patterns only** (event-driven, unwanted, ubiquitous). Cut 6 pattern examples (state-driven, optional, prohibitions, recommendations, optional behavior, and duplicate story US2). |
| **US2 (duplicate story)**             | **82-92 (11)** | **CUT**     | **Remove entirely**                                                                                                                                                                                     |
| NFR section                           | 94-108 (15)    | 31-38 (~8)  | **Condense**: Keep heading + 2-3 NFR one-liners, cut verbose sub-headings                                                                                                                               |
| Out of Scope                          | 111-115 (5)    | 39-44 (6)   | Keep as-is                                                                                                                                                                                              |
| Dependencies table                    | 118-124 (7)    | 45-53 (9)   | Keep as-is                                                                                                                                                                                              |
| Final separator                       | 125 (1)        | 54-55 (2)   | Keep                                                                                                                                                                                                    |

**Sections removed:** EARS Patterns table (14 lines), RFC 2119 table (9 lines), 6 pattern examples (~30 lines), US2 (~11 lines), verbose NFR sub-headings (~6 lines). Total cut: ~70 lines.

**design.md: 128 lines -> 70 lines (cut 58 lines)**

| Section                               | Current Lines   | After Lines | Action                                                 |
| ------------------------------------- | --------------- | ----------- | ------------------------------------------------------ |
| Header                                | 1-6 (6)         | 1-5 (5)     | Keep                                                   |
| Overview                              | 7-11 (5)        | 6-10 (5)    | Keep                                                   |
| Architecture (Current + Target)       | 13-27 (15)      | 11-22 (12)  | **Condense**: Merge current/target into single block   |
| Component Design                      | 29-41 (13)      | 23-47 (25)  | **Expand**: This is the core section, gets more space  |
| Data Models                           | 43-53 (11)      | 48-55 (8)   | **Trim**: Remove blank lines, single interface example |
| Data Flow                             | 55-67 (13)      | 56-63 (8)   | **Trim**: Shorter diagram                              |
| Error Handling                        | 69-79 (11)      | 64-68 (5)   | **Condense**: Single scenario                          |
| Testing Strategy (Unit + Integration) | 81-96 (16)      | 69-73 (5)   | **Merge**: Single table instead of two                 |
| **Implementation Notes**              | **98-105 (8)**  | **CUT**     | **Remove** (merge any essentials into overview)        |
| **Security Considerations**           | **107-113 (7)** | **CUT**     | **Remove** (merge into Error Handling if needed)       |
| **Alternatives Considered**           | **115-120 (6)** | **CUT**     | **Remove entirely**                                    |
| **Dependencies table**                | **122-128 (7)** | **CUT**     | **Remove** (redundant with requirements.md)            |

**Sections removed:** Implementation Notes (8 lines), Security Considerations (7 lines), Alternatives Considered (6 lines), Dependencies (7 lines). Total cut from removals: ~28 lines. Additional ~30 lines from condensing Architecture, Data Models, Data Flow, Error Handling, Testing.

**tasks.md: 108 lines -> 45 lines (cut 63 lines)**

| Section                 | Current Lines  | After Lines | Action                                                               |
| ----------------------- | -------------- | ----------- | -------------------------------------------------------------------- |
| Header                  | 1-6 (6)        | 1-5 (5)     | Keep                                                                 |
| Progress summary        | 7-15 (9)       | 6-9 (4)     | **Condense**: Single line format "X/Y tasks complete"                |
| Phase 1 section         | 17-30 (14)     | 10-17 (8)   | **Compact**: Remove step details, keep task + `_Prompt` only         |
| Phase 2 section         | 32-44 (13)     | 18-25 (8)   | Same compact format                                                  |
| Phase 3 section         | 46-57 (12)     | 26-33 (8)   | Same compact format                                                  |
| Task Dependencies       | 59-72 (14)     | 34-39 (6)   | **Trim**: Keep graph, cut Legend explanation                         |
| **Execution Notes**     | **74-91 (18)** | **CUT**     | **Remove entirely** (parallel info + effort inline in phase headers) |
| **Rollback Checkpoint** | **92-98 (7)**  | **CUT**     | **Remove entirely** (handled by checkpoint infrastructure)           |
| Completion Criteria     | 100-108 (9)    | 40-45 (6)   | **Trim**: Remove blank lines                                         |

**Sections removed:** Execution Notes (18 lines), Rollback Checkpoint (7 lines). Total cut from removals: ~25 lines. Additional ~38 lines from condensing all other sections.

### Q9: spec.json vs tasks.md

**Finding: spec.json provides structured, parseable data that tasks.md cannot efficiently deliver.**

Evidence:

- The code-agent (`/home/benjamin/basecamp/react-basecamp--templates/.claude/agents/code-agent.md`, lines 162-168) currently consumes specs by reading `specs/{feature}/` files and iterating "For each task in `tasks.md`". This requires the agent to parse markdown -- understanding checkbox syntax (`- [ ] **T001** [US#] description`), indentation, phase boundaries, and `_Prompt` fields.
- No task-parser currently exists in the codebase. Searching for "task-parser" found only references in the synthesis document (proposed future work at `specs/command-optimization/synthesis.md` lines 285-324) and the execution plan. It is entirely conceptual.
- **What spec.json enables that tasks.md parsing cannot:**
  1. **Structured phases array:** `"phases": [{ "name": "Phase 1", "tasks": ["T001", "T002"] }]` -- no regex needed
  2. **File manifest:** `"files": { "requirements": "requirements.md", "design": "design.md" }` -- machine-readable paths
  3. **Status tracking:** `"status": "approved"` -- single field lookup vs. parsing blockquote headers
  4. **Linear integration:** `"linear": { "identifier": "BAS-6" }` -- direct JSON key access for PR bodies
  5. **Cross-spec queries:** A script can `JSON.parse()` all `spec.json` files to build a project dashboard. Parsing markdown for the same data requires custom regex per section.
- **The fundamental argument:** JSON is a data format; markdown is a document format. Using markdown as a data source requires building a parser (the proposed `task-parser.cjs`). Using JSON eliminates that need entirely. spec.json is the **compiled artifact** of the spec; tasks.md is the **source document** for humans.
- **However:** spec.json introduces a sync risk -- if someone edits tasks.md but not spec.json, they diverge. This argues for generating spec.json from the markdown files rather than maintaining it manually. The synthesis section 4.1 lists spec.json as P2 priority (#17), suggesting it is not critical for initial implementation.

### Q10: meta.yaml as separate file vs. YAML frontmatter

**Finding: Separate file is the correct choice for this project.**

Evidence:

- Current spec files use **markdown blockquote headers**, not YAML frontmatter:
  ```markdown
  > **Status:** Draft
  > **Created:** 2026-01-31
  > **Spec ID:** unified-templates
  ```
  This pattern appears in `specs/templates/requirements.md` (lines 3-5), `specs/start-optimization/requirements.md` (lines 3-5), and `specs/unified-templates/requirements.md` (lines 3-5). Other specs like `cleanup/requirements.md` and `legacy-cleanup/requirements.md` omit metadata entirely.
- No spec files in the project use YAML frontmatter (`---` delimited). The only files using YAML frontmatter are agent files (`.claude/agents/*.md`), which use it for name/description fields.
- **Arguments for separate meta.yaml:**
  1. **Single source of truth:** Metadata fields (status, created, updated, version) appear in all 3 spec files (requirements, design, tasks). With frontmatter, you'd update 3 files when status changes. With meta.yaml, update one file.
  2. **Machine-readable without markdown parsing:** A script can read `meta.yaml` directly without parsing markdown. YAML frontmatter in 3 files means parsing 3 markdown files.
  3. **Additional fields:** meta.yaml includes `updated`, `author`, and `version` fields that don't currently appear in any spec blockquote headers. Adding them as frontmatter in 3+ files creates redundancy.
  4. **Consistency with spec.json:** Both meta.yaml and spec.json are "sidecar" metadata files alongside the markdown content files. This creates a clean separation: markdown for humans, yaml/json for machines.
- **Arguments against (for frontmatter instead):**
  1. One fewer file per spec directory
  2. Metadata visible when opening any spec file
  3. Common convention in static site generators
- **Net assessment:** For this project's architecture (agent-based with machine consumption), separate meta.yaml is the right call. It reduces duplication and enables efficient programmatic access.

### Q11: Concrete /design flow changes

**Current /design flow** (from `plan-agent.md` lines 89-145):

1. User runs `/design [feature]`
2. Plan-agent spawns 3 parallel `domain-researcher` sub-agents (mode=plan) for requirements, dependencies, and tasks analysis
3. Aggregates summaries (~1500 tokens)
4. Spawns `domain-writer` (mode=plan, Sonnet) with aggregated summary
5. Writer reads templates: `specs/templates/requirements.md` (125 lines), `specs/templates/design.md` (128 lines), `specs/templates/tasks.md` (108 lines)
6. Writer creates: `specs/{feature}/requirements.md`, `specs/{feature}/design.md`, `specs/{feature}/tasks.md`
7. Spawns `quality-validator` (Haiku) to verify EARS compliance, acceptance criteria, and `_Prompt` fields
8. Reports 3 files created

**After unified-templates ships:**

1-4. Same as above (no change to orchestration) 5. Writer reads **trimmed** templates: `requirements.md` (55 lines), `design.md` (70 lines), `tasks.md` (45 lines), **plus** `summary.md` (25 lines), `meta.yaml` (10 lines), `spec.json` (30 lines) 6. Writer creates 6 files instead of 3:

- `specs/{feature}/requirements.md`
- `specs/{feature}/design.md`
- `specs/{feature}/tasks.md`
- `specs/{feature}/summary.md` (NEW)
- `specs/{feature}/meta.yaml` (NEW)
- `specs/{feature}/spec.json` (NEW)

7. Quality-validator verifies same criteria plus: line budgets, required sections, variable syntax
8. Reports 6 files created

**Concrete differences for the user:**

- Templates are **shorter** so writer sub-agent processes faster and uses less context
- Spec output directory contains **3 additional files** (summary.md, meta.yaml, spec.json)
- `/implement` can now read `spec.json` for structured task data instead of parsing `tasks.md` markdown
- `summary.md` provides a quick-reference document for spec review
- `meta.yaml` centralizes metadata that was previously duplicated in blockquote headers across 3 files

**What needs to change in plan-agent.md:** The writer instructions (line 128-130) need updating to reference the 6 output files. The domain-writer template (`domain-writer.md` mode=plan section, lines 111-135) needs updating to list the new templates and output files. The quality-validator needs updated checks for the 3 new files.

### Q12: File audience mapping (automation vs. human)

| #   | File               | Location                             | Primary Audience               | Secondary Audience                   | Notes                                                                                          |
| --- | ------------------ | ------------------------------------ | ------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | command-preview.md | `.claude/skills/preview/templates/`  | **Agent** (renders to human)   | Human (reviews layout)               | Agent reads template, fills variables, displays to user                                        |
| 2   | stage-progress.md  | `.claude/skills/progress/templates/` | **Agent** (renders to human)   | Human (reviews layout)               | Same pattern: agent renders, human sees output                                                 |
| 3   | error-report.md    | `.claude/skills/preview/templates/`  | **Agent** (renders to human)   | Human (reviews layout)               | Same pattern                                                                                   |
| 4   | requirements.md    | `specs/templates/`                   | **Human** (spec author)        | Agent (domain-writer reads template) | Written by agent, read by humans primarily                                                     |
| 5   | design.md          | `specs/templates/`                   | **Human** (spec author)        | Agent (domain-writer reads template) | Same: human is primary consumer of output                                                      |
| 6   | tasks.md           | `specs/templates/`                   | **Both** equally               | -                                    | Human reads for task understanding; agent parses for implementation (`code-agent.md` line 164) |
| 7   | summary.md         | `specs/templates/`                   | **Human** (stakeholder)        | Agent (query-specs script)           | Quick review document; also queryable by scripts                                               |
| 8   | meta.yaml          | `specs/templates/`                   | **Agent** (metadata scripts)   | Human (status checks)                | Primary value is machine-readable metadata                                                     |
| 9   | spec.json          | `specs/templates/`                   | **Agent** (/implement parsing) | Human (debugging)                    | Designed explicitly for machine consumption                                                    |

**Summary:**

- **Primarily for agents:** command-preview.md, stage-progress.md, error-report.md, meta.yaml, spec.json (5 files)
- **Primarily for humans:** requirements.md, design.md, summary.md (3 files)
- **Both equally:** tasks.md (1 file)

### Q13: Phase independence and T008/T009 dependency

**Finding: There IS a weak ordering dependency between T008 (meta.yaml) and T009 (spec.json), though they can technically be developed in parallel.**

Evidence:

- meta.yaml fields (design.md lines 124-131): `spec_id`, `feature`, `status`, `created`, `updated`, `author`, `version`
- spec.json fields (design.md lines 137-149): `name`, `status`, `created`, `files`, `phases`, `tasks`, `linear`
- **Overlapping fields:** `status` and `created` appear in both files. `name`/`feature` are semantically equivalent.
- **The dependency question:** Does spec.json reference meta.yaml's fields, or are they independently specified?
  - The design.md does not explicitly state that spec.json should read from meta.yaml
  - However, having the same fields (`status`, `created`) defined in two different templates creates a consistency risk. If the templates use different default values or formats for these fields, the generated outputs will be inconsistent.
  - meta.yaml includes `version` and `author` which spec.json does not. spec.json includes `files`, `phases`, `tasks`, `linear` which meta.yaml does not. The overlap is partial.
- **Real-world dependency:** When a domain-writer generates both files for a feature, it should use the SAME values for overlapping fields. This is an implementation concern (the writer should read meta.yaml values when populating spec.json) rather than a template authoring concern.
- **Template authoring:** The two templates CAN be created independently since each just contains placeholder variables. The values they hold don't conflict at the template level.
- **Recommendation:** Mark T009 as having a **weak dependency** on T008 (not blocking, but T008 should ideally be done first or simultaneously). Add a note: "When domain-writer generates spec.json, overlapping fields (name/feature, status, created) MUST match meta.yaml values. meta.yaml is the source of truth for shared metadata."

---

## Spec Amendments Recommended

### Amendment 1: Mark `linear` as optional in spec.json (requirements.md)

- **File:** `specs/unified-templates/requirements.md`
- **Change:** REQ-4.3 from "SHALL include Linear identifier fields in spec.json" to "SHALL include Linear identifier fields in spec.json WHERE Linear integration is configured"
- **Rationale:** Linear is not universally configured (Q3)

### Amendment 2: Change variable syntax convention (requirements.md, design.md)

- **File:** `specs/unified-templates/requirements.md` line 49; `specs/unified-templates/design.md` throughout
- **Change:** NFR-1 from `{curly_brace}` to `{{double_brace}}` variable syntax
- **Rationale:** Single curly braces conflict with JSON, TypeScript, and template literals (Q4)

### Amendment 3: Relax line target tolerance (tasks.md)

- **File:** `specs/unified-templates/tasks.md` line 131
- **Change:** From "+/-2 lines tolerance" to "+/-5 lines tolerance"
- **Rationale:** design.md at 70 lines is extremely tight with zero margin (Q5)

### Amendment 4: Add migration scope note (requirements.md)

- **File:** `specs/unified-templates/requirements.md`
- **Change:** Add to Out of Scope: "Migration of existing specs to new template format"
- **Rationale:** Prevents confusion about backward compatibility (Q1)

### Amendment 5: Add checkpoint fallback behavior (design.md)

- **File:** `specs/unified-templates/design.md`
- **Change:** In error-report.md component (section 3), add: "When checkpoint infrastructure is not available, render checkpoint/resume fields as 'N/A - not yet available' rather than leaving raw variable placeholders"
- **Rationale:** Checkpoint infrastructure doesn't exist yet and is out of scope (Q6)

### Amendment 6: Document meta.yaml/spec.json field relationship (design.md)

- **File:** `specs/unified-templates/design.md`
- **Change:** Add a note to the Data Flow section: "meta.yaml is the source of truth for shared metadata fields (status, created, feature/name). spec.json copies these values during generation. domain-writer MUST ensure consistency."
- **Rationale:** Prevents field drift between the two files (Q13)

### Amendment 7: Add weak dependency T009 -> T008 (tasks.md)

- **File:** `specs/unified-templates/tasks.md`
- **Change:** In Task Dependencies section, change from "T007, T008, T009 (parallel, independent)" to "T007, T008, T009 (parallel; T009 weakly depends on T008 for field consistency)"
- **Rationale:** Overlapping fields need consistent templates (Q13)
