/**
 * Free quality checks (Tier 1 and Tier 2)
 * Tier 1: Fast checks (lint, typecheck, format)
 * Tier 2: Expensive checks (secrets, build, tests)
 */

const { spawn } = require('child_process');
const { runCommand } = require('./utils.cjs');
const { scanFiles } = require('./secret-scanner.cjs');

/**
 * Run a command with timeout
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{status: string, stdout: string, stderr: string, exit_code: number}>}
 */
function runCommandWithTimeout(command, args, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');

      // Force kill after 2 seconds if still running
      setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch (err) {
          // Process already exited
        }
      }, 2000);
    }, timeout);

    // Collect stdout
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle completion
    proc.on('close', (code) => {
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;

      if (timedOut) {
        resolve({
          status: 'fail',
          stdout: stdout,
          stderr: stderr + `\n[Timeout: killed after ${elapsed}ms]`,
          exit_code: -1,
        });
      } else {
        resolve({
          status: code === 0 ? 'pass' : 'fail',
          stdout: stdout,
          stderr: stderr,
          exit_code: code,
        });
      }
    });

    // Handle errors
    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        status: 'fail',
        stdout: stdout,
        stderr: stderr + `\n[Error: ${err.message}]`,
        exit_code: -1,
      });
    });
  });
}

/**
 * Check if a pnpm script exists in package.json
 * @param {string} scriptName - Name of the script to check
 * @returns {boolean}
 */
function hasScript(scriptName) {
  const fs = require('fs');
  const path = require('path');

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return !!(packageJson.scripts && packageJson.scripts[scriptName]);
  } catch (err) {
    return false;
  }
}

/**
 * Run Tier 1 checks (fast quality checks)
 * @returns {Promise<{status: string, elapsed_ms: number, details: object}>}
 */
async function runTier1Checks() {
  const startTime = Date.now();

  // Run checks in parallel
  const checksToRun = [
    { name: 'lint', command: 'pnpm', args: ['lint'], timeout: 30000 },
    { name: 'typecheck', command: 'pnpm', args: ['typecheck'], timeout: 30000 },
  ];

  // Only run format check if the script exists
  if (hasScript('format:check')) {
    checksToRun.push({
      name: 'format',
      command: 'pnpm',
      args: ['format:check'],
      timeout: 30000,
    });
  }

  const results = await Promise.all(
    checksToRun.map(({ name, command, args, timeout }) =>
      runCommandWithTimeout(command, args, timeout).then(result => ({
        name,
        result,
      }))
    )
  );

  // Build details object
  const details = {};
  let overallStatus = 'pass';

  for (const { name, result } of results) {
    details[name] = result;
    if (result.status === 'fail') {
      overallStatus = 'fail';
    }
  }

  const elapsed = Date.now() - startTime;

  return {
    status: overallStatus,
    elapsed_ms: elapsed,
    details: details,
  };
}

/**
 * Get staged files from git
 * @returns {Promise<string[]>} Array of file paths
 */
async function getStagedFiles() {
  const result = runCommand('git diff --cached --name-only --diff-filter=ACM');
  if (!result.success || !result.output) {
    return [];
  }

  const files = result.output
    .split('\n')
    .filter(Boolean)
    .map(file => {
      const path = require('path');
      return path.resolve(process.cwd(), file);
    });

  return files;
}

/**
 * Run Tier 2 checks (expensive quality checks)
 * Runs sequentially with early exit on failure
 * @returns {Promise<{status: string, elapsed_ms: number, stopped_at: string|null, details: object}>}
 */
async function runTier2Checks() {
  const startTime = Date.now();
  const totalTimeout = 120000; // 2 minutes
  let stoppedAt = null;
  const details = {};

  try {
    // Step 1: Get staged files
    const stagedFiles = await getStagedFiles();

    // Step 2: Run secret scan
    const secretScanStart = Date.now();
    const secretResult = await scanFiles(stagedFiles);
    const secretScanElapsed = Date.now() - secretScanStart;

    details.secrets = {
      status: secretResult.status,
      matches: secretResult.matches,
      elapsed_ms: secretScanElapsed,
    };

    // Early exit if secrets found
    if (secretResult.status === 'fail') {
      stoppedAt = 'secrets';
      return {
        status: 'fail',
        elapsed_ms: Date.now() - startTime,
        stopped_at: stoppedAt,
        details: details,
      };
    }

    // Check timeout
    if (Date.now() - startTime > totalTimeout) {
      stoppedAt = 'timeout';
      return {
        status: 'fail',
        elapsed_ms: Date.now() - startTime,
        stopped_at: stoppedAt,
        details: details,
      };
    }

    // Step 3: Run build
    const buildResult = await runCommandWithTimeout(
      'pnpm',
      ['build'],
      Math.min(60000, totalTimeout - (Date.now() - startTime))
    );

    details.build = buildResult;

    // Early exit if build fails
    if (buildResult.status === 'fail') {
      stoppedAt = 'build';
      return {
        status: 'fail',
        elapsed_ms: Date.now() - startTime,
        stopped_at: stoppedAt,
        details: details,
      };
    }

    // Check timeout
    if (Date.now() - startTime > totalTimeout) {
      stoppedAt = 'timeout';
      return {
        status: 'fail',
        elapsed_ms: Date.now() - startTime,
        stopped_at: stoppedAt,
        details: details,
      };
    }

    // Step 4: Run tests
    const testResult = await runCommandWithTimeout(
      'pnpm',
      ['test'],
      Math.min(60000, totalTimeout - (Date.now() - startTime))
    );

    details.test = testResult;

    // Determine final status
    const finalStatus = testResult.status === 'pass' ? 'pass' : 'fail';
    if (finalStatus === 'fail') {
      stoppedAt = 'test';
    }

    return {
      status: finalStatus,
      elapsed_ms: Date.now() - startTime,
      stopped_at: stoppedAt,
      details: details,
    };

  } catch (err) {
    // Handle unexpected errors
    return {
      status: 'fail',
      elapsed_ms: Date.now() - startTime,
      stopped_at: stoppedAt || 'error',
      details: {
        ...details,
        error: {
          status: 'fail',
          message: err.message,
          stack: err.stack,
        },
      },
    };
  }
}

module.exports = {
  runTier1Checks,
  runTier2Checks,
};
