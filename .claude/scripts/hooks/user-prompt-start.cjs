#!/usr/bin/env node
/**
 * UserPromptSubmit Hook for /start Command
 *
 * Triggers when user runs /start command and performs:
 * 1. Environment check (dependencies, tooling, verification, git)
 * 2. Generates report and injects context into Claude
 * 3. Writes state file for later reference
 *
 * Exit codes:
 * - 0: Always (detection should not block)
 *
 * T011: Refactored to use createHook factory for DRY
 */

const path = require('path');
const { logError } = require('../lib/utils.cjs');
const { createHook } = require('../lib/hook-base.cjs');
const { checkDirtyState } = require('../lib/git-utils.cjs');
const { environmentCheck, generateReport } = require('../environment-check.cjs');

/**
 * Hook logic for /start command
 * @param {object} input - Stdin JSON input
 * @param {object} flags - Parsed flags
 * @param {string} message - Trimmed message
 * @returns {string|null} - Context to inject or null
 */
async function runStartHook(input, flags, message) {
  // T001: Check for dirty state before proceeding
  const dirtyState = checkDirtyState();
  if (dirtyState.isDirty && !flags.force) {
    logError('\n⚠ Working directory has uncommitted changes:\n');
    const maxFilesToShow = 5;
    dirtyState.files.slice(0, maxFilesToShow).forEach(file => {
      logError(`  ${file.status.padEnd(2)} ${file.path}`);
    });
    if (dirtyState.files.length > maxFilesToShow) {
      logError(`  ... and ${dirtyState.files.length - maxFilesToShow} more file(s)`);
    }
    logError('\nCommit or stash changes before running /start.');
    logError('Or use /start --force to bypass this check.\n');

    // Inject warning context to Claude
    return `
---
**⚠ /start Blocked: Uncommitted Changes**

Working directory has ${dirtyState.files.length} uncommitted file(s).
Please commit or stash changes before starting work.

Use \`/start --force\` to bypass this check if needed.
---
`;
  }

  // Detect CI mode
  const skipPrompts = process.env.CI === 'true' || flags.yes;

  // Build options
  const options = {
    fullMode: flags.full,
    securityMode: flags.security,
    force: flags.force,
    ciMode: skipPrompts,
    skipPrompts
  };

  // Show what we're doing
  logError('Running environment check...');

  // Run environment check
  const results = await environmentCheck(options);

  // Generate report
  const report = generateReport(results);

  // Show report to user
  logError('\n' + report);

  // Inject summary context to Claude
  const summary = generateSummary(results);
  return `
---
**Environment Check Results**

${summary}

Full details written to: start-status.json
---
`;
}

/**
 * Generate a concise summary for Claude's context
 * @param {object} results - Environment check results
 * @returns {string} - Summary text
 */
function generateSummary(results) {
  const lines = [];

  // Overall status
  lines.push(`**Status:** ${results.status === 'ready' ? '✓ Ready' : '⚠ Issues Found'}`);
  lines.push('');

  // Dependencies
  if (results.dependencies.status === 'ok') {
    lines.push(`**Dependencies:** ✓ ${results.dependencies.packageManager} (${results.dependencies.installRequired ? 'installed' : 'up to date'})`);
  } else {
    lines.push(`**Dependencies:** ✗ ${results.dependencies.packageManager} install failed`);
  }

  // Tooling
  const toolingStatus = Object.entries(results.tooling).map(([name, result]) => {
    if (result.unsupported) return `${name}: unsupported`;
    if (!result.installed) return `${name}: not installed`;
    if (!result.authenticated && !result.skipped) return `${name}: not authenticated`;
    return `${name}: ✓`;
  });
  lines.push(`**Tooling:** ${toolingStatus.join(', ')}`);

  // Verification
  const verificationStatus = Object.entries(results.verification)
    .filter(([_, result]) => result.status !== 'skipped')
    .map(([name, result]) => {
      if (result.status === 'pass' || result.status === 'fixed') return `${name}: ✓`;
      return `${name}: ✗ (${result.errors} errors)`;
    });
  if (verificationStatus.length > 0) {
    lines.push(`**Verification:** ${verificationStatus.join(', ')}`);
  }

  // Git
  if (results.git.error) {
    lines.push(`**Git:** ⚠ ${results.git.error}`);
  } else {
    const gitParts = [results.git.branch];
    if (!results.git.clean) gitParts.push('uncommitted changes');
    if (!results.git.upToDate) gitParts.push(`${results.git.ahead} ahead, ${results.git.behind} behind`);
    lines.push(`**Git:** ${gitParts.join(', ')}`);
  }

  // Security Audit
  if (results.security && results.security.status === 'completed') {
    const vulns = results.security.vulnerabilities;
    const totalVulns = vulns.critical + vulns.high + vulns.moderate + vulns.low + vulns.info;

    lines.push('');
    if (totalVulns === 0) {
      lines.push('**Security Audit:** ✓ No vulnerabilities found');
    } else {
      const parts = [];
      if (vulns.critical > 0) parts.push(`${vulns.critical} critical`);
      if (vulns.high > 0) parts.push(`${vulns.high} high`);
      if (vulns.moderate > 0) parts.push(`${vulns.moderate} moderate`);
      if (vulns.low > 0) parts.push(`${vulns.low} low`);
      if (vulns.info > 0) parts.push(`${vulns.info} info`);

      lines.push(`**Security Audit:** ⚠ ${parts.join(', ')} vulnerabilities`);
      lines.push('  - Run \`pnpm audit\` for details');
    }
  }

  // Issues
  if (results.issues.length > 0) {
    lines.push('');
    lines.push(`**Issues (${results.issues.length}):**`);
    const criticalIssues = results.issues.filter(i => i.severity === 'critical');
    const warningIssues = results.issues.filter(i => i.severity === 'warning');

    if (criticalIssues.length > 0) {
      criticalIssues.forEach(issue => {
        lines.push(`- ✗ ${issue.message}`);
      });
    }
    if (warningIssues.length > 0 && warningIssues.length <= 3) {
      warningIssues.forEach(issue => {
        lines.push(`- ⚠ ${issue.message}`);
      });
    } else if (warningIssues.length > 3) {
      lines.push(`- ⚠ ${warningIssues.length} warnings (see report)`);
    }
  }

  return lines.join('\n');
}

// Create and run hook using factory (T011)
const main = createHook({
  name: 'start',
  command: 'start',
  flagDefinitions: {
    full: 'boolean',
    security: 'boolean',
    force: 'boolean',  // T001: Add --force flag to bypass dirty state check
    yes: 'boolean'     // T021: Add --yes flag for CI mode
  },
  run: runStartHook
});

main();
