# MCP Tool Gaps Analysis

This document provides a comprehensive analysis of MCP (Model Context Protocol) server capabilities versus current agent usage in react-basecamp. It identifies gaps where available tools are not being utilized by agents that could benefit from them.

## Overview

React-basecamp integrates with 11 MCP servers providing 117+ tools. This analysis maps each tool to:

- Its purpose and capabilities
- Which agents currently use it
- Whether there's a gap in utilization

Use this document to track progress on integrating underutilized MCP tools into agent workflows.

---

## MCP Server Capabilities Analysis

### 1. **spec-workflow** (5 tools)

| Tool                  | Purpose                    | Currently Used By                                                                                              | Gap? |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- | ---- |
| `spec-workflow-guide` | Load workflow instructions | spec-writer, distill-spec-writer, slice-creator                                                                | No   |
| `steering-guide`      | Steering document creation | None                                                                                                           | Yes  |
| `spec-status`         | Check spec progress        | code-writer, code-validator, spec-writer, spec-qa, distill-spec-writer, test-writer, ui-builder, slice-creator | No   |
| `approvals`           | Request dashboard approval | spec-writer, distill-spec-writer, slice-creator                                                                | No   |
| `log-implementation`  | Record artifacts           | code-writer, test-writer, ui-builder, security-auditor                                                         | No   |

### 2. **vitest** (4 tools)

| Tool               | Purpose                               | Currently Used By                                     | Gap? |
| ------------------ | ------------------------------------- | ----------------------------------------------------- | ---- |
| `set_project_root` | Initialize project context            | Not explicitly documented                             | Yes  |
| `list_tests`       | Discover test files                   | test-researcher                                       | No   |
| `run_tests`        | Execute tests with AI-friendly output | test-writer, test-validator, code-validator, debugger | No   |
| `analyze_coverage` | Line-by-line coverage analysis        | test-validator                                        | No   |

### 3. **cclsp** (11 tools)

| Tool                     | Purpose                        | Currently Used By                       | Gap?                              |
| ------------------------ | ------------------------------ | --------------------------------------- | --------------------------------- |
| `find_definition`        | Navigate to symbol definition  | debugger, code-researcher               | No                                |
| `find_references`        | Find all usages of a symbol    | debugger, code-researcher               | No                                |
| `rename_symbol`          | Rename across codebase         | None                                    | Yes - code-writer for refactoring |
| `rename_symbol_strict`   | Rename at specific position    | None                                    | Yes                               |
| `get_diagnostics`        | Get TypeScript errors          | test-writer, ui-builder, code-validator | No                                |
| `restart_server`         | Reset LSP state                | None                                    | Low priority                      |
| `get_hover`              | Get type info at position      | None                                    | Yes - debugger could use          |
| `find_workspace_symbols` | Search symbols globally        | None                                    | Yes - researchers should use      |
| `find_implementation`    | Find interface implementations | None                                    | Yes - code-researcher             |
| `prepare_call_hierarchy` | Prepare for call analysis      | None                                    | Yes - debugger should use         |
| `get_incoming_calls`     | Find callers of a function     | None                                    | Yes - debugger should use         |
| `get_outgoing_calls`     | Find callees of a function     | None                                    | Yes - debugger should use         |

### 4. **playwright** (17 tools)

| Tool                       | Purpose                 | Currently Used By       | Gap?                                    |
| -------------------------- | ----------------------- | ----------------------- | --------------------------------------- |
| `browser_navigate`         | Go to URL               | test-writer, ui-builder | No                                      |
| `browser_click`            | Click elements          | test-writer, ui-builder | No                                      |
| `browser_type`             | Type text               | test-writer             | No                                      |
| `browser_fill_form`        | Fill multiple fields    | test-writer             | No                                      |
| `browser_snapshot`         | Accessibility tree      | None                    | Yes - ui-validator should use           |
| `browser_take_screenshot`  | Visual screenshot       | ui-builder, debugger    | No                                      |
| `browser_console_messages` | Get console output      | None                    | Yes - ui-validator, debugger should use |
| `browser_evaluate`         | Run JS in browser       | None                    | Low priority                            |
| `browser_close`            | Close browser           | None                    | Low priority                            |
| `browser_resize`           | Change viewport         | None                    | Yes - ui-builder for responsive         |
| `browser_handle_dialog`    | Accept/dismiss dialogs  | test-writer             | No                                      |
| `browser_network_requests` | Monitor network         | None                    | Yes - debugger should use               |
| `browser_wait_for`         | Wait for conditions     | test-writer             | No                                      |
| `browser_hover`            | Hover over elements     | None                    | Yes - ui-builder for states             |
| `browser_select_option`    | Select dropdown options | test-writer             | No                                      |
| `browser_drag`             | Drag and drop           | test-writer             | No                                      |
| `browser_tabs`             | Manage browser tabs     | None                    | Low priority                            |
| `browser_run_code`         | Execute Playwright code | test-writer             | No                                      |

### 5. **figma** (9 tools)

| Tool                         | Purpose                      | Currently Used By         | Gap?                               |
| ---------------------------- | ---------------------------- | ------------------------- | ---------------------------------- |
| `get_screenshot`             | Screenshot of design         | ui-builder, ui-researcher | No                                 |
| `get_design_context`         | Generate UI code from design | ui-builder                | No                                 |
| `get_metadata`               | Get design structure         | ui-researcher             | No                                 |
| `get_variable_defs`          | Get design tokens            | ui-researcher, ui-builder | No                                 |
| `get_figjam`                 | Process FigJam files         | None                      | Low priority                       |
| `generate_diagram`           | Create diagrams in FigJam    | None                      | Yes - spec-writer for architecture |
| `get_code_connect_map`       | Map Figma to code            | None                      | Yes - ui-builder should use        |
| `add_code_connect_map`       | Add code mapping             | None                      | Yes - ui-builder should use        |
| `whoami`                     | Get Figma user               | None                      | Low priority                       |
| `create_design_system_rules` | Create design rules          | None                      | Yes - ui-researcher could use      |

### 6. **shadcn** (7 tools)

| Tool                                | Purpose                   | Currently Used By         | Gap?                          |
| ----------------------------------- | ------------------------- | ------------------------- | ----------------------------- |
| `get_project_registries`            | Get configured registries | ui-researcher             | No                            |
| `list_items_in_registries`          | List available components | ui-researcher             | No                            |
| `search_items_in_registries`        | Search for components     | ui-researcher, ui-builder | No                            |
| `view_items_in_registries`          | Get component details     | ui-builder                | No                            |
| `get_item_examples_from_registries` | Get usage examples        | None                      | Yes - ui-builder should use   |
| `get_add_command_for_items`         | Get CLI add command       | ui-builder                | No                            |
| `get_audit_checklist`               | Post-build verification   | None                      | Yes - ui-validator should use |

### 7. **sentry** (17 tools)

| Tool                      | Purpose                 | Currently Used By          | Gap?                              |
| ------------------------- | ----------------------- | -------------------------- | --------------------------------- |
| `whoami`                  | Get current user        | None                       | Low priority                      |
| `find_organizations`      | List organizations      | None                       | Low priority                      |
| `find_teams`              | List teams              | None                       | Low priority                      |
| `find_projects`           | List projects           | None                       | Low priority                      |
| `find_releases`           | List releases           | None                       | Low priority                      |
| `get_issue_details`       | Get issue info          | debugger, security-auditor | No                                |
| `get_issue_tag_values`    | Get tag distribution    | None                       | Low priority                      |
| `get_trace_details`       | View distributed traces | None                       | Yes - debugger should use         |
| `get_event_attachment`    | Get attachments         | None                       | Low priority                      |
| `update_issue`            | Resolve/assign issues   | None                       | Yes - debugger should use         |
| `search_events`           | Search/aggregate events | None                       | Yes - security-auditor should use |
| `search_issues`           | List issues             | debugger, security-auditor | No                                |
| `search_issue_events`     | Filter events in issue  | None                       | Yes - debugger should use         |
| `analyze_issue_with_seer` | AI root cause analysis  | None                       | **HIGH** - debugger must use      |
| `create_team`             | Create Sentry team      | None                       | N/A                               |
| `create_project`          | Create Sentry project   | None                       | N/A                               |
| `search_docs`             | Search Sentry docs      | None                       | Low priority                      |
| `get_doc`                 | Get Sentry doc          | None                       | Low priority                      |

### 8. **github** (21 tools)

| Tool                         | Purpose               | Currently Used By     | Gap?                        |
| ---------------------------- | --------------------- | --------------------- | --------------------------- |
| `create_or_update_file`      | Create/update file    | None                  | N/A (use Write tool)        |
| `search_repositories`        | Search repos          | None                  | Low priority                |
| `create_repository`          | Create repo           | None                  | N/A                         |
| `get_file_contents`          | Get file from repo    | None                  | Yes - pr-reviewer could use |
| `push_files`                 | Push multiple files   | None                  | Low priority                |
| `create_issue`               | Create issue          | None                  | Yes - debugger should use   |
| `create_pull_request`        | Create PR             | pr-reviewer           | No                          |
| `fork_repository`            | Fork repo             | None                  | N/A                         |
| `create_branch`              | Create branch         | None                  | Low priority                |
| `list_commits`               | List commits          | pr-reviewer           | No                          |
| `list_issues`                | List issues           | debugger, pr-reviewer | No                          |
| `update_issue`               | Update issue          | debugger              | No                          |
| `add_issue_comment`          | Comment on issue      | debugger              | No                          |
| `search_code`                | Search code in GitHub | None                  | Low priority                |
| `search_issues`              | Search issues         | debugger              | No                          |
| `search_users`               | Search users          | None                  | N/A                         |
| `get_issue`                  | Get issue details     | debugger              | No                          |
| `get_pull_request`           | Get PR details        | pr-reviewer           | No                          |
| `list_pull_requests`         | List PRs              | None                  | Low priority                |
| `create_pull_request_review` | Create review         | pr-reviewer           | No                          |
| `merge_pull_request`         | Merge PR              | None                  | N/A (manual)                |
| `get_pull_request_files`     | Get PR files          | pr-reviewer           | No                          |
| `get_pull_request_status`    | Get PR checks         | pr-reviewer           | No                          |
| `update_pull_request_branch` | Update PR branch      | None                  | Low priority                |
| `get_pull_request_comments`  | Get PR comments       | pr-reviewer           | No                          |
| `get_pull_request_reviews`   | Get existing reviews  | pr-reviewer           | No                          |

### 9. **linear** (18 tools)

| Tool                   | Purpose            | Currently Used By        | Gap?                      |
| ---------------------- | ------------------ | ------------------------ | ------------------------- |
| `list_comments`        | Get issue comments | None                     | Low priority              |
| `create_comment`       | Add comment        | None                     | Yes - debugger should use |
| `list_cycles`          | Get sprints        | None                     | Future - sprint planning  |
| `get_document`         | Get Linear doc     | None                     | Low priority              |
| `list_documents`       | List Linear docs   | None                     | Low priority              |
| `create_document`      | Create doc         | None                     | Low priority              |
| `update_document`      | Update doc         | None                     | Low priority              |
| `get_issue`            | Get issue details  | debugger, pr-reviewer    | No                        |
| `list_issues`          | List issues        | debugger, slice-analyzer | No                        |
| `create_issue`         | Create issue       | debugger, slice-creator  | No                        |
| `update_issue`         | Update issue       | None                     | Yes - debugger should use |
| `list_issue_statuses`  | Get statuses       | None                     | Low priority              |
| `get_issue_status`     | Get status details | None                     | Low priority              |
| `list_issue_labels`    | Get labels         | None                     | Low priority              |
| `create_issue_label`   | Create label       | None                     | N/A                       |
| `list_projects`        | List projects      | None                     | Low priority              |
| `get_project`          | Get project        | None                     | Low priority              |
| `create_project`       | Create project     | None                     | Future - slice-creator    |
| `update_project`       | Update project     | None                     | Low priority              |
| `list_project_labels`  | Get project labels | None                     | Low priority              |
| `list_teams`           | List teams         | None                     | Low priority              |
| `get_team`             | Get team           | None                     | Low priority              |
| `list_users`           | List users         | None                     | Low priority              |
| `get_user`             | Get user           | None                     | Low priority              |
| `search_documentation` | Search Linear docs | None                     | Low priority              |

### 10. **next-devtools** (6 tools)

| Tool                      | Purpose                          | Currently Used By        | Gap?                         |
| ------------------------- | -------------------------------- | ------------------------ | ---------------------------- |
| `browser_eval`            | Playwright-based browser testing | debugger, code-validator | No                           |
| `enable_cache_components` | Migrate to Cache Components      | None                     | N/A (Next.js 16+)            |
| `init`                    | Initialize DevTools context      | None                     | Yes - session start          |
| `nextjs_docs`             | Fetch Next.js docs               | None                     | Yes - code-writer should use |
| `nextjs_index`            | Discover dev servers             | debugger, code-validator | No                           |
| `nextjs_call`             | Call Next.js MCP tools           | debugger, code-validator | No                           |
| `upgrade_nextjs_16`       | Upgrade Next.js                  | None                     | N/A                          |

### 11. **context7** (2 tools)

| Tool                 | Purpose                   | Currently Used By | Gap? |
| -------------------- | ------------------------- | ----------------- | ---- |
| `resolve-library-id` | Find library in Context7  | All writers       | No   |
| `query-docs`         | Get library documentation | All writers       | No   |

---

## Recommended Updates

### High Priority (Critical gaps)

- [x] **debugger**: Add `analyze_issue_with_seer` - AI root cause analysis ✓
- [x] **debugger**: Add `get_incoming_calls`/`get_outgoing_calls` - Trace call hierarchy ✓
- [x] **debugger**: Add `browser_network_requests` - Debug API issues ✓
- [x] **pr-reviewer**: Add `create_pull_request_review` - Submit actual GitHub reviews ✓
- [x] **pr-reviewer**: Add `get_pull_request_files` - See what changed ✓
- [x] **test-researcher**: Add `list_tests` - Discover existing test files ✓
- [x] **test-validator**: Add `analyze_coverage` - Line-level coverage analysis ✓

### Medium Priority (Useful additions)

- [x] **ui-validator**: Add `browser_snapshot` - Accessibility validation ✓
- [x] **ui-validator**: Add `browser_console_messages` - Check for errors ✓
- [x] **ui-validator**: Add `get_audit_checklist` (shadcn) - Post-build audit ✓
- [x] **ui-builder**: Add `get_item_examples_from_registries` - Learn patterns ✓
- [x] **ui-builder**: Add `browser_resize` - Test responsiveness ✓
- [x] **ui-builder**: Add `browser_hover` - Verify hover states ✓
- [x] **ui-builder**: Add `get_code_connect_map`/`add_code_connect_map` - Figma mapping ✓
- [x] **debugger**: Add `update_issue` (GitHub and Linear) - Track resolutions ✓
- [x] **debugger**: Add `get_trace_details` - Distributed tracing ✓
- [x] **debugger**: Add `search_issue_events` - Filter events ✓
- [x] **code-validator**: Add `spec-status` - Verify spec completion ✓
- [x] **code-writer**: Add `rename_symbol` - Safe refactoring ✓
- [x] **code-writer**: Add `nextjs_docs` - Next.js API verification ✓
- [x] **code-researcher**: Add `find_workspace_symbols` - Global symbol search ✓
- [x] **code-researcher**: Add `find_implementation` - Interface implementations ✓
- [x] **security-auditor**: Add `search_events` - Error statistics ✓

### Low Priority (Nice to have)

- [x] **spec-writer**: Add `generate_diagram` (Figma) - Architecture diagrams ✓
- [x] **slice-creator**: Add `create_project` (Linear) - Create Linear projects ✓
- [x] **ui-researcher**: Add `create_design_system_rules` - Design consistency ✓

### New Command/Agent Opportunities

- [ ] Create `/steering` command using `steering-guide` tool
- [ ] Create `/diagram` command using `generate_diagram` (Figma) tool
- [ ] Integrate sprint planning with `list_cycles`, `create_project` (Linear)

---

## Implementation Progress

Track implementation by checking off items above and noting the PR/commit that addressed each gap.

### Status Key

- **✓ in checklist** = Tool added to agent definition in this PR
- **pending** = PR awaiting review/merge
- **PR number** = Merged to main

| Date       | Agent            | Tool Added                                                                                                                                                    | PR/Commit |
| ---------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 2026-01-24 | debugger         | `analyze_issue_with_seer`, `get_incoming_calls`, `get_outgoing_calls`, `browser_network_requests`, `get_trace_details`, `search_issue_events`, `update_issue` | pending   |
| 2026-01-24 | pr-reviewer      | `create_pull_request_review`, `get_pull_request_files`, `get_pull_request_status`, `get_pull_request_comments`, `get_pull_request_reviews`                    | pending   |
| 2026-01-24 | test-researcher  | `list_tests`                                                                                                                                                  | pending   |
| 2026-01-24 | test-validator   | `analyze_coverage`                                                                                                                                            | pending   |
| 2026-01-24 | ui-validator     | `browser_snapshot`, `browser_console_messages`, `get_audit_checklist`                                                                                         | pending   |
| 2026-01-24 | ui-builder       | `get_item_examples_from_registries`, `browser_resize`, `browser_hover`, `get_code_connect_map`, `add_code_connect_map`                                        | pending   |
| 2026-01-24 | code-validator   | `spec-status`                                                                                                                                                 | pending   |
| 2026-01-24 | code-writer      | `rename_symbol`, `nextjs_docs`                                                                                                                                | pending   |
| 2026-01-24 | code-researcher  | `find_workspace_symbols`, `find_implementation`                                                                                                               | pending   |
| 2026-01-24 | security-auditor | `search_events`                                                                                                                                               | pending   |
| 2026-01-24 | spec-writer      | `generate_diagram`                                                                                                                                            | pending   |
| 2026-01-24 | slice-creator    | `create_project`                                                                                                                                              | pending   |
| 2026-01-24 | ui-researcher    | `create_design_system_rules`                                                                                                                                  | pending   |

---

## How to Use This Document

1. **Before updating an agent**: Check this document to see if there are recommended tools to add
2. **After adding a tool**: Check off the item and add an entry to the Implementation Progress table
3. **Periodic review**: Review Low-Priority items quarterly to see if they've become more relevant
4. **New MCP servers**: When adding new MCP servers, update this document with their tools and gap analysis
