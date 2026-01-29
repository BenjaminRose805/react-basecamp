/**
 * Config Loader with Caching
 * Caches config files at module level to avoid redundant reads.
 * T015: DRY Refactoring - Efficiency
 */

const fs = require('fs');
const path = require('path');

// Module-level cache
const configCache = new Map();

/**
 * Load a JSON config file with caching
 * @param {string} configPath - Absolute path to config file
 * @param {object} options - Options
 * @param {boolean} options.reload - Force reload from disk
 * @returns {object|null} - Parsed config or null if not found
 */
function loadConfig(configPath, options = {}) {
  // Check cache first (unless reload requested)
  if (!options.reload && configCache.has(configPath)) {
    return configCache.get(configPath);
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    configCache.set(configPath, config);
    return config;
  } catch (err) {
    // Cache null for missing files to avoid repeated attempts
    if (err.code === 'ENOENT') {
      configCache.set(configPath, null);
    } else if (err instanceof SyntaxError) {
      // Invalid JSON - cache null and warn
      console.error(`Warning: Invalid JSON in ${configPath}: ${err.message}`);
      configCache.set(configPath, null);
    }
    return null;
  }
}

/**
 * Load environment.json config
 * @param {string} basePath - Base directory path
 * @returns {object} - Environment config with defaults
 */
function loadEnvironmentConfig(basePath) {
  const configPath = path.join(basePath, '.claude', 'environment.json');
  const config = loadConfig(configPath);

  // Return with defaults
  return {
    tools: config?.tools || {},
    verification: config?.verification || {},
    ...config
  };
}

/**
 * Load environment config from .claude/config/environment.json (for /start command)
 * @param {string} basePath - Base directory path
 * @param {object} defaultConfig - Default config to use if file doesn't exist
 * @returns {object|null} - Environment config or null
 */
function loadStartEnvironmentConfig(basePath, defaultConfig = null) {
  const configPath = path.join(basePath, '.claude', 'config', 'environment.json');
  let config = loadConfig(configPath);

  // Return config if found
  if (config !== null) {
    return config;
  }

  // Return default if provided
  return defaultConfig;
}

/**
 * Clear the config cache (useful for testing)
 */
function clearCache() {
  configCache.clear();
}

/**
 * Get cache statistics (useful for testing)
 * @returns {{ size: number, keys: string[] }}
 */
function getCacheStats() {
  return {
    size: configCache.size,
    keys: Array.from(configCache.keys())
  };
}

/**
 * Validate environment config against schema
 * @param {object} config - Config to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConfig(config) {
  const errors = [];
  const validPlatforms = ['darwin', 'linux', 'win32'];

  // Validate tools section
  if (config.tools !== undefined) {
    if (typeof config.tools !== 'object' || config.tools === null) {
      errors.push('tools must be an object');
    } else {
      for (const [toolName, toolConfig] of Object.entries(config.tools)) {
        if (typeof toolConfig !== 'object' || toolConfig === null) {
          errors.push(`tools.${toolName} must be an object`);
          continue;
        }

        // Validate required field
        if (toolConfig.required !== undefined && typeof toolConfig.required !== 'boolean') {
          errors.push(`tools.${toolName}.required must be a boolean`);
        }

        // Validate versionCommand field
        if (toolConfig.versionCommand !== undefined && typeof toolConfig.versionCommand !== 'string') {
          errors.push(`tools.${toolName}.versionCommand must be a string`);
        }

        // Validate authCheck field
        if (toolConfig.authCheck !== undefined && typeof toolConfig.authCheck !== 'string') {
          errors.push(`tools.${toolName}.authCheck must be a string`);
        }

        // Validate platforms field
        if (toolConfig.platforms !== undefined) {
          if (!Array.isArray(toolConfig.platforms)) {
            errors.push(`tools.${toolName}.platforms must be an array`);
          } else {
            for (const platform of toolConfig.platforms) {
              if (!validPlatforms.includes(platform)) {
                errors.push(`tools.${toolName}.platforms contains invalid platform "${platform}". Must be one of: ${validPlatforms.join(', ')}`);
              }
            }
          }
        }
      }
    }
  }

  // Validate verification section
  if (config.verification !== undefined) {
    if (typeof config.verification !== 'object' || config.verification === null) {
      errors.push('verification must be an object');
    } else {
      const verificationFields = ['lint', 'typecheck', 'tests', 'build'];
      for (const field of verificationFields) {
        if (config.verification[field] !== undefined && typeof config.verification[field] !== 'boolean') {
          errors.push(`verification.${field} must be a boolean`);
        }
      }
    }
  }

  // Validate git section
  if (config.git !== undefined) {
    if (typeof config.git !== 'object' || config.git === null) {
      errors.push('git must be an object');
    } else {
      // Validate requireClean field
      if (config.git.requireClean !== undefined && typeof config.git.requireClean !== 'boolean') {
        errors.push('git.requireClean must be a boolean');
      }

      // Validate defaultBranch field
      if (config.git.defaultBranch !== undefined && typeof config.git.defaultBranch !== 'string') {
        errors.push('git.defaultBranch must be a string');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  loadConfig,
  loadEnvironmentConfig,
  loadStartEnvironmentConfig,
  clearCache,
  getCacheStats,
  validateConfig
};
