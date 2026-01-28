/**
 * CodeRabbit Output Parser
 *
 * Parses CodeRabbit CLI output (--prompt-only format) into structured issues.
 * Categorizes by severity: CRITICAL, IMPORTANT, MINOR
 */

/**
 * Parse CodeRabbit CLI output
 *
 * Expected format:
 * ```
 * ## src/api/auth.ts
 *
 * **3 suggestion(s)**
 *
 * ### 1. Lines 45: SQL injection - use parameterized queries
 *
 * ### 2. Lines 67-69: Missing input validation on user ID
 * ```
 *
 * @param {string} output - Raw CodeRabbit output
 * @returns {Array<object>} - Structured issues
 */
function parseCodeRabbitOutput(output) {
  const issues = [];

  if (!output || typeof output !== 'string') {
    return issues;
  }

  // Split by file sections (## src/...)
  const fileSections = output.split(/^## /m).filter(s => s.trim());

  for (const section of fileSections) {
    const lines = section.split('\n');
    const filePath = lines[0].trim();

    // Skip if not a valid file path
    if (!filePath || filePath.includes('**')) {
      continue;
    }

    // Find all suggestions (### N. Lines X: Description)
    const suggestionPattern = /^### \d+\.\s+Lines?\s+(\d+(?:-\d+)?):?\s*(.+)$/gm;

    for (const match of section.matchAll(suggestionPattern)) {
      const lineNumbers = match[1]; // e.g., "45" or "67-69"
      const description = match[2].trim();

      // Categorize by keywords
      const severity = categorizeSeverity(description);

      issues.push({
        file: filePath,
        line: lineNumbers,
        description: description,
        severity: severity,
        suggestion: '' // Could extract from following lines if needed
      });
    }
  }

  return issues;
}

/**
 * Categorize issue by severity based on keywords
 * @param {string} description - Issue description
 * @returns {string} - CRITICAL | IMPORTANT | MINOR
 */
function categorizeSeverity(description) {
  const lower = description.toLowerCase();

  // CRITICAL: Security, bugs, data loss
  const criticalKeywords = [
    'security', 'sql injection', 'xss', 'csrf', 'auth', 'token',
    'hardcoded', 'secret', 'password', 'crash', 'data loss',
    'vulnerability', 'exploit', 'unsafe', 'dangerous',
    'null pointer', 'undefined', 'memory leak'
  ];

  for (const keyword of criticalKeywords) {
    if (lower.includes(keyword)) {
      return 'CRITICAL';
    }
  }

  // IMPORTANT: Performance, patterns, edge cases
  const importantKeywords = [
    'performance', 'race condition', 'deadlock', 'infinite loop',
    'missing validation', 'error handling', 'edge case',
    'boundary', 'exception', 'timeout', 'async', 'promise',
    'memory', 'optimization', 'inefficient', 'n+1'
  ];

  for (const keyword of importantKeywords) {
    if (lower.includes(keyword)) {
      return 'IMPORTANT';
    }
  }

  // MINOR: Everything else (style, naming, comments)
  return 'MINOR';
}

/**
 * Format issues for display
 * @param {Array<object>} issues - Parsed issues
 * @returns {string} - Formatted text
 */
function formatIssues(issues) {
  if (issues.length === 0) {
    return 'No issues found.';
  }

  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const important = issues.filter(i => i.severity === 'IMPORTANT');
  const minor = issues.filter(i => i.severity === 'MINOR');

  const lines = [];

  if (critical.length > 0) {
    lines.push(`CRITICAL (${critical.length}):`);
    critical.forEach(issue => {
      lines.push(`  • ${issue.file}:${issue.line}`);
      lines.push(`    ${issue.description}`);
    });
    lines.push('');
  }

  if (important.length > 0) {
    lines.push(`IMPORTANT (${important.length}):`);
    important.forEach(issue => {
      lines.push(`  • ${issue.file}:${issue.line}`);
      lines.push(`    ${issue.description}`);
    });
    lines.push('');
  }

  if (minor.length > 0) {
    lines.push(`MINOR (${minor.length}):`);
    minor.forEach(issue => {
      lines.push(`  • ${issue.file}:${issue.line} - ${issue.description}`);
    });
  }

  return lines.join('\n');
}

module.exports = {
  parseCodeRabbitOutput,
  categorizeSeverity,
  formatIssues
};
