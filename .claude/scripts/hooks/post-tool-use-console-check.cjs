#!/usr/bin/env node
/**
 * Post-tool-use hook for Edit tool
 * Warns about console.log statements in edited files
 *
 * Exit codes:
 * - 0: Always (warning only, does not block)
 */

const fs = require('fs');
const { readStdinJson, logError } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path || '';

    // Only check JS/TS files
    if (/\.(ts|tsx|js|jsx)$/.test(filePath) && fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, idx) => {
        if (/console\.log/.test(line)) {
          matches.push((idx + 1) + ': ' + line.trim());
        }
      });

      if (matches.length > 0) {
        logError('[Hook] WARNING: console.log found in ' + filePath);
        matches.slice(0, 5).forEach(m => logError(m));
        logError('[Hook] Remove console.log before committing');
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
