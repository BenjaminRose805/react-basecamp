#!/usr/bin/env node
/**
 * Pre-tool-use hook for git push commands
 * Shows reminder to ensure tests pass and PR is ready
 *
 * Exit codes:
 * - 0: Always (informational only)
 */

const { readStdinJson, logError } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';

    if (/^git\s+push/.test(command)) {
      logError('[Hook] Pushing to remote...');
      logError('[Hook] Ensure all tests pass and PR is ready');
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
