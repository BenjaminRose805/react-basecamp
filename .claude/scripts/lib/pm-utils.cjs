/**
 * Package Manager Utilities
 * Detects and caches package manager information.
 * T016: DRY Refactoring - Efficiency
 *
 * NOTE: Cache is shared across all basePath calls.
 * If working with multiple projects, use reload: true option.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Module-level cache (shared across all basePath calls)
let cachedPM = null;

/**
 * Detect the package manager used in the project
 * Results are cached at module level
 * @param {string} basePath - Project base path (default: cwd)
 * @param {object} options - Options
 * @param {boolean} options.reload - Force re-detection
 * @returns {{ name: string, version: string|null, lockfile: string|null }}
 */
function getPackageManager(basePath = process.cwd(), options = {}) {
  // Return cached result if available
  if (!options.reload && cachedPM !== null) {
    return cachedPM;
  }

  const result = {
    name: 'npm', // default fallback
    version: null,
    lockfile: null
  };

  // Check for lockfiles
  const lockfiles = [
    { name: 'pnpm', file: 'pnpm-lock.yaml' },
    { name: 'yarn', file: 'yarn.lock' },
    { name: 'bun', file: 'bun.lockb' },
    { name: 'npm', file: 'package-lock.json' }
  ];

  for (const { name, file } of lockfiles) {
    if (fs.existsSync(path.join(basePath, file))) {
      result.name = name;
      result.lockfile = file;
      break;
    }
  }

  // Get version
  try {
    const version = execSync(`${result.name} --version`, {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    result.version = version;
  } catch (err) {
    // Version detection failed, but PM detected
  }

  // Cache the result
  cachedPM = result;
  return result;
}

/**
 * Clear the cached package manager (useful for testing)
 */
function clearCache() {
  cachedPM = null;
}

module.exports = {
  getPackageManager,
  clearCache
};
