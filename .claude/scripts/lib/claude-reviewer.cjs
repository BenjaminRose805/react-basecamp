/**
 * Claude Reviewer - AI-powered code review using Claude Opus
 *
 * Functions:
 * - loadReviewContext(): Gather git diff, files, commits, specs, tech stack
 * - buildReviewPrompt(context): Build prompt for Claude Opus reviewer
 * - parseClaudeOutput(output): Parse JSON response from Claude
 * - saveReviewResults(findings): Save results to state file
 * - runClaudeReview(context): Orchestrate review flow
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ensureDir, readFile, writeFile, getGitRoot } = require('./utils.cjs');

/**
 * Load review context from git and project files
 * @returns {Promise<object>} Context object with diff, files, commits, specs, tech_stack
 */
async function loadReviewContext() {
  const gitRoot = getGitRoot();

  // Get git information
  let diff = '';
  let files = [];
  let commits = '';

  try {
    // Get staged changes diff (exclude binary files)
    diff = execSync('git diff --cached --no-color --diff-filter=d', {
      cwd: gitRoot,
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    // Truncate diff if too large (max 10000 lines)
    const diffLines = diff.split('\n');
    if (diffLines.length > 10000) {
      diff = diffLines.slice(0, 10000).join('\n') + '\n\n[... diff truncated ...]';
    }

    // Get list of changed files
    const filesOutput = execSync('git diff --cached --name-only --diff-filter=d', {
      cwd: gitRoot,
      encoding: 'utf8'
    });
    files = filesOutput.trim().split('\n').filter(f => f);

    // Get recent commits
    commits = execSync('git log -5 --oneline --no-color', {
      cwd: gitRoot,
      encoding: 'utf8'
    });
  } catch (err) {
    // Git commands might fail if no staged changes
    console.warn('Warning: Failed to gather git context:', err.message);
  }

  // Find relevant specs
  let specs = [];
  const specsDir = path.join(gitRoot, 'specs');

  if (fs.existsSync(specsDir)) {
    try {
      // Get current branch name to match specs
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: gitRoot,
        encoding: 'utf8'
      }).trim();

      // Search for spec directories matching branch pattern
      const specDirs = fs.readdirSync(specsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      // Find matching spec directory
      const branchPattern = branch.replace(/^feature\//, '').replace(/[-_]/g, '[-_]');
      const matchingDir = specDirs.find(dir =>
        new RegExp(branchPattern, 'i').test(dir)
      );

      if (matchingDir) {
        const specPath = path.join(specsDir, matchingDir);
        const specFiles = fs.readdirSync(specPath)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(specPath, f));

        specs = specFiles;
      }
    } catch (err) {
      console.warn('Warning: Failed to find specs:', err.message);
    }
  }

  // Detect tech stack from package.json
  let tech_stack = ['JavaScript'];
  const packageJsonPath = path.join(gitRoot, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      if (deps['next']) tech_stack.push('Next.js');
      if (deps['react']) tech_stack.push('React');
      if (deps['vue']) tech_stack.push('Vue');
      if (deps['@angular/core']) tech_stack.push('Angular');
      if (deps['typescript']) tech_stack.push('TypeScript');
      if (deps['vitest']) tech_stack.push('Vitest');
      if (deps['jest']) tech_stack.push('Jest');
      if (deps['playwright']) tech_stack.push('Playwright');
    } catch (err) {
      console.warn('Warning: Failed to parse package.json:', err.message);
    }
  }

  return {
    diff,
    files,
    commits,
    specs,
    tech_stack: tech_stack.join(', ')
  };
}

/**
 * Build review prompt for Claude Opus
 * @param {object} context - Context from loadReviewContext()
 * @returns {string} Formatted prompt for Claude reviewer
 */
function buildReviewPrompt(context) {
  const { diff, files, commits, specs, tech_stack } = context;

  const prompt = `You are a senior code reviewer with expertise in ${tech_stack}.

Your task is to perform a comprehensive code review of the following changes.

## Review Areas

Analyze the code across these 5 areas:

1. **Code Quality**: Complexity, readability, maintainability, naming conventions
2. **Architecture**: Design patterns, separation of concerns, SOLID principles, modularity
3. **Security**: Input validation, authentication, authorization, data exposure, injection risks
4. **Testing**: Test coverage, edge cases, integration tests, test quality
5. **Documentation**: JSDoc comments, README updates, inline comments, API documentation

## Blocking Rules

- **CRITICAL** findings block the ship/merge (security issues, major bugs, data loss risks)
- **MAJOR** findings generate warnings (tech debt, missing tests, poor patterns)
- **MINOR** findings are FYI (style suggestions, minor improvements)

## Context

### Changed Files
${files.length > 0 ? files.join('\n') : 'No files changed'}

### Recent Commits
${commits || 'No recent commits'}

### Specifications
${specs.length > 0 ? `Found ${specs.length} spec file(s)` : 'No specs found'}

### Code Changes
\`\`\`diff
${diff || 'No diff available'}
\`\`\`

## Output Format

Respond with ONLY valid JSON in this exact format:

{
  "findings": [
    {
      "severity": "critical",
      "category": "security",
      "file": "path/to/file.ts",
      "line": 42,
      "message": "Clear description of the issue",
      "fix": "Actionable suggestion for fixing it"
    }
  ]
}

### Field Requirements

- **severity**: Must be one of: "critical", "major", "minor"
- **category**: Must be one of: "quality", "architecture", "security", "testing", "docs"
- **file**: Relative path from git root
- **line**: Line number where issue occurs (0 if general)
- **message**: Clear, specific description of the issue
- **fix**: Concrete, actionable suggestion

If no issues found, return: {"findings": []}

Provide thorough, actionable feedback. Focus on issues that matter.`;

  return prompt;
}

/**
 * Parse Claude output - handles raw JSON or markdown-wrapped JSON
 * @param {string} output - Raw output from Claude
 * @returns {object} Parsed findings object
 */
function parseClaudeOutput(output) {
  if (!output || typeof output !== 'string') {
    return { findings: [] };
  }

  try {
    // Try parsing as raw JSON first
    return JSON.parse(output);
  } catch (err) {
    // Try extracting JSON from markdown code block
    const jsonMatch = output.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (innerErr) {
        console.warn('Failed to parse JSON from markdown block:', innerErr.message);
      }
    }

    // Try extracting any JSON object
    const objectMatch = output.match(/\{[\s\S]*"findings"[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (innerErr) {
        console.warn('Failed to parse extracted JSON object:', innerErr.message);
      }
    }

    console.warn('Could not parse Claude output, returning empty findings');
    return { findings: [] };
  }
}

/**
 * Save review results to state file
 * @param {Array} findings - Array of finding objects
 * @returns {Promise<void>}
 */
async function saveReviewResults(findings) {
  const gitRoot = getGitRoot();
  const stateDir = path.join(gitRoot, '.claude', 'state');
  await ensureDir(stateDir);

  const resultsPath = path.join(stateDir, 'claude-review-results.json');
  const results = {
    timestamp: new Date().toISOString(),
    findings
  };

  await writeFile(resultsPath, JSON.stringify(results, null, 2));
}

/**
 * Run Claude review - prepares prompt for orchestrator to spawn sub-agent
 * @param {object} context - Context from loadReviewContext()
 * @returns {Promise<object>} Review results with status, findings, elapsed_ms
 */
async function runClaudeReview(context) {
  const startTime = Date.now();

  // Build the prompt
  const prompt = buildReviewPrompt(context);

  // In actual implementation, this would spawn a Claude sub-agent via Task()
  // For now, we return the prompt and parsing info for the orchestrator
  const result = {
    prompt,
    expectedFormat: 'json',
    parser: parseClaudeOutput,
    // Placeholder for actual review - orchestrator will fill this in
    response: null,
    findings: [],
    status: 'pending'
  };

  // If response is provided (after orchestrator runs Task), parse it
  if (result.response) {
    const parsed = parseClaudeOutput(result.response);
    result.findings = parsed.findings || [];

    // Determine status based on findings
    const hasCritical = result.findings.some(f => f.severity === 'critical');
    result.status = hasCritical ? 'fail' : 'pass';

    // Save results
    await saveReviewResults(result.findings);
  }

  const elapsed_ms = Date.now() - startTime;

  return {
    status: result.status,
    findings: result.findings,
    elapsed_ms,
    prompt // Return prompt for orchestrator to use
  };
}

module.exports = {
  loadReviewContext,
  buildReviewPrompt,
  parseClaudeOutput,
  saveReviewResults,
  runClaudeReview
};
