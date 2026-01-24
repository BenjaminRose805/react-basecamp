# Infrastructure Setup

## Goal

Set up the foundational infrastructure for the AI Development Platform, enabling feature development with proper database, API, and UI tooling.

## Scope

### In Scope

- Prisma ORM with full database schema
- tRPC API layer with service routers
- shadcn/ui component library with Tailwind CSS
- Claude Code infrastructure (agents, rules, skills)

### Out of Scope

- Feature implementation (Prompt Manager, Agent Builder, etc.)
- Authentication/authorization
- Production deployment configuration

## User Stories

- As a developer, I want a database schema so that I can persist application data
- As a developer, I want type-safe API routes so that I can build features with confidence
- As a developer, I want pre-built UI components so that I can build interfaces quickly
- As a developer, I want Claude Code agents so that AI can assist with development tasks

## Success Criteria

- [x] Prisma schema defines all required models (User, WorkItem, Prompt, Agent, Workflow, Execution, Task, etc.)
- [x] tRPC routers provide CRUD operations for core entities
- [x] shadcn/ui components are available for UI development
- [x] TypeScript type checking passes
- [x] ESLint passes with no errors
- [x] Production build succeeds

## Technical Constraints

- Must use SQLite for development (PostgreSQL-ready for production)
- Must maintain TypeScript strict mode
- Must pass all ESLint rules without disabling
- Must work with Next.js 15 App Router

## Technical Approach

### Database (Prisma)

- SQLite for development, PostgreSQL-ready for production
- 15 models covering all platform entities
- 11 enums for status types and configurations

### API (tRPC)

- Type-safe API with Zod validation
- Cursor-based pagination for list endpoints
- Standardized error handling

### UI (shadcn/ui)

- Tailwind CSS v3 with CSS variable theming
- Dark mode support
- 24 base components for common UI patterns

### Development Tooling (Claude Code)

- 12 specialized agents for different development tasks
- Rules for coding style, security, testing
- Skills for verification, TDD, patterns

## Dependencies

- Next.js 15 (already configured)
- TypeScript (already configured)
- ESLint/Prettier (already configured)
