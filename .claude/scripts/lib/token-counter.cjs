/**
 * Maximum number of tokens allowed in context summaries.
 * @constant {number}
 */
const MAX_SUMMARY_TOKENS = 500;

/**
 * Counts the number of tokens (whitespace-delimited words) in a text string.
 * Uses a simple whitespace-based tokenization approach.
 *
 * @param {string|null|undefined} text - The text to count tokens in
 * @returns {number} The number of tokens found (0 for null/undefined/empty input)
 *
 * @example
 * countTokens('hello world') // Returns: 2
 * countTokens('  multiple   spaces  ') // Returns: 2
 * countTokens('') // Returns: 0
 */
function countTokens(text) {
  if (!text) return 0;
  return String(text).split(/\s+/).filter(Boolean).length;
}

/**
 * Validates that a context summary does not exceed the token limit.
 *
 * @param {string} summary - The context summary to validate
 * @param {number} [maxTokens=MAX_SUMMARY_TOKENS] - Maximum allowed tokens (default: 500)
 * @returns {{valid: boolean, tokenCount: number, limit: number, error?: string}} Validation result
 *
 * @example
 * validateContextSummary('short summary')
 * // Returns: { valid: true, tokenCount: 2, limit: 500 }
 *
 * @example
 * validateContextSummary('very long summary...', 10)
 * // Returns: { valid: false, tokenCount: 15, limit: 10, error: '...' }
 */
function validateContextSummary(summary, maxTokens = MAX_SUMMARY_TOKENS) {
  const tokenCount = countTokens(summary);
  const valid = tokenCount <= maxTokens;
  const result = { valid, tokenCount, limit: maxTokens };

  if (!valid) {
    result.error = `Context summary exceeds ${maxTokens} token limit (actual: ${tokenCount} tokens)`;
  }

  return result;
}

module.exports = {
  MAX_SUMMARY_TOKENS,
  countTokens,
  validateContextSummary
};
