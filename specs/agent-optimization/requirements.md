# Agent Optimization

> **Status:** Implemented

## Goal

Optimize the Claude agent system for maintainability by aggressively removing unused code and simplifying configuration.

## User Stories

- As a developer, I want a lean `.claude/` directory so that I can understand and maintain the system easily
- As a developer, I want only essential hooks registered so that session startup is fast
- As a developer, I want 7 clear commands so that the workflow is simple to follow

## Success Criteria

- [x] Only 7 commands remain: start, research, design, reconcile, implement, review, ship
- [x] settings.json uses new matcher/hooks format with 9 hooks
- [x] All agent files have valid frontmatter with name and description
- [x] No archived/ directory exists
- [x] All pre-push checks pass (typecheck, tests, lint)

## Technical Constraints

- Must maintain backward compatibility with existing workflows
- Settings.json must use the new Claude Code hook format
- Agent frontmatter must include both `name` and `description` fields

## Out of Scope

- Implementation of new automation scripts (separate feature)
- Changes to the application code
- Modifications to CI/CD pipelines
