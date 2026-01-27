---
name: research
description: Read-only codebase exploration and analysis
---

# Research Workflow

Single-stage, read-only exploration for understanding code without modifications.

## Trigger

- `/research [topic]` command

## Stages

```text
RESEARCH (researcher sub-agent, Opus)
    ↓
Report findings (no changes made)
```

## Single Stage: RESEARCH

**Sub-agent:** `researcher` (Opus)
**Profile:** read-only (Read, Grep, Glob, cclsp)

### Purpose

Explore and understand code without making any modifications. Use this for:

- Understanding existing architecture
- Finding implementation patterns
- Exploring how features work
- Preparing for implementation decisions
- Answering "how does X work?" questions

### Tasks

1. Search codebase for topic-related code
2. Read and understand relevant files
3. Trace data flow and dependencies
4. Identify patterns and architecture
5. Document findings

### Constraints

| Allowed                         | NOT Allowed            |
| ------------------------------- | ---------------------- |
| Read any file                   | Write/Edit files       |
| Search with Grep/Glob           | Execute Bash commands  |
| Navigate code with cclsp        | Spawn sub-agents       |
| Use WebFetch/WebSearch for docs | Make any modifications |
| Generate recommendations        | Create new files       |

### Output

```json
{
  "findings": [
    {
      "topic": "Authentication flow",
      "files": ["src/lib/auth.ts", "src/server/middleware/auth.ts"],
      "description": "Auth uses NextAuth.js with JWT strategy..."
    },
    {
      "topic": "Session management",
      "files": ["src/lib/session.ts"],
      "description": "Sessions stored in database with 24h expiry..."
    }
  ],
  "architecture_notes": "The app follows a layered architecture with...",
  "data_flow": "User → API route → middleware → tRPC router → Prisma",
  "recommendations": [
    "Consider using Redis for session storage",
    "Auth middleware could be simplified"
  ]
}
```

---

## Input

```
topic: string  # What to research (feature, pattern, question)
```

## Output Formats

### Architecture Research

```markdown
## Research: Authentication System

### Overview

The authentication system uses NextAuth.js with a custom JWT strategy.

### Key Files

| File                             | Purpose                |
| -------------------------------- | ---------------------- |
| `src/lib/auth.ts`                | Core auth utilities    |
| `src/server/middleware/auth.ts`  | Request authentication |
| `src/app/api/auth/[...nextauth]` | NextAuth route handler |

### Data Flow
```

1. User submits credentials
2. NextAuth validates against database
3. JWT token generated with user claims
4. Token stored in HTTP-only cookie
5. Middleware validates token on protected routes

```

### Patterns Found

- **Strategy Pattern**: Different auth providers (credentials, OAuth)
- **Middleware Chain**: Auth check → Rate limit → Handler
- **Repository Pattern**: User data access through Prisma

### Recommendations

1. Consider session refresh on activity
2. Add rate limiting to auth endpoints
3. Implement token rotation
```

### Code Understanding Research

````markdown
## Research: How does the task queue work?

### Overview

The task queue uses BullMQ with Redis for background job processing.

### Key Components

| Component        | Location                     | Purpose              |
| ---------------- | ---------------------------- | -------------------- |
| Queue definition | `src/lib/queue/index.ts`     | Queue configuration  |
| Job processors   | `src/lib/queue/processors/`  | Handle specific jobs |
| Job scheduling   | `src/server/routers/task.ts` | Enqueue from API     |

### How It Works

1. API receives task request
2. Task added to Redis queue with priority
3. Worker process picks up job
4. Processor executes task
5. Result stored, webhook called

### Code Snippets

**Enqueue a task:**

```typescript
await taskQueue.add(
  "process-document",
  {
    documentId: doc.id,
    userId: user.id,
  },
  { priority: 1 }
);
```
````

**Process a task:**

```typescript
taskQueue.process("process-document", async (job) => {
  const { documentId } = job.data;
  // ... processing logic
});
```

````

### Pattern Research

```markdown
## Research: Error handling patterns

### Overview

The codebase uses a consistent error handling pattern with typed errors.

### Pattern: TRPCError

All API errors use TRPCError with specific codes:

```typescript
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Resource not found',
  cause: originalError
});
````

### Pattern: Result Type

Some utilities use discriminated unions:

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: Error };
```

### Files Using These Patterns

- `src/server/routers/*.ts` - TRPCError
- `src/lib/validation.ts` - Result type
- `src/lib/api-client.ts` - Error boundaries

### Recommendations

1. Standardize on TRPCError for API layer
2. Use Result type for utilities
3. Add error codes for client categorization

```

---

## Error Handling

| Error              | Handling                          |
| ------------------ | --------------------------------- |
| Topic too broad    | Ask for more specific focus       |
| No results found   | Suggest alternative search terms  |
| cclsp unavailable  | Fall back to Grep/Glob only       |

## Notes

- This is the ONLY workflow that makes NO changes
- Use for understanding before implementing
- Findings can inform `/plan` or `/implement` decisions
- Researcher model is Opus for deep comprehension
- Profile is strictly read-only for safety
- No sub-agent spawning - single pass research
```
