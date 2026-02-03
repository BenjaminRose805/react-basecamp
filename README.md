# Claude Code Workflow Template

A production-ready agent workflow system for Claude Code that implements spec-driven development with automated planning, implementation, review, and deployment.

## Overview

This template provides a complete workflow architecture for software development using Claude Code agents. It includes 8 specialized agents, 7 slash commands, dynamic sub-agent orchestration, and a comprehensive skill system that enforces best practices like TDD and spec-driven development.

## Quick Start

1. Clone or copy this template to your project directory
2. Customize `CLAUDE.md` with your project details:
   ```markdown
   # {{Project Name}}
   {{Tech stack description}}

   ## Key Commands
   {{dev_command}}      # Dev server
   {{build_command}}    # Build
   {{test_command}}     # Unit tests
   {{lint_command}} && {{typecheck_command}}  # Quality
   ```
3. Configure `.mcp.json` with your MCP servers (optional)
4. Start using slash commands: `/start`, `/design`, `/implement`, `/ship`

## What's Included

```
.claude/
├── agents/              # 8 specialized agents
│   ├── code-agent.md    # Backend/API implementation (TDD)
│   ├── ui-agent.md      # Frontend/component implementation
│   ├── docs-agent.md    # Documentation generation
│   ├── eval-agent.md    # Test harness and evaluation
│   ├── plan-agent.md    # Spec creation and planning
│   ├── git-agent.md     # Git operations and worktree management
│   ├── prune-agent.md   # Cleanup before commits
│   └── check-agent.md   # Post-deployment verification
│
├── commands/            # 7 slash commands
│   ├── start.md         # Create worktree and verify environment
│   ├── design.md        # Create specs from requirements
│   ├── implement.md     # Build from approved specs
│   ├── review.md        # 4-loop quality review
│   ├── reconcile.md     # Address review feedback
│   ├── research.md      # Gather context before planning
│   └── ship.md          # Prune, commit, PR, verify
│
├── sub-agents/          # Dynamic sub-agent system
│   ├── templates/       # Reusable sub-agent templates
│   │   ├── domain-researcher.md   # Research phase (Opus)
│   │   ├── domain-writer.md       # Write phase (Sonnet)
│   │   └── quality-validator.md   # Validation phase (Haiku)
│   └── lib/             # Sizing heuristics and utilities
│
├── skills/              # Reusable capabilities
│   ├── core/            # 12 core skills
│   │   ├── research/        # Codebase exploration
│   │   ├── tdd-workflow/    # Red-Green-Refactor
│   │   ├── code-review/     # Quality review loops
│   │   ├── qa-checks/       # Build, test, lint, type checking
│   │   ├── git-operations/  # Git workflow automation
│   │   ├── pr-operations/   # Pull request management
│   │   ├── coding-standards/ # KISS, DRY, YAGNI
│   │   ├── security-patterns/ # Security best practices
│   │   ├── routing/         # Agent routing logic
│   │   ├── preview/         # Command previews
│   │   ├── progress/        # Progress tracking
│   │   └── eval-harness/    # Test evaluation
│   └── stack/           # Framework-specific skills
│       ├── frontend-patterns/  # React, Next.js patterns
│       └── backend-patterns/   # tRPC, Prisma patterns
│
├── scripts/             # Automation and hooks
│   ├── hooks/           # 10 session management hooks
│   └── lib/             # Shared utilities (spec-resolver, etc.)
│
├── config/              # Agent configurations
├── protocols/           # Communication protocols
└── state/               # Checkpoint files (gitignored)

specs/
├── templates/           # 10 spec templates
│   ├── requirements.md  # What and why
│   ├── design.md        # How and architecture
│   ├── tasks.md         # Step-by-step implementation
│   ├── summary.md       # Executive summary
│   ├── spec.json        # Structured metadata
│   └── meta.yaml        # Build metadata
└── README.md            # Spec organization guide
```

## Workflow

The standard development workflow follows this pipeline:

```
/start → /design → /implement → /review → /ship
```

### 1. Start (/start)

Create a worktree and verify your development environment:

```bash
/start user-authentication    # Create worktree for feature
/start --full                 # Run full verification
/start --security             # Include security audit
```

Creates worktree at `../<repo>--<feature>` with a new branch.

### 2. Design (/design)

Create implementation specs through conversational planning:

```bash
/design user-authentication   # Create spec from requirements
/design auth --project        # Project-level design
/design auth --feature        # Feature-level design
/design login --spec          # Spec-level design
```

Outputs: `specs/<feature>/requirements.md`, `design.md`, `tasks.md`

### 3. Implement (/implement)

Build from approved specs using TDD methodology:

```bash
/implement user-authentication     # Auto-route to correct agent
/implement login backend           # Backend implementation
/implement dashboard ui            # Frontend implementation
/implement api-guide docs          # Documentation generation
```

Automatically routes to specialized agents (code, ui, docs, eval) based on domain.

### 4. Review (/review)

Run 4-loop quality review:

```bash
/review user-authentication   # Full quality review
```

Loops: Security → Performance → UX → Maintainability

### 5. Reconcile (/reconcile)

Address review feedback:

```bash
/reconcile user-authentication   # Fix review issues
```

### 6. Ship (/ship)

Prune, commit, create PR, and verify:

```bash
/ship user-authentication     # Full ship workflow
/ship auth --no-pr            # Skip PR creation
/ship auth --no-verify        # Skip post-deployment checks
```

Handles: cleanup, git commit (with hooks), PR creation, verification.

## Commands Reference

| Command      | Agent                       | Description                             |
| ------------ | --------------------------- | --------------------------------------- |
| `/start`     | git-agent                   | Create worktree and verify environment  |
| `/design`    | plan-agent                  | Create spec from requirements           |
| `/implement` | code/ui/docs/eval (routed)  | Build from approved spec                |
| `/review`    | plan-agent                  | 4-loop quality review                   |
| `/reconcile` | plan-agent                  | Address review feedback                 |
| `/research`  | plan-agent                  | Gather context before planning          |
| `/ship`      | prune + git + check agents  | Prune, commit, PR, verify               |

## Customization

### 1. Template Variables

Edit `CLAUDE.md` and replace template variables:

```markdown
# {{Project Name}}          → # My App
{{Tech stack description}}  → Next.js 15 + TypeScript + Vitest

{{dev_command}}             → pnpm dev
{{build_command}}           → pnpm build
{{test_command}}            → pnpm test
{{lint_command}}            → pnpm lint
{{typecheck_command}}       → pnpm typecheck
```

### 2. Framework-Specific Skills

Add custom skills to `.claude/skills/stack/`:

```
.claude/skills/stack/
├── frontend-patterns/
│   └── SKILL.md          # React, Next.js patterns
├── backend-patterns/
│   └── SKILL.md          # tRPC, Prisma patterns
└── your-framework/       # Add your own
    └── SKILL.md
```

Each skill should define:
- **Purpose**: What capability it provides
- **Patterns**: Code patterns and examples
- **Anti-patterns**: What to avoid

### 3. MCP Server Configuration

Configure MCP servers in `.mcp.json`:

```json
{
  "cclsp": {
    "command": "cclsp",
    "args": []
  },
  "context7": {
    "command": "npx",
    "args": ["-y", "@context7/mcp-server"]
  }
}
```

Available MCP integrations:
- `cclsp` - Code navigation, definitions, references
- `context7` - Library documentation verification
- `next-devtools` - Next.js build status and dev server
- Add your own MCP servers as needed

### 4. Hook Customization

Hooks live in `.claude/scripts/hooks/`:

```
hooks/
├── session-start.cjs          # Session initialization
├── session-end.cjs            # Session cleanup
├── user-prompt-start.cjs      # Before /start
├── user-prompt-review.cjs     # Before /review
├── user-prompt-ship.cjs       # Before /ship
├── pre-tool-use-bash.cjs      # Before bash commands
├── pre-tool-use-file.cjs      # Before file operations
├── pre-tool-use-git-push.cjs  # Before git push
├── post-tool-use.cjs          # After tool use
└── command-mode-detect.cjs    # Command detection
```

Customize hooks to:
- Add project-specific checks
- Enforce team conventions
- Integrate with external tools
- Log custom metrics

### 5. Agent Configuration

Modify agent behavior in `.claude/agents/`:

- **Model assignment**: Change which Claude model handles each phase
- **Sub-agent sizing**: Adjust dynamic sizing heuristics in `.claude/sub-agents/lib/sizing-heuristics.md`
- **Skills**: Add or remove skills referenced in agent files
- **Validation rules**: Customize quality checks and requirements

## Architecture

### Agent Hierarchy

```
Command (/design, /implement, /ship)
    │
    ▼
Orchestrator Agent (reads .claude/agents/{agent}-agent.md)
    │
    ├─► Sub-Agent 1: domain-researcher (Opus)
    │     └─► Skills: research, codebase-navigation
    │
    ├─► Sub-Agent 2: domain-writer (Sonnet)
    │     └─► Skills: tdd-workflow, coding-standards, framework-patterns
    │
    └─► Sub-Agent 3: quality-validator (Haiku)
          └─► Skills: qa-checks, security-patterns
```

### Dynamic Sizing

Agents dynamically spawn 1-3 sub-agents based on task complexity:

- **Simple (1 sub-agent)**: Direct implementation
- **Medium (2 sub-agents)**: Research + implementation
- **Complex (3 sub-agents)**: Research + implementation + validation

Sizing heuristics consider:
- File count to modify
- Estimated task count
- Module dependencies
- Overall effort level

### Context Management

Sub-agents communicate via compact summaries (max 500 tokens) to prevent context overflow:

```typescript
// Orchestrator extracts only what's needed
state.progress.research_summary = result.context_summary; // ~500 tokens

// Pass summary to next phase
await runWriter({
  previous_findings: researchResult.context_summary,
});
```

### Spec-Driven Development

All implementation follows specs created in `/design`:

1. **Requirements** - What to build and why
2. **Design** - Architecture and technical decisions
3. **Tasks** - Granular implementation steps with dependencies

Agents read specs and implement exactly what's specified, following TDD methodology.

## Skills System

Skills are reusable capabilities that agents can invoke:

### Core Skills (12)

- **research** - Find existing implementations, check conflicts
- **tdd-workflow** - Red-Green-Refactor test-driven development
- **code-review** - Multi-loop quality review (security, performance, UX, maintainability)
- **qa-checks** - Build, typecheck, test, lint automation
- **git-operations** - Worktree management, branching, commits
- **pr-operations** - Pull request creation and management
- **coding-standards** - KISS, DRY, YAGNI principles
- **security-patterns** - Security best practices and validation
- **routing** - Agent selection and task routing logic
- **preview** - Command preview generation
- **progress** - Progress tracking and reporting
- **eval-harness** - Test evaluation and harness generation

### Stack Skills (2+ customizable)

- **frontend-patterns** - React, Next.js, component patterns
- **backend-patterns** - tRPC, Prisma, API design patterns
- **[Add your own]** - Custom framework patterns

## Best Practices

1. **Always start with /start** - Ensures clean environment and worktree isolation
2. **Create specs with /design** - Don't skip planning phase
3. **Follow TDD** - Write tests first during /implement
4. **Run /review** - Catch issues before shipping
5. **Use /ship** - Automated cleanup and verification prevent mistakes
6. **Customize incrementally** - Start with defaults, adjust as needed
7. **Document conventions** - Add project-specific patterns to stack skills

## Troubleshooting

### Command not working

- Verify you're in a git repository
- Check that `.claude/` directory exists
- Review command file: `.claude/commands/<command>.md`

### Agent errors

- Check agent file syntax: `.claude/agents/<agent>-agent.md`
- Verify sub-agent templates exist
- Review recent changes in git

### Spec issues

- Follow templates in `specs/templates/`
- Ensure required sections exist (requirements, design, tasks)
- Validate with `/design --phase=validate`

### Hook failures

- Check hook syntax in `.claude/scripts/hooks/`
- Review error messages in command output
- Test hooks individually via Bash tool

## License

MIT

---

For detailed documentation on each component, see:
- `.claude/agents/` - Agent specifications
- `.claude/commands/` - Command usage guides
- `.claude/skills/core/` - Core skill documentation
- `specs/README.md` - Spec organization guide
