---
name: tdd-workflow
description: Test-Driven Development workflow skill. Use when writing new features, fixing bugs, or refactoring code. Enforces tests-first with 70%+ coverage.
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles.

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints (tRPC routers)
- Creating new components

## Core Principles

### 1. Tests BEFORE Code

ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements

- Minimum 70% line coverage
- Minimum 60% branch coverage
- All edge cases covered
- Error scenarios tested

### 3. Test Types Required

| Type        | Framework  | Location        | Purpose                          |
| ----------- | ---------- | --------------- | -------------------------------- |
| Unit        | Vitest     | `*.test.ts(x)`  | Functions, components, utilities |
| Integration | Vitest     | `*.test.ts`     | API routes, database operations  |
| E2E         | Playwright | `e2e/*.spec.ts` | Critical user flows              |

## TDD Workflow (Red-Green-Refactor)

### Step 1: Write Failing Test (RED)

```typescript
// src/lib/formatDate.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats ISO date to readable string", () => {
    const result = formatDate("2026-01-24T10:30:00Z");
    expect(result).toBe("January 24, 2026");
  });

  it("handles invalid dates gracefully", () => {
    const result = formatDate("invalid");
    expect(result).toBe("Invalid date");
  });
});
```

### Step 2: Run Test - It Should FAIL

```bash
pnpm test formatDate
# ❌ Tests fail - function doesn't exist yet
```

### Step 3: Write Minimal Implementation (GREEN)

```typescript
// src/lib/formatDate.ts
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

### Step 4: Run Test - It Should PASS

```bash
pnpm test formatDate
# ✅ All tests pass
```

### Step 5: Refactor (IMPROVE)

Improve code quality while keeping tests green:

- Extract helper functions
- Improve naming
- Add edge case handling

### Step 6: Verify Coverage

```bash
pnpm test:run --coverage
# Verify 70%+ coverage achieved
```

## Test Patterns

### Unit Test Pattern (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### tRPC Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createInnerTRPCContext } from "@/server/trpc";
import { workItemRouter } from "./workItem";

describe("workItemRouter", () => {
  const ctx = createInnerTRPCContext({ session: null });
  const caller = workItemRouter.createCaller(ctx);

  it("creates a work item", async () => {
    const result = await caller.create({
      title: "Test Item",
      description: "Test description",
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe("Test Item");
  });

  it("validates required fields", async () => {
    await expect(caller.create({ title: "" })).rejects.toThrow();
  });
});
```

### E2E Test Pattern (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("user can create a work item", async ({ page }) => {
  await page.goto("/work-items");

  // Click create button
  await page.click('[data-testid="create-button"]');

  // Fill form
  await page.fill('[data-testid="title-input"]', "New Work Item");
  await page.fill('[data-testid="description-input"]', "Description");

  // Submit
  await page.click('[data-testid="submit-button"]');

  // Verify created
  await expect(page.locator('[data-testid="work-item-title"]')).toContainText(
    "New Work Item"
  );
});
```

## Test File Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx      # Co-located unit test
├── lib/
│   ├── formatDate.ts
│   └── formatDate.test.ts   # Co-located unit test
└── server/
    └── routers/
        ├── workItem.ts
        └── workItem.test.ts # Integration test

e2e/
├── workItem.spec.ts         # E2E tests
└── workflow.spec.ts
```

## Mocking Patterns

### Mock Prisma

```typescript
import { vi } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const prismaMock = mockDeep<PrismaClient>();

vi.mock("@/lib/db", () => ({
  db: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});

// In test
prismaMock.workItem.findMany.mockResolvedValue([
  { id: "1", title: "Test", status: "open" },
]);
```

### Mock External APIs

```typescript
import { vi } from "vitest";

vi.mock("@/lib/anthropic", () => ({
  generateResponse: vi.fn().mockResolvedValue({
    content: "Mocked response",
  }),
}));
```

## Common Testing Mistakes

### ❌ Testing Implementation Details

```typescript
// BAD: Testing internal state
expect(component.state.isLoading).toBe(false);
```

### ✅ Test User-Visible Behavior

```typescript
// GOOD: Test what users see
expect(screen.getByText("Loading...")).not.toBeInTheDocument();
```

### ❌ Brittle Selectors

```typescript
// BAD: Breaks easily
await page.click(".btn-primary-large");
```

### ✅ Semantic Selectors

```typescript
// GOOD: Resilient to styling changes
await page.click('[data-testid="submit-button"]');
await page.click('button:has-text("Submit")');
```

### ❌ No Test Isolation

```typescript
// BAD: Tests share state
let user;
test("creates user", () => {
  user = createUser();
});
test("updates user", () => {
  updateUser(user);
}); // Depends on previous
```

### ✅ Independent Tests

```typescript
// GOOD: Each test is independent
test("creates user", () => {
  const user = createTestUser();
  // ...
});

test("updates user", () => {
  const user = createTestUser();
  // ...
});
```

## Test Commands

```bash
pnpm test              # Watch mode (development)
pnpm test:run          # Single run (CI)
pnpm test:run --coverage  # With coverage report
pnpm test:e2e          # Playwright E2E tests
pnpm test:e2e --ui     # Playwright UI mode
```

## Coverage Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 70,
    branches: 60,
    functions: 70,
    statements: 70
  }
}
```

## Success Metrics

- [ ] Tests written BEFORE implementation
- [ ] All tests passing (green)
- [ ] Coverage ≥ 70% lines
- [ ] Coverage ≥ 60% branches
- [ ] No skipped tests
- [ ] Fast execution (unit tests < 30s total)
- [ ] E2E tests cover critical paths

---

**Remember**: Tests are not optional. They enable confident refactoring, rapid development, and production reliability. Write tests first, always.
