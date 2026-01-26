/**
 * Tests for .claude/scripts/hooks/pre-tool-use-file.cjs
 */

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

const hookPath = path.join(__dirname, '../../scripts/hooks/pre-tool-use-file.cjs');

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
  console.log('Testing: hooks/pre-tool-use-file.cjs\n');

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

test('allows normal files', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: 'src/index.ts' },
  });
  assert.strictEqual(result.code, 0);
});

test('allows README.md', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Write',
    tool_input: { file_path: 'README.md' },
  });
  assert.strictEqual(result.code, 0);
});

test('allows .env.example', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: '.env.example' },
  });
  assert.strictEqual(result.code, 0);
});

test('allows .env.sample', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Write',
    tool_input: { file_path: '.env.sample' },
  });
  assert.strictEqual(result.code, 0);
});

test('allows .env.template', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: '.env.template' },
  });
  assert.strictEqual(result.code, 0);
});

test('blocks .env file', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: '.env' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks .env.local', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Write',
    tool_input: { file_path: '.env.local' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks credentials.json', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: 'credentials.json' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks id_rsa', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: '~/.ssh/id_rsa' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('blocks .git/config', async () => {
  const result = await runHook({
    session_id: 'test-session',
    tool_name: 'Edit',
    tool_input: { file_path: '.git/config' },
  });
  assert.strictEqual(result.code, 2);
  assert.ok(result.stderr.includes('BLOCKED'));
});

test('handles empty input gracefully', async () => {
  const result = await runHook({});
  assert.strictEqual(result.code, 0);
});

test('handles missing file_path gracefully', async () => {
  const result = await runHook({ session_id: 'test', tool_input: {} });
  assert.strictEqual(result.code, 0);
});

// Run tests
run().then(success => {
  process.exit(success ? 0 : 1);
});
