# /distill - Design Doc to Spec

Convert design documentation, rough notes, or conversation into implementation-ready specifications.

## Usage

```
/distill [feature]           # Full flow: research → write → qa
/distill research [feature]  # Research only: explore design docs
/distill write [feature]     # Write only: create spec (after research)
/distill qa [feature]        # QA only: validate spec
```

## Input Sources

The distill command can work from multiple sources:

### 1. Design Docs (default)

```bash
/distill prompt-manager
# Reads from ~/basecamp/docs/specs/prompt-manager.md + architecture/
```

### 2. Custom Document Path

```bash
/distill prompt-manager --from ~/notes/my-rough-ideas.md
/distill prompt-manager --from ./brainstorm.md
```

### 3. Conversation Context

```bash
# First, have a conversation about what you want:
"I'm thinking about building a prompt manager that..."
[describe your thoughts]

# Then distill from the conversation:
/distill prompt-manager --from-conversation
```

### 4. Inline (small features)

```bash
/distill prompt-manager
# If no docs found, Claude will ask you to describe the feature
# Then creates spec from your description
```

**For large features with many capabilities**, use `/slice` instead to break into smaller pieces first.

## Examples

```
# Full flow (recommended)
/distill prompt-manager
/distill agent-builder
/distill workflow-designer

# Individual phases
/distill research prompt-manager  # See what docs exist
/distill write prompt-manager     # Write spec from research
/distill qa prompt-manager        # Validate the spec
```

## When to Use

Use `/distill` when:

- Design docs exist in ~/basecamp/docs/
- Starting a feature that's already been designed
- Need to extract actionable specs from architecture docs

Use `/spec` instead when:

- No design docs exist
- Writing a spec from scratch

## Workflow

Running `/distill [feature]` executes all three phases:

### Phase 1: Research (distill-researcher)

Reads from design documentation:

- `docs/specs/{feature}.md` - Feature specification
- `docs/architecture/data-models.md` - Entity definitions
- `docs/architecture/database-schema.md` - Database structure
- `docs/architecture/api-contracts.md` - API definitions
- `docs/architecture/tech-stack.md` - Technology decisions

**Outputs:** Research brief with entities, APIs, UI, scope

### Phase 2: Write (distill-spec-writer)

- Create specs using spec-workflow MCP server
- Follow `.spec-workflow/templates/` formats
- Create three documents: requirements.md, design.md, tasks.md
- Request dashboard approval for each document

**Outputs:** Spec files created in `.spec-workflow/specs/{feature}/`

**Dashboard:** View and approve at http://localhost:5000

### Phase 3: QA (distill-qa)

Validates:

- spec-workflow format compliance
- Task format with \_Prompt, \_Leverage, \_Requirements fields
- Source traceability (claims linked to docs)
- Internal consistency

**Outputs:** PASS or FAIL with specific issues

## Agents

| Phase    | Agent               | Instructions                            |
| -------- | ------------------- | --------------------------------------- |
| research | distill-researcher  | `.claude/agents/distill-researcher.md`  |
| write    | distill-spec-writer | `.claude/agents/distill-spec-writer.md` |
| qa       | distill-qa          | `.claude/agents/distill-qa.md`          |

## Design Doc Locations

```
~/basecamp/docs/
├── specs/              # Feature specifications
├── architecture/       # System design
│   ├── data-models.md
│   ├── api-contracts.md
│   ├── database-schema.md
│   └── tech-stack.md
└── vision/             # Platform overview
```

## After Completion

After `/distill [feature]` (or `/distill qa`):

1. Run `/test [feature]` for TDD (write failing tests)
2. Run `/eval [feature]` if feature has LLM integration
3. Run `/code [feature]` to implement
4. Continue standard workflow

$ARGUMENTS
