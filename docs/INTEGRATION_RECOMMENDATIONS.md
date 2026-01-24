# Integration Recommendations

How to maximize value from your GitHub app integrations.

## Current State Assessment

Your setup is well-configured:

- Renovate: Auto-merge for minor/patch, security alerts enabled
- CoderabbitAI: Assertive profile, path-specific instructions, security tools enabled
- CodeCov: 70% project target, 80% patch target, blocking PRs
- Lighthouse CI: Performance budgets, Core Web Vitals tracking, blocking on regressions
- Vercel: Auto-deploys, preview environments (no config needed)
- Sentry: Full SDK integration with release tracking

## Vercel Setup

Vercel handles deployment automatically via GitHub integration:

**What Vercel provides (no config needed):**

- Auto-deploy to production on push to main
- Preview deployments for every PR
- Preview URL commented on PRs automatically
- CDN, SSL, edge functions
- Zero-config for Next.js

**Environment Variables (auto-configured via integrations):**

```
POSTGRES_URL          # Vercel Postgres (auto-added via Storage)
SENTRY_DSN            # Sentry (auto-added via Vercel integration)
NEXT_PUBLIC_SENTRY_DSN # Sentry client-side
SENTRY_ORG            # Sentry organization slug
SENTRY_PROJECT        # Sentry project slug
SENTRY_AUTH_TOKEN     # For source map uploads
```

## Recommendations

### 1. Enable Vercel Analytics (FREE)

**Why:** Built-in performance monitoring, Core Web Vitals tracking.

**Action:** Enable in Vercel Dashboard → Project → Analytics

### 2. Enable Vercel Speed Insights (FREE)

**Why:** Real user monitoring for Core Web Vitals.

**Action:**

```bash
pnpm add @vercel/speed-insights
```

Then add to your layout:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. Configure Sentry + Vercel Integration

**Why:** Link Sentry releases to Vercel deployments automatically.

**Action:**

1. Go to Vercel Dashboard → Integrations
2. Add Sentry integration
3. This auto-creates releases on deploy

### 4. Leverage CoderabbitAI + Claude Together (HIGH VALUE)

**Current:** Both do code review separately.

**Recommendation:** Use them for different purposes:

- **CoderabbitAI:** First-pass automated review (catches style, security, patterns)
- **Claude `/review`:** Deep architectural review, complex logic validation

### 5. Add Linear MCP Server (if available)

**Why:** Bridge Linear issues directly into Claude workflows.

**Workaround:** Use Linear's GitHub integration for branch → issue linking.

### 6. Optimize Renovate Schedule

**Current:** Weekly on Monday mornings.

**Consider:** More frequent for security updates:

```json
{
  "vulnerabilityAlerts": {
    "schedule": ["at any time"]
  }
}
```

## Integration Matrix

| Integration   | Purpose      | Auto-configured          |
| ------------- | ------------ | ------------------------ |
| Vercel        | Deploy       | Yes (GitHub integration) |
| CoderabbitAI  | Code review  | Yes                      |
| CodeCov       | Coverage     | Yes (via CI)             |
| Lighthouse CI | Performance  | Yes (via CI)             |
| Renovate      | Dependencies | Yes                      |
| Linear        | Issues       | Yes (branch naming)      |
| Sentry        | Errors       | Yes (SDK installed)      |
| Claude        | Development  | Yes (.claude/ config)    |

## What's Automated Now

| Trigger            | Action                                    |
| ------------------ | ----------------------------------------- |
| Push to main       | CI → Vercel deploy → Sentry release       |
| PR opened          | CI + Vercel preview + CoderabbitAI review |
| Coverage drop >1%  | CI fails                                  |
| Performance <80%   | Lighthouse fails                          |
| Accessibility <95% | Lighthouse fails                          |
| Weekly Monday      | Renovate dependency PRs                   |
