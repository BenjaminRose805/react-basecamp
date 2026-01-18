# Feature: CodeRabbit Integration

> **Status:** Implemented
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

- [ ] SC-1: CodeRabbit GitHub App is installed on the repository (manual step)
- [x] SC-2: `.coderabbit.yaml` configuration exists with project-specific settings
- [x] SC-3: Path-based instructions cover all major code areas (components, app, tests, lib, actions)
- [x] SC-4: Pre-merge checks are configured (title, description, docstrings)
- [x] SC-5: Security tools enabled (Semgrep, Gitleaks)
- [ ] SC-6: CodeRabbit reviews appear on new PRs automatically (requires app install)
- [x] SC-7: Custom AI review workflow is removed from CI

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

- [x] REQ-1: Create `.coderabbit.yaml` with auto-review enabled
- [x] REQ-2: Set review profile to `assertive` for thorough feedback
- [x] REQ-3: Enable high-level summary generation
- [x] REQ-4: Configure `request_changes_workflow` for critical issues

### Path Instructions

- [x] REQ-5: Add instructions for `src/components/**/*` (React patterns, a11y, Tailwind)
- [x] REQ-6: Add instructions for `src/app/**/*` (Server/Client Components, Server Actions)
- [x] REQ-7: Add instructions for `**/*.test.{ts,tsx}` (testing best practices)
- [x] REQ-8: Add instructions for `src/lib/**/*` (utility functions, error handling)
- [x] REQ-9: Add instructions for `src/actions/**/*` (Server Actions security)
- [x] REQ-10: Add instructions for `e2e/**/*` (E2E test patterns)

### Pre-merge Checks

- [x] REQ-11: Enable title check (warning mode)
- [x] REQ-12: Enable description check (warning mode)
- [x] REQ-13: Enable docstring coverage check (80% threshold)

### Tools & Security

- [x] REQ-14: Enable ESLint integration with config path
- [x] REQ-15: Enable ShellCheck for shell scripts
- [x] REQ-16: Enable Markdownlint for documentation
- [x] REQ-17: Enable Semgrep for security analysis
- [x] REQ-18: Enable Gitleaks for secrets detection

### Knowledge Base

- [x] REQ-19: Enable learnings with `auto` scope
- [x] REQ-20: Enable web search for documentation context
- [x] REQ-21: Enable code guidelines reading (CLAUDE.md)

### Finishing Touches

- [x] REQ-22: Enable docstring generation on demand
- [x] REQ-23: Enable unit test generation on demand

### Cleanup

- [x] REQ-24: Remove `reusable-ai-review.yml` workflow file (already removed)
- [x] REQ-25: Remove AI review job from `pull-request.yml` (already removed)
- [x] REQ-26: Remove `reusable-ai-pr-description.yml` workflow file (already removed)

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

1. [x] Update `.coderabbit.yaml` with full configuration
2. [x] Change review profile from `chill` to `assertive`
3. [x] Add missing path instructions (lib, actions, e2e)
4. [x] Enable pre-merge checks
5. [x] Enable finishing touches features
6. [x] Enable knowledge base settings
7. [x] Enable additional security tools

### Phase 2: Cleanup

8. [x] Remove `.github/workflows/reusable-ai-review.yml` (already removed)
9. [x] Remove `.github/workflows/reusable-ai-pr-description.yml` (already removed)
10. [x] Verify `pull-request.yml` no longer references AI workflows
11. [x] Remove unused AI workflow files (changelog, coverage if unused) (none found)

### Phase 3: Verification (Manual Steps)

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

- [x] Should we use `assertive` or `chill` profile? **Decision: assertive**
- [x] Enable learnings globally or per-repo? **Decision: auto (starts local)**

## Dependencies

- GitHub App installation (manual step)
- Dependency Graph enabled (manual step)

## Enables

- Automated code review without API key management
- Continuous improvement via learnings
- On-demand test and docstring generation
