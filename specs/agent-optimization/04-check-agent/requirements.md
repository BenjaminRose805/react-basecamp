# Requirements: Check Agent Parallelization

> **Status:** Draft
> **Created:** 2026-01-26
> **Spec ID:** agent-opt-04

## Overview

Parallelize the check-agent's quality verification by running independent checks (types, lint, tests, security) concurrently via sub-agents. This significantly reduces check duration from ~60s to ~20s while maintaining isolation.

---

## User Stories

### US1: Parallel Check Execution

**As a** developer running quality checks, **I want** independent checks to run in parallel, **so that** I get results faster.

#### Acceptance Criteria

- **REQ-1.1:** WHEN `/check` is invoked, THE SYSTEM SHALL run build first (blocking).

- **REQ-1.2:** AFTER build succeeds, THE SYSTEM SHALL spawn type-checker, lint-checker, test-runner, and security-scanner sub-agents in parallel.

- **REQ-1.3:** THE SYSTEM SHALL use `run_in_background: true` for parallel sub-agents.

- **REQ-1.4:** THE SYSTEM SHALL aggregate all results before reporting.

- **REQ-1.5:** THE SYSTEM SHALL report `PASS` only if ALL checks pass.

- **REQ-1.6:** IF any check fails, THE SYSTEM SHALL report `FAIL` with all failure details.

---

### US2: Type Checker Sub-Agent

**As a** check-agent orchestrator, **I want** a dedicated type-checker, **so that** type checking runs in isolation.

#### Acceptance Criteria

- **REQ-2.1:** THE type-checker SHALL run `pnpm typecheck` or equivalent.

- **REQ-2.2:** THE type-checker SHALL return typed errors with file paths and line numbers.

- **REQ-2.3:** THE type-checker SHOULD use model `haiku` (simple pass/fail).

---

### US3: Lint Checker Sub-Agent

**As a** check-agent orchestrator, **I want** a dedicated lint-checker, **so that** linting runs in isolation.

#### Acceptance Criteria

- **REQ-3.1:** THE lint-checker SHALL run `pnpm lint`.

- **REQ-3.2:** THE lint-checker SHALL return lint errors with severity and rule names.

- **REQ-3.3:** THE lint-checker SHOULD use model `haiku`.

---

### US4: Test Runner Sub-Agent

**As a** check-agent orchestrator, **I want** a dedicated test-runner, **so that** tests run in isolation.

#### Acceptance Criteria

- **REQ-4.1:** THE test-runner SHALL run `pnpm test:run`.

- **REQ-4.2:** THE test-runner SHALL return test results with pass/fail counts and coverage.

- **REQ-4.3:** THE test-runner SHALL identify specific failing tests with error messages.

- **REQ-4.4:** THE test-runner SHOULD use model `haiku`.

---

### US5: Security Scanner Sub-Agent

**As a** check-agent orchestrator, **I want** a dedicated security-scanner, **so that** security checks run in isolation.

#### Acceptance Criteria

- **REQ-5.1:** THE security-scanner SHALL check for console.log statements.

- **REQ-5.2:** THE security-scanner SHALL check for hardcoded secrets patterns.

- **REQ-5.3:** THE security-scanner SHALL check for TODO/FIXME in production code.

- **REQ-5.4:** THE security-scanner MAY check dependency vulnerabilities.

- **REQ-5.5:** THE security-scanner SHOULD use model `haiku`.

---

### US6: Scoped Checks

**As a** developer, **I want** to run specific checks only, **so that** I can focus on particular quality aspects.

#### Acceptance Criteria

- **REQ-6.1:** `/check build` SHALL run build check only.

- **REQ-6.2:** `/check types` SHALL run type checking only.

- **REQ-6.3:** `/check lint` SHALL run linting only.

- **REQ-6.4:** `/check tests` SHALL run tests only.

- **REQ-6.5:** `/check security` SHALL run security scan only.

- **REQ-6.6:** `/check` (no args) SHALL run all checks with parallelization.

---

## Non-Functional Requirements

### NFR-1: Performance

WHEN running all checks in parallel, THE SYSTEM SHALL complete in at most 1.5x the duration of the slowest individual check (vs 4x+ sequential).

### NFR-2: Cost Optimization

ALL check sub-agents SHALL use model `haiku` to minimize cost.

### NFR-3: Clear Reporting

THE SYSTEM SHALL provide a unified report showing status of all checks, not fragmented sub-agent outputs.

---

## Out of Scope

- New check types beyond current (build, types, lint, tests, security)
- Integration with external CI systems
- Caching of check results

---

## Dependencies

| Dependency        | Type     | Status         |
| ----------------- | -------- | -------------- |
| 01-infrastructure | Internal | Required first |
| qa-checks skill   | Internal | Ready          |
| pnpm scripts      | Internal | Ready          |

---
