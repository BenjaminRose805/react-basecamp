# Specifications

This directory contains feature specifications for the project.

## When to Write a Spec

Write a spec when:
- Adding a new feature
- Making significant changes to existing functionality
- The change affects multiple parts of the system
- You need to document decisions and trade-offs

Skip specs for:
- Bug fixes with clear reproduction steps
- Simple refactoring
- Dependency updates
- Documentation-only changes

## How to Create a Spec

1. Copy `spec-template.md` to a new file (e.g., `user-authentication.md`)
2. Fill in all required sections
3. Get approval before implementing
4. Update the spec as implementation reveals new details

## Spec Lifecycle

1. **Draft** - Initial version, open for feedback
2. **In Review** - Being reviewed by stakeholders
3. **Approved** - Ready for implementation
4. **Implemented** - Code is complete and merged

## Template Sections

### Required

- **Goal** - What we're building and why (1-2 sentences)
- **User Stories** - Who uses this and how
- **Success Criteria** - Measurable outcomes
- **Out of Scope** - What we're NOT building

### Optional

- **Technical Constraints** - Stack, performance, etc.
- **Edge Cases** - Tricky scenarios
- **Dependencies** - What this requires
- **Risks** - What could go wrong

## Naming Convention

Use descriptive names that summarize the feature:
- `user-authentication.md`
- `dashboard-analytics.md`
- `payment-integration.md`

## Integration with PRs

- Link the spec in your PR description
- Reference spec sections in commit messages
- Update the spec if requirements change during implementation
