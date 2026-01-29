# /ship Command Optimization

Run: `Read specs/command-optimization/PROMPT.md and execute Phase 1`

---

## Phase 1: Analysis

Read these files:

- `.claude/commands/ship.md`
- `.claude/agents/git-agent.md`
- `.claude/agents/check-agent.md`
- `.claude/skills/pr-operations/SKILL.md`
- `.claude/skills/git-operations/SKILL.md`
- `.claude/skills/qa-checks/SKILL.md`
- `.claude/sub-agents/git/git-executor.md`
- `.claude/sub-agents/git/pr-reviewer.md`
- `.claude/sub-agents/check/code-validator.md`

Then analyze:

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

**Output to:** `specs/command-optimization/ship-analysis.md`

---

## Phase 2: Optimization

Run: `Read specs/command-optimization/PROMPT.md and execute Phase 2`

**Prerequisites:** Phase 1 complete for ALL commands, plus cross-command-analysis.md exists in this directory.

Read these analyses first (all should be in specs/command-optimization/):

- `start-analysis.md`
- `review-analysis.md`
- `implement-analysis.md`
- `cross-command-analysis.md`
- `ship-analysis.md` (your own)

Then compare /ship against other commands:

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

**Deliverables:**

1. **Proposed Changes** - List specific file changes
2. **Unified Patterns Adopted**
3. **/ship-Specific Optimizations** (especially incremental phases)

**Output to:** `specs/command-optimization/ship-optimization.md`
