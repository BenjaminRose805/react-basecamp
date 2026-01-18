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

### 4. Vitest MCP

AI-optimized test runner for TDD workflows.

**Setup:**

```bash
claude mcp add vitest -- npx vitest-mcp
```

**Capabilities:**

| Tool                   | What It Does                             |
| ---------------------- | ---------------------------------------- |
| `run_tests`            | Run tests with clean, AI-readable output |
| `run_tests_with_watch` | Watch mode for iterative TDD             |
| `get_coverage`         | Get coverage analysis for specific files |
| `list_test_files`      | Discover test files in the project       |

**Benefits:**

- Test output optimized for AI consumption (no ANSI codes, structured)
- Automatic test file discovery
- Coverage analysis to identify untested code
- Supports iterative TDD workflow

### 5. GitHub MCP

GitHub integration for PR reviews, issues, and repository management.

**Setup:**

```bash
claude mcp add github -- npx @anthropic/mcp-github
```

**Capabilities:**

| Tool                  | What It Does                       |
| --------------------- | ---------------------------------- |
| `create_pull_request` | Create PRs with title and body     |
| `get_pull_request`    | Get PR details and diff            |
| `list_issues`         | List and search repository issues  |
| `create_issue`        | Create issues for bugs or features |
| `get_file_contents`   | Read files from any branch         |

**Benefits:**

- Claude can review PRs and suggest changes
- Create issues for discovered bugs
- Understand code changes across branches

## Recommended MCP Servers

### 6. Context7 MCP

Up-to-date library documentation to prevent hallucinated APIs.

**Setup:**

```bash
claude mcp add context7 -- npx context7-mcp
```

**Capabilities:**

| Tool          | What It Does                              |
| ------------- | ----------------------------------------- |
| `resolve`     | Get current documentation for any library |
| `search_docs` | Search documentation by topic             |

**Benefits:**

- Prevents Claude from hallucinating outdated or non-existent APIs
- Access to current React, Next.js, and npm package documentation
- Reduces errors from using deprecated methods

### 7. Sentry MCP

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

## Documentation MCP Servers

### 8. AWS Code Documentation Generator

Auto-generate comprehensive documentation from code.

**Setup:**

```bash
claude mcp add docs-generator -- npx @aws/mcp-docs-generator
```

**Capabilities:**

| Tool                      | What It Does                             |
| ------------------------- | ---------------------------------------- |
| `generate_readme`         | Generate README.md from project analysis |
| `generate_api_docs`       | Generate API documentation               |
| `generate_component_docs` | Generate component documentation         |

**Benefits:**

- Automated documentation generation
- Consistent documentation format
- Keeps docs in sync with code changes

### 9. MCP Docs Service

Documentation management with structured markdown.

**Setup:**

```bash
claude mcp add mcp-docs -- npx mcp-docs-service
```

**Capabilities:**

| Tool             | What It Does                    |
| ---------------- | ------------------------------- |
| `create_doc`     | Create new documentation files  |
| `update_doc`     | Update existing documentation   |
| `search_docs`    | Search across all documentation |
| `validate_links` | Validate documentation links    |

**Benefits:**

- Structured documentation workflow
- Link validation prevents broken references
- Frontmatter support for metadata

## TDD/SDD MCP Servers

### 10. Spec Workflow MCP (Recommended for SDD)

Complete spec-driven development workflow with real-time dashboard.

**Setup:**

```bash
claude mcp add spec-workflow -- npx -y @pimzino/spec-workflow-mcp@latest .
```

**Capabilities:**

| Tool           | What It Does                                         |
| -------------- | ---------------------------------------------------- |
| `create_spec`  | Create complete spec (Requirements → Design → Tasks) |
| `list_specs`   | Show all specs and their status                      |
| `execute_task` | Run a specific task from a spec                      |
| `approve_spec` | Approve spec for implementation                      |
| `get_progress` | View progress with visual indicators                 |

**Benefits:**

- Sequential workflow: Requirements → Design → Tasks → Implementation
- Real-time web dashboard on port 5000
- VSCode extension for integrated monitoring
- Approval workflow with revision support
- Implementation logs with code statistics
- Keeps human as architect, AI as executor

**Dashboard:** http://localhost:5000

**Usage Examples:**

- "Create a spec for user authentication"
- "List my specs"
- "Execute task 1.2 in spec user-auth"

### 11. Test Runner MCP (Multi-Framework TDD)

Universal test runner supporting 7 testing frameworks.

> **Note:** This overlaps with Vitest MCP (#4). Only install test-runner if you have a polyglot/full-stack project with multiple test frameworks. For Vitest-only projects like this template, use Vitest MCP instead.

**Setup:**

```bash
claude mcp add test-runner -- npx @anthropic/mcp-test-runner
```

**Capabilities:**

| Tool          | What It Does                           |
| ------------- | -------------------------------------- |
| `run_tests`   | Run tests for any supported framework  |
| `list_tests`  | Discover tests across all frameworks   |
| `get_results` | Get detailed test results and failures |
| `watch_tests` | Watch mode for iterative TDD           |

**Supported Frameworks:**

- **Jest** - JavaScript/TypeScript
- **Pytest** - Python
- **Go Tests** - Go
- **Rust Tests** - Cargo test
- **Flutter** - Dart
- **Bats** - Bash Automated Testing System
- **Generic** - Custom test commands

**When to use:**

- Full-stack projects with backend in Go/Python/Rust
- Monorepos with multiple languages
- Projects migrating between test frameworks

**Skip if:** Your project only uses Vitest (use Vitest MCP instead)

### 12. Markdownify MCP

Convert various file types and web content to Markdown.

**Setup:**

```bash
claude mcp add markdownify -- npx markdownify-mcp
```

**Capabilities:**

| Tool            | What It Does                       |
| --------------- | ---------------------------------- |
| `convert_pdf`   | Convert PDF files to Markdown      |
| `convert_docx`  | Convert Word documents to Markdown |
| `convert_url`   | Convert web pages to Markdown      |
| `convert_image` | Extract text from images (OCR)     |

**Benefits:**

- Ingest existing documentation into knowledge bases
- Convert legacy docs for LLM processing
- Prepare content for RAG systems

### 13. ADR Analysis MCP

Architectural Decision Records for spec-driven development.

**Setup:**

```bash
claude mcp add adr -- npx adr-analysis-mcp
```

**Capabilities:**

| Tool                    | What It Does                             |
| ----------------------- | ---------------------------------------- |
| `create_adr`            | Create new architectural decision record |
| `list_adrs`             | List all ADRs in the project             |
| `analyze_impact`        | Analyze impact of proposed changes       |
| `validate_against_adrs` | Check code against existing ADRs         |

**Benefits:**

- Document architectural decisions
- Validate implementations against specs
- Track technical debt and trade-offs

## Optional MCP Servers

### 14. Figma MCP (for design-to-code)

Bridge between Figma designs and React code generation.

**Setup:** Download from [Figma Dev Mode](https://www.figma.com/developers) and run locally.

**Capabilities:**

| Tool            | What It Does                                    |
| --------------- | ----------------------------------------------- |
| `get_code`      | Get React/Tailwind code for selected Figma node |
| `get_image`     | Export images from Figma                        |
| `get_variables` | Get design tokens and variables                 |

### 15. Storybook MCP (for component libraries)

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

# Vitest (for TDD)
claude mcp add vitest -- npx vitest-mcp

# GitHub (for PR reviews)
claude mcp add github -- npx @anthropic/mcp-github
```

## Recommended Setup

```bash
# Context7 (prevents hallucinated APIs)
claude mcp add context7 -- npx context7-mcp

# Sentry (production error monitoring)
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Spec Workflow (for SDD - includes web dashboard)
claude mcp add spec-workflow -- npx -y @pimzino/spec-workflow-mcp@latest .
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

### Vitest MCP not running tests

1. Ensure vitest is installed: `pnpm add -D vitest`
2. Check `vitest.config.ts` exists and is valid
3. Verify test files match the configured pattern

## Configuration Summary

| Server         | Priority    | Use Case                                        |
| -------------- | ----------- | ----------------------------------------------- |
| cclsp          | Required    | Code intelligence, go-to-definition, references |
| next-devtools  | Required    | Dev server errors, project context              |
| playwright     | Required    | Browser testing, UI verification                |
| vitest         | Required    | TDD workflow, test running, coverage            |
| github         | Required    | PR reviews, issues, repository management       |
| context7       | Recommended | Up-to-date library docs, prevent hallucinations |
| sentry         | Recommended | Production error debugging                      |
| spec-workflow  | Recommended | Spec-driven development with dashboard          |
| docs-generator | Optional    | Auto-generate documentation                     |
| mcp-docs       | Optional    | Documentation management                        |
| test-runner    | Optional    | Polyglot projects only (overlaps with vitest)   |
| markdownify    | Optional    | Convert files/URLs to Markdown                  |
| adr            | Optional    | Architectural decision records                  |
| figma          | Optional    | Design-to-code workflow                         |
| storybook      | Optional    | Component library context                       |

## SDD/TDD Workflow

For full spec-driven and test-driven development:

1. **Create spec**: Use `spec-workflow` to create requirements → design → tasks
2. **Approve spec**: Review and approve via dashboard (http://localhost:5000)
3. **Write tests first**: Use `vitest` to write failing tests (or `test-runner` for polyglot projects)
4. **Implement**: Execute tasks from spec with AI assistance
5. **Verify**: Run tests, check coverage, validate against spec
6. **Document**: Auto-generate docs with `docs-generator` or `markdownify`

**Sources:**

- [Spec Workflow MCP](https://github.com/Pimzino/spec-workflow-mcp)
- [Markdownify MCP](https://github.com/zcaceres/markdownify-mcp)
- [Test Runner MCP Guide](https://skywork.ai/skypage/en/test-runner-ai-engineer-guide-code-testing/1980823430285299712)
