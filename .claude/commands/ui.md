# /ui - UI Implementation

Build frontend UI components.

## Usage

```
/ui [feature]           # Full flow: research → build → validate
/ui research [feature]  # Research only
/ui build [feature]     # Build only (after research)
/ui validate [feature]  # Validate only (after build)
```

## Examples

```bash
/ui prompt-manager        # Full UI implementation
/ui research dashboard    # Check existing components
/ui build user-card       # After research approved
/ui validate form         # Re-validate after fixes
```

## Agent

Routes to: `ui-agent`

## Phases

### research

- Find existing components
- Check shadcn registry
- Check Figma designs (if available)
- Identify patterns to follow
- Decision: PROCEED, STOP, or CLARIFY

### build

- Check if base components exist in shadcn
- Write component tests first
- Build components with accessibility
- Add styling and polish
- Log implementations

### validate

- Run type checking
- Run component tests
- Check accessibility
- Verify responsive behavior
- Report: PASS or FAIL

## MCP Servers Used

```
cclsp       # TypeScript
figma       # Design specs
shadcn      # Component registry
playwright  # Visual testing
context7    # React API verification
spec-workflow # Task tracking
```

## Skills Applied

- `research` - Component discovery
- `tdd-workflow` - Test-first components
- `qa-checks` - Quality verification
- `frontend-patterns` - React patterns
- `coding-standards` - Clean code

## shadcn Integration

```bash
# Install base components
pnpm dlx shadcn@latest add button card

# Or use MCP to search
mcp shadcn search_items_in_registries "button"
```

## After /ui

1. Run `/check` for full verification
2. Run `/ship` to create PR

$ARGUMENTS
