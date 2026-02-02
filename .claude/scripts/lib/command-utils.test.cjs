/**
 * Tests for Command Utilities
 * T001: Extend parseFlags() for string-typed flags
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const { detectCommand, parseFlags } = require('./command-utils.cjs');

describe('detectCommand', () => {
  it('detects valid commands', () => {
    assert.strictEqual(detectCommand('/start'), 'start');
    assert.strictEqual(detectCommand('/design feat'), 'design');
    assert.strictEqual(detectCommand('/implement'), 'implement');
  });

  it('returns null for invalid commands', () => {
    assert.strictEqual(detectCommand('/invalid'), null);
    assert.strictEqual(detectCommand('start'), null);
    assert.strictEqual(detectCommand(''), null);
  });

  it('handles null/undefined input', () => {
    assert.strictEqual(detectCommand(null), null);
    assert.strictEqual(detectCommand(undefined), null);
  });
});

describe('parseFlags - boolean flags', () => {
  it('parses boolean flags correctly', () => {
    const result = parseFlags('/start feat --full --security', {
      full: 'boolean',
      security: 'boolean',
      force: 'boolean'
    });

    assert.strictEqual(result.full, true);
    assert.strictEqual(result.security, true);
    assert.strictEqual(result.force, false);
  });

  it('handles hyphens in flag names', () => {
    const result = parseFlags('/start --skip-cr', {
      'skip-cr': 'boolean'
    });

    assert.strictEqual(result['skip-cr'], true);
  });

  it('returns all flags as false for null/undefined input', () => {
    const result = parseFlags(null, {
      full: 'boolean',
      security: 'boolean'
    });

    assert.strictEqual(result.full, false);
    assert.strictEqual(result.security, false);
  });
});

describe('parseFlags - string flags', () => {
  it('parses string flag with valid value from values array', () => {
    const result = parseFlags('/design feat --phase=research', {
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.phase, 'research');
  });

  it('returns null for string flag with invalid value', () => {
    const result = parseFlags('/design feat --phase=invalid', {
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.phase, null);
  });

  it('accepts any string when no values array is provided', () => {
    const result = parseFlags('/design feat --phase=write', {
      phase: { type: 'string' }
    });

    assert.strictEqual(result.phase, 'write');
  });

  it('returns null when string flag is absent', () => {
    const result = parseFlags('/design feat', {
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.phase, null);
  });

  it('returns null for string flag without value (--flag format)', () => {
    const result = parseFlags('/design feat --phase', {
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.phase, null);
  });

  it('handles case-insensitive flag names', () => {
    const result = parseFlags('/design feat --PHASE=research', {
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.phase, 'research');
  });

  it('returns null for all string flags when input is null/undefined', () => {
    const resultNull = parseFlags(null, {
      phase: { type: 'string', values: ['research', 'write'] }
    });

    const resultUndefined = parseFlags(undefined, {
      phase: { type: 'string', values: ['research', 'write'] }
    });

    assert.strictEqual(resultNull.phase, null);
    assert.strictEqual(resultUndefined.phase, null);
  });
});

describe('parseFlags - mixed boolean and string flags', () => {
  it('parses mixed boolean and string flags', () => {
    const result = parseFlags('/design feat --full --phase=research', {
      full: 'boolean',
      phase: { type: 'string', values: ['research', 'write', 'validate'] }
    });

    assert.strictEqual(result.full, true);
    assert.strictEqual(result.phase, 'research');
  });

  it('handles multiple string flags', () => {
    const result = parseFlags('/command --mode=dev --env=test', {
      mode: { type: 'string', values: ['dev', 'prod'] },
      env: { type: 'string', values: ['test', 'staging', 'prod'] }
    });

    assert.strictEqual(result.mode, 'dev');
    assert.strictEqual(result.env, 'test');
  });

  it('returns correct defaults for mixed flags with null input', () => {
    const result = parseFlags(null, {
      full: 'boolean',
      phase: { type: 'string', values: ['research', 'write'] }
    });

    assert.strictEqual(result.full, false);
    assert.strictEqual(result.phase, null);
  });
});

describe('parseFlags - edge cases', () => {
  it('handles empty flagDefinitions object', () => {
    const result = parseFlags('/command --full', {});
    assert.deepStrictEqual(result, {});
  });

  it('handles null flagDefinitions', () => {
    const result = parseFlags('/command --full', null);
    assert.deepStrictEqual(result, {});
  });

  it('handles string flag with special characters in value', () => {
    const result = parseFlags('/command --path=/home/user/file.txt', {
      path: { type: 'string' }
    });

    assert.strictEqual(result.path, '/home/user/file.txt');
  });

  it('handles string flag value with spaces is captured until first space', () => {
    // Regex uses \\S+ which captures non-whitespace
    const result = parseFlags('/command --msg=hello world', {
      msg: { type: 'string' }
    });

    assert.strictEqual(result.msg, 'hello');
  });
});
