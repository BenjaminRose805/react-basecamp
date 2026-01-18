# /code - Code Implementation

Implement features following specs and project standards.

## Usage

```
/code [feature]           # Full flow: research → write → qa
/code research [feature]  # Research only: find conflicts/duplicates
/code write [feature]     # Write only: implement (after research)
/code qa [feature]        # QA only: validate implementation
```

## Examples

```
# Full flow (recommended)
/code implement Login component from specs/auth.md
/code add form validation to UserProfile

# Individual phases
/code research Button variants        # Check for existing code
/code write Button variants           # Implement after research
/code qa Button variants              # Validate after writing
```

## Workflow

Running `/code [feature]` executes all three phases in sequence:

### Phase 1: Research (code-researcher)

- Search for existing implementations
- Check for conflicts and duplicates
- Identify consolidation opportunities
- **Outputs: PROCEED, STOP, or CLARIFY**

### Phase 2: Write (code-writer)

- Read the spec for the feature
- Implement following project patterns
- Run sanity checks (types, build)
- **Outputs: Files changed, ready for QA**

### Phase 3: QA (code-qa)

- Type checking validation
- Test execution and verification
- Integration and regression checks
- **Outputs: PASS or FAIL**

## Agents

| Phase    | Agent           | Instructions                        |
| -------- | --------------- | ----------------------------------- |
| research | code-researcher | `.claude/agents/code-researcher.md` |
| write    | code-writer     | `.claude/agents/code-writer.md`     |
| qa       | code-qa         | `.claude/agents/code-qa.md`         |

## MCP Servers

```
cclsp          # TypeScript LSP for code intelligence
next-devtools  # Next.js dev server errors
context7       # Up-to-date library documentation
vitest         # Test runner for QA
```

## After Completion

After `/code [feature]` (or `/code qa`):

1. Run `/security [feature]` for vulnerability scanning
2. Run `/review staged` for final approval

$ARGUMENTS
