# /eval - Evaluation-Driven Development

Create evaluation suites for LLM features where traditional tests don't work.

## Usage

```
/eval [feature]           # Full flow: research → write → qa
/eval research [feature]  # Research only: identify LLM touchpoints
/eval write [feature]     # Write only: create eval suite
/eval qa [feature]        # QA only: validate and dry run
```

## Examples

```
# Full flow (recommended)
/eval agent-builder
/eval execution-engine
/eval prompt-manager

# Individual phases
/eval research agent-builder  # Identify LLM touchpoints
/eval write agent-builder     # Create eval suite
/eval qa agent-builder        # Validate and dry run
```

## When to Use

Use `/eval` for features with:

- LLM/AI integration
- Non-deterministic outputs
- Agent responses
- Tool selection logic
- Prompt engineering
- Guardrails and safety checks

Skip `/eval` for:

- CRUD features (prompt-manager UI)
- Deterministic logic (workflow-designer)
- Standard UI components
- Database operations

## Workflow

Running `/eval [feature]` executes all three phases:

### Phase 1: Research (eval-researcher)

- Identify LLM touchpoints in the feature
- Determine evaluation dimensions
- Suggest test cases (happy, edge, adversarial)
- Recommend grading strategy (code vs LLM-judge)

**Outputs:** Research brief with eval recommendations

### Phase 2: Write (eval-writer)

Creates evaluation suite structure:

```
evals/
└── {feature}/
    ├── config.ts      # Dimensions, thresholds
    ├── cases/         # Test cases
    │   ├── happy.ts
    │   ├── edge.ts
    │   └── adversarial.ts
    ├── graders/       # Evaluation logic
    │   ├── accuracy.ts
    │   ├── safety.ts
    │   └── format.ts
    └── index.ts       # Export
```

**Outputs:** Complete eval suite

### Phase 3: QA (eval-qa)

- Validate structure and completeness
- Dry run with mock responses
- Optionally smoke run with real LLM
- Report coverage and quality

**Outputs:** PASS or FAIL with coverage report

## Agents

| Phase    | Agent           | Instructions                        |
| -------- | --------------- | ----------------------------------- |
| research | eval-researcher | `.claude/agents/eval-researcher.md` |
| write    | eval-writer     | `.claude/agents/eval-writer.md`     |
| qa       | eval-qa         | `.claude/agents/eval-qa.md`         |

## Running Evaluations

After creating evals:

```bash
pnpm eval [feature]                     # Full suite
pnpm eval [feature] --smoke             # Quick check (1 trial)
pnpm eval [feature] --case simple       # Single case
pnpm eval [feature] --verbose           # Detailed output
```

## Key Metrics

| Metric  | Description              | Target          |
| ------- | ------------------------ | --------------- |
| pass@1  | Passes on first attempt  | > 80%           |
| pass@3  | Passes within 3 attempts | > 95%           |
| pass^3  | All 3 trials succeed     | > 70%           |
| Latency | Response time            | < 5s for simple |

## Eval Case Structure

```typescript
// evals/{feature}/cases/happy.ts
export const happyPathCases: EvalCase[] = [
  {
    name: "simple-request",
    input: { prompt: "Create a greeting agent" },
    expected: {
      hasAgentConfig: true,
      hasSystemPrompt: true,
      noHarmfulContent: true,
    },
  },
];
```

## After Completion

After `/eval [feature]` (or `/eval qa`):

1. Run evals: `pnpm eval [feature] --smoke`
2. Run `/code [feature]` to implement
3. Iterate until evals pass consistently
4. Continue to `/security` and `/review`

$ARGUMENTS
