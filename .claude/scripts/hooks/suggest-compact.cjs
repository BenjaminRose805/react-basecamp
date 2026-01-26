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
const {
  getTempDir,
  readFile,
  writeFile,
  logError,
  readStdinJson,
} = require('../lib/utils.cjs');

async function main() {
  try {
    // Parse JSON from stdin to get session_id
    const input = await readStdinJson();
    const sessionId = input.session_id || process.env.CLAUDE_SESSION_ID || 'default';

    // Track tool call count
    const counterFile = path.join(getTempDir(), `claude-tool-count-${sessionId}`);
    const threshold = parseInt(process.env.COMPACT_THRESHOLD || '50', 10);

    let count = 1;

    // Read existing count or start at 1
    const existing = readFile(counterFile);
    if (existing) {
      count = parseInt(existing.trim(), 10) + 1;
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
