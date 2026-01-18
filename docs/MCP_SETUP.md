# MCP Server Configuration

Model Context Protocol (MCP) servers extend Claude Code's capabilities by giving it access to development tools, error monitoring, and design context.

## Required MCP Servers

### 1. TypeScript LSP MCP (cclsp)

Gives Claude IDE-like code intelligence capabilities.

**Setup:**

```bash
claude mcp add cclsp -- npx cclsp
```

**Capabilities:**

| Tool              | What It Does                      |
| ----------------- | --------------------------------- |
| `goto_definition` | Jump to where a symbol is defined |
| `find_references` | Find all usages of a symbol       |
| `hover`           | Get type information for a symbol |
| `diagnostics`     | Get real-time TypeScript errors   |
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

## Recommended MCP Servers

### 4. Sentry MCP

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

## Optional MCP Servers

### 5. Figma MCP (for design-to-code)

Bridge between Figma designs and React code generation.

**Setup:** Download from [Figma Dev Mode](https://www.figma.com/developers) and run locally.

**Capabilities:**

| Tool            | What It Does                                    |
| --------------- | ----------------------------------------------- |
| `get_code`      | Get React/Tailwind code for selected Figma node |
| `get_image`     | Export images from Figma                        |
| `get_variables` | Get design tokens and variables                 |

### 6. Storybook MCP (for component libraries)

Access Storybook documentation and component props.

**Setup:**

```bash
claude mcp add storybook -- npx storybook-mcp
```

**Capabilities:**

| Tool                 | What It Does                      |
| -------------------- | --------------------------------- |
| `getComponentList`   | List all components in Storybook  |
| `getComponentsProps` | Get detailed props for components |

## Quick Setup (All Required Servers)

Run these commands to set up all required MCP servers:

```bash
# TypeScript LSP
claude mcp add cclsp -- npx cclsp

# Next.js DevTools
claude mcp add next-devtools -- npx -y next-devtools-mcp@latest

# Playwright
claude mcp add playwright -- npx @playwright/mcp@latest
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

| Server        | Priority    | Use Case                                        |
| ------------- | ----------- | ----------------------------------------------- |
| cclsp         | Required    | Code intelligence, go-to-definition, references |
| next-devtools | Required    | Dev server errors, project context              |
| playwright    | Required    | Browser testing, UI verification                |
| sentry        | Recommended | Production error debugging                      |
| figma         | Optional    | Design-to-code workflow                         |
| storybook     | Optional    | Component library context                       |
