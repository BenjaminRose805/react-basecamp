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

- Gather requirements
- Write clear, testable requirements
- Break down into tasks
- **Outputs: Spec file created, ready for QA**

### Phase 3: QA (spec-qa)

- Verify testability of requirements
- Check for ambiguity
- Validate task sizing
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

## Spec Structure

```markdown
# Feature: [Name]

## Overview

[1-2 sentence description]

## Requirements

- [ ] REQ-1: [Testable requirement]

## Design

### Components / Data Flow / API Changes

## Tasks

1. [ ] Task 1: [Small, implementable task]

## Out of Scope

- [What this does NOT include]
```

## After Completion

After `/spec [feature]` (or `/spec qa`):

1. Run `/test [feature]` for TDD (write failing tests)
2. Run `/code [feature]` to implement
3. Continue standard workflow

$ARGUMENTS
