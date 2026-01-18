# Feature: Renovate Dependency Management

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Automate dependency updates with intelligent grouping to reduce PR noise while keeping dependencies current and secure, using Renovate's superior monorepo support over Dependabot.

## User Stories

- As a developer, I receive grouped dependency update PRs instead of one PR per package.
- As a developer, I can see all pending updates in a Dependency Dashboard issue.
- As a developer, minor and patch updates auto-merge when CI passes.
- As a developer, security updates are prioritized and processed immediately.

## Success Criteria

- [ ] SC-1: Renovate GitHub App is installed on the repository
- [ ] SC-2: `renovate.json` configuration exists with project-specific settings
- [ ] SC-3: Dependencies are grouped by category (React, testing, types, tooling)
- [ ] SC-4: Dependency Dashboard issue is created and maintained
- [ ] SC-5: Minor/patch updates auto-merge after CI passes
- [ ] SC-6: Security updates bypass grouping and are processed immediately
- [ ] SC-7: Lock file maintenance runs weekly

## Technical Constraints

| Constraint       | Value                              |
| ---------------- | ---------------------------------- |
| Platform         | GitHub App (Renovate)              |
| Package Manager  | pnpm                               |
| Configuration    | `renovate.json` in repository root |
| Schedule         | Weekly for regular updates         |
| Auto-merge       | Minor/patch only, after CI passes  |
| Security Updates | Immediate, not grouped             |

---

## Requirements

### Core Configuration

- [x] REQ-1: Create `renovate.json` with base config extending `config:recommended`
- [x] REQ-2: Enable Dependency Dashboard for update visibility
- [x] REQ-3: Configure pnpm as the package manager
- [x] REQ-4: Set timezone to match team (US timezone)

### Grouping Strategy

- [x] REQ-5: Group all `@types/*` packages together
- [x] REQ-6: Group React ecosystem packages (react, react-dom, @types/react\*)
- [x] REQ-7: Group Next.js packages (next, @next/\*, eslint-config-next)
- [x] REQ-8: Group testing packages (vitest, @testing-library/\*, playwright)
- [x] REQ-9: Group ESLint packages (eslint, eslint-plugin-_, @eslint/_)
- [x] REQ-10: Group TypeScript packages (typescript, ts-_, @typescript-eslint/_)

### Auto-merge Rules

- [x] REQ-11: Enable auto-merge for minor updates (non-major)
- [x] REQ-12: Enable auto-merge for patch updates
- [x] REQ-13: Require CI to pass before auto-merge
- [x] REQ-14: Disable auto-merge for major updates (require manual review)

### Security Updates

- [x] REQ-15: Enable vulnerability alerts
- [x] REQ-16: Process security updates immediately (not on schedule)
- [x] REQ-17: Do not group security updates with regular updates

### Scheduling

- [x] REQ-18: Run regular updates weekly (e.g., Monday morning)
- [x] REQ-19: Run lock file maintenance weekly
- [x] REQ-20: Allow manual triggering via Dependency Dashboard

### Labels & PR Management

- [x] REQ-21: Add `dependencies` label to all Renovate PRs
- [x] REQ-22: Add type-specific labels (e.g., `npm`, `security`)
- [x] REQ-23: Set reasonable PR limits to avoid overwhelming CI

---

## Design

### Configuration Structure

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    "group:monorepos",
    "group:recommended",
    ":dependencyDashboard",
    ":semanticCommits",
    ":automergeMinor",
    "schedule:weekly"
  ],
  "packageManager": "pnpm",
  "timezone": "America/New_York",
  "labels": ["dependencies"],
  "packageRules": [
    {
      "groupName": "TypeScript types",
      "matchPackagePatterns": ["^@types/"]
    },
    {
      "groupName": "React ecosystem",
      "matchPackageNames": ["react", "react-dom"],
      "matchPackagePatterns": ["^@types/react"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "groupName": null,
    "schedule": []
  }
}
```

### Grouping Categories

| Group Name       | Packages Included                            |
| ---------------- | -------------------------------------------- |
| TypeScript types | `@types/*`                                   |
| React ecosystem  | `react`, `react-dom`, `@types/react*`        |
| Next.js          | `next`, `@next/*`, `eslint-config-next`      |
| Testing tools    | `vitest`, `@testing-library/*`, `playwright` |
| ESLint ecosystem | `eslint`, `eslint-plugin-*`, `@eslint/*`     |
| TypeScript tools | `typescript`, `ts-*`, `@typescript-eslint/*` |

---

## Tasks

### Phase 1: Configuration

1. [x] Create `renovate.json` with base configuration
2. [x] Add package grouping rules
3. [x] Configure auto-merge settings
4. [x] Set up scheduling
5. [x] Configure security update handling

### Phase 2: Verification (Manual Steps)

6. [ ] Install Renovate GitHub App on repository
7. [ ] Verify Dependency Dashboard issue is created
8. [ ] Verify first batch of update PRs are created
9. [ ] Verify auto-merge works for minor/patch updates

---

## Out of Scope

- Renovate self-hosted runner (using GitHub App)
- Custom Renovate presets package
- Integration with Slack/Discord notifications
- Monorepo-specific config (will add when monorepo is set up)

## Dependencies

- Renovate GitHub App installation (manual step)
- CI workflow must pass for auto-merge to work
- Branch protection rules should allow Renovate to merge

## Open Questions

- [x] What timezone should be used for scheduling? **Resolved: America/Chicago**
- [x] Should we limit concurrent PRs? **Resolved: 10 PRs max**
- [x] Which day for weekly updates? **Resolved: Monday**

## Enables

- Reduced dependency update noise (fewer PRs)
- Visibility into pending updates via Dashboard
- Automatic security patching
- Consistent, current dependencies
