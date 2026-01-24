---
name: verification-loop
description: Comprehensive pre-PR verification system. Use after completing features, before creating PRs, or after refactoring. Runs build, type, lint, test, and security checks.
---

# Verification Loop Skill

A comprehensive verification system for react-basecamp projects.

## When to Use

Invoke this skill via `/verify`:

- After completing a feature or significant code change
- Before creating a PR
- After refactoring
- When you want to ensure all quality gates pass

## Verification Phases

### Phase 1: Build Verification

```bash
pnpm build 2>&1 | tail -20
```

If build fails, **STOP** and fix before continuing.

### Phase 2: Type Check

```bash
pnpm typecheck 2>&1 | head -30
```

Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint Check

```bash
pnpm lint 2>&1 | head -30
```

Report and auto-fix when possible:

```bash
pnpm lint --fix
```

### Phase 4: Test Suite

```bash
# Run tests with coverage
pnpm test:run --coverage 2>&1 | tail -50
```

Report:

- Total tests: X
- Passed: X
- Failed: X
- Coverage: X% (minimum 70%)

### Phase 5: Security Scan

```bash
# Check for hardcoded secrets
grep -rn "sk-" --include="*.ts" --include="*.js" src/ 2>/dev/null | head -10
grep -rn "api_key\s*=" --include="*.ts" --include="*.js" src/ 2>/dev/null | head -10

# Check for console.log
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10

# Check for TODO/FIXME in critical paths
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### Phase 6: Diff Review

```bash
# Show what changed
git diff --stat
git diff HEAD~1 --name-only 2>/dev/null || git diff --staged --name-only
```

Review each changed file for:

- Unintended changes
- Missing error handling
- Potential edge cases
- Console.log statements
- Hardcoded values

## Output Format

After running all phases, produce a verification report:

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. [Issue description and file location]
2. [Issue description and file location]
```

## Phase-Specific Commands

Run individual phases when needed:

```bash
/verify              # Full verification (all phases)
/verify build        # Build only
/verify types        # Type check only
/verify lint         # Lint only
/verify tests        # Tests only
/verify security     # Security scan only
/verify diff         # Diff review only
```

## Quality Gates

| Check    | Requirement              | Blocking |
| -------- | ------------------------ | -------- |
| Build    | Must pass                | Yes      |
| Types    | 0 errors                 | Yes      |
| Lint     | 0 errors (warnings OK)   | Yes      |
| Tests    | All pass, 70%+ coverage  | Yes      |
| Security | 0 secrets, 0 console.log | Yes      |

## Integration with Workflow

```
/code [feature]     # Implement feature
    ↓
/verify             # Run verification
    ↓
[Fix any issues]
    ↓
/verify             # Re-verify
    ↓
/security           # Deep security scan
    ↓
/review             # Create PR
```

## Continuous Verification

For long sessions, run verification at checkpoints:

- After completing each function
- After finishing a component
- Before switching to a different feature
- Every 30 minutes of active coding

The `suggest-compact.js` hook will remind you at logical intervals.

## Common Issues and Fixes

### Build Fails

1. Check for import errors
2. Verify all dependencies installed: `pnpm install`
3. Check for circular dependencies

### Type Errors

1. Run `pnpm typecheck` to see all errors
2. Fix in order of severity
3. Don't use `any` as a quick fix

### Test Failures

1. Run specific test: `pnpm test [file]`
2. Check test isolation (tests affecting each other)
3. Verify mocks are correct

### Security Issues

1. Move secrets to `.env.local`
2. Remove console.log statements
3. Use logger utility instead

## Success Criteria

Verification passes when:

- [ ] Build completes without errors
- [ ] TypeScript reports 0 errors
- [ ] ESLint reports 0 errors
- [ ] All tests pass
- [ ] Coverage ≥ 70%
- [ ] No hardcoded secrets found
- [ ] No console.log in production code
- [ ] All changes are intentional
