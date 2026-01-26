---
name: research
description: Find existing implementations, check for conflicts, and gather context before any writing task.
---

# Research Skill

Find existing implementations, check for conflicts, and gather context before any writing.

## When Used

| Agent       | Phase    |
| ----------- | -------- |
| plan-agent  | ANALYZE  |
| code-agent  | RESEARCH |
| ui-agent    | RESEARCH |
| docs-agent  | RESEARCH |
| eval-agent  | RESEARCH |
| debug-agent | GATHER   |

## Steps

### 1. Search for Existing Implementations

Use Glob and Grep tools to find related files:

```bash
# Find files with similar names
glob "**/*<feature>*"

# Search for related patterns
grep "<pattern>" --type ts
```

**Check:**

- Does similar code/component already exist?
- Can we extend/modify instead of create new?

### 2. Check for Conflicts

**Naming conflicts:**

```bash
# Check for duplicate names
grep "export.*<name>" --type ts
```

**Functionality overlap:**

- Will this duplicate existing functionality?
- Are there similar utilities/hooks/components?

### 3. Identify Patterns

Find similar implementations to follow:

```bash
# Find similar patterns in codebase
grep "export function" src/lib/ --type ts
grep "export const.*Router" src/server/ --type ts
```

**Note:**

- Coding conventions used
- Error handling patterns
- Testing approaches

### 4. Gather Context

**Read related specs:**

```bash
# Check for existing specs
ls .spec-workflow/specs/<feature>/
```

**Understand dependencies:**

- What does this feature depend on?
- What will depend on this feature?

**Note integration points:**

- API endpoints to connect to
- Components to compose with
- Hooks to use

## Error Handling

| Error                         | How to Handle                 |
| ----------------------------- | ----------------------------- |
| Existing implementation found | Report STOP with details      |
| Conflict detected             | Report CLARIFY with questions |
| Pattern unclear               | Report CLARIFY for guidance   |
| Multiple valid approaches     | Report CLARIFY with options   |

## Output

Return one of three decisions:

### PROCEED

Research complete, ready to implement:

```markdown
## Research Complete: PROCEED

### Findings

- No existing implementation found
- No naming conflicts
- Pattern to follow: `src/lib/existing-example.ts`

### Key Files

- `src/lib/related.ts` - Reference for pattern
- `src/types/feature.ts` - Types to use

### Recommendations

- Follow pattern from `existing-example.ts`
- Use `useQuery` hook for data fetching
- Add tests in co-located `.test.ts` file
```

### STOP

Implementation should not proceed:

```markdown
## Research Complete: STOP

### Reason

Existing implementation found at `src/lib/feature.ts`

### Recommendation

Extend existing implementation instead of creating new.
```

### CLARIFY

Need more information to proceed:

```markdown
## Research Complete: CLARIFY

### Questions

1. Should we extend existing `src/lib/feature.ts` or create new?
2. Which pattern should we follow for error handling?

### Options

**Option A:** Extend existing (less code, may affect existing usage)
**Option B:** Create new (isolated, but duplication)
```
