# /check - Quality Verification

Run comprehensive quality checks.

## Usage

```
/check              # Full verification (all phases)
/check build        # Build check only
/check types        # Type check only
/check lint         # Lint check only
/check tests        # Tests with coverage
/check security     # Security scan only
```

## Examples

```bash
/check              # Full quality check
/check types        # Quick type check
/check security     # Security audit
```

## Agent

Routes to: `check-agent`

## Phases (in order)

### build

```bash
pnpm build
```

Verify compilation succeeds.

### types

```bash
pnpm typecheck
```

Zero TypeScript errors required.

### lint

```bash
pnpm lint
```

Zero ESLint errors required.

### tests

```bash
pnpm test:run --coverage
```

All tests pass, coverage ≥ 70%.

### security

- Check for hardcoded secrets
- Check for console.log
- Check for vulnerable dependencies

## Quality Gates

| Check    | Requirement | Blocking |
| -------- | ----------- | -------- |
| Build    | Must pass   | Yes      |
| Types    | 0 errors    | Yes      |
| Lint     | 0 errors    | Yes      |
| Tests    | Pass, 70%+  | Yes      |
| Security | No secrets  | Yes      |

## Output

```
CHECK REPORT
============
Build:    PASS
Types:    PASS (0 errors)
Lint:     PASS (0 errors, 3 warnings)
Tests:    PASS (45/45, 85% coverage)
Security: PASS

Overall: PASS - Ready for PR
```

## When to Run

- After `/code` or `/ui` implementation
- Before `/pr` or `/ship`
- After refactoring
- When CI fails locally

## After /check

1. Fix any issues found
2. Run `/ship` or `/pr create`

$ARGUMENTS
