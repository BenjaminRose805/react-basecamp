# Design: {{name}}

> **Status:** Draft
> **Created:** {{created}}
> **Spec ID:** {{id}}

## Overview

{{brief_description_of_design_approach}}

---

## Architecture

**Current State:**

```text
{{current_state_diagram_or_description}}
```

**Target State:**

```text
{{target_state_diagram_or_description}}
```

---

## Component Design

### 1. {{component_name}}

{{description_of_component}}

| Input     | Output     |
| --------- | ---------- |
| {{input}} | {{output}} |

**Implementation:** {{implementation_approach}}

---

## Data Models

### {{model_name}}

```typescript
interface {{ModelName}} {
  id: string;
  {{field_name}}: {{field_type}};
}
```

---

## Data Flow

```text
{{step_1}} -> {{step_2}} -> {{step_3}}
```

---

## Error Handling

### {{error_scenario}}

```text
Error: {{error_message}}
```

**Response:** {{how_to_handle}}

---

## Testing Strategy

| Test Type   | Test Case | Verification        |
| ----------- | --------- | ------------------- |
| Unit        | {{case}}  | {{expected_result}} |
| Integration | {{case}}  | {{expected_result}} |

---
