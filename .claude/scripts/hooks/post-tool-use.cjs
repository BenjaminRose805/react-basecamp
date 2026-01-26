#!/usr/bin/env node
/**
 * Post-tool-use hook for audit logging
 *
 * Responsibilities:
 * 1. Log all tool operations to audit trail
 * 2. Sanitize sensitive data from logs
 * 3. Truncate long content
 *
 * Exit codes:
 * - 0: Always (logging should not block operations)
 */

const {
  readStdinJson,
  appendToLog,
} = require('../lib/utils.cjs');

/**
 * Sanitize tool input by removing/truncating sensitive or large data
 * @param {object} toolInput - The tool input to sanitize
 * @param {number} maxLength - Maximum length for string values
 * @returns {object} Sanitized input
 */
function sanitizeInput(toolInput, maxLength = 500) {
  if (!toolInput || typeof toolInput !== 'object') {
    return toolInput;
  }

  const sanitized = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

  for (const [key, value] of Object.entries(toolInput)) {
    // Skip or mask sensitive keys
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Truncate long strings
    if (typeof value === 'string' && value.length > maxLength) {
      sanitized[key] = value.substring(0, maxLength) + `... (truncated ${value.length - maxLength} chars)`;
      continue;
    }

    // Keep other values as-is
    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Summarize tool output
 * @param {string} output - The tool output
 * @param {number} maxLength - Maximum length
 * @returns {string} Summary
 */
function summarizeOutput(output, maxLength = 200) {
  if (!output || typeof output !== 'string') {
    return '';
  }

  if (output.length <= maxLength) {
    return output;
  }

  return output.substring(0, maxLength) + '...';
}

async function main() {
  try {
    // Parse JSON input from stdin
    const input = await readStdinJson();

    const sessionId = input.session_id || 'unknown';
    const toolName = input.tool_name || 'unknown';
    const toolInput = input.tool_input || {};
    const toolOutput = input.tool_output || '';

    // Log to audit trail
    appendToLog('post-tool-use', {
      session_id: sessionId,
      tool_name: toolName,
      tool_input: sanitizeInput(toolInput),
      result_summary: summarizeOutput(
        typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)
      ),
    });

    // Always exit 0 - logging should not block operations
    process.exit(0);
  } catch (err) {
    // Fail silently - don't log errors for the logging hook
    process.exit(0);
  }
}

main();
