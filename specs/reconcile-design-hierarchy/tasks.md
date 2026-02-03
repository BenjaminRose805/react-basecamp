# Tasks: Reconcile Design Hierarchy

> **Status:** Draft
> **Created:** 2026-02-02
> **Spec ID:** reconcile-design-hierarchy

## Progress

**Total:** 0/11 tasks complete

**Critical Path:** T001 -> T002 -> T003 -> T004

**Files:** 11 modified files (3 CRITICAL, 5 MAJOR, 4 MINOR updates)

---

## Phase 1: CRITICAL Fixes

### T001: Fix early-exit-vs-ambiguity contradiction [C1]

Replace "early exit on first match" with "exhaustive search across all stages to detect ambiguity" in 3 files to align with REQ-1.3's requirement for ambiguity detection.

**Files:**

- `specs/spec-path-resolution/requirements.md`
- `specs/spec-path-resolution/design.md`
- `specs/spec-path-resolution/tasks.md`

**Changes:**

**In specs/spec-path-resolution/requirements.md:**

- Line 269 (NFR-2): Replace "Early exit on first match for performance" with "Exhaustive search across all 5 stages to detect ambiguity (REQ-1.3). Performance optimized by caching and limiting search scope to specs/ directory tree."

**In specs/spec-path-resolution/design.md:**

- Line 186: Replace "Early exit on first match" with "Exhaustive search across all stages" in the algorithm description
- Update the algorithmic flow to reflect: search all 5 stages, collect all matches, detect ambiguity if count > 1, return single match or error

**In specs/spec-path-resolution/tasks.md:**

- Line 80 (T003 \_Prompt): Replace "Early exit on first match (first match wins, then check for duplicates at end)" with "Exhaustive search across all 5 stages. Collect all matches. Detect ambiguity if count > 1. Return single match or report ambiguity error with all matches."

**Acceptance Criteria:**

- [ ] All 3 files consistently describe exhaustive search behavior
- [ ] NFR-2 accurately reflects performance strategy (exhaustive + caching)
- [ ] T003 \_Prompt describes correct implementation sequence
- [ ] No references to "early exit on first match" remain in any of the 3 files
- [ ] REQ-1.3 ambiguity detection is explicitly mentioned as the rationale

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix early-exit-vs-ambiguity contradiction in spec-path-resolution spec. You must update 3 files: (1) specs/spec-path-resolution/requirements.md line 269 (NFR-2): replace "Early exit on first match for performance" with "Exhaustive search across all 5 stages to detect ambiguity (REQ-1.3). Performance optimized by caching and limiting search scope to specs/ directory tree.", (2) specs/spec-path-resolution/design.md line 186: replace "Early exit on first match" with "Exhaustive search across all stages. Algorithm: search all 5 stages, collect all matches, detect ambiguity if count > 1, return single match or error.", (3) specs/spec-path-resolution/tasks.md line 80 (T003 \_Prompt): replace "Early exit on first match (first match wins, then check for duplicates at end)" with "Exhaustive search across all 5 stages. Collect all matches. Detect ambiguity if count > 1. Return single match or report ambiguity error with all matches." | **Restrictions:** Do not change any other requirement numbers, design sections, or task IDs. Preserve exact line structure except for the specified changes. Maintain markdown formatting. | **Success:** All 3 files consistently describe exhaustive search. REQ-1.3 is cited as the rationale. No "early exit" language remains.

---

### T002: Remove "templates" from RESERVED_NAMES [C2]

Remove "templates" from RESERVED_NAMES in 3 files because "templates" is an existing spec directory that must resolve correctly per REQ-6.1.

**Files:**

- `specs/spec-path-resolution/requirements.md`
- `specs/spec-path-resolution/design.md`
- `specs/spec-path-resolution/tasks.md`

**Changes:**

**In specs/spec-path-resolution/requirements.md:**

- Line 126: Change RESERVED_NAMES from `["node_modules", "dist", "build", "templates"]` to `["node_modules", "dist", "build"]`
- Add a note explaining: "The `templates` directory contains actual spec templates and must be resolvable via path resolution. Only build artifacts and dependencies are reserved."

**In specs/spec-path-resolution/design.md:**

- Line 90: Change RESERVED_NAMES from `["node_modules", "dist", "build", "templates"]` to `["node_modules", "dist", "build"]`

**In specs/spec-path-resolution/tasks.md:**

- Line 35 (T001): Change RESERVED_NAMES from `["node_modules", "dist", "build", "templates"]` to `["node_modules", "dist", "build"]`

**Acceptance Criteria:**

- [ ] All 3 files list RESERVED_NAMES as `["node_modules", "dist", "build"]` (3 items only)
- [ ] requirements.md includes rationale note explaining why "templates" is not reserved
- [ ] "templates" directory can be resolved via path resolution (no conflict with REQ-6.1)
- [ ] No other RESERVED_NAMES entries are added or removed

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Remove "templates" from RESERVED_NAMES in spec-path-resolution spec. Update 3 files: (1) specs/spec-path-resolution/requirements.md line 126: change RESERVED_NAMES array from `["node_modules", "dist", "build", "templates"]` to `["node_modules", "dist", "build"]`. Add note: "The `templates` directory contains actual spec templates and must be resolvable via path resolution. Only build artifacts and dependencies are reserved.", (2) specs/spec-path-resolution/design.md line 90: change RESERVED_NAMES to `["node_modules", "dist", "build"]`, (3) specs/spec-path-resolution/tasks.md line 35: change RESERVED_NAMES to `["node_modules", "dist", "build"]`. | **Restrictions:** Do not change any other reserved names. Only remove "templates". Preserve array formatting. Keep all other requirements unchanged. | **Success:** RESERVED_NAMES contains exactly 3 items: node_modules, dist, build. requirements.md explains why templates is not reserved.

---

## Phase 2: MAJOR Fixes

### T003: Delete leaked tool instruction from research-notes.md [M1]

Remove the leaked internal tool instruction that accidentally made it into the final research notes.

**File:** `specs/reconcile-design-hierarchy/research-notes.md`

**Changes:**

- Line 352: Delete entire line: "END OF FILE. Write this content to ... using the Write tool."

**Acceptance Criteria:**

- [ ] Line 352 is completely removed
- [ ] research-notes.md ends cleanly with the last substantive finding
- [ ] No other lines are modified

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Delete line 352 from specs/reconcile-design-hierarchy/research-notes.md. The line reads "END OF FILE. Write this content to ... using the Write tool." and is a leaked internal tool instruction that should not be in the final document. Remove the entire line. | **Restrictions:** Do not modify any other lines. This is a single-line deletion. | **Success:** Line 352 is removed. Document ends cleanly.

---

### T004: Fix contradictory prompting-vs-default language in design-hierarchy.md [M2]

Reword the default behavior description to clarify that --spec becomes the default after a level is selected, without breaking changes to existing usage.

**File:** `specs/reconcile-design-hierarchy/design-hierarchy.md`

**Changes:**

- Line 36: Replace "However, --spec is the default behavior" with "However, --spec preserves the current /design behavior. No breaking changes to existing usage once a level is selected."

**Acceptance Criteria:**

- [ ] Line 36 no longer uses the word "default" in a way that conflicts with line 34
- [ ] Clarifies that --spec maintains backward compatibility
- [ ] Line 34 (flag is required, system prompts) remains unchanged

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix contradiction in specs/reconcile-design-hierarchy/design-hierarchy.md. Line 34 says "Flag is required... system prompts them to choose". Line 36 says "However, --spec is the default behavior" which is contradictory. Reword line 36 to: "However, --spec preserves the current /design behavior. No breaking changes to existing usage once a level is selected." | **Restrictions:** Do not change line 34. Only update line 36. Keep the meaning: --spec maintains backward compatibility. | **Success:** Line 36 reads: "However, --spec preserves the current /design behavior. No breaking changes to existing usage once a level is selected."

---

### T005: Rename critical path to suggested order in downstream/tasks.md [M3]

Rename "Critical Path" to "Suggested Implementation Order" and add actual dependency chains to clarify that the listed tasks are independent, not a true critical path.

**File:** `specs/downstream/tasks.md`

**Changes:**

- Line 11: Rename "Critical Path: T001 -> T004 -> T008 -> T013 -> T017" to "Suggested Implementation Order: T001, T004, T008, T013, T017"
- Line 406: Rename the "Critical Path" section header to "Suggested Implementation Order"
- Add actual dependency chains below the suggested order:
  - T001 -> T003 (template dependency)
  - T004 -> T005 (validation depends on linting)
  - T004 -> T006 -> T007 (CI/CD chain)

**Acceptance Criteria:**

- [ ] Line 11 header renamed to "Suggested Implementation Order"
- [ ] Line 11 no longer shows arrow syntax (->), uses commas instead
- [ ] Line 406 section header renamed to "Suggested Implementation Order"
- [ ] Actual dependency chains are listed separately with arrows showing true dependencies
- [ ] Dependency chains: T001 -> T003, T004 -> T005, T004 -> T006 -> T007

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix critical path mislabeling in specs/downstream/tasks.md. Lines 11 and 406 say "Critical Path: T001 -> T004 -> T008 -> T013 -> T017" but these tasks are independent with no dependencies. Rename to "Suggested Implementation Order" and remove arrows: "Suggested Implementation Order: T001, T004, T008, T013, T017". Add a new "Task Dependencies" section showing actual chains: "T001 -> T003 (template), T004 -> T005 (validation), T004 -> T006 -> T007 (CI/CD)". | **Restrictions:** Do not change task IDs or task content. Only update the header names and add dependency documentation. | **Success:** "Critical Path" is renamed to "Suggested Implementation Order" at lines 11 and 406. Actual dependencies are documented separately.

---

### T006: Complete EARS statement in downstream/requirements.md [M4]

Update the EARS statement to include all 6 required files for STANDALONE mode, matching the acceptance criteria.

**File:** `specs/downstream/requirements.md`

**Changes:**

- Line 66: Replace "WHEN the user runs /design {feature} with --level=standalone, the system SHALL create a spec directory containing 3 files: requirements.md, design.md, tasks.md" with "WHEN the user runs /design {feature} with --level=standalone, the system SHALL create a spec directory containing 6 files: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml"

**Acceptance Criteria:**

- [ ] EARS statement at line 66 lists all 6 files
- [ ] Acceptance criteria at line 72 remains unchanged (already lists 6 files)
- [ ] EARS and acceptance criteria are now aligned

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix incomplete EARS statement in specs/downstream/requirements.md line 66. EARS currently says STANDALONE requires "3 files: requirements.md, design.md, tasks.md". Acceptance criteria at line 72 correctly lists 6 files (adds meta.yaml, summary.md, spec.json). Update EARS to: "WHEN the user runs /design {feature} with --level=standalone, the system SHALL create a spec directory containing 6 files: requirements.md, design.md, tasks.md, summary.md, spec.json, meta.yaml". | **Restrictions:** Do not change acceptance criteria. Only update the EARS statement to match. Preserve EARS syntax. | **Success:** EARS statement lists all 6 required files. EARS and acceptance criteria match.

---

### T007: Fix template variable syntax in downstream/design.md [M5]

Remove spaces between braces in template variable syntax to match the correct Handlebars/Mustache format.

**File:** `specs/downstream/design.md`

**Changes:**

- Line 143: Replace `{ { tasks_total } }` with `{{tasks_total}}`
- Line 144: Replace `{ { tasks_complete } }` with `{{tasks_complete}}`

**Acceptance Criteria:**

- [ ] Line 143 uses `{{tasks_total}}` (no spaces)
- [ ] Line 144 uses `{{tasks_complete}}` (no spaces)
- [ ] All other template variables in the file use consistent `{{variable}}` syntax
- [ ] No other lines are modified

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix template variable syntax errors in specs/downstream/design.md. Lines 143-144 have `{ { tasks_total } }` and `{ { tasks_complete } }` with spaces between braces. Correct syntax is `{{tasks_total}}` and `{{tasks_complete}}` (no spaces). Update both lines. | **Restrictions:** Only fix the syntax. Do not change variable names. Do not modify any other lines. | **Success:** Lines 143-144 use `{{tasks_total}}` and `{{tasks_complete}}` with no spaces.

---

## Phase 3: MINOR Fixes

### T008: Add rationale for split normalize/reject strategy [N1]

Add a rationale note explaining why some normalization violations are auto-fixed while others are rejected as errors.

**File:** `specs/spec-path-resolution/requirements.md`

**Changes:**

- After line 107 (end of REQ-2.2), add a new note section:

```markdown
**Rationale:** Fixable formatting issues (multiple hyphens, leading/trailing hyphens) are normalized because the user's intent is clear and auto-correction is unambiguous. Character class violations (uppercase, underscores, spaces) are rejected because automatic conversion could cause unexpected name changes (e.g., `MyFeature` -> `myfeature` loses semantic casing). Explicit errors guide users to provide the intended kebab-case name directly.
```

**Acceptance Criteria:**

- [ ] Rationale note added after REQ-2.2
- [ ] Explains why some violations auto-normalize (hyphens) and others reject (character class)
- [ ] References the risk of unexpected name changes for rejected cases
- [ ] Formatted as a **Rationale:** note block

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add a rationale note to specs/spec-path-resolution/requirements.md after line 107 (end of REQ-2.2). Insert: "**Rationale:** Fixable formatting issues (multiple hyphens, leading/trailing hyphens) are normalized because the user's intent is clear and auto-correction is unambiguous. Character class violations (uppercase, underscores, spaces) are rejected because automatic conversion could cause unexpected name changes (e.g., `MyFeature` -> `myfeature` loses semantic casing). Explicit errors guide users to provide the intended kebab-case name directly." | **Restrictions:** Insert after REQ-2.2. Do not modify REQ-2.1 or REQ-2.2 text. This is additive context only. | **Success:** Rationale note explains split strategy. Positioned after REQ-2.2.

---

### T009: Split conditional acceptance criteria in downstream/requirements.md [N2]

Clarify the conditional update logic for the PR template by splitting it into explicit IF-THEN branches.

**File:** `specs/downstream/requirements.md`

**Changes:**

- Line 194: Replace "updated (if it contains a spec path field)" with explicit conditional:
  - "IF .github/pull_request_template.md contains a spec path field (e.g., `Spec: specs/{{feature}}/`), THEN update the field to reference the new spec path."
  - "IF no spec path field exists, skip with a logged note: 'PR template has no spec path field. Skipping update.'"

**Acceptance Criteria:**

- [ ] Line 194 replaced with IF-THEN conditional structure
- [ ] Both branches (update and skip) are explicitly documented
- [ ] Skip branch includes logged note message
- [ ] Clear that absence of field is not an error

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix ambiguous conditional in specs/downstream/requirements.md line 194. Currently says "updated (if it contains a spec path field)" which is unclear. Replace with explicit IF-THEN: "IF .github/pull_request_template.md contains a spec path field (e.g., `Spec: specs/{{feature}}/`), THEN update the field to reference the new spec path. IF no spec path field exists, skip with a logged note: 'PR template has no spec path field. Skipping update.'" | **Restrictions:** Only change line 194. Preserve the rest of the requirements. Make the conditional explicit. | **Success:** Line 194 has clear IF-THEN branches for both update and skip cases.

---

### T010: Define or remove "nested features" in downstream/requirements.md [N3]

Change the undefined "parent_feature" field description to indicate it's reserved for future use, since nested features (FEATURE > FEATURE) are not currently defined in the hierarchy.

**File:** `specs/downstream/requirements.md`

**Changes:**

- Line 288: Replace "parent_feature: ID of parent feature (for nested features only, rare)" with "parent_feature: Reserved for future nested-feature support. Not currently used."

**Acceptance Criteria:**

- [ ] Line 288 clarifies parent_feature is not currently used
- [ ] Indicates it's reserved for future nested-feature functionality
- [ ] Removes reference to "nested features" as if they currently exist
- [ ] Clear that this field should be null/omitted in current implementation

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Fix undefined "nested features" reference in specs/downstream/requirements.md line 288. Currently says "parent_feature: ID of parent feature (for nested features only, rare)" but nested features (FEATURE > FEATURE) are never defined in the hierarchy spec. Replace with: "parent_feature: Reserved for future nested-feature support. Not currently used." | **Restrictions:** Only change line 288. Do not add nested feature definitions elsewhere. This field should remain in the schema but marked as unused. | **Success:** Line 288 indicates parent_feature is reserved for future use, not currently active.

---

### T011: Add implementation sequencing note in spec-path-resolution/requirements.md [N4]

Add a note documenting that REQ-3 changes should be sequenced after design-incremental-execution lands, since both specs modify implement.md.

**File:** `specs/spec-path-resolution/requirements.md`

**Changes:**

- After line 315 (end of REQ-3 section), add a new note section:

```markdown
**Implementation Note:** REQ-3 changes to `.claude/commands/implement.md` should be sequenced after the `design-incremental-execution` spec lands, as both specs modify the same file. Coordinate with `design-incremental-execution` tasks T020-T021 to avoid merge conflicts. Suggested order: implement design-incremental-execution first, then apply REQ-3 changes.
```

**Acceptance Criteria:**

- [ ] Implementation note added after REQ-3 (line 315)
- [ ] References design-incremental-execution spec by name
- [ ] References specific tasks T020-T021
- [ ] Suggests implementation order to avoid conflicts
- [ ] Formatted as an **Implementation Note:** block

**\_Prompt:**
**Role:** Documentation Writer | **Task:** Add implementation sequencing note to specs/spec-path-resolution/requirements.md after line 315 (end of REQ-3). Insert: "**Implementation Note:** REQ-3 changes to `.claude/commands/implement.md` should be sequenced after the `design-incremental-execution` spec lands, as both specs modify the same file. Coordinate with `design-incremental-execution` tasks T020-T021 to avoid merge conflicts. Suggested order: implement design-incremental-execution first, then apply REQ-3 changes." | **Restrictions:** Insert after REQ-3. Do not modify REQ-3 text. This is additive sequencing guidance only. | **Success:** Implementation note documents coordination requirement with design-incremental-execution. Clear sequencing suggestion provided.

---

## Task Dependencies

```text
Phase 1 (CRITICAL):
  T001 (early-exit fix)        ─── independent
  T002 (RESERVED_NAMES fix)    ─── independent

Phase 2 (MAJOR):
  T003 (delete leaked line)    ─── independent
  T004 (prompting vs default)  ─── independent
  T005 (critical path rename)  ─── independent
  T006 (EARS completion)       ─── independent
  T007 (template syntax)       ─── independent

Phase 3 (MINOR):
  T008 (normalize rationale)   ─── depends on ──→ T001 (context)
  T009 (conditional clarity)   ─── independent
  T010 (nested features)       ─── independent
  T011 (sequencing note)       ─── independent
```

**Critical Path:** T001 -> T002 (CRITICAL fixes block spec approval)

**Suggested Implementation Order:** T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] Early-exit contradiction resolved in 3 spec-path-resolution files (T001)
2. [ ] "templates" removed from RESERVED_NAMES in 3 spec-path-resolution files (T002)
3. [ ] Leaked tool instruction deleted from research-notes.md (T003)
4. [ ] Prompting vs default contradiction resolved in design-hierarchy.md (T004)
5. [ ] Critical path renamed to suggested order in downstream/tasks.md (T005)
6. [ ] EARS statement includes all 6 files in downstream/requirements.md (T006)
7. [ ] Template variable syntax corrected in downstream/design.md (T007)
8. [ ] Rationale for normalize/reject strategy added to spec-path-resolution/requirements.md (T008)
9. [ ] Conditional acceptance criteria split in downstream/requirements.md (T009)
10. [ ] Nested features reference clarified in downstream/requirements.md (T010)
11. [ ] Implementation sequencing note added to spec-path-resolution/requirements.md (T011)

---
