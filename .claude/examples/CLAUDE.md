# Example CLAUDE.md Patterns

This document shows common patterns and templates for CLAUDE.md files.

## Minimal CLAUDE.md

```markdown
# Project Name

Brief project description.

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Key Commands

- `pnpm dev` - Start development server
- `pnpm test` - Run tests
- `pnpm build` - Build for production
```

## Standard CLAUDE.md Structure

```markdown
# Project Name

One-line description of what the project does.

## Architecture

Brief overview of the tech stack and architecture.

## Development

### Setup

\`\`\`bash
pnpm install
cp .env.example .env.local
pnpm dev
\`\`\`

### Key Commands

| Command     | Description      |
| ----------- | ---------------- |
| `pnpm dev`  | Start dev server |
| `pnpm test` | Run tests        |
| `pnpm lint` | Lint code        |

## Code Patterns

### Component Pattern

\`\`\`tsx
// components/Feature/Feature.tsx
export function Feature({ prop }: FeatureProps) {
return <div>{prop}</div>;
}
```

### API Pattern

\`\`\`typescript
// server/routers/feature.ts
export const featureRouter = router({
list: publicProcedure.query(async () => {
return db.feature.findMany();
}),
});
\`\`\`

## Rules

- Follow existing patterns
- Write tests for new features
- Use TypeScript strict mode

````

## Advanced CLAUDE.md with Skills

```markdown
# Project Name

## Skills

| Skill | Purpose | Trigger |
|-------|---------|---------|
| [code-review](.claude/skills/code-review/SKILL.md) | Review PRs | `/review` |
| [test-gen](.claude/skills/test-gen/SKILL.md) | Generate tests | `/test` |

## Contexts

| Context | When to Load |
|---------|--------------|
| [api-patterns](.claude/contexts/api-patterns.md) | API work |
| [testing](.claude/contexts/testing.md) | Writing tests |

## Hooks

| Hook | Purpose |
|------|---------|
| SessionStart | Initialize session |
| PreToolUse | Validate tool calls |

## Development Methodology

### SDD (Spec-Driven Development)

1. Write specification first
2. Implement to spec
3. Validate against spec

### TDD (Test-Driven Development)

1. Write failing test
2. Implement feature
3. Refactor

### EDD (Evaluation-Driven Development)

1. Define evaluation criteria
2. Build evaluation harness
3. Iterate until metrics pass
````

## Domain-Specific Examples

### Full-Stack Web App

```markdown
# E-Commerce Platform

Next.js + tRPC + Prisma e-commerce platform.

## Architecture

- **Frontend**: Next.js 14 App Router, React Query, Tailwind
- **Backend**: tRPC, Prisma, PostgreSQL
- **Auth**: NextAuth.js with JWT
- **Payments**: Stripe

## Key Directories

- `src/app/` - Next.js pages and layouts
- `src/components/` - React components
- `src/server/` - tRPC routers and services
- `prisma/` - Database schema and migrations

## Database

\`\`\`bash
pnpm db:push # Push schema changes
pnpm db:migrate # Create migration
pnpm db:seed # Seed database
\`\`\`

## Patterns

### Repository Pattern

\`\`\`typescript
// server/repositories/product.ts
export const productRepository = {
findById: (id: string) => db.product.findUnique({ where: { id } }),
findMany: (filters) => db.product.findMany({ where: filters }),
};
\`\`\`

### Service Layer

\`\`\`typescript
// server/services/order.ts
export async function createOrder(userId: string, items: CartItem[]) {
return db.$transaction(async (tx) => {
// Create order logic
});
}
\`\`\`
```

### CLI Tool

```markdown
# CLI Tool Name

Command-line tool for X.

## Installation

\`\`\`bash
npm install -g tool-name
\`\`\`

## Commands

| Command       | Description        |
| ------------- | ------------------ |
| `tool init`   | Initialize project |
| `tool run`    | Run the tool       |
| `tool config` | Configure settings |

## Architecture

- `src/commands/` - Command implementations
- `src/lib/` - Shared utilities
- `src/config/` - Configuration handling

## Adding Commands

1. Create file in `src/commands/`
2. Export command with yargs builder
3. Register in `src/index.ts`
```

### Library/Package

```markdown
# Library Name

Reusable library for X.

## Installation

\`\`\`bash
npm install library-name
\`\`\`

## Usage

\`\`\`typescript
import { feature } from 'library-name';

const result = feature(options);
\`\`\`

## API Reference

### `feature(options)`

Does something useful.

**Parameters:**

- `options.foo` - Description
- `options.bar` - Description

**Returns:** Result object

## Development

\`\`\`bash
pnpm build # Build library
pnpm test # Run tests
pnpm release # Publish new version
\`\`\`

## Bundle Size

Keep bundle size minimal:

- Tree-shakeable exports
- No unnecessary dependencies
- Use `bundlephobia` to check
```

## Pattern: 3-Agent Workflow Documentation

```markdown
## Writing Workflow

All writing tasks follow the 3-agent pattern:

### Agent Roles

1. **Researcher** - Gathers information, reads files, searches
2. **Writer** - Produces the content based on research
3. **QA** - Reviews and validates the output

### Example: Documentation

\`\`\`
User: Write docs for the auth module

Researcher Agent:

- Reads src/auth/\*.ts
- Reads existing docs
- Gathers patterns used

Writer Agent:

- Writes documentation
- Follows style guide
- Includes examples

QA Agent:

- Verifies accuracy
- Checks completeness
- Validates examples work
  \`\`\`
```

## Anti-Patterns to Avoid

### Too Verbose

Don't include obvious information:

- Don't explain what `npm install` does
- Don't describe basic TypeScript syntax
- Don't document every single file

### Too Minimal

Include enough context:

- Key architectural decisions
- Non-obvious patterns
- Project-specific conventions

### Outdated

Keep CLAUDE.md in sync:

- Update when patterns change
- Remove deprecated sections
- Version critical information
