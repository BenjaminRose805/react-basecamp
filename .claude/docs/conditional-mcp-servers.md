# Conditional MCP Servers Guide

This guide documents which MCP servers to keep or remove based on your project needs.

## Server Classification

### Essential (Always Keep)

| Server         | Purpose            | Why Essential                                                                             |
| -------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| **cclsp**      | TypeScript LSP     | Semantic code intelligence, type-aware refactoring, symbol navigation. No CLI equivalent. |
| **playwright** | Browser automation | CDP/WebSocket browser control, accessibility snapshots, session state. No CLI equivalent. |

### Conditional (Project-Dependent)

| Server            | Purpose            | Keep When                                                     |
| ----------------- | ------------------ | ------------------------------------------------------------- |
| **next-devtools** | Next.js dev tools  | Using Next.js 16+ with MCP integration                        |
| **context7**      | Library doc lookup | Frequent use of external libraries, prevent hallucinated APIs |
| **shadcn**        | Component registry | Using shadcn/ui components, need component discovery          |

### Removed (Replaced with CLI)

| Server            | Replacement                  | Why Removed                                               |
| ----------------- | ---------------------------- | --------------------------------------------------------- |
| **github**        | `gh` CLI                     | 100% feature overlap, CLI is more powerful                |
| **vitest**        | `pnpm test` commands         | Simple wrapper, CLI provides same functionality           |
| **spec-workflow** | File-based specs in `specs/` | Simpler file-based workflow, no external dashboard needed |

---

## Conditional Server Details

### next-devtools

**Keep IF:**

- Using Next.js 16 or later
- Need runtime error diagnostics from dev server
- Want route information and build status via MCP

**Remove IF:**

- Not using Next.js
- Using Next.js 15 or earlier (MCP not supported)
- Prefer browser DevTools for debugging

**Alternative without MCP:**

```bash
# Check build status
pnpm build

# View dev server output directly
pnpm dev

# Use browser DevTools for runtime debugging
```

---

### context7

**Keep IF:**

- Frequently working with external libraries (React, tRPC, Prisma, etc.)
- Want to prevent hallucinated API suggestions
- Need up-to-date documentation lookup

**Remove IF:**

- Working primarily with internal code
- Have good familiarity with libraries being used
- Prefer manual documentation lookup

**Alternative without MCP:**

```bash
# Manual documentation lookup
# Visit official docs directly or use web search

# For npm packages, check types
npm info <package> types
```

---

### shadcn

**Keep IF:**

- Using shadcn/ui component library
- Need to discover available components
- Want component examples and usage patterns

**Remove IF:**

- Not using shadcn/ui
- Using a different component library
- Already familiar with all needed components

**Alternative without MCP:**

```bash
# Browse shadcn/ui docs
# https://ui.shadcn.com/docs/components

# Add components via CLI
npx shadcn@latest add button
npx shadcn@latest add card
```

---

## Configuration Examples

### Minimal Setup (Essential Only)

```json
{
  "mcpServers": {
    "cclsp": {
      "command": "npx",
      "args": ["-y", "cclsp"],
      "env": { "CCLSP_CONFIG_PATH": ".claude/cclsp.json" }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

### Next.js Project

```json
{
  "mcpServers": {
    "cclsp": {
      /* ... */
    },
    "playwright": {
      /* ... */
    },
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Full Setup (All Conditional)

```json
{
  "mcpServers": {
    "cclsp": {
      /* ... */
    },
    "playwright": {
      /* ... */
    },
    "next-devtools": {
      /* ... */
    },
    "context7": {
      /* ... */
    },
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

---

## Decision Matrix

| Project Type               | cclsp | playwright | next-devtools | context7 | shadcn   |
| -------------------------- | ----- | ---------- | ------------- | -------- | -------- |
| Next.js 16+ with shadcn    | YES   | YES        | YES           | YES      | YES      |
| Next.js 16+ without shadcn | YES   | YES        | YES           | YES      | NO       |
| Next.js 15 or earlier      | YES   | YES        | NO            | YES      | Optional |
| React (non-Next)           | YES   | YES        | NO            | YES      | Optional |
| Node.js backend only       | YES   | NO         | NO            | YES      | NO       |
| Library/package            | YES   | NO         | NO            | Optional | NO       |

---

## Rollback

To restore a removed MCP server, add its configuration back to `.mcp.json`:

```bash
# Example: Restore github MCP (not recommended)
# Add to .mcp.json:
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"]
}
```

**Note:** A backup of the original configuration is preserved at `.mcp.json.backup`.
