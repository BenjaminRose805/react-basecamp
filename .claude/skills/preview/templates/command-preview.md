# Command Preview Template

This template provides a standardized box-drawing layout for command previews.
Agents use this to render execution plans before running commands.

Variable substitution uses `{{double_brace}}` syntax.

**Spec Path Format:**

- Nested: `specs/basecamp/auth/` (project/feature)
- Standalone: `specs/my-feature/` (feature only)
- Box width: 70 chars (accommodates up to 60-char paths)

---

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /{{command}} - {{description}}                                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ CONTEXT                                                              │
│   Working Dir: {{dir}}                                               │
│   Branch: {{branch}}                            (if applicable)      │
│   Spec: {{spec_path}}                           (if applicable)      │
│   Gate: {{gate}}                                (if applicable)      │
│   Checkpoint: {{checkpoint}}                    (if applicable)      │
│                                                                      │
│ STAGES                                                               │
│   {{n}}. {{stage_name}} ({{sub_agent}} / {{model}})                  │
│      → {{brief_description}}                                         │
│                                                                      │
│ OUTPUT                                                               │
│   {{output_path}}/                              (if applicable)      │
│     ├── {{file_1}}                                                   │
│     └── {{file_2}}                                                   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ COMMAND-SPECIFIC EXTENSIONS                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ PREREQUISITES (/start only)                                          │
│   ☐ {{prerequisite_1}}                                               │
│   ☐ {{prerequisite_2}}                                               │
│                                                                      │
│ SCOPE (/research only)                                               │
│   Search Areas:                                                      │
│     • {{search_area_1}}                                              │
│     • {{search_area_2}}                                              │
│                                                                      │
│ SOURCE (/reconcile only)                                             │
│   Detected: {{source_type}}                                          │
│   Path: {{source_path}}                                              │
│                                                                      │
│ PROGRESS (/implement only)                                           │
│   Tasks: {{completed}}/{{total}} complete                            │
│   ✓ {{completed_task}}                                               │
│   ○ {{pending_task}}                                                 │
│                                                                      │
│ RATE LIMIT (/review only)                                            │
│   CodeRabbit: {{remaining}} reviews remaining this month             │
│                                                                      │
│ COMMIT PREVIEW (/ship only)                                          │
│   Message: {{commit_message}}                                        │
│   Files: {{file_count}} changed                                      │
│     M {{modified_file}}                                              │
│     A {{added_file}}                                                 │
│                                                                      │
│ PR PREVIEW (/ship only)                                              │
│   Title: {{pr_title}}                                                │
│   Target: {{base_branch}} ← {{head_branch}}                          │
│   Labels: {{labels}}                                                 │
│                                                                      │
│ DEPLOYMENT STATUS (/ship + Vercel)                                   │
│   Preview: {{preview_status}} {{preview_url}}                        │
│   Production: {{production_status}}                                  │
│                                                                      │
│ CHECKS (/ship + Vercel)                                              │
│   ● CI: {{ci_status}}                                                │
│   ● Vercel: {{vercel_status}}                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

User Confirmation: AskUserQuestion tool prompts "Run/Cancel?"
(No action bar rendered in template)
```
