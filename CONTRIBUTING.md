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

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New feature                                             |
| `fix`      | Bug fix                                                 |
| `docs`     | Documentation only                                      |
| `style`    | Code style (formatting, semicolons, etc.)               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or updating tests                                |
| `chore`    | Changes to build process or auxiliary tools             |
| `perf`     | Performance improvements                                |
| `ci`       | CI/CD changes                                           |
| `build`    | Build system or dependency changes                      |
| `revert`   | Reverting a previous commit                             |

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

## Claude Code Infrastructure

This project uses enhanced Claude Code infrastructure for AI-assisted development.

### Directory Structure

```
.claude/
├── agents/           # Agent definitions (7 agents)
├── commands/         # Slash commands (/plan, /implement, etc.)
├── sub-agents/       # Sub-agent templates and profiles
├── workflows/        # Multi-agent workflow definitions
├── skills/           # Reusable procedures
├── rules/            # Coding rules and guidelines
├── scripts/          # Hook scripts and utilities
│   ├── hooks/        # Lifecycle hook scripts
│   └── lib/          # Shared utilities
└── settings.json     # Hook configuration
```

### Contributing to Rules

Rules in `.claude/rules/` define coding standards and practices.

**To add a new rule:**

1. Create `.claude/rules/your-rule.md`
2. Follow the existing format:

   ````markdown
   # Rule Name

   Brief description.

   ## Guidelines

   - Guideline 1
   - Guideline 2

   ## Examples

   ```typescript
   // GOOD
   // BAD
   ```
   ````

   ```

   ```

3. Add reference to CLAUDE.md Rules section

### Contributing to Skills

Skills in `.claude/skills/` define reusable workflows.

**To add a new skill:**

1. Create `.claude/skills/your-skill/SKILL.md`
2. Define the workflow steps, inputs, outputs
3. Add command to `.claude/commands/` if needed
4. Update CLAUDE.md Skills section

### Contributing to Hooks

Hooks in `.claude/settings.json` automate checks.

**Hook types:**

| Event        | When                      |
| ------------ | ------------------------- |
| SessionStart | New session begins        |
| Stop         | Session ends              |
| PreCompact   | Before context compaction |
| PreToolUse   | Before tool execution     |
| PostToolUse  | After tool execution      |

**To add a new hook:**

1. If complex, create script in `.claude/scripts/hooks/`
2. If simple, use inline Node.js command
3. Add to appropriate event in `settings.json`
4. Test with `node .claude/scripts/hooks/your-hook.js`

**Example hook:**

```json
{
  "event": "Edit",
  "pattern": "\\.ts$",
  "command": "npx tsc --noEmit",
  "description": "Type-check after editing TypeScript"
}
```

### Automated Checks

When you edit code, hooks automatically run:

1. **TypeScript** - Type checking after `.ts(x)` edits
2. **ESLint** - Linting after JS/TS edits
3. **Prettier** - Formatting after supported file edits
4. **Vitest** - Related tests after `src/` edits
5. **console.log** - Warning about debug statements

### Agent Workflow

All writing tasks follow the 3-agent pattern:

```
Researcher → Writer → QA
```

See `.claude/agents/` for agent definitions.

## Questions?

Open an issue or reach out to the maintainers.
