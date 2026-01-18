# /review - Pull Request Review

Review entire pull requests as the final quality gate before merge.

## Usage

```
/review [PR number, or "staged" for staged changes]
```

## Examples

```
/review #123
/review staged
/review last commit
```

## Prerequisites

Before running `/review`, ensure:

1. QA has passed (`/code qa`, `/test qa`, etc.)
2. Security has been checked (`/security`)

The reviewer expects these checks to have already run.

## What Gets Reviewed

The PR reviewer checks:

### Completeness

- Implementation matches spec
- All requirements met
- Edge cases handled

### Code Quality

- Functions under 30 lines
- Complexity under 10
- Good naming
- No duplication

### TypeScript

- No `any` types
- No `@ts-ignore`
- Proper null handling

### Tests

- New code has tests
- Critical paths covered
- Tests are meaningful

### Documentation

- README updated if needed
- API docs updated if needed

## Agent

| Agent       | Instructions                    |
| ----------- | ------------------------------- |
| pr-reviewer | `.claude/agents/pr-reviewer.md` |

## MCP Servers

```
cclsp   # TypeScript LSP for code intelligence
github  # PR and issue management
```

## Review Outcomes

### Approved

All checks pass, ready to merge.

### Changes Requested

Must-fix items identified. Recovery:

1. `/code [feature]` to fix issues
2. `/code qa [feature]` to validate
3. `/review` again

### Comment Only

Minor suggestions that can be addressed in follow-up.

## Feedback Format

```markdown
## Must Fix

- [file:line] Issue (blocking)

## Should Fix

- [file:line] Issue (not blocking)

## Suggestions

- [file:line] Nice to have
```

$ARGUMENTS
