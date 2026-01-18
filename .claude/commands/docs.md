# /docs - Documentation Writing

Generate and maintain project documentation.

## Usage

```
/docs [topic]           # Full flow: research → write → qa
/docs research [topic]  # Research only: find existing docs
/docs write [topic]     # Write only: create docs (after research)
/docs qa [topic]        # QA only: validate docs
```

## Examples

```
# Full flow (recommended)
/docs useAuth hook
/docs API authentication endpoints
/docs update README for new feature

# Individual phases
/docs research Button component    # Check existing docs
/docs write Button component       # Write after research
/docs qa Button component          # Validate after writing
```

## Workflow

Running `/docs [topic]` executes all three phases in sequence:

### Phase 1: Research (docs-researcher)

- Find existing documentation
- Analyze doc structure and style
- Identify coverage gaps
- **Outputs: PROCEED, STOP, or CLARIFY**

### Phase 2: Write (docs-writer)

- Read the source code
- Follow project doc standards
- Include runnable examples
- **Outputs: Doc files created, ready for QA**

### Phase 3: QA (docs-qa)

- Test code examples
- Verify API signatures
- Check links and cross-references
- **Outputs: PASS or FAIL**

## Agents

| Phase    | Agent           | Instructions                        |
| -------- | --------------- | ----------------------------------- |
| research | docs-researcher | `.claude/agents/docs-researcher.md` |
| write    | docs-writer     | `.claude/agents/docs-writer.md`     |
| qa       | docs-qa         | `.claude/agents/docs-qa.md`         |

## MCP Servers

```
cclsp          # TypeScript LSP for code intelligence
```

## Documentation Types

- **README.md** - Project overview, quick start
- **API docs** - Endpoints, request/response
- **Component docs** - Props, usage examples
- **Architecture docs** - System overview, decisions

## When to Update Docs

- New feature added → Update README, add feature docs
- API changed → Update API docs
- Bug fixed → Update troubleshooting if relevant
- Architecture changed → Update architecture docs, create ADR

$ARGUMENTS
