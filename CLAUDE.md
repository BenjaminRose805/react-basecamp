# {{Project Name}}

{{Tech stack description}}

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

| Command      | Agent                       | Description                         |
| ------------ | --------------------------- | ----------------------------------- |
| `/start`     | git-agent                   | Create worktree for feature         |
| `/design`    | plan-agent                  | Create spec from requirements       |
| `/implement` | code/ui/docs/eval (routed)  | Build from approved spec            |
| `/ship`      | prune-agent + git-agent + check-agent | Prune, commit, PR, verify |
| `/review`    | plan-agent                  | 4-loop quality review               |
| `/reconcile` | plan-agent                  | Address review feedback             |
| `/research`  | plan-agent                  | Gather context before writing       |

## Workflow

```
/start → /design → /implement → /review → /ship
```

## Structure

```
.claude/
├── agents/           # 8 agents + templates/
├── commands/         # 7 commands
├── config/           # Agent configs
├── protocols/        # Communication protocols
├── scripts/          # Hooks + libs
├── skills/           # Core + stack skills
└── sub-agents/       # Templates + sizing heuristics
specs/
├── templates/        # 10 spec templates
└── README.md
```

## Key Commands

```bash
{{dev_command}}      # Dev server
{{build_command}}    # Build
{{test_command}}     # Unit tests
{{lint_command}} && {{typecheck_command}}  # Quality
```
