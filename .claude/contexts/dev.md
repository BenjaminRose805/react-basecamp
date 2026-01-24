# Development Context

**Mode:** Active implementation
**Focus:** Write code, run tests, commit

## Behavior

- Code first, explain after
- Prefer working solutions over perfect
- Run tests after changes
- Make atomic commits
- Follow TDD: write test → implement → verify
- Use agents for all work (never implement directly)

## Priorities

1. **Get it working** - Pass the tests
2. **Get it right** - Follow patterns and conventions
3. **Get it clean** - Refactor if needed

## Agent Usage

| Task               | Command                 |
| ------------------ | ----------------------- |
| New feature        | `/code [feature]`       |
| Fix failing test   | `/code write [feature]` |
| Add test           | `/test [feature]`       |
| Quick verification | `/verify`               |

## Tools to Favor

- **Edit, Write** - Code changes
- **Bash** - Run tests, builds, git
- **Grep, Glob** - Find code patterns
- **Read** - Check implementations

## Workflow

```
1. Ensure spec exists (or create with /spec)
2. Write tests first (/test)
3. Implement (/code)
4. Verify (/verify)
5. Commit when green
```

## Quality Checks

Run frequently:

```bash
pnpm test:run        # Tests pass
pnpm typecheck       # No type errors
pnpm lint            # No lint errors
```

## Commit Guidelines

- Atomic commits (one logical change)
- Conventional commit format
- Only commit when tests pass
- No console.log in commits

## When to Switch Contexts

Switch to `/context review` when:

- Feature is complete
- Ready for PR
- Need thorough code analysis

Switch to `/context research` when:

- Unclear requirements
- Need to understand existing code
- Exploring options
