/**
 * Cross-platform utility functions for Claude Code hooks and scripts
 * Works on Windows, macOS, and Linux
 *
 * Adapted from everything-claude-code for react-basecamp
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

// Platform detection
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

/**
 * Get the user's home directory (cross-platform)
 * @returns {string} - User's home directory path
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Get the Claude config directory
 * @returns {string} - Path to ~/.claude directory
 */
function getClaudeDir() {
  return path.join(getHomeDir(), '.claude');
}

/**
 * Get the sessions directory
 * @returns {string} - Path to ~/.claude/sessions directory
 */
function getSessionsDir() {
  return path.join(getClaudeDir(), 'sessions');
}

/**
 * Get the learned skills directory
 * @returns {string} - Path to ~/.claude/skills/learned directory
 */
function getLearnedSkillsDir() {
  return path.join(getClaudeDir(), 'skills', 'learned');
}

/**
 * Get the temp directory (cross-platform)
 * @returns {string} - System temporary directory path
 */
function getTempDir() {
  return os.tmpdir();
}

/**
 * Ensure a directory exists (create if not)
 * @param {string} dirPath - Directory path to ensure exists
 * @returns {string} - The directory path
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format
 * @returns {string} - Formatted time string
 */
function getTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get current datetime in YYYY-MM-DD HH:MM:SS format
 * @returns {string} - Formatted datetime string
 */
function getDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Find files matching a pattern in a directory (cross-platform alternative to find)
 * @param {string} dir - Directory to search
 * @param {string} pattern - File pattern (e.g., "*.tmp", "*.md")
 * @param {object} options - Options { maxAge: days, recursive: boolean }
 */
function findFiles(dir, pattern, options = {}) {
  const { maxAge = null, recursive = false } = options;
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);

  function searchDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isFile() && regex.test(entry.name)) {
          if (maxAge !== null) {
            const stats = fs.statSync(fullPath);
            const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            if (ageInDays <= maxAge) {
              results.push({ path: fullPath, mtime: stats.mtimeMs });
            }
          } else {
            const stats = fs.statSync(fullPath);
            results.push({ path: fullPath, mtime: stats.mtimeMs });
          }
        } else if (entry.isDirectory() && recursive) {
          searchDir(fullPath);
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }

  searchDir(dir);

  // Sort by modification time (newest first)
  results.sort((a, b) => b.mtime - a.mtime);

  return results;
}

/**
 * Read JSON from stdin (for hook input)
 * @returns {Promise<object>} - Parsed JSON object from stdin
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        if (data.trim()) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (err) {
        reject(err);
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Log to stderr (visible to user in Claude Code)
 * @deprecated Use logError() for clarity
 * @param {string} message - The message to log
 */
function log(message) {
  console.error(message);
}

/**
 * Output to stdout (returned to Claude)
 * @deprecated Use logContext() for clarity
 * @param {string|object} data - Data to output
 */
function output(data) {
  if (typeof data === 'object') {
    console.log(JSON.stringify(data));
  } else {
    console.log(data);
  }
}

/**
 * Log error/status message to stderr (visible to user)
 * Use this for warnings, errors, and status messages
 * @param {string} message - The message to log
 */
function logError(message) {
  console.error(message);
}

/**
 * Log context to stdout (adds to Claude's context)
 * Use this for injecting context that Claude should see
 * @param {string} message - The context to inject
 */
function logContext(message) {
  console.log(message);
}

/**
 * Get the git repository root directory
 * @returns {string|null} Repository root path or null if not in a repo
 */
function getGitRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Get the logs directory for audit logging
 * Uses git repository root if available, otherwise falls back to cwd
 * @returns {string} Path to .claude/logs in project root
 */
function getLogsDir() {
  // Try to get git repository root first
  const gitRoot = getGitRoot();
  const root = gitRoot || process.cwd();
  return path.join(root, '.claude', 'logs');
}

/**
 * Get git status information (branch and uncommitted count)
 * DEPRECATED: Use getGitStatus() from git-utils.cjs instead
 * This function has been moved to git-utils.cjs with enhanced features
 * @returns {string|null} Git status string or null if not in repo
 */
function getGitStatus() {
  // Import from git-utils for compatibility
  const { getGitStatus: getGitStatusNew } = require('./git-utils.cjs');
  return getGitStatusNew('short');
}

/**
 * Read and truncate a context file
 * Shared helper used by session-start and other hooks
 * @param {string} filePath - Path to the file
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string|null} File content or null if empty/missing
 */
function readContextFile(filePath, maxLength) {
  const content = readFile(filePath);
  if (!content) {
    return null;
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.substring(0, maxLength) + '\n... (truncated)';
}

/**
 * Append data to a JSON log file with rotation
 * Keeps last MAX_LOG_ENTRIES entries
 * @param {string} logName - Name of the log file (without extension)
 * @param {object} data - Data to append
 * @param {number} maxEntries - Maximum entries to keep (default 1000)
 */
function appendToLog(logName, data, maxEntries = 1000) {
  try {
    const logsDir = getLogsDir();
    ensureDir(logsDir);

    const logPath = path.join(logsDir, `${logName}.json`);
    let entries = [];

    // Read existing entries
    if (fs.existsSync(logPath)) {
      try {
        const content = fs.readFileSync(logPath, 'utf8');
        entries = JSON.parse(content);
        if (!Array.isArray(entries)) {
          entries = [];
        }
      } catch {
        entries = [];
      }
    }

    // Add new entry with timestamp
    entries.push({
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Rotate if exceeds max
    if (entries.length > maxEntries) {
      entries = entries.slice(-maxEntries);
    }

    // Write back
    fs.writeFileSync(logPath, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    // Fail silently - don't break hooks on logging errors
    logError(`[Hook] Warning: Failed to write to log: ${err.message}`);
  }
}

/**
 * Append a text message to a log file
 * Used for operation logging (e.g., start-operations.log)
 * @param {string} logName - Name of the log file (without .log extension)
 * @param {string} message - Message to log
 * @returns {boolean} - True if successful, false otherwise
 */
function appendToTextLog(logName, message) {
  try {
    const logsDir = getLogsDir();
    ensureDir(logsDir);

    const logPath = path.join(logsDir, `${logName}.log`);
    const timestamp = getDateTimeString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(logPath, logEntry, 'utf8');
    return true;
  } catch (err) {
    // Fail silently - don't break operations on logging errors
    logError(`Warning: Failed to write to log file: ${err.message}`);
    return false;
  }
}

/**
 * Read a text file safely
 * @param {string} filePath - Path to the file to read
 * @returns {string|null} - File content or null if not found
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Write a text file
 * @param {string} filePath - Path to the file to write
 * @param {string} content - Content to write
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Append to a text file
 */
function appendFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf8');
}

/**
 * Check if a command exists in PATH
 * @param {string} cmd - Command name to check
 * @returns {boolean} - True if command exists in PATH
 */
function commandExists(cmd) {
  try {
    if (isWindows) {
      execSync(`where ${cmd}`, { stdio: 'pipe' });
    } else {
      execSync(`which ${cmd}`, { stdio: 'pipe' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a command and return output
 * @param {string} cmd - Command to execute
 * @param {object} options - Options to pass to execSync
 * @returns {object} - Result object with success and output properties
 */
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, output: err.stderr || err.message };
  }
}

/**
 * Check if current directory is a git repository
 * @returns {boolean} - True if inside a git repository
 */
function isGitRepo() {
  return runCommand('git rev-parse --git-dir').success;
}


module.exports = {
  // Platform info
  isWindows,
  isMacOS,
  isLinux,

  // Directories
  getHomeDir,
  getClaudeDir,
  getSessionsDir,
  getLearnedSkillsDir,
  getTempDir,
  ensureDir,
  getGitRoot,

  // Date/Time
  getDateString,
  getTimeString,
  getDateTimeString,

  // File operations
  findFiles,
  readFile,
  writeFile,

  // Hook I/O
  readStdinJson,
  log,       // deprecated, use logError
  output,    // deprecated, use logContext
  logError,
  logContext,
  appendToLog,
  appendToTextLog,
  getLogsDir,

  // System
  commandExists,
  runCommand,
  isGitRepo,

  // Shared hook helpers
  getGitStatus,
  readContextFile,
};
