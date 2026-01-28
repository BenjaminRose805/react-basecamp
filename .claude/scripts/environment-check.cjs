/**
 * Environment Check Script for /start Command
 * Performs comprehensive environment validation across 4 phases
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const { commandExists, runCommand, isGitRepo, getGitRoot, ensureDir, readFile, writeFile } = require('./lib/utils.cjs');
const { getPackageManager, detectFromLockFile } = require('./lib/package-manager.cjs');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

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

    writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.error('⚠ Created default environment config at .claude/config/environment.json');
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
      const installResult = runCommand(pm.config.installCmd);
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
 * PHASE 2: Check Tooling
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

  for (const tool of config.requiredTools) {
    const toolResult = {
      installed: false,
      version: null,
      authenticated: false,
      skipped: false,
      unsupported: false
    };

    // Check platform support
    if (!tool.platforms.includes(process.platform)) {
      toolResult.unsupported = true;

      if (tool.name === 'coderabbit' && isWindowsPlatform) {
        console.error('⚠ CodeRabbit CLI not available on Windows');
      }

      results[tool.name] = toolResult;
      continue;
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
        const authResult = runCommand(tool.authCheck);
        toolResult.authenticated = authResult.success;

        // For GitHub CLI, parse username
        if (tool.name === 'gh' && authResult.success) {
          const userMatch = authResult.output.match(/as\s+(\w+)/);
          toolResult.user = userMatch ? userMatch[1] : null;
        }
      } else if (skipNetworkChecks) {
        toolResult.skipped = true;
      }
    }

    results[tool.name] = toolResult;
  }

  return results;
}

/**
 * PHASE 3: Run Verification
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

    // Run check
    const result = runCommand(checkConfig.command);

    if (result.success) {
      checkResult.status = 'pass';

      // Parse output for warnings/counts
      if (checkName === 'lint') {
        const errorMatch = result.output.match(/(\d+)\s+error/);
        const warningMatch = result.output.match(/(\d+)\s+warning/);
        checkResult.errors = errorMatch ? parseInt(errorMatch[1]) : 0;
        checkResult.warnings = warningMatch ? parseInt(warningMatch[1]) : 0;
      } else if (checkName === 'tests') {
        const passedMatch = result.output.match(/(\d+)\s+passed/);
        const failedMatch = result.output.match(/(\d+)\s+failed/);
        const skippedMatch = result.output.match(/(\d+)\s+skipped/);
        const durationMatch = result.output.match(/(\d+\.?\d*)s/);

        checkResult.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        checkResult.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        checkResult.skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
        checkResult.duration = durationMatch ? parseFloat(durationMatch[1]) : 0;
      }
    } else {
      checkResult.status = 'fail';

      // Parse errors
      if (checkName === 'lint') {
        const errorMatch = result.output.match(/(\d+)\s+error/);
        checkResult.errors = errorMatch ? parseInt(errorMatch[1]) : 1;

        // Auto-fix if enabled
        if (checkConfig.autoFix && config.autoFix.lint) {
          console.error(`Auto-fixing ${checkName} errors...`);
          const fixResult = runCommand(checkConfig.autoFix);

          if (fixResult.success) {
            // Re-check
            const recheckResult = runCommand(checkConfig.command);
            if (recheckResult.success) {
              checkResult.status = 'fixed';
              checkResult.autoFixed = true;
              checkResult.errors = 0;
            }
          }
        }
      } else if (checkName === 'typecheck') {
        // Parse typecheck errors (file:line - message format)
        const lines = result.output.split('\n');
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
        const failedMatch = result.output.match(/(\d+)\s+failed/);
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

  // Get current branch
  const branchResult = runCommand('git rev-parse --abbrev-ref HEAD');
  result.branch = branchResult.success ? branchResult.output : 'unknown';

  // Check for uncommitted changes
  const statusResult = runCommand('git status --porcelain');
  result.clean = statusResult.success && statusResult.output.trim() === '';

  // Check ahead/behind
  const upstreamResult = runCommand('git rev-list --left-right --count HEAD...@{u}');
  if (upstreamResult.success) {
    const counts = upstreamResult.output.split('\t');
    result.ahead = parseInt(counts[0]) || 0;
    result.behind = parseInt(counts[1]) || 0;
    result.upToDate = result.ahead === 0 && result.behind === 0;
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

    // Write state file
    writeStateFile(results);

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
    return true;
  } catch (err) {
    console.error(`⚠ Failed to write state file: ${err.message}`);
    return false;
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
        ? '(skipped - offline)'
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

module.exports = {
  environmentCheck,
  checkDependencies,
  checkTooling,
  runVerification,
  checkGit,
  generateReport,
  writeStateFile,
  loadConfig,
  isOnline
};
