---
name: coding-standards
description: Universal coding standards for TypeScript, React, and Next.js development. Reference when writing code, reviewing changes, or establishing patterns.
---

# Coding Standards & Best Practices

Universal coding standards for TypeScript projects.

## When Used

| Agent      | Phase     |
| ---------- | --------- |
| code-agent | IMPLEMENT |
| ui-agent   | BUILD     |

## Code Quality Principles

### 1. Readability First

- Code is read more than written
- Clear variable and function names
- Self-documenting code preferred over comments
- Consistent formatting (Prettier enforced)

### 2. KISS (Keep It Simple, Stupid)

- Simplest solution that works
- Avoid over-engineering
- No premature optimization
- Easy to understand > clever code

### 3. DRY (Don't Repeat Yourself)

- Extract common logic into functions
- Create reusable components
- Share utilities across modules
- But don't over-abstract too early

### 4. YAGNI (You Aren't Gonna Need It)

- Don't build features before they're needed
- Avoid speculative generality
- Add complexity only when required
- Start simple, refactor when needed

## TypeScript Standards

### Variable Naming

```typescript
// ✅ GOOD: Descriptive names
const workItemStatus = "in_progress";
const isUserAuthenticated = true;
const totalExecutionCount = 42;

// ❌ BAD: Unclear names
const s = "in_progress";
const flag = true;
const x = 42;
```

### Function Naming

```typescript
// ✅ GOOD: Verb-noun pattern
async function fetchWorkItem(id: string): Promise<WorkItem> {}
function calculateDependencyGraph(items: WorkItem[]): Graph {}
function isValidWorkflowConfig(config: unknown): config is WorkflowConfig {}

// ❌ BAD: Unclear or noun-only
async function workItem(id: string) {}
function graph(items) {}
function valid(c) {}
```

### Immutability (CRITICAL)

```typescript
// ✅ ALWAYS use spread operator
const updatedItem = {
  ...workItem,
  status: "done",
};

const updatedList = [...items, newItem];
const filteredList = items.filter((item) => item.status !== "done");

// ❌ NEVER mutate directly
workItem.status = "done"; // BAD!
items.push(newItem); // BAD!
```

### Type Safety

```typescript
// ✅ GOOD: Explicit types, discriminated unions
interface WorkItem {
  id: string;
  title: string;
  status: "open" | "in_progress" | "done" | "blocked";
  createdAt: Date;
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ❌ BAD: Using 'any'
function processItem(item: any): any {}
```

### Error Handling

```typescript
// ✅ GOOD: Comprehensive with typed errors
import { TRPCError } from "@trpc/server";

async function fetchWorkItem(id: string): Promise<WorkItem> {
  const item = await db.workItem.findUnique({ where: { id } });

  if (!item) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Work item ${id} not found`,
    });
  }

  return item;
}

// ❌ BAD: Silent failure or generic errors
async function fetchWorkItem(id: string) {
  const item = await db.workItem.findUnique({ where: { id } });
  return item; // Could be null!
}
```

### Async/Await

```typescript
// ✅ GOOD: Parallel execution when possible
const [workItems, workflows, agents] = await Promise.all([
  fetchWorkItems(),
  fetchWorkflows(),
  fetchAgents(),
]);

// ❌ BAD: Sequential when unnecessary
const workItems = await fetchWorkItems();
const workflows = await fetchWorkflows();
const agents = await fetchAgents();
```

## React Standards

### Component Structure

```typescript
// ✅ GOOD: Typed props, clear structure
interface WorkItemCardProps {
  item: WorkItem
  onSelect: (id: string) => void
  isSelected?: boolean
}

export function WorkItemCard({
  item,
  onSelect,
  isSelected = false
}: WorkItemCardProps) {
  const handleClick = () => onSelect(item.id)

  return (
    <div
      className={cn('card', isSelected && 'card-selected')}
      onClick={handleClick}
    >
      <h3>{item.title}</h3>
      <StatusBadge status={item.status} />
    </div>
  )
}
```

### Custom Hooks

```typescript
// ✅ GOOD: Reusable, well-typed hook
export function useWorkItem(id: string) {
  const query = trpc.workItem.get.useQuery({ id });

  return {
    item: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### State Updates

```typescript
// ✅ GOOD: Functional updates for derived state
const [items, setItems] = useState<WorkItem[]>([]);

// Use functional update when new state depends on old
setItems((prev) => [...prev, newItem]);
setItems((prev) => prev.filter((item) => item.id !== idToRemove));

// ❌ BAD: Direct state reference (can be stale)
setItems([...items, newItem]);
```

### Conditional Rendering

```typescript
// ✅ GOOD: Clear conditions
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ❌ BAD: Ternary chains
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Data /> : null}
```

## File Organization

### Size Limits (ESLint Enforced)

| Metric                | Limit |
| --------------------- | ----- |
| Lines per function    | 30    |
| Cyclomatic complexity | 10    |
| Nesting depth         | 4     |
| Function parameters   | 4     |

### File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (tRPC)
│   └── (routes)/          # Page routes
├── components/            # React components
│   ├── ui/               # Base UI (shadcn/ui)
│   └── features/         # Feature-specific
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
│   ├── db.ts            # Prisma client
│   ├── trpc.ts          # tRPC setup
│   └── utils/           # Helper functions
├── server/              # Server-side code
│   └── routers/         # tRPC routers
└── types/               # TypeScript types
```

### Naming Conventions

| Type       | Pattern         | Example            |
| ---------- | --------------- | ------------------ |
| Components | PascalCase      | `WorkItemCard.tsx` |
| Hooks      | camelCase + use | `useWorkItem.ts`   |
| Utilities  | camelCase       | `formatDate.ts`    |
| Types      | PascalCase      | `WorkItem.ts`      |
| Constants  | SCREAMING_SNAKE | `MAX_ITEMS`        |
| Tests      | .test.ts(x)     | `Button.test.tsx`  |
| E2E Tests  | .spec.ts        | `workflow.spec.ts` |

## Comments & Documentation

### When to Comment

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during outages
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

// Deliberately using mutation for performance with 10k+ items
items.sort((a, b) => a.priority - b.priority);

// ❌ BAD: Stating the obvious
// Increment counter by 1
counter++;

// Set title to item title
title = item.title;
```

### JSDoc for Exported Functions

```typescript
/**
 * Calculates the dependency graph for work items.
 *
 * @param items - Work items to analyze
 * @returns DAG with dependency relationships
 * @throws {CyclicDependencyError} If circular dependency detected
 *
 * @example
 * const graph = buildDependencyGraph(workItems)
 * const sorted = graph.topologicalSort()
 */
export function buildDependencyGraph(items: WorkItem[]): DependencyGraph {
  // Implementation
}
```

## Code Smells to Avoid

### 1. Long Functions (>30 lines)

```typescript
// ❌ BAD
function processWorkflow() {
  // 50+ lines of code
}

// ✅ GOOD
function processWorkflow() {
  const validated = validateInput();
  const nodes = buildNodeGraph(validated);
  return executeNodes(nodes);
}
```

### 2. Deep Nesting (>4 levels)

```typescript
// ❌ BAD
if (user) {
  if (user.isAdmin) {
    if (workflow) {
      if (workflow.isActive) {
        // Do something
      }
    }
  }
}

// ✅ GOOD: Early returns
if (!user) return;
if (!user.isAdmin) return;
if (!workflow) return;
if (!workflow.isActive) return;

// Do something
```

### 3. Magic Numbers

```typescript
// ❌ BAD
if (retryCount > 3) {
}
setTimeout(callback, 500);

// ✅ GOOD
const MAX_RETRIES = 3;
const DEBOUNCE_DELAY_MS = 500;

if (retryCount > MAX_RETRIES) {
}
setTimeout(callback, DEBOUNCE_DELAY_MS);
```

### 4. Boolean Parameters

```typescript
// ❌ BAD: What does true mean?
fetchItems(true, false);

// ✅ GOOD: Use options object
fetchItems({ includeArchived: true, sortDesc: false });
```

## Performance Considerations

### Memoization

```typescript
import { useMemo, useCallback, memo } from "react";

// Memoize expensive computations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.priority - b.priority),
  [items]
);

// Memoize callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelected(id);
}, []);

// Memoize components with expensive renders
const WorkItemList = memo(function WorkItemList({ items }: Props) {
  // ...
});
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

const WorkflowDesigner = lazy(() => import('./WorkflowDesigner'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <WorkflowDesigner />
    </Suspense>
  )
}
```

### Database Queries

```typescript
// ✅ GOOD: Select only needed fields
const items = await db.workItem.findMany({
  select: { id: true, title: true, status: true },
  take: 20,
});

// ❌ BAD: Select everything
const items = await db.workItem.findMany();
```

## Checklist Before Committing

- [ ] Code follows immutability patterns
- [ ] Functions are under 30 lines
- [ ] No deep nesting (max 4 levels)
- [ ] Proper error handling with typed errors
- [ ] No console.log statements
- [ ] No hardcoded values (use constants)
- [ ] Types are explicit (no `any`)
- [ ] Tests written and passing
- [ ] No TODO/FIXME in production code

---

**Remember**: Clear, maintainable code enables rapid development and confident refactoring. Quality is not negotiable.
