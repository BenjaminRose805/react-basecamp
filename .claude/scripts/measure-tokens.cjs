#!/usr/bin/env node

/**
 * Token Measurement Script
 *
 * Measures token consumption of key context files using chars/4 heuristic.
 * Run: node .claude/scripts/measure-tokens.cjs
 */

const fs = require("fs");
const path = require("path");

// Token estimation: ~4 chars per token (Claude heuristic)
const CHARS_PER_TOKEN = 4;

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return null;
  }
}

function formatTokens(tokens) {
  return tokens.toLocaleString();
}

function formatPercentage(saved, original) {
  if (original === 0) return "N/A";
  return Math.round((saved / original) * 100);
}

function measureClaudeMd() {
  const rootClaudeMd = readFile(
    path.join(__dirname, "../../CLAUDE.md")
  );
  const featureClaudeMd = readFile(
    path.join(__dirname, "../../.claude/CLAUDE.md")
  );

  if (!rootClaudeMd || !featureClaudeMd) {
    return null;
  }

  const beforeTokens = estimateTokens(rootClaudeMd);
  const afterTokens = estimateTokens(featureClaudeMd);
  const savedTokens = beforeTokens - afterTokens;

  return {
    before: beforeTokens,
    after: afterTokens,
    saved: savedTokens,
    percentage: formatPercentage(savedTokens, beforeTokens),
  };
}

function measureRuleFiles() {
  const rulesDir = path.join(__dirname, "../rules");
  const ruleFiles = [
    "agents.md",
    "methodology.md",
    "coding-style.md",
    "git-workflow.md",
    "hooks.md",
    "patterns.md",
    "performance.md",
    "security.md",
    "testing.md",
  ];

  const measurements = [];

  for (const file of ruleFiles) {
    const content = readFile(path.join(rulesDir, file));
    if (content) {
      measurements.push({
        file,
        tokens: estimateTokens(content),
      });
    }
  }

  return measurements;
}

function measureRoleBundles() {
  // Simulate role-to-rules mapping from inject-rules.cjs
  const roleMapping = {
    "code-writer": ["agents", "methodology", "coding-style", "patterns", "testing"],
    "quality-validator": ["agents", "methodology", "coding-style", "testing"],
    "code-researcher": ["agents", "methodology", "patterns"],
    "ui-builder": ["agents", "methodology", "coding-style", "patterns", "testing"],
    "git-executor": ["agents", "git-workflow"],
    "security-scanner": ["agents", "security"],
  };

  const rulesDir = path.join(__dirname, "../rules");
  const bundles = [];

  for (const [role, rules] of Object.entries(roleMapping)) {
    let totalTokens = 0;

    for (const rule of rules) {
      const content = readFile(path.join(rulesDir, `${rule}.md`));
      if (content) {
        totalTokens += estimateTokens(content);
      }
    }

    bundles.push({
      role,
      tokens: totalTokens,
      rules: rules.length,
    });
  }

  return bundles;
}

function printReport() {
  console.log("=== Context Loading Optimization - Token Measurement ===\n");

  // CLAUDE.md measurement
  const claudeMd = measureClaudeMd();
  if (claudeMd) {
    console.log("CLAUDE.md:");
    console.log(`  Before: ~${formatTokens(claudeMd.before)} tokens`);
    console.log(`  After:  ~${formatTokens(claudeMd.after)} tokens`);
    console.log(`  Saved:  ~${formatTokens(claudeMd.saved)} tokens (${claudeMd.percentage}%)`);
    console.log();
  }

  // Rule files
  const ruleFiles = measureRuleFiles();
  if (ruleFiles.length > 0) {
    console.log("Rule Files:");
    ruleFiles.forEach(({ file, tokens }) => {
      console.log(`  ${file.padEnd(20)} ~${formatTokens(tokens)} tokens`);
    });
    console.log();
  }

  // Role bundles
  const bundles = measureRoleBundles();
  if (bundles.length > 0) {
    console.log("Role Bundles (via inject-rules.cjs):");
    bundles
      .sort((a, b) => b.tokens - a.tokens)
      .forEach(({ role, tokens, rules }) => {
        console.log(`  ${role.padEnd(20)} ~${formatTokens(tokens)} tokens (${rules} rules)`);
      });
    console.log();
  }

  // Summary
  console.log("Summary:");
  if (claudeMd) {
    const sessionStartTokens = claudeMd.after;
    const withinBudget = sessionStartTokens < 5000 ? "✓" : "✗";
    console.log(`  Session start: ~${formatTokens(sessionStartTokens)} tokens (target: <5,000) ${withinBudget}`);

    // Orchestrator = CLAUDE.md + agents.md
    const agentsRule = ruleFiles.find(r => r.file === "agents.md");
    if (agentsRule) {
      const orchestratorTokens = sessionStartTokens + agentsRule.tokens;
      console.log(`  Orchestrator:  ~${formatTokens(orchestratorTokens)} tokens (CLAUDE.md + agents.md)`);
    }
  }

  const totalRuleTokens = ruleFiles.reduce((sum, r) => sum + r.tokens, 0);
  console.log(`  Total rules:   ~${formatTokens(totalRuleTokens)} tokens`);
}

// Run the report
printReport();
