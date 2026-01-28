# My App

Next.js 15 + TypeScript + Vitest + Playwright + pnpm

## Core Rule

**ALWAYS delegate work to agents. Never implement directly.**

## CRITICAL: Command Execution Pattern

> **When executing `/design`, `/implement`, `/ship`:**
>
> 1. **Read the agent file** - `.claude/agents/{agent}-agent.md`
> 2. **Use Task tool to spawn sub-agents** - NEVER execute directly
> 3. **Pass context_summary between phases** - NOT raw findings
>
> **Anti-patterns (DO NOT DO):**
>
> - Using Read, Grep, Glob directly → spawn researcher sub-agent
> - Using Edit, Write directly → spawn writer sub-agent
> - Using Bash directly → spawn validator/executor sub-agent
>
> ```typescript
> Task({
>   subagent_type: "general-purpose",
>   description: "Research/Write/Validate [feature]",
>   prompt: "...",
>   model: "opus" | "sonnet" | "haiku",
> });
> ```

## Commands

| Command      | Agent                      |
| ------------ | -------------------------- |
| `/start`     | git-agent                  |
| `/design`    | plan-agent                 |
| `/reconcile` | plan-agent                 |
| `/research`  | plan-agent                 |
| `/implement` | code/ui/docs/eval (routes) |
| `/ship`      | git-agent + check-agent    |
| `/guide`     | (informational)            |
| `/mode`      | dev/basic switch           |

## Key Commands

```bash
pnpm dev        # Dev server
pnpm build      # Build
pnpm test       # Unit tests
pnpm lint && pnpm typecheck  # Quality
```

## Structure

```
src/app/          # Pages
src/components/   # React
src/lib/          # Utils
specs/            # Specs
.claude/agents/   # Agent files
.claude/docs/     # Rules
```
