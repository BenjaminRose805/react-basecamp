#!/usr/bin/env node
/**
 * Auto-start dashboard (non-blocking)
 *
 * Fire-and-forget: Starts dashboard in background without waiting.
 * Does NOT block session startup.
 *
 * Output: stderr only (status messages)
 */

const { logError } = require('../lib/utils.cjs');

async function main() {
  try {
    // Dashboard functionality removed - no longer needed
    logError('[Hook] Dashboard hook disabled');
    process.exit(0);
  } catch (err) {
    logError('[Hook] Dashboard error: ' + err.message);
    process.exit(0); // Don't block on errors
  }
}

main();
