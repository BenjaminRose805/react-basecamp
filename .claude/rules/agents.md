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

## Agent Routing

| Command              | Agents                                                |
| -------------------- | ----------------------------------------------------- |
| `/distill [feature]` | distill-researcher → distill-spec-writer → distill-qa |
| `/spec [feature]`    | spec-researcher → spec-writer → spec-qa               |
| `/test [feature]`    | test-researcher → test-writer → test-qa               |
| `/eval [feature]`    | eval-researcher → eval-writer → eval-qa               |
| `/code [feature]`    | code-researcher → code-writer → code-qa               |
| `/ui [component]`    | ui-researcher → ui-builder → ui-qa                    |
| `/docs [topic]`      | docs-researcher → docs-writer → docs-qa               |

## Standalone Agents

These don't follow the 3-agent pattern:

| Agent              | Command     | Purpose                |
| ------------------ | ----------- | ---------------------- |
| `debugger`         | `/debug`    | Reactive bug hunting   |
| `security-auditor` | `/security` | Vulnerability scanning |
| `pr-reviewer`      | `/review`   | Final quality gate     |

## Subcommand Usage

Run individual phases when needed:

```bash
/code [feature]           # Full flow: research → write → qa
/code research [feature]  # Research only
/code write [feature]     # Write only (after research)
/code qa [feature]        # QA only (after write)
```

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

## Anti-Patterns

### DON'T: Skip Research

```markdown
# BAD

User: "Add a login form"
Agent: _immediately writes code_

# GOOD

User: "Add a login form"
Agent: "Let me run /code research first to check for existing auth patterns..."
```

### DON'T: Ignore QA Failures

```markdown
# BAD

QA: "FAIL - TypeScript errors in auth.ts"
Agent: "I'll commit anyway and fix later"

# GOOD

QA: "FAIL - TypeScript errors in auth.ts"
Agent: "Running /code write to fix the type errors..."
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
