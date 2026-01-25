# /code - Backend Implementation

Implement backend code using TDD methodology.

## Usage

```
/code [feature]           # Full flow: research → implement → validate
/code research [feature]  # Research only
/code implement [feature] # Implement only (after research)
/code validate [feature]  # Validate only (after implement)
```

## Examples

```bash
/code prompt-manager         # Full TDD implementation
/code research user-auth     # Check for conflicts first
/code implement api-routes   # After research approved
/code validate crud-ops      # Re-validate after fixes
```

## Agent

Routes to: `code-agent`

## Phases

### research

- Find existing implementations
- Check for naming conflicts
- Identify patterns to follow
- Decision: PROCEED, STOP, or CLARIFY

### implement

- Read spec from `.spec-workflow/specs/{feature}/`
- For each task:
  - Write failing test (RED)
  - Implement minimal code (GREEN)
  - Refactor (IMPROVE)
  - Log implementation
- Follow backend patterns

### validate

- Run type checking
- Run tests with coverage
- Run lint checks
- Report: PASS or FAIL

## MCP Servers Used

```
cclsp          # Code navigation
context7       # API verification
vitest         # Test runner
spec-workflow  # Task tracking
next-devtools  # Build status
```

## Skills Applied

- `research` - Conflict detection
- `tdd-workflow` - Red-Green-Refactor
- `qa-checks` - Quality verification
- `backend-patterns` - tRPC, Prisma patterns
- `coding-standards` - KISS, DRY, YAGNI

## After /code

1. Run `/ui {feature}` if frontend needed
2. Run `/check` for full verification
3. Run `/ship` to create PR

$ARGUMENTS
