# My App

Next.js application with react-basecamp tooling for AI-assisted development.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (customize as needed)
- **Testing**: Vitest + Playwright
- **Package Manager**: pnpm

## Key Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm build            # Production build
pnpm test             # Run unit tests (watch mode)
pnpm test:run         # Run unit tests (single run)
pnpm test:e2e         # Run E2E tests
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript checks
pnpm format           # Format with Prettier

# Quality checks
pnpm quality          # Run all quality checks
pnpm quality:dead-code    # Find unused code (Knip)
pnpm quality:duplicates   # Find duplicate code (jscpd)
pnpm quality:circular     # Find circular dependencies (Madge)
pnpm quality:dead-ui      # Find empty handlers, placeholder links
pnpm quality:packages     # Verify all packages exist in npm
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
│   └── ui/           # Base UI components
├── lib/              # Utility functions
└── types/            # TypeScript type definitions

e2e/                  # Playwright E2E tests
specs/                # Feature specifications
```

## Code Quality Rules

These limits are enforced by ESLint:

- `max-lines-per-function`: 30
- `complexity`: 10
- `max-depth`: 4
- `max-params`: 4

## Spec-Driven Development

Before implementing new features:

1. Check for existing specs in `specs/`
2. If no spec exists, create one using `specs/spec-template.md`
3. Get approval before implementing
4. Reference the spec in your PR

## Anti-Patterns

- No `any` types - use proper TypeScript types
- No `@ts-ignore` - fix the type issue instead
- No `console.log` in production code - use proper logging
- No hardcoded secrets - use environment variables
- No skipping tests - maintain coverage thresholds

## Testing Requirements

- Unit tests for all new components and utilities
- E2E tests for critical user flows
- Coverage thresholds: 70% lines, 60% branches
