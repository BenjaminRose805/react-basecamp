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
 * Sensitive keys that should be redacted from logs
 */
const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'api_key', 'apikey', 'bearer'];

/**
 * Sanitize tool input by removing/truncating sensitive or large data
 * Recursively traverses nested objects and arrays, handling circular references
 * @param {any} toolInput - The tool input to sanitize
 * @param {number} maxLength - Maximum length for string values
 * @param {WeakSet} seen - Set of already seen objects (for circular reference detection)
 * @returns {any} Sanitized input (deep copy)
 */
function sanitizeInput(toolInput, maxLength = 500, seen = new WeakSet()) {
  // Handle null/undefined
  if (toolInput === null || toolInput === undefined) {
    return toolInput;
  }

  // Handle primitives (non-objects)
  if (typeof toolInput !== 'object') {
    // Truncate long strings
    if (typeof toolInput === 'string' && toolInput.length > maxLength) {
      return toolInput.substring(0, maxLength) + `... (truncated ${toolInput.length - maxLength} chars)`;
    }
    return toolInput;
  }

  // Handle circular references
  if (seen.has(toolInput)) {
    return '[Circular Reference]';
  }
  seen.add(toolInput);

  // Handle arrays
  if (Array.isArray(toolInput)) {
    return toolInput.map(item => sanitizeInput(item, maxLength, seen));
  }

  // Handle objects
  const sanitized = {};

  for (const [key, value] of Object.entries(toolInput)) {
    // Mask sensitive keys at any depth
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested values
    sanitized[key] = sanitizeInput(value, maxLength, seen);
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
