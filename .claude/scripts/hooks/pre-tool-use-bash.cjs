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

/**
 * Patterns for detecting secrets in commands
 */
const SECRET_PATTERNS = [
  // API keys and tokens (various formats)
  /\b[a-zA-Z0-9_-]{32,}\b/g,  // Long alphanumeric strings (potential tokens)
  /\bsk-[a-zA-Z0-9]{32,}\b/g,  // OpenAI-style keys
  /\bghp_[a-zA-Z0-9]{36}\b/g,  // GitHub personal access tokens
  /\bghu_[a-zA-Z0-9]{36}\b/g,  // GitHub user tokens
  /\bghs_[a-zA-Z0-9]{36}\b/g,  // GitHub server tokens
  /\bxox[baprs]-[a-zA-Z0-9-]+\b/g,  // Slack tokens
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9._-]+/gi,
  // Password arguments
  /--password[=\s]+\S+/gi,
  /-p\s+\S+/g,
  /PASSWORD=[^\s&;|]+/gi,
  // API key arguments
  /--api[_-]?key[=\s]+\S+/gi,
  /API[_-]?KEY=[^\s&;|]+/gi,
  // Token arguments
  /--token[=\s]+\S+/gi,
  /TOKEN=[^\s&;|]+/gi,
  // Secret arguments
  /--secret[=\s]+\S+/gi,
  /SECRET=[^\s&;|]+/gi,
  // AWS credentials
  /AKIA[0-9A-Z]{16}/g,
  // Private keys
  /-----BEGIN\s+[A-Z]+\s+PRIVATE\s+KEY-----/gi,
];

/**
 * Mask sensitive information in a command string for safe logging
 * @param {string} command - The command to mask
 * @returns {string} Command with secrets redacted
 */
function maskSensitiveCommand(command) {
  if (!command || typeof command !== 'string') {
    return '';
  }

  let masked = command;
  for (const pattern of SECRET_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    masked = masked.replace(pattern, '[REDACTED]');
  }

  return masked;
}

/**
 * Truncate and mask a command for logging
 * @param {string} command - The command to process
 * @param {number} maxLength - Maximum length
 * @returns {string} Safe string for logging
 */
function safeCommandForLog(command, maxLength = 500) {
  const masked = maskSensitiveCommand(command);
  if (masked.length > maxLength) {
    return masked.substring(0, maxLength) + '...';
  }
  return masked;
}

// Timeout for quality gate commands (60 seconds)
const QUALITY_GATE_TIMEOUT = 60000;

async function main() {
  try {
    // Parse JSON input from stdin
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';
    const sessionId = input.session_id || 'unknown';

    // Use masked command for all logging
    const safeCommand = safeCommandForLog(command);

    // Log to audit trail (with redacted command)
    appendToLog('pre-tool-use', {
      session_id: sessionId,
      tool_name: 'Bash',
      command: safeCommand,
      action: 'checking',
    });

    // Check for dangerous commands (use original command for accurate detection)
    const dangerCheck = isDangerousCommand(command);
    if (dangerCheck.blocked) {
      logError(`[Hook] BLOCKED: ${dangerCheck.reason}`);
      logError(`[Hook] Command: ${safeCommandForLog(command, 100)}`);
      appendToLog('pre-tool-use', {
        session_id: sessionId,
        tool_name: 'Bash',
        command: safeCommand,
        action: 'blocked',
        reason: dangerCheck.reason,
      });
      process.exit(2);
    }

    // Check for git commit - run quality gate
    if (/^git\s+commit\b/.test(command)) {
      logError('[Hook] Running pre-commit quality checks...');

      try {
        // Run lint with timeout
        logError('[Hook] Running lint...');
        execSync('pnpm run lint', {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8',
          timeout: QUALITY_GATE_TIMEOUT,
        });
        logError('[Hook] Lint passed');

        // Run typecheck with timeout
        logError('[Hook] Running typecheck...');
        execSync('pnpm run typecheck', {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf8',
          timeout: QUALITY_GATE_TIMEOUT,
        });
        logError('[Hook] Typecheck passed');

        logError('[Hook] Quality checks passed - commit allowed');
      } catch (err) {
        // Check if error was a timeout
        const isTimeout = err.killed || err.signal === 'SIGTERM';

        if (isTimeout) {
          logError('[Hook] BLOCKED: Quality check timed out after 60s');
          logError('[Hook] Try running pnpm lint and pnpm typecheck manually');
        } else {
          logError('[Hook] BLOCKED: Quality checks failed');
          logError('[Hook] Fix lint/type errors before committing');
          if (err.stderr) {
            // Show first few lines of error
            const errorLines = err.stderr.split('\n').slice(0, 10);
            errorLines.forEach(line => logError(line));
          }
        }

        appendToLog('pre-tool-use', {
          session_id: sessionId,
          tool_name: 'Bash',
          command: 'git commit',
          action: 'blocked',
          reason: isTimeout ? 'quality gate timed out' : 'quality gate failed',
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
