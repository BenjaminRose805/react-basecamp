# Sub-Agent Library

Utilities for sub-agent orchestration and context management.

## Overview

This directory contains shared utilities used by orchestrators when spawning sub-agents via the Task tool.

## Files

- `inject-rules.cjs` - Rule injection utility for targeted context loading

## Rule Injection

### Purpose

The `inject-rules.cjs` utility provides **targeted rule injection** based on sub-agent role, reducing context overhead while maintaining quality standards.

**Problem:** Loading all 9 rule files (~52KB) into every sub-agent wastes context budget.

**Solution:** Each role gets only the rules relevant to its responsibilities.

### Usage

Orchestrators should use this utility when constructing Task prompts:

```javascript
const {
  injectRulesForRole,
} = require("./.claude/sub-agents/lib/inject-rules.cjs");

// When spawning a code-writer sub-agent
const rules = injectRulesForRole("code-writer");

await Task({
  subagent_type: "general-purpose",
  description: "Implement authentication logic",
  prompt: `
${rules}

## TASK
Implement user authentication following TDD workflow.

## CONTEXT
${contextSummary}
  `,
  model: "sonnet",
});
```

### Role-to-Rules Mapping

| Role                | Injected Rules               | Why                                   |
| ------------------- | ---------------------------- | ------------------------------------- |
| `code-researcher`   | patterns.md, coding-style.md | Needs to identify code patterns       |
| `code-writer`       | patterns.md, coding-style.md | Implements backend code               |
| `ui-researcher`     | patterns.md, coding-style.md | Needs to identify UI patterns         |
| `ui-builder`        | patterns.md, coding-style.md | Implements frontend code              |
| `plan-researcher`   | methodology.md               | Understands SDD/TDD/EDD               |
| `plan-writer`       | methodology.md               | Writes specs following methodology    |
| `quality-validator` | testing.md                   | Validates test coverage and quality   |
| `quality-checker`   | testing.md                   | Runs test suites and checks           |
| `git-executor`      | git-workflow.md              | Executes git operations               |
| `security-scanner`  | security.md                  | Scans for vulnerabilities             |
| `pr-reviewer`       | git-workflow.md, security.md | Reviews PRs for both git and security |

### Output Format

The utility returns rules wrapped in XML for clarity:

```xml
<injected-rules role="code-writer">
# Patterns
[content of patterns.md]

---

# Coding Style
[content of coding-style.md]
</injected-rules>
```

### Token Savings

| Scenario          | Before (all rules) | After (targeted) | Savings |
| ----------------- | ------------------ | ---------------- | ------- |
| code-writer       | ~13,000 tokens     | ~4,500 tokens    | 65%     |
| quality-validator | ~13,000 tokens     | ~2,800 tokens    | 78%     |
| git-executor      | ~13,000 tokens     | ~1,800 tokens    | 86%     |

### Error Handling

- **Unknown role:** Returns empty string with warning to stderr
- **Missing rule file:** Logs warning, continues with remaining files
- **Not in git repo:** Throws error (cannot locate rules directory)

### Logging

The utility logs to stderr (visible to orchestrator):

```
[inject-rules] Injected 2 rule file(s) for role "code-writer" (~4500 tokens)
```

## Template Modification (Future)

**Note:** Phase 1 only creates the utility and documents usage. Phase 2 will update the actual template files to use `injectRulesForRole()`.

### How Templates Will Use This

Templates with `mode` parameter will be updated to:

1. Accept `role` in prompt metadata
2. Call `injectRulesForRole(role)` dynamically
3. Remove hardcoded rule references

Example (future state):

```javascript
// In domain-writer.md (future Phase 2)
const {
  injectRulesForRole,
} = require("./.claude/sub-agents/lib/inject-rules.cjs");

// Extract role from prompt
const role = extractRoleFromPrompt(prompt); // e.g., "code-writer"

// Inject targeted rules
const rules = injectRulesForRole(role);
```

## Best Practices

### For Orchestrators

1. **Always pass role explicitly** in Task prompt metadata
2. **Include rules at the top** of the prompt for visibility
3. **Log token counts** to track context budget usage
4. **Validate role names** against ROLE_RULE_MAP before spawning

### For Template Authors

1. **Use role parameter** consistently across all mode-based templates
2. **Document expected roles** in template frontmatter
3. **Test with multiple roles** to ensure rule injection works
4. **Keep role names stable** to avoid breaking orchestrators

## Future Enhancements

Potential improvements for future phases:

- **Rule caching:** Cache loaded rules to avoid repeated file reads
- **Custom rule sets:** Allow orchestrators to pass additional rules
- **Rule validation:** Verify rule content structure before injection
- **Metrics tracking:** Log actual token usage vs. estimates
