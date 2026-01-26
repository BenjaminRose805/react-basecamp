#!/usr/bin/env node
/**
 * Post-tool-use hook for Edit tool
 * Runs Vitest related tests for edited src files
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

    // Only run for src files
    if (/src\/.*\.(ts|tsx)$/.test(filePath)) {
      try {
        // Escape file path for shell
        const safePath = filePath.replace(/"/g, '\\"');
        execSync(`npx vitest related "${safePath}" --run --passWithNoTests`, {
          stdio: 'inherit',
          timeout: 60000,
        });
      } catch (err) {
        // Test errors are shown via stdio inherit, no need to log
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
