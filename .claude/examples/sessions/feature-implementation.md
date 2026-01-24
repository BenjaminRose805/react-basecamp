# Example Session: Feature Implementation

This example shows a complete feature implementation workflow using the 3-agent pattern with SDD/TDD.

## Session Goal

Implement a "work item filter" feature.

---

## Phase 1: Specification (SDD)

### User Request

```
Add filtering to the work items list - users should be able to filter by status
```

### Agent: spec-researcher

```
Research Results:
- Found: src/components/WorkItemList.tsx (existing component)
- Found: src/server/routers/workItem.ts (existing router)
- Found: No existing filter implementation
- Patterns: Uses tRPC + React Query
- Recommendation: PROCEED

Key Context:
- WorkItem has status: 'open' | 'in_progress' | 'done' | 'blocked'
- Current list loads all items via trpc.workItem.list.useQuery()
```

### Agent: spec-writer

Created: `specs/work-item-filter.md`

```markdown
# Work Item Filter

## Goal

Allow users to filter work items by status.

## Scope

- IN: Status filter dropdown
- IN: URL persistence for filter state
- OUT: Multiple filter types (later feature)

## Acceptance Criteria

- [ ] Filter dropdown shows all statuses + "All"
- [ ] Selecting status filters the list
- [ ] Filter persists in URL (?status=open)
- [ ] Empty state shows "No items match filter"

## Technical Approach

1. Add `status` query param to tRPC endpoint
2. Create FilterDropdown component
3. Use URL search params for state
```

### Agent: spec-qa

```
Spec Validation: PASS
- Template compliance: OK
- Acceptance criteria: Measurable
- Technical approach: Follows patterns
```

---

## Phase 2: Write Tests (TDD - Red)

### Agent: test-researcher

```
Research Results:
- Test patterns: Vitest + React Testing Library
- Existing tests: src/server/routers/workItem.test.ts
- Mocking: Uses mockDeep<PrismaClient>
- Recommendation: PROCEED
```

### Agent: test-writer

Created: `src/components/WorkItemFilter.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkItemFilter } from './WorkItemFilter'

describe('WorkItemFilter', () => {
  it('renders all status options', () => {
    render(<WorkItemFilter value={null} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  it('calls onChange when status selected', () => {
    const onChange = vi.fn()
    render(<WorkItemFilter value={null} onChange={onChange} />)

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'open' }
    })

    expect(onChange).toHaveBeenCalledWith('open')
  })
})
```

Updated: `src/server/routers/workItem.test.ts`

```typescript
describe("workItemRouter.list", () => {
  it("filters by status when provided", async () => {
    mockPrisma.workItem.findMany.mockResolvedValue([
      { id: "1", title: "Open Item", status: "open" },
    ]);

    const result = await caller.list({ status: "open" });

    expect(mockPrisma.workItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "open" },
      })
    );
    expect(result.items).toHaveLength(1);
  });

  it("returns all items when no status filter", async () => {
    mockPrisma.workItem.findMany.mockResolvedValue([
      { id: "1", status: "open" },
      { id: "2", status: "done" },
    ]);

    const result = await caller.list({});

    expect(mockPrisma.workItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      })
    );
    expect(result.items).toHaveLength(2);
  });
});
```

### Agent: test-qa

```
Test Validation: PASS
- Tests are failing (RED state - correct for TDD)
- Coverage will be: ~75% after implementation
- Assertions: Clear and focused
```

---

## Phase 3: Implementation (TDD - Green)

### Agent: code-researcher

```
Research Results:
- Pattern: Use Zod enum for status validation
- Router: Add optional status to input schema
- Component: Create new FilterDropdown
- Integration: Update WorkItemList to use filter
- Recommendation: PROCEED
```

### Agent: code-writer

Created: `src/components/WorkItemFilter.tsx`

```typescript
import { WorkItemStatus } from '@/types/WorkItem'

interface WorkItemFilterProps {
  value: WorkItemStatus | null
  onChange: (status: WorkItemStatus | null) => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' }
] as const

export function WorkItemFilter({ value, onChange }: WorkItemFilterProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="filter-select"
    >
      {STATUS_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
```

Updated: `src/server/routers/workItem.ts`

```typescript
list: publicProcedure
  .input(
    z.object({
      status: z.enum(["open", "in_progress", "done", "blocked"]).optional(),
      limit: z.number().min(1).max(100).default(20),
    })
  )
  .query(async ({ input, ctx }) => {
    const items = await ctx.db.workItem.findMany({
      where: input.status ? { status: input.status } : undefined,
      take: input.limit,
    });
    return { items };
  });
```

Updated: `src/components/WorkItemList.tsx`

```typescript
export function WorkItemList() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') as WorkItemStatus | null

  const { data, isLoading } = trpc.workItem.list.useQuery({ status })

  const handleFilterChange = (newStatus: WorkItemStatus | null) => {
    const params = new URLSearchParams(searchParams)
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div>
      <WorkItemFilter value={status} onChange={handleFilterChange} />
      {isLoading ? <Loading /> : (
        data?.items.length ? (
          <ul>
            {data.items.map(item => (
              <WorkItemCard key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState message="No items match filter" />
        )
      )}
    </div>
  )
}
```

### Agent: code-qa

```
Validation Results: PASS

Type Check: OK
Tests: 8/8 passing
Lint: OK
Coverage: 76%

All acceptance criteria met:
- [x] Filter dropdown shows all statuses + "All"
- [x] Selecting status filters the list
- [x] Filter persists in URL
- [x] Empty state shows message
```

---

## Phase 4: Security & Review

### Agent: security-auditor

```
Security Scan: PASS

- Input validation: Zod enum prevents invalid values
- SQL injection: Prisma parameterized queries used
- XSS: React escaping in place
- No secrets exposed
- No console.log statements
```

### Agent: pr-reviewer

```
Code Review: APPROVED

Quality:
- Follows existing patterns
- Small, focused functions
- Proper TypeScript types
- Good test coverage

Suggestions (optional):
- Consider debouncing rapid filter changes
- Could add filter count badge (future feature)
```

---

## Phase 5: Commit

```bash
git add src/components/WorkItemFilter.tsx
git add src/components/WorkItemFilter.test.tsx
git add src/components/WorkItemList.tsx
git add src/server/routers/workItem.ts
git add src/server/routers/workItem.test.ts
git add specs/work-item-filter.md

git commit -m "feat: add work item status filter

- Add FilterDropdown component with all status options
- Update tRPC router to accept status filter
- Persist filter state in URL params
- Add empty state for no matching items

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Session Summary

| Phase    | Agent Flow                 | Result       |
| -------- | -------------------------- | ------------ |
| Spec     | researcher -> writer -> qa | PASS         |
| Test     | researcher -> writer -> qa | PASS (RED)   |
| Code     | researcher -> writer -> qa | PASS (GREEN) |
| Security | auditor                    | PASS         |
| Review   | reviewer                   | APPROVED     |

Total agents used: 11
Methodology: SDD + TDD
Coverage: 76%
