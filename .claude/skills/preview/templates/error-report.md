# Error Report Template

This template provides standardized error reporting with recovery options.
Agents use this to surface failures and guide users toward resolution.

Variable substitution uses `{{double_brace}}` syntax.

---

```text
┌─ ERROR ──────────────────────────────────────────────────────────────┐
│ Stage: {{stage_name}}                                                │
│ Sub-agent: {{sub_agent}} ({{model}})                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Error: {{message}}                                                   │
│ File: {{file_line}}                              (if applicable)       │
├──────────────────────────────────────────────────────────────────────┤
│ Recovery Options:                                                    │
│   1. {{option_1}}                                                    │
│   2. {{option_2}}                                                    │
│   3. {{option_3}}                                                    │
│                                                                      │
│ Checkpoint: {{checkpoint_path}}                                      │
│             (fallback: "N/A - checkpoint support pending")           │
│                                                                      │
│ Resume: {{resume_cmd}}                                               │
└──────────────────────────────────────────────────────────────────────┘
```

**Checkpoint Fallback:**
When checkpoint infrastructure is not available, render as:
`N/A - checkpoint support pending`
