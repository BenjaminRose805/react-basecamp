# Common Patterns

Reusable patterns for react-basecamp projects.

## tRPC API Pattern

### Router Structure

```typescript
// src/server/routers/workItem.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const workItemRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["open", "in_progress", "done", "blocked"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const items = await ctx.db.workItem.findMany({
        where: input.status ? { status: input.status } : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.workItem.create({ data: input });
    }),
});
```

### Error Handling

```typescript
import { TRPCError } from "@trpc/server";

// Standard error codes
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Work item not found",
});

throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid input",
});

throw new TRPCError({
  code: "CONFLICT",
  message: "Work item was modified by another user",
  cause: { currentVersion: item.updatedAt },
});
```

## Prisma Patterns

### Repository Pattern

```typescript
// src/lib/repositories/workItem.ts
import { db } from "@/lib/db";
import type { WorkItem, Prisma } from "@prisma/client";

export const workItemRepository = {
  findById: (id: string) => db.workItem.findUnique({ where: { id } }),

  findMany: (filters?: Prisma.WorkItemWhereInput) =>
    db.workItem.findMany({ where: filters }),

  create: (data: Prisma.WorkItemCreateInput) => db.workItem.create({ data }),

  update: (id: string, data: Prisma.WorkItemUpdateInput) =>
    db.workItem.update({ where: { id }, data }),

  delete: (id: string) => db.workItem.delete({ where: { id } }),
};
```

### Optimistic Updates

```typescript
// Client-side with tRPC
const utils = trpc.useUtils();

const mutation = trpc.workItem.update.useMutation({
  onMutate: async (newData) => {
    await utils.workItem.get.cancel({ id: newData.id });
    const previous = utils.workItem.get.getData({ id: newData.id });
    utils.workItem.get.setData({ id: newData.id }, (old) => ({
      ...old!,
      ...newData,
    }));
    return { previous };
  },
  onError: (err, newData, context) => {
    utils.workItem.get.setData({ id: newData.id }, context?.previous);
  },
  onSettled: () => {
    utils.workItem.get.invalidate();
  },
});
```

## React Patterns

### Custom Hook Pattern

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### Loading State Pattern

```typescript
// Discriminated union for async state
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function useAsync<T>(asyncFn: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  useEffect(() => {
    setState({ status: "loading" });
    asyncFn()
      .then((data) => setState({ status: "success", data }))
      .catch((error) => setState({ status: "error", error }));
  }, [asyncFn]);

  return state;
}
```

### Component Composition

```typescript
// Compound component pattern
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
)

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="card-header">{children}</div>
)

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="card-body">{children}</div>
)

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

## State Management (Zustand)

```typescript
// src/stores/workItemStore.ts
import { create } from "zustand";

interface WorkItemState {
  selectedId: string | null;
  filters: WorkItemFilters;
  setSelected: (id: string | null) => void;
  setFilters: (filters: Partial<WorkItemFilters>) => void;
}

export const useWorkItemStore = create<WorkItemState>((set) => ({
  selectedId: null,
  filters: { status: "all" },
  setSelected: (id) => set({ selectedId: id }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
```

## API Response Format

Standard format for all API responses:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
```

## File Naming Conventions

| Type       | Pattern                   | Example                        |
| ---------- | ------------------------- | ------------------------------ |
| Components | PascalCase                | `WorkItemCard.tsx`             |
| Hooks      | camelCase with use prefix | `useWorkItems.ts`              |
| Utilities  | camelCase                 | `formatDate.ts`                |
| Types      | PascalCase                | `WorkItem.ts`                  |
| Constants  | SCREAMING_SNAKE           | `export const MAX_ITEMS = 100` |
| Tests      | .test.ts(x) suffix        | `WorkItemCard.test.tsx`        |
| E2E Tests  | .spec.ts suffix           | `workItem.spec.ts`             |
