#!/usr/bin/env node
/**
 * Post-tool-use hook for Bash tool
 * Shows PR URL after gh pr create command
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
    const toolOutput = input.tool_output || '';

    if (/gh pr create/.test(command)) {
      const outputStr = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
      const match = outputStr.match(/https:\/\/github.com\/[^\s]+\/pull\/\d+/);

      if (match) {
        logError('[Hook] PR created: ' + match[0]);
        logError('[Hook] To view: gh pr view ' + match[0].split('/').pop());
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
