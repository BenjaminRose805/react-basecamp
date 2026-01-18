# Contributing

Thank you for contributing to this project!

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start development server: `pnpm dev`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). The commit message format is:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Changes to build process or auxiliary tools |
| `perf` | Performance improvements |
| `ci` | CI/CD changes |
| `build` | Build system or dependency changes |
| `revert` | Reverting a previous commit |

### Examples

```
feat(auth): add login page
fix: resolve null pointer exception
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a spec** (for new features)
   - Add spec to `specs/` directory
   - Get approval before implementing

2. **Develop locally**
   - Create a feature branch: `git checkout -b feat/my-feature`
   - Make your changes
   - Write/update tests
   - Run quality checks: `pnpm quality-check`

3. **Open a PR**
   - Push your branch
   - Open a PR against `main`
   - Fill in the PR template
   - Wait for CI checks and review

## Code Quality

### Before Committing

The pre-commit hook will run:
- ESLint + Prettier on staged files
- Dead UI check on React components
- Secrets scan

### Before Pushing

The pre-push hook will run:
- TypeScript type checking
- Dead code detection

### Coverage Requirements

- Lines: 70% minimum
- Branches: 60% minimum

## Testing

### Unit Tests

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
```

### E2E Tests

```bash
pnpm test:e2e          # Headless
pnpm test:e2e:ui       # Interactive
```

## Questions?

Open an issue or reach out to the maintainers.
