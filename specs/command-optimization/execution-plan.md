# Command Optimization Execution Plan

Use the existing command system to implement improvements. Dogfooding approach.

---

## Phase 1: Foundation

### Step 1.1: Start

```bash
/start foundation
cd ../react-basecamp-foundation
```

### Step 1.2: Design

```
/design checkpoint-infrastructure
```

**Input to /design:**

- Read `specs/command-optimization/synthesis.md` sections 2.3 (Checkpoint Manager Interface) and 3.1 (Unified Checkpoint Schema)
- Read `specs/command-optimization/synthesis.md` section 1.4 (Sub-Agent Handoff Schema)

**Expected output:**

- `specs/checkpoint-infrastructure/requirements.md`
- `specs/checkpoint-infrastructure/design.md`
- `specs/checkpoint-infrastructure/tasks.md`

**Scope:**
| Task | File to Create |
|------|----------------|
| Checkpoint manager | `.claude/scripts/lib/checkpoint-manager.cjs` |
| Checkpoint schema | `.claude/protocols/checkpoint-schema.md` |
| Handoff schema | `.claude/protocols/handoff-schema.md` |
| Token counter | `.claude/scripts/lib/token-counter.cjs` |

### Step 1.3: Implement

```
/implement
```

### Step 1.4: Review

```
/review
```

### Step 1.5: Ship

```
/ship
```

---

## Phase 2: Templates

### Step 2.1: Start

```bash
/start templates
cd ../react-basecamp-templates
```

### Step 2.2: Design

```
/design unified-templates
```

**Input to /design:**

- Read `specs/command-optimization/synthesis.md` sections 1.1 (Preview Template), 1.2 (Progress Template), 1.3 (Error Template)
- Read `specs/command-optimization/synthesis.md` section 1.6 (Spec Output Templates)

**Scope:**
| Task | File to Create |
|------|----------------|
| Preview template | `.claude/skills/preview/templates/command-preview.md` |
| Progress template | `.claude/skills/progress/templates/stage-progress.md` |
| Error template | `.claude/skills/preview/templates/error-report.md` |
| Trim requirements.md | `specs/templates/requirements.md` (55 lines) |
| Trim design.md | `specs/templates/design.md` (70 lines) |
| Trim tasks.md | `specs/templates/tasks.md` (45 lines) |
| New summary.md | `specs/templates/summary.md` (25 lines) |
| New meta.yaml | `specs/templates/meta.yaml` (10 lines) |
| New spec.json | `specs/templates/spec.json` (30 lines) |

### Step 2.3-2.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 3: /implement Command

### Step 3.1: Start

```bash
/start implement-optimization
cd ../react-basecamp-implement-optimization
```

### Step 3.2: Design

```
/design implement-incremental-execution
```

**Input to /design:**

- Read `specs/command-optimization/implement-optimization.md`
- Read `specs/command-optimization/synthesis.md` section 2.4 (Task Parser Interface)

**Scope:**
| Task | Description |
|------|-------------|
| Task parser | Create `.claude/scripts/lib/task-parser.cjs` |
| --task flag | Update `.claude/commands/implement.md` for `--task=T001` |
| --phase flag | Update `.claude/commands/implement.md` for `--phase=N` |
| Checkpoint integration | Integrate checkpoint-manager, support `--resume` |
| Preview integration | Use unified preview template |

### Step 3.3-3.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 4: /design Command

### Step 4.1: Start

```bash
/start design-optimization
cd ../react-basecamp-design-optimization
```

### Step 4.2: Design

```
/design design-incremental-execution
```

**Input to /design:**

- Read `specs/command-optimization/design-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| --phase flag | Support `--phase=research\|write\|validate` |
| Checkpoint integration | Integrate checkpoint-manager, support `--resume` |
| summary.md generation | Auto-generate after write phase |
| Preview integration | Use unified preview template |

### Step 4.3-4.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 5: /ship Command

### Step 5.1: Start

```bash
/start ship-optimization
cd ../react-basecamp-ship-optimization
```

### Step 5.2: Design

```
/design ship-incremental-execution
```

**Input to /design:**

- Read `specs/command-optimization/ship-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| Content preview | Show commit message, PR title/body before execution |
| --commit-only flag | Commit without PR |
| --pr-only flag | PR without merge |
| --push-only flag | Push without PR |
| Checkpoint integration | Track commit/push/PR/checks/merge states |
| Confirmation prompts | Require confirmation before irreversible actions |

### Step 5.3-5.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 6: /start Command

### Step 6.1: Start

```bash
/start start-optimization
cd ../react-basecamp-start-optimization
```

### Step 6.2: Design

```
/design start-improvements
```

**Input to /design:**

- Read `specs/command-optimization/start-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| State location | Move start-status.json to `.claude/state/` |
| --dry-run flag | Validate without creating worktree |
| Prereqs script | Create `.claude/scripts/validate-start-prereqs.cjs` |
| Preview integration | Use unified preview template |

### Step 6.3-6.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 7: /research Command

### Step 7.1: Start

```bash
/start research-optimization
cd ../react-basecamp-research-optimization
```

### Step 7.2: Design

```
/design research-improvements
```

**Input to /design:**

- Read `specs/command-optimization/research-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| Structured output | Create research.json alongside research-notes.md |
| --scope flag | Limit research to specific directories |
| /design handoff | Enable /design to skip research if research.json exists |

### Step 7.3-7.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 8: /reconcile Command

### Step 8.1: Start

```bash
/start reconcile-optimization
cd ../react-basecamp-reconcile-optimization
```

### Step 8.2: Design

```
/design reconcile-improvements
```

**Input to /design:**

- Read `specs/command-optimization/reconcile-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| --analyze-only flag | Show issues without generating fix plan |
| Tasks output | Output tasks.md in same format as /design |

### Step 8.3-8.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 9: /review Command

### Step 9.1: Start

```bash
/start review-optimization
cd ../react-basecamp-review-optimization
```

### Step 9.2: Design

```
/design review-improvements
```

**Input to /design:**

- Read `specs/command-optimization/review-optimization.md`

**Scope:**
| Task | Description |
|------|-------------|
| --files flag | Review specific files only |
| --from-implement flag | Auto-detect files from implement-output.json |
| Gate integration | Ensure ship_allowed integrates with /ship |

### Step 9.3-9.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 10: Shared Refactoring

### Step 10.1: Start

```bash
/start shared-refactoring
cd ../react-basecamp-shared-refactoring
```

### Step 10.2: Design

```
/design orchestrator-consolidation
```

**Input to /design:**

- Read `specs/command-optimization/synthesis.md` section 1.5 (Implementation Orchestrator Template)

**Scope:**
| Task | Description |
|------|-------------|
| Orchestrator template | Create `.claude/agents/templates/implementation-orchestrator.md` |
| Refactor code-agent | Use template, remove duplication |
| Refactor ui-agent | Use template, remove duplication |
| Refactor docs-agent | Use template, remove duplication |
| Refactor eval-agent | Use template, remove duplication |
| Research mode | Add mode=research to domain-researcher.md |
| Reconcile mode | Add mode=reconcile to templates |

### Step 10.3-10.5: Implement → Review → Ship

```
/implement
/review
/ship
```

---

## Phase 11: Final Integration

### Step 11.1: Update CLAUDE.md

```bash
cd ~/basecamp/react-basecamp
```

Add documentation for new flags:

- `--task=T001` (/implement)
- `--phase=N` (/implement, /design)
- `--resume` (/implement, /design, /ship)
- `--dry-run` (/start)
- `--commit-only`, `--pr-only`, `--push-only` (/ship)
- `--scope=path` (/research)
- `--files=path1,path2` (/review)
- `--from-implement` (/review)
- `--analyze-only` (/reconcile)

### Step 11.2: E2E Test

```
/start e2e-test
/design → /implement --task=T001 → /review → /ship --commit-only
```

---

## Summary

| Phase | Feature     | /start                   | /design                           | Key Deliverables                                |
| ----- | ----------- | ------------------------ | --------------------------------- | ----------------------------------------------- |
| 1     | Foundation  | `foundation`             | `checkpoint-infrastructure`       | checkpoint-manager.cjs, schemas                 |
| 2     | Templates   | `templates`              | `unified-templates`               | preview/progress/error templates, trimmed specs |
| 3     | /implement  | `implement-optimization` | `implement-incremental-execution` | --task, --phase, --resume                       |
| 4     | /design     | `design-optimization`    | `design-incremental-execution`    | --phase, --resume, summary.md                   |
| 5     | /ship       | `ship-optimization`      | `ship-incremental-execution`      | --commit-only, content preview                  |
| 6     | /start      | `start-optimization`     | `start-improvements`              | --dry-run, state location                       |
| 7     | /research   | `research-optimization`  | `research-improvements`           | --scope, research.json                          |
| 8     | /reconcile  | `reconcile-optimization` | `reconcile-improvements`          | --analyze-only                                  |
| 9     | /review     | `review-optimization`    | `review-improvements`             | --files, --from-implement                       |
| 10    | Shared      | `shared-refactoring`     | `orchestrator-consolidation`      | orchestrator template                           |
| 11    | Integration | -                        | -                                 | CLAUDE.md, E2E test                             |

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
