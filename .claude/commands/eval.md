# /eval - LLM Evaluations

Create evaluation suites for LLM features.

## Usage

```
/eval [feature]           # Full flow: research → create → validate
/eval research [feature]  # Identify LLM touchpoints
/eval create [feature]    # Create eval suite
/eval validate [feature]  # Run and verify evals
```

## Examples

```bash
/eval agent-builder         # Create evals for agent builder
/eval research tool-select  # Find LLM touchpoints
/eval create prompt-gen     # Create eval suite
/eval validate safety       # Run safety evals
```

## When to Use

Use EDD for features with:

- LLM/AI integration
- Non-deterministic outputs
- Agent behaviors
- Prompt engineering

Skip for:

- CRUD operations
- Deterministic logic
- Standard UI

## Agent

Routes to: `eval-agent`

## Phases

### research

- Identify LLM touchpoints
- Determine evaluation dimensions
- Suggest test cases
- Recommend grading strategy

### create

- Create eval structure in `evals/{feature}/`
- Write config.ts with dimensions
- Write test cases
- Implement graders

### validate

- Run dry run with mocks
- Optionally run smoke test
- Verify coverage
- Report: PASS or FAIL

## Eval Structure

```
evals/{feature}/
├── config.ts       # Dimensions, thresholds
├── cases/          # Test cases
├── graders/        # Evaluation logic
└── index.ts        # Export
```

## Running Evals

```bash
pnpm eval {feature}           # Full suite
pnpm eval {feature} --smoke   # Quick check
pnpm eval {feature} --case X  # Single case
```

## Metrics

| Metric | Description    | Target |
| ------ | -------------- | ------ |
| pass@1 | First attempt  | > 80%  |
| pass@3 | Within 3 tries | > 95%  |

$ARGUMENTS
