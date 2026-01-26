#!/usr/bin/env node
/**
 * Post-tool-use hook for Edit tool
 * Runs TypeScript type check on edited .ts/.tsx files
 *
 * Exit codes:
 * - 0: Always (informational only)
 */

const { execSync } = require('child_process');
const { readStdinJson, logError } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path || '';

    if (/\.(ts|tsx)$/.test(filePath)) {
      try {
        execSync('npx tsc --noEmit --pretty', {
          stdio: 'inherit',
          timeout: 30000,
        });
      } catch (err) {
        // Type errors are shown via stdio inherit, no need to log
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
