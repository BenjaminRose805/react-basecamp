# Design: Design Hierarchy Downstream

> **Status:** Draft
> **Created:** 2026-02-01
> **Spec ID:** design-hierarchy-downstream

## Overview

This design updates 14 downstream files across 6 areas to adopt the nested spec hierarchy introduced in specs 1-2. The core changes: (1) reconcile template field mismatches between `meta.yaml`/`spec.json` templates and actual generated files, (2) update CI workflow validation for recursive discovery and level-aware validation, (3) update skill/agent documentation for nested path patterns, (4) update GitHub templates and command docs for nested path support, (5) rewrite `specs/README.md` for directory-based specs and hierarchy. All changes preserve backward compatibility with existing standalone specs.

---

## Architecture

### Current State

```text
Template Files (specs/templates/):
  meta.yaml:  spec_id, feature, author, version (MISMATCH with actual usage)
  spec.json:  No parent_project/parent_feature fields

CI Workflow (.github/workflows/reusable-spec-validation.yml):
  - Flat discovery: find specs/*/meta.yaml
  - No level detection (PROJECT/FEATURE/STANDALONE)
  - Branch mapping: {prefix}-{feature} -> specs/{feature}/
  - No nested path support

Skills (.claude/skills/):
  - research: glob patterns specs/*/requirements.md (flat only)
  - preview: fixed-width path display (may break on nested)
  - progress: fixed-width path display (may break on nested)

Agents (.claude/agents/):
  - code-agent.md line 161: hardcoded specs/{feature}/
  - ui-agent.md line 167: hardcoded specs/{feature}/

GitHub (.github/):
  - PR template: specs/{feature} placeholder
  - Issue templates: specs/{feature} references

Commands (.claude/commands/):
  - start.md: no nested branch naming docs
  - reconcile.md: no project-qualified path docs

Spec Infrastructure:
  - specs/README.md: outdated single-file format documentation
  - review-config.yaml: no nested support comment
```

### Target State

```text
Template Files (specs/templates/):
  meta.yaml:
    ✓ id (replaces spec_id)
    ✓ status (replaces version)
    ✓ tasks_total, tasks_complete (new)
    ✓ parent_project, parent_feature (optional, for nested)
    ✗ feature, author, version (removed, unused)

  spec.json:
    ✓ parent_project, parent_feature (optional, for nested)
    ✓ _note updated with nested examples

CI Workflow (.github/workflows/reusable-spec-validation.yml):
  - Recursive discovery: find specs -type f -name 'meta.yaml'
  - Level detection: check for project.md/feature.md markers
  - Branch mapping: {prefix}-{project}-{feature} -> specs/{project}/{feature}/
  - Level-aware validation rules:
    - PROJECT: require project.md, requirements.md, meta.yaml
    - FEATURE: require feature.md, requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json
    - STANDALONE: require requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json
  - PR comment: display full nested path (specs/basecamp/auth/)

Skills (.claude/skills/):
  - research: glob patterns specs/**/requirements.md (recursive)
    - Directory diagram shows nested structure
    - Common search patterns section for hierarchy
    - Path resolution note referencing spec-path-resolver.cjs
  - preview: path display width 60 chars, nested examples
  - progress: path display width 60 chars, nested examples

Agents (.claude/agents/):
  - code-agent.md line 161: specs/{resolved_path}/ with note
  - ui-agent.md line 167: specs/{resolved_path}/ with note

GitHub (.github/):
  - PR template: specs/{path} with nested examples
  - Issue templates: specs/{path} with nested examples

Commands (.claude/commands/):
  - start.md:
    - Branch naming section: design-basecamp-auth -> specs/basecamp/auth/
    - Mapping table for nested and standalone formats
  - reconcile.md:
    - Usage examples with project-qualified paths (basecamp/auth)
    - Path resolution note referencing spec-path-resolver.cjs

Spec Infrastructure:
  - specs/README.md: complete rewrite
    - Directory-based spec format (not single-file)
    - Nested hierarchy section (PROJECT/FEATURE levels)
    - Standalone specs section
    - Path resolution section
    - Required files table by level
    - Navigation examples
    - Backward compatibility note
  - review-config.yaml: comment after include_specs: true
```

---

## Component Design

### 1. Template Reconciliation (meta.yaml)

**Current template fields** (not matching actual usage):

```yaml
spec_id: "{{id}}" # Actual files use 'id', not 'spec_id'
feature: "{{name}}" # Redundant with directory name
author: "{{agent}}" # Not used in practice
version: "{{semver}}" # Not used in practice
status: "{{status}}" # EXISTS, but not in template
created: "{{created}}" # EXISTS
updated: "{{updated}}" # EXISTS
```

**Target template fields** (aligned with actual generated files):

```yaml
# Identifiers
id: "{{id}}" # PRIMARY KEY (was spec_id)
parent_project: "{{parent_project}}" # OPTIONAL: For FEATURE level only
parent_feature: "{{parent_feature}}" # OPTIONAL: For nested features (rare)

# Lifecycle
status: "{{status}}" # draft | approved | in-progress | complete
created: "{{created}}" # YYYY-MM-DD
updated: "{{updated}}" # YYYY-MM-DD

# Progress
tasks_total: { { tasks_total } } # Integer count
tasks_complete: { { tasks_complete } } # Integer count
```

**Field mapping:**

| Old Template Field | Target Field     | Reason                           |
| ------------------ | ---------------- | -------------------------------- |
| `spec_id`          | `id`             | Actual files use `id`            |
| `feature`          | (removed)        | Redundant with directory name    |
| `author`           | (removed)        | Not used in practice             |
| `version`          | (removed)        | Not used in practice             |
| (missing)          | `status`         | Add (used in actual files)       |
| (missing)          | `tasks_total`    | Add (used in actual files)       |
| (missing)          | `tasks_complete` | Add (used in actual files)       |
| (missing)          | `parent_project` | Add (for nested hierarchy)       |
| (missing)          | `parent_feature` | Add (for nested hierarchy, rare) |

**Usage by level:**

- PROJECT: `id`, `status`, `created`, `updated`, `tasks_total`, `tasks_complete` (omit parent fields)
- FEATURE: all fields, with `parent_project` set to parent directory name
- STANDALONE: `id`, `status`, `created`, `updated`, `tasks_total`, `tasks_complete` (omit parent fields)

---

### 2. Template Extension (spec.json)

**Target additions:**

```json
{
  "_note": "For nested specs: parent_project='basecamp', name='authentication'. For standalone: omit parent fields.",
  "name": "{{feature}}",
  "parent_project": "{{parent_project}}",
  "parent_feature": "{{parent_feature}}",
  "status": "{{status}}",
  ...
}
```

**Field placement:** After `name`, before `status`.

**Optional behavior:** Omit `parent_project` and `parent_feature` fields entirely for standalone specs (not set to null/empty string).

---

### 3. CI Workflow Recursive Discovery

**Current approach:**

```yaml
- name: Find all specs
  run: |
    find specs/*/meta.yaml > spec-dirs.txt
```

**Target approach:**

```yaml
- name: Find all specs
  run: |
    find specs -type f -name 'meta.yaml' > spec-dirs.txt
```

**Impact:**

- Discovers `specs/feature/meta.yaml` (standalone)
- Discovers `specs/project/feature/meta.yaml` (nested)
- Discovers `specs/project/meta.yaml` (project-level)
- Discovers nested features at any depth

**No change to:** Output format (still line-separated paths)

---

### 4. CI Workflow Level Detection

**Logic flow:**

```bash
for spec_dir in $(cat spec-dirs.txt | xargs dirname); do
  # Extract directory path

  # Detect level
  if [ -f "$spec_dir/project.md" ]; then
    LEVEL="PROJECT"
    required_files="project.md requirements.md meta.yaml"
  elif [ -f "$spec_dir/feature.md" ]; then
    LEVEL="FEATURE"
    required_files="feature.md requirements.md design.md tasks.md meta.yaml summary.md spec.json"
  else
    LEVEL="STANDALONE"
    required_files="requirements.md design.md tasks.md meta.yaml summary.md spec.json"
  fi

  # Validate required files exist
  for file in $required_files; do
    if [ ! -f "$spec_dir/$file" ]; then
      echo "ERROR: $LEVEL spec $spec_dir missing required file: $file"
      exit 1
    fi
  done
done
```

**Required files by level:**

| Level      | Required Files                                                                                   | Optional Files            |
| ---------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| PROJECT    | `project.md`, `requirements.md`, `meta.yaml`                                                     | `summary.md`, `spec.json` |
| FEATURE    | `feature.md`, `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json` | -                         |
| STANDALONE | `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`               | -                         |

---

### 5. CI Workflow Branch Mapping

**Current mapping:**

```text
design-my-feature -> specs/my-feature/
```

**Target mapping (with fallback):**

```bash
# Extract branch name components
PREFIX=$(echo "$BRANCH" | cut -d- -f1)     # "design"
PROJECT=$(echo "$BRANCH" | cut -d- -f2)    # "basecamp" or feature name
FEATURE=$(echo "$BRANCH" | cut -d- -f3-)   # "auth" or empty

# Try nested path first
if [ -n "$FEATURE" ] && [ -d "specs/$PROJECT/$FEATURE" ]; then
  SPEC_PATH="specs/$PROJECT/$FEATURE/"
# Fall back to flat path
elif [ -d "specs/$PROJECT" ]; then
  SPEC_PATH="specs/$PROJECT/"
else
  echo "ERROR: Spec directory not found for branch $BRANCH"
  echo "Tried: specs/$PROJECT/$FEATURE/ and specs/$PROJECT/"
  exit 1
fi
```

**Examples:**

| Branch Name            | Tested Paths                              | Resolved Path          |
| ---------------------- | ----------------------------------------- | ---------------------- |
| `design-basecamp-auth` | `specs/basecamp/auth/`, `specs/basecamp/` | `specs/basecamp/auth/` |
| `design-my-feature`    | `specs/my/feature/`, `specs/my/`          | `specs/my/`            |
| `design-foo`           | `specs/foo/`                              | `specs/foo/`           |

**Precedence:** Prefer nested path if both exist.

---

### 6. Research Skill Updates

**Directory structure diagram:**

```text
specs/
├── templates/               # Spec templates
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── summary.md
│   ├── spec.json
│   └── meta.yaml
├── project/                 # PROJECT LEVEL
│   ├── project.md           # Project overview
│   ├── requirements.md
│   ├── meta.yaml
│   ├── feature-a/           # FEATURE LEVEL (nested)
│   │   ├── feature.md       # Feature overview
│   │   ├── requirements.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── summary.md
│   │   ├── spec.json
│   │   └── meta.yaml
│   └── feature-b/
│       └── ...
└── standalone-feature/      # STANDALONE LEVEL
    ├── requirements.md
    ├── design.md
    ├── tasks.md
    ├── summary.md
    ├── spec.json
    └── meta.yaml
```

**Glob pattern updates:**

| Old Pattern (Flat)        | New Pattern (Recursive)    |
| ------------------------- | -------------------------- |
| `specs/*/requirements.md` | `specs/**/requirements.md` |
| `specs/*/design.md`       | `specs/**/design.md`       |
| `specs/*/tasks.md`        | `specs/**/tasks.md`        |
| `specs/*/meta.yaml`       | `specs/**/meta.yaml`       |

**Common search patterns (new section):**

```text
## Common Search Patterns

Find all features in a project:
  specs/basecamp/*/requirements.md

Find project requirements:
  specs/*/project.md

Find all specs (nested and standalone):
  specs/**/requirements.md

Find FEATURE-level specs only:
  specs/*/*/feature.md
```

**Path resolution note:**

```text
## Path Resolution

Spec paths are resolved by the centralized `spec-path-resolver.cjs`
(in `.claude/scripts/lib/`). The resolver handles both:
- Nested paths: {project}/{feature} -> specs/project/feature/
- Standalone paths: {feature} -> specs/feature/

All skills and commands use this resolver for consistent path handling.
```

---

### 7. Preview/Progress Skill Updates

**Path display width:**

- Current: Assumes paths like `specs/my-feature/` (~20 chars)
- Target: Support nested paths like `specs/basecamp/authentication/` (~35 chars)
- Max width: 60 characters

**Template variable:** `{{spec_path}}` (no hardcoded assumptions)

**Box-drawing preservation:**

```text
┌─────────────────────────────────────────────────────────────┐
│ Spec: specs/basecamp/authentication/                        │
└─────────────────────────────────────────────────────────────┘
```

**Example path updates:**

- Preview template: Replace `specs/{feature}/` with `specs/{project}/{feature}/` in examples
- Progress template: Replace `specs/{feature}/` with `specs/{project}/{feature}/` in examples
- Include one nested and one standalone example in each template

---

### 8. Agent Documentation Path Notes

**code-agent.md line 161:**

```text
Current: specs/{feature}/
Target:  specs/{resolved_path}/
Note:    Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})
```

**ui-agent.md line 167:**

```text
Current: specs/{feature}/
Target:  specs/{resolved_path}/
Note:    Path resolved by spec-path-resolver.cjs (may be {project}/{feature} or {feature})
```

**No logic changes:** Documentation updates only.

---

### 9. GitHub Template Updates

**PR template (.github/pull_request_template.md):**

```markdown
Current: Spec path: specs/{feature}
Target: Spec path: specs/{path}

Explanatory text:
Spec path (e.g., specs/basecamp/auth for nested, or specs/my-feature for standalone)
```

**Issue templates (.github/ISSUE_TEMPLATE/\*.md):**

- Scan all issue templates for `specs/{feature}` placeholders
- Replace with `specs/{path}` and add nested/standalone examples

---

### 10. Command Documentation Updates

**start.md additions:**

```markdown
## Branch Naming for Nested Specs

For nested specs like specs/basecamp/auth/, create branch:
design-basecamp-auth

CI workflow maps branch name to nested directory automatically.

### Branch Name Mapping

| Branch Name          | Resolved Spec Path   |
| -------------------- | -------------------- |
| design-basecamp-auth | specs/basecamp/auth/ |
| design-my-feature    | specs/my-feature/    |

Branch names use dash-separated format; CI workflow resolves to directory structure.
```

**reconcile.md additions:**

```markdown
## Usage

/reconcile basecamp/auth # Nested feature
/reconcile my-feature # Standalone feature

Path can be a standalone feature (e.g., 'my-feature') or a nested feature
(e.g., 'basecamp/auth'). The centralized path resolver handles both formats.

## Path Resolution

Path resolution handled by spec-path-resolver.cjs (supports nested and standalone).
```

---

### 11. specs/README.md Rewrite

**Current:** Documents outdated single-file spec format.

**Target:** Complete rewrite with sections:

1. **Overview:** Directory-based specs, optional nested hierarchy
2. **Spec Directory Structure:** Required files per level
3. **Nested Hierarchy:** PROJECT and FEATURE levels explained
4. **Standalone Specs:** Flat spec format
5. **Path Resolution:** Reference to spec-path-resolver.cjs
6. **Required Files Table:** By level (PROJECT/FEATURE/STANDALONE)
7. **Finding Specs:** Navigation examples
8. **Backward Compatibility:** Existing standalone specs remain valid

**Required files table:**

| Level      | Required Files                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------ |
| PROJECT    | `project.md`, `requirements.md`, `meta.yaml`                                                     |
| FEATURE    | `feature.md`, `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json` |
| STANDALONE | `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`               |

**Navigation examples:**

```bash
# Find all features in a project
ls specs/basecamp/

# View project overview
cat specs/basecamp/project.md

# Find all specs
find specs -name 'meta.yaml'
```

**Backward compatibility note:**

```text
## Backward Compatibility

Existing standalone specs (e.g., specs/my-feature/) remain valid and fully supported.
New specs can choose nested (specs/project/feature/) or standalone format.
All tooling supports both formats via spec-path-resolver.cjs.
```

---

### 12. review-config.yaml Comment

**Current:**

```yaml
include_specs: true
```

**Target:**

```yaml
include_specs: true # Supports nested specs (specs/project/feature/) and standalone (specs/feature/)
```

---

## Files Modified

| File                                                  | Action | Description                                                               |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| `specs/templates/meta.yaml`                           | Modify | Reconcile fields: replace spec_id→id, remove unused, add hierarchy fields |
| `specs/templates/spec.json`                           | Modify | Add parent_project/parent_feature, update \_note with nested examples     |
| `.github/workflows/reusable-spec-validation.yml`      | Modify | Recursive find, level detection, branch mapping, level-aware validation   |
| `.claude/skills/research/SKILL.md`                    | Modify | Update directory diagram, glob patterns, add hierarchy search examples    |
| `.claude/skills/preview/templates/command-preview.md` | Modify | Increase path display width to 60 chars, add nested path examples         |
| `.claude/skills/progress/templates/stage-progress.md` | Modify | Increase path display width to 60 chars, add nested path examples         |
| `.claude/agents/code-agent.md`                        | Modify | Line 161: update path reference to specs/{resolved_path}/ with note       |
| `.claude/agents/ui-agent.md`                          | Modify | Line 167: update path reference to specs/{resolved_path}/ with note       |
| `.github/pull_request_template.md`                    | Modify | Update spec path placeholder from {feature} to {path}, add examples       |
| `.github/ISSUE_TEMPLATE/*.md`                         | Modify | Update spec path references to use {path}, add nested examples            |
| `.claude/commands/start.md`                           | Modify | Add branch naming section for nested specs, mapping table                 |
| `.claude/commands/reconcile.md`                       | Modify | Add project-qualified path examples, path resolution note                 |
| `specs/README.md`                                     | Modify | Complete rewrite for directory-based specs and nested hierarchy           |
| `.claude/config/review-config.yaml`                   | Modify | Add inline comment about nested support                                   |

---

## Data Flow

```text
Template Reconciliation:
  specs/templates/meta.yaml    → Aligned with actual usage
  specs/templates/spec.json    → Add parent_project/parent_feature

CI Workflow Validation:
  Branch: design-basecamp-auth
    │
    ├── Recursive find: specs -type f -name 'meta.yaml'
    │     └── Discovers: specs/basecamp/auth/meta.yaml
    │
    ├── Level detection: check for project.md/feature.md
    │     └── Detects: FEATURE level (feature.md exists)
    │
    ├── Branch mapping: design-basecamp-auth → specs/basecamp/auth/
    │     └── Tests: specs/basecamp/auth/, specs/basecamp/, error
    │
    ├── Level-aware validation: require feature.md, requirements.md, design.md, tasks.md, meta.yaml, summary.md, spec.json
    │     └── Validates all files exist
    │
    └── PR comment: "Spec validated: specs/basecamp/auth/"

Research Skill:
  User invokes skill
    │
    ├── Glob pattern: specs/**/requirements.md
    │     └── Discovers: specs/basecamp/auth/requirements.md, specs/my-feature/requirements.md
    │
    └── Path resolution: spec-path-resolver.cjs handles nested and standalone

Preview/Progress Skills:
  Display spec path
    │
    ├── Variable: {{spec_path}} = specs/basecamp/auth/
    │
    └── Box-drawing: 60-char width preserves alignment

Agent Documentation:
  code-agent.md, ui-agent.md
    │
    └── Path reference: specs/{resolved_path}/ (resolved by spec-path-resolver.cjs)

GitHub Templates:
  PR/Issue templates
    │
    └── Placeholder: specs/{path} (e.g., specs/basecamp/auth or specs/my-feature)

Commands:
  /start → branch: design-basecamp-auth → CI maps to specs/basecamp/auth/
  /reconcile basecamp/auth → spec-path-resolver.cjs → specs/basecamp/auth/

Spec Infrastructure:
  specs/README.md → documents directory-based specs, nested hierarchy, required files
  review-config.yaml → comment: nested support
```

---

## Error Handling

### Missing Spec Directory on Branch Mapping

```text
Error: Spec directory not found for branch design-basecamp-auth
Tried: specs/basecamp/auth/ and specs/basecamp/
```

**Response:** Exit CI validation with error code 1. User must create spec directory or fix branch name.

---

### Missing Required File for Level

```text
Error: FEATURE spec specs/basecamp/auth/ missing required file: feature.md
```

**Response:** Exit CI validation with error code 1. User must create missing file.

---

### Invalid Level Detection

```text
Warning: Spec specs/basecamp/auth/ has both project.md and feature.md
Treating as FEATURE level (feature.md takes precedence)
```

**Response:** Log warning, continue validation with FEATURE level rules.

---

### Path Too Long for Display

```text
Spec: specs/very-long-project-name/very-long-feature-name-that-exceeds-60-chars/
```

**Response:** Truncate with ellipsis: `Spec: specs/very-long-project-name/very-long-feature-name-t...`

---

## Testing Strategy

| Test Type   | Test Case                                                  | Verification                                                      |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Unit        | meta.yaml template field reconciliation                    | Template matches actual generated file fields                     |
| Unit        | spec.json parent fields added                              | Template includes parent_project/parent_feature                   |
| Integration | CI recursive find discovers nested specs                   | Finds specs/project/feature/meta.yaml                             |
| Integration | CI level detection identifies PROJECT/FEATURE/STANDALONE   | Correct required files validated per level                        |
| Integration | CI branch mapping resolves nested paths                    | design-basecamp-auth → specs/basecamp/auth/                       |
| Integration | Research skill glob patterns find nested specs             | specs/\*\*/requirements.md finds all specs                        |
| Integration | Preview/progress templates handle 60-char paths            | Box-drawing preserves alignment                                   |
| Integration | Agent docs reference spec-path-resolver.cjs                | Path notes added to code-agent.md, ui-agent.md                    |
| Integration | GitHub templates use {path} placeholder                    | PR/issue templates show nested examples                           |
| Integration | Command docs show nested path examples                     | start.md, reconcile.md updated                                    |
| Integration | specs/README.md documents directory-based specs            | Required files table, navigation examples, backward compatibility |
| E2E         | Full workflow: create nested spec → CI validates → PR pass | All files validated, PR comment shows full nested path            |

---
