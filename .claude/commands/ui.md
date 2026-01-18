# /ui - UI Component Building

Build UI components from designs with accessibility focus.

## Usage

```
/ui [component]           # Full flow: research → build → qa
/ui research [component]  # Research only: find existing components
/ui build [component]     # Build only: create component (after research)
/ui qa [component]        # QA only: validate component
```

## Examples

```
# Full flow (recommended)
/ui IconButton component
/ui SearchInput with autocomplete
/ui Modal component from Figma

# Individual phases
/ui research Card component    # Check for existing components
/ui build Card component       # Build after research
/ui qa Card component          # Validate after building
```

## Workflow

Running `/ui [component]` executes all three phases in sequence:

### Phase 1: Research (ui-researcher)

- Find existing similar components
- Analyze component patterns
- Check design tokens and styling
- **Outputs: PROCEED, STOP, or CLARIFY**

### Phase 2: Build (ui-builder)

- Extract design details from Figma
- Build component following patterns
- Implement all states
- **Outputs: Component files created, ready for QA**

### Phase 3: QA (ui-qa)

- Visual validation
- Accessibility testing (WCAG 2.1 AA)
- Responsive testing
- **Outputs: PASS or FAIL**

## Agents

| Phase    | Agent         | Instructions                      |
| -------- | ------------- | --------------------------------- |
| research | ui-researcher | `.claude/agents/ui-researcher.md` |
| build    | ui-builder    | `.claude/agents/ui-builder.md`    |
| qa       | ui-qa         | `.claude/agents/ui-qa.md`         |

## MCP Servers

```
figma       # Design file access
playwright  # Browser testing and verification
cclsp       # TypeScript LSP for code intelligence
```

## Component States

All components should implement:

1. Default
2. Hover
3. Focus
4. Active
5. Disabled
6. Loading (if applicable)
7. Error (if applicable)

## After Completion

After `/ui [component]` (or `/ui qa`):

1. Run `/test [component]` for test coverage
2. Run `/security [component]` for vulnerability scanning
3. Run `/review staged` for final approval

$ARGUMENTS
