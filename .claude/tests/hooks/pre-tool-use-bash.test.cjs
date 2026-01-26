/**
 * Tests for .claude/scripts/hooks/pre-tool-use-bash.cjs
 */

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

const hookPath = path.join(__dirname, '../../scripts/hooks/pre-tool-use-bash.cjs');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runHook(input) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [hookPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', reject);

    // Send input and close stdin
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

async function run() {
  console.log('Testing: hooks/pre-tool-use-bash.cjs\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
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

test('allows safe commands', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_input: { command: 'ls -la' },
  });
  assert.strictEqual(result.code, 0);
});

test('allows rm -rf node_modules', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_input: { command: 'rm -rf node_modules' },
  });
  assert.strictEqual(result.code, 0);
});

test('blocks rm -rf /', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_input: { command: 'rm -rf /' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks rm -rf ~', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_input: { command: 'rm -rf ~' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks fork bomb', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_input: { command: ':(){ :|:& };:' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('handles empty input gracefully', async () => {
  const result = await runHook({});
  assert.strictEqual(result.code, 0);
});

test('handles missing tool_input gracefully', async () => {
  const result = await runHook({ session_id: 'test' });
  assert.strictEqual(result.code, 0);
});

// Run tests
run().then(success => {
  process.exit(success ? 0 : 1);
});
