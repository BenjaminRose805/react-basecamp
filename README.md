# My App

A Next.js application bootstrapped with [react-basecamp](https://github.com/benjaminrose/react-basecamp) tooling.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests (watch mode) |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm format` | Format code with Prettier |

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── error.tsx     # Error boundary
│   │   └── loading.tsx   # Loading state
│   ├── components/       # React components
│   │   └── ui/           # Base UI components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript definitions
├── e2e/                  # Playwright E2E tests
├── specs/                # Feature specifications
├── .claude/              # Claude Code configuration
└── .github/              # GitHub workflows
```

## Development Workflow

### 1. Feature Development

1. Create a spec in `specs/` using the template
2. Get spec approved
3. Implement with tests
4. Open PR for review

### 2. Testing

```bash
# Unit tests
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage report

# E2E tests
pnpm test:e2e          # Run all
pnpm test:e2e:ui       # Interactive mode
```

### 3. Quality Checks

```bash
# Run all checks
pnpm quality-check

# Individual checks
pnpm lint              # ESLint
pnpm typecheck         # TypeScript
pnpm format:check      # Prettier
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### ESLint

Full ESLint 9 flat config with React, Next.js, and accessibility rules. Customize in `eslint.config.js`.

### Prettier

Standard Prettier config. Customize in `.prettierrc`.

### TypeScript

Strict TypeScript config for Next.js. Customize in `tsconfig.json`.

## Git Hooks

Pre-configured with Husky:

- **pre-commit**: Runs lint-staged, dead-ui check, secrets scan
- **pre-push**: Runs typecheck, dead-code check
- **commit-msg**: Validates conventional commit format

## Claude Code Integration

This project includes Claude Code hooks for AI-assisted development:

- Auto type-check after editing TypeScript files
- Auto lint and format after edits
- Run related tests after source changes
- Quality checks before commits

See `.claude/settings.json` for configuration.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [react-basecamp](https://github.com/benjaminrose/react-basecamp)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
