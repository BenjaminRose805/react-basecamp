#!/usr/bin/env node
/**
 * Post-tool-use hook for Edit tool
 * Runs Prettier on edited files
 *
 * Exit codes:
 * - 0: Always (informational only)
 */

const { execFileSync } = require('child_process');
const { readStdinJson } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path || '';

    if (/\.(ts|tsx|js|jsx|json|css|scss|md)$/.test(filePath)) {
      try {
        // Use execFileSync with array args to avoid shell injection
        execFileSync('npx', ['prettier', '--write', filePath], {
          stdio: 'inherit',
          timeout: 30000,
        });
      } catch (err) {
        // Prettier errors are shown via stdio inherit, no need to log
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
