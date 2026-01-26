#!/usr/bin/env node
/**
 * Continuous Learning - Session Evaluator
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on Stop hook to evaluate sessions for extractable patterns.
 * - Checks if session is long enough
 * - Signals to Claude that patterns could be extracted
 *
 * Output: stderr only (status messages visible to user)
 */

const path = require('path');
const fs = require('fs');
const {
  getLearnedSkillsDir,
  ensureDir,
  readFile,
  countInFile,
  logError,
} = require('../lib/utils.cjs');

async function main() {
  // Get script directory to find config
  const scriptDir = __dirname;
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'continuous-learning', 'config.json');

  // Default configuration
  let minSessionLength = 10;
  let learnedSkillsPath = getLearnedSkillsDir();

  // Load config if exists
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      const config = JSON.parse(configContent);
      minSessionLength = config.min_session_length || 10;

      if (config.learned_skills_path) {
        learnedSkillsPath = config.learned_skills_path.replace(/^~/, require('os').homedir());
      }
    } catch {
      // Invalid config, use defaults
    }
  }

  // Ensure learned skills directory exists
  ensureDir(learnedSkillsPath);

  // Get transcript path from environment (set by Claude Code)
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  // Handle missing transcript gracefully (exit silently)
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // Count user messages in session
  const messageCount = countInFile(transcriptPath, /"type":"user"/g);

  // Skip short sessions (silently)
  if (messageCount < minSessionLength) {
    process.exit(0);
  }

  // Signal to Claude that session should be evaluated for extractable patterns
  logError(`[Hook] Session has ${messageCount} messages - evaluate for extractable patterns`);
  logError(`[Hook] Save learned skills to: ${learnedSkillsPath}`);

  process.exit(0);
}

main().catch(err => {
  logError('[Hook] EvaluateSession error: ' + err.message);
  process.exit(0);
});
