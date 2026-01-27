# Requirements: Sub-Agent Infrastructure

> **Status:** Completed
> **Created:** 2026-01-26
> **Consolidated:** 2026-01-28

## Overview

This consolidated specification covers the foundational sub-agent system including templates, handoff protocols, orchestration patterns, domain-specific agents, and dynamic sizing. All requirements from the following specs have been merged and completed:

- agent-optimization/01-infrastructure (Sub-agent templates, handoff protocol, permission profiles)
- agent-optimization/02-code-agent (Code researcher, writer, validator pattern)
- agent-optimization/03-ui-agent (UI-specific implementation patterns)
- agent-optimization/04-check-agent (Quality check orchestration)
- agent-optimization/05-context-compaction (Context reduction between phases)
- agent-optimization/06-plan-agent (Spec creation and validation)
- sub-agent-consolidation (37 agents → 11 templates, dynamic sizing)

---

## Core Requirements

### Sub-Agent Templates

**COMPLETED:** The system provides 11 consolidated sub-agent templates replacing 37 individual agents:

1. **domain-researcher** - Replaces 5 domain-specific researchers (plan, code, ui, docs, eval)
2. **domain-writer** - Replaces 5 domain-specific writers with mode parameter
3. **quality-validator** - Replaces 5 domain-specific validators (domain-agnostic)
4. **quality-checker** - Replaces 4 individual checkers (build, type, lint, test)
5. **spec-analyzer** - Replaces 3 plan analyzers with mode parameter
6. **git-content-generator** - Replaces 3 git-related agents (commit, PR, general)
7. **code-analyzer** - Replaces 4 workflow analyzers (workflow, debug, refactor, fix)
8. **git-executor** - Unique sub-agent for git command execution
9. **pr-reviewer** - Unique sub-agent for complex PR review logic
10. **security-scanner** - Unique sub-agent for security pattern detection
11. **parallel-executor** - Unique template for parallel coordination

**Token Savings:** 63% reduction (17,200 → 6,400 tokens across all templates)

---

### Handoff Protocol

**COMPLETED:** Structured JSON-based handoff protocol with three decision values:

- `PROCEED` - Continue to next phase
- `STOP` - Halt workflow with critical issue
- `CLARIFY` - Request user clarification

**Context Summary Requirement:** Max 500 tokens per handoff, containing only actionable findings without search queries or intermediate steps.

---

### Permission Profiles

**COMPLETED:** Four permission profiles restricting sub-agent tool access:

1. **read-only** - Read, Grep, Glob, mcp**cclsp**\*
2. **research** - read-only + WebFetch, WebSearch, mcp**context7**\*
3. **writer** - research + Write, Edit, Bash
4. **full-access** - All tools including Task (orchestrators only)

---

### Orchestration Patterns

**COMPLETED:** Three orchestration patterns documented and implemented:

1. **Sequential Chain** - Research → Write → Validate (dependent phases)
2. **Parallel Executor** - Multiple independent checks concurrently
3. **Conditional Branch** - Variable workflow based on analysis

---

### Dynamic Phase Sizing

**COMPLETED:** Adaptive sub-agent count based on task complexity:

- **1 sub-agent** - Simple tasks (1 file, 1-2 changes) - e.g., fix typo, /ship commit
- **2-3 sub-agents** - Medium tasks (2-3 files, 3-5 changes) - e.g., add endpoint
- **4-7 sub-agents** - Complex tasks (4+ files, 6+ changes) - e.g., large feature

**Sizing Heuristics:**

- File count (40% weight)
- Task count (30% weight)
- Module spread (20% weight)
- Effort estimate (10% weight)

**Context Savings:** 47% overhead reduction for simple tasks (800 tokens vs 1,500 tokens)

---

### Context Compaction

**COMPLETED:** Automatic context reduction at phase boundaries:

- Sub-agents return only `context_summary` (max 500 tokens)
- Orchestrators do not retain raw sub-agent outputs
- Essential state preserved (task_id, feature, spec_path)
- Manual `/compact` command supported for long sessions
- Hooks track context usage and suggest compaction at 70% capacity

**Achieved:** 30% average context reduction across typical workflows

---

### Domain-Specific Patterns

**COMPLETED:** Each domain has specialized patterns in consolidated templates:

**Code Domain (Backend):**

- TDD workflow (tests first)
- tRPC router patterns
- Prisma model patterns
- API endpoint structure

**UI Domain (Frontend):**

- Component testing
- React hooks patterns
- Component composition
- Accessibility standards

**Docs Domain:**

- Markdown formatting
- Documentation standards
- Example code snippets

**Eval Domain:**

- EDD workflow (eval-driven development)
- Eval suite structure
- Grader implementation
- Test case design

**Plan Domain:**

- EARS requirements format
- Spec validation rules
- Task decomposition

---

## Quality Validation

### Validator Sub-Agent (3-Phase Pattern)

**COMPLETED:** All domain agents use consistent research → write → validate pattern:

1. **Phase 1: Research** (domain-researcher, Opus)
   - Search existing implementations
   - Check for conflicts
   - Identify consolidation opportunities
   - Return: decision + context_summary (500 tokens)

2. **Phase 2: Write** (domain-writer, Sonnet)
   - Review context_summary (not raw research)
   - Read spec if available
   - Follow domain patterns (TDD for code/ui, markdown for docs, EDD for eval)
   - Return: files_changed + context_summary (500 tokens)

3. **Phase 3: Validate** (quality-validator, Haiku)
   - Run typecheck, lint, tests, build
   - Report PASS/FAIL with specific errors
   - Return: validation_result

---

### Check Agent (Parallel Validation)

**COMPLETED:** Parallel quality checks orchestrated by check-agent:

- Spawns multiple `quality-checker` sub-agents concurrently
- Each checker runs one command (build, type, lint, test, security)
- Results aggregated by orchestrator
- All checks must pass for PROCEED decision

---

## Implementation Verification

### Backward Compatibility

**VERIFIED:** All 7 agents produce identical outputs before and after consolidation:

- plan-agent
- code-agent
- ui-agent
- docs-agent
- eval-agent
- check-agent
- git-agent

### Performance Targets

**ACHIEVED:**

- Research phase: 15,000 tokens (unchanged)
- Write phase: 20,000 tokens (was 35,000) - 43% savings
- Validate phase: 10,000 tokens (was 45,000) - 78% savings
- Each phase stays well under context limits

---

## Out of Scope

- Custom MCP server for orchestration
- Persistent sub-agent memory across sessions
- External orchestration frameworks
- Changes to Task tool interface
- Automatic tool updates or version checking
- Cross-session state management

---

## Dependencies

All dependencies satisfied:

| Dependency                       | Type     | Status   |
| -------------------------------- | -------- | -------- |
| Task tool (Claude Code built-in) | Internal | Ready    |
| Existing agent definitions       | Internal | Migrated |
| `.claude/` directory structure   | Internal | Ready    |
| Sub-agent templates              | Internal | Complete |
| Permission profiles              | Internal | Complete |
| Handoff protocols                | Internal | Complete |
| TDD workflow skill               | Internal | Ready    |
| Coding standards skill           | Internal | Ready    |
| EDD workflow skill               | Internal | Ready    |

---

**Status:** All requirements implemented and verified.
**Achievement:** 63% token reduction, 30% context savings, 47% overhead reduction for simple tasks.
