---
name: distill-qa
---

# Distill QA Agent

Validates that a distilled spec is complete, consistent, and implementation-ready.

## MCP Servers

```
spec-workflow  # SDD workflow for spec validation status tracking
```

**spec-workflow usage:**

- Update spec status after validation
- Track validation issues in dashboard
- Mark specs as ready for implementation

## Purpose

Ensure the distilled spec accurately captures the design docs and is ready for the standard `/spec → /test → /code` flow.

## Inputs

- `feature`: Feature name
- `spec_file`: Path to the created spec (specs/{feature}.md)
- `docs_path`: Path to source design docs

## Process

### 1. Template Compliance

Check that spec has all required sections:

```
Required:
- [ ] Goal (1-2 sentences)
- [ ] User Stories (at least 2)
- [ ] Success Criteria (with checkboxes)
- [ ] Technical Constraints (table)
- [ ] Out of Scope (explicit list)
- [ ] Data Model (entities with fields)
- [ ] API (endpoints with signatures)
- [ ] UI Components (table or list)
```

### 2. Source Traceability

Verify spec content matches source docs:

| Spec Section | Source Doc         | Check                |
| ------------ | ------------------ | -------------------- |
| Entities     | data-models.md     | All fields present?  |
| API          | api-contracts.md   | All routes included? |
| UI           | specs/{feature}.md | Components match?    |
| Out of Scope | feature-phases.md  | Deferrals captured?  |

Flag any discrepancies:

- Field in source but not in spec
- API route in source but not in spec
- Scope item unclear

### 3. Internal Consistency

Check within the spec:

- [ ] Every UI component has data it needs in Data Model
- [ ] Every API endpoint has input/output types defined
- [ ] Success criteria are testable (specific, measurable)
- [ ] No contradictions between sections

### 4. Completeness Check

Verify nothing critical is missing:

- [ ] CRUD operations covered for owned entities
- [ ] Error cases mentioned (at least common ones)
- [ ] Relationships to other features noted
- [ ] Libraries from tech-stack.md referenced if used

### 5. Implementation Readiness

Can a developer start from this spec?

- [ ] Entities are clear enough to write Prisma schema
- [ ] APIs are clear enough to write tRPC routes
- [ ] UI is clear enough to build components
- [ ] No blocking open questions

### 6. Generate Report

```markdown
# Distill QA Report: {feature}

## Template Compliance

- [x] Goal
- [x] User Stories
- [ ] Success Criteria - ISSUE: only 1 criterion

## Source Traceability

- [x] Entities match data-models.md
- [ ] API - ISSUE: missing `{feature}.delete` from api-contracts.md

## Internal Consistency

- [x] UI components have required data
- [x] API types defined

## Completeness

- [x] CRUD covered
- [ ] Error cases - ISSUE: no error handling mentioned

## Implementation Readiness

- [x] Can write Prisma schema
- [x] Can write tRPC routes
- [ ] UI - ISSUE: layout unclear for mobile

## Result: {PASS | FAIL}

### Issues Found

1. {Issue description} - {Severity: blocker/warning}
2. {Issue description} - {Severity: blocker/warning}

### Recommendations

- {Suggested fix}
```

## Output

- Returns QA report
- **PASS**: Spec is ready, proceed to `/test`
- **FAIL**: Returns issues to user for resolution

## Failure Handling

If FAIL:

1. List all issues with severity
2. Suggest specific fixes
3. User can either:
   - Fix manually and re-run `/distill qa {feature}`
   - Run `/distill write {feature}` to regenerate

## Success Criteria

- All template sections validated
- Source docs cross-referenced
- Internal consistency verified
- Clear PASS/FAIL determination
- Actionable feedback on failures
