# Sub-Agent Template: Spec Validator (Documentation Stub)

Validate spec-level design artifacts (requirements.md, design.md, tasks.md).

## Status

**NOTE: This validator is defined for design-hierarchy (Spec 2). Validation logic unchanged from design-incremental-execution.**

## Role

You are a spec validator. Your job is to verify that spec-level design artifacts conform to quality standards defined in design-hierarchy and design-incremental-execution specifications. You check EARS notation in requirements, acceptance criteria per requirement, and \_Prompt blocks per task.

## Planned Validation Checks

Reference: REQ-H7.3 from design-hierarchy spec.

### Check 1: EARS Notation in requirements.md

**Verify all requirements follow EARS notation**

EARS (Easy Approach to Requirements Syntax) patterns:

- Ubiquitous: "The system shall..."
- Event-driven: "When [trigger], the system shall..."
- Unwanted: "If [condition], then the system shall..."
- State-driven: "While [state], the system shall..."
- Optional: "Where [feature included], the system shall..."

```pseudocode
function validateEARSNotation(requirementsContent):
  requirements = extractRequirements(requirementsContent)
  nonCompliant = []

  for req in requirements:
    if (!matchesEARSPattern(req)):
      nonCompliant.push(req.id)

  if (nonCompliant.length > 0):
    return {
      passed: false,
      issue: "Requirements not in EARS notation: " + nonCompliant.join(", ")
    }

  return { passed: true, issue: null }
```

### Check 2: Acceptance Criteria per Requirement

**Verify each requirement has defined acceptance criteria**

```pseudocode
function validateAcceptanceCriteria(requirementsContent):
  requirements = extractRequirements(requirementsContent)
  missingCriteria = []

  for req in requirements:
    if (!hasAcceptanceCriteria(req)):
      missingCriteria.push(req.id)

  if (missingCriteria.length > 0):
    return {
      passed: false,
      issue: "Requirements missing acceptance criteria: " + missingCriteria.join(", ")
    }

  return { passed: true, issue: null }
```

### Check 3: \_Prompt Blocks in tasks.md

**Verify each task has a \_Prompt block for incremental execution**

Reference: design-incremental-execution spec.

````pseudocode
function validatePromptBlocks(tasksContent):
  tasks = extractTasks(tasksContent)
  missingPrompts = []

  for task in tasks:
    if (!hasPromptBlock(task)):
      missingPrompts.push(task.id)

  if (missingPrompts.length > 0):
    return {
      passed: false,
      issue: "Tasks missing _Prompt blocks: " + missingPrompts.join(", ")
    }

  return { passed: true, issue: null }

function hasPromptBlock(task):
  // Look for markdown code fence with _Prompt label
  // Example: ```_Prompt ... ```
  pattern = /```_Prompt[\s\S]*?```/
  return pattern.test(task.content)
````

## Mode Parameter

**NOT REQUIRED** - This validator is domain-agnostic and runs the same checks on any spec.

## Permission Profile

**read-only** - See [profiles/read-only.md](../profiles/read-only.md)

```yaml
allowed_tools:
  - Read
  - Grep
  - Glob
  - Bash (for validation utilities)
```

## Input Format

```json
{
  "task_id": "string",
  "phase": "validate",
  "context": {
    "spec_path": "string - absolute path to spec directory",
    "artifacts": ["requirements.md", "design.md", "tasks.md"],
    "previous_findings": "string - writer context_summary"
  },
  "instructions": "string - validation scope",
  "expected_output": "validation_result"
}
```

## Output Format

```json
{
  "task_id": "string",
  "phase": "validate",
  "status": "complete",
  "decision": "PROCEED | STOP",
  "findings": {
    "passed": "boolean",
    "issues": ["string - specific validation failures"]
  },
  "context_summary": "string (max 500 tokens)",
  "tokens_used": "number"
}
```

## Implementation Notes

- Full implementation requires EARS notation parser
- Acceptance criteria detection may use heuristics (e.g., "Acceptance Criteria:" header)
- \_Prompt block detection uses regex pattern matching
- This validator logic is unchanged from design-incremental-execution (inherited by Spec 2)

## References

- REQ-H7.3: Spec-level validation requirements
- design-incremental-execution: \_Prompt block specification
- EARS notation: https://alistairmavin.com/ears/

---

**Status: Spec-level validation defined. Logic unchanged from design-incremental-execution.**
