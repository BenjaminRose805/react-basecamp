/**
 * Tests for .claude/scripts/lib/package-manager.cjs
 */

const assert = require('assert');
const path = require('path');

// Import the module
const pm = require('../../scripts/lib/package-manager.cjs');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('Testing: lib/package-manager.cjs\n');

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

test('PACKAGE_MANAGERS contains npm, pnpm, yarn, bun', () => {
  assert.ok(pm.PACKAGE_MANAGERS.npm);
  assert.ok(pm.PACKAGE_MANAGERS.pnpm);
  assert.ok(pm.PACKAGE_MANAGERS.yarn);
  assert.ok(pm.PACKAGE_MANAGERS.bun);
});

test('PACKAGE_MANAGERS have required properties', () => {
  for (const [name, config] of Object.entries(pm.PACKAGE_MANAGERS)) {
    assert.ok(config.name, `${name} missing name`);
    assert.ok(config.lockFile, `${name} missing lockFile`);
    assert.ok(config.installCmd, `${name} missing installCmd`);
    assert.ok(config.runCmd, `${name} missing runCmd`);
    assert.ok(config.execCmd, `${name} missing execCmd`);
  }
});

test('getPackageManager returns object with name, config, source', () => {
  const result = pm.getPackageManager();
  assert.ok(result.name, 'Missing name');
  assert.ok(result.config, 'Missing config');
  assert.ok(result.source, 'Missing source');
});

test('getPackageManager detects pnpm for react-basecamp', () => {
  // react-basecamp uses pnpm
  const result = pm.getPackageManager();
  assert.strictEqual(result.name, 'pnpm');
});

test('getAvailablePackageManagers returns array', () => {
  const result = pm.getAvailablePackageManagers();
  assert.ok(Array.isArray(result));
});

test('getAvailablePackageManagers includes npm (always available with Node)', () => {
  const result = pm.getAvailablePackageManagers();
  assert.ok(result.includes('npm'));
});

test('detectFromLockFile returns string or null', () => {
  const result = pm.detectFromLockFile();
  assert.ok(result === null || typeof result === 'string');
});

test('detectFromLockFile detects pnpm in react-basecamp', () => {
  // Pass the project root directory
  const projectRoot = require('path').resolve(__dirname, '../../../');
  const result = pm.detectFromLockFile(projectRoot);
  assert.strictEqual(result, 'pnpm');
});

test('detectFromPackageJson returns string or null', () => {
  const result = pm.detectFromPackageJson();
  assert.ok(result === null || typeof result === 'string');
});

test('getRunCommand returns proper command', () => {
  const result = pm.getRunCommand('test');
  assert.ok(typeof result === 'string');
  assert.ok(result.includes('test'));
});

test('getExecCommand returns proper command', () => {
  const result = pm.getExecCommand('eslint');
  assert.ok(typeof result === 'string');
  assert.ok(result.includes('eslint'));
});

test('getSelectionPrompt returns string', () => {
  const result = pm.getSelectionPrompt();
  assert.ok(typeof result === 'string');
  assert.ok(result.includes('package manager'));
});

test('getCommandPattern returns regex pattern for dev', () => {
  const result = pm.getCommandPattern('dev');
  assert.ok(typeof result === 'string');
  assert.ok(result.includes('pnpm'));
  assert.ok(result.includes('npm'));
});

// Run tests
const success = run();
process.exit(success ? 0 : 1);
