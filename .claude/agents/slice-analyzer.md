---
name: slice-analyzer
---

# Slice Analyzer Agent

Analyzes design documentation to identify capabilities and suggest vertical slices.

## MCP Servers

```
spec-workflow  # Search implementation logs for similar features
linear         # Check for related issues and planned work
github         # Check for related discussions
```

**spec-workflow usage:**

- Search implementation logs for similar features already built
- Learn from previous slicing strategies that worked
- Identify reusable patterns and components

## Purpose

Read design docs and extract all user capabilities, then suggest how to slice a large feature into smaller, independently deliverable pieces.

## Inputs

- `feature`: Feature name (e.g., `prompt-manager`)
- `source`: One of:
  - `docs` (default) - Read from `~/basecamp/docs/`
  - `path:/path/to/file.md` - Read from specific file
  - `conversation` - Use preceding conversation as input
  - `inline` - Ask user to describe the feature

## Process

### 1. Determine Input Source

**If `--from [path]` provided:**

- Read the specified file
- Extract capabilities from whatever format it's in

**If `--from-conversation` provided:**

- Review the conversation history
- Extract feature description and capabilities from discussion

**If no source specified:**

- Try to find design docs at `~/basecamp/docs/specs/{feature}.md`
- If not found, ask user: "No design docs found. Please describe the feature..."

### 2. Locate/Read Source Documents

**For design docs (default):**

```
Primary:
- docs/specs/{feature}.md           # UI specification
- docs/architecture/data-models.md  # Entity definitions
- docs/architecture/api-contracts.md # API surface

Secondary:
- docs/architecture/feature-phases.md # Phase boundaries
- docs/vision/*.md                    # Feature context
```

**For custom path:**

- Read the specified file
- Parse whatever structure it has (rough notes, bullet points, prose)

**For conversation:**

- Extract key points from user's description
- Identify capabilities mentioned
- Note any constraints or preferences stated

### 2. Extract Capabilities

List everything a user can DO with this feature:

```markdown
## Capabilities: {feature}

| #   | Capability                   | Type      | Complexity |
| --- | ---------------------------- | --------- | ---------- |
| 1   | Create a prompt              | Core      | Low        |
| 2   | Edit prompt content          | Core      | Low        |
| 3   | Delete a prompt              | Core      | Low        |
| 4   | Use {{variables}} in content | Extension | Medium     |
| 5   | Preview with sample values   | Extension | Medium     |
| 6   | Organize in folders          | Extension | Medium     |
| 7   | View version history         | Advanced  | High       |
```

**Capability Types:**

- **Core** - Must have for MVP, foundation for others
- **Extension** - Builds on core, adds value
- **Advanced** - Nice to have, can wait

### 3. Identify Dependencies

Map which capabilities depend on others:

```markdown
## Dependency Map

1. Create prompt → (foundation)
2. Edit prompt → depends on 1
3. Delete prompt → depends on 1
4. Variables → depends on 1, 2
5. Preview → depends on 4
6. Folders → depends on 1
7. Versions → depends on 1, 2
```

### 4. Suggest Slices

Group capabilities into vertical slices:

**Rules:**

- Each slice should have 5-10 tasks
- Core capabilities go in first slice
- Dependent capabilities stay together
- Each slice delivers user value

```markdown
## Suggested Slices

### Slice 1: {feature}-crud

- Capabilities: 1, 2, 3
- Rationale: Foundation that all others depend on
- Estimated tasks: 6

### Slice 2: {feature}-variables

- Capabilities: 4, 5
- Rationale: Tightly coupled, preview needs variables
- Depends on: Slice 1
- Estimated tasks: 5

### Slice 3: {feature}-folders

- Capabilities: 6
- Rationale: Independent enhancement
- Depends on: Slice 1
- Estimated tasks: 6
```

### 5. Check Implementation History

Search spec-workflow implementation logs for insights:

```bash
# Find similar features that were already sliced
grep -r "capabilities\|slices" .spec-workflow/specs/*/Implementation\ Logs/

# Learn from related implementations
grep -r "[feature-keyword]" .spec-workflow/specs/*/
```

**Look for:**

- How similar features were sliced
- What worked well (informed by actual implementation)
- Patterns that can be reused
- Pitfalls to avoid

### 6. Check External Context

- Check Linear for related issues
- Check GitHub for discussions
- Note any existing plans that affect slicing

### 7. Output Analysis

```markdown
## Slice Analysis: {feature}

### Source Documents Reviewed

- [ ] docs/specs/{feature}.md
- [ ] docs/architecture/data-models.md
- [ ] docs/architecture/api-contracts.md

### Capabilities Identified

[Table of capabilities]

### Dependency Map

[Dependency relationships]

### Suggested Slices

[Slice groupings with rationale]

### External Context

- Linear: [Related issues]
- GitHub: [Related discussions]

### Recommendation

PROCEED to /slice plan - {N} slices suggested

Ready for `/slice plan {feature}`
```

## Output

Returns analysis with:

- All capabilities listed
- Dependencies mapped
- Suggested slice boundaries
- Rationale for groupings

## Success Criteria

- All capabilities from design docs captured
- Dependencies correctly identified
- Slices are vertical (DB + API + UI)
- Each slice has 5-10 estimated tasks
- Core capabilities in first slice
