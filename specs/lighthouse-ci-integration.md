# Feature: Lighthouse CI Performance Audits

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Run Lighthouse audits on every PR to catch performance, accessibility, and SEO regressions before they reach production, with automated reporting and configurable budgets.

## User Stories

- As a developer, I see how my PR affects Core Web Vitals before merging.
- As a developer, I'm warned about accessibility issues in my changes.
- As a reviewer, I can identify performance regressions during code review.
- As a team, we maintain performance budgets and prevent degradation.

## Success Criteria

- [ ] SC-1: Lighthouse CI installed and configured
- [ ] SC-2: Audits run on every PR
- [ ] SC-3: Results posted as PR comment with score changes
- [ ] SC-4: Performance budgets defined for key metrics
- [ ] SC-5: CI fails when budgets are exceeded (configurable)
- [ ] SC-6: Key pages are audited (home, critical flows)

## Technical Constraints

| Constraint       | Value                                           |
| ---------------- | ----------------------------------------------- |
| Tool             | Lighthouse CI (@lhci/cli)                       |
| CI Platform      | GitHub Actions                                  |
| Framework        | Next.js (requires build + start)                |
| Audit Categories | Performance, Accessibility, Best Practices, SEO |
| Storage          | Temporary filesystem (no LHCI server)           |

---

## Requirements

### Installation

- [x] REQ-1: Install `@lhci/cli` as dev dependency
- [x] REQ-2: Create `lighthouserc.js` configuration file
- [x] REQ-3: Add npm scripts for local testing

### Configuration

- [x] REQ-4: Configure URLs to audit (home page, key pages)
- [x] REQ-5: Set performance budgets for Core Web Vitals
- [x] REQ-6: Configure accessibility score threshold
- [x] REQ-7: Set number of runs per URL (for consistency)

### GitHub Action

- [x] REQ-8: Create workflow that runs on pull requests
- [x] REQ-9: Build and start Next.js in CI
- [x] REQ-10: Run Lighthouse against local server
- [x] REQ-11: Upload results as artifacts
- [x] REQ-12: Post results comment on PR

### Budgets & Thresholds

- [x] REQ-13: Set Performance score minimum (e.g., 90)
- [x] REQ-14: Set Accessibility score minimum (e.g., 95)
- [x] REQ-15: Set LCP budget (e.g., < 2.5s)
- [x] REQ-16: Set CLS budget (e.g., < 0.1)
- [x] REQ-17: Set FID/INP budget (e.g., < 100ms)

### Reporting

- [x] REQ-18: Show score changes vs main branch
- [x] REQ-19: Highlight metrics that exceed budgets
- [x] REQ-20: Link to full Lighthouse report

---

## Design

### Lighthouse Configuration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready",
      url: ["http://localhost:3000/", "http://localhost:3000/dashboard"],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        interactive: ["warn", { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

### GitHub Action

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
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

      - name: Run Lighthouse CI
        run: |
          pnpm dlx @lhci/cli autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: .lighthouseci/
```

### PR Comment Format

```
🚦 Lighthouse Results

| Category        | Score | Change | Status |
|-----------------|-------|--------|--------|
| Performance     | 92    | -3     | ⚠️     |
| Accessibility   | 98    | +1     | ✅     |
| Best Practices  | 100   | —      | ✅     |
| SEO             | 100   | —      | ✅     |

### Core Web Vitals

| Metric | Value  | Budget | Status |
|--------|--------|--------|--------|
| LCP    | 1.8s   | 2.5s   | ✅     |
| CLS    | 0.05   | 0.1    | ✅     |
| INP    | 45ms   | 100ms  | ✅     |

[View full report](https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/...)
```

---

## Tasks

### Phase 1: Local Setup

1. [x] Install @lhci/cli
2. [x] Create lighthouserc.js configuration
3. [x] Add npm scripts for local testing
4. [ ] Test locally with `pnpm lhci:run`

### Phase 2: GitHub Action

5. [x] Create `.github/workflows/lighthouse.yml`
6. [x] Configure build and start steps
7. [ ] Add LHCI GitHub App token (optional, for PR comments)
8. [ ] Test on a PR

### Phase 3: Tuning

9. [ ] Run baseline audits on main branch
10. [ ] Set appropriate budgets based on baseline
11. [ ] Add additional URLs as app grows
12. [ ] Decide on fail vs warn mode

---

## Out of Scope

- Lighthouse CI Server (self-hosted history tracking)
- Mobile vs Desktop separate audits
- Multi-page crawling
- Integration with performance monitoring (e.g., Datadog)

## Dependencies

- Next.js app that can be built and started
- GitHub Actions minutes
- Optional: LHCI GitHub App for enhanced PR comments

## Open Questions

- [x] Which pages to audit initially? **Resolved: / and /dashboard (if exists)**
- [x] What performance score threshold? **Resolved: 90 warn, 80 fail**
- [x] What accessibility threshold? **Resolved: 95 error (strict)**
- [x] Run on every PR or only changed pages? **Resolved: All configured pages**

## Enables

- Prevention of performance regressions
- Automated accessibility checking
- Core Web Vitals visibility in code review
- Data-driven performance optimization
