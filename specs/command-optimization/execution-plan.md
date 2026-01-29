# Command Optimization Execution Plan

Complete, copy-paste prompts for each phase.

---

## Phase 1: Foundation

### Step 1.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start foundation
cd ../react-basecamp-foundation
```

### Step 1.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/synthesis.md and extract:
- Section 2.3: Checkpoint Manager Interface
- Section 3.1: Unified Checkpoint Schema
- Section 1.4: Sub-Agent Handoff Schema

Then /design checkpoint-infrastructure to create:
- .claude/scripts/lib/checkpoint-manager.cjs (per section 2.3 interface)
- .claude/scripts/lib/token-counter.cjs (validate context_summary ≤500 tokens)
- .claude/protocols/checkpoint-schema.md (per section 3.1)
- .claude/protocols/handoff-schema.md (per section 1.4)
```

### Step 1.3-1.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 2: Templates

### Step 2.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start templates
cd ../react-basecamp-templates
```

### Step 2.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/synthesis.md and extract:
- Section 1.1: Preview Template
- Section 1.2: Progress Template
- Section 1.3: Error Template
- Section 1.6: Spec Output Templates

Then /design unified-templates to create:
- .claude/skills/preview/templates/command-preview.md (per section 1.1)
- .claude/skills/progress/templates/stage-progress.md (per section 1.2)
- .claude/skills/preview/templates/error-report.md (per section 1.3)
- specs/templates/requirements.md (trimmed to 55 lines)
- specs/templates/design.md (trimmed to 70 lines)
- specs/templates/tasks.md (trimmed to 45 lines)
- specs/templates/summary.md (new, 25 lines)
- specs/templates/meta.yaml (new, 10 lines)
- specs/templates/spec.json (new, 30 lines schema)
```

### Step 2.3-2.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 3: /implement Command

### Step 3.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start implement-optimization
cd ../react-basecamp-implement-optimization
```

### Step 3.2: Design

Copy-paste this prompt:

```
Read these files:
- specs/command-optimization/implement-optimization.md (full file)
- specs/command-optimization/synthesis.md section 2.4 (Task Parser Interface)

Then /design implement-incremental-execution to:
- Create .claude/scripts/lib/task-parser.cjs (per synthesis section 2.4)
- Update .claude/commands/implement.md to support --task=T001 flag
- Update .claude/commands/implement.md to support --phase=N flag
- Integrate checkpoint-manager.cjs with --resume flag support
- Use unified preview template before execution
```

### Step 3.3-3.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 4: /design Command

### Step 4.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start design-optimization
cd ../react-basecamp-design-optimization
```

### Step 4.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/design-optimization.md (full file)

Then /design design-incremental-execution to:
- Update .claude/commands/design.md to support --phase=research|write|validate flag
- Integrate checkpoint-manager.cjs with --resume flag support
- Auto-generate summary.md after write phase
- Use unified preview template before execution
```

### Step 4.3-4.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 5: /ship Command

### Step 5.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start ship-optimization
cd ../react-basecamp-ship-optimization
```

### Step 5.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/ship-optimization.md (full file)

Then /design ship-incremental-execution to:
- Add content preview phase showing commit message, PR title/body before execution
- Support --commit-only flag (commit without PR)
- Support --pr-only flag (PR without merge)
- Support --push-only flag (push without PR)
- Integrate checkpoint-manager.cjs tracking: commit/push/PR/checks/merge states
- Add confirmation prompts before irreversible actions (push, PR create, merge)
```

### Step 5.3-5.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 6: /start Command

### Step 6.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start start-optimization
cd ../react-basecamp-start-optimization
```

### Step 6.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/start-optimization.md (full file)

Then /design start-improvements to:
- Move start-status.json output from root to .claude/state/start-status.json
- Add --dry-run flag that validates prerequisites without creating worktree
- Create .claude/scripts/validate-start-prereqs.cjs for --dry-run
- Use unified preview template before execution
```

### Step 6.3-6.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 7: /research Command

### Step 7.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start research-optimization
cd ../react-basecamp-research-optimization
```

### Step 7.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/research-optimization.md (full file)

Then /design research-improvements to:
- Create research.json structured output alongside research-notes.md
- Add --scope=path flag to limit research to specific directories
- Enable /design to detect existing research.json and skip research phase
```

### Step 7.3-7.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 8: /reconcile Command

### Step 8.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start reconcile-optimization
cd ../react-basecamp-reconcile-optimization
```

### Step 8.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/reconcile-optimization.md (full file)

Then /design reconcile-improvements to:
- Add --analyze-only flag to show issues without generating fix plan
- Output tasks.md in same format as /design for consistency
```

### Step 8.3-8.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 9: /review Command

### Step 9.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start review-optimization
cd ../react-basecamp-review-optimization
```

### Step 9.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/review-optimization.md (full file)

Then /design review-improvements to:
- Add --files=path1,path2 flag to review specific files only
- Add --from-implement flag to auto-detect files from implement-output.json
- Ensure loop-state.json ship_allowed integrates with /ship gate check
```

### Step 9.3-9.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 10: Shared Refactoring

### Step 10.1: Create Worktree

```bash
# From: ~/basecamp/react-basecamp
/start shared-refactoring
cd ../react-basecamp-shared-refactoring
```

### Step 10.2: Design

Copy-paste this prompt:

```
Read specs/command-optimization/synthesis.md section 1.5 (Implementation Orchestrator Template)

Then /design orchestrator-consolidation to:
- Create .claude/agents/templates/implementation-orchestrator.md
- Refactor .claude/agents/code-agent.md to use template, remove duplication
- Refactor .claude/agents/ui-agent.md to use template
- Refactor .claude/agents/docs-agent.md to use template
- Refactor .claude/agents/eval-agent.md to use template
- Add mode=research to .claude/sub-agents/templates/domain-researcher.md
- Add mode=reconcile to domain-researcher.md and domain-writer.md
```

### Step 10.3-10.5: Implement, Review, Ship

```
/implement
/review
/ship
```

---

## Phase 11: Final Integration

### Step 11.1: Update CLAUDE.md

```bash
# From: ~/basecamp/react-basecamp
```

Copy-paste this prompt:

```
Update CLAUDE.md to document new command flags:
- /implement: --task=T001, --phase=N, --resume
- /design: --phase=research|write|validate, --resume
- /ship: --commit-only, --pr-only, --push-only, --resume
- /start: --dry-run
- /research: --scope=path
- /review: --files=path1,path2, --from-implement
- /reconcile: --analyze-only
```

### Step 11.2: E2E Test

```
/start e2e-test
```

Then test full workflow:

```
/design → /implement --task=T001 → /review → /ship --commit-only
```

---

## Summary Table

| Phase | Worktree                                | /design                           | Key Deliverables                 |
| ----- | --------------------------------------- | --------------------------------- | -------------------------------- |
| 1     | `react-basecamp-foundation`             | `checkpoint-infrastructure`       | checkpoint-manager.cjs, schemas  |
| 2     | `react-basecamp-templates`              | `unified-templates`               | preview/progress/error templates |
| 3     | `react-basecamp-implement-optimization` | `implement-incremental-execution` | --task, --phase, --resume        |
| 4     | `react-basecamp-design-optimization`    | `design-incremental-execution`    | --phase, --resume, summary.md    |
| 5     | `react-basecamp-ship-optimization`      | `ship-incremental-execution`      | --commit-only, content preview   |
| 6     | `react-basecamp-start-optimization`     | `start-improvements`              | --dry-run, state location        |
| 7     | `react-basecamp-research-optimization`  | `research-improvements`           | --scope, research.json           |
| 8     | `react-basecamp-reconcile-optimization` | `reconcile-improvements`          | --analyze-only                   |
| 9     | `react-basecamp-review-optimization`    | `review-improvements`             | --files, --from-implement        |
| 10    | `react-basecamp-shared-refactoring`     | `orchestrator-consolidation`      | orchestrator template            |
| 11    | main                                    | -                                 | CLAUDE.md, E2E test              |

---

## Recommended Order

**Critical path (do first):**

1. Phase 1: Foundation (everything depends on checkpoint-manager)
2. Phase 2: Templates (used by all commands)
3. Phase 3: /implement (highest impact)

**Can parallelize after foundation:**

- Phases 4-9 (individual commands)
- Phase 10 (shared refactoring)

**Do last:**

- Phase 11: Integration

---

## Cleanup After Each Phase

```bash
# After /ship completes for a phase, from main:
cd ~/basecamp/react-basecamp
git worktree remove ../react-basecamp-{name} --force
git branch -D feature/{name}
```
