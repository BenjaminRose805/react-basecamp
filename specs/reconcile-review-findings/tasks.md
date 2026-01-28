# Review Findings Reconciliation - Tasks

Fixes for findings from 4-loop code review (Loop 2 Claude + Loop 3 CodeRabbit).

## Summary

| Severity | Count | Category                                                             |
| -------- | ----- | -------------------------------------------------------------------- |
| Major    | 1     | Breaking change                                                      |
| Minor    | 11    | Code quality (3), Documentation (5), Configuration (2), Security (1) |

---

## MAJOR Priority

### T001: Add backward compatibility to inject-rules.cjs

- **File**: `.claude/sub-agents/lib/inject-rules.cjs`
- **Lines**: 28-30
- **Issue**: ROLE_RULE_MAP renamed from `plan-researcher`/`plan-writer` to `domain-researcher`/`domain-writer` without aliases
- **Fix**: Add old keys as aliases pointing to same values
- **Complexity**: Small
- **\_Prompt**: Role: Backend Developer | Task: Add backward compatibility aliases to ROLE_RULE_MAP for plan-researcher and plan-writer keys | Restrictions: Keep new keys as primary, old keys as aliases | Success: Both old and new role names work with injectRulesForRole()

---

## MINOR Priority - Code Quality

### T002: Add JSON parse error handling in environment-check.cjs

- **File**: `.claude/scripts/environment-check.cjs`
- **Lines**: 84
- **Issue**: Silent JSON parse failure
- **Fix**: Wrap in try-catch, return null on error
- **Complexity**: Small

### T003: Fix unused parameter in user-prompt-review.cjs

- **File**: `.claude/scripts/hooks/user-prompt-review.cjs`
- **Lines**: 127
- **Issue**: Unused destructuring parameter `_`
- **Fix**: Use explicit filter or rename
- **Complexity**: Small

### T004: Replace global regex with matchAll in parse-coderabbit.cjs

- **File**: `.claude/scripts/lib/parse-coderabbit.cjs`
- **Lines**: 45
- **Issue**: Global regex in while loop
- **Fix**: Use `matchAll()` instead
- **Complexity**: Small

---

## MINOR Priority - Documentation

### T005: Remove $ARGUMENTS placeholders from command files

- **Files**: `review.md:315`, `start.md:172`, `reconcile.md:197`
- **Issue**: Template placeholders left in files
- **Fix**: Delete the $ARGUMENTS lines
- **Complexity**: Small

### T006: Fix config path reference in SKILL.md

- **File**: `.claude/skills/code-review/SKILL.md`
- **Lines**: 79-80
- **Issue**: References YAML but system uses JSON
- **Fix**: Change to review-config.json
- **Complexity**: Small

---

## MINOR Priority - Configuration

### T007: Add $schema to environment.json

- **File**: `.claude/config/environment.json`
- **Lines**: 1
- **Issue**: Missing schema for IDE validation
- **Fix**: Add $schema property
- **Complexity**: Small

### T008: Document rate limit tier in review-config.yaml

- **File**: `.claude/config/review-config.yaml`
- **Lines**: 57-59
- **Issue**: Rate limit lacks tier context
- **Fix**: Add comment or tier field
- **Complexity**: Small

---

## MINOR Priority - Security

### T009: Document secure install alternative

- **File**: `.claude/config/environment.json`
- **Lines**: 3-10
- **Issue**: Insecure curl|sh pattern
- **Fix**: Add comment noting this is standard CodeRabbit install; document manual verification option
- **Complexity**: Small

---

## Implementation Order

1. T001 (MAJOR - breaking change)
2. T002-T004 (code quality batch)
3. T005-T006 (documentation batch)
4. T007-T009 (configuration/security batch)

## Estimated Effort

| Task      | Effort      |
| --------- | ----------- |
| T001      | 15 min      |
| T002-T004 | 15 min      |
| T005-T006 | 10 min      |
| T007-T009 | 15 min      |
| **Total** | **~1 hour** |
