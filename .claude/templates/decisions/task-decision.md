# Task Decision Template

For tasks (5-15 min), decisions are presented inline during the workflow.
No separate document is created.

## Format

```text
TASK: {{task_description}}

{{context_sentence}}

OPTIONS:
(A) {{option_a}} {{#if recommended}}[recommended]{{/if}}
    {{option_a_one_liner}}
(B) {{option_b}}
    {{option_b_one_liner}}
{{#if option_c}}
(C) {{option_c}}
    {{option_c_one_liner}}
{{/if}}

Proceed with ({{default}})? [yes/no/other]
```

## Rules

- Maximum 1 paragraph of context
- Maximum 3 options
- One-liner trade-off per option
- Always have a recommendation
- Always end with clear action prompt
- **NO code implementations**
- **NO file creation specifications**
- **NO task lists**

## Length Constraint

~100 words maximum

## Example

```text
TASK: Add avatar upload to user profile

User profiles don't currently support avatars. We need to store and serve images.

OPTIONS:
(A) S3 with presigned URLs [recommended]
    Scalable, CDN-friendly, follows existing file upload patterns
(B) Database blob storage
    Simpler setup but doesn't scale, blocks DB during uploads
(C) Local filesystem
    Development only, not suitable for production

Proceed with (A)? [yes/no/other]
```

## Decision Record

After user confirms, record in task state:

```json
{
  "decision": {
    "question": "Where to store avatar images?",
    "chosen": "A",
    "option": "S3 with presigned URLs",
    "decided_at": "2026-02-05T10:32:00Z"
  }
}
```
