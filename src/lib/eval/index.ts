/**
 * Evaluation Framework
 *
 * For Evaluation-Driven Development (EDD) of LLM features.
 *
 * @example
 * ```typescript
 * import { EvalSuite, runEvalSuite } from '@/lib/eval';
 *
 * const suite: EvalSuite = {
 *   config: { ... },
 *   cases: [ ... ]
 * };
 *
 * const report = await runEvalSuite(suite);
 * console.log(report.passed ? 'PASS' : 'FAIL');
 * ```
 */

export * from "./types";

// Runner will be implemented when first eval suite is created
// export { runEvalSuite } from './runner';
