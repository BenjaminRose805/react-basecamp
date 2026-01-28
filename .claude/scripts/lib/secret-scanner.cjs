/**
 * Secret scanner for detecting leaked credentials in source code
 * Used by Tier 2 checks to prevent secrets from being committed
 */

const fs = require('fs');
const path = require('path');

/**
 * Secret patterns to detect various types of credentials
 * Each pattern includes a severity level and description
 */
const SECRET_PATTERNS = [
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: 'high',
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(?:RSA|EC|OPENSSH|DSA)\s+PRIVATE\s+KEY-----/gi,
    severity: 'critical',
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
  },
  {
    name: 'GitHub Token',
    pattern: /gh[oprsu]_[A-Za-z0-9_]{36,}/g,
    severity: 'critical',
  },
  {
    name: 'Database URL',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^\s"']+/gi,
    severity: 'high',
  },
  {
    name: 'JWT Secret',
    pattern: /(?:jwt[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: 'high',
  },
  {
    name: 'OAuth Secret',
    pattern: /(?:client[_-]?secret|oauth[_-]?secret)[\s]*[=:]["']?([a-zA-Z0-9_\-]{20,})/gi,
    severity: 'high',
  },
];

/**
 * Patterns for files and paths that should be excluded from scanning
 */
const EXCLUDED_PATTERNS = [
  /\.env\.example$/i,
  /\.env\.sample$/i,
  /\.env\.template$/i,
  /\.test\.[jt]sx?$/i,
  /\.spec\.[jt]sx?$/i,
  /test\//i,
  /__tests__\//i,
  /\.test\//i,
  /fixtures?\//i,
];

/**
 * Check if a file should be excluded from scanning
 * @param {string} filePath - Path to the file
 * @returns {boolean}
 */
function shouldExcludeFile(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
 * Check if a line is a comment-only line
 * @param {string} line - Line content
 * @returns {boolean}
 */
function isCommentOnly(line) {
  const trimmed = line.trim();
  // JavaScript/TypeScript comments
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return true;
  }
  // Shell/Python comments
  if (trimmed.startsWith('#')) {
    return true;
  }
  return false;
}

/**
 * Redact a secret value, showing only first 4 characters
 * @param {string} secret - The secret to redact
 * @returns {string}
 */
function redactSecret(secret) {
  if (!secret || secret.length <= 4) {
    return '****';
  }
  return secret.substring(0, 4) + '****';
}

/**
 * Get a preview of the line with the secret redacted
 * @param {string} line - Full line content
 * @param {string} match - The matched secret
 * @returns {string}
 */
function getPreview(line, match) {
  const redacted = redactSecret(match);
  let preview = line.replace(match, redacted);

  // Truncate to 60 characters if needed
  if (preview.length > 60) {
    const matchIndex = preview.indexOf(redacted);
    if (matchIndex > 20) {
      preview = '...' + preview.substring(matchIndex - 17);
    }
    if (preview.length > 60) {
      preview = preview.substring(0, 57) + '...';
    }
  }

  return preview.trim();
}

/**
 * Scan a single file for secrets
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<Array>} Array of matches found
 */
async function scanFile(filePath) {
  const matches = [];

  try {
    // Check if file should be excluded
    if (shouldExcludeFile(filePath)) {
      return matches;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Scan each line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      // Skip comment-only lines
      if (isCommentOnly(line)) {
        continue;
      }

      // Check against each secret pattern
      for (const { name, pattern, severity } of SECRET_PATTERNS) {
        // Reset regex state
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(line)) !== null) {
          const matchedText = match[0];
          const preview = getPreview(line, matchedText);

          matches.push({
            file: filePath,
            line: lineNumber,
            pattern: name,
            severity: severity,
            preview: preview,
          });
        }
      }
    }
  } catch (err) {
    // If file can't be read (binary, permission denied, etc.), skip it
    // Don't treat read errors as scan failures
  }

  return matches;
}

/**
 * Scan multiple files for secrets
 * @param {string[]} files - Array of absolute file paths
 * @returns {Promise<{status: string, matches: Array}>}
 */
async function scanFiles(files) {
  const allMatches = [];

  // Scan all files in parallel
  const scanPromises = files.map(file => scanFile(file));
  const results = await Promise.all(scanPromises);

  // Flatten results
  for (const fileMatches of results) {
    allMatches.push(...fileMatches);
  }

  return {
    status: allMatches.length > 0 ? 'fail' : 'pass',
    matches: allMatches,
  };
}

module.exports = {
  scanFiles,
  SECRET_PATTERNS,
};
