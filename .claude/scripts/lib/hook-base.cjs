/**
 * Base Hook Template Factory
 * Eliminates boilerplate across user-prompt hooks.
 * T011: DRY Refactoring
 */

const { readStdinJson, logContext, logError } = require('./utils.cjs');
const { detectCommand, parseFlags } = require('./command-utils.cjs');

/**
 * Create a hook with standard boilerplate handled
 * @param {object} config - Hook configuration
 * @param {string} config.name - Hook name (e.g., 'start', 'ship')
 * @param {string} config.command - Command to detect (e.g., 'start')
 * @param {object} config.flagDefinitions - Flag definitions for parseFlags
 * @param {function} config.run - Async function(input, flags, message) => contextToInject | null
 * @returns {function} - Main function to call
 */
function createHook(config) {
  return async function main() {
    try {
      const input = await readStdinJson();
      const message = input.message || input.prompt || '';

      if (!message || typeof message !== 'string') {
        process.exit(0);
      }

      const trimmedMessage = message.trim();
      const detectedCommand = detectCommand(trimmedMessage);

      if (detectedCommand !== config.command) {
        process.exit(0);
      }

      const flags = parseFlags(trimmedMessage, config.flagDefinitions || {});

      const context = await config.run(input, flags, trimmedMessage);

      if (context) {
        logContext(context);
      }

      process.exit(0);
    } catch (err) {
      logError(`[Hook:${config.name}] Error: ${err.message}`);
      process.exit(0);
    }
  };
}

module.exports = { createHook };
