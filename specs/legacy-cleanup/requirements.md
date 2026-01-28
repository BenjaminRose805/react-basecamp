# Legacy Cleanup - Requirements

## Overview

Remove dead code, unused imports, and orphaned scripts from the codebase while updating hook registrations and documentation references.

## Functional Requirements

### REQ-001: Remove Dead Hook Scripts

**Type:** Functional
**Priority:** High

The system shall remove dead hook scripts when they are confirmed to be unused and have no active references.

**Acceptance Criteria:**

- [ ] `user-prompt-submit.cjs` is deleted
- [ ] `evaluate-session.cjs` is deleted
- [ ] No references remain in the codebase
- [ ] settings.json hook registrations are removed

### REQ-002: Remove Orphaned Library Code

**Type:** Functional
**Priority:** High

The system shall remove orphaned library functions when they have no imports or callers.

**Acceptance Criteria:**

- [ ] `parse-coderabbit.cjs` is deleted
- [ ] No references remain in the codebase

### REQ-003: Update Hook Registrations

**Type:** Functional
**Priority:** High

The system shall update settings.json when hook scripts are removed to prevent execution errors.

**Acceptance Criteria:**

- [ ] UserPromptSubmit hook registration is removed
- [ ] Stop hook registration is removed
- [ ] settings.json validates successfully
- [ ] No broken hook references remain

### REQ-004: Fix File Extension Reference

**Type:** Functional
**Priority:** Medium

The system shall use correct file extensions when referencing status files.

**Acceptance Criteria:**

- [ ] `user-prompt-review.cjs:171` references `.yaml` instead of `.json`
- [ ] Status file reads work correctly

### REQ-005: Remove Unused Imports

**Type:** Functional
**Priority:** Low

The system shall remove unused imports when they are not referenced in the file.

**Acceptance Criteria:**

- [ ] `setup-package-manager.cjs:27` has unused log import removed
- [ ] File lints without warnings

### REQ-006: Remove Unused Exports

**Type:** Functional
**Priority:** Low

The system shall remove unused exports when they have no external callers.

**Acceptance Criteria:**

- [ ] `utils.cjs:503` grepFile export is removed
- [ ] All actual usages of utils.cjs still work

### REQ-007: Update Documentation References

**Type:** Functional
**Priority:** Medium

The system shall update documentation when optional dependencies are referenced.

**Acceptance Criteria:**

- [ ] `ui-agent.md` clarifies figma MCP is optional
- [ ] Documentation reflects actual requirements

### REQ-008: Remove Obsolete Workflow References

**Type:** Functional
**Priority:** Medium

The system shall remove references to obsolete workflows when they no longer exist.

**Acceptance Criteria:**

- [ ] `start-spec-dashboard.cjs` has spec-workflow references removed
- [ ] `session-end.cjs` has spec-workflow cleanup removed
- [ ] Scripts execute without errors

## Non-Functional Requirements

### REQ-009: Code Quality

**Type:** Non-Functional
**Priority:** High

The system shall maintain code quality standards when performing cleanup operations.

**Acceptance Criteria:**

- [ ] All changes pass linting
- [ ] All changes pass type checking
- [ ] No runtime errors introduced

### REQ-010: Git Hygiene

**Type:** Non-Functional
**Priority:** High

The system shall maintain clean git history when removing legacy code.

**Acceptance Criteria:**

- [ ] All deletions are committed with clear messages
- [ ] Commit messages reference the cleanup task
- [ ] Changes are logically grouped

## Traceability Matrix

| Requirement | Design Section | Tasks      |
| ----------- | -------------- | ---------- |
| REQ-001     | Phase 1        | T1, T2, T3 |
| REQ-002     | Phase 1        | T4         |
| REQ-003     | Phase 2        | T5         |
| REQ-004     | Phase 3        | T6         |
| REQ-005     | Phase 3        | T7         |
| REQ-006     | Phase 3        | T8         |
| REQ-007     | Phase 3        | T9         |
| REQ-008     | Phase 3        | T10        |
| REQ-009     | All Phases     | T11        |
| REQ-010     | Phase 4        | T12        |
