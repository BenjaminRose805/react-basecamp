/**
 * Tests for .claude/scripts/lib/security-patterns.cjs
 */

const assert = require('assert');

// Import the module
const {
  isDangerousCommand,
  isSensitiveFile,
  DANGEROUS_BASH_PATTERNS,
  SENSITIVE_FILE_PATTERNS,
  ALLOWED_FILE_PATTERNS,
} = require('../../scripts/lib/security-patterns.cjs');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  console.log('Testing: lib/security-patterns.cjs\n');

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

// ====== Dangerous Command Tests ======

test('blocks rm -rf /', () => {
  const result = isDangerousCommand('rm -rf /');
  assert.strictEqual(result.blocked, true);
  assert.ok(result.reason.length > 0);
});

test('blocks rm -rf ~', () => {
  const result = isDangerousCommand('rm -rf ~');
  assert.strictEqual(result.blocked, true);
});

test('blocks rm -fr /', () => {
  const result = isDangerousCommand('rm -fr /');
  assert.strictEqual(result.blocked, true);
});

test('blocks rm --recursive --force /', () => {
  const result = isDangerousCommand('rm --recursive --force /');
  assert.strictEqual(result.blocked, true);
});

test('blocks rm -rf $HOME', () => {
  const result = isDangerousCommand('rm -rf $HOME');
  assert.strictEqual(result.blocked, true);
});

test('allows rm -rf node_modules', () => {
  const result = isDangerousCommand('rm -rf node_modules');
  assert.strictEqual(result.blocked, false);
});

test('allows rm -rf ./dist', () => {
  const result = isDangerousCommand('rm -rf ./dist');
  assert.strictEqual(result.blocked, false);
});

test('allows rm single file', () => {
  const result = isDangerousCommand('rm file.txt');
  assert.strictEqual(result.blocked, false);
});

test('blocks fork bomb :(){ :|:& };:', () => {
  const result = isDangerousCommand(':(){ :|:& };:');
  assert.strictEqual(result.blocked, true);
  assert.ok(result.reason.includes('Fork bomb'));
});

test('blocks dd to /dev/sda', () => {
  const result = isDangerousCommand('dd if=/dev/zero of=/dev/sda');
  assert.strictEqual(result.blocked, true);
});

test('blocks mkfs on disk', () => {
  const result = isDangerousCommand('mkfs.ext4 /dev/sda1');
  assert.strictEqual(result.blocked, true);
});

test('blocks recursive chmod 777 /', () => {
  const result = isDangerousCommand('chmod -R 777 /');
  assert.strictEqual(result.blocked, true);
});

test('allows chmod 644 file.txt', () => {
  const result = isDangerousCommand('chmod 644 file.txt');
  assert.strictEqual(result.blocked, false);
});

test('handles null input gracefully', () => {
  const result = isDangerousCommand(null);
  assert.strictEqual(result.blocked, false);
});

test('handles empty string', () => {
  const result = isDangerousCommand('');
  assert.strictEqual(result.blocked, false);
});

test('allows normal commands', () => {
  const commands = [
    'ls -la',
    'cat file.txt',
    'npm install',
    'pnpm build',
    'git commit -m "test"',
    'mkdir -p dist',
  ];
  for (const cmd of commands) {
    const result = isDangerousCommand(cmd);
    assert.strictEqual(result.blocked, false, `${cmd} should not be blocked`);
  }
});

// ====== Sensitive File Tests ======

test('blocks .env file', () => {
  const result = isSensitiveFile('.env');
  assert.strictEqual(result.blocked, true);
  assert.ok(result.reason.includes('Environment'));
});

test('blocks .env.local', () => {
  const result = isSensitiveFile('.env.local');
  assert.strictEqual(result.blocked, true);
});

test('blocks .env.production', () => {
  const result = isSensitiveFile('.env.production');
  assert.strictEqual(result.blocked, true);
});

test('allows .env.example', () => {
  const result = isSensitiveFile('.env.example');
  assert.strictEqual(result.blocked, false);
});

test('allows .env.sample', () => {
  const result = isSensitiveFile('.env.sample');
  assert.strictEqual(result.blocked, false);
});

test('allows .env.template', () => {
  const result = isSensitiveFile('.env.template');
  assert.strictEqual(result.blocked, false);
});

test('blocks credentials.json', () => {
  const result = isSensitiveFile('credentials.json');
  assert.strictEqual(result.blocked, true);
});

test('blocks secrets.json', () => {
  const result = isSensitiveFile('secrets.json');
  assert.strictEqual(result.blocked, true);
});

test('blocks .pem files', () => {
  const result = isSensitiveFile('server.pem');
  assert.strictEqual(result.blocked, true);
});

test('blocks .key files', () => {
  const result = isSensitiveFile('private.key');
  assert.strictEqual(result.blocked, true);
});

test('blocks id_rsa', () => {
  const result = isSensitiveFile('id_rsa');
  assert.strictEqual(result.blocked, true);
});

test('blocks id_ed25519', () => {
  const result = isSensitiveFile('id_ed25519');
  assert.strictEqual(result.blocked, true);
});

test('blocks authorized_keys', () => {
  const result = isSensitiveFile('authorized_keys');
  assert.strictEqual(result.blocked, true);
});

test('blocks .git/config', () => {
  const result = isSensitiveFile('.git/config');
  assert.strictEqual(result.blocked, true);
});

test('blocks .git/hooks/pre-commit', () => {
  const result = isSensitiveFile('.git/hooks/pre-commit');
  assert.strictEqual(result.blocked, true);
});

test('blocks full path to .env', () => {
  const result = isSensitiveFile('/home/user/project/.env');
  assert.strictEqual(result.blocked, true);
});

test('handles Windows paths', () => {
  const result = isSensitiveFile('C:\\Users\\test\\.env');
  assert.strictEqual(result.blocked, true);
});

test('handles null input gracefully', () => {
  const result = isSensitiveFile(null);
  assert.strictEqual(result.blocked, false);
});

test('handles empty string', () => {
  const result = isSensitiveFile('');
  assert.strictEqual(result.blocked, false);
});

test('allows normal files', () => {
  const files = [
    'README.md',
    'package.json',
    'src/index.ts',
    'components/Button.tsx',
    '.gitignore',
    'tsconfig.json',
  ];
  for (const file of files) {
    const result = isSensitiveFile(file);
    assert.strictEqual(result.blocked, false, `${file} should not be blocked`);
  }
});

// ====== Pattern Array Tests ======

test('DANGEROUS_BASH_PATTERNS is an array', () => {
  assert.ok(Array.isArray(DANGEROUS_BASH_PATTERNS));
  assert.ok(DANGEROUS_BASH_PATTERNS.length > 0);
});

test('SENSITIVE_FILE_PATTERNS is an array', () => {
  assert.ok(Array.isArray(SENSITIVE_FILE_PATTERNS));
  assert.ok(SENSITIVE_FILE_PATTERNS.length > 0);
});

test('ALLOWED_FILE_PATTERNS is an array', () => {
  assert.ok(Array.isArray(ALLOWED_FILE_PATTERNS));
  assert.ok(ALLOWED_FILE_PATTERNS.length > 0);
});

// Run tests
const success = run();
process.exit(success ? 0 : 1);
