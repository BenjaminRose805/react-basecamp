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
  ✓ Stage 1: {{completed_stage_name}} ({{duration}})
  ✓ Stage 2: {{completed_stage_name}} ({{duration}})
  ● Stage 3: {{running_stage_name}} (in progress)
  ○ Stage 4: {{pending_stage_name}} (pending)
  ○ Stage 5: {{pending_stage_name}} (pending)
```

**Unicode Indicators:**

- ✓ Complete
- ● Running
- ○ Pending
- ✗ Failed
- ⊘ Skipped
