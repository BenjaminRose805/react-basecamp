#!/usr/bin/env node
/**
 * User prompt submit hook - ZERO INJECTION APPROACH
 *
 * Purpose: Reserved for future user-facing notifications via stderr only.
 *
 * IMPORTANT: This hook performs ZERO context injection (0 tokens to stdout).
 * All context loading is now handled by role-specific hooks:
 * - inject-rules.cjs: Loads relevant .claude/docs/rules/*.md based on agent role
 * - load-orchestrator-rules.cjs: Loads agents.md for /plan, /implement, /ship
 *
 * Why zero injection?
 * - Eliminates redundant context on every prompt
 * - Reduces token waste (git status, CONTEXT.md, TODO.md previously loaded every time)
 * - Role-specific hooks load only what's needed when needed
 *
 * Output:
 * - stdout: NONE (0 tokens)
 * - stderr: Reserved for user notifications (currently none)
 *
 * Exit codes:
 * - 0: Always (no blocking behavior)
 */

const {
  readStdinJson,
} = require('../lib/utils.cjs');

async function main() {
  try {
    // Parse JSON input (optional, may be empty)
    await readStdinJson();

    // ZERO INJECTION: No stdout output
    // All context loading is delegated to role-specific hooks

    // Always exit 0
    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on errors
    process.exit(0);
  }
}

main();
