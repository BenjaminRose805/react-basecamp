# Development Methodology

React-basecamp uses a hybrid development methodology combining SDD, TDD, and EDD.

## Overview

| Methodology | Use For            | Key Principle               |
| ----------- | ------------------ | --------------------------- |
| **SDD**     | All features       | Specs before code           |
| **TDD**     | Deterministic code | Tests before implementation |
| **EDD**     | LLM features       | Evals before AI code        |

## Spec-Driven Development (SDD)

**Principle:** Write specifications before code. Specs are the source of truth.

### When to Use

- All new features
- Major changes to existing features
- Any work that will take more than 30 minutes

### Workflow

```
1. /distill or /spec
   └── Create specification document
   └── Define acceptance criteria
   └── Get user approval

2. Implement to spec
   └── Spec is source of truth
   └── Ask questions if spec is unclear
   └── Update spec if requirements change
```

### Spec Template

Every spec must include:

- **Goal**: What problem does this solve?
- **Scope**: What's included and excluded?
- **Acceptance Criteria**: How do we know it's done?
- **Technical Approach**: How will it be built?
- **Dependencies**: What must exist first?

## Test-Driven Development (TDD)

**Principle:** Write tests before implementation. Tests drive the design.

### When to Use

- All deterministic code
- Business logic
- Utilities and helpers
- API endpoints
- Component behavior

### Workflow (Red-Green-Refactor)

```
1. RED: Write a failing test
   └── Test describes expected behavior
   └── Run test - MUST fail
   └── Failure message should be helpful

2. GREEN: Write minimal code to pass
   └── Only enough to make test pass
   └── Don't over-engineer
   └── Run test - MUST pass

3. REFACTOR: Improve code quality
   └── Clean up while tests stay green
   └── Extract duplication
   └── Improve naming
   └── Run tests - MUST still pass

4. REPEAT for next behavior
```

### Example

```typescript
// 1. RED - Write failing test
it("validates email format", () => {
  expect(isValidEmail("invalid")).toBe(false);
  expect(isValidEmail("test@example.com")).toBe(true);
});

// 2. GREEN - Minimal implementation
function isValidEmail(email: string): boolean {
  return email.includes("@");
}

// 3. REFACTOR - Improve
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## Evaluation-Driven Development (EDD)

**Principle:** Define success criteria before building AI features. Use evaluations to measure quality.

### When to Use

- LLM-powered features
- Agent behaviors
- Non-deterministic outputs
- Prompt engineering

### When NOT to Use

- CRUD operations
- Deterministic logic
- Standard UI components

### Workflow

```
1. /eval research
   └── Identify LLM touchpoints
   └── Define evaluation dimensions
   └── Determine grading strategy

2. /eval write
   └── Create test cases
   └── Implement graders
   └── Set pass thresholds

3. Implement feature
   └── Build to pass evaluations
   └── Iterate on prompts

4. Run evals
   └── pnpm eval [feature]
   └── Analyze failures
   └── Improve until passing
```

### Eval Structure

```
evals/
└── agent-builder/
    ├── config.ts      # Dimensions, thresholds
    ├── cases/         # Test cases
    ├── graders/       # Evaluation logic
    └── index.ts       # Export
```

### Key Metrics

- **pass@1**: Passes on first attempt
- **pass@k**: Passes within k attempts
- **Consistency**: Same input → similar outputs
- **Latency**: Response time acceptable

## Command Mapping

| Task              | Methodology | Command    |
| ----------------- | ----------- | ---------- |
| Design doc → Spec | SDD         | `/distill` |
| New feature spec  | SDD         | `/spec`    |
| Write tests       | TDD         | `/test`    |
| Write evals       | EDD         | `/eval`    |
| Implement code    | TDD         | `/code`    |

## Decision Tree

```
New Feature Request
│
├─ Is it already designed?
│  ├─ Yes → /distill (convert docs to spec)
│  └─ No → /spec (write new spec)
│
├─ Does it involve LLM?
│  ├─ Yes → /eval (write evaluations)
│  └─ No → Skip evals
│
├─ Write tests
│  └─ /test (TDD - tests first)
│
└─ Implement
   └─ /code (make tests pass)
```

## Quality Gates

Every feature must pass these gates:

| Gate                | Check              | Command     |
| ------------------- | ------------------ | ----------- |
| Spec Approved       | User sign-off      | `/spec qa`  |
| Tests Written       | Coverage > 70%     | `/test qa`  |
| Evals Pass (if LLM) | pass@1 > 80%       | `pnpm eval` |
| Implementation Done | Tests pass         | `/code qa`  |
| Security Clear      | No vulnerabilities | `/security` |
| Review Approved     | Final sign-off     | `/review`   |
