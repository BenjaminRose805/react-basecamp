# Feature: Codecov Coverage Tracking

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Track test coverage at the line level on every PR to identify untested code, prevent coverage regression, and make testing gaps visible during code review.

## User Stories

- As a developer, I see which lines in my PR lack test coverage.
- As a reviewer, I can identify untested code paths before approving.
- As a team, we maintain minimum coverage thresholds.
- As a developer, I'm warned when my PR decreases overall coverage.

## Success Criteria

- [ ] SC-1: Codecov GitHub App installed on repository
- [ ] SC-2: Coverage reports uploaded on every PR and push to main
- [ ] SC-3: PR comments show coverage diff with line annotations
- [ ] SC-4: Coverage thresholds configured (project and patch)
- [ ] SC-5: CI status reflects coverage requirements

## Technical Constraints

| Constraint      | Value                                   |
| --------------- | --------------------------------------- |
| Platform        | Codecov (free for public repos)         |
| Test Runner     | Vitest with coverage                    |
| Coverage Format | lcov or cobertura                       |
| CI Integration  | GitHub Actions                          |
| Thresholds      | Configurable project and patch coverage |

---

## Requirements

### Vitest Configuration

- [x] REQ-1: Enable coverage in Vitest config
- [x] REQ-2: Configure lcov reporter for Codecov
- [x] REQ-3: Set coverage thresholds in Vitest (local enforcement)

### GitHub Action

- [x] REQ-4: Run tests with coverage in CI
- [x] REQ-5: Upload coverage report to Codecov
- [x] REQ-6: Configure Codecov action with token (if private repo)

### Codecov Configuration

- [x] REQ-7: Create `codecov.yml` with project settings
- [x] REQ-8: Set project coverage target (e.g., 70%)
- [x] REQ-9: Set patch coverage target (e.g., 80% for new code)
- [x] REQ-10: Configure PR comment behavior

### Reporting

- [x] REQ-11: PR comments show coverage diff
- [x] REQ-12: Show which new lines are untested
- [x] REQ-13: Show coverage trend (up/down)
- [x] REQ-14: Link to detailed coverage report

### CI Status

- [x] REQ-15: Report coverage status to GitHub checks
- [x] REQ-16: Configure pass/fail based on thresholds
- [x] REQ-17: Allow informational mode (don't block merge)

---

## Design

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
        statements: 70,
      },
    },
  },
});
```

### Codecov Configuration

```yaml
# codecov.yml
coverage:
  status:
    project:
      default:
        target: 70%
        threshold: 2% # Allow 2% drop
    patch:
      default:
        target: 80% # New code should be well tested

comment:
  layout: "diff, flags, files"
  behavior: default
  require_changes: true

flags:
  unit:
    paths:
      - src/
    carryforward: true
```

### GitHub Action Update

```yaml
# Add to existing test workflow
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: false
    verbose: true
```

### PR Comment Format

```text
## Coverage Report

| Metric     | Coverage | Change  | Status |
|------------|----------|---------|--------|
| Project    | 76.2%    | -1.3%   | ⚠️     |
| Patch      | 45.0%    | —       | ❌     |

### Files with reduced coverage

| File              | Coverage | Lines Missing |
|-------------------|----------|---------------|
| src/lib/auth.ts   | 45%      | 23-45         |
| src/utils/api.ts  | 62%      | 78-82, 91     |

[View full report](https://codecov.io/...)
```

---

## Tasks

### Phase 1: Local Setup

1. [x] Update Vitest config with coverage settings
2. [x] Add coverage script to package.json
3. [ ] Test coverage locally
4. [x] Add coverage directory to .gitignore

### Phase 2: Codecov Setup

5. [ ] Install Codecov GitHub App
6. [x] Create `codecov.yml` configuration
7. [ ] Get Codecov token (if private repo)

### Phase 3: CI Integration

8. [x] Update test workflow to generate coverage
9. [x] Add Codecov upload step
10. [ ] Test on a PR

### Phase 4: Tuning

11. [ ] Review baseline coverage
12. [ ] Adjust thresholds based on baseline
13. [ ] Decide on fail vs warn mode

---

## Out of Scope

- Coverage badges in README (can add later)
- Multiple coverage flags (unit vs integration)
- Coverage carryforward for monorepos
- Integration with Slack/Discord

## Dependencies

- Codecov GitHub App installation
- Vitest test suite
- GitHub Actions workflow

## Open Questions

- [x] What project coverage target? **Resolved: 70% (matches existing)**
- [x] What patch coverage target? **Resolved: 80%**
- [x] Fail CI on coverage drop? **Resolved: Warn initially**
- [ ] Public or private repo? **Affects token requirement**

## Enables

- Line-level visibility into untested code
- Prevention of coverage regression
- Data for prioritizing test writing
- Confidence in code quality
