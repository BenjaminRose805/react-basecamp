# Feature: CodeRabbit Integration

> **Status:** Draft
> **Author:** Claude
> **Created:** 2026-01-18

## Goal

Integrate CodeRabbit AI code review into the project to provide automated, intelligent PR reviews that learn from team preferences and enforce project standards without requiring API keys in CI.

## User Stories

- As a developer, I receive automated AI code reviews on every PR without manual setup.
- As a developer, I can teach CodeRabbit my preferences by interacting with its comments.
- As a developer, I see CodeRabbit enforce project-specific rules defined in path instructions.
- As a developer, I can request unit test and docstring generation from CodeRabbit.

## Success Criteria

- [ ] SC-1: CodeRabbit GitHub App is installed on the repository
- [ ] SC-2: `.coderabbit.yaml` configuration exists with project-specific settings
- [ ] SC-3: Path-based instructions cover all major code areas (components, app, tests, lib, actions)
- [ ] SC-4: Pre-merge checks are configured (title, description, docstrings)
- [ ] SC-5: Security tools enabled (Semgrep, Gitleaks)
- [ ] SC-6: CodeRabbit reviews appear on new PRs automatically
- [ ] SC-7: Custom AI review workflow is removed from CI

## Technical Constraints

| Constraint        | Value                                 |
| ----------------- | ------------------------------------- |
| Platform          | GitHub App (not workflow-based)       |
| Configuration     | `.coderabbit.yaml` in repository root |
| Review Profile    | `assertive` (thorough reviews)        |
| Knowledge Sources | CLAUDE.md, learnings, web search      |
| MCP Integration   | Optional (Pro feature)                |

---

## Requirements

### Configuration

- [ ] REQ-1: Create `.coderabbit.yaml` with auto-review enabled
- [ ] REQ-2: Set review profile to `assertive` for thorough feedback
- [ ] REQ-3: Enable high-level summary generation
- [ ] REQ-4: Configure `request_changes_workflow` for critical issues

### Path Instructions

- [ ] REQ-5: Add instructions for `src/components/**/*` (React patterns, a11y, Tailwind)
- [ ] REQ-6: Add instructions for `src/app/**/*` (Server/Client Components, Server Actions)
- [ ] REQ-7: Add instructions for `**/*.test.{ts,tsx}` (testing best practices)
- [ ] REQ-8: Add instructions for `src/lib/**/*` (utility functions, error handling)
- [ ] REQ-9: Add instructions for `src/actions/**/*` (Server Actions security)
- [ ] REQ-10: Add instructions for `e2e/**/*` (E2E test patterns)

### Pre-merge Checks

- [ ] REQ-11: Enable title check (warning mode)
- [ ] REQ-12: Enable description check (warning mode)
- [ ] REQ-13: Enable docstring coverage check (80% threshold)

### Tools & Security

- [ ] REQ-14: Enable ESLint integration with config path
- [ ] REQ-15: Enable ShellCheck for shell scripts
- [ ] REQ-16: Enable Markdownlint for documentation
- [ ] REQ-17: Enable Semgrep for security analysis
- [ ] REQ-18: Enable Gitleaks for secrets detection

### Knowledge Base

- [ ] REQ-19: Enable learnings with `auto` scope
- [ ] REQ-20: Enable web search for documentation context
- [ ] REQ-21: Enable code guidelines reading (CLAUDE.md)

### Finishing Touches

- [ ] REQ-22: Enable docstring generation on demand
- [ ] REQ-23: Enable unit test generation on demand

### Cleanup

- [ ] REQ-24: Remove `reusable-ai-review.yml` workflow file
- [ ] REQ-25: Remove AI review job from `pull-request.yml`
- [ ] REQ-26: Remove `reusable-ai-pr-description.yml` workflow file

---

## Design

### Configuration Structure

```yaml
# .coderabbit.yaml
language: en-US

reviews:
  auto_review:
    enabled: true
    drafts: false
    base_branches: [main]
  profile: assertive
  request_changes_workflow: true
  high_level_summary: true
  path_instructions: [...]

pre_merge:
  title_check: { mode: warning }
  description_check: { mode: warning }
  docstring_coverage: { threshold: 80, mode: warning }

finishing_touches:
  docstrings: { enabled: true }
  unit_tests: { enabled: true }

knowledge_base:
  learnings: { scope: auto }
  web_search: { enabled: true }
  code_guidelines: { enabled: true }

tools:
  eslint: { enabled: true, config_path: eslint.config.js }
  shellcheck: { enabled: true }
  markdownlint: { enabled: true }
  semgrep: { enabled: true }
  gitleaks: { enabled: true }

path_filters:
  - "!**/pnpm-lock.yaml"
  - "!**/.next/**"
  - "!**/node_modules/**"
```

---

## Tasks

### Phase 1: Configuration

1. [ ] Update `.coderabbit.yaml` with full configuration
2. [ ] Change review profile from `chill` to `assertive`
3. [ ] Add missing path instructions (lib, actions, e2e)
4. [ ] Enable pre-merge checks
5. [ ] Enable finishing touches features
6. [ ] Enable knowledge base settings
7. [ ] Enable additional security tools

### Phase 2: Cleanup

8. [ ] Remove `.github/workflows/reusable-ai-review.yml`
9. [ ] Remove `.github/workflows/reusable-ai-pr-description.yml`
10. [ ] Verify `pull-request.yml` no longer references AI workflows
11. [ ] Remove unused AI workflow files (changelog, coverage if unused)

### Phase 3: Verification

12. [ ] Install CodeRabbit GitHub App on repository
13. [ ] Enable Dependency Graph in repo settings
14. [ ] Create test PR to verify CodeRabbit reviews
15. [ ] Verify all CI checks pass without AI review jobs

---

## Out of Scope

- MCP server integration (requires Pro plan)
- Jira/Linear integration (not currently used)
- Organization-wide CodeRabbit settings
- Custom AST-based rules
- CodeRabbit CLI setup

## Open Questions

- [ ] Should we use `assertive` or `chill` profile? **Recommended: assertive**
- [ ] Enable learnings globally or per-repo? **Recommended: auto (starts local)**

## Dependencies

- GitHub App installation (manual step)
- Dependency Graph enabled (manual step)

## Enables

- Automated code review without API key management
- Continuous improvement via learnings
- On-demand test and docstring generation
