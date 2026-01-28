# Design: Split /plan into Three Commands

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** split-plan-commands

## Overview

This design splits the current `/plan` command into three explicit commands (`/design`, `/reconcile`, `/research`) by creating new command files and updating the command detection hook. The existing `plan-agent.md` orchestrator will be reused with mode-specific routing, eliminating the need for automatic mode detection based on CodeRabbit comments.

---

## Architecture

### Current State

```
User runs /plan [feature]
    |
    v
command-mode-detect.cjs detects /plan
    |
    v
plan-agent.md orchestrator
    |
    v
Mode detection (CodeRabbit check)
    |
    +---> Has CodeRabbit comments? --> Reconcile mode
    |
    +---> Otherwise --> Define mode
    |
    v
Spawn sub-agents (domain-researcher, domain-writer, quality-validator)
    |
    v
Output: specs/{feature}/ OR specs/pr-{N}-reconciliation/
```

### Target State

```
User runs explicit command:
    - /design [feature]
    - /reconcile [PR-number]
    - /research [topic]
    |
    v
command-mode-detect.cjs detects command
    |
    v
Route to appropriate agent:
    - /design --> design-agent (reuses plan-agent logic)
    - /reconcile --> reconcile-agent (new agent file OR plan-agent mode)
    - /research --> research-agent (new agent file OR plan-agent mode)
    |
    v
Execute command-specific workflow
    |
    v
Output command-specific files
```

---

## Component Design

### 1. Command Files

Three new command files in `.claude/commands/`:

| File         | Purpose                      | Output                             |
| ------------ | ---------------------------- | ---------------------------------- |
| design.md    | Conversational spec creation | specs/{feature}/\*.md              |
| reconcile.md | PR feedback reconciliation   | specs/pr-{N}-reconciliation/\*.md  |
| research.md  | Exploratory investigation    | research-notes.md (no formal spec) |

**Implementation:** Each file follows the structure of existing `plan.md` with:

- Command description
- MANDATORY preview and delegation block
- Task examples for sub-agents
- Preview display format
- Output specification

### 2. Agent Files

**Option A: Reuse plan-agent.md with routing**

- Single `plan-agent.md` file with internal routing based on command context
- Check command name to determine workflow
- Minimal changes to existing orchestration logic

**Option B: Create three separate agent files**

- `design-agent.md` - Full spec creation workflow
- `reconcile-agent.md` - PR feedback analysis workflow
- `research-agent.md` - Exploratory research workflow
- More explicit separation but duplicates orchestration logic

**Recommended:** Option A (reuse with routing) to minimize duplication and maintenance.

### 3. Command Detection Hook

Update `.claude/scripts/hooks/command-mode-detect.cjs`:

```javascript
const COMMAND_PATTERNS = [
  { pattern: /^\/design\b/i, command: "design", agents: ["plan-agent"] },
  { pattern: /^\/reconcile\b/i, command: "reconcile", agents: ["plan-agent"] },
  { pattern: /^\/research\b/i, command: "research", agents: ["plan-agent"] },
  {
    pattern: /^\/implement\b/i,
    command: "implement",
    agents: ["code-agent", "ui-agent"],
  },
  {
    pattern: /^\/ship\b/i,
    command: "ship",
    agents: ["git-agent", "check-agent"],
  },
];
```

Remove `/plan` pattern from COMMAND_PATTERNS array.

### 4. Documentation Updates

Update `CLAUDE.md` command table:

```markdown
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
```

---

## Data Flow

### /design Command Flow

```
User: /design [feature]
    |
    v
1. Parse command and feature name
    |
    v
2. Show preview with sub-agents (Opus, Sonnet, Haiku)
    |
    v
3. Get user confirmation [Enter/Esc]
    |
    v
4. PHASE 1: Research
    - Spawn domain-researcher (mode=plan:requirements)
    - Spawn domain-researcher (mode=plan:dependencies)
    - Spawn domain-researcher (mode=plan:tasks)
    - Wait for parallel completion
    - Aggregate context_summary (~1500 tokens)
    |
    v
5. PHASE 2: Write
    - Spawn domain-writer (mode=plan)
    - Pass analysis_summary
    - Create requirements.md, design.md, tasks.md
    |
    v
6. PHASE 3: Validate
    - Spawn quality-validator
    - Check EARS format, acceptance criteria, _Prompt fields
    - Retry once if failed
    |
    v
7. Report completion with file paths
```

### /reconcile Command Flow

```
User: /reconcile [PR-number]
    |
    v
1. Detect feedback source:
    - PR number provided? Use gh pr view
    - No args? Use git diff
    |
    v
2. Show preview with sub-agents
    |
    v
3. Get user confirmation [Enter/Esc]
    |
    v
4. PHASE 1: Analyze Feedback
    - Spawn domain-researcher (mode=reconcile)
    - Fetch PR comments or git changes
    - Categorize by severity (critical/major/minor/trivial)
    - Extract fix requirements
    |
    v
5. PHASE 2: Plan Fixes
    - Spawn domain-writer (mode=reconcile)
    - Create tasks.md with:
      * Categorized issues
      * Fix instructions per task
      * _Prompt fields for implementation
      * Execution order
    |
    v
6. Output: specs/pr-{N}-reconciliation/tasks.md
    |
    v
7. Report completion (does NOT implement fixes)
```

### /research Command Flow

```
User: /research [topic]
    |
    v
1. Parse command and topic
    |
    v
2. Show preview with domain-researcher
    |
    v
3. Get user confirmation [Enter/Esc]
    |
    v
4. PHASE 1: Investigate
    - Spawn domain-researcher (mode=research)
    - Explore codebase, existing patterns
    - Use Read, Grep, Glob, MCP tools
    - Support follow-up questions
    |
    v
5. Output: research-notes.md
    - Findings summary
    - Code references
    - Recommendations
    - Open questions
    |
    v
6. Report completion (no formal spec created)
```

---

## Error Handling

### /design Command Errors

**Error: Critical ambiguities found**

```
Response: Pause workflow, present questions to user, wait for answers, re-run researcher
```

**Error: Validation failed twice**

```
Response: Report validation issues to user, suggest manual fixes with specific details
```

### /reconcile Command Errors

**Error: No PR feedback found**

```
Error: Unable to find PR #{N} feedback
Suggestion: Check PR number, verify gh CLI is authenticated (gh auth status)
```

**Error: GitHub CLI not installed**

```
Error: GitHub CLI (gh) is required for /reconcile with PR numbers
Suggestion: Install with: brew install gh (or see https://cli.github.com)
```

**Error: Git diff returns no changes**

```
Error: No local changes found to reconcile
Suggestion: Ensure you have uncommitted changes or provide a PR number
```

### /research Command Errors

**Error: Topic not found in codebase**

```
Response: Report "No existing implementations found", offer to search external docs or proceed with exploratory analysis
```

---

## Testing Strategy

### Unit Tests

| Test Case                        | Verification                                  |
| -------------------------------- | --------------------------------------------- |
| Command detection for /design    | COMMAND_PATTERNS matches /design correctly    |
| Command detection for /reconcile | COMMAND_PATTERNS matches /reconcile correctly |
| Command detection for /research  | COMMAND_PATTERNS matches /research correctly  |
| Agent routing for new commands   | Each command routes to correct agent          |

### Integration Tests

| Test Case                       | Verification                                     |
| ------------------------------- | ------------------------------------------------ |
| /design creates spec files      | requirements.md, design.md, tasks.md exist       |
| /reconcile analyzes PR feedback | tasks.md created in specs/pr-{N}-reconciliation/ |
| /research creates notes         | research-notes.md exists with findings           |
| /reconcile with git diff        | Analyzes local changes when no PR number given   |
| /reconcile with PR number       | Fetches GitHub PR feedback via gh CLI            |

### Manual Testing

| Test Case                  | Verification                                    |
| -------------------------- | ----------------------------------------------- |
| Preview displays correctly | Preview shows correct sub-agents and phases     |
| User confirmation works    | [Enter] proceeds, [Esc] cancels                 |
| Sub-agents spawn correctly | Task tool used, no direct execution             |
| Error messages are clear   | Users understand what went wrong and how to fix |

---

## Implementation Notes

### Why Reuse plan-agent.md?

1. Existing orchestration logic is solid and well-tested
2. Avoids duplication of sub-agent coordination code
3. Simplifies maintenance (one orchestrator, multiple entry points)
4. Mode-based routing is simpler than three separate agents

### Why Remove Mode Detection?

1. Explicit commands make user intent clear
2. Reduces cognitive load (no need to guess which mode will trigger)
3. Simplifies code (no mode detection logic needed)
4. Better aligns with command pattern (one command, one purpose)

### Why /research Doesn't Create Specs?

1. Research is exploratory and non-committal
2. Users may not be ready to formalize requirements
3. research-notes.md provides lightweight documentation
4. Users can promote research to /design when ready

---

## Security Considerations

### GitHub CLI Authentication

- `/reconcile` with PR numbers requires authenticated GitHub CLI
- Users must run `gh auth login` before using PR number mode
- Hook should verify authentication and provide clear error if missing

### Git Access

- `/reconcile` without arguments requires git access
- Verify git repository exists before attempting `git diff`
- Handle detached HEAD state gracefully

---

## Alternatives Considered

### Alternative 1: Keep /plan with Subcommands

```
/plan define [feature]
/plan reconcile [PR-number]
/plan research [topic]
```

**Rejected:** Subcommands add extra typing and cognitive overhead. Top-level commands are more discoverable and align better with existing command patterns (/start, /implement, /ship).

### Alternative 2: Create Separate Agent Files

```
design-agent.md
reconcile-agent.md
research-agent.md
```

**Rejected:** Creates duplication of orchestration logic. Each agent would need to duplicate sub-agent spawning, error handling, and coordination code. Maintenance burden increases.

### Alternative 3: Merge /design and /research

**Rejected:** /design creates formal specs (committed to implementation), while /research is exploratory (no commitment). Merging would conflate two distinct workflows.

---

## Dependencies

| Component                  | Version | Purpose                               |
| -------------------------- | ------- | ------------------------------------- |
| plan-agent.md              | Current | Orchestrator for all three commands   |
| command-mode-detect.cjs    | Current | Command detection and routing hook    |
| domain-researcher template | Current | Sub-agent for research and analysis   |
| domain-writer template     | Current | Sub-agent for spec writing            |
| quality-validator template | Current | Sub-agent for validation              |
| GitHub CLI (gh)            | Latest  | PR feedback retrieval for /reconcile  |
| Git                        | 2.0+    | Local change detection for /reconcile |

---
