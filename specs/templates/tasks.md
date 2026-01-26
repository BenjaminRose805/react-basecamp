# Tasks: [Feature Name]

> **Status:** Draft
> **Created:** [YYYY-MM-DD]
> **Spec ID:** [feature-id]

## Progress

- [ ] Phase 1: [Phase Name] (0/N)
- [ ] Phase 2: [Phase Name] (0/N)
- [ ] Phase 3: [Phase Name] (0/N)

**Total:** 0/N tasks complete

---

## Phase 1: [Phase Name]

[Brief description of phase goals]

- [ ] **T001** [US#] Verify prerequisites
  - [Step 1]
  - [Step 2]
  - File: [file path or N/A]

- [ ] **T002** [US#] [Task description]
  - [Step 1]
  - Expected: [outcome]
  - File: [file path]

---

## Phase 2: [Phase Name]

[Brief description of phase goals]

- [ ] **T003** [US#] [Task description]
  - [Step 1]
  - [Step 2]
  - File: [file path]

- [ ] **T004** [US#] [Task description]
  - [Step 1]
  - File: [file path]

---

## Phase 3: Validation

- [ ] **T005** [US#] Test [component]
  - Run: [command]
  - Verify: [expected result]
  - File: N/A (manual testing)

- [ ] **T006** Document any issues found
  - If validation fails, document in spec
  - File: `specs/[feature]/issues.md` (if needed)

---

## Task Dependencies

```
T001 ---> T002 ---> T003
              |
              +---> T004 ---> T005 ---> T006
```

**Legend:**

- [Parallel tasks explanation]
- [Sequential dependencies explanation]

---

## Execution Notes

### Parallel Execution Opportunities

| Phase | Parallel Tasks |
| ----- | -------------- |
| 1     | T001, T002     |
| 2     | T003, T004     |

### Estimated Effort

| Phase     | Tasks | Effort     |
| --------- | ----- | ---------- |
| [Phase]   | N     | ~X min     |
| **Total** | **N** | **~X min** |

### Rollback Checkpoint

After [task], assess:

- IF [condition] fails -> [rollback action]
- IF [condition] succeeds -> proceed with [next phase]

---

## Completion Criteria

All tasks are complete WHEN:

1. [ ] [Criterion 1]
2. [ ] [Criterion 2]
3. [ ] [Criterion 3]
