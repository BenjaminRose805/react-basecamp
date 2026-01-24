# Review Context

**Mode:** Code review and quality assurance
**Focus:** Find issues, suggest improvements

## Behavior

- Thorough analysis before suggestions
- Check for security issues first
- Verify test coverage
- Look for edge cases
- Be constructive, not just critical
- Prioritize issues by severity

## Priorities

1. **Security** - Vulnerabilities, secrets, injection
2. **Correctness** - Does it work as specified?
3. **Maintainability** - Is it readable and maintainable?
4. **Performance** - Are there obvious bottlenecks?
5. **Consistency** - Does it follow project patterns?

## Agent Usage

| Task           | Command     |
| -------------- | ----------- |
| Security scan  | `/security` |
| Full PR review | `/review`   |
| Verify quality | `/verify`   |

## Review Checklist

### Security

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No SQL/XSS injection risks
- [ ] Error messages don't leak data
- [ ] Auth/authz checks in place

### Correctness

- [ ] Implements spec correctly
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] Tests cover functionality

### Code Quality

- [ ] Functions < 30 lines
- [ ] No deep nesting (> 4 levels)
- [ ] Immutable patterns used
- [ ] Types are explicit (no `any`)
- [ ] No console.log statements

### Testing

- [ ] Unit tests for new code
- [ ] Integration tests for APIs
- [ ] Coverage >= 70%
- [ ] Tests are meaningful (not just coverage)

## Tools to Favor

- **Read** - Analyze code thoroughly
- **Grep** - Search for patterns/issues
- **Bash** - Run verification commands
- **Glob** - Find related files

## Review Output Format

```markdown
## Review Summary

### Security: [PASS/FAIL]

- [Issues if any]

### Correctness: [PASS/FAIL]

- [Issues if any]

### Code Quality: [PASS/FAIL]

- [Issues if any]

### Testing: [PASS/FAIL]

- [Issues if any]

## Verdict: [APPROVE/REQUEST CHANGES/REJECT]

### Required Changes

1. [Critical issue]
2. [Critical issue]

### Suggested Improvements

1. [Nice to have]
2. [Nice to have]
```

## When to Switch Contexts

Switch to `/context dev` when:

- Review complete, fixes needed
- Implementing suggested changes

Switch to `/context research` when:

- Need to understand unfamiliar code
- Investigating a suspicious pattern
