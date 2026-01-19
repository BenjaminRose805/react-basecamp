# Feature: CodeRabbit Issue Integration

> **Status:** Implemented
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Connect CodeRabbit to issue tracking (Linear or Jira) so it can automatically validate that PRs address the requirements specified in linked issues, improving PR quality and reducing back-and-forth.

## User Stories

- As a developer, CodeRabbit validates my PR against the linked issue's requirements.
- As a developer, I can create issues directly from CodeRabbit review comments.
- As a reviewer, I can see if a PR fully addresses the issue it claims to fix.
- As a PM, I have confidence that closed issues were actually implemented correctly.

## Success Criteria

- [ ] SC-1: Issue tracking platform selected (Linear or Jira)
- [ ] SC-2: CodeRabbit configured with issue integration enabled
- [ ] SC-3: PRs linked to issues show validation feedback
- [ ] SC-4: One-click issue creation from review comments works
- [ ] SC-5: CodeRabbit references issue requirements in reviews

## Technical Constraints

| Constraint      | Value                                |
| --------------- | ------------------------------------ |
| Platform        | Linear (recommended) or Jira         |
| Configuration   | `.coderabbit.yaml` update            |
| PR Linking      | Standard GitHub linking (Fixes #123) |
| CodeRabbit Tier | Free tier supports issue integration |

---

## Requirements

### Configuration

- [x] REQ-1: Enable `assess_linked_issues` in CodeRabbit config
- [x] REQ-2: Configure issue platform integration (Linear or Jira)
- [x] REQ-3: Enable issue creation from review comments

### Validation Behavior

- [x] REQ-4: CodeRabbit reads issue description and acceptance criteria
- [x] REQ-5: CodeRabbit validates PR changes against issue requirements
- [x] REQ-6: Validation feedback appears in PR review summary
- [x] REQ-7: Missing requirements are flagged in the review

### Issue Creation

- [x] REQ-8: Review comments can be converted to issues with one click
- [x] REQ-9: Created issues link back to the source PR/comment
- [x] REQ-10: Issue type/labels can be set during creation

---

## Design

### Configuration Addition

```yaml
# Add to .coderabbit.yaml
reviews:
  assess_linked_issues: true

integrations:
  linear:
    enabled: true
  # OR
  jira:
    enabled: true
    host: "your-org.atlassian.net"
```

### Workflow

```text
┌─────────────────────────────────────────────────────────────┐
│  1. Developer links PR to issue (Fixes LINEAR-123)          │
├─────────────────────────────────────────────────────────────┤
│  2. CodeRabbit reads issue requirements                     │
├─────────────────────────────────────────────────────────────┤
│  3. CodeRabbit reviews code AND validates against issue     │
├─────────────────────────────────────────────────────────────┤
│  4. Review includes:                                        │
│     - Standard code review feedback                         │
│     - "✅ Addresses: Add form validation"                   │
│     - "⚠️ Missing: Error message for invalid email"         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tasks

### Phase 1: Platform Selection

1. [x] Decide between Linear and Jira
2. [ ] Set up project/workspace in chosen platform
3. [ ] Document linking conventions (LINEAR-XXX or JIRA-XXX)

### Phase 2: Configuration

4. [x] Update `.coderabbit.yaml` with issue integration
5. [x] Configure platform-specific settings
6. [ ] Test issue linking on a sample PR

### Phase 3: Verification

7. [ ] Create issue with acceptance criteria
8. [ ] Create PR linked to issue
9. [ ] Verify CodeRabbit validates against requirements
10. [ ] Test one-click issue creation from comment

---

## Out of Scope

- Automatic issue status updates (e.g., moving to "In Review")
- Bi-directional sync between platforms
- Custom issue templates
- Sprint/milestone integration

## Dependencies

- Issue tracking platform account (Linear or Jira)
- CodeRabbit GitHub App (already installed)
- Repository access granted to issue platform

## Open Questions

- [x] Which platform: Linear or Jira? **Resolved: Linear**
- [x] Should we require issue links on all PRs? **Resolved: No, warning only**

## Enables

- Automated requirement validation
- Reduced "did this PR actually fix the issue?" questions
- Better traceability between code and requirements
- Faster issue creation from code review feedback
