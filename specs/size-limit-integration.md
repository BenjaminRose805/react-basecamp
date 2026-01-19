# Feature: Size Limit Bundle Tracking

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Track JavaScript bundle size on every PR to catch accidental bloat, prevent performance regressions, and make bundle impact visible during code review.

## User Stories

- As a developer, I see how my PR affects bundle size before merging.
- As a reviewer, I can identify PRs that significantly increase bundle size.
- As a team, we maintain performance budgets and catch regressions early.
- As a developer, I'm warned when adding large dependencies.

## Success Criteria

- [ ] SC-1: Size Limit installed and configured
- [ ] SC-2: GitHub Action runs on every PR
- [ ] SC-3: PR comments show bundle size changes
- [ ] SC-4: Size budgets are defined and enforced
- [ ] SC-5: CI fails when budget is exceeded (configurable)

## Technical Constraints

| Constraint     | Value                                  |
| -------------- | -------------------------------------- |
| Tool           | size-limit with @size-limit/preset-app |
| CI Integration | GitHub Actions                         |
| Framework      | Next.js (client bundles)               |
| Budget         | Configurable per entry point           |
| Reporting      | PR comment with diff table             |

---

## Requirements

### Installation

- [x] REQ-1: Install `size-limit` and appropriate preset
- [x] REQ-2: Install `@size-limit/preset-app` for Next.js
- [x] REQ-3: Add size-limit configuration to `package.json`

### Configuration

- [x] REQ-4: Define entry points to measure (client bundles)
- [x] REQ-5: Set size budgets for each entry point
- [x] REQ-6: Configure comparison against main branch

### GitHub Action

- [x] REQ-7: Create workflow that runs on pull requests
- [x] REQ-8: Build project before measuring
- [x] REQ-9: Compare PR size against base branch
- [x] REQ-10: Post comment with size diff table
- [x] REQ-11: Fail check if budget exceeded (warning mode initially)

### Reporting

- [x] REQ-12: Show absolute size and delta
- [x] REQ-13: Show percentage change
- [x] REQ-14: Highlight significant increases (>5%)
- [x] REQ-15: Link to bundle analysis for debugging

---

## Design

### Package.json Configuration

```json
{
  "size-limit": [
    {
      "name": "Client JS",
      "path": ".next/static/chunks/*.js",
      "limit": "200 KB"
    },
    {
      "name": "First Load JS",
      "path": ".next/static/chunks/main-*.js",
      "limit": "100 KB"
    }
  ],
  "scripts": {
    "size": "size-limit",
    "size:check": "size-limit --ci"
  }
}
```

### GitHub Action

```yaml
# .github/workflows/size-limit.yml
name: Bundle Size

on:
  pull_request:
    branches: [main]

jobs:
  size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### PR Comment Format

```text
📦 Size Limit Report

| Path                    | Size     | Change   | Status |
|------------------------|----------|----------|--------|
| Client JS              | 145 KB   | +2.3 KB  | ✅     |
| First Load JS          | 89 KB    | +15 KB   | ⚠️     |

⚠️ First Load JS increased by 20%. Consider code splitting.
```

---

## Tasks

### Phase 1: Installation

1. [x] Install size-limit packages
2. [x] Add configuration to package.json
3. [x] Add npm scripts for local testing
4. [ ] Test locally with `pnpm size`

### Phase 2: GitHub Action

5. [x] Create `.github/workflows/size-limit.yml`
6. [x] Configure action with proper build steps
7. [ ] Test on a PR

### Phase 3: Tuning

8. [ ] Establish baseline sizes
9. [ ] Set appropriate budgets based on baseline
10. [ ] Decide on fail vs warn mode

---

## Out of Scope

- Per-route bundle analysis (future enhancement)
- Historical tracking dashboard
- Slack/Discord notifications
- Integration with external monitoring

## Dependencies

- Next.js build output structure
- GitHub Actions minutes
- PR write permissions for comments

## Open Questions

- [x] What budget limits are appropriate? **Resolved: Baseline + 10%**
- [x] Fail CI or just warn? **Resolved: Warn initially, fail later**
- [x] Track compressed or uncompressed size? **Resolved: Both, gzip for budgets**

## Enables

- Visibility into bundle impact of changes
- Prevention of accidental large dependency additions
- Performance budgets as code
- Data-driven decisions about dependencies
