# Review System Integration - Requirements

## Overview

This specification addresses critical integration gaps in the 4-loop review system to ensure proper delegation patterns, preview/confirmation flows, and ship gate enforcement.

## Functional Requirements

### REQ-001: Preview and Confirmation for /review Command

**Requirement:**
When user runs /review, the system shall show a preview of the planned review execution and wait for explicit confirmation before proceeding.

**Rationale:**
The code-review/SKILL.md documents a MANDATORY preview/confirmation pattern, but the current hook bypasses this entirely, violating the documented contract.

**Acceptance Criteria:**

- AC-001.1: System displays which loops will execute (1-4)
- AC-001.2: System shows scope (files/patterns to review)
- AC-001.3: System shows resource requirements (sub-agent count, model tier)
- AC-001.4: System waits for user confirmation before proceeding
- AC-001.5: User can cancel before any execution begins

---

### REQ-002: Agent Delegation for Review Execution

**Requirement:**
When /review executes, the system shall delegate to sub-agents via Task tool, not execute code review loops directly using execSync.

**Rationale:**
CLAUDE.md core rule: "ALWAYS delegate work to agents. Never implement directly." Current implementation violates this by running all 4 loops synchronously in the hook.

**Acceptance Criteria:**

- AC-002.1: Hook uses logContext() to inject review context only
- AC-002.2: Command file handles preview/confirmation logic
- AC-002.3: Command spawns sub-agents using Task tool for each loop
- AC-002.4: No execSync calls to code-review scripts in hook
- AC-002.5: Follows user-prompt-start.cjs pattern (context injection only)

---

### REQ-003: Ship Gate Enforcement

**Requirement:**
When user runs /ship, the system shall check loop-state.json for ship_allowed flag before proceeding with git operations.

**Rationale:**
code-review/SKILL.md documents pre-ship-check.cjs hook, but it doesn't exist. Without this gate, users can ship code that hasn't passed all review loops.

**Acceptance Criteria:**

- AC-003.1: Ship hook reads loop-state.json before git operations
- AC-003.2: Hook verifies ship_allowed === true
- AC-003.3: Hook runs before /ship command execution
- AC-003.4: Hook is registered in .claude/settings.json
- AC-003.5: Hook provides clear error message if gate check fails

---

### REQ-004: Ship Blocker Reporting

**Requirement:**
When loop-state.json shows ship_allowed=false, the system shall block /ship and display blocker details from the state file.

**Rationale:**
Users need to know why shipping is blocked and what issues need resolution before proceeding.

**Acceptance Criteria:**

- AC-004.1: System displays "Ship gate: BLOCKED" message
- AC-004.2: System shows which loop failed (loop_1_passed, loop_2_passed, etc.)
- AC-004.3: System displays blocker summary from state file
- AC-004.4: System suggests running /review to resolve issues
- AC-004.5: /ship command exits without executing git operations

---

### REQ-005: Stale State Detection

**Requirement:**
When loop-state.json head_commit differs from current HEAD, the system shall warn about stale review state and recommend re-running review.

**Rationale:**
Review results are only valid for the commit they were run against. New commits invalidate previous review state.

**Acceptance Criteria:**

- AC-005.1: Ship hook compares state.head_commit to git HEAD
- AC-005.2: System displays warning if commits don't match
- AC-005.3: Warning includes both commit hashes for comparison
- AC-005.4: System blocks ship when state is stale
- AC-005.5: User is prompted to run /review on current HEAD

---

### REQ-006: Context Injection Pattern Compliance

**Requirement:**
The review hook shall inject context summary only, following the established user-prompt-start.cjs pattern.

**Rationale:**
Hooks should detect commands and provide context, not execute business logic. This maintains separation of concerns and enables preview/confirmation flows.

**Acceptance Criteria:**

- AC-006.1: Hook uses logContext() to inject review metadata
- AC-006.2: Hook does not spawn sub-agents directly
- AC-006.3: Hook does not execute review scripts
- AC-006.4: Context includes: command detected, scope, available options
- AC-006.5: Hook structure mirrors user-prompt-start.cjs pattern

---

## Non-Functional Requirements

### NFR-001: Performance

- Ship gate check shall complete in <100ms
- State file read operations shall not block user input
- Hook execution overhead shall be <50ms

### NFR-002: Reliability

- Missing loop-state.json shall be treated as ship_allowed=false
- Corrupted state file shall block ship with clear error
- Hook failures shall not prevent command help display

### NFR-003: Maintainability

- State file schema shall be documented in code-review/SKILL.md
- Hook registration shall be centralized in settings.json
- Error messages shall reference relevant documentation

---

## Constraints

1. Must maintain backward compatibility with existing /review invocations
2. Must not break existing /ship workflows for non-reviewed code
3. State file location: `.claude/skills/code-review/loop-state.json`
4. Hook location: `.claude/scripts/hooks/`
5. Must follow existing hook patterns (detect → gather → logContext)

---

## Dependencies

- Existing: code-review/SKILL.md (documents 4-loop system)
- Existing: user-prompt-start.cjs (pattern reference)
- Existing: loop-state.json (state file format)
- New: user-prompt-ship.cjs (to be created)
- Modified: user-prompt-review.cjs (to be refactored)

---

## Success Metrics

1. Zero direct script executions in hooks (measured by code audit)
2. 100% of /ship commands check review state (measured by hook registration)
3. Preview/confirmation flow executed for all /review commands
4. Ship gate blocks all attempts when ship_allowed=false
5. No false positives (valid ships blocked incorrectly)
