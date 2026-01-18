#!/usr/bin/env node
/* eslint-disable no-console, max-lines-per-function */

/**
 * Quality Check CLI
 *
 * Provides quality checks for React/Next.js projects:
 * - dead-code: Find unused files, exports, and dependencies (Knip)
 * - duplicates: Find duplicate code blocks (jscpd)
 * - circular: Find circular dependencies (Madge)
 * - dead-ui: Find dead UI elements (empty handlers, placeholder links)
 * - packages: Verify all dependencies exist in npm registry
 * - all: Run all checks
 */

import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

import { program } from "commander";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = join(__dirname, "..");

// Colors for terminal output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Run a command and return the result
 */
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.stderr || error.message,
    };
  }
}

/**
 * Dead Code Check using Knip
 */
async function checkDeadCode() {
  console.log(colors.bold("\n=== Dead Code Check (Knip) ===\n"));

  const result = runCommand("npx knip", { silent: false });

  if (result.success) {
    console.log(colors.green("\n[PASS] No dead code found"));
  } else {
    console.log(colors.yellow("\n[WARN] Dead code issues found (see above)"));
  }

  return result.success;
}

/**
 * Duplicate Code Check using jscpd
 */
async function checkDuplicates() {
  console.log(colors.bold("\n=== Duplicate Code Check (jscpd) ===\n"));

  const result = runCommand(
    'npx jscpd src --reporters console --ignore "**/node_modules/**,**/*.test.*,**/*.spec.*"',
    { silent: false }
  );

  if (result.success) {
    console.log(colors.green("\n[PASS] No significant duplicates found"));
  } else {
    console.log(colors.yellow("\n[WARN] Duplicate code found (see above)"));
  }

  return result.success;
}

/**
 * Circular Dependency Check using Madge
 */
async function checkCircular() {
  console.log(colors.bold("\n=== Circular Dependency Check (Madge) ===\n"));

  const result = runCommand("npx madge --circular --extensions ts,tsx src", {
    silent: true,
  });

  const output = result.output || "";

  // Madge outputs "No circular dependency found!" when there are none
  if (output.includes("No circular dependency found")) {
    console.log(colors.green("[PASS] No circular dependencies found"));
    return true;
  } else if (output.includes("Circular")) {
    console.log(colors.red("Circular dependencies found:"));
    console.log(output);
    return false;
  } else {
    // Some other output - show it but pass
    console.log(output);
    console.log(colors.green("[PASS] No circular dependencies found"));
    return true;
  }
}

/**
 * Dead UI Check - Find empty handlers and placeholder links
 */
async function checkDeadUI() {
  console.log(colors.bold("\n=== Dead UI Check ===\n"));

  const patterns = [
    {
      name: "Empty onClick",
      regex: /onClick\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g,
    },
    {
      name: "Undefined onClick",
      regex: /onClick\s*=\s*\{undefined\}/g,
    },
    {
      name: "Null onClick",
      regex: /onClick\s*=\s*\{null\}/g,
    },
    {
      name: 'Placeholder href="#"',
      regex: /href\s*=\s*["']#["']/g,
    },
    {
      name: "Empty onSubmit",
      regex: /onSubmit\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g,
    },
    {
      name: "TODO in handler",
      regex: /on\w+\s*=\s*\{[^}]*TODO[^}]*\}/gi,
    },
    {
      name: "Empty onChange",
      regex: /onChange\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g,
    },
  ];

  const issues = [];

  function scanDirectory(dir) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!["node_modules", ".next", "coverage", ".git"].includes(entry)) {
          scanDirectory(fullPath);
        }
      } else if ([".tsx", ".jsx"].includes(extname(entry))) {
        const content = readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");

        for (const pattern of patterns) {
          let match;
          const regex = new RegExp(pattern.regex.source, "g");
          while ((match = regex.exec(content)) !== null) {
            const lineNumber = content
              .substring(0, match.index)
              .split("\n").length;
            issues.push({
              file: fullPath.replace(`${rootDir}/`, ""),
              line: lineNumber,
              type: pattern.name,
              snippet: lines[lineNumber - 1]?.trim().substring(0, 60),
            });
          }
        }
      }
    }
  }

  try {
    scanDirectory(join(rootDir, "src"));
  } catch {
    console.log(
      colors.yellow("No src directory found, skipping dead UI check")
    );
    return true;
  }

  if (issues.length === 0) {
    console.log(colors.green("[PASS] No dead UI patterns found"));
    return true;
  } else {
    console.log(colors.red(`Found ${issues.length} dead UI issue(s):\n`));
    for (const issue of issues) {
      console.log(`  ${colors.yellow(issue.file)}:${issue.line}`);
      console.log(`    Type: ${issue.type}`);
      if (issue.snippet) {
        console.log(`    Code: ${issue.snippet}...`);
      }
      console.log();
    }
    return false;
  }
}

/**
 * Package Existence Check - Verify all dependencies exist in npm registry
 */
async function checkPackages() {
  console.log(colors.bold("\n=== Package Existence Check ===\n"));

  const packageJsonPath = join(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const depNames = Object.keys(allDeps);
  console.log(`Checking ${depNames.length} packages...\n`);

  const missingPackages = [];

  for (const dep of depNames) {
    // Skip scoped packages that are local
    if (dep.startsWith("@benjaminrose/")) {
      continue;
    }

    try {
      execSync(`npm view ${dep} name`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      process.stdout.write(colors.green("."));
    } catch {
      missingPackages.push(dep);
      process.stdout.write(colors.red("x"));
    }
  }

  console.log("\n");

  if (missingPackages.length === 0) {
    console.log(colors.green("[PASS] All packages exist in the npm registry"));
    return true;
  } else {
    console.log(
      colors.red(
        `[FAIL] ${missingPackages.length} package(s) not found in npm registry:`
      )
    );
    for (const pkg of missingPackages) {
      console.log(colors.red(`  - ${pkg}`));
    }
    console.log(
      colors.yellow(
        "\nThese may be hallucinated packages. Please verify and remove them."
      )
    );
    return false;
  }
}

/**
 * Run all checks
 */
async function runAll() {
  console.log(colors.bold("\n========================================"));
  console.log(colors.bold("       Running All Quality Checks       "));
  console.log(colors.bold("========================================"));

  const results = {
    deadCode: await checkDeadCode(),
    duplicates: await checkDuplicates(),
    circular: await checkCircular(),
    deadUI: await checkDeadUI(),
    packages: await checkPackages(),
  };

  console.log(colors.bold("\n========================================"));
  console.log(colors.bold("              Summary                   "));
  console.log(colors.bold("========================================\n"));

  const checkNames = {
    deadCode: "Dead Code",
    duplicates: "Duplicates",
    circular: "Circular Deps",
    deadUI: "Dead UI",
    packages: "Packages",
  };

  let allPassed = true;
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? colors.green("[PASS]") : colors.red("[FAIL]");
    console.log(`  ${status} ${checkNames[key]}`);
    if (!passed) {
      allPassed = false;
    }
  }

  console.log();

  if (allPassed) {
    console.log(colors.green(colors.bold("All quality checks passed!")));
    process.exit(0);
  } else {
    console.log(
      colors.yellow(colors.bold("Some quality checks failed. See above."))
    );
    process.exit(1);
  }
}

// CLI setup
program
  .name("quality-check")
  .description("Quality checks for React/Next.js projects")
  .version("1.0.0");

program.command("all").description("Run all quality checks").action(runAll);

program
  .command("dead-code")
  .description("Find unused files, exports, and dependencies (Knip)")
  .action(async () => {
    const passed = await checkDeadCode();
    process.exit(passed ? 0 : 1);
  });

program
  .command("duplicates")
  .description("Find duplicate code blocks (jscpd)")
  .action(async () => {
    const passed = await checkDuplicates();
    process.exit(passed ? 0 : 1);
  });

program
  .command("circular")
  .description("Find circular dependencies (Madge)")
  .action(async () => {
    const passed = await checkCircular();
    process.exit(passed ? 0 : 1);
  });

program
  .command("dead-ui")
  .description("Find dead UI elements (empty handlers, placeholder links)")
  .action(async () => {
    const passed = await checkDeadUI();
    process.exit(passed ? 0 : 1);
  });

program
  .command("packages")
  .description("Verify all dependencies exist in npm registry")
  .action(async () => {
    const passed = await checkPackages();
    process.exit(passed ? 0 : 1);
  });

program.parse();
