#!/usr/bin/env node
/**
 * User prompt submit hook for context injection
 *
 * Responsibilities:
 * 1. Inject git status (branch + uncommitted count) via stdout
 * 2. Inject .claude/CONTEXT.md content (max 1000 chars) via stdout
 * 3. Inject TODO.md content (max 500 chars) via stdout
 *
 * Output goes to stdout which adds to Claude's context.
 * Silent if no context available.
 *
 * Exit codes:
 * - 0: Always (context injection should not block)
 */

const path = require('path');
const {
  readStdinJson,
  logContext,
  getGitStatus,
  readContextFile,
} = require('../lib/utils.cjs');

async function main() {
  try {
    // Parse JSON input (optional, may be empty)
    await readStdinJson();

    const contextParts = [];

    // Get git status
    const gitStatus = getGitStatus();
    if (gitStatus) {
      contextParts.push(`**Git:** ${gitStatus}`);
    }

    // Check for CONTEXT.md
    const contextMdPath = path.join(process.cwd(), '.claude', 'CONTEXT.md');
    const contextMd = readContextFile(contextMdPath, 1000);
    if (contextMd) {
      contextParts.push(`**Context:**\n${contextMd}`);
    }

    // Check for TODO.md
    const todoPath = path.join(process.cwd(), 'TODO.md');
    const todoContent = readContextFile(todoPath, 500);
    if (todoContent) {
      contextParts.push(`**TODO:**\n${todoContent}`);
    }

    // Output context if we have any
    if (contextParts.length > 0) {
      logContext('\n---\n' + contextParts.join('\n\n') + '\n---\n');
    }

    // Always exit 0
    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on context injection errors
    process.exit(0);
  }
}

main();
