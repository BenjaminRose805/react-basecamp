#!/usr/bin/env node
/**
 * UserPromptSubmit Hook for /ship Command
 *
 * Enforces ship gate by validating review state before shipping.
 * Blocks if:
 * - No review state exists
 * - Review state is stale (different commit)
 * - Review found blocking issues (ship_allowed=false)
 */

const path = require('path');
const { execSync } = require('child_process');
const {
  readStdinJson,
  logContext,
  logError,
  readFile,
  getGitRoot,
} = require('../lib/utils.cjs');

// Command pattern for /ship
const SHIP_PATTERN = /^\/ship\b/i;

function getStateDir() {
  const gitRoot = getGitRoot() || process.cwd();
  return path.join(gitRoot, '.claude', 'state');
}

function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

async function main() {
  try {
    const input = await readStdinJson();
    const message = input.message || input.prompt || '';

    if (!message || typeof message !== 'string') {
      process.exit(0);
    }

    const trimmedMessage = message.trim();

    // Only handle /ship command
    if (!SHIP_PATTERN.test(trimmedMessage)) {
      process.exit(0);
    }

    // Check for --force flag (bypass gate)
    const forceFlag = /--force\b/i.test(trimmedMessage);
    if (forceFlag) {
      logContext(`
---
**Ship Gate: BYPASSED**

The --force flag was used. Proceeding without review validation.
⚠️ Use with caution - review state not checked.
---
`);
      process.exit(0);
    }

    // Read loop state
    const stateFile = path.join(getStateDir(), 'loop-state.json');
    let state;

    try {
      const content = readFile(stateFile);
      if (!content) {
        // No state file - block
        logError('Ship gate: No review state found');
        logContext(`
---
**🚫 Ship Gate: BLOCKED**

Reason: No review state found
Location: ${stateFile}

**Action Required:**
Run \`/review\` before shipping to validate your changes.
---
`);
        process.exit(0);
      }

      state = JSON.parse(content);
    } catch (err) {
      // Corrupted state file
      logError('Ship gate: Invalid review state');
      logContext(`
---
**🚫 Ship Gate: BLOCKED**

Reason: Review state file is corrupted
Error: ${err.message}
Location: ${stateFile}

**Action Required:**
Delete the state file and run \`/review\` again:
\`rm ${stateFile}\`
\`/review\`
---
`);
      process.exit(0);
    }

    // Check commit freshness
    const currentCommit = getCurrentCommit();
    if (currentCommit && state.head_commit && state.head_commit !== currentCommit) {
      logError('Ship gate: Review state is stale');
      logContext(`
---
**🚫 Ship Gate: BLOCKED**

Reason: Review state is stale (commit mismatch)

Review was for: ${state.head_commit?.substring(0, 7)}
Current HEAD:   ${currentCommit.substring(0, 7)}

**Action Required:**
Run \`/review\` to validate your current changes.
---
`);
      process.exit(0);
    }

    // Check ship_allowed flag
    if (state.ship_allowed === false) {
      const blockers = state.blockers || [];
      logError('Ship gate: Review found issues');
      logContext(`
---
**🚫 Ship Gate: BLOCKED**

Reason: Review found blocking issues

**Blockers:**
${blockers.map(b => `- ${b}`).join('\n') || '- See loop-state.json for details'}

**Loop Status:**
- Loop 1 Tier 1: ${state.loops?.loop1_tier1?.status || 'unknown'}
- Loop 1 Tier 2: ${state.loops?.loop1_tier2?.status || 'unknown'}
- Loop 2 Claude: ${state.loops?.loop2_claude?.status || 'unknown'}
- Loop 3 CodeRabbit: ${state.loops?.loop3_coderabbit?.status || 'unknown'}

**Action Required:**
Fix the issues and run \`/review\` again.
Or use \`/ship --force\` to bypass (not recommended).
---
`);
      process.exit(0);
    }

    // All checks passed - approved
    logContext(`
---
**✅ Ship Gate: APPROVED**

Review validated for commit: ${state.head_commit?.substring(0, 7) || 'unknown'}
All loops passed: ${state.ship_allowed === true}
Timestamp: ${state.timestamp || 'unknown'}

Proceeding with /ship command...
---
`);

    process.exit(0);
  } catch (err) {
    logError(`[Hook] Error in user-prompt-ship: ${err.message}`);
    process.exit(0);
  }
}

main();
