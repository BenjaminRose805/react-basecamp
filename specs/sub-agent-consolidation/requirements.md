# Requirements: Sub-Agent Consolidation & Dynamic Sizing

> **Status:** Draft
> **Created:** 2026-01-27
> **Spec ID:** sub-agent-consolidation

## Overview

Consolidate 37 sub-agents down to 11 templates by merging functionally identical agents, and implement dynamic phase sizing so orchestrators spawn the right number of sub-agents based on actual task complexity rather than always using 3 phases.

---

## User Stories

### US1: Consolidate Domain Researchers

**As a** system maintainer, **I want** domain researchers consolidated into a single template, **so that** updates only need to be made once instead of five times.

#### Acceptance Criteria

- **REQ-1.1:** THE SYSTEM SHALL provide a single `domain-researcher` template that can operate in multiple modes (plan, code, ui, docs, eval).

- **REQ-1.2:** THE `domain-researcher` template SHALL accept a `mode` parameter to determine which domain patterns to use.

- **REQ-1.3:** THE consolidated researcher SHALL have identical behavior to the current 5 separate researcher sub-agents.

- **REQ-1.4:** WHEN an orchestrator needs research, THE SYSTEM SHALL spawn `domain-researcher` with appropriate mode parameter.

---

### US2: Consolidate Domain Writers

**As a** system maintainer, **I want** domain writers consolidated into a single template, **so that** the writing workflow is unified across all domains.

#### Acceptance Criteria

- **REQ-2.1:** THE SYSTEM SHALL provide a single `domain-writer` template that can operate in multiple modes (code, ui, docs, eval).

- **REQ-2.2:** THE `domain-writer` template SHALL accept a `mode` parameter to determine which implementation patterns to follow.

- **REQ-2.3:** THE consolidated writer SHALL have identical behavior to the current 5 separate writer sub-agents.

- **REQ-2.4:** WHEN an orchestrator needs implementation, THE SYSTEM SHALL spawn `domain-writer` with appropriate mode parameter.

---

### US3: Consolidate Domain Validators

**As a** system maintainer, **I want** domain validators consolidated into a single template, **so that** validation logic is consistent across all domains.

#### Acceptance Criteria

- **REQ-3.1:** THE SYSTEM SHALL provide a single `quality-validator` template that validates any domain's output.

- **REQ-3.2:** THE `quality-validator` template SHALL run domain-agnostic checks (types, tests, lint, build).

- **REQ-3.3:** THE consolidated validator SHALL have identical behavior to the current 5 separate validator sub-agents.

- **REQ-3.4:** WHEN an orchestrator needs validation, THE SYSTEM SHALL spawn `quality-validator` without mode parameter (domain-agnostic).

---

### US4: Consolidate Quality Checkers

**As a** system maintainer, **I want** quality checkers consolidated into a single template, **so that** adding new checks is centralized.

#### Acceptance Criteria

- **REQ-4.1:** THE SYSTEM SHALL provide a single `quality-checker` template that runs any quality check command.

- **REQ-4.2:** THE `quality-checker` template SHALL accept a `check_type` parameter (build, type, lint, test, security).

- **REQ-4.3:** THE consolidated checker SHALL execute pnpm commands based on check_type.

- **REQ-4.4:** WHEN check-agent needs parallel validation, THE SYSTEM SHALL spawn multiple `quality-checker` instances with different check_type values.

---

### US5: Consolidate Analyzers

**As a** system maintainer, **I want** similar analyzers consolidated, **so that** analysis patterns are unified.

#### Acceptance Criteria

- **REQ-5.1:** THE SYSTEM SHALL consolidate 3 plan analyzers (spec-analyzer, spec-reviewer, spec-formatter) into 1 `spec-analyzer` template.

- **REQ-5.2:** THE SYSTEM SHALL consolidate 2 git analyzers (change-analyzer, pr-analyzer) into 1 `git-content-generator` template.

- **REQ-5.3:** THE SYSTEM SHALL consolidate 3 workflow analyzers (workflow-analyzer, investigator, refactor-analyzer) into 1 `code-analyzer` template.

- **REQ-5.4:** EACH consolidated analyzer SHALL accept a `mode` parameter to determine analysis focus.

---

### US6: Keep Unique Sub-Agents

**As a** system maintainer, **I want** truly unique sub-agents preserved, **so that** specialized behavior is not lost.

#### Acceptance Criteria

- **REQ-6.1:** THE SYSTEM SHALL preserve `git-executor` as a unique sub-agent (command execution).

- **REQ-6.2:** THE SYSTEM SHALL preserve `pr-reviewer` as a unique sub-agent (complex review logic).

- **REQ-6.3:** THE SYSTEM SHALL preserve `security-scanner` as a unique sub-agent (specialized security patterns).

- **REQ-6.4:** THE SYSTEM SHALL preserve `parallel-executor` as a unique template (parallel coordination).

---

### US7: Dynamic Phase Sizing Based on Complexity

**As a** user running commands, **I want** the system to use the right number of sub-agents for the task, **so that** simple tasks complete quickly and complex tasks are properly broken down.

#### Acceptance Criteria

- **REQ-7.1:** WHEN a task has 1-2 changes in 1 file, THE SYSTEM SHALL spawn 1 sub-agent.

- **REQ-7.2:** WHEN a task has 3-5 changes across 2-3 files, THE SYSTEM SHALL spawn 2-3 sub-agents.

- **REQ-7.3:** WHEN a task has 6+ changes across 4+ files, THE SYSTEM SHALL spawn 4-7 sub-agents.

- **REQ-7.4:** THE orchestrator SHALL determine sub-agent count based on: file count, task count, effort estimates from task-decomposer, module spread.

---

### US8: Adaptive Sizing Examples

**As a** user, **I want** real-world commands to use appropriate sizing, **so that** I get fast feedback on simple tasks and proper breakdown on complex tasks.

#### Acceptance Criteria

- **REQ-8.1:** WHEN running `/ship` (commit + PR), THE SYSTEM SHALL spawn 1 sub-agent (git-content-generator).

- **REQ-8.2:** WHEN fixing a typo in 1 file, THE SYSTEM SHALL spawn 1 sub-agent (domain-writer).

- **REQ-8.3:** WHEN adding a simple endpoint (1-2 files), THE SYSTEM SHALL spawn 2 sub-agents (researcher + writer).

- **REQ-8.4:** WHEN implementing a feature with 5 tasks, THE SYSTEM SHALL spawn 3-4 sub-agents (researcher + writer + validator + optional specialized).

- **REQ-8.5:** WHEN refactoring 20+ files, THE SYSTEM SHALL spawn 5-7 sub-agents (split by module/domain boundaries).

---

## Non-Functional Requirements

### NFR-1: Token Savings

**THE SYSTEM SHALL** reduce total sub-agent template tokens by at least 60% through consolidation.

**Measurement:** Current 37 sub-agents at ~500 tokens each = 18,500 tokens. Target 11 templates at ~700 tokens each = 7,700 tokens (58% reduction).

---

### NFR-2: Performance

**THE SYSTEM SHALL NOT** degrade orchestrator decision time when selecting consolidated templates.

**Measurement:** Template selection adds <100ms overhead.

---

### NFR-3: Backward Compatibility

**THE SYSTEM SHALL** maintain identical behavior for all existing agent workflows during consolidation.

**Measurement:** All 7 agents (plan, code, ui, docs, eval, check, git) produce identical outputs before and after consolidation.

---

### NFR-4: Context Efficiency

**THE SYSTEM SHALL** reduce average sub-agent invocation overhead by spawning fewer agents for simple tasks.

**Measurement:** Simple tasks (1 file change) use 1 sub-agent instead of 3, saving 66% context per operation.

---

## Out of Scope

- Changing orchestrator logic (orchestrators remain unchanged, only template selection changes)
- Adding new agent types beyond current 7
- Modifying MCP server integrations
- Changing the Task tool interface
- Implementing parallel execution for sequential phases (only parallel checks stay parallel)

---

## Dependencies

| Dependency                 | Type     | Status   | Notes                                   |
| -------------------------- | -------- | -------- | --------------------------------------- |
| Task tool binding (Spec 9) | Internal | Complete | Ensures all agents use Task tool        |
| Sub-agent infrastructure   | Internal | Complete | Templates, profiles, protocols in place |
| 7-agent architecture       | Internal | Complete | Current agent structure must be stable  |

---

## Risks

| Risk                                   | Likelihood | Impact | Mitigation                                                          |
| -------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| Consolidated templates harder to debug | Medium     | Medium | Add mode parameter logging to each template                         |
| Dynamic sizing chooses wrong count     | Medium     | Medium | Start conservative (bias toward more agents), tune based on metrics |
| Breaking change to existing workflows  | Low        | High   | Maintain exact same orchestrator call pattern                       |
| Parameter passing errors               | Low        | Medium | Validate mode parameters before spawning                            |

---

## Open Questions

- [ ] Should task-decomposer effort estimates be trusted, or should we use heuristics (file count, task count)?
  - **Decision:** Use heuristics first (file count, task count, module spread), reference effort estimates as secondary signal.

- [ ] Should we log sub-agent count decisions for tuning?
  - **Decision:** Yes, log to `.claude/logs/orchestrator-decisions.json` for analysis.

- [ ] Should there be a minimum sub-agent count (always at least 2)?
  - **Decision:** No minimum. 1 sub-agent is valid for truly simple tasks (e.g., /ship commit, typo fixes).

- [ ] Should mode parameters be validated at orchestrator level or template level?
  - **Decision:** Template level. Templates validate their own mode parameter and error if invalid.

---
