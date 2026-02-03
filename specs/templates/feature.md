# Feature: {{feature_name}}

> **Template for feature-level artifacts.**
> Replace all {{placeholders}} with actual content.

---

## Overview

{{brief_description_of_the_feature}}

{{extended_context_explaining_why_this_feature_exists_and_what_problems_it_solves}}

**Key Capabilities:**

- {{capability_1}}
- {{capability_2}}
- {{capability_3}}

---

## Spec List

| Spec            | Description            | Status     | Dependencies   |
| --------------- | ---------------------- | ---------- | -------------- |
| {{spec_name_1}} | {{spec_description_1}} | {{status}} | {{depends_on}} |
| {{spec_name_2}} | {{spec_description_2}} | {{status}} | {{depends_on}} |
| {{spec_name_3}} | {{spec_description_3}} | {{status}} | {{depends_on}} |

---

## Build Order

**Phase 1: {{phase_name}}**

- {{spec_1}} - {{rationale_for_ordering}}
- {{spec_2}} - {{rationale_for_ordering}}

**Phase 2: {{phase_name}}**

- {{spec_3}} - {{rationale_for_ordering}}
- {{spec_4}} - {{rationale_for_ordering}}

**Rationale:** {{explanation_of_build_order_strategy}}

---

## Cross-Feature Dependencies

**This feature depends on:**

- `{{project_name}}/{{other_feature_name}}/{{spec_name}}` - {{reason_for_dependency}}
- `{{project_name}}/{{other_feature_name}}/{{spec_name}}` - {{reason_for_dependency}}

**This feature is depended on by:**

- `{{project_name}}/{{other_feature_name}}/{{spec_name}}` - {{reason_for_dependency}}

**Example format for depends_on references:**

```text
project-name/feature-name/spec-name
other-project/other-feature/other-spec
```

---

**Note:** Parent features.json may be stale. Update manually if needed. Feature refinements do not propagate to parent.
