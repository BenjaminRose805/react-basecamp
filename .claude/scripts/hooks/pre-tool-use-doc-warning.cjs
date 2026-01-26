#!/usr/bin/env node
/**
 * Pre-tool-use hook for Write tool
 * Warns about creating documentation files in unusual locations
 *
 * Exit codes:
 * - 0: Always (warning only, does not block)
 */

const { readStdinJson, logError } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path || '';

    // Check if it's a markdown or text file
    if (/\.(md|txt)$/.test(filePath)) {
      // Check if it's NOT in expected documentation locations
      const isExpectedLocation = /(README|CLAUDE|AGENTS|CONTRIBUTING|SKILL|spec-template)\.md$/.test(filePath) ||
        /\/(specs|rules|contexts|commands|agents|skills)\//.test(filePath);

      if (!isExpectedLocation) {
        logError('[Hook] WARNING: Creating doc file: ' + filePath);
        logError('[Hook] Prefer README.md or existing doc locations');
      }
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
