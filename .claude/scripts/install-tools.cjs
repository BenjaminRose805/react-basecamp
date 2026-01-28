/**
 * Tool Installation Helper
 * Provides installation and authentication checks for required tools
 */

const { commandExists, runCommand, isWindows } = require('./lib/utils.cjs');
const readline = require('readline');

/**
 * Prompt user for confirmation (CLI)
 * @param {string} question - The question to ask
 * @returns {Promise<boolean>} - True if user confirms
 */
async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Wait for user to press Enter
 * @param {string} message - Message to display
 * @returns {Promise<void>}
 */
async function waitForEnter(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr
  });

  return new Promise((resolve) => {
    rl.question(`${message} (press Enter to continue)`, () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * T005: Install CodeRabbit CLI
 * @param {object} options - Options { prompt: boolean, unsupported: boolean }
 * @returns {Promise<object>} - { installed, skipped, unsupported, error }
 */
async function installCodeRabbit(options = {}) {
  const result = {
    installed: false,
    skipped: false,
    unsupported: false,
    error: null
  };

  // Check platform
  if (isWindows) {
    if (options.unsupported) {
      result.unsupported = true;
      result.skipped = true;
      return result;
    }
  }

  // Check if already installed
  if (commandExists('coderabbit')) {
    result.installed = true;
    return result;
  }

  // Prompt user if requested
  if (options.prompt) {
    const shouldInstall = await promptUser('Install CodeRabbit CLI for local code review?');
    if (!shouldInstall) {
      result.skipped = true;
      return result;
    }
  }

  try {
    console.error('Installing CodeRabbit CLI...');

    // Run installation script
    const installResult = runCommand('curl -fsSL https://cli.coderabbit.ai/install.sh | sh', {
      stdio: 'inherit'
    });

    if (!installResult.success) {
      // Check for permission errors
      if (installResult.output.includes('Permission denied') || installResult.output.includes('EACCES')) {
        result.error = 'Permission denied. Try running with sudo: sudo curl -fsSL https://cli.coderabbit.ai/install.sh | sh';
      } else {
        result.error = installResult.output;
      }
      return result;
    }

    // Verify installation
    const verifyResult = runCommand('coderabbit --version');
    if (verifyResult.success) {
      result.installed = true;
      console.error('✓ CodeRabbit CLI installed successfully');
    } else {
      result.error = 'Installation completed but coderabbit command not found. You may need to restart your terminal.';
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

/**
 * T006: Check CodeRabbit Authentication
 * @returns {Promise<object>} - { authenticated, prompted }
 */
async function checkCodeRabbitAuth() {
  const result = {
    authenticated: false,
    prompted: false
  };

  // Check if CodeRabbit is installed
  if (!commandExists('coderabbit')) {
    result.error = 'CodeRabbit CLI not installed';
    return result;
  }

  // Check auth status
  const authResult = runCommand('coderabbit auth status');
  if (authResult.success) {
    result.authenticated = true;
    return result;
  }

  // Not authenticated - prompt user
  console.error('CodeRabbit is not authenticated.');
  console.error('Run: coderabbit auth login');
  await waitForEnter('After authenticating, ');
  result.prompted = true;

  // Re-check
  const recheckResult = runCommand('coderabbit auth status');
  result.authenticated = recheckResult.success;

  return result;
}

/**
 * T007: Check GitHub CLI Installation and Authentication
 * @returns {Promise<object>} - { installed, version, authenticated, user, message }
 */
async function checkGitHubCLI() {
  const result = {
    installed: false,
    version: null,
    authenticated: false,
    user: null,
    message: null
  };

  // Check if installed
  if (!commandExists('gh')) {
    result.message = 'GitHub CLI not installed. Install: https://cli.github.com';
    return result;
  }

  result.installed = true;

  // Get version
  const versionResult = runCommand('gh --version');
  if (versionResult.success) {
    // Parse version from output (e.g., "gh version 2.40.0" -> "2.40.0")
    const versionMatch = versionResult.output.match(/gh version (\d+\.\d+\.\d+)/);
    result.version = versionMatch ? versionMatch[1] : versionResult.output.split('\n')[0];
  }

  // Check authentication
  const authResult = runCommand('gh auth status');
  if (authResult.success) {
    result.authenticated = true;

    // Parse username from output
    // Format: "✓ Logged in to github.com account username (keyring)"
    // or: "✓ Logged in to github.com as username"
    const userMatch = authResult.output.match(/(?:as|account)\s+(\w+)/);
    result.user = userMatch ? userMatch[1] : null;

    result.message = result.user
      ? `Authenticated as ${result.user}`
      : 'Authenticated';
  } else {
    result.message = 'Not authenticated. Run: gh auth login';
  }

  return result;
}

module.exports = {
  installCodeRabbit,
  checkCodeRabbitAuth,
  checkGitHubCLI,
  promptUser,
  waitForEnter
};
