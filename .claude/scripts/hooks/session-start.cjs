#!/usr/bin/env node
/**
 * SessionStart Hook - ZERO INJECTION APPROACH
 *
 * Purpose: Session initialization and user-facing status messages via stderr only.
 *
 * IMPORTANT: This hook performs ZERO context injection (0 tokens to stdout).
 * All context loading is now handled by role-specific hooks:
 * - inject-rules.cjs: Loads relevant .claude/docs/rules/*.md based on agent role
 * - load-orchestrator-rules.cjs: Loads agents.md for /plan, /implement, /ship
 *
 * Why zero injection?
 * - Eliminates massive upfront context load (sessions, skills, git status, CONTEXT.md, TODO.md)
 * - Reduces initial token waste significantly
 * - Role-specific hooks load only what's needed when needed
 * - Session metadata (previous sessions, skills) rarely affects immediate behavior
 *
 * What this hook DOES do:
 * - Ensures necessary directories exist (.claude/sessions, .claude/learned)
 * - Detects and reports package manager to user (stderr only)
 *
 * Output:
 * - stdout: NONE (0 tokens)
 * - stderr: Package manager detection, user notifications
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Exit codes:
 * - 0: Always (no blocking behavior)
 */

const {
  getSessionsDir,
  getLearnedSkillsDir,
  ensureDir,
  logError,
} = require('../lib/utils.cjs');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager.cjs');

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // Ensure directories exist (infrastructure setup)
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // ZERO INJECTION: No stdout output
  // All context loading is delegated to role-specific hooks

  // Detect and report package manager (stderr for user visibility)
  const pm = getPackageManager();
  logError(`[Hook] Package manager: ${pm.name} (${pm.source})`);

  // If package manager was detected via fallback, show selection prompt
  if (pm.source === 'fallback' || pm.source === 'default') {
    logError('[Hook] No package manager preference found.');
    logError(getSelectionPrompt());
  }

  process.exit(0);
}

main().catch(err => {
  logError('[Hook] SessionStart error: ' + err.message);
  process.exit(0); // Don't block on errors
});
