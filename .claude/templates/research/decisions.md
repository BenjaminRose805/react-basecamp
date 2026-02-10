# {{Topic}} Decisions

> **Level:** {{task | spec | feature | project}}
> **Status:** Pending User Input

## Overview

{{1-2 sentences explaining what decisions are needed and why}}

---

{{Use scaled format based on level - see .claude/templates/decisions/}}

## Decision 1: {{Short title}}

{{Use format from appropriate level template:}}
{{- Task: .claude/templates/decisions/task-decision.md}}
{{- Spec: .claude/templates/decisions/spec-decision.md}}
{{- Feature: .claude/templates/decisions/feature-decision.md}}
{{- Project: .claude/templates/decisions/project-decision.md}}

---

## Decision 2: {{Short title}}

{{Same format as Decision 1}}

---

## Decision Record

| Decision | Status | Proposed | Decided | By |
|----------|--------|----------|---------|-----|
| {{decision_1}} | Pending | {{date}} | - | - |
| {{decision_2}} | Pending | {{date}} | - | - |

---

## Constraints

**Length per Decision by Level:**
| Level | Max Length per Decision |
|-------|------------------------|
| Task | ~100 words |
| Spec | ~300 words |
| Feature | ~600 words |
| Project | ~1000 words |

**DO NOT INCLUDE:**
- Implementation steps
- Code to write
- File paths for new files
- Sprint/timeline planning

**Format Reference:**
Use the decision template appropriate to the level from `.claude/templates/decisions/`
