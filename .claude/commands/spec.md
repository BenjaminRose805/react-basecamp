# /spec - Specification Writing

Create and manage feature specifications for spec-driven development.

## Usage

```
/spec [feature]           # Full flow: research → write → qa
/spec research [feature]  # Research only: find related specs
/spec write [feature]     # Write only: create spec (after research)
/spec qa [feature]        # QA only: validate spec
```

## Examples

```
# Full flow (recommended)
/spec user authentication
/spec shopping cart checkout
/spec dark mode toggle

# Individual phases
/spec research user profile    # Check for related specs
/spec write user profile       # Write after research
/spec qa user profile          # Validate after writing
```

## Workflow

Running `/spec [feature]` executes all three phases in sequence:

### Phase 1: Research (spec-researcher)

- Find existing related specs
- Check for conflicts and dependencies
- Identify what's already specified
- **Outputs: PROCEED, STOP, or CLARIFY**

### Phase 2: Write (spec-writer)

- Create specs using spec-workflow MCP server
- Creates three documents in `.spec-workflow/specs/{feature}/`:
  - requirements.md (EARS format)
  - design.md (architecture, components)
  - tasks.md (with \_Prompt, \_Leverage, \_Requirements)
- Request dashboard approval for each document
- **Outputs: Spec files created, approved via dashboard**

**Dashboard:** View and approve at http://localhost:5000

### Phase 3: QA (spec-qa)

- Verify spec-workflow format compliance
- Check task format (must have \_Prompt fields)
- Validate testability and task sizing
- **Outputs: PASS or FAIL**

## Agents

| Phase    | Agent           | Instructions                        |
| -------- | --------------- | ----------------------------------- |
| research | spec-researcher | `.claude/agents/spec-researcher.md` |
| write    | spec-writer     | `.claude/agents/spec-writer.md`     |
| qa       | spec-qa         | `.claude/agents/spec-qa.md`         |

## MCP Servers

```
spec-workflow  # Full SDD workflow with dashboard
cclsp          # TypeScript LSP for code intelligence
```

## Spec Structure (spec-workflow)

Specs are created in `.spec-workflow/specs/{feature}/` with three files:

### requirements.md

```markdown
# Requirements Document

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria

1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]
```

### design.md

```markdown
# Design Document

## Architecture

[Overview and diagrams]

## Components and Interfaces

[Component definitions with purpose, interfaces, dependencies]

## Data Models

[Entity definitions]
```

### tasks.md (CRITICAL FORMAT)

```markdown
# Tasks Document

- [ ] 1. Task title
  - File: path/to/file.ts
  - Description of what to implement
  - Purpose: Why this task exists
  - _Leverage: existing/files.ts_
  - _Requirements: REQ-1_
  - _Prompt: Role: [Type] | Task: [What] | Restrictions: [What not] | Success: [Criteria]_
```

## After Completion

After `/spec [feature]` (or `/spec qa`):

1. Run `/test [feature]` for TDD (write failing tests)
2. Run `/code [feature]` to implement
3. Continue standard workflow

$ARGUMENTS
