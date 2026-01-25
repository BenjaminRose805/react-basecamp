# /plan - Implementation Planning

Create implementation specifications from requirements.

## Usage

```
/plan [feature]           # Create spec (default: spec subcommand)
/plan spec [feature]      # Create new spec from scratch
/plan distill [feature]   # Convert design docs to specs
/plan slice [feature]     # Break large features into slices
```

## Examples

```bash
/plan prompt-manager           # Create spec for prompt manager
/plan spec auth-flow           # Spec for authentication
/plan distill workflow-engine  # Convert docs to spec
/plan slice ai-platform        # Break into vertical slices
```

## Agent

Routes to: `plan-agent`

## Phases

1. **ANALYZE** - Research context, check conflicts
2. **CREATE** - Write spec files
3. **VALIDATE** - Verify completeness, request approval

## Subcommands

### spec

Create a new specification from requirements:

- Gather requirements from conversation
- Research existing code for context
- Create spec in `.spec-workflow/specs/{feature}/`
- Output requirements.md, design.md, tasks.md

### distill

Convert existing design documents to implementation specs:

- Read from `~/basecamp/docs/`
- Extract entities, APIs, UI requirements
- Create actionable tasks with \_Prompt fields
- Preserve source traceability

### slice

Break large features into vertical slices:

- Analyze feature for independent capabilities
- Create one spec per slice
- Define dependencies between slices
- Each slice is independently deployable

## Output

Spec files created in `.spec-workflow/specs/{feature}/`:

- `requirements.md` - EARS format requirements
- `design.md` - Architecture and decisions
- `tasks.md` - Work items with \_Prompt fields

Dashboard: http://localhost:5000/specs/{feature}

## After /plan

1. Review spec in dashboard
2. Approve requirements and design
3. Run `/code {feature}` to implement

$ARGUMENTS
