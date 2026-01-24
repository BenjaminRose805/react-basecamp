# /guide - Project Tutor

Interactive help for understanding commands, agents, workflows, and infrastructure.

## Usage

```
/guide                     # Start interactive exploration
/guide [topic]             # Ask about a specific topic
/guide commands            # List all commands
/guide agents              # Explain the agent system
/guide workflow            # Explain the development workflow
/guide hooks               # Explain the hook system
/guide mcp                 # Explain MCP servers
/guide ci                  # Explain CI/CD pipelines
/guide integrations        # GitHub app integrations
```

## Instructions

When this command is invoked:

### Without Arguments - Interactive Mode

Offer exploration menu:

```
What would you like to learn about?

1. Commands    - All available slash commands
2. Agents      - The 25+ specialized agents
3. Workflow    - How to develop features (SDD/TDD/EDD)
4. Rules       - Coding standards and conventions
5. CI/CD       - GitHub Actions and automation
6. Hooks       - Pre-commit, post-edit automation
7. MCP         - Model Context Protocol servers
8. Structure   - Project organization

Type a number, topic name, or ask a question.
```

### With Topic - Direct Answer

Provide concise explanation with:

1. What it is (1-2 sentences)
2. When/how to use it
3. Quick example
4. Source file for more details

### With Question - Answer It

Answer directly, then offer related topics.

## Topic Quick Reference

### commands

Read and summarize `.claude/commands/*.md`:

- Implementation: /distill, /spec, /test, /eval, /code, /ui, /docs
- Standalone: /debug, /security, /review, /verify, /context
- Workflow: /status, /plan, /next, /commit, /pr, /recap, /workflow, /guide

### agents

Read and explain `.claude/agents/*.md`:

- 3-agent pattern: researcher → writer → qa
- 8 agent families: distill, spec, test, eval, code, ui, docs, standalone
- When to use which agent

### workflow

Explain from `.claude/rules/methodology.md`:

- SDD: Spec-Driven Development
- TDD: Test-Driven Development
- EDD: Evaluation-Driven Development
- Standard flow: spec → test → code → security → review → pr

### hooks

Read `.claude/rules/hooks.md` and `.claude/settings.json`:

- Lifecycle events
- Pre/Post tool hooks
- How to configure

### mcp

Read `docs/MCP_SETUP.md`:

- What MCP servers are
- Which ones are configured
- What each provides

### ci

Read `.github/workflows/*.yml`:

- CI pipeline stages
- When workflows run
- How to debug failures

### rules

Summarize `.claude/rules/*.md`:

- coding-style, security, testing, patterns
- git-workflow, methodology, agents
- performance, hooks

## Response Format

Keep responses scannable:

```
## [Topic]

**What:** Brief explanation

**Usage:** `command or syntax`

**Example:**
[practical example]

**Learn more:** `path/to/file.md`

---
Related: [topic1], [topic2]
```

## Model

Use: **Haiku** (fast Q&A responses)
