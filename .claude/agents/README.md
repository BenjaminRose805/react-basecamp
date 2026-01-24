---
name: agents-readme
---

# Agent Specifications

This directory contains detailed specifications for each agent used in the development workflow.

## Agent Categories

### Distill Agents (SDD - from design docs)

| Agent                 | Purpose                        | See                                                |
| --------------------- | ------------------------------ | -------------------------------------------------- |
| `distill-researcher`  | Extract info from design docs  | [distill-researcher.md](./distill-researcher.md)   |
| `distill-spec-writer` | Create implementation specs    | [distill-spec-writer.md](./distill-spec-writer.md) |
| `distill-qa`          | Validate specs against sources | [distill-qa.md](./distill-qa.md)                   |

### Eval Agents (EDD - for LLM features)

| Agent             | Purpose                    | See                                        |
| ----------------- | -------------------------- | ------------------------------------------ |
| `eval-researcher` | Identify LLM touchpoints   | [eval-researcher.md](./eval-researcher.md) |
| `eval-writer`     | Create evaluation suites   | [eval-writer.md](./eval-writer.md)         |
| `eval-qa`         | Validate and dry-run evals | [eval-qa.md](./eval-qa.md)                 |

## Agent Pattern

All writing agents follow the three-phase pattern:

```
RESEARCHER → WRITER → QA
```

- **Researcher**: Gather information, check for conflicts, recommend approach
- **Writer**: Do the work based on research findings
- **QA**: Validate the output, report PASS or FAIL

## Adding New Agents

1. Create `{agent-name}.md` in this directory
2. Follow the template structure:
   - Purpose
   - Inputs
   - Process (numbered steps)
   - Output
   - Success Criteria
3. Add the agent to the routing table in `CLAUDE.md`

## Invoking Agents

Agents are invoked via commands in `CLAUDE.md`:

```bash
/distill [feature]           # Full flow
/distill research [feature]  # Single phase
```

The main Claude instance reads these specs and delegates work accordingly.
