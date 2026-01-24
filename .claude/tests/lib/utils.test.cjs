/**
 * Tests for .claude/scripts/lib/utils.cjs
 */

const assert = require('assert');
const path = require('path');

// Import the module
const utils = require('../../scripts/lib/utils.cjs');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('Testing: lib/utils.cjs\n');

  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ✗ ${name}`);
      console.log(`    ${error.message}`);
      failed++;
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Tests

test('getDateString returns YYYY-MM-DD format', () => {
  const result = utils.getDateString();
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

test('getTimeString returns HH:MM format', () => {
  const result = utils.getTimeString();
  assert.match(result, /^\d{2}:\d{2}$/);
});

test('getClaudeDir returns .claude directory path', () => {
  const result = utils.getClaudeDir();
  assert.ok(result.endsWith('.claude'));
});

test('ensureDir creates directory if not exists', () => {
  const testDir = path.join(utils.getClaudeDir(), 'test-temp-dir');
  utils.ensureDir(testDir);
  const fs = require('fs');
  assert.ok(fs.existsSync(testDir));
  // Cleanup
  fs.rmdirSync(testDir);
});

test('log function exists and is callable', () => {
  assert.strictEqual(typeof utils.log, 'function');
  // Should not throw
  utils.log('Test message');
});

test('readFile returns null for non-existent file', () => {
  const result = utils.readFile('/non/existent/path/file.txt');
  assert.strictEqual(result, null);
});

test('commandExists returns boolean', () => {
  const result = utils.commandExists('node');
  assert.strictEqual(typeof result, 'boolean');
  // node should exist
  assert.strictEqual(result, true);
});

test('commandExists returns false for non-existent command', () => {
  const result = utils.commandExists('this-command-does-not-exist-12345');
  assert.strictEqual(result, false);
});

// Run tests
const success = run();
process.exit(success ? 0 : 1);
