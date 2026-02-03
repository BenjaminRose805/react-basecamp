---
name: check-agent
description: Quality verification across all dimensions
---

# Check Agent

Quality verification across all dimensions.

## Sub-Agents (1)

```text
check-agent (orchestrator)
└── quality-runner (Haiku) - Run all checks, report results
```

| Agent          | Model | Purpose                                 |
| -------------- | ----- | --------------------------------------- |
| quality-runner | Haiku | Run build, types, lint, tests, security |

## Skills Used

- **qa-checks** - Build, types, lint, tests
- **security-patterns** - Secret detection, input validation

## Execution Flow

```text
/check
  │
  └─► quality-runner (Haiku)
      ├─ pnpm build (blocking - stop if fails)
      ├─ pnpm typecheck
      ├─ pnpm lint
      ├─ pnpm test:run
      └─ Security scan (grep for secrets, console.log)

      Return: { results[], overall_passed }
```

## Instructions

> **CRITICAL EXECUTION REQUIREMENT**
>
> Use Task tool to spawn quality-runner. DO NOT run checks directly.
>
> ```typescript
> Task({
>   subagent_type: "general-purpose",
>   description: "Run quality checks",
>   prompt: `Run all quality checks in order:
> 1. pnpm build (stop if fails)
> 2. pnpm typecheck
> 3. pnpm lint
> 4. pnpm test:run
> 5. Security: grep for secrets, console.log in src/
> 
> Return: {
>   build: { passed, error? },
>   types: { passed, errors[] },
>   lint: { passed, errors[] },
>   tests: { passed, coverage, failures[] },
>   security: { passed, issues[] },
>   overall_passed: boolean
> }`,
>   model: "haiku",
> });
> ```

## Quality Gates

| Check    | Requirement                | Blocking |
| -------- | -------------------------- | -------- |
| Build    | Must compile               | Yes      |
| Types    | 0 errors                   | Yes      |
| Lint     | 0 errors                   | Yes      |
| Tests    | All pass, 70%+ coverage    | Yes      |
| Security | No secrets, no console.log | Yes      |

## Output

### All Pass

```text
┌─────────────────────────────────────────────────────────────┐
│  QUALITY CHECK RESULTS                                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ Build      PASS                                          │
│  ✓ Types      PASS                                          │
│  ✓ Lint       PASS                                          │
│  ✓ Tests      PASS   (85% coverage)                         │
│  ✓ Security   PASS                                          │
├─────────────────────────────────────────────────────────────┤
│  TOTAL: PASS                                                │
└─────────────────────────────────────────────────────────────┘
```

### Some Fail

```text
┌─────────────────────────────────────────────────────────────┐
│  QUALITY CHECK RESULTS                                      │
├─────────────────────────────────────────────────────────────┤
│  ✓ Build      PASS                                          │
│  ✗ Types      FAIL                                          │
│    └─ src/lib/auth.ts:42 - Type error                       │
│  ✓ Lint       PASS                                          │
│  ✓ Tests      PASS                                          │
│  ✓ Security   PASS                                          │
├─────────────────────────────────────────────────────────────┤
│  TOTAL: FAIL (1 check failed)                               │
└─────────────────────────────────────────────────────────────┘
```
