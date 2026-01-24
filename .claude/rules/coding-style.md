# Coding Style

Rules for consistent, maintainable code in react-basecamp projects.

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```typescript
// WRONG: Mutation
function updateUser(user: User, name: string) {
  user.name = name; // MUTATION!
  return user;
}

// CORRECT: Immutability
function updateUser(user: User, name: string): User {
  return {
    ...user,
    name,
  };
}
```

## File Organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- **Max 30 lines per function** (enforced by ESLint)
- **Max 800 lines per file**
- Extract utilities from large components
- Organize by feature/domain, not by type

### React-Basecamp Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/           # Base UI components (shadcn/ui)
├── lib/              # Utilities and helpers
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
└── features/         # Feature modules (if needed)
```

## Error Handling

ALWAYS handle errors with typed responses:

```typescript
import { TRPCError } from "@trpc/server";

try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Operation failed",
    cause: error,
  });
}
```

## Input Validation

ALWAYS validate with Zod (integrated with tRPC):

```typescript
import { z } from "zod";

const schema = z
  .object({
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
  })

  // In tRPC router
  .input(schema)
  .mutation(async ({ input }) => {
    // input is fully typed and validated
  });
```

## TypeScript Requirements

- **Strict mode enabled** - No `any` types without justification
- **Explicit return types** on exported functions
- **Interface over type** for object shapes
- **Discriminated unions** for state variants

```typescript
// GOOD: Discriminated union
type Result<T> = { success: true; data: T } | { success: false; error: string };

// BAD: Optional everything
type Result<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};
```

## Code Quality Limits (ESLint Enforced)

| Rule                     | Limit |
| ------------------------ | ----- |
| `max-lines-per-function` | 30    |
| `complexity`             | 10    |
| `max-depth`              | 4     |
| `max-params`             | 4     |

## Code Quality Checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<30 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling with typed errors
- [ ] No console.log statements
- [ ] No hardcoded values (use constants or env vars)
- [ ] No mutation (immutable patterns used)
- [ ] TypeScript strict mode passes
- [ ] All exports have explicit types
