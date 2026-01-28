/**
 * Rule injection utility for sub-agent orchestration
 *
 * Provides targeted rule injection based on sub-agent role to reduce
 * context overhead while maintaining quality standards.
 *
 * Usage:
 *   const { injectRulesForRole } = require('./inject-rules.cjs');
 *   const rules = injectRulesForRole('code-writer');
 */

const path = require('path');
const { readFile, logError, getGitRoot } = require('../../scripts/lib/utils.cjs');

/**
 * Role-to-rules mapping
 * Each role gets only the rules relevant to its responsibilities
 */
const ROLE_RULE_MAP = {
  // Code domain (backend/API)
  'code-researcher': ['patterns.md', 'coding-style.md'],
  'code-writer': ['patterns.md', 'coding-style.md'],

  // UI domain (frontend/components)
  'ui-researcher': ['patterns.md', 'coding-style.md'],
  'ui-builder': ['patterns.md', 'coding-style.md'],

  // Planning domain (using consolidated templates)
  'domain-researcher': ['methodology.md'], // plan mode
  'domain-writer': ['methodology.md'], // plan mode

  // Backward compatibility aliases for renamed planning roles
  'plan-researcher': ['methodology.md'], // alias for domain-researcher
  'plan-writer': ['methodology.md'], // alias for domain-writer

  // Quality domain
  'quality-validator': ['testing.md'],
  'quality-checker': ['testing.md'],

  // Git domain
  'git-executor': ['git-workflow.md'],

  // Security domain
  'security-scanner': ['security.md'],

  // PR review (needs both git and security)
  'pr-reviewer': ['git-workflow.md', 'security.md'],
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Get the rules directory path
 * @returns {string} Path to .claude/rules directory
 */
function getRulesDir() {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    throw new Error('Not in a git repository. Cannot locate .claude/rules directory.');
  }
  return path.join(gitRoot, '.claude', 'rules');
}

/**
 * Inject rules for a specific role
 *
 * @param {string} role - The sub-agent role (e.g., 'code-writer', 'ui-builder')
 * @returns {string} Formatted rules content with XML wrapper, or empty string if role unknown
 */
function injectRulesForRole(role) {
  // Check if role exists in mapping
  if (!ROLE_RULE_MAP[role]) {
    logError(`[inject-rules] Warning: Unknown role "${role}". No rules injected.`);
    return '';
  }

  const ruleFiles = ROLE_RULE_MAP[role];
  const rulesDir = getRulesDir();
  const ruleContents = [];

  // Read each rule file
  for (const ruleFile of ruleFiles) {
    const filePath = path.join(rulesDir, ruleFile);
    const content = readFile(filePath);

    if (!content) {
      logError(`[inject-rules] Warning: Could not read rule file "${ruleFile}"`);
      continue;
    }

    ruleContents.push(content.trim());
  }

  // If no rules were loaded, return empty
  if (ruleContents.length === 0) {
    logError(`[inject-rules] Warning: No rules loaded for role "${role}"`);
    return '';
  }

  // Combine rules with separators
  const combinedRules = ruleContents.join('\n\n---\n\n');

  // Wrap in XML for clarity
  const output = `<injected-rules role="${role}">
${combinedRules}
</injected-rules>`;

  // Log token estimate to stderr
  const tokenCount = estimateTokens(output);
  logError(`[inject-rules] Injected ${ruleFiles.length} rule file(s) for role "${role}" (~${tokenCount} tokens)`);

  return output;
}

module.exports = {
  injectRulesForRole,
  ROLE_RULE_MAP,
};
