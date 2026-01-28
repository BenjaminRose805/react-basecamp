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
 */

const path = require('path');
const {
  readStdinJson,
  logContext,
  logError,
} = require('../lib/utils.cjs');
const { environmentCheck, generateReport } = require('../environment-check.cjs');

// Command pattern for /start
const START_PATTERN = /^\/start\b/i;

async function main() {
  try {
    const input = await readStdinJson();
    const message = input.message || input.prompt || '';

    // Skip if not a user message or empty
    if (!message || typeof message !== 'string') {
      process.exit(0);
    }

    const trimmedMessage = message.trim();

    // Check if this is a /start command
    if (!START_PATTERN.test(trimmedMessage)) {
      process.exit(0);
    }

    // Parse flags
    const flags = {
      full: /--full\b/.test(trimmedMessage),
      security: /--security\b/.test(trimmedMessage)
    };

    // Detect CI mode
    const skipPrompts = process.env.CI === 'true';

    // Build options
    const options = {
      fullMode: flags.full,
      securityMode: flags.security,
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
    logContext(`
---
**Environment Check Results**

${summary}

Full details written to: start-status.json
---
`);

    process.exit(0);
  } catch (err) {
    // Fail silently - don't block on detection errors
    logError(`[Hook] Error in user-prompt-start: ${err.message}`);
    process.exit(0);
  }
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

main();
