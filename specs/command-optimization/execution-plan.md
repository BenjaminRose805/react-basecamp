# Command Optimization Execution Plan

Complete, copy-paste prompts for each phase. Includes Linear and Vercel integration.

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
- Section 6.1.1: Linear Client Interface
- Section 6.4: Integration Configuration

Then /design checkpoint-infrastructure to create:
- .claude/scripts/lib/checkpoint-manager.cjs (per section 2.3 interface)
- .claude/scripts/lib/token-counter.cjs (validate context_summary ≤500 tokens)
- .claude/scripts/lib/linear-client.cjs (per section 6.1.1 interface)
- .claude/protocols/checkpoint-schema.md (per section 3.1)
- .claude/protocols/handoff-schema.md (per section 1.4)
- .claude/config/integrations.json (per section 6.4)
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
- Section 6.1.4: Spec.json Linear Extension
- Section 6.2.3: Preview Template Vercel Extension

Then /design unified-templates to create:
- .claude/skills/preview/templates/command-preview.md (per section 1.1 + 6.2.3)
- .claude/skills/progress/templates/stage-progress.md (per section 1.2)
- .claude/skills/preview/templates/error-report.md (per section 1.3)
- specs/templates/requirements.md (trimmed to 55 lines)
- specs/templates/design.md (trimmed to 70 lines)
- specs/templates/tasks.md (trimmed to 45 lines)
- specs/templates/summary.md (new, 25 lines)
- specs/templates/meta.yaml (new, 10 lines)
- specs/templates/spec.json (new, 30 lines, include Linear fields per 6.1.4)
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
- specs/command-optimization/synthesis.md section 6.1.2 (Command Integration Points)

Then /design implement-incremental-execution to:
- Create .claude/scripts/lib/task-parser.cjs (per synthesis section 2.4)
- Update .claude/commands/implement.md to support --task=T001 flag
- Update .claude/commands/implement.md to support --phase=N flag
- Integrate checkpoint-manager.cjs with --resume flag support
- Use unified preview template before execution
- Add Linear integration: set issue status → "In Progress" on start
- Add Linear integration: add comment with task progress updates
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
Read specs/command-optimization/synthesis.md section 6.1.2 (Command Integration Points)
Read specs/command-optimization/synthesis.md section 6.1.4 (Spec.json Extension)

Then /design design-incremental-execution to:
- Update .claude/commands/design.md to support --phase=research|write|validate flag
- Integrate checkpoint-manager.cjs with --resume flag support
- Auto-generate summary.md after write phase
- Use unified preview template before execution
- Add Linear integration: create issue when spec is approved
- Add Linear integration: store issue ID in spec.json
- Add Linear integration: include issue link in design output
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
Read specs/command-optimization/synthesis.md section 6.1.2 (Command Integration Points)
Read specs/command-optimization/synthesis.md section 6.2 (Vercel Integration)

Then /design ship-incremental-execution to:
- Add content preview phase showing commit message, PR title/body before execution
- Support --commit-only flag (commit without PR)
- Support --pr-only flag (PR without merge)
- Support --push-only flag (push without PR)
- Integrate checkpoint-manager.cjs tracking: commit/push/PR/checks/merge states
- Add confirmation prompts before irreversible actions (push, PR create, merge)
- Add Linear integration: set issue status → "Done" after merge
- Add Linear integration: link PR to issue
- Add Vercel integration: wait for preview deployment before merge prompt
- Add Vercel integration: show preview URL and deployment status in preview
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
Update CLAUDE.md to document:

New command flags:
- /implement: --task=T001, --phase=N, --resume
- /design: --phase=research|write|validate, --resume
- /ship: --commit-only, --pr-only, --push-only, --resume
- /start: --dry-run
- /research: --scope=path
- /review: --files=path1,path2, --from-implement
- /reconcile: --analyze-only

Integrations:
- Linear: Auto-creates issues on /design, updates status on /implement and /ship
- Vercel: /ship waits for preview deployment, shows deployment status
```

### Step 11.2: E2E Test

```
/start e2e-test
```

Then test full workflow with integrations:

```
/design → verify Linear issue created
/implement --task=T001 → verify Linear status = In Progress
/review
/ship --commit-only → verify Vercel preview deploys
/ship → verify Linear status = Done, PR linked
```

---

## Summary Table

| Phase | Worktree                                | /design                           | Key Deliverables                            |
| ----- | --------------------------------------- | --------------------------------- | ------------------------------------------- |
| 1     | `react-basecamp-foundation`             | `checkpoint-infrastructure`       | checkpoint-manager, linear-client, schemas  |
| 2     | `react-basecamp-templates`              | `unified-templates`               | preview/progress/error templates, spec.json |
| 3     | `react-basecamp-implement-optimization` | `implement-incremental-execution` | --task, --phase, --resume, Linear status    |
| 4     | `react-basecamp-design-optimization`    | `design-incremental-execution`    | --phase, --resume, Linear issue creation    |
| 5     | `react-basecamp-ship-optimization`      | `ship-incremental-execution`      | --commit-only, Vercel checks, Linear done   |
| 6     | `react-basecamp-start-optimization`     | `start-improvements`              | --dry-run, state location                   |
| 7     | `react-basecamp-research-optimization`  | `research-improvements`           | --scope, research.json                      |
| 8     | `react-basecamp-reconcile-optimization` | `reconcile-improvements`          | --analyze-only                              |
| 9     | `react-basecamp-review-optimization`    | `review-improvements`             | --files, --from-implement                   |
| 10    | `react-basecamp-shared-refactoring`     | `orchestrator-consolidation`      | orchestrator template                       |
| 11    | main                                    | -                                 | CLAUDE.md, E2E test                         |

---

## Integration Summary

| Integration | Phase | Trigger           | Action                      |
| ----------- | ----- | ----------------- | --------------------------- |
| Linear      | 1     | -                 | Create linear-client.cjs    |
| Linear      | 4     | /design approved  | Create issue                |
| Linear      | 3     | /implement starts | Status → In Progress        |
| Linear      | 5     | /ship merges      | Status → Done, link PR      |
| Vercel      | 5     | /ship creates PR  | Wait for preview deployment |
| Vercel      | 5     | /ship preview     | Show deployment status      |

---

## Recommended Order

**Critical path (do first):**

1. Phase 1: Foundation (checkpoint-manager + linear-client)
2. Phase 2: Templates (used by all commands)
3. Phase 3: /implement (highest impact + Linear integration)

**Can parallelize after foundation:**

- Phases 4-9 (individual commands)
- Phase 10 (shared refactoring)

**Do last:**

- Phase 11: Integration

---

## The Pattern (Repeat for Each Phase)

```
┌─────────────────────────────────────────────────────────────┐
│                    THE LOOP                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. START      /start {name}                                │
│                cd ../react-basecamp-{name}                  │
│                                                             │
│  2. DESIGN     [paste prompt from this file]                │
│                                                             │
│  3. BUILD      /implement                                   │
│                                                             │
│  4. VERIFY     /review                                      │
│                                                             │
│  5. SHIP       /ship                                        │
│                                                             │
│  6. CLEANUP    cd ~/basecamp/react-basecamp                 │
│                git pull --rebase                            │
│                git worktree remove ../react-basecamp-{name} │
│                                                             │
│  7. NEXT       → repeat with next phase                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] 1. foundation             → /ship ✓ → cleanup ✓
[ ] 2. templates              → /ship ✓ → cleanup ✓
[ ] 3. implement-optimization → /ship ✓ → cleanup ✓
[ ] 4. design-optimization    → /ship ✓ → cleanup ✓
[ ] 5. ship-optimization      → /ship ✓ → cleanup ✓
[ ] 6. start-optimization     → /ship ✓ → cleanup ✓
[ ] 7. research-optimization  → /ship ✓ → cleanup ✓
[ ] 8. reconcile-optimization → /ship ✓ → cleanup ✓
[ ] 9. review-optimization    → /ship ✓ → cleanup ✓
[ ] 10. shared-refactoring    → /ship ✓ → cleanup ✓
[ ] 11. final (CLAUDE.md + E2E)
```
