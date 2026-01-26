#!/usr/bin/env node
/**
 * Pre-tool-use hook for Edit/Write operations
 *
 * Responsibilities:
 * 1. Block modification of sensitive files (.env, credentials, SSH keys, etc.)
 * 2. Allow safe exceptions (.env.example, .env.sample, .env.template)
 * 3. Log all file operations to audit trail
 *
 * Exit codes:
 * - 0: Allow operation
 * - 2: Block operation (security)
 */

const {
  readStdinJson,
  logError,
  appendToLog,
} = require('../lib/utils.cjs');
const {
  isSensitiveFile,
} = require('../lib/security-patterns.cjs');

async function main() {
  try {
    // Parse JSON input from stdin
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const filePath = toolInput.file_path || '';
    const sessionId = input.session_id || 'unknown';
    const toolName = input.tool_name || 'Edit';

    // Skip if no file path
    if (!filePath) {
      process.exit(0);
    }

    // Log to audit trail
    appendToLog('pre-tool-use', {
      session_id: sessionId,
      tool_name: toolName,
      file_path: filePath,
      action: 'checking',
    });

    // Check for sensitive files
    const sensitiveCheck = isSensitiveFile(filePath);
    if (sensitiveCheck.blocked) {
      logError(`[Hook] BLOCKED: ${sensitiveCheck.reason}`);
      logError(`[Hook] File: ${filePath}`);
      appendToLog('pre-tool-use', {
        session_id: sessionId,
        tool_name: toolName,
        file_path: filePath,
        action: 'blocked',
        reason: sensitiveCheck.reason,
      });
      process.exit(2);
    }

    // File is allowed - exit silently
    process.exit(0);
  } catch (err) {
    // Fail open on errors (don't block on hook failures)
    logError(`[Hook] Warning: pre-tool-use-file error: ${err.message}`);
    process.exit(0);
  }
}

main();
