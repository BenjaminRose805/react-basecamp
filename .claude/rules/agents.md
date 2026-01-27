# Agent Rules

Rules for agent delegation and orchestration in react-basecamp.

## Core Rule: Mandatory Delegation

**ALWAYS delegate work to agents. Never implement, test, review, or debug directly.**

You MAY answer simple questions directly:

- "What framework is this?"
- "Where is the config file?"
- "What does this function do?"

But any actual work MUST go through an agent.

## 3-Agent Pattern

All writing tasks follow the same pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  RESEARCHER AGENT                                           │
├─────────────────────────────────────────────────────────────┤
│  1. Search for existing implementations                     │
│  2. Check for conflicts                                     │
│  3. Identify consolidation opportunities                    │
│  4. Report: PROCEED, STOP, or CLARIFY                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  WRITER AGENT                                               │
├─────────────────────────────────────────────────────────────┤
│  Prerequisite: Research returned PROCEED                    │
│                                                             │
│  1. Review research findings                                │
│  2. Read the spec (if exists)                               │
│  3. Implement following patterns                            │
│  4. Basic sanity check (types, build)                       │
│  5. Report: Files changed, ready for QA                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  QA AGENT                                                   │
├─────────────────────────────────────────────────────────────┤
│  DEEP VALIDATION                                            │
│                                                             │
│  1. Type checking                                           │
│  2. Test execution                                          │
│  3. Integration verification                                │
│  4. Regression checks                                       │
│                                                             │
│  Report: PASS or FAIL (with specific issues)                │
└─────────────────────────────────────────────────────────────┘
```

## Command → Agent Routing

Users interact with 6 commands. Agents are internal implementation details.

| Command      | Routes To                               |
| ------------ | --------------------------------------- |
| `/start`     | git worktree (direct)                   |
| `/plan`      | plan-agent (spec creation/reconcile)    |
| `/implement` | code/ui/docs/eval-agent (based on spec) |
| `/ship`      | git-agent + check-agent                 |
| `/guide`     | — (informational)                       |
| `/mode`      | — (mode switch)                         |

### /implement Routing

The `/implement` command routes to agents based on spec content:

| Spec Contains           | Routes To             |
| ----------------------- | --------------------- |
| Backend only (Prisma)   | code-agent            |
| Frontend only (React)   | ui-agent              |
| Both backend + frontend | code-agent → ui-agent |
| Documentation           | docs-agent            |
| Evaluation/graders      | eval-agent            |

### Internal Agents

These agents are invoked internally by commands, not directly by users:

| Agent       | Invoked By            | Purpose                      |
| ----------- | --------------------- | ---------------------------- |
| plan-agent  | `/plan`               | Spec creation and reconcile  |
| code-agent  | `/implement`          | Backend implementation (TDD) |
| ui-agent    | `/implement`          | Frontend implementation      |
| docs-agent  | `/implement`          | Documentation writing        |
| eval-agent  | `/implement`          | Evaluation suite creation    |
| check-agent | `/implement`, `/ship` | Quality verification         |
| git-agent   | `/start`, `/ship`     | Git and PR operations        |

## Parallel Execution

Use parallel agents for independent tasks:

```markdown
# GOOD: Parallel execution

Launch 3 agents in parallel:

1. Agent 1: Security analysis of auth.ts
2. Agent 2: Type checking
3. Agent 3: Run tests

# BAD: Sequential when unnecessary

First agent 1, then agent 2, then agent 3
```

### Parallelizable Phases

| Phase    | Can Parallelize                                         |
| -------- | ------------------------------------------------------- |
| Research | Yes - multiple researchers can run simultaneously       |
| QA       | Yes - type check, lint, test, security can run together |
| Write    | No - writers should run sequentially                    |

## Agent Model Assignment

Optimize cost by using appropriate models:

| Agent Type       | Model  | Reasoning                            |
| ---------------- | ------ | ------------------------------------ |
| \*-researcher    | Sonnet | Read-heavy, needs good comprehension |
| \*-writer        | Sonnet | Complex generation tasks             |
| \*-qa            | Haiku  | Checklist-based verification         |
| security-auditor | Sonnet | Needs security expertise             |
| pr-reviewer      | Sonnet | Comprehensive review                 |
| debugger         | Sonnet | Investigation skills                 |

## Failure Handling

| Failure                        | Recovery                                  |
| ------------------------------ | ----------------------------------------- |
| Research returns STOP          | Ask user for clarification, don't proceed |
| Research returns CLARIFY       | Ask specific questions, then re-research  |
| QA finds issues                | Run writer again with issues list         |
| Security finds vulnerabilities | Fix immediately, re-scan                  |
| Review requests changes        | Run code flow again                       |

## Agent Communication

### Research → Writer Handoff

Research agent provides:

- Files reviewed
- Patterns found
- Conflicts identified
- Recommendation (PROCEED/STOP/CLARIFY)
- Key context for writer

### Writer → QA Handoff

Writer agent provides:

- Files created/modified
- Tests written/modified
- Known risks
- Verification focus areas

## Sub-Agent Delegation

For context-efficient execution, agents can spawn isolated sub-agents via the Task tool. This prevents context overflow on complex tasks.

### When to Use Sub-Agents

| Scenario                  | Approach             |
| ------------------------- | -------------------- |
| Simple task (1-2 files)   | Direct execution     |
| Complex task (3+ files)   | Sub-agent delegation |
| Context approaching limit | Sub-agent delegation |
| Parallelizable checks     | Parallel sub-agents  |

### Sub-Agent Infrastructure

See [sub-agents/README.md](../sub-agents/README.md) for complete documentation.

| Component | Location                | Purpose                                          |
| --------- | ----------------------- | ------------------------------------------------ |
| Templates | `sub-agents/templates/` | researcher, writer, validator, parallel-executor |
| Profiles  | `sub-agents/profiles/`  | read-only, research, writer, full-access         |
| Protocols | `sub-agents/protocols/` | handoff format, orchestration patterns           |

### Sub-Agent Invocation

```typescript
// Spawn a research sub-agent
await Task({
  subagent_type: "general-purpose",
  description: "Research auth patterns",
  prompt: JSON.stringify(handoffRequest),
  allowed_tools: ["Read", "Grep", "Glob", "mcp__cclsp__*"],
  model: "sonnet",
});
```

### Handoff Protocol

Sub-agents communicate via structured JSON:

```json
{
  "task_id": "auth-001",
  "phase": "research",
  "decision": "PROCEED | STOP | CLARIFY",
  "context_summary": "max 500 tokens for next phase",
  "findings": { ... }
}
```

Key rule: Pass `context_summary` between phases, NOT raw context.

### Permission Profiles

| Profile     | Tools                           | Use For               |
| ----------- | ------------------------------- | --------------------- |
| read-only   | Read, Grep, Glob, cclsp         | Code review, analysis |
| research    | + WebFetch, WebSearch, context7 | Documentation lookup  |
| writer      | + Write, Edit, Bash             | Implementation        |
| full-access | All tools + Task                | Orchestration         |

---

## Anti-Patterns

### DON'T: Skip Planning

```markdown
# BAD

User: "Add a login form"
Agent: _immediately writes code_

# GOOD

User: "Add a login form"
Agent: "Let me run /plan first to design the spec and get approval..."
```

### DON'T: Ignore QA Failures

```markdown
# BAD

QA: "FAIL - TypeScript errors in auth.ts"
Agent: "I'll commit anyway and fix later"

# GOOD

QA: "FAIL - TypeScript errors in auth.ts"
Agent: "Fixing the type errors and re-running /implement..."
```

### DON'T: Bypass Security

```markdown
# BAD

User: "Skip security, I'm in a hurry"
Agent: _skips security scan_

# GOOD

User: "Skip security, I'm in a hurry"
Agent: "Security scanning is mandatory. Let me run a quick scan..."
```
