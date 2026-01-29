/**
 * Verification Utilities
 * Shared functions for running lint, typecheck, tests, build.
 * T012: DRY Refactoring
 */

const { execSync } = require('child_process');

// Timeout constants for verification commands
const TIER1_TIMEOUT = 30000;  // 30 seconds for fast checks (lint, typecheck)
const TIER2_TIMEOUT = 120000; // 2 minutes for slow checks (tests, build)

/**
 * Run lint check
 * @returns {{ passed: boolean, output?: string, errors?: number }}
 */
function runLint() {
  try {
    const output = execSync('pnpm lint', {
      encoding: 'utf8',
      timeout: TIER1_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output: output.trim() };
  } catch (err) {
    return {
      passed: false,
      output: err.stdout?.toString().trim(),
      error: err.stderr?.toString().trim() || err.message
    };
  }
}

/**
 * Run typecheck
 * @returns {{ passed: boolean, output?: string, errors?: number }}
 */
function runTypecheck() {
  try {
    const output = execSync('pnpm typecheck', {
      encoding: 'utf8',
      timeout: TIER1_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output: output.trim() };
  } catch (err) {
    return {
      passed: false,
      output: err.stdout?.toString().trim(),
      error: err.stderr?.toString().trim() || err.message
    };
  }
}

/**
 * Run tests
 * @param {object} options - Options
 * @param {boolean} options.coverage - Include coverage
 * @returns {{ passed: boolean, output?: string, testCount?: number, coverage?: number }}
 */
function runTests(options = {}) {
  const cmd = options.coverage ? 'pnpm test:run --coverage' : 'pnpm test:run';
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: TIER2_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output: output.trim() };
  } catch (err) {
    return {
      passed: false,
      output: err.stdout?.toString().trim(),
      error: err.stderr?.toString().trim() || err.message
    };
  }
}

/**
 * Run build
 * @returns {{ passed: boolean, output?: string }}
 */
function runBuild() {
  try {
    const output = execSync('pnpm build', {
      encoding: 'utf8',
      timeout: TIER2_TIMEOUT,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { passed: true, output: output.trim() };
  } catch (err) {
    return {
      passed: false,
      output: err.stdout?.toString().trim(),
      error: err.stderr?.toString().trim() || err.message
    };
  }
}

/**
 * Run all verifications
 * @param {object} options - Which checks to run
 * @returns {{ lint: object, typecheck: object, tests: object, build: object }}
 */
async function runAllVerifications(options = { lint: true, typecheck: true, tests: true, build: false }) {
  const results = {};

  if (options.lint) results.lint = runLint();
  if (options.typecheck) results.typecheck = runTypecheck();
  if (options.tests) results.tests = runTests({ coverage: options.coverage });
  if (options.build) results.build = runBuild();

  return results;
}

module.exports = {
  runLint,
  runTypecheck,
  runTests,
  runBuild,
  runAllVerifications
};
