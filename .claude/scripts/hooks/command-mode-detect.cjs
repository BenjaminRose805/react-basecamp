#!/usr/bin/env node
/**
 * Command mode detection hook
 *
 * Detects when user runs /design, /implement, /ship and:
 * 1. Sets a state file indicating "command mode"
 * 2. Injects a reminder to use Task tool for sub-agents
 *
 * This works with pre-tool-use-task-enforcement.cjs to ensure
 * commands spawn sub-agents via Task instead of executing directly.
 *
 * Exit codes:
 * - 0: Always (detection should not block)
 */

const path = require('path');
const {
  readStdinJson,
  logContext,
  logError,
  ensureDir,
  writeFile,
  getGitRoot,
} = require('../lib/utils.cjs');

// Commands that should trigger command mode (require sub-agent spawning)
const COMMAND_PATTERNS = [
  { pattern: /^\/design\b/i, command: 'design', agents: ['plan-agent'] },
  { pattern: /^\/reconcile\b/i, command: 'reconcile', agents: ['plan-agent'] },
  { pattern: /^\/research\b/i, command: 'research', agents: ['plan-agent'] },
  { pattern: /^\/implement\b/i, command: 'implement', agents: ['code-agent', 'ui-agent'] },
  { pattern: /^\/review\b/i, command: 'review', agents: ['plan-agent'] },
  { pattern: /^\/ship\b/i, command: 'ship', agents: ['git-agent', 'check-agent'] },
];

// Commands that do NOT require sub-agent spawning
const EXEMPT_PATTERNS = [
  /^\/start\b/i,   // Direct git operation (hook handles it)
  /^\/guide\b/i,   // Informational only
  /^\/mode\b/i,    // Mode switch only
  /^\/help\b/i,    // Help only
  /^\/clear\b/i,   // Clear only
  /^\/compact\b/i, // Compact only
];

function getStateDir() {
  const gitRoot = getGitRoot() || process.cwd();
  return path.join(gitRoot, '.claude', 'state');
}

function getStatePath() {
  return path.join(getStateDir(), 'command-mode.json');
}

function readCommandMode() {
  try {
    const statePath = getStatePath();
    const fs = require('fs');
    if (!fs.existsSync(statePath)) {
      return null;
    }
    const { readFile } = require('../lib/utils.cjs');
    const content = readFile(statePath);
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

async function main() {
  try {
    const input = await readStdinJson();
    const message = input.message || input.prompt || '';

    // Skip if not a user message or empty
    if (!message || typeof message !== 'string') {
      process.exit(0);
    }

    const trimmedMessage = message.trim();

    // Check if this is an exempt command (no enforcement needed)
    for (const exemptPattern of EXEMPT_PATTERNS) {
      if (exemptPattern.test(trimmedMessage)) {
        // Clear any existing command mode state
        clearCommandMode();
        process.exit(0);
      }
    }

    // Check if this is a command that requires sub-agent spawning
    for (const { pattern, command, agents } of COMMAND_PATTERNS) {
      if (pattern.test(trimmedMessage)) {
        // Set command mode state
        setCommandMode(command, agents, trimmedMessage);

        // Inject reminder to Claude's context
        logContext(`
---
**⚠️ COMMAND MODE ACTIVE: /${command}**

You MUST follow the MANDATORY steps:
1. **Show preview** - Display execution plan from Preview section
2. **Get confirmation** - Wait for [Enter] to run or [Esc] to cancel
3. **Load agent file** - Read \`.claude/agents/${agents[0]}.md\`
4. **Follow CRITICAL EXECUTION REQUIREMENT** in that file
5. **Use Task tool** - Spawn sub-agents, NEVER execute directly
---
`);

        process.exit(0);
      }
    }

    // Not a command - conditionally clear command mode
    // If user sends a regular message (not a command), they may have
    // completed the command execution, so clear the state
    const commandMode = readCommandMode();
    if (commandMode) {
      // Clear state if it's been more than 5 minutes since command started
      // or if the message doesn't look like it's part of command execution
      const startTime = commandMode.startedAt ? new Date(commandMode.startedAt) : null;
      const elapsed = startTime ? (Date.now() - startTime.getTime()) / 1000 : Infinity;

      // Clear if: elapsed > 5 minutes OR message is clearly unrelated
      const isUnrelated = !/task|sub-agent|stage|phase|implement|research|write/i.test(trimmedMessage);

      if (elapsed > 300 || isUnrelated) {
        clearCommandMode();
      }
    }

    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on detection errors
    process.exit(0);
  }
}

function setCommandMode(command, agents, originalMessage) {
  try {
    const stateDir = getStateDir();
    ensureDir(stateDir);

    const state = {
      command,
      agents,
      originalMessage,
      startedAt: new Date().toISOString(),
      toolCallCount: 0,
      taskCallCount: 0,
    };

    writeFile(getStatePath(), JSON.stringify(state, null, 2));
  } catch (err) {
    // Fail silently
  }
}

function clearCommandMode() {
  try {
    const statePath = getStatePath();
    const fs = require('fs');
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }
  } catch (err) {
    // Fail silently
  }
}

main();
