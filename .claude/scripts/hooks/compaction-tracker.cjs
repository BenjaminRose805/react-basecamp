#!/usr/bin/env node
/**
 * Compaction Tracker Hook
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PreCompact hook to track compaction events.
 * - Logs compaction event with timestamp and session info
 * - Reads tool call count from temp file (if available)
 * - Appends to compaction log for metrics tracking
 *
 * Output: stderr only (status messages visible to user)
 */

const path = require('path');
const crypto = require('crypto');
const {
  getTempDir,
  readFile,
  appendToLog,
  logError,
  readStdinJson,
} = require('../lib/utils.cjs');

/**
 * Sanitize session ID for safe use in file paths
 * @param {string} sessionId - Raw session ID from input
 * @returns {string} Safe session ID for use in file names
 */
function sanitizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return 'default';
  }

  if (/^[a-zA-Z0-9_-]{1,64}$/.test(sessionId)) {
    return sessionId;
  }

  return crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 32);
}

/**
 * Read current tool call count from temp file
 * @param {string} sessionId - Sanitized session ID
 * @returns {number} Tool call count (0 if not found)
 */
function getToolCallCount(sessionId) {
  const counterFile = path.join(getTempDir(), `claude-tool-count-${sessionId}`);
  const content = readFile(counterFile);

  if (!content) {
    return 0;
  }

  const parsed = parseInt(content.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function main() {
  try {
    const input = await readStdinJson();

    // Null check - return early if stdin is null
    if (!input) {
      logError('[Hook] Compaction tracker: no input data received');
      process.exit(0);
    }

    const rawSessionId = input.session_id || process.env.CLAUDE_SESSION_ID || 'default';
    const sessionId = sanitizeSessionId(rawSessionId);

    const toolCallCount = getToolCallCount(sessionId);

    // Determine compaction reason
    let reason = 'manual';
    if (toolCallCount >= 150) {
      reason = 'suggested_150';
    } else if (toolCallCount >= 100) {
      reason = 'suggested_100';
    } else if (toolCallCount >= 50) {
      reason = 'suggested_50';
    }

    const event = {
      session_id: sessionId,
      event: 'compaction',
      tool_calls: toolCallCount,
      reason,
    };

    // Log to compaction metrics file
    appendToLog('compaction', event, 100);

    // Output status to user
    logError(`[Hook] Compaction tracked: ${toolCallCount} tool calls, reason: ${reason}`);

    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on tracking errors
    logError('[Hook] Compaction tracker error: ' + err.message);
    process.exit(0);
  }
}

main();
