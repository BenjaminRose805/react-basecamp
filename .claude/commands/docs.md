# /docs - Documentation

Write and maintain documentation.

## Usage

```
/docs [topic]           # Full flow: research → write → validate
/docs research [topic]  # Research only
/docs write [topic]     # Write only (after research)
/docs validate [topic]  # Validate only (after write)
```

## Examples

```bash
/docs api-reference       # Document APIs
/docs research prompts    # Find what to document
/docs write getting-started  # Write guide
/docs validate readme     # Verify docs
```

## Agent

Routes to: `docs-agent`

## Phases

### research

- Find existing documentation
- Identify what needs documenting
- Gather code context
- Verify API accuracy

### write

- Follow documentation templates
- Write clear, actionable docs
- Include code examples
- Add cross-references

### validate

- Verify code examples work
- Check links are valid
- Ensure accuracy
- Report: PASS or FAIL

## Documentation Types

### API Reference

````markdown
## Create Prompt

**Endpoint:** `POST /api/trpc/prompt.create`

**Request:**

```json
{ "name": "My Prompt", "content": "..." }
```
````

````

### Guides

```markdown
# Getting Started

1. Install dependencies
2. Configure environment
3. Run development server
````

## MCP Servers Used

```
cclsp     # Read code
context7  # Verify APIs
spec-workflow # Track tasks
```

## After /docs

Review documentation at the target location.

$ARGUMENTS
