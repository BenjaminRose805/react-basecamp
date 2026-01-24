# /slice - Feature Slicing

Break down large features into vertical slices for incremental delivery.

## Usage

```
/slice [feature]              # Full flow: analyze → plan → create specs
/slice analyze [feature]      # Analyze only: identify capabilities and suggest slices
/slice plan [feature]         # Plan only: define slice boundaries (after analyze)
/slice create [feature]       # Create only: generate specs for approved slices
```

## Input Sources

The slice command can work from multiple sources:

### 1. Design Docs (structured)

```bash
/slice prompt-manager
# Reads from ~/basecamp/docs/specs/prompt-manager.md
```

### 2. Custom Document Path

```bash
/slice prompt-manager --from ~/notes/prompt-ideas.md
/slice prompt-manager --from ./rough-notes.md
```

### 3. Inline Description (conversation)

```bash
/slice prompt-manager
# Then describe what you want:
# "I want users to create prompts with variables, organize in folders..."
```

### 4. Brain Dump First

```bash
# Just start talking - Claude will capture and structure
"I'm thinking about a prompt manager. Users should be able to..."
[brain dump your thoughts]

# Then when ready:
/slice prompt-manager --from-conversation
# Uses the conversation above as input
```

**The analyzer will work with whatever you give it** - structured docs, rough notes, or verbal description.

## Examples

```bash
# Full flow (recommended)
/slice prompt-manager
/slice agent-builder
/slice workflow-designer

# Individual phases
/slice analyze prompt-manager   # See capabilities and suggested slices
/slice plan prompt-manager      # Refine slice boundaries
/slice create prompt-manager    # Create specs for each slice
```

## When to Use

Use `/slice` when:

- Feature has 10+ requirements or capabilities
- Feature would result in 15+ tasks
- Feature spans multiple user workflows
- You want to ship incrementally

Use `/distill` or `/spec` directly when:

- Feature is already small (5-10 tasks)
- Feature is a single, focused capability
- No natural slice boundaries exist

## Workflow

### Phase 1: Analyze (slice-analyzer)

Reads design documentation and identifies:

- All user capabilities (what users can DO)
- Natural groupings by dependency
- Core vs. extension capabilities
- Suggested slice boundaries

**Outputs:** Capability list with suggested slices

### Phase 2: Plan (slice-planner)

Refines slice boundaries:

- Names each slice (kebab-case)
- Defines scope (in/out)
- Identifies dependencies between slices
- Estimates task count per slice (target: 5-10)

**Outputs:** Slice plan for approval

### Phase 3: Create (slice-creator)

For each approved slice:

- Calls `/distill` or `/spec` to create spec
- Creates specs in dependency order
- Links slices via dependencies in requirements.md

**Outputs:** Specs created in `.spec-workflow/specs/`

## Agents

| Phase   | Agent          | Purpose                              |
| ------- | -------------- | ------------------------------------ |
| analyze | slice-analyzer | Read docs, identify capabilities     |
| plan    | slice-planner  | Define boundaries, dependencies      |
| create  | slice-creator  | Create specs using distill/spec flow |

## Slice Criteria

Good slices are:

- **Vertical** - Include DB, API, and UI (not just one layer)
- **Independent** - Can be tested and shipped alone
- **Valuable** - Deliver user value when complete
- **Small** - 5-10 tasks, completable in 1-2 sessions
- **Ordered** - Clear dependency chain

## Example Output

```markdown
## Slice Plan: prompt-manager

### Overview

Feature has 14 capabilities → 4 slices recommended

### Slice 1: prompt-manager-crud (foundation)

**Capabilities:** Create, list, edit, delete prompts
**Scope:**

- IN: Basic prompt CRUD, simple editor
- OUT: Variables, folders, versions
  **Tasks:** ~6
  **Depends on:** Nothing
  **Enables:** All other slices

### Slice 2: prompt-manager-variables

**Capabilities:** Variable syntax, validation, preview
**Scope:**

- IN: {{variable}} syntax, preview with values
- OUT: Variable types, defaults, required flag
  **Tasks:** ~5
  **Depends on:** prompt-manager-crud
  **Enables:** prompt-manager-templates (future)

### Slice 3: prompt-manager-folders

**Capabilities:** Folder organization, move prompts
**Scope:**

- IN: Create folders, move prompts, filter by folder
- OUT: Nested folders, drag-drop reordering
  **Tasks:** ~6
  **Depends on:** prompt-manager-crud
  **Enables:** Nothing (independent enhancement)

### Slice 4: prompt-manager-versions

**Capabilities:** Version history, rollback
**Scope:**

- IN: Save versions on edit, view history, rollback
- OUT: Diff view, branching
  **Tasks:** ~5
  **Depends on:** prompt-manager-crud
  **Enables:** prompt-manager-compare (future)

### Dependency Graph
```

prompt-manager-crud (foundation)
├── prompt-manager-variables
├── prompt-manager-folders
└── prompt-manager-versions

```

### Recommended Build Order

1. prompt-manager-crud
2. prompt-manager-variables OR prompt-manager-folders (parallel OK)
3. prompt-manager-versions

Approve this plan? [Y/n/modify]
```

## After Slicing

Once slices are created:

```bash
# Build in dependency order
/test prompt-manager-crud
/code prompt-manager-crud
/verify && /pr

# Then next slice
/test prompt-manager-variables
/code prompt-manager-variables
/verify && /pr
```

## MCP Servers

```
spec-workflow  # Create specs, track progress
linear         # Check for related issues
```

$ARGUMENTS
