/**
 * Evaluation Framework Types
 *
 * Used for Evaluation-Driven Development (EDD) of LLM features.
 * Evals measure quality of non-deterministic outputs through
 * multiple trials, statistical scoring, and LLM-as-judge patterns.
 */

/**
 * Configuration for an evaluation suite
 */
export interface EvalConfig {
  /** Unique name for this eval suite */
  name: string;

  /** Human-readable description */
  description: string;

  /** Number of trials per case (for statistical significance) */
  trials: number;

  /** Model to use for LLM-as-judge grading */
  judgeModel: string;

  /** Minimum scores to pass */
  thresholds: {
    /** Overall pass threshold (0-1) */
    overall: number;
    /** Per-dimension thresholds */
    [dimension: string]: number;
  };

  /** When to run this eval suite */
  triggers: {
    /** Run when prompts change */
    onPromptChange?: boolean;
    /** Run when agent config changes */
    onAgentConfigChange?: boolean;
    /** Run on weekly schedule */
    weekly?: boolean;
    /** Run on deploy: 'full', 'smoke', or false */
    onDeploy?: "full" | "smoke" | false;
  };
}

/**
 * Types of graders available
 */
export type GraderType =
  | "contains" // Check if response contains values
  | "notContains" // Check if response doesn't contain values
  | "regex" // Match against regex pattern
  | "maxLength" // Check response length
  | "minLength" // Check minimum length
  | "json" // Validate JSON structure
  | "llm-judge"; // Use LLM to evaluate

/**
 * A single evaluation criterion
 */
export interface EvalCriterion {
  /** What dimension this measures (relevance, accuracy, safety, etc.) */
  dimension: string;

  /** Type of grader to use */
  type: GraderType;

  /** Weight of this criterion (should sum to ~1.0 across all criteria) */
  weight: number;

  // Type-specific configuration

  /** For 'contains' and 'notContains': values to check */
  values?: string[];

  /** For 'contains': minimum number of values that must match */
  matchCount?: number;

  /** For 'maxLength' and 'minLength': length limit */
  value?: number;

  /** For 'regex': pattern to match */
  pattern?: string;

  /** For 'json': JSON schema to validate against */
  schema?: Record<string, unknown>;

  /** For 'llm-judge': prompt to ask the judge */
  prompt?: string;

  /** For 'llm-judge': scoring rubric */
  rubric?: Record<number, string>;
}

/**
 * Input to an evaluation case
 */
export interface EvalInput {
  /** The prompt/request to send */
  prompt: string;

  /** Additional context for the LLM */
  context: Record<string, unknown>;

  /** Optional: specific agent config to use */
  agentConfig?: Record<string, unknown>;
}

/**
 * A single evaluation test case
 */
export interface EvalCase {
  /** Unique identifier for this case */
  id: string;

  /** Human-readable name */
  name: string;

  /** Input to the LLM/agent */
  input: EvalInput;

  /** Criteria to evaluate the response against */
  criteria: EvalCriterion[];

  /** Minimum score to pass this case (0-1) */
  minScore: number;

  /** Optional tags for filtering */
  tags?: string[];
}

/**
 * Complete evaluation suite
 */
export interface EvalSuite {
  /** Suite configuration */
  config: EvalConfig;

  /** All test cases */
  cases: EvalCase[];
}

/**
 * Result of a single criterion evaluation
 */
export interface CriterionResult {
  /** The criterion that was evaluated */
  criterion: EvalCriterion;

  /** Score achieved (0-1) */
  score: number;

  /** Weighted score (score * weight) */
  weightedScore: number;

  /** Optional explanation (from LLM-judge) */
  explanation?: string;
}

/**
 * Result of a single trial
 */
export interface TrialResult {
  /** Trial number (1-indexed) */
  trial: number;

  /** The response from the LLM */
  response: string;

  /** Results for each criterion */
  criterionResults: CriterionResult[];

  /** Total score for this trial */
  score: number;

  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Result of a single case (across all trials)
 */
export interface CaseResult {
  /** The case that was evaluated */
  case: EvalCase;

  /** Results from each trial */
  trials: TrialResult[];

  /** Average score across trials */
  averageScore: number;

  /** Whether the case passed (averageScore >= minScore) */
  passed: boolean;

  /** Score standard deviation (for consistency measurement) */
  stdDev: number;
}

/**
 * Complete evaluation report
 */
export interface EvalReport {
  /** Name of the suite */
  suite: string;

  /** When the eval was run */
  timestamp: string;

  /** Whether the overall suite passed */
  passed: boolean;

  /** Overall score (average of all cases) */
  overallScore: number;

  /** Scores by dimension */
  byDimension: Record<string, number>;

  /** Results for each case */
  cases: CaseResult[];

  /** Total duration in milliseconds */
  totalDurationMs: number;

  /** Any errors that occurred */
  errors?: string[];
}

/**
 * Code-based grader function signature
 */
export interface CodeGrader {
  type: Exclude<GraderType, "llm-judge">;
  evaluate: (response: string, config: Record<string, unknown>) => number;
}

/**
 * LLM-based grader function signature
 */
export interface LLMGrader {
  type: "llm-judge";
  evaluate: (
    response: string,
    config: { prompt: string; rubric?: Record<number, string> },
    judgeModel: string
  ) => Promise<number>;
}

/**
 * Options for running an eval suite
 */
export interface RunOptions {
  /** Override number of trials */
  trials?: number;

  /** Only run specific cases (by id) */
  cases?: string[];

  /** Only run cases with specific tags */
  tags?: string[];

  /** Run in smoke mode (1 trial, subset of cases) */
  smoke?: boolean;

  /** Verbose output */
  verbose?: boolean;
}

/**
 * Pass@k metrics for measuring reliability
 *
 * - pass@k: "At least one success in k attempts" - measures capability
 * - pass^k: "All k trials succeed" - measures consistency/reliability
 */
export interface PassAtKMetrics {
  /** First attempt success rate (most important for UX) */
  passAt1: number;

  /** Success rate within 3 attempts */
  passAt3: number;

  /** All 3 trials succeed (consistency metric) */
  passK3: number;

  /** Number of trials used for calculation */
  trials: number;
}

/**
 * Eval type classification
 */
export type EvalType =
  | "capability" // Tests if Claude can do something new
  | "regression"; // Ensures existing functionality still works

/**
 * Extended case result with pass@k metrics
 */
export interface CaseResultWithMetrics extends CaseResult {
  /** Pass@k reliability metrics */
  metrics: PassAtKMetrics;

  /** Type of eval (capability vs regression) */
  evalType?: EvalType;
}

/**
 * Extended report with pass@k metrics
 */
export interface EvalReportWithMetrics extends EvalReport {
  /** Aggregate pass@k metrics across all cases */
  aggregateMetrics: PassAtKMetrics;

  /** Capability eval results (new features) */
  capabilityResults?: {
    total: number;
    passed: number;
    passRate: number;
  };

  /** Regression eval results (existing features) */
  regressionResults?: {
    total: number;
    passed: number;
    passRate: number;
  };
}

/**
 * Helper to calculate pass@k metrics from trial results
 */
export function calculatePassAtK(
  trials: TrialResult[],
  minScore: number
): PassAtKMetrics {
  const passed = trials.map((t) => t.score >= minScore);
  const numTrials = trials.length;

  // pass@1: First trial passes
  const passAt1 = passed[0] ? 1 : 0;

  // pass@3: At least one of first 3 trials passes
  const first3 = passed.slice(0, 3);
  const passAt3 = first3.some((p) => p) ? 1 : 0;

  // pass^3: All of first 3 trials pass
  const passK3 = first3.length >= 3 && first3.every((p) => p) ? 1 : 0;

  return {
    passAt1,
    passAt3,
    passK3,
    trials: numTrials,
  };
}

/**
 * Helper to aggregate pass@k metrics across multiple cases
 */
export function aggregatePassAtK(
  caseMetrics: PassAtKMetrics[]
): PassAtKMetrics {
  const count = caseMetrics.length;
  if (count === 0) {
    return { passAt1: 0, passAt3: 0, passK3: 0, trials: 0 };
  }

  const sumPassAt1 = caseMetrics.reduce((sum, m) => sum + m.passAt1, 0);
  const sumPassAt3 = caseMetrics.reduce((sum, m) => sum + m.passAt3, 0);
  const sumPassK3 = caseMetrics.reduce((sum, m) => sum + m.passK3, 0);
  const avgTrials = caseMetrics.reduce((sum, m) => sum + m.trials, 0) / count;

  return {
    passAt1: sumPassAt1 / count,
    passAt3: sumPassAt3 / count,
    passK3: sumPassK3 / count,
    trials: Math.round(avgTrials),
  };
}
