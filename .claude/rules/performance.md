# Performance Optimization

Performance guidelines for development and AI-assisted coding.

## Model Selection Strategy

Choose the right model for the task:

| Model      | Use For                                   | Cost   |
| ---------- | ----------------------------------------- | ------ |
| **Haiku**  | QA agents, verification, simple tasks     | Low    |
| **Sonnet** | Main development, coding, orchestration   | Medium |
| **Opus**   | Architecture, complex reasoning, research | High   |

### Agent Model Assignment

| Agent Type        | Recommended Model | Reasoning                        |
| ----------------- | ----------------- | -------------------------------- |
| Orchestrators     | Opus              | Coordination, routing decisions  |
| \*-researcher     | Opus              | Deep analysis, pattern finding   |
| \*-analyzer       | Opus              | Investigation, security analysis |
| \*-writer/builder | Sonnet            | Code generation, documentation   |
| \*-validator      | Haiku             | Verification, checklist-based    |
| \*-executor       | Haiku             | Command execution, simple tasks  |

## Context Window Management

### Avoid Last 20% of Context For:

- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions
- Multi-file changes

### Lower Context Sensitivity Tasks:

- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

### Strategic Compaction

Use `/compact` at logical breakpoints:

- After completing research, before implementation
- After finishing a feature, before starting next
- When switching between unrelated tasks
- After 50+ tool calls (hook will remind you)

## React Performance

### Component Optimization

```typescript
// Memoize expensive components
const ExpensiveList = memo(function ExpensiveList({ items }: Props) {
  return items.map(item => <Item key={item.id} {...item} />)
})

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// Memoize computed values
const sortedItems = useMemo(() =>
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
)
```

### Lazy Loading

```typescript
// Lazy load routes
const WorkflowDesigner = lazy(() => import('./WorkflowDesigner'))

// With Suspense
<Suspense fallback={<Loading />}>
  <WorkflowDesigner />
</Suspense>
```

## Database Performance

### Prisma Query Optimization

```typescript
// BAD: N+1 query
const items = await db.workItem.findMany();
for (const item of items) {
  item.tasks = await db.task.findMany({ where: { workItemId: item.id } });
}

// GOOD: Include relation
const items = await db.workItem.findMany({
  include: { tasks: true },
});

// GOOD: Select only needed fields
const items = await db.workItem.findMany({
  select: {
    id: true,
    title: true,
    status: true,
  },
});
```

### Pagination

Always paginate large queries:

```typescript
const items = await db.workItem.findMany({
  take: 20, // Limit
  skip: (page - 1) * 20, // Offset
  orderBy: { createdAt: "desc" },
});
```

## Build Troubleshooting

If build fails:

1. Check error messages carefully
2. Run `/plan` to investigate if complex
3. Fix incrementally (one issue at a time)
4. Verify after each fix with `pnpm build`

Common build issues:

- Missing dependencies → `pnpm install`
- Type errors → `pnpm typecheck`
- Import errors → Check file paths
- Environment variables → Check `.env.local`

## Bundle Size

### Monitor Bundle Size

```bash
# Analyze bundle
pnpm build && npx @next/bundle-analyzer
```

### Reduce Bundle Size

- Use dynamic imports for large components
- Import specific functions, not entire libraries
- Tree-shake unused code
- Use server components where possible (Next.js App Router)

```typescript
// BAD: Import entire library
import _ from "lodash";

// GOOD: Import specific function
import debounce from "lodash/debounce";
```
