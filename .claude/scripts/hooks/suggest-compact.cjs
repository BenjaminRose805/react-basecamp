#!/usr/bin/env node
/**
 * Strategic Compact Suggester
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on PreToolUse (Edit|Write) to suggest manual compaction.
 * - Parses JSON from stdin to get session_id
 * - Tracks tool call count per session
 * - Suggests compaction at strategic intervals
 *
 * Output: stderr only (status messages visible to user)
 */

const path = require('path');
const crypto = require('crypto');
const {
  getTempDir,
  readFile,
  writeFile,
  logError,
  readStdinJson,
} = require('../lib/utils.cjs');

/**
 * Sanitize session ID for safe use in file paths
 * Prevents directory traversal and invalid filename characters
 * @param {string} sessionId - Raw session ID from input
 * @returns {string} Safe session ID for use in file names
 */
function sanitizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return 'default';
  }

  // If session ID looks safe (alphanumeric, dash, underscore only), use it directly
  if (/^[a-zA-Z0-9_-]{1,64}$/.test(sessionId)) {
    return sessionId;
  }

  // Otherwise, hash it to create a safe filename
  return crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 32);
}

async function main() {
  try {
    // Parse JSON from stdin to get session_id
    const input = await readStdinJson();
    const rawSessionId = input.session_id || process.env.CLAUDE_SESSION_ID || 'default';

    // Sanitize session ID to prevent directory traversal
    const sessionId = sanitizeSessionId(rawSessionId);

    // Track tool call count
    const counterFile = path.join(getTempDir(), `claude-tool-count-${sessionId}`);
    const threshold = parseInt(process.env.COMPACT_THRESHOLD || '50', 10);

    let count = 1;

    // Read existing count or start at 1
    const existing = readFile(counterFile);
    if (existing) {
      const parsed = parseInt(existing.trim(), 10);
      // Validate parsed value is a finite number
      if (Number.isFinite(parsed) && parsed > 0) {
        count = parsed + 1;
      }
      // If invalid (NaN, negative, etc.), fall back to starting at 1
    }

    // Save updated count
    writeFile(counterFile, String(count));

    // Suggest compact after threshold tool calls
    if (count === threshold) {
      logError(`[Hook] ${threshold} tool calls reached - consider /compact if transitioning phases`);
    }

    // Suggest at regular intervals after threshold
    if (count > threshold && count % 25 === 0) {
      logError(`[Hook] ${count} tool calls - good checkpoint for /compact if context is stale`);
    }

    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on suggestion errors
    process.exit(0);
  }
}

main();
