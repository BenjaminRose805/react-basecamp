# Stage Progress Template

This template provides real-time progress tracking during command execution.
Agents use this to render current stage status and overall completion progress.

Variable substitution uses `{{double_brace}}` syntax.

---

```text
/{{command}} - {{description}}

Stage {{n}}/{{total}}: {{stage_name}}
  ● Running: {{sub_agent}} ({{model}})
  ├── {{current_action}}...
  └── Elapsed: {{elapsed}}

[============================] {{percent}}% | Stage {{n}}/{{total}} | {{elapsed}} elapsed

Stage Status:
{{#stages}}
  {{indicator}} Stage {{stage_number}}: {{stage_name}} ({{stage_status}})
{{/stages}}
```

**Unicode Indicators:**

- ✓ Complete
- ● Running
- ○ Pending
- ✗ Failed
- ⊘ Skipped
