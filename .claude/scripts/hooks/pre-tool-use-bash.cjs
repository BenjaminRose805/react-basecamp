#!/usr/bin/env node
/**
 * Pre-tool-use hook for Bash commands
 *
 * Responsibilities:
 * 1. Block dangerous commands (rm -rf /, fork bombs, etc.)
 * 2. Run quality gate (lint + typecheck) before git commit
 * 3. Log all commands to audit trail
 *
 * Exit codes:
 * - 0: Allow command
 * - 2: Block command (security)
 */

const { execSync } = require('child_process');
const {
  readStdinJson,
  logError,
  appendToLog,
} = require('../lib/utils.cjs');
const {
  isDangerousCommand,
} = require('../lib/security-patterns.cjs');

async function main() {
  try {
    // Parse JSON input from stdin
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';
    const sessionId = input.session_id || 'unknown';

    // Log to audit trail
    appendToLog('pre-tool-use', {
      session_id: sessionId,
      tool_name: 'Bash',
      command: command.substring(0, 500), // Truncate for safety
      action: 'checking',
    });

    // Check for dangerous commands
    const dangerCheck = isDangerousCommand(command);
    if (dangerCheck.blocked) {
      logError(`[Hook] BLOCKED: ${dangerCheck.reason}`);
      logError(`[Hook] Command: ${command.substring(0, 100)}...`);
      appendToLog('pre-tool-use', {
        session_id: sessionId,
        tool_name: 'Bash',
        command: command.substring(0, 500),
        action: 'blocked',
        reason: dangerCheck.reason,
      });
      process.exit(2);
    }

    // Check for git commit - run quality gate
    if (/^git\s+commit\b/.test(command)) {
      logError('[Hook] Running pre-commit quality checks...');

      try {
        // Run lint
        logError('[Hook] Running lint...');
        execSync('pnpm run lint', {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8',
        });
        logError('[Hook] Lint passed');

        // Run typecheck
        logError('[Hook] Running typecheck...');
        execSync('pnpm run typecheck', {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8',
        });
        logError('[Hook] Typecheck passed');

        logError('[Hook] Quality checks passed - commit allowed');
      } catch (err) {
        logError('[Hook] BLOCKED: Quality checks failed');
        logError('[Hook] Fix lint/type errors before committing');
        if (err.stderr) {
          // Show first few lines of error
          const errorLines = err.stderr.split('\n').slice(0, 10);
          errorLines.forEach(line => logError(line));
        }
        appendToLog('pre-tool-use', {
          session_id: sessionId,
          tool_name: 'Bash',
          command: 'git commit',
          action: 'blocked',
          reason: 'quality gate failed',
        });
        process.exit(2);
      }
    }

    // Command is allowed
    process.exit(0);
  } catch (err) {
    // Fail open on errors (don't block on hook failures)
    logError(`[Hook] Warning: pre-tool-use-bash error: ${err.message}`);
    process.exit(0);
  }
}

main();
