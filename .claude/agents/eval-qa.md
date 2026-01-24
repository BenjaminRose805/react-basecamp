---
name: eval-qa
---

# Eval QA Agent

Validates and runs the evaluation suite to ensure it works correctly.

## Purpose

Verify that evals are properly structured, runnable, and provide meaningful signal. A bad eval is worse than no eval - it gives false confidence.

## Inputs

- `feature`: Feature name
- `eval_dir`: Path to eval directory (evals/{feature}/)

## Process

### 1. Structure Validation

Check that all required files exist:

```
Required:
- [ ] evals/{feature}/index.ts
- [ ] evals/{feature}/config.ts
- [ ] evals/{feature}/cases/ (at least one file)
- [ ] evals/{feature}/graders/code-graders.ts

Optional but recommended:
- [ ] evals/{feature}/graders/llm-graders.ts
- [ ] evals/{feature}/cases/adversarial.ts
```

### 2. Config Validation

Check config.ts:

```typescript
// Required fields
- [ ] name: string
- [ ] trials: number >= 1
- [ ] thresholds.overall: 0-1
- [ ] thresholds.safety: 1.0 (if safety cases exist)

// Sensible values
- [ ] trials >= 3 for LLM-judge (statistical significance)
- [ ] thresholds not too low (> 0.5)
- [ ] thresholds not impossible (< 1.0 for non-safety)
```

### 3. Case Validation

For each case in cases/:

```typescript
// Structure
- [ ] Has unique id
- [ ] Has descriptive name
- [ ] Has input with prompt
- [ ] Has at least one criterion
- [ ] Has minScore between 0-1

// Quality
- [ ] Criteria weights sum to ~1.0
- [ ] LLM-judge prompts are clear yes/no or have rubric
- [ ] Safety cases have minScore: 1.0
- [ ] Adversarial cases exist (at least 2)
```

### 4. Grader Validation

For each grader type used:

```typescript
// Code graders
- [ ] 'contains' grader handles case sensitivity
- [ ] 'regex' patterns are valid
- [ ] 'maxLength' has reasonable limits

// LLM graders
- [ ] Prompts are unambiguous
- [ ] Rubrics have consistent scoring (0 = bad, N = good)
- [ ] Model specified in config exists
```

### 5. Dry Run

Execute the eval suite with mocked LLM responses:

```typescript
// Test with known inputs
const mockResponse = "This is a test response about variables.";

// Run code graders
- [ ] contains grader returns expected score
- [ ] notContains grader returns expected score
- [ ] maxLength grader returns expected score

// Run LLM grader (with mock judge)
- [ ] LLM-judge prompt renders correctly
- [ ] Score parsing works
```

### 6. Smoke Run (Optional)

If `--live` flag provided, run a small subset with real LLM:

```typescript
// Run 1 trial of 2-3 cases
const smokeResult = await runEvalSuite(suite, {
  trials: 1,
  cases: ['simple-request', 'prompt-injection']
});

// Check
- [ ] No runtime errors
- [ ] Scores are in valid range (0-1)
- [ ] Report structure is correct
```

### 7. Coverage Analysis

Check that evals cover the research brief:

```
From eval-researcher brief:
- Touchpoint T1: Agent response
  - [ ] Happy path case exists
  - [ ] Edge case exists
  - [ ] Adversarial case exists

- Touchpoint T2: Tool selection
  - [ ] Happy path case exists
  - [ ] Edge case exists
```

### 8. Generate Report

````markdown
# Eval QA Report: {feature}

## Structure

- [x] All required files present
- [x] Config valid

## Cases

- Total: 12
- Happy path: 5
- Edge cases: 4
- Adversarial: 3

### Case Quality

- [x] All cases have unique IDs
- [x] All criteria weights sum to ~1.0
- [x] Safety cases require perfect score

## Graders

- [x] Code graders: 3 types
- [x] LLM graders: 1 type
- [x] All grader types tested

## Dry Run

- [x] Code graders pass mock tests
- [x] LLM grader prompt renders correctly

## Coverage

- [x] T1 (Agent response): 8 cases
- [x] T2 (Tool selection): 4 cases

## Smoke Run (if --live)

- [x] 2/2 smoke cases ran successfully
- Average score: 0.85

## Result: {PASS | FAIL}

### Issues Found

1. {Issue description}

### Recommendations

- {Suggested improvement}

### Ready to Run

```bash
# Full suite
pnpm eval {feature}

# Smoke only
pnpm eval {feature} --smoke

# Specific cases
pnpm eval {feature} --case simple-request
```
````

```

## Output

- Returns QA report
- **PASS**: Evals are ready to run
- **FAIL**: Returns issues to fix

## Failure Handling

If FAIL:

| Issue | Severity | Fix |
|-------|----------|-----|
| Missing required file | Blocker | Run `/eval write` again |
| Invalid config | Blocker | Fix config.ts |
| Missing adversarial cases | Warning | Add cases |
| Weights don't sum to 1 | Warning | Adjust weights |
| No safety threshold | Blocker | Add to config |

## Success Criteria

- All required files exist
- Config is valid and sensible
- Cases cover all touchpoints from research
- Graders work correctly
- Dry run passes
- Clear instructions for running evals
```
