#!/usr/bin/env node
/**
 * Stop hook
 * Checks for console.log in uncommitted files before session ends
 *
 * Exit codes:
 * - 0: Always (warning only, does not block)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const { logError } = require('../lib/utils.cjs');

async function main() {
  try {
    // Check if we're in a git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      process.exit(0);
    }

    // Get uncommitted files
    const filesOutput = execSync('git diff --name-only HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const files = filesOutput
      .split('\n')
      .filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && fs.existsSync(f));

    let found = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('console.log')) {
        logError('[Hook] WARNING: console.log in ' + file);
        found = true;
      }
    }

    if (found) {
      logError('[Hook] Remove before committing');
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
