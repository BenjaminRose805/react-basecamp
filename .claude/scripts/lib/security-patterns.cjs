/**
 * Security patterns for Claude Code hooks
 * Centralized security pattern definitions for dangerous commands and sensitive files
 */

/**
 * Patterns for dangerous bash commands that should be blocked
 * These patterns match destructive or dangerous operations
 *
 * IMPORTANT: We only block commands targeting dangerous paths (/, ~, $HOME, ..)
 * Safe operations like `rm -rf node_modules` or `rm -rf ./dist` are allowed
 */
const DANGEROUS_BASH_PATTERNS = [
  // Recursive force deletion targeting root, home, or parent directories
  // Allows trailing flags, whitespace, or shell operators (&&, ;, |)
  // Matches: rm -rf /, rm -rf ~, rm -rf $HOME, rm -rf .., rm -rf / --no-preserve-root, rm -rf / && ...
  /rm\s+(-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*|--recursive\s+--force|--force\s+--recursive)\s+(\/|~|\$HOME|\.\.)(?:\/)?(?:\s|$|[;&|])/i,

  // rm -rf with no target (dangerous if run in wrong directory)
  /rm\s+-rf\s*$/i,
  /rm\s+-fr\s*$/i,

  // Fork bomb patterns
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/,
  /\.\(\)\s*\{\s*\.\s*\|\s*\.\s*&\s*\}\s*;?\s*\./,

  // Dangerous disk operations - expanded device name support
  // Supports: sda, sda1, nvme0n1, nvme0n1p1, mmcblk0, mmcblk0p1, hda, vda, xvda
  /dd\s+.*of=\/dev\/(?:sd[a-z]\d*|hd[a-z]\d*|nvme\d+n\d+(?:p\d+)?|mmcblk\d+(?:p\d+)?|vd[a-z]\d*|xvd[a-z]\d*)/i,

  // mkfs with any filesystem type - expanded device support and optional arguments
  /mkfs(?:\.[a-z0-9]+)?\s+(?:-[a-zA-Z]+\s+)*\/dev\/(?:sd[a-z]\d*|hd[a-z]\d*|nvme\d+n\d+(?:p\d+)?|mmcblk\d+(?:p\d+)?|vd[a-z]\d*|xvd[a-z]\d*)/i,

  // Recursive chmod to dangerous values on system paths
  // Allow trailing content after the path
  /chmod\s+(-[a-z]*R|-R)\s+777\s+(\/|~|\$HOME)(?:\s|$|[;&|])/i,

  // Dangerous system modifications - expanded device and system file support
  // Supports: sda, sda1, hda, nvme0n1, nvme0n1p1, mmcblk0, mmcblk0p1, vda, xvda
  />\s*\/dev\/(?:sd[a-z]\d*|hd[a-z]\d*|nvme\d+n\d+(?:p\d+)?|mmcblk\d+(?:p\d+)?|vd[a-z]\d*|xvd[a-z]\d*)/i,
  />\s*\/etc\/(?:passwd|shadow|sudoers|fstab|hosts)/i,

  // Dangerous /dev/null redirects of system files
  // Supports: sda, sda1, hda, nvme0n1, nvme0n1p1, mmcblk0, mmcblk0p1, vda, xvda
  /cat\s+\/dev\/(?:zero|urandom)\s*>\s*\/dev\/(?:sd[a-z]\d*|hd[a-z]\d*|nvme\d+n\d+(?:p\d+)?|mmcblk\d+(?:p\d+)?|vd[a-z]\d*|xvd[a-z]\d*)/i,
];

/**
 * Patterns for sensitive files that should be protected from modification
 */
const SENSITIVE_FILE_PATTERNS = [
  // Environment files with secrets
  /^\.env$/i,
  /^\.env\.[^.]+$/i,  // .env.local, .env.production, etc.
  /\.env\.local$/i,
  /\.env\.production$/i,
  /\.env\.development$/i,

  // Credential and secret files
  /credentials\.json$/i,
  /secrets?\.json$/i,
  /secrets?\.ya?ml$/i,
  /\.credentials$/i,

  // Certificate and key files
  /\.pem$/i,
  /\.key$/i,
  /\.crt$/i,
  /\.p12$/i,
  /\.pfx$/i,

  // SSH keys and config
  /id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /known_hosts$/i,
  /authorized_keys$/i,
  /\.ssh\/config$/i,

  // Git internals
  /\.git\/config$/i,
  /\.git\/hooks\//i,

  // Other sensitive files
  /\.netrc$/i,
  /\.npmrc$/i,  // Can contain auth tokens
  /\.pypirc$/i,
  /kubeconfig$/i,
  /\.kube\/config$/i,
];

/**
 * Patterns for files that are explicitly allowed (exceptions to sensitive patterns)
 */
const ALLOWED_FILE_PATTERNS = [
  /\.env\.example$/i,
  /\.env\.sample$/i,
  /\.env\.template$/i,
  /\.env\.test$/i,
  /\.env\.defaults$/i,
];

/**
 * Check if a command is dangerous
 * @param {string} command - The bash command to check
 * @returns {{ blocked: boolean, reason: string }}
 */
function isDangerousCommand(command) {
  if (!command || typeof command !== 'string') {
    return { blocked: false, reason: '' };
  }

  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    if (pattern.test(command)) {
      return {
        blocked: true,
        reason: getCommandBlockReason(command, pattern),
      };
    }
  }

  return { blocked: false, reason: '' };
}

/**
 * Get a human-readable reason for why a command was blocked
 * @param {string} command - The blocked command
 * @param {RegExp} pattern - The pattern that matched
 * @returns {string}
 */
function getCommandBlockReason(command, pattern) {
  const patternStr = pattern.toString();

  if (patternStr.includes('rm') && patternStr.includes('-r')) {
    return 'Recursive force deletion is blocked for safety';
  }
  if (patternStr.includes(':\\(\\)') || patternStr.includes('.\\(\\)')) {
    return 'Fork bomb pattern detected';
  }
  if (patternStr.includes('dd') || patternStr.includes('mkfs')) {
    return 'Direct disk write operations are blocked';
  }
  if (patternStr.includes('chmod') && patternStr.includes('777')) {
    return 'Recursive chmod 777 on system paths is blocked';
  }
  if (patternStr.includes('/dev/sd') || patternStr.includes('/etc/')) {
    return 'Writing to system files/devices is blocked';
  }

  return 'Command matches a dangerous pattern';
}

/**
 * Check if a file path is sensitive and should be protected
 * @param {string} filePath - The file path to check
 * @returns {{ blocked: boolean, reason: string }}
 */
function isSensitiveFile(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { blocked: false, reason: '' };
  }

  // Normalize the path for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop() || '';

  // First check if it's explicitly allowed
  for (const allowedPattern of ALLOWED_FILE_PATTERNS) {
    if (allowedPattern.test(fileName) || allowedPattern.test(normalizedPath)) {
      return { blocked: false, reason: '' };
    }
  }

  // Then check if it's sensitive
  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(normalizedPath)) {
      return {
        blocked: true,
        reason: getSensitiveFileReason(normalizedPath, pattern),
      };
    }
  }

  return { blocked: false, reason: '' };
}

/**
 * Get a human-readable reason for why a file is blocked
 * @param {string} filePath - The blocked file path
 * @param {RegExp} pattern - The pattern that matched
 * @returns {string}
 */
function getSensitiveFileReason(filePath, pattern) {
  const patternStr = pattern.toString();

  if (patternStr.includes('.env')) {
    return 'Environment files may contain secrets - use .env.example for templates';
  }
  if (patternStr.includes('credentials') || patternStr.includes('secrets')) {
    return 'Credential/secret files are protected';
  }
  if (patternStr.includes('pem') || patternStr.includes('key') || patternStr.includes('crt')) {
    return 'Certificate and key files are protected';
  }
  if (patternStr.includes('id_') || patternStr.includes('ssh')) {
    return 'SSH keys and config are protected';
  }
  if (patternStr.includes('.git')) {
    return 'Git internal files are protected';
  }
  if (patternStr.includes('npmrc') || patternStr.includes('pypirc')) {
    return 'Package manager configs may contain auth tokens';
  }
  if (patternStr.includes('kube')) {
    return 'Kubernetes config files are protected';
  }

  return 'File matches a sensitive file pattern';
}

module.exports = {
  DANGEROUS_BASH_PATTERNS,
  SENSITIVE_FILE_PATTERNS,
  ALLOWED_FILE_PATTERNS,
  isDangerousCommand,
  isSensitiveFile,
};
