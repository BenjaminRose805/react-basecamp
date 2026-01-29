#!/usr/bin/env node
/**
 * Git Utility Functions
 * Extended git operations for /start command safety checks
 */

const { runCommand, isGitRepo } = require('./utils.cjs');

/**
 * Check if working directory has uncommitted changes
 * T001: Dirty State Protection
 * @returns {object} { isDirty: boolean, files: Array<{status: string, path: string}> }
 */
function checkDirtyState() {
  const result = {
    isDirty: false,
    files: []
  };

  if (!isGitRepo()) {
    return result;
  }

  try {
    const statusResult = runCommand('git status --porcelain');
    if (!statusResult.success) {
      return result;
    }

    const lines = statusResult.output.split('\n').filter(Boolean);
    if (lines.length > 0) {
      result.isDirty = true;
      result.files = lines.map(line => {
        const match = line.match(/^([ MADRCU?!]{2})\s+(.+)$/);
        if (match) {
          return { status: match[1].trim() || '??', path: match[2] };
        }
        return { status: '??', path: line.trim() };
      });
    }

    return result;
  } catch (err) {
    return result;
  }
}

/**
 * Check if a branch exists locally or remotely
 * T002: Branch Existence Validation
 * @param {string} branchName - Name of the branch to check
 * @returns {object} { exists: boolean, lastCommit: string|null, age: string|null }
 */
function getBranchExists(branchName) {
  const result = {
    exists: false,
    lastCommit: null,
    age: null
  };

  if (!isGitRepo() || !branchName) {
    return result;
  }

  try {
    // Check local branches first
    const localCheck = runCommand(`git rev-parse --verify refs/heads/${branchName}`);
    if (localCheck.success) {
      result.exists = true;
    } else {
      // Check remote branches
      const remoteCheck = runCommand(`git rev-parse --verify refs/remotes/origin/${branchName}`);
      if (remoteCheck.success) {
        result.exists = true;
      }
    }

    if (result.exists) {
      // Get last commit info
      try {
        const commitResult = runCommand(`git log -1 --format="%h %s" ${branchName}`);
        if (commitResult.success) {
          result.lastCommit = commitResult.output;
        }
      } catch (err) {
        // Ignore errors for commit info
      }

      // Get age
      try {
        const ageResult = runCommand(`git log -1 --format="%cr" ${branchName}`);
        if (ageResult.success) {
          result.age = ageResult.output;
        }
      } catch (err) {
        // Ignore errors for age info
      }
    }

    return result;
  } catch (err) {
    return result;
  }
}

/**
 * Get git status with flexible formatting
 * Extended version of utils.cjs getGitStatus()
 * @param {string} format - Output format: 'short' | 'long' | 'json'
 * @returns {string|object|null} Formatted git status or null if not in repo
 */
function getGitStatus(format = 'short') {
  if (!isGitRepo()) {
    return null;
  }

  try {
    const branchResult = runCommand('git rev-parse --abbrev-ref HEAD');
    const branch = branchResult.success ? branchResult.output : 'unknown';

    const statusResult = runCommand('git status --porcelain');
    const lines = statusResult.success
      ? statusResult.output.split('\n').filter(Boolean)
      : [];
    const uncommittedCount = lines.length;
    const isClean = uncommittedCount === 0;

    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    let upToDate = true;
    try {
      const upstreamResult = runCommand('git rev-list --left-right --count HEAD...@{u}');
      if (upstreamResult.success) {
        const counts = upstreamResult.output.split('\t');
        ahead = parseInt(counts[0]) || 0;
        behind = parseInt(counts[1]) || 0;
        upToDate = ahead === 0 && behind === 0;
      }
    } catch (err) {
      // No upstream branch - treat as up to date
    }

    // Format output based on requested format
    if (format === 'json') {
      return {
        branch,
        clean: isClean,
        uncommittedCount,
        ahead,
        behind,
        upToDate,
        files: lines.map(line => {
          const match = line.match(/^([ MADRCU?!]{2})\s+(.+)$/);
          if (match) {
            return { status: match[1].trim() || '??', path: match[2] };
          }
          return { status: '??', path: line };
        })
      };
    } else if (format === 'long') {
      const parts = [`Branch: ${branch}`];
      if (isClean) {
        parts.push('Status: clean');
      } else {
        parts.push(`Status: ${uncommittedCount} uncommitted file(s)`);
      }
      if (!upToDate) {
        parts.push(`Remote: ${ahead} ahead, ${behind} behind`);
      } else {
        parts.push('Remote: up to date');
      }
      return parts.join(' | ');
    } else {
      // 'short' format (default)
      if (isClean) {
        return `Branch: ${branch} (clean)`;
      }
      return `Branch: ${branch} | ${uncommittedCount} uncommitted file(s)`;
    }
  } catch (err) {
    return null;
  }
}

/**
 * Get current branch name
 * @returns {string|null} Branch name or null if not in repo
 */
function getCurrentBranch() {
  if (!isGitRepo()) {
    return null;
  }

  const result = runCommand('git rev-parse --abbrev-ref HEAD');
  return result.success ? result.output : null;
}

module.exports = {
  checkDirtyState,
  getBranchExists,
  getGitStatus,
  getCurrentBranch
};
