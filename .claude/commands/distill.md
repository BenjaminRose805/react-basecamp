# /distill - Design Doc to Spec

Convert comprehensive design documentation into implementation-ready specifications.

## Usage

```
/distill [feature]           # Full flow: research → write → qa
/distill research [feature]  # Research only: explore design docs
/distill write [feature]     # Write only: create spec (after research)
/distill qa [feature]        # QA only: validate spec
```

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

- Synthesize research into implementation spec
- Follow `specs/spec-template.md` format
- Keep spec to max 2 pages
- Focus on what to build, not how

**Outputs:** Spec file created in `specs/{feature}.md`

### Phase 3: QA (distill-qa)

Validates:

- Template compliance
- Source traceability (claims linked to docs)
- Internal consistency
- Completeness

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
