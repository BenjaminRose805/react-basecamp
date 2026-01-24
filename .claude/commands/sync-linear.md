# /sync-linear - Sync Specs with Linear

Synchronize spec-workflow specs with Linear issues.

## Usage

```text
/sync-linear                  # Show sync status
/sync-linear [feature]        # Sync specific feature
/sync-linear --create-missing # Create issues for orphan specs
```

## MCP Servers

```text
spec-workflow  # Read specs
linear         # Issue management
```

**Required spec-workflow tools:**

- `spec-status` - List all specs

**Required linear tools:**

- `list_issues` - Search for matching issues
- `create_issue` - Create issues for orphan specs
- `list_projects` - Find projects for linking

## Instructions

### Step 1: Scan Specs

List all `.spec-workflow/specs/*/` directories.

```bash
ls -d .spec-workflow/specs/*/ 2>/dev/null || echo "No specs found"
```

### Step 2: Check Linear State

For each spec, search for matching Linear issue:

1. Extract feature name from spec directory
2. Search: `list_issues(query: "{feature}")`
3. Record match status (synced/missing)

### Step 3: Display Status

```text
LINEAR SYNC STATUS
==================
Synced:
  prompt-manager-crud     → LIN-123 (In Progress)
  prompt-manager-variables → LIN-124 (Todo)

Missing Issues (specs without Linear issues):
  workflow-designer       [use --create-missing to create]

Missing Specs (Linear issues without specs):
  LIN-128: feat: auth-provider
```

### Step 4: Create Missing (if --create-missing)

If `--create-missing` flag provided:

1. For each spec without a matching issue:
   - Read spec's requirements.md for context
   - Create issue: `create_issue(title: "feat: {feature}", labels: ["feature"])`
   - Add comment with spec path
2. Report created issues

### Step 5: Sync Specific Feature (if [feature] provided)

If a feature name is provided:

1. Find spec: `.spec-workflow/specs/{feature}/`
2. Search for existing issue
3. If found: Display status and any discrepancies
4. If not found: Offer to create issue

## Model

Use: **Haiku** (lightweight sync operation)

## Output Example

```markdown
## Linear Sync Status

### Synced (3)

| Spec                     | Linear Issue | Status      |
| ------------------------ | ------------ | ----------- |
| prompt-manager-crud      | LIN-123      | In Progress |
| prompt-manager-variables | LIN-124      | Todo        |
| agent-builder-core       | LIN-125      | Backlog     |

### Missing Issues (1)

- `workflow-designer` - No Linear issue found
  - Run `/sync-linear --create-missing` to create

### Missing Specs (1)

- LIN-128: feat: auth-provider - No spec found
  - Run `/distill auth-provider` to create spec

### Actions Available

- `/sync-linear --create-missing` - Create issues for orphan specs
- `/sync-linear prompt-manager-crud` - View detailed sync for specific feature
```

## Error Handling

If Linear MCP unavailable:

```text
Linear MCP not configured.

To enable:
  claude mcp add linear -- npx @anthropic/mcp-linear

Skipping sync.
```

## Related Commands

- `/distill [feature]` - Create spec from design docs
- `/spec [feature]` - Create spec from scratch
- `/status` - Overall development status
