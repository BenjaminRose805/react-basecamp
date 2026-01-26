#!/usr/bin/env node
/**
 * Stop Hook (Session End) - Persist session state
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when Claude session ends.
 * - Creates/updates session log file
 * - Stops spec-workflow dashboard (cleanup)
 *
 * Output: stderr only (status messages visible to user)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const {
  getSessionsDir,
  getDateString,
  getTimeString,
  ensureDir,
  writeFile,
  replaceInFile,
  logError,
} = require('../lib/utils.cjs');

/**
 * Stop the spec-workflow dashboard
 */
function stopDashboard() {
  try {
    // Try to find and kill the dashboard process
    // Cross-platform approach: use pkill on Unix, taskkill on Windows
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM spec-workflow-mcp* 2>NUL', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "spec-workflow-mcp" 2>/dev/null || true', { stdio: 'ignore' });
    }
  } catch {
    // Ignore errors - process may not be running
  }
}

async function main() {
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const sessionFile = path.join(sessionsDir, `${today}-session.tmp`);

  ensureDir(sessionsDir);

  const currentTime = getTimeString();

  // If session file exists for today, update the end time
  if (fs.existsSync(sessionFile)) {
    const success = replaceInFile(
      sessionFile,
      /\*\*Last Updated:\*\*.*/,
      `**Last Updated:** ${currentTime}`
    );

    if (success) {
      logError(`[Hook] Updated session file: ${sessionFile}`);
    }
  } else {
    // Create new session file with template
    const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

[Session context goes here]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-

### Context to Load
\`\`\`
[relevant files]
\`\`\`
`;

    writeFile(sessionFile, template);
    logError(`[Hook] Created session file: ${sessionFile}`);
  }

  // Stop the dashboard
  stopDashboard();
  logError('[Hook] Session ended');

  process.exit(0);
}

main().catch(err => {
  logError('[Hook] SessionEnd error: ' + err.message);
  process.exit(0);
});
