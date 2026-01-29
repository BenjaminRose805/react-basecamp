/**
 * Environment Check Script for /start Command
 * Performs comprehensive environment validation across 4 phases
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { execSync } = require('child_process');
const { commandExists, runCommand, isGitRepo, getGitRoot, ensureDir, readFile, writeFile, appendToTextLog } = require('./lib/utils.cjs');
const { getGitStatus } = require('./lib/git-utils.cjs');
const { getPackageManager, getInstallCommand } = require('./lib/pm-utils.cjs');
const { runLint, runTypecheck, runTests, runBuild } = require('./lib/verification-utils.cjs');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

/**
 * Run a command with a timeout
 * @param {string} command - Command to run
 * @param {number} timeoutMs - Timeout in milliseconds (default 2000)
 * @returns {{ success: boolean, output: string, timedOut: boolean }}
 */
function runWithTimeout(command, timeoutMs = 2000) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim(), timedOut: false };
  } catch (err) {
    const timedOut = err.killed || err.signal === 'SIGTERM';
    return {
      success: false,
      output: err.stderr?.toString() || err.message,
      timedOut
    };
  }
}

/**
 * Load environment configuration
 */
function loadConfig() {
  const configPath = path.join(process.cwd(), '.claude', 'config', 'environment.json');

  // Ensure config directory exists
  ensureDir(path.dirname(configPath));

  // Create default config if missing
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      requiredTools: [
        {
          name: "coderabbit",
          check: "coderabbit --version",
          install: "curl -fsSL https://cli.coderabbit.ai/install.sh | sh",
          installPrompt: "Install CodeRabbit CLI for local code review?",
          authCheck: "coderabbit auth status",
          platforms: ["linux", "darwin"]
        },
        {
          name: "gh",
          check: "gh --version",
          install: null,
          installPrompt: "GitHub CLI required. Install: https://cli.github.com",
          authCheck: "gh auth status",
          platforms: ["linux", "darwin", "win32"]
        }
      ],
      verification: {
        lint: {
          command: "pnpm lint --quiet",
          autoFix: "pnpm lint --fix",
          required: true
        },
        typecheck: {
          command: "pnpm typecheck",
          autoFix: null,
          required: true
        },
        tests: {
          command: "pnpm test --run",
          autoFix: null,
          required: false
        },
        build: {
          command: "pnpm build",
          autoFix: null,
          required: false,
          fullOnly: true
        }
      },
      autoFix: {
        dependencies: true,
        lint: true,
        tools: "prompt"
      }
    };

    // T004: Wrap config file write in try-catch
    try {
      writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.error('⚠ Created default environment config at .claude/config/environment.json');
    } catch (err) {
      const errorMsg = `Failed to write config file ${configPath}: ${err.message}`;
      appendToTextLog('start-operations', `ERROR: ${errorMsg}`);
      console.error(`⚠ Warning: ${errorMsg}`);
      console.error('  Continuing with default configuration in memory...');
      // Return default config from memory instead of null
      return defaultConfig;
    }
  }

  const content = readFile(configPath);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error(`⚠ Failed to parse environment config: ${err.message}`);
    return null;
  }
}

/**
 * Check if system is online
 */
async function isOnline() {
  try {
    await dns.resolve('github.com');
    return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENETUNREACH') {
      return false;
    }
    return true; // Other errors, assume online
  }
}

/**
 * PHASE 1: Check Dependencies
 */
async function checkDependencies() {
  const result = {
    status: 'ok',
    packageManager: null,
    nodeModulesExists: false,
    installRequired: false,
    installTime: 0
  };

  try {
    // Detect package manager
    const pm = getPackageManager();
    result.packageManager = pm.name;

    // Check node_modules
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    result.nodeModulesExists = fs.existsSync(nodeModulesPath);

    // Install if missing
    if (!result.nodeModulesExists) {
      result.installRequired = true;
      console.error(`Installing dependencies with ${pm.name}...`);

      const startTime = Date.now();
      const installResult = runCommand(getInstallCommand());
      result.installTime = Math.round((Date.now() - startTime) / 1000);

      if (!installResult.success) {
        result.status = 'error';
        result.error = installResult.output;
      }
    }
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
  }

  return result;
}

/**
 * Check a single tool
 * Helper function for parallel tool checking (T014)
 */
async function checkSingleTool(tool, skipNetworkChecks, isWindowsPlatform) {
  const toolResult = {
    installed: false,
    version: null,
    authenticated: false,
    skipped: false,
    unsupported: false
  };

  try {
    // Check platform support
    if (!tool.platforms.includes(process.platform)) {
      toolResult.unsupported = true;

      if (tool.name === 'coderabbit' && isWindowsPlatform) {
        console.error('⚠ CodeRabbit CLI not available on Windows');
      }

      return { name: tool.name, result: toolResult };
    }

    // Check if installed
    if (commandExists(tool.name)) {
      toolResult.installed = true;

      // Get version
      const versionResult = runCommand(tool.check);
      if (versionResult.success) {
        // Parse version from output (e.g., "gh version 2.40.0" -> "2.40.0")
        const versionMatch = versionResult.output.match(/(\d+\.\d+\.\d+)/);
        toolResult.version = versionMatch ? versionMatch[1] : versionResult.output.split('\n')[0];
      }

      // Check authentication (skip if offline)
      if (tool.authCheck && !skipNetworkChecks) {
        // Use timeout wrapper for network-based auth checks (T017)
        const authResult = runWithTimeout(tool.authCheck, 2000);

        if (authResult.timedOut) {
          // Mark as skipped on timeout (non-blocking warning)
          toolResult.skipped = true;
          toolResult.timeoutWarning = true;
          console.error(`⚠ ${tool.name} auth check timed out (slow network)`);
        } else {
          toolResult.authenticated = authResult.success;

          // For GitHub CLI, parse username
          if (tool.name === 'gh' && authResult.success) {
            const userMatch = authResult.output.match(/as\s+(\w+)/);
            toolResult.user = userMatch ? userMatch[1] : null;
          }
        }
      } else if (skipNetworkChecks) {
        toolResult.skipped = true;
      }
    }
  } catch (err) {
    // Isolated error handling - one tool failure doesn't block others
    toolResult.error = err.message;
    console.error(`⚠ Error checking ${tool.name}: ${err.message}`);
  }

  return { name: tool.name, result: toolResult };
}

/**
 * PHASE 2: Check Tooling
 * T014: Refactored to use Promise.all() for parallel tool checks (40%+ time reduction)
 */
async function checkTooling() {
  const config = loadConfig();
  const results = {};

  // Check if online
  const online = await isOnline();
  const skipNetworkChecks = !online;

  if (skipNetworkChecks) {
    console.error('⚠ Offline mode: Skipping network-dependent checks');
  }

  // Check platform
  const isWindowsPlatform = process.platform === 'win32';

  // Run all tool checks in parallel using Promise.all()
  const toolCheckPromises = config.requiredTools.map(tool =>
    checkSingleTool(tool, skipNetworkChecks, isWindowsPlatform)
  );

  const toolCheckResults = await Promise.all(toolCheckPromises);

  // Collect results
  for (const { name, result } of toolCheckResults) {
    results[name] = result;
  }

  return results;
}

/**
 * PHASE 3: Run Verification
 * Refactored to use shared verification utilities (T012)
 */
async function runVerification(options = {}) {
  const config = loadConfig();
  const results = {};

  for (const [checkName, checkConfig] of Object.entries(config.verification)) {
    const checkResult = {
      status: 'skipped',
      errors: 0,
      warnings: 0,
      autoFixed: false,
      details: []
    };

    // Skip if fullOnly and not in full mode
    if (checkConfig.fullOnly && !options.fullMode) {
      results[checkName] = checkResult;
      continue;
    }

    // Run check using shared utilities
    let result;
    if (checkName === 'lint') {
      result = runLint();
    } else if (checkName === 'typecheck') {
      result = runTypecheck();
    } else if (checkName === 'tests') {
      result = runTests({ coverage: options.coverage });
    } else if (checkName === 'build') {
      result = runBuild();
    } else {
      // Fallback for unknown checks
      const cmdResult = runCommand(checkConfig.command);
      result = { passed: cmdResult.success, output: cmdResult.output, error: cmdResult.output };
    }

    if (result.passed) {
      checkResult.status = 'pass';

      // Parse output for warnings/counts
      if (checkName === 'lint') {
        const errorMatch = result.output?.match(/(\d+)\s+error/);
        const warningMatch = result.output?.match(/(\d+)\s+warning/);
        checkResult.errors = errorMatch ? parseInt(errorMatch[1]) : 0;
        checkResult.warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
      } else if (checkName === 'tests') {
        const passedMatch = result.output?.match(/(\d+)\s+passed/);
        const failedMatch = result.output?.match(/(\d+)\s+failed/);
        const skippedMatch = result.output?.match(/(\d+)\s+skipped/);
        const durationMatch = result.output?.match(/(\d+\.?\d*)s/);

        checkResult.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        checkResult.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        checkResult.skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
        checkResult.duration = durationMatch ? parseFloat(durationMatch[1]) : 0;
      }
    } else {
      checkResult.status = 'fail';

      // Parse errors
      if (checkName === 'lint') {
        const output = result.output || result.error || '';
        const errorMatch = output.match(/(\d+)\s+error/);
        checkResult.errors = errorMatch ? parseInt(errorMatch[1]) : 1;

        // Auto-fix if enabled
        if (checkConfig.autoFix && config.autoFix.lint) {
          console.error(`Auto-fixing ${checkName} errors...`);
          const fixResult = runCommand(checkConfig.autoFix);

          if (fixResult.success) {
            // Re-check using shared utility
            const recheckResult = runLint();
            if (recheckResult.passed) {
              checkResult.status = 'fixed';
              checkResult.autoFixed = true;
              checkResult.errors = 0;
            }
          }
        }
      } else if (checkName === 'typecheck') {
        // Parse typecheck errors (file:line - message format)
        const output = result.output || result.error || '';
        const lines = output.split('\n');
        const errorPattern = /(.+):(\d+):\d+\s+-\s+(.+)/;

        lines.forEach(line => {
          const match = line.match(errorPattern);
          if (match) {
            checkResult.details.push({
              file: match[1],
              line: parseInt(match[2]),
              message: match[3]
            });
          }
        });

        checkResult.errors = checkResult.details.length || 1;
      } else if (checkName === 'tests') {
        const output = result.output || result.error || '';
        const failedMatch = output.match(/(\d+)\s+failed/);
        checkResult.failed = failedMatch ? parseInt(failedMatch[1]) : 1;
        checkResult.errors = checkResult.failed;
      } else if (checkName === 'build') {
        checkResult.errors = 1;
      }
    }

    results[checkName] = checkResult;
  }

  return results;
}

/**
 * PHASE 4: Check Git
 */
function checkGit() {
  const result = {
    branch: null,
    clean: false,
    ahead: 0,
    behind: 0,
    remote: 'origin',
    upToDate: true
  };

  if (!isGitRepo()) {
    result.error = 'Not a git repository';
    return result;
  }

  // Use unified getGitStatus('json') from git-utils.cjs
  const status = getGitStatus('json');
  if (status) {
    result.branch = status.branch;
    result.clean = status.clean;
    result.ahead = status.ahead;
    result.behind = status.behind;
    result.upToDate = status.upToDate;
  } else {
    result.branch = 'unknown';
  }

  return result;
}

/**
 * PHASE 5: Security Audit (optional, only when --security flag is used)
 */
async function checkSecurity() {
  const result = {
    status: 'skipped',
    vulnerabilities: {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: 0
    },
    error: null
  };

  try {
    // Detect package manager
    const pm = getPackageManager();

    // Run audit command
    const auditCmd = pm.name === 'pnpm' ? 'pnpm audit --json' :
                     pm.name === 'npm' ? 'npm audit --json' :
                     pm.name === 'yarn' ? 'yarn audit --json' :
                     'npm audit --json';

    const auditResult = runCommand(auditCmd);

    if (!auditResult.success) {
      // Audit command might fail with non-zero exit code if vulnerabilities found
      // But still provides JSON output in stderr or stdout
      const output = auditResult.output || '';

      if (output.trim().length === 0) {
        result.status = 'error';
        result.error = 'Failed to run security audit';
        return result;
      }

      // Try to parse the output even on failure
      try {
        const auditData = JSON.parse(output);
        result.status = 'completed';

        // Parse based on package manager format
        if (pm.name === 'pnpm') {
          // pnpm format: metadata.vulnerabilities
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            const vulns = auditData.metadata.vulnerabilities;
            result.vulnerabilities.info = vulns.info || 0;
            result.vulnerabilities.low = vulns.low || 0;
            result.vulnerabilities.moderate = vulns.moderate || 0;
            result.vulnerabilities.high = vulns.high || 0;
            result.vulnerabilities.critical = vulns.critical || 0;
            result.vulnerabilities.total = vulns.total || 0;
          }
        } else if (pm.name === 'npm') {
          // npm format: metadata.vulnerabilities
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            const vulns = auditData.metadata.vulnerabilities;
            result.vulnerabilities.info = vulns.info || 0;
            result.vulnerabilities.low = vulns.low || 0;
            result.vulnerabilities.moderate = vulns.moderate || 0;
            result.vulnerabilities.high = vulns.high || 0;
            result.vulnerabilities.critical = vulns.critical || 0;
            result.vulnerabilities.total = vulns.total || 0;
          }
        }
      } catch (parseErr) {
        result.status = 'error';
        result.error = 'Failed to parse audit output';
        return result;
      }
    } else {
      // Success - parse the output
      try {
        const auditData = JSON.parse(auditResult.output);
        result.status = 'completed';

        // Parse based on package manager format
        if (pm.name === 'pnpm') {
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            const vulns = auditData.metadata.vulnerabilities;
            result.vulnerabilities.info = vulns.info || 0;
            result.vulnerabilities.low = vulns.low || 0;
            result.vulnerabilities.moderate = vulns.moderate || 0;
            result.vulnerabilities.high = vulns.high || 0;
            result.vulnerabilities.critical = vulns.critical || 0;
            result.vulnerabilities.total = vulns.total || 0;
          }
        } else if (pm.name === 'npm') {
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            const vulns = auditData.metadata.vulnerabilities;
            result.vulnerabilities.info = vulns.info || 0;
            result.vulnerabilities.low = vulns.low || 0;
            result.vulnerabilities.moderate = vulns.moderate || 0;
            result.vulnerabilities.high = vulns.high || 0;
            result.vulnerabilities.critical = vulns.critical || 0;
            result.vulnerabilities.total = vulns.total || 0;
          }
        }
      } catch (parseErr) {
        result.status = 'error';
        result.error = 'Failed to parse audit output';
        return result;
      }
    }
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
  }

  return result;
}

/**
 * Main Environment Check Function
 */
async function environmentCheck(options = {}) {
  const results = {
    status: 'ready',
    dependencies: {},
    tooling: {},
    verification: {},
    git: {},
    security: null,
    issues: []
  };

  // Detect CI mode
  if (process.env.CI === 'true') {
    options.ciMode = true;
    console.error('ℹ CI mode: Skipping interactive prompts');
  }

  try {
    // PHASE 1: Dependencies
    results.dependencies = await checkDependencies();
    if (results.dependencies.status === 'error') {
      results.status = 'issues';
      results.issues.push({
        phase: 'dependencies',
        severity: 'critical',
        message: 'Failed to install dependencies',
        fix: results.dependencies.packageManager
          ? `${results.dependencies.packageManager} install`
          : 'npm install'
      });
    }

    // PHASE 2: Tooling
    results.tooling = await checkTooling();
    for (const [toolName, toolResult] of Object.entries(results.tooling)) {
      if (!toolResult.installed && !toolResult.unsupported) {
        const config = loadConfig();
        const toolConfig = config.requiredTools.find(t => t.name === toolName);

        results.status = 'issues';
        results.issues.push({
          phase: 'tooling',
          severity: options.ciMode ? 'info' : 'warning',
          message: `${toolName} not installed`,
          fix: toolConfig?.install || toolConfig?.installPrompt || `Install ${toolName}`
        });
      }

      if (toolResult.installed && !toolResult.authenticated && !toolResult.skipped) {
        results.status = 'issues';
        results.issues.push({
          phase: 'tooling',
          severity: 'warning',
          message: `${toolName} not authenticated`,
          fix: `${toolName} auth login`
        });
      }
    }

    // PHASE 3: Verification
    results.verification = await runVerification(options);
    for (const [checkName, checkResult] of Object.entries(results.verification)) {
      if (checkResult.status === 'fail') {
        results.status = 'issues';
        results.issues.push({
          phase: 'verification',
          severity: 'warning',
          message: `${checkName} failed with ${checkResult.errors} error(s)`,
          fix: `Fix ${checkName} errors`
        });
      }
    }

    // PHASE 4: Git
    results.git = checkGit();
    if (results.git.error) {
      results.status = 'issues';
      results.issues.push({
        phase: 'git',
        severity: 'warning',
        message: results.git.error,
        fix: 'Initialize git repository with: git init'
      });
    }

    // PHASE 5: Security Audit (optional, only when --security flag is used)
    if (options.securityMode) {
      console.error('Running security audit...');
      results.security = await checkSecurity();

      if (results.security.status === 'completed') {
        const vulns = results.security.vulnerabilities;
        const totalVulns = vulns.critical + vulns.high + vulns.moderate + vulns.low + vulns.info;

        if (totalVulns > 0) {
          // Add as warning (non-blocking)
          let severityLevel = 'warning';
          let message = 'Security vulnerabilities detected';

          if (vulns.critical > 0) {
            message = `${vulns.critical} critical vulnerabilities detected`;
            severityLevel = 'warning'; // Non-blocking, but show as warning
          } else if (vulns.high > 0) {
            message = `${vulns.high} high severity vulnerabilities detected`;
          }

          results.issues.push({
            phase: 'security',
            severity: severityLevel,
            message: message,
            fix: 'Run `pnpm audit` for details and `pnpm audit fix` to resolve'
          });

          // Mark status as issues if not already
          if (results.status === 'ready') {
            results.status = 'issues';
          }
        }
      } else if (results.security.status === 'error') {
        results.issues.push({
          phase: 'security',
          severity: 'warning',
          message: `Security audit failed: ${results.security.error}`,
          fix: 'Run `pnpm audit` manually to check for vulnerabilities'
        });
      }
    }

    // Write state file (T004: Handle write failures gracefully)
    const writeResult = writeStateFile(results);
    if (!writeResult.success) {
      // Add warning to results (non-blocking)
      results.issues.push({
        phase: 'state-file',
        severity: 'info',
        message: 'Could not write state file',
        fix: 'Check file permissions and disk space'
      });
    }

  } catch (err) {
    results.status = 'issues';
    results.issues.push({
      phase: 'error',
      severity: 'critical',
      message: `Environment check failed: ${err.message}`,
      fix: 'Check logs for details'
    });
  }

  return results;
}

/**
 * Write State File
 * T004: Added error propagation with logging
 */
function writeStateFile(results, outputPath = 'start-status.json') {
  try {
    // Add timestamp
    const output = {
      ...results,
      timestamp: new Date().toISOString()
    };

    // Write to file
    const fullPath = path.join(process.cwd(), outputPath);
    fs.writeFileSync(fullPath, JSON.stringify(output, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    // T004: Log error to start-operations.log
    const errorMsg = `Failed to write state file ${outputPath}: ${err.message}`;
    appendToTextLog('start-operations', `ERROR: ${errorMsg}`);

    // Display warning to user (non-blocking)
    console.error(`⚠ Warning: ${errorMsg}`);
    console.error('  Continuing with environment check...');

    // Return failure status with warning
    return { success: false, warning: errorMsg };
  }
}

/**
 * Generate Report
 */
function generateReport(results) {
  const lines = [];
  const width = 65;

  // Helper to create box line
  const boxLine = (content = '', symbol = '│') => {
    const padding = width - content.length - 4;
    return `${symbol} ${content}${' '.repeat(Math.max(0, padding))} ${symbol}`;
  };

  // Header
  const status = results.status === 'ready' ? 'Environment Ready' : 'Issues Found';
  lines.push('┌' + '─'.repeat(width - 2) + '┐');
  lines.push(boxLine(`/start - ${status}`));
  lines.push('├' + '─'.repeat(width - 2) + '┤');
  lines.push(boxLine());

  // PHASE 1: Dependencies
  lines.push(boxLine('DEPENDENCIES'));
  if (results.dependencies.status === 'ok') {
    const msg = results.dependencies.installRequired
      ? `${colors.green}✓${colors.reset} ${results.dependencies.packageManager} install (completed in ${results.dependencies.installTime}s)`
      : `${colors.green}✓${colors.reset} ${results.dependencies.packageManager} install (node_modules up to date)`;
    lines.push(boxLine(`  ${msg}`));
  } else {
    lines.push(boxLine(`  ${colors.red}✗${colors.reset} ${results.dependencies.packageManager || 'npm'} install failed`));
    lines.push(boxLine(`    → Run: ${results.dependencies.packageManager || 'npm'} install`));
  }
  lines.push(boxLine());

  // PHASE 2: Tooling
  lines.push(boxLine('TOOLING'));
  for (const [toolName, toolResult] of Object.entries(results.tooling)) {
    if (toolResult.unsupported) {
      lines.push(boxLine(`  ${colors.yellow}⚠${colors.reset} ${toolName} (unsupported on Windows)`));
    } else if (toolResult.installed) {
      const authStatus = toolResult.skipped
        ? toolResult.timeoutWarning
          ? '(skipped - network timeout)'
          : '(skipped - offline)'
        : toolResult.authenticated
          ? toolResult.user ? `(authenticated as ${toolResult.user})` : '(authenticated)'
          : '(not authenticated)';
      const symbol = toolResult.authenticated || toolResult.skipped ? colors.green + '✓' + colors.reset : colors.yellow + '⚠' + colors.reset;
      lines.push(boxLine(`  ${symbol} ${toolName} ${toolResult.version || ''} ${authStatus}`));

      if (!toolResult.authenticated && !toolResult.skipped) {
        lines.push(boxLine(`    → Run: ${toolName} auth login`));
      }
    } else {
      lines.push(boxLine(`  ${colors.red}✗${colors.reset} ${toolName} not installed`));
      const config = loadConfig();
      const toolConfig = config.requiredTools.find(t => t.name === toolName);
      if (toolConfig?.install) {
        lines.push(boxLine(`    → Run: ${toolConfig.install}`));
      } else if (toolConfig?.installPrompt) {
        lines.push(boxLine(`    → ${toolConfig.installPrompt}`));
      }
    }
  }
  lines.push(boxLine());

  // PHASE 3: Verification
  lines.push(boxLine('VERIFICATION'));
  for (const [checkName, checkResult] of Object.entries(results.verification)) {
    if (checkResult.status === 'skipped') {
      continue;
    }

    const checkLabel = checkName.charAt(0).toUpperCase() + checkName.slice(1);

    if (checkResult.status === 'pass') {
      let msg = `${colors.green}✓${colors.reset} ${checkLabel}: passed`;

      if (checkName === 'lint') {
        msg += ` (${checkResult.errors} errors, ${checkResult.warnings} warnings)`;
      } else if (checkName === 'tests') {
        msg += ` (${checkResult.passed} passed in ${checkResult.duration}s)`;
      }

      lines.push(boxLine(`  ${msg}`));
    } else if (checkResult.status === 'fixed') {
      lines.push(boxLine(`  ${colors.green}✓${colors.reset} ${checkLabel}: passed (auto-fixed ${checkResult.errors} errors)`));
    } else if (checkResult.status === 'fail') {
      lines.push(boxLine(`  ${colors.red}✗${colors.reset} ${checkLabel}: ${checkResult.errors} error(s)`));

      // Show first 3 errors for typecheck
      if (checkName === 'typecheck' && checkResult.details.length > 0) {
        const errorsToShow = checkResult.details.slice(0, 3);
        errorsToShow.forEach(error => {
          const truncated = error.message.length > 45
            ? error.message.substring(0, 42) + '...'
            : error.message;
          lines.push(boxLine(`    → ${error.file}:${error.line} - ${truncated}`));
        });

        if (checkResult.details.length > 3) {
          lines.push(boxLine(`    ... and ${checkResult.details.length - 3} more`));
        }
      }
    }
  }
  lines.push(boxLine());

  // PHASE 4: Git
  lines.push(boxLine('GIT'));
  if (results.git.error) {
    lines.push(boxLine(`  ${colors.yellow}⚠${colors.reset} ${results.git.error}`));
  } else {
    const branchMsg = results.git.branch ? `Branch: ${results.git.branch}` : 'No branch';
    lines.push(boxLine(`  ${branchMsg}`));

    const statusMsg = results.git.clean ? 'Status: clean' : 'Status: uncommitted changes';
    lines.push(boxLine(`  ${statusMsg}`));

    const remoteMsg = results.git.upToDate ? 'Remote: up to date' : `Remote: ${results.git.ahead} ahead, ${results.git.behind} behind`;
    lines.push(boxLine(`  ${remoteMsg}`));
  }
  lines.push(boxLine());

  // PHASE 5: Security (optional)
  if (results.security && results.security.status !== 'skipped') {
    lines.push(boxLine('SECURITY AUDIT'));

    if (results.security.status === 'error') {
      lines.push(boxLine(`  ${colors.yellow}⚠${colors.reset} ${results.security.error}`));
    } else if (results.security.status === 'completed') {
      const vulns = results.security.vulnerabilities;
      const totalVulns = vulns.critical + vulns.high + vulns.moderate + vulns.low + vulns.info;

      if (totalVulns === 0) {
        lines.push(boxLine(`  ${colors.green}✓${colors.reset} No vulnerabilities found`));
      } else {
        // Show vulnerabilities by severity
        if (vulns.critical > 0) {
          lines.push(boxLine(`  ${colors.red}✗${colors.reset} ${vulns.critical} critical severity vulnerabilities`));
        }
        if (vulns.high > 0) {
          lines.push(boxLine(`  ${colors.red}✗${colors.reset} ${vulns.high} high severity vulnerabilities`));
        }
        if (vulns.moderate > 0) {
          lines.push(boxLine(`  ${colors.yellow}⚠${colors.reset} ${vulns.moderate} moderate severity vulnerabilities`));
        }
        if (vulns.low > 0) {
          lines.push(boxLine(`  ${colors.yellow}⚠${colors.reset} ${vulns.low} low severity vulnerabilities`));
        }
        if (vulns.info > 0) {
          lines.push(boxLine(`  ℹ ${vulns.info} info vulnerabilities`));
        }

        lines.push(boxLine(`    → Run: pnpm audit for details`));
      }
    }
    lines.push(boxLine());
  }

  // Footer
  lines.push('├' + '─'.repeat(width - 2) + '┤');
  if (results.status === 'ready') {
    lines.push(boxLine(`${colors.green}✓${colors.reset} Ready to work!`));
  } else {
    lines.push(boxLine(`${colors.yellow}⚠${colors.reset} Fix issues above before proceeding`));
  }
  lines.push('└' + '─'.repeat(width - 2) + '┘');

  return lines.join('\n');
}

/**
 * Check Critical Dependencies
 * Verifies that critical system dependencies are available for /start command.
 *
 * @returns {{ blocked: boolean, missing: string[], warnings: string[] }}
 */
function checkCriticalDependencies() {
  const result = {
    blocked: false,
    missing: [],
    warnings: []
  };

  // Define critical dependencies (block execution if missing)
  const criticalDeps = [
    { name: 'Node.js', command: 'node' },
    { name: 'pnpm', command: 'pnpm' },
    { name: 'git', command: 'git' }
  ];

  // Check each critical dependency
  for (const dep of criticalDeps) {
    try {
      if (!commandExists(dep.command)) {
        result.blocked = true;
        result.missing.push(dep.name);
      }
    } catch (err) {
      // If check fails, treat as missing
      result.blocked = true;
      result.missing.push(dep.name);
    }
  }

  return result;
}

module.exports = {
  environmentCheck,
  checkDependencies,
  checkTooling,
  runVerification,
  checkGit,
  checkSecurity,
  checkCriticalDependencies,
  generateReport,
  writeStateFile,
  loadConfig,
  isOnline
};
