#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts.
 * - Checks for recent session files
 * - Injects context from .claude/CONTEXT.md and TODO.md
 * - Reports git status
 * - Detects package manager
 *
 * Output:
 * - stdout: Context injection (adds to Claude's context)
 * - stderr: Status messages (visible to user)
 */

const path = require('path');
const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  logError,
  logContext,
  readFile,
  isGitRepo,
  runCommand,
} = require('../lib/utils.cjs');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager.cjs');

/**
 * Get git status information
 * @returns {string|null} Git status string or null if not in repo
 */
function getGitStatus() {
  if (!isGitRepo()) {
    return null;
  }

  const branchResult = runCommand('git rev-parse --abbrev-ref HEAD');
  const branch = branchResult.success ? branchResult.output : 'unknown';

  const statusResult = runCommand('git status --porcelain');
  const uncommittedCount = statusResult.success
    ? statusResult.output.split('\n').filter(Boolean).length
    : 0;

  if (uncommittedCount === 0) {
    return `Branch: ${branch} (clean)`;
  }
  return `Branch: ${branch} | ${uncommittedCount} uncommitted file(s)`;
}

/**
 * Read and truncate a context file
 */
function readContextFile(filePath, maxLength) {
  const content = readFile(filePath);
  if (!content) return null;

  const trimmed = content.trim();
  if (trimmed.length === 0) return null;

  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '\n... (truncated)';
}

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // Build context for injection
  const contextParts = [];

  // Check for recent session files (last 7 days)
  const recentSessions = findFiles(sessionsDir, '*.tmp', { maxAge: 7 });
  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    contextParts.push(`**Previous Sessions:** ${recentSessions.length} recent session(s) found`);
    contextParts.push(`**Latest:** ${latest.path}`);
    logError(`[Hook] Found ${recentSessions.length} recent session(s)`);
  }

  // Check for learned skills
  const learnedSkills = findFiles(learnedDir, '*.md');
  if (learnedSkills.length > 0) {
    contextParts.push(`**Learned Skills:** ${learnedSkills.length} available in ${learnedDir}`);
  }

  // Git status
  const gitStatus = getGitStatus();
  if (gitStatus) {
    contextParts.push(`**Git:** ${gitStatus}`);
  }

  // Load .claude/CONTEXT.md if exists
  const contextMdPath = path.join(process.cwd(), '.claude', 'CONTEXT.md');
  const contextMd = readContextFile(contextMdPath, 1000);
  if (contextMd) {
    contextParts.push(`**Project Context:**\n${contextMd}`);
  }

  // Load TODO.md if exists
  const todoPath = path.join(process.cwd(), 'TODO.md');
  const todoContent = readContextFile(todoPath, 500);
  if (todoContent) {
    contextParts.push(`**TODO:**\n${todoContent}`);
  }

  // Inject context via stdout
  if (contextParts.length > 0) {
    logContext('\n---\n**Session Context**\n' + contextParts.join('\n\n') + '\n---\n');
  }

  // Detect and report package manager (stderr for visibility)
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
