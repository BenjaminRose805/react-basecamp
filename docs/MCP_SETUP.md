# MCP Server Configuration

Model Context Protocol (MCP) servers extend Claude Code's capabilities by giving it access to development tools, error monitoring, and design context.

## Required MCP Servers

### 1. TypeScript LSP MCP (cclsp)

Gives Claude IDE-like code intelligence capabilities.

**Setup:**

1. Create config file `.claude/cclsp.json`:

```json
{
  "servers": [
    {
      "extensions": ["ts", "tsx", "js", "jsx"],
      "command": ["npx", "-y", "typescript-language-server", "--stdio"],
      "rootDir": "."
    }
  ]
}
```

2. Add the MCP server with environment variable:

```bash
claude mcp add cclsp -e CCLSP_CONFIG_PATH=.claude/cclsp.json -- npx -y cclsp
```

**Capabilities:**

| Tool              | What It Does                      |
| ----------------- | --------------------------------- |
| `find_definition` | Jump to where a symbol is defined |
| `find_references` | Find all usages of a symbol       |
| `get_hover`       | Get type information for a symbol |
| `get_diagnostics` | Get real-time TypeScript errors   |
| `rename_symbol`   | Rename across the codebase        |

**Benefits:**

- Navigate code in 50ms vs 45 seconds with text search
- Understand types and relationships instantly
- Accurate refactoring with full reference tracking

### 2. Next.js DevTools MCP

Access live Next.js dev server state for real-time error detection.

**Setup:**

```bash
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest
```

**Capabilities:**

| Tool                   | What It Does                                             |
| ---------------------- | -------------------------------------------------------- |
| `get_errors`           | Retrieve build, runtime, and type errors from dev server |
| `get_logs`             | Access development server logs                           |
| `get_page_metadata`    | Query routes, pages, and component metadata              |
| `get_project_metadata` | Get project structure and config                         |

**Benefits:**

- Claude sees build errors in real-time
- Can fix errors before you even notice them
- Understands project structure

### 3. Playwright MCP

Browser automation for testing and verification.

**Setup:**

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

**Capabilities:**

| Tool               | What It Does                          |
| ------------------ | ------------------------------------- |
| `browser_navigate` | Navigate to URLs                      |
| `browser_click`    | Click elements by accessibility label |
| `browser_snapshot` | Get accessibility tree snapshot       |
| `browser_type`     | Type into form fields                 |

**Benefits:**

- Claude can verify UI changes in a real browser
- Test user flows without screenshots
- Uses accessibility tree (not screenshots) for efficiency

### 4. CLI Tools (Replacing Former MCP Servers)

Some MCP servers have been replaced with CLI equivalents for better reliability:

**Vitest → pnpm test**

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
```

**GitHub → gh CLI**

```bash
gh auth login          # Authenticate once
gh pr create           # Create PR
gh pr view [PR#]       # View PR details
gh issue list          # List issues
```

**Spec Workflow → File-based specs**

Specs are now managed as files in `specs/` directory:

```
specs/
└── feature-name/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Recommended MCP Servers

### 6. Linear MCP

Issue tracking and project management for connecting code work to Linear issues.

**Setup:**

```bash
claude mcp add linear -- npx @anthropic/linear-mcp@latest
```

**Capabilities:**

| Tool           | What It Does                          |
| -------------- | ------------------------------------- |
| `list_issues`  | List and filter issues by team/status |
| `get_issue`    | Get issue details and attachments     |
| `create_issue` | Create new issues                     |
| `update_issue` | Update issue status and fields        |
| `list_teams`   | List teams in workspace               |
| `list_cycles`  | List sprint cycles                    |

**Benefits:**

- Claude can check issue requirements before implementing
- Create issues for bugs discovered during development
- Link PRs to issues with `Fixes BAS-XXX` pattern
- Update issue status as work progresses
- Research agent uses to check for existing/related issues

### 7. Context7 MCP

Up-to-date library documentation to prevent hallucinated APIs.

**Setup:**

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

**Capabilities:**

| Tool                 | What It Does                        |
| -------------------- | ----------------------------------- |
| `resolve-library-id` | Resolve library name to Context7 ID |
| `query-docs`         | Get documentation for a library     |

**Benefits:**

- Prevents Claude from hallucinating outdated or non-existent APIs
- Access to current React, Next.js, and npm package documentation
- Reduces errors from using deprecated methods

### 8. Sentry MCP

AI-powered error monitoring and debugging.

**Setup:**

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

**Capabilities:**

| Tool               | What It Does                           |
| ------------------ | -------------------------------------- |
| `get_sentry_issue` | Retrieve full issue context            |
| `search_issues`    | Natural language search for errors     |
| `get_issue_events` | Get error occurrences and stack traces |

**Benefits:**

- Claude can see production errors directly
- Root cause analysis with full context
- Can suggest fixes based on error patterns

### 9. Figma MCP

Bridge between Figma designs and React code generation.

**Setup:**

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

**Capabilities:**

| Tool               | What It Does                                    |
| ------------------ | ----------------------------------------------- |
| `get_frame_layout` | Get layout info from selected Figma frames      |
| `get_tokens`       | Get design tokens (colors, typography, spacing) |
| `get_components`   | Get component structure and variants            |
| `get_breakpoints`  | Get responsive design breakpoints               |

**Benefits:**

- Claude can see design specs while building UI
- Design tokens are used directly in implementation
- Verify built components match designs
- Works with Figma Design, FigJam, and Make files

### 10. shadcn/ui MCP

Access to shadcn/ui component registry with 400+ components, blocks, and examples.

**Setup:**

```bash
claude mcp add shadcn -- npx shadcn@latest mcp
```

**Capabilities:**

| Tool                                | What It Does                               |
| ----------------------------------- | ------------------------------------------ |
| `list_items_in_registries`          | List all available components and blocks   |
| `search_items_in_registries`        | Search components by name or description   |
| `view_items_in_registries`          | Get component source code and dependencies |
| `get_item_examples_from_registries` | Get usage examples and demos               |
| `get_add_command_for_items`         | Get the CLI command to add components      |

**Benefits:**

- Claude sees actual component APIs (no hallucinated props)
- Access to 57 UI components, 100+ pre-built blocks, 200+ examples
- Supports third-party and private registries
- Works with namespaced registries (`@namespace` syntax)

**Available Content:**

| Type       | Count | Examples                                   |
| ---------- | ----- | ------------------------------------------ |
| Components | 57    | button, card, dialog, table, form, sidebar |
| Blocks     | 100+  | login pages, dashboards, calendars, charts |
| Examples   | 200+  | Demo implementations for each component    |
| Themes     | 5     | stone, zinc, neutral, gray, slate          |

**Usage:**

```bash
# Ask Claude to add a component
"Add the button and card components"

# Claude will use the MCP to get the correct command:
npx shadcn@latest add button card
```

## Quick Setup (Essential Servers)

Run these commands to set up essential MCP servers:

```bash
# TypeScript LSP (requires config file - see section 1)
claude mcp add cclsp -e CCLSP_CONFIG_PATH=.claude/cclsp.json -- npx -y cclsp

# Next.js DevTools (Next.js 16+ only)
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest

# Playwright
claude mcp add playwright -- npx @playwright/mcp@latest
```

## Recommended Setup

```bash
# Linear (issue tracking)
claude mcp add linear -- npx @anthropic/linear-mcp@latest

# Context7 (prevents hallucinated APIs)
claude mcp add context7 -- npx -y @upstash/context7-mcp

# Sentry (production error monitoring)
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Figma (design-to-code workflow)
claude mcp add --transport http figma https://mcp.figma.com/mcp

# shadcn/ui (component registry access)
claude mcp add shadcn -- npx shadcn@latest mcp
```

## CLI Prerequisites (No MCP Required)

```bash
# GitHub CLI - replaces github MCP server
gh auth login

# Vitest - replaces vitest MCP server (use pnpm test commands)
pnpm test:run
pnpm test:coverage
```

## Verification

After setup, verify MCP servers are working:

```bash
claude mcp list
```

You should see all configured servers listed.

## Troubleshooting

### Server not responding

1. Check if the server is running: `claude mcp list`
2. Remove and re-add the server: `claude mcp remove <name> && claude mcp add ...`
3. Check for port conflicts

### TypeScript LSP not finding definitions

1. Ensure `tsconfig.json` is valid
2. Run `pnpm install` to ensure dependencies are installed
3. Restart the LSP server

### Next.js DevTools not showing errors

1. Ensure dev server is running: `pnpm dev`
2. Check that the MCP server is connected to the right port

## Configuration Summary

| Server        | Priority    | Use Case                                         |
| ------------- | ----------- | ------------------------------------------------ |
| cclsp         | Essential   | Code intelligence, go-to-definition, references  |
| next-devtools | Essential   | Dev server errors, project context (Next.js 16+) |
| playwright    | Essential   | Browser testing, UI verification                 |
| linear        | Recommended | Issue tracking, link PRs to issues, workflows    |
| context7      | Recommended | Up-to-date library docs, prevent hallucinations  |
| sentry        | Recommended | Production error debugging                       |
| figma         | Recommended | Design-to-code workflow, design tokens           |
| shadcn        | Recommended | shadcn/ui components, blocks, examples           |

**CLI Replacements:**

| Former MCP    | Replacement                            |
| ------------- | -------------------------------------- |
| vitest        | `pnpm test` commands                   |
| github        | `gh` CLI                               |
| spec-workflow | File-based specs in `specs/` directory |

## SDD/TDD Workflow

For full spec-driven and test-driven development:

1. **Create spec**: Use `/plan` command to create specs in `specs/` directory
2. **Approve spec**: Review and approve the generated spec files
3. **Write tests first**: Run `pnpm test` for TDD workflow
4. **Implement**: Use `/implement` to build the approved spec
5. **Verify**: Run `pnpm test:run && pnpm typecheck` to validate
