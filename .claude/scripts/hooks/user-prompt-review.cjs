#!/usr/bin/env node
/**
 * UserPromptSubmit Hook for /review Command
 *
 * Detects /review command and injects context for 4-Loop Review System.
 * Does NOT execute loops directly - delegates to /review command agent.
 *
 * 4-Loop Review System:
 * - Loop 1 Tier 1: Fast free checks (lint, typecheck)
 * - Loop 1 Tier 2: Comprehensive free checks (build, tests, security)
 * - Loop 2: Claude reviewer (sub-agent with fresh context)
 * - Loop 3: CodeRabbit CLI (rate-limited)
 *
 * Flags:
 * - /review --free          Run only free checks (Loop 1)
 * - /review --claude        Run free checks + Claude reviewer
 * - /review --skip-cr       Run free checks + Claude, skip CodeRabbit
 * - /review --all           Run all loops (default)
 *
 * Exit codes:
 * - 0: Always (detection should not block)
 */

const { execSync } = require('child_process');
const {
  readStdinJson,
  logContext,
  logError,
} = require('../lib/utils.cjs');
const { detectCommand, parseFlags: parseCommandFlags } = require('../lib/command-utils.cjs');

/**
 * Parse review-specific flags from command (T009: Use shared utilities)
 * @param {string} command
 * @returns {{free: boolean, claude: boolean, skipCr: boolean, all: boolean}}
 */
function parseFlags(command) {
  const rawFlags = parseCommandFlags(command, {
    free: 'boolean',
    claude: 'boolean',
    'skip-cr': 'boolean',
    all: 'boolean'
  });

  // Transform to expected format (skip-cr -> skipCr)
  const flags = {
    free: rawFlags.free,
    claude: rawFlags.claude,
    skipCr: rawFlags['skip-cr'],
    all: rawFlags.all
  };

  // Default to --all if no flags specified
  if (!flags.free && !flags.claude && !flags.skipCr && !flags.all) {
    flags.all = true;
  }

  return flags;
}

/**
 * Get files to review based on git state
 * @returns {{staged: string[], unstaged: string[], scope: string}}
 */
function getFilesToReview() {
  try {
    // Get staged files
    const stagedOutput = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    const staged = stagedOutput ? stagedOutput.split('\n').filter(Boolean) : [];

    // Get unstaged files
    const unstagedOutput = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const unstaged = unstagedOutput ? unstagedOutput.split('\n').filter(Boolean) : [];

    // Determine scope
    let scope = 'working-tree';
    if (staged.length > 0 && unstaged.length === 0) {
      scope = 'staged-only';
    } else if (staged.length === 0 && unstaged.length > 0) {
      scope = 'unstaged-only';
    } else if (staged.length > 0 && unstaged.length > 0) {
      scope = 'mixed';
    }

    return { staged, unstaged, scope };
  } catch (err) {
    logError(`[Hook] Warning: Failed to get git files: ${err.message}`);
    return { staged: [], unstaged: [], scope: 'unknown' };
  }
}

/**
 * Determine which loops to run based on flags
 * @param {{free: boolean, claude: boolean, skipCr: boolean, all: boolean}} flags
 * @returns {string[]}
 */
function getLoopsToRun(flags) {
  if (flags.free) {
    return ['Loop 1 Tier 1', 'Loop 1 Tier 2'];
  } else if (flags.claude) {
    return ['Loop 1 Tier 1', 'Loop 1 Tier 2', 'Loop 2 (Claude)'];
  } else if (flags.skipCr) {
    return ['Loop 1 Tier 1', 'Loop 1 Tier 2', 'Loop 2 (Claude)'];
  } else {
    // --all or default
    return ['Loop 1 Tier 1', 'Loop 1 Tier 2', 'Loop 2 (Claude)', 'Loop 3 (CodeRabbit)'];
  }
}

/**
 * Main hook logic
 */
async function main() {
  try {
    const input = await readStdinJson();
    const message = input.message || input.prompt || '';

    // Skip if not a user message or empty
    if (!message || typeof message !== 'string') {
      process.exit(0);
    }

    const trimmedMessage = message.trim();

    // Check if this is a /review command (T009: Use shared command detection)
    const detectedCommand = detectCommand(trimmedMessage);
    if (detectedCommand !== 'review') {
      process.exit(0);
    }

    // Parse flags
    const flags = parseFlags(trimmedMessage);
    const flagsStr = Object.entries(flags)
      .filter(([, value]) => value)
      .map(([key]) => `--${key}`)
      .join(' ');

    // Get files to review
    const { staged, unstaged, scope } = getFilesToReview();

    // Determine loops to run
    const loopsToRun = getLoopsToRun(flags);

    // Show detection message
    logError('\n🔍 /review command detected\n');
    logError(`Flags: ${flagsStr || '(default: --all)'}`);
    logError(`Scope: ${scope}`);
    logError(`Files: ${staged.length} staged, ${unstaged.length} unstaged`);
    logError(`Loops: ${loopsToRun.join(', ')}\n`);

    // Inject context for Claude
    logContext(`
---
**Review Command Detected**

Command: /review ${flagsStr || '(default: --all)'}

**Files to Review:**
- Staged files: ${staged.length}
- Unstaged files: ${unstaged.length}
- Scope: ${scope}

**Loops to Run:**
${loopsToRun.map(loop => `- ${loop}`).join('\n')}

**Next Steps:**
The /review command will:
1. Show a preview of the review plan
2. Delegate loop execution to specialized sub-agents
3. Aggregate findings and generate a unified report

The 4-Loop Review System follows the pattern:
- Loop 1 Tier 1: Fast checks (lint, typecheck) - parallel execution
- Loop 1 Tier 2: Comprehensive checks (build, tests, security) - fail-fast
- Loop 2: Claude reviewer (sub-agent with fresh context)
- Loop 3: CodeRabbit CLI (rate-limited, skippable)

Configuration: .claude/config/review-config.yaml
State tracking: .claude/state/loop-state.json
---
`);

    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on detection errors
    logError(`[Hook] Error in user-prompt-review: ${err.message}`);
    process.exit(0);
  }
}

main();
