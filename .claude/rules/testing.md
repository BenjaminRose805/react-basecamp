# Testing Requirements

Testing rules for react-basecamp projects following TDD methodology.

## Coverage Requirements

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Lines      | 70%     | 80%    |
| Branches   | 60%     | 70%    |
| Functions  | 70%     | 80%    |
| Statements | 70%     | 80%    |

## Test Types

All test types are required for production code:

### 1. Unit Tests (Vitest)

Individual functions, utilities, components:

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

### 2. Integration Tests (Vitest)

API endpoints, database operations:

```typescript
// src/server/routers/workItem.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext } from "@/test/utils";
import { workItemRouter } from "./workItem";

describe("workItemRouter", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext();
  });

  it("creates a work item", async () => {
    const caller = workItemRouter.createCaller(ctx);
    const result = await caller.create({
      title: "Test Item",
      description: "Test description",
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe("Test Item");
  });
});
```

### 3. E2E Tests (Playwright)

Critical user flows:

```typescript
// e2e/workItem.spec.ts
import { test, expect } from "@playwright/test";

test("user can create a work item", async ({ page }) => {
  await page.goto("/work-items");
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="title-input"]', "New Work Item");
  await page.click('[data-testid="submit-button"]');

  await expect(page.locator('[data-testid="work-item-title"]')).toContainText(
    "New Work Item"
  );
});
```

## Test-Driven Development (TDD)

MANDATORY workflow for all new features:

```
1. Write test first (RED)
   └── Test should clearly describe expected behavior
   └── Run test - it MUST fail

2. Write minimal implementation (GREEN)
   └── Only enough code to pass the test
   └── Run test - it MUST pass

3. Refactor (IMPROVE)
   └── Clean up code while keeping tests green
   └── Extract helpers, improve naming
   └── Verify tests still pass

4. Repeat for next feature
```

### TDD Example

```typescript
// Step 1: Write test (RED)
describe("calculateTotal", () => {
  it("sums item prices with tax", () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items, 0.1)).toBe(33); // 30 + 10% tax
  });
});

// Step 2: Run test - FAILS (function doesn't exist)

// Step 3: Write implementation (GREEN)
function calculateTotal(items: Item[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}

// Step 4: Run test - PASSES

// Step 5: Refactor if needed
```

## Test Organization

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
├── workflow.spec.ts
└── fixtures/                # Test data
```

## Test Commands

```bash
pnpm test              # Watch mode (development)
pnpm test:run          # Single run (CI)
pnpm test:coverage     # With coverage report
pnpm test:e2e          # Playwright E2E tests
pnpm test:e2e:ui       # Playwright UI mode
```

## Mocking Patterns

### Mock External Services

```typescript
import { vi } from "vitest";

vi.mock("@/lib/anthropic", () => ({
  generateResponse: vi.fn().mockResolvedValue({
    content: "Mocked response",
  }),
}));
```

### Mock Prisma

```typescript
import { vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const mockPrisma = mockDeep<PrismaClient>();

mockPrisma.workItem.findMany.mockResolvedValue([
  { id: "1", title: "Test Item", status: "open" },
]);
```

## Test Quality Checklist

Before marking tests complete:

- [ ] Tests describe behavior, not implementation
- [ ] Each test has a single assertion focus
- [ ] Test names are descriptive (it('should X when Y'))
- [ ] No console.log in tests
- [ ] Tests are deterministic (no flaky tests)
- [ ] Proper cleanup in afterEach/afterAll
- [ ] Mocks are properly reset between tests
- [ ] Coverage meets minimum requirements

## Troubleshooting Test Failures

1. Use `/debug` command to investigate
2. Check test isolation (tests affecting each other)
3. Verify mocks are correct and reset
4. Fix implementation, not tests (unless tests are wrong)
5. Add console.log temporarily, then remove
