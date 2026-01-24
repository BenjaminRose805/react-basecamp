/**
 * Tests for .claude/scripts/hooks/
 *
 * These are integration tests that verify hooks can be loaded
 * and their basic functionality works.
 */

const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('Testing: hooks/\n');

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

const hooksDir = path.join(__dirname, '../../scripts/hooks');

// Tests

test('session-start.cjs exists and runs without error', () => {
  const hookPath = path.join(hooksDir, 'session-start.cjs');
  assert.ok(fs.existsSync(hookPath), 'Hook file missing');

  // Should run without throwing
  const result = execSync(`node "${hookPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  // Output goes to stderr, so result may be empty
});

test('session-end.cjs exists and runs without error', () => {
  const hookPath = path.join(hooksDir, 'session-end.cjs');
  assert.ok(fs.existsSync(hookPath), 'Hook file missing');

  execSync(`node "${hookPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
});

test('pre-compact.cjs exists and runs without error', () => {
  const hookPath = path.join(hooksDir, 'pre-compact.cjs');
  assert.ok(fs.existsSync(hookPath), 'Hook file missing');

  execSync(`node "${hookPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
});

test('suggest-compact.cjs exists and runs without error', () => {
  const hookPath = path.join(hooksDir, 'suggest-compact.cjs');
  assert.ok(fs.existsSync(hookPath), 'Hook file missing');

  execSync(`node "${hookPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
});

test('evaluate-session.cjs exists and runs without error', () => {
  const hookPath = path.join(hooksDir, 'evaluate-session.cjs');
  assert.ok(fs.existsSync(hookPath), 'Hook file missing');

  execSync(`node "${hookPath}"`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
});

test('all hook files use .cjs extension', () => {
  const files = fs.readdirSync(hooksDir);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.cjs'));
  assert.strictEqual(jsFiles.length, 0, `Found .js files: ${jsFiles.join(', ')}`);
});

test('all hooks require utils.cjs correctly', () => {
  const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.cjs'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
    if (content.includes("require('../lib/utils')")) {
      assert.fail(`${file} uses require('../lib/utils') instead of require('../lib/utils.cjs')`);
    }
  }
});

// Run tests
const success = run();
process.exit(success ? 0 : 1);
