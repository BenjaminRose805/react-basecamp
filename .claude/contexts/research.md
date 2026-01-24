# Research Context

**Mode:** Exploration and investigation
**Focus:** Understand before acting

## Behavior

- Read extensively before suggesting
- Ask clarifying questions
- Document findings
- Don't modify code without explicit approval
- Present options, not just answers
- Be thorough but efficient

## Priorities

1. **Understanding** - Fully grasp the problem/codebase
2. **Documentation** - Capture what you learn
3. **Options Analysis** - Identify multiple approaches
4. **Recommendations** - Suggest best path forward

## Agent Usage

| Task             | Command                       |
| ---------------- | ----------------------------- |
| Explore codebase | `/code research [area]`       |
| Find design docs | `/distill research [feature]` |
| Understand tests | `/test research [feature]`    |

## Research Process

### 1. Define Scope

- What question are we answering?
- What's the boundary of research?
- What's the time budget?

### 2. Gather Information

- Read relevant code files
- Check existing tests
- Review design docs (~/basecamp/docs/)
- Search for patterns

### 3. Analyze Findings

- What patterns exist?
- What are the constraints?
- What are the options?
- What are the trade-offs?

### 4. Document & Present

- Summarize findings
- List options with pros/cons
- Make recommendation
- Ask clarifying questions

## Tools to Favor

- **Read** - Deep file analysis
- **Glob** - Find relevant files
- **Grep** - Search patterns
- **WebSearch** - External information
- **WebFetch** - Documentation
- **Task (Explore agent)** - Codebase exploration

## Output Format

```markdown
## Research: [Topic]

### Question

[What we're trying to understand]

### Findings

#### Current State

- [What exists now]
- [Relevant files: path/to/file.ts]

#### Patterns Found

- [Pattern 1]
- [Pattern 2]

#### Constraints

- [Constraint 1]
- [Constraint 2]

### Options

#### Option A: [Name]

- **Pros:** [List]
- **Cons:** [List]
- **Effort:** [Low/Medium/High]

#### Option B: [Name]

- **Pros:** [List]
- **Cons:** [List]
- **Effort:** [Low/Medium/High]

### Recommendation

[Which option and why]

### Open Questions

- [Question needing user input]
- [Question needing user input]
```

## Design Doc Locations

For AI Platform features, check:

```
~/basecamp/docs/
├── specs/              # Feature specifications
├── architecture/       # System design
│   ├── data-models.md
│   ├── api-contracts.md
│   └── tech-stack.md
└── vision/             # Platform overview
```

## When to Switch Contexts

Switch to `/context dev` when:

- Research complete
- Ready to implement
- User approves approach

Switch to `/context review` when:

- Need to analyze existing implementation
- Reviewing someone else's code
