/**
 * Command Utilities
 *
 * Shared utilities for command detection and flag parsing.
 * Used by user-prompt hooks to standardize command handling.
 * T009: Standardize Flag Parsing
 */

/**
 * Detect command from user prompt
 * @param {string} userPrompt - The user's input
 * @returns {string|null} - Command name or null if not a valid command
 */
function detectCommand(userPrompt) {
  const VALID_COMMANDS = [
    'start',
    'ship',
    'review',
    'design',
    'implement',
    'research',
    'reconcile'
  ];

  if (!userPrompt || typeof userPrompt !== 'string') {
    return null;
  }

  const trimmed = userPrompt.trim().toLowerCase();

  // Match /command at start, optionally followed by space and args
  const match = trimmed.match(/^\/(\w+)(?:\s|$)/);
  if (!match) return null;

  return VALID_COMMANDS.includes(match[1]) ? match[1] : null;
}

/**
 * Parse flags from user prompt
 * @param {string} userPrompt - The user's input
 * @param {Object} flagDefinitions - Map of flag names to their types
 * @returns {Object} - Parsed flags with values
 *
 * @example
 * parseFlags('/start my-feature --full --security', {
 *   full: 'boolean',
 *   security: 'boolean',
 *   force: 'boolean',
 *   yes: 'boolean'
 * })
 * // Returns: { full: true, security: true, force: false, yes: false }
 */
function parseFlags(userPrompt, flagDefinitions) {
  const flags = {};

  // Validate flagDefinitions parameter
  if (!flagDefinitions || typeof flagDefinitions !== 'object') {
    return flags;
  }

  if (!userPrompt || typeof userPrompt !== 'string') {
    // Return all flags as false for invalid input
    for (const [flagName, flagType] of Object.entries(flagDefinitions)) {
      if (flagType === 'boolean') {
        flags[flagName] = false;
      }
    }
    return flags;
  }

  for (const [flagName, flagType] of Object.entries(flagDefinitions)) {
    if (flagType === 'boolean') {
      // Handle flags with hyphens (e.g., --skip-cr)
      const pattern = new RegExp(`--${flagName}\\b`, 'i');
      flags[flagName] = pattern.test(userPrompt);
    }
  }

  return flags;
}

module.exports = {
  detectCommand,
  parseFlags
};
