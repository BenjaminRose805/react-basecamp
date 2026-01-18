# /test - Test Writing

Write comprehensive tests following TDD principles.

## Usage

```
/test [feature]           # Full flow: research → write → qa
/test research [feature]  # Research only: find existing coverage
/test write [feature]     # Write only: create tests (after research)
/test qa [feature]        # QA only: validate tests
```

## Examples

```
# Full flow (recommended)
/test src/components/Button.tsx
/test the authentication flow
/test add E2E tests for checkout

# Individual phases
/test research Login component    # Check existing test coverage
/test write Login component       # Write tests after research
/test qa Login component          # Validate tests after writing
```

## Workflow

Running `/test [feature]` executes all three phases in sequence:

### Phase 1: Research (test-researcher)

- Find existing tests for this area
- Analyze test patterns in codebase
- Identify coverage gaps
- **Outputs: PROCEED, STOP, or CLARIFY**

### Phase 2: Write (test-writer)

- Write failing tests first (TDD red)
- Follow existing test patterns
- Reuse fixtures/mocks identified
- **Outputs: Test files created, ready for QA**

### Phase 3: QA (test-qa)

- Validate test syntax and structure
- Check test isolation
- Verify meaningful coverage
- **Outputs: PASS or FAIL**

## Agents

| Phase    | Agent           | Instructions                        |
| -------- | --------------- | ----------------------------------- |
| research | test-researcher | `.claude/agents/test-researcher.md` |
| write    | test-writer     | `.claude/agents/test-writer.md`     |
| qa       | test-qa         | `.claude/agents/test-qa.md`         |

## MCP Servers

```
vitest      # AI-optimized test runner
cclsp       # TypeScript LSP for code intelligence
playwright  # Browser automation for E2E tests
```

## TDD Workflow

For TDD (test-driven development):

1. `/test [feature]` - Write failing tests
2. `/code write [feature]` - Implement to pass tests
3. `/code qa [feature]` - Verify implementation
4. `/security [feature]` - Security check
5. `/review staged` - Final review

$ARGUMENTS
