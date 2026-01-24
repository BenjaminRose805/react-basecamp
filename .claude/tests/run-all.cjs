#!/usr/bin/env node
/**
 * Test runner for .claude/scripts/
 *
 * Usage:
 *   node .claude/tests/run-all.cjs
 *   node .claude/tests/run-all.cjs --verbose
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testsDir = __dirname;
const verbose = process.argv.includes('--verbose');

console.log('='.repeat(50));
console.log('Claude Scripts Test Suite');
console.log('='.repeat(50));
console.log('');

// Find all test files
function findTestFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findTestFiles(fullPath, files);
    } else if (entry.name.endsWith('.test.cjs')) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = findTestFiles(testsDir);
console.log(`Found ${testFiles.length} test file(s)\n`);

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const testFile of testFiles) {
  const relativePath = path.relative(testsDir, testFile);

  try {
    const result = spawnSync('node', [testFile], {
      encoding: 'utf8',
      cwd: path.dirname(testFile),
      stdio: verbose ? 'inherit' : 'pipe'
    });

    if (result.status === 0) {
      // Parse output to count tests
      const output = result.stdout || '';
      const match = output.match(/(\d+) passed, (\d+) failed/);
      const passed = match ? parseInt(match[1]) : 1;
      const failed = match ? parseInt(match[2]) : 0;

      totalPassed += passed;
      totalFailed += failed;

      results.push({ file: relativePath, status: 'PASS', passed, failed });

      if (!verbose) {
        console.log(`✓ ${relativePath}`);
      }
    } else {
      totalFailed++;
      results.push({ file: relativePath, status: 'FAIL', error: result.stderr });

      console.log(`✗ ${relativePath}`);
      if (!verbose && result.stderr) {
        console.log(`  ${result.stderr.trim().split('\n')[0]}`);
      }
    }
  } catch (error) {
    totalFailed++;
    results.push({ file: relativePath, status: 'ERROR', error: error.message });
    console.log(`✗ ${relativePath} (Error: ${error.message})`);
  }
}

console.log('');
console.log('='.repeat(50));
console.log('Summary');
console.log('='.repeat(50));
console.log(`  Files:  ${testFiles.length}`);
console.log(`  Passed: ${totalPassed}`);
console.log(`  Failed: ${totalFailed}`);
console.log('');

if (totalFailed > 0) {
  console.log('Failed tests:');
  for (const result of results) {
    if (result.status !== 'PASS') {
      console.log(`  - ${result.file}`);
    }
  }
  console.log('');
  process.exit(1);
} else {
  console.log('All tests passed!');
  process.exit(0);
}
