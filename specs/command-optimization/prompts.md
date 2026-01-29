# Command Optimization Prompts

Prompts for analyzing and optimizing each command. Run in separate worktrees.

## Worktree Setup

```bash
# From main repo, create worktrees for each command:
git worktree add ../react-basecamp-cmd-start -b feature/cmd-start-optimization
git worktree add ../react-basecamp-cmd-design -b feature/cmd-design-optimization
git worktree add ../react-basecamp-cmd-research -b feature/cmd-research-optimization
git worktree add ../react-basecamp-cmd-reconcile -b feature/cmd-reconcile-optimization
git worktree add ../react-basecamp-cmd-implement -b feature/cmd-implement-optimization
git worktree add ../react-basecamp-cmd-review -b feature/cmd-review-optimization
git worktree add ../react-basecamp-cmd-ship -b feature/cmd-ship-optimization
```

## Execution Order

1. Run **Phase 1 (Analysis)** prompts for ALL commands first
2. Run **Cross-Command Analysis** after all Phase 1 complete
3. Run **Phase 2 (Optimization)** prompts for each command
4. Run **Cross-Command Synthesis** after all Phase 2 complete

---

# /start Command

## Worktree: `react-basecamp-cmd-start`

### Phase 1: Analysis

```markdown
# Analyze: /start Command

## Files to Read

- `.claude/commands/start.md`
- `.claude/skills/start/SKILL.md` (if exists)
- `.claude/agents/git-agent.md`
- `.claude/scripts/environment-check.cjs`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - What triggers the command?
   - What agent(s) are invoked?
   - What sub-agents are spawned (if any)?
   - What scripts are called?

2. **Inputs/Outputs**:
   - What arguments/flags are supported?
   - What files are read?
   - What files are created/modified?
   - What is displayed to the user?

3. **Sub-Agent Analysis**:
   - Are sub-agents spawned? How?
   - Is Task() used consistently?
   - What model is used?

4. **Incremental Execution**:
   - Can phases be run individually?
   - Can the user pause/resume?
   - Is state persisted?

5. **Preview/Progress**:
   - Is there a preview before execution?
   - Are progress indicators shown during execution?

6. **Optimization Opportunities**:
   - What inline logic could become scripts?
   - What's verbose that could be trimmed?
   - What's inconsistent with other commands?

Output to: `specs/command-optimization/start-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /start Command

## Context

Read the analyses from other commands to understand patterns:

- `specs/command-optimization/design-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/ship-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/start-analysis.md`

## Optimization Focus

Compare /start against other commands and answer:

1. **Preview System**:
   - Do other commands have better preview implementations?
   - What preview pattern should /start adopt?
   - Propose specific preview output format for /start

2. **Progress Indicators**:
   - How do other commands show progress during execution?
   - What progress pattern should /start adopt?
   - Propose specific progress output for each /start phase

3. **Output Format**:
   - How do other commands report success/failure?
   - Is /start's output format consistent with them?
   - Propose unified output format for /start

4. **State Persistence**:
   - Do other commands write state/checkpoint files?
   - Should /start write a state file for session handoff?
   - What should `start-status.json` contain for /design to read?

5. **Script Usage**:
   - What inline logic in /start could become scripts?
   - Are there scripts from other commands /start could reuse?

## Deliverables

1. **Proposed Changes** - List specific file changes:
```

MODIFY: .claude/commands/start.md

- Add: [what]
- Remove: [what]
- Change: [what]

MODIFY: .claude/skills/start/SKILL.md (if exists)

- ...

CREATE: .claude/scripts/[new-script].cjs (if needed)

- Purpose: [what]

```

2. **Unified Patterns Adopted** - What patterns from other commands are you adopting?

3. **/start-Specific Optimizations** - What's unique to /start that should be improved?

Output to: `specs/command-optimization/start-optimization.md`
```

---

# /design Command

## Worktree: `react-basecamp-cmd-design`

### Phase 1: Analysis

```markdown
# Analyze: /design Command

## Files to Read

- `.claude/commands/design.md`
- `.claude/skills/design/SKILL.md` (if exists)
- `.claude/agents/plan-agent.md`
- `.claude/sub-agents/templates/domain-researcher.md`
- `.claude/sub-agents/templates/domain-writer.md`
- `.claude/sub-agents/templates/quality-validator.md`
- `.claude/sub-agents/protocols/orchestration.md`
- `.claude/sub-agents/protocols/handoff.md`
- `specs/templates/requirements.md`
- `specs/templates/design.md`
- `specs/templates/tasks.md`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - RESEARCH phase: What happens? What sub-agents?
   - WRITE phase: What happens? What sub-agents?
   - VALIDATE phase: What happens? What sub-agents?

2. **Sub-Agent Spawning**:
   - How is Task() called for each sub-agent?
   - What's in the handoff object?
   - What model is used for each phase?
   - Is run_in_background used for parallel tasks?
   - Is context_summary enforced (500 token limit)?

3. **Inputs/Outputs**:
   - What does /design read as input?
   - What spec files are created?
   - How verbose are the outputs? (line counts)

4. **Incremental Execution**:
   - Can user run ONLY research phase?
   - Can user run ONLY write phase?
   - Can user re-run validate without re-running write?
   - Is there a --phase flag or equivalent?
   - Is phase state persisted between sessions?

5. **Information Flow**:
   - What does domain-researcher pass to domain-writer?
   - Is it context_summary or raw findings?
   - What does the orchestrator retain vs discard?

6. **Preview/Progress**:
   - Is there a preview before execution?
   - Are phase transitions shown to user?

7. **Optimization Opportunities**:
   - Can spec templates be trimmed?
   - Is there duplication in requirements/design/tasks?
   - Should there be a summary.md for quick view?
   - What would checkpoint.json look like for incremental execution?

Output to: `specs/command-optimization/design-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /design Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/start-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/ship-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/design-analysis.md`

## Optimization Focus

Compare /design against other commands and answer:

1. **Sub-Agent Spawning**:
   - How do other agents spawn sub-agents?
   - Is /design's Task() usage consistent with them?
   - What handoff format should /design standardize on?

2. **Incremental Execution**:
   - Do other commands support phase-by-phase execution?
   - How should /design implement `--phase=research|write|validate`?
   - What checkpoint file should /design write between phases?

3. **Spec Verbosity**:
   - Are requirements.md/design.md/tasks.md too verbose?
   - What can be trimmed while preserving value?
   - Should /design create a summary.md for quick human review?

4. **Information Handoff to /implement**:
   - What does /implement need from /design output?
   - Is /design producing the right artifacts?
   - Should there be a machine-readable spec (JSON) alongside markdown?

5. **Preview/Progress**:
   - How do other commands handle preview?
   - How should /design preview "I'm about to create these 3 spec files"?
   - How should /design show phase transitions?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/design.md

- Add: [what]

MODIFY: .claude/agents/plan-agent.md

- Add: [what]

MODIFY: specs/templates/requirements.md

- Trim: [what sections]

MODIFY: specs/templates/design.md

- Trim: [what sections]

MODIFY: specs/templates/tasks.md

- Trim: [what sections]

CREATE: specs/templates/summary.md

- Contains: [what]

CREATE: specs/templates/checkpoint.json

- Schema: [what]

```

2. **Unified Patterns Adopted**

3. **/design-Specific Optimizations**

Output to: `specs/command-optimization/design-optimization.md`
```

---

# /research Command

## Worktree: `react-basecamp-cmd-research`

### Phase 1: Analysis

```markdown
# Analyze: /research Command

## Files to Read

- `.claude/commands/research.md`
- `.claude/skills/research/SKILL.md`
- `.claude/agents/plan-agent.md`
- `.claude/sub-agents/templates/domain-researcher.md`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - What triggers the command?
   - What agent handles it?
   - What sub-agents are spawned?
   - What's the single-phase flow?

2. **Sub-Agent Spawning**:
   - How is domain-researcher invoked?
   - What mode parameter is passed?
   - What model is used?
   - What's in the handoff?

3. **Inputs/Outputs**:
   - What arguments does /research accept?
   - What files are read during research?
   - What output is created? (research-notes.md?)
   - What's displayed to the user?

4. **Relationship to /design**:
   - Does /research output feed into /design?
   - Is there a clear handoff?
   - Can /design skip research if /research was already run?

5. **Optimization Opportunities**:
   - Is research output too verbose?
   - Should findings be structured for reuse?
   - Is the boundary between /research and /design clear?

Output to: `specs/command-optimization/research-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /research Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/design-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/research-analysis.md`

## Optimization Focus

Compare /research against other commands and answer:

1. **Relationship to /design**:
   - Should /research output be reusable by /design?
   - If user runs /research then /design, can /design skip its research phase?
   - What file format should /research output for /design to consume?

2. **Output Format**:
   - Is research-notes.md the right output?
   - Should it be structured (JSON) for machine consumption?
   - Should it match the format /design's domain-researcher produces?

3. **Sub-Agent Consistency**:
   - Is domain-researcher (mode=research) invoked the same as in /design?
   - Should the handoff be identical?

4. **Preview/Progress**:
   - How do other commands preview?
   - Should /research preview "I'm about to investigate these areas"?

5. **Scope Control**:
   - Can user scope research to specific directories/files?
   - Should there be a `--scope` flag?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/research.md

- Add: [what]

MODIFY: .claude/skills/research/SKILL.md

- Add: [what]

CREATE: specs/templates/research.md (or research.json)

- Contains: [what]
- Consumable by: /design

```

2. **Unified Patterns Adopted**

3. **/research-Specific Optimizations**

Output to: `specs/command-optimization/research-optimization.md`
```

---

# /reconcile Command

## Worktree: `react-basecamp-cmd-reconcile`

### Phase 1: Analysis

```markdown
# Analyze: /reconcile Command

## Files to Read

- `.claude/commands/reconcile.md`
- `.claude/agents/plan-agent.md`
- `.claude/sub-agents/templates/domain-researcher.md`
- `.claude/sub-agents/templates/domain-writer.md`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - How does it detect source (local diff vs PR)?
   - ANALYZE phase: What happens?
   - PLAN phase: What happens?

2. **Sub-Agent Spawning**:
   - How is domain-researcher (mode=reconcile) invoked?
   - How is domain-writer (mode=reconcile) invoked?
   - What models are used?
   - What's in the handoffs?

3. **Inputs/Outputs**:
   - What arguments? (/reconcile [PR#] vs /reconcile)
   - What's read? (PR comments, local diff, original spec)
   - What's created? (specs/pr-{N}-reconciliation/tasks.md)

4. **Incremental Execution**:
   - Can user run ONLY analyze phase?
   - Can user review analysis before planning?

5. **Integration with /review**:
   - How does /reconcile relate to /review?
   - Is there overlap or clear separation?

6. **Optimization Opportunities**:
   - Is the reconciliation output actionable?
   - Does it integrate back into the original spec?

Output to: `specs/command-optimization/reconcile-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /reconcile Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/design-analysis.md`
- `specs/command-optimization/review-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/reconcile-analysis.md`

## Optimization Focus

Compare /reconcile against other commands and answer:

1. **Relationship to /review**:
   - Is there overlap between /reconcile and /review?
   - Should /reconcile consume /review output?
   - How are responsibilities divided?

2. **Relationship to /design**:
   - Should /reconcile update the original spec files?
   - Or create separate reconciliation specs?
   - How does the user know what changed?

3. **Sub-Agent Consistency**:
   - Is domain-researcher (mode=reconcile) consistent with other modes?
   - Is domain-writer (mode=reconcile) consistent?

4. **Incremental Execution**:
   - Can user run ONLY analyze (see issues) without planning fixes?
   - Should there be `--analyze-only` flag?

5. **Output Actionability**:
   - Is reconciliation output directly usable by /implement?
   - Should it produce tasks.md in the same format?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/reconcile.md

- Add: [what]

MODIFY: .claude/agents/plan-agent.md (reconcile section)

- Add: [what]

```

2. **Unified Patterns Adopted**

3. **/reconcile-Specific Optimizations**

Output to: `specs/command-optimization/reconcile-optimization.md`
```

---

# /implement Command

## Worktree: `react-basecamp-cmd-implement`

### Phase 1: Analysis

```markdown
# Analyze: /implement Command

## Files to Read

- `.claude/commands/implement.md`
- `.claude/skills/routing/SKILL.md`
- `.claude/agents/code-agent.md`
- `.claude/agents/ui-agent.md`
- `.claude/agents/docs-agent.md`
- `.claude/agents/eval-agent.md`
- `.claude/sub-agents/templates/domain-researcher.md`
- `.claude/sub-agents/templates/domain-writer.md`
- `.claude/sub-agents/templates/quality-validator.md`

## Analysis Tasks

1. **Routing Logic**:
   - How does /implement decide which agent to use?
   - What triggers code-agent vs ui-agent vs docs-agent vs eval-agent?
   - Is routing explicit or inferred from spec?

2. **Command Flow per Agent**:
   - code-agent: Research -> Write -> Validate flow
   - ui-agent: Research -> Write -> Validate flow
   - docs-agent: Research -> Write -> Validate flow
   - eval-agent: Research -> Write -> Validate flow
   - Are these flows identical or different?

3. **Sub-Agent Spawning**:
   - Is Task() called the same way across all 4 agents?
   - Are handoff objects structured identically?
   - Are models consistent? (Opus for research, Sonnet for write, Haiku for validate)
   - Is context_summary enforced uniformly?

4. **Inputs/Outputs**:
   - What spec files does /implement read?
   - How does it know which tasks to execute?
   - What files are created/modified?
   - How is completion tracked?

5. **Incremental Execution** (CRITICAL):
   - Can user run a SINGLE task from tasks.md?
   - Can user run a SINGLE phase from tasks.md?
   - Is there a --task=T001 flag?
   - Is there a --phase=1 flag?
   - What happens if user runs /implement twice?
   - Is task completion persisted in tasks.md checkboxes?
   - Can user skip a task or mark it "done manually"?

6. **TDD Workflow**:
   - Is TDD enforced for code-agent?
   - Is component testing enforced for ui-agent?
   - How is test coverage tracked?

7. **Optimization Opportunities**:
   - Is there duplicated logic across the 4 agents?
   - Should there be a shared implementation template?
   - What's needed for true task-by-task execution?

Output to: `specs/command-optimization/implement-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /implement Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/design-analysis.md`
- `specs/command-optimization/review-analysis.md`
- `specs/command-optimization/ship-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/implement-analysis.md`

## Optimization Focus

Compare /implement against other commands and answer:

1. **Task-Level Execution** (CRITICAL):
   - How do other commands handle incremental execution?
   - How should /implement support `--task=T001`?
   - How should /implement support `--phase=1`?
   - What checkpoint file tracks which tasks are done?
   - Should tasks.md checkboxes be the source of truth?

2. **Agent Consistency**:
   - Are code-agent, ui-agent, docs-agent, eval-agent spawning sub-agents identically?
   - What shared template can unify them?
   - Is there duplicated orchestration logic?

3. **Spec Consumption**:
   - What does /implement need from /design output?
   - Is it reading requirements.md, design.md, AND tasks.md?
   - Could it read just tasks.md + a summary?

4. **Progress Reporting**:
   - How should /implement show task-by-task progress?
   - Should it update tasks.md checkboxes in real-time?
   - How do other commands show progress?

5. **Handoff to /review**:
   - What should /implement produce for /review to consume?
   - Should there be a "files changed" manifest?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/implement.md

- Add: --task flag support
- Add: --phase flag support

MODIFY: .claude/agents/code-agent.md

- Add: [what]

MODIFY: .claude/agents/ui-agent.md

- Add: [what]

CREATE: .claude/agents/templates/implement-orchestrator.md

- Shared orchestration logic for all 4 agents

MODIFY: specs/templates/tasks.md

- Add: checkpoint tracking format

```

2. **Unified Patterns Adopted**

3. **/implement-Specific Optimizations** (especially incremental execution)

Output to: `specs/command-optimization/implement-optimization.md`
```

---

# /review Command

## Worktree: `react-basecamp-cmd-review`

### Phase 1: Analysis

```markdown
# Analyze: /review Command

## Files to Read

- `.claude/commands/review.md`
- `.claude/skills/code-review/SKILL.md`
- `.claude/skills/security-patterns/SKILL.md`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - What triggers the review?
   - What's the 4-loop system mentioned?
   - What sub-agents (if any) are spawned?

2. **Review Scope**:
   - What files are reviewed? (staged, unstaged, specific files)
   - What checks are performed?
   - Is security review included?

3. **Inputs/Outputs**:
   - What arguments/flags are supported?
   - What's the output format?
   - Are issues categorized by severity?

4. **Integration**:
   - How does /review relate to /ship?
   - Is /review run automatically before /ship?
   - Does /review output feed into /reconcile?

5. **Incremental Execution**:
   - Can user review specific files only?
   - Can user run specific check types only?

6. **Optimization Opportunities**:
   - Is review output actionable?
   - Is it too verbose?
   - Should there be a summary vs detailed mode?

Output to: `specs/command-optimization/review-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /review Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/reconcile-analysis.md`
- `specs/command-optimization/ship-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/review-analysis.md`

## Optimization Focus

Compare /review against other commands and answer:

1. **Relationship to /implement**:
   - Should /review auto-detect what /implement changed?
   - Should there be a manifest file from /implement?
   - Can /review scope to only changed files?

2. **Relationship to /ship**:
   - Is /review automatically run before /ship?
   - Should it be?
   - How does /ship know review passed?

3. **Relationship to /reconcile**:
   - Does /review output feed into /reconcile?
   - Are they solving different problems or overlapping?

4. **Output Format**:
   - How do other commands format output?
   - Should /review produce structured output (JSON) alongside human output?
   - Should there be severity levels consistent with other commands?

5. **Incremental Execution**:
   - Can user run specific review checks only?
   - Should there be `--security-only`, `--lint-only` flags?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/review.md

- Add: [what]

MODIFY: .claude/skills/code-review/SKILL.md

- Add: [what]

CREATE: .claude/templates/review-output.md

- Structured output format

```

2. **Unified Patterns Adopted**

3. **/review-Specific Optimizations**

Output to: `specs/command-optimization/review-optimization.md`
```

---

# /ship Command

## Worktree: `react-basecamp-cmd-ship`

### Phase 1: Analysis

```markdown
# Analyze: /ship Command

## Files to Read

- `.claude/commands/ship.md`
- `.claude/agents/git-agent.md`
- `.claude/agents/check-agent.md`
- `.claude/skills/pr-operations/SKILL.md`
- `.claude/skills/git-operations/SKILL.md`
- `.claude/skills/qa-checks/SKILL.md`
- `.claude/sub-agents/git/git-executor.md`
- `.claude/sub-agents/git/pr-reviewer.md`
- `.claude/sub-agents/check/code-validator.md`

## Analysis Tasks

1. **Command Flow**: Document the full execution path
   - What phases? (commit, push, PR, checks, merge?)
   - What agent(s) orchestrate?
   - What sub-agents are spawned?

2. **Sub-Agent Spawning**:
   - How is git-agent invoked?
   - How is check-agent invoked?
   - Are they sequential or parallel?
   - What models are used?
   - What's in the handoffs?

3. **Quality Checks**:
   - What checks does check-agent run?
   - Are they parallel? (typecheck, lint, test, build, security)
   - What happens on failure?

4. **Inputs/Outputs**:
   - What arguments/flags? (--draft, --merge, etc.)
   - What files are read? (commit message from where?)
   - What's created? (PR, commit)

5. **Incremental Execution**:
   - Can user run ONLY commit (no PR)?
   - Can user run ONLY checks (no commit)?
   - Can user run ONLY PR creation (no merge)?
   - Is there a --step flag?
   - Can user pause before merge?

6. **Preview/Confirmation**:
   - Is there a preview of what will be committed?
   - Is there a preview of the PR description?
   - Is user confirmation required before push/merge?

7. **Optimization Opportunities**:
   - Is the commit/PR flow too rigid?
   - Should there be more granular sub-commands?
   - Is check-agent reusable outside /ship?

Output to: `specs/command-optimization/ship-analysis.md`
```

### Phase 2: Optimization

```markdown
# Optimize: /ship Command

## Context

Read the analyses from other commands:

- `specs/command-optimization/start-analysis.md`
- `specs/command-optimization/review-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/cross-command-analysis.md`

Then re-read your own:

- `specs/command-optimization/ship-analysis.md`

## Optimization Focus

Compare /ship against other commands and answer:

1. **Incremental Execution** (CRITICAL):
   - How do other commands support step-by-step execution?
   - Should /ship support `--commit-only`, `--push-only`, `--pr-only`?
   - Should there be a `--step` mode that pauses between phases?
   - What checkpoint tracks commit done, PR created, checks passed?

2. **Preview/Confirmation**:
   - How do other commands preview?
   - Should /ship preview the commit message before committing?
   - Should /ship preview the PR description before creating?
   - Should /ship require confirmation before merge?

3. **Integration with /review**:
   - Should /ship run /review automatically?
   - Or require review to have been run?
   - How does /ship know the code is review-ready?

4. **Check-Agent Reusability**:
   - Is check-agent usable outside /ship?
   - Should quality checks be a separate skill anyone can invoke?

5. **Sub-Agent Consistency**:
   - Is git-agent spawning sub-agents like other agents?
   - Is check-agent spawning parallel validators like other commands?

## Deliverables

1. **Proposed Changes**:
```

MODIFY: .claude/commands/ship.md

- Add: --commit-only, --pr-only flags
- Add: preview before each phase

MODIFY: .claude/agents/git-agent.md

- Add: [what]

MODIFY: .claude/agents/check-agent.md

- Add: [what]

CREATE: .claude/skills/quality-checks/SKILL.md

- Reusable check-agent invocation

```

2. **Unified Patterns Adopted**

3. **/ship-Specific Optimizations** (especially incremental phases)

Output to: `specs/command-optimization/ship-optimization.md`
```

---

# Cross-Command (Run in main `command-optimization` worktree)

## Worktree: `react-basecamp-command-optimization`

### After All Phase 1 Complete: Cross-Command Analysis

```markdown
# Analyze: Cross-Command Consistency

## Files to Read

All Phase 1 analysis outputs:

- `specs/command-optimization/start-analysis.md`
- `specs/command-optimization/design-analysis.md`
- `specs/command-optimization/research-analysis.md`
- `specs/command-optimization/reconcile-analysis.md`
- `specs/command-optimization/implement-analysis.md`
- `specs/command-optimization/review-analysis.md`
- `specs/command-optimization/ship-analysis.md`

## Analysis Tasks

1. **Pattern Consistency Matrix**:

   | Command    | Preview? | Progress? | Sub-agents? | Incremental? | State File? |
   | ---------- | -------- | --------- | ----------- | ------------ | ----------- |
   | /start     |          |           |             |              |             |
   | /design    |          |           |             |              |             |
   | /research  |          |           |             |              |             |
   | /reconcile |          |           |             |              |             |
   | /implement |          |           |             |              |             |
   | /review    |          |           |             |              |             |
   | /ship      |          |           |             |              |             |

2. **Sub-Agent Spawning Consistency**:
   - Is Task() called identically across commands?
   - Are handoff objects structured the same?
   - Is model selection consistent for similar work?

3. **Information Flow Map**:
```

/start -> creates worktree
|
/design -> reads ?, creates specs/{feature}/_.md
|
/implement -> reads specs/{feature}/_.md, creates src/**
|
/review -> reads src/**, outputs ?
|
/ship -> reads ?, creates PR

```
- Fill in the gaps
- Identify broken handoffs

4. **Unified Templates Needed**:
- Preview template (all commands)
- Progress output template (all commands)
- Error reporting template (all commands)
- Sub-agent handoff template (all agents)
- Checkpoint/state file schema (all commands)

5. **Priority Recommendations**:
- Rank optimizations by impact
- Identify quick wins vs larger efforts

Output to: `specs/command-optimization/cross-command-analysis.md`
```

### After All Phase 2 Complete: Cross-Command Synthesis

```markdown
# Synthesize: Cross-Command Optimizations

## Context

Read ALL optimization proposals:

- `specs/command-optimization/start-optimization.md`
- `specs/command-optimization/design-optimization.md`
- `specs/command-optimization/research-optimization.md`
- `specs/command-optimization/reconcile-optimization.md`
- `specs/command-optimization/implement-optimization.md`
- `specs/command-optimization/review-optimization.md`
- `specs/command-optimization/ship-optimization.md`

## Synthesis Tasks

1. **Unified Templates Identified**:
   - List all templates that multiple commands want to adopt
   - Propose single implementation for each

2. **Shared Scripts Identified**:
   - List all scripts that could be shared
   - Propose location and interface

3. **Checkpoint/State Schema**:
   - Synthesize checkpoint needs from all commands
   - Propose unified checkpoint.json schema

4. **Implementation Priority**:
   - Rank all proposed changes by:
     - Impact (how many commands benefit)
     - Effort (how hard to implement)
     - Dependencies (what must come first)

5. **Migration Plan**:
   - Phase 1: Shared templates/scripts (foundation)
   - Phase 2: Individual command updates
   - Phase 3: Integration testing

Output to: `specs/command-optimization/synthesis.md`
```

---

# Quick Reference: Execution Order

```bash
# 1. Create all worktrees (optional - can run sequentially in one worktree)
git worktree add ../react-basecamp-cmd-start -b feature/cmd-start-optimization
git worktree add ../react-basecamp-cmd-design -b feature/cmd-design-optimization
# ... etc

# 2. Run Phase 1 (Analysis) for ALL commands
# Can be parallel across worktrees

# 3. Run Cross-Command Analysis (in main command-optimization worktree)
# After ALL Phase 1 complete

# 4. Run Phase 2 (Optimization) for ALL commands
# Can be parallel, but needs cross-command-analysis.md to exist

# 5. Run Cross-Command Synthesis (in main command-optimization worktree)
# After ALL Phase 2 complete
```
