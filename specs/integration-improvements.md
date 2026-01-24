# Integration Improvements Plan

Implement recommended improvements to maximize value from GitHub app integrations.

## Overview

| Phase | Focus          | Tasks                                    |
| ----- | -------------- | ---------------------------------------- |
| 1     | Deployment     | Fly.io deploy + preview workflows        |
| 2     | Quality Gates  | Tighten Lighthouse + CodeCov enforcement |
| 3     | Error Tracking | Sentry release integration               |
| 4     | Workflow       | Linear linking + PR template             |

---

## Phase 1: Deployment Automation

### Task 1.1: Create Fly.io Deploy Workflow

**Goal:** Auto-deploy to production on merge to main.

**File:** `.github/workflows/deploy.yml`

**Requirements:**

- Trigger on push to main
- Run after CI passes
- Deploy using flyctl
- Requires `FLY_API_TOKEN` secret

**Acceptance Criteria:**

- [ ] Workflow triggers on main push
- [ ] Deploys successfully to Fly.io
- [ ] Fails gracefully with clear error messages

---

### Task 1.2: Create Preview Deployment Workflow

**Goal:** Deploy preview environments for PRs.

**File:** `.github/workflows/preview.yml`

**Requirements:**

- Trigger on PR open/sync
- Deploy to preview app (separate from production)
- Comment preview URL on PR
- Clean up on PR close (optional)

**Acceptance Criteria:**

- [ ] Preview deploys on PR creation
- [ ] PR comment includes preview URL
- [ ] Preview updates on new commits

---

### Task 1.3: Create fly.toml (if missing)

**Goal:** Ensure Fly.io configuration exists.

**File:** `fly.toml`

**Requirements:**

- App name configured
- Build settings for Next.js
- Health check endpoint
- Environment variables referenced

---

## Phase 2: Quality Gate Enforcement

### Task 2.1: Make Lighthouse Accessibility Blocking

**Goal:** Fail PRs that regress accessibility.

**File:** `lighthouserc.cjs`

**Changes:**

```javascript
// Change from warn to error
'categories:accessibility': ['error', { minScore: 0.95 }],
'categories:performance': ['error', { minScore: 0.8 }],
```

**Acceptance Criteria:**

- [ ] PR fails if accessibility < 95%
- [ ] PR fails if performance < 80%
- [ ] Other metrics remain as warnings

---

### Task 2.2: Add Coverage Gate to CI

**Goal:** Fail CI if coverage drops below threshold.

**File:** `.github/workflows/reusable-test.yml`

**Requirements:**

- Check coverage after test run
- Fail if below 70% (configurable)
- Clear error message with current vs required

**Acceptance Criteria:**

- [ ] CI fails if coverage < threshold
- [ ] Error message shows coverage percentage
- [ ] Threshold is configurable via input

---

### Task 2.3: Update CodeCov to Block PRs

**Goal:** CodeCov status check blocks merge.

**File:** `codecov.yml`

**Changes:**

```yaml
coverage:
  status:
    project:
      default:
        target: 70%
        threshold: 1% # Reduce from 2% to 1%
    patch:
      default:
        target: 80%
        # Add informational flag
        informational: false # Make it blocking
```

**Acceptance Criteria:**

- [ ] CodeCov check appears on PR
- [ ] Check fails if coverage drops > 1%
- [ ] New code requires 80% coverage

---

## Phase 3: Error Tracking

### Task 3.1: Add Sentry Release to Deploy

**Goal:** Link deploys to Sentry releases for error attribution.

**File:** `.github/workflows/deploy.yml` (modify)

**Requirements:**

- Create Sentry release on deploy
- Upload source maps
- Set environment (production/preview)
- Requires `SENTRY_AUTH_TOKEN` secret

**Acceptance Criteria:**

- [ ] Sentry release created on deploy
- [ ] Source maps uploaded
- [ ] Errors show correct release version

---

### Task 3.2: Configure Sentry in Next.js (if needed)

**Goal:** Ensure Sentry SDK is properly configured.

**Files:** `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.js`

**Requirements:**

- Client-side error tracking
- Server-side error tracking
- Source map upload config
- Environment-aware configuration

---

## Phase 4: Workflow Improvements

### Task 4.1: Create PR Template

**Goal:** Standardize PR descriptions.

**File:** `.github/PULL_REQUEST_TEMPLATE.md`

**Content:**

- Summary section (for /pr command)
- Test plan checklist
- Review checklist (CoderabbitAI, /verify, /security)
- Generated with Claude footer

**Acceptance Criteria:**

- [ ] Template appears on new PRs
- [ ] Checklist items are actionable
- [ ] Works with /pr command output

---

### Task 4.2: Document Linear Branch Convention

**Goal:** Ensure consistent Linear ↔ GitHub linking.

**File:** `docs/INTEGRATIONS.md` (update)

**Content:**

- Branch naming: `type/ABC-123-description`
- Commit format: `type: message [ABC-123]`
- PR linking: `Fixes ABC-123`

**Acceptance Criteria:**

- [ ] Convention documented
- [ ] Examples provided
- [ ] Works with existing Linear integration

---

### Task 4.3: Add Renovate Prisma Grouping

**Goal:** Group Prisma updates together.

**File:** `renovate.json`

**Changes:**

```json
{
  "description": "Prisma ecosystem",
  "groupName": "Prisma",
  "matchPackageNames": ["prisma", "@prisma/client"],
  "matchPackagePatterns": ["^@prisma/"]
}
```

**Acceptance Criteria:**

- [ ] Prisma packages grouped in single PR
- [ ] Existing groups still work

---

## Implementation Order

```
Phase 1: Deployment (do first - highest impact)
├── 1.3 fly.toml (if missing)
├── 1.1 Deploy workflow
└── 1.2 Preview workflow

Phase 2: Quality Gates (do second - prevent regressions)
├── 2.1 Lighthouse blocking
├── 2.2 Coverage gate
└── 2.3 CodeCov blocking

Phase 3: Error Tracking (do third - improve debugging)
├── 3.2 Sentry config (if needed)
└── 3.1 Sentry releases

Phase 4: Workflow (do last - polish)
├── 4.1 PR template
├── 4.2 Linear docs
└── 4.3 Renovate Prisma
```

---

## Prerequisites

**Secrets needed in GitHub:**

- `FLY_API_TOKEN` - Fly.io deploy token
- `SENTRY_AUTH_TOKEN` - Sentry release token (if using Sentry)

**Verify before starting:**

```bash
# Check if fly.toml exists
ls fly.toml

# Check Fly.io CLI access
fly auth whoami

# Check existing secrets
gh secret list
```

---

## Success Criteria

| Metric             | Before      | After              |
| ------------------ | ----------- | ------------------ |
| Deploy automation  | Manual      | Automatic on merge |
| Preview deploys    | None        | Every PR           |
| Accessibility gate | Warning     | Blocking           |
| Coverage gate      | Report only | Blocking           |
| Error attribution  | None        | Per-release        |
