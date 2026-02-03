'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const {
  validateAndNormalizeName,
  resolveSpecPath,
  detectDirectoryType
} = require('./spec-resolver.cjs');

describe('validateAndNormalizeName', () => {
  it('accepts valid kebab-case names', () => {
    assert.strictEqual(validateAndNormalizeName('my-feature'), 'my-feature');
    assert.strictEqual(validateAndNormalizeName('feature-123'), 'feature-123');
    assert.strictEqual(validateAndNormalizeName('a'), 'a');
  });

  it('rejects uppercase letters', () => {
    assert.throws(
      () => validateAndNormalizeName('My-Feature'),
      /Invalid spec name.*lowercase-kebab-case/
    );
  });

  it('rejects underscores', () => {
    assert.throws(
      () => validateAndNormalizeName('my_feature'),
      /Invalid spec name.*lowercase-kebab-case/
    );
  });

  it('rejects spaces', () => {
    assert.throws(
      () => validateAndNormalizeName('my feature'),
      /Invalid spec name.*lowercase-kebab-case/
    );
  });

  it('normalizes multiple hyphens to single hyphen', () => {
    assert.strictEqual(validateAndNormalizeName('my--feature'), 'my-feature');
    assert.strictEqual(validateAndNormalizeName('my---feature'), 'my-feature');
  });

  it('removes leading hyphens', () => {
    assert.strictEqual(validateAndNormalizeName('-my-feature'), 'my-feature');
    assert.strictEqual(validateAndNormalizeName('--my-feature'), 'my-feature');
  });

  it('removes trailing hyphens', () => {
    assert.strictEqual(validateAndNormalizeName('my-feature-'), 'my-feature');
    assert.strictEqual(validateAndNormalizeName('my-feature--'), 'my-feature');
  });

  it('throws on empty string after normalization', () => {
    assert.throws(
      () => validateAndNormalizeName('---'),
      /Spec name cannot be empty after normalization/
    );
    assert.throws(
      () => validateAndNormalizeName(''),
      /Spec name cannot be empty after normalization/
    );
  });

  it('throws on null input', () => {
    assert.throws(
      () => validateAndNormalizeName(null),
      /cannot be null or undefined/
    );
  });

  it('throws on undefined input', () => {
    assert.throws(
      () => validateAndNormalizeName(undefined),
      /cannot be null or undefined/
    );
  });

  it('throws on non-string input', () => {
    assert.throws(
      () => validateAndNormalizeName(123),
      /must be a string/
    );
  });

  it('rejects path traversal attempts', () => {
    assert.throws(
      () => validateAndNormalizeName('../etc/passwd'),
      /Invalid spec name.*lowercase-kebab-case/
    );
  });

  it('rejects node_modules with underscores', () => {
    assert.throws(
      () => validateAndNormalizeName('node_modules'),
      /Reserved spec name/
    );
  });

  it('rejects NODE_MODULES case-insensitively', () => {
    assert.throws(
      () => validateAndNormalizeName('NODE_MODULES'),
      /Reserved spec name/
    );
  });

  it('rejects names with forward slashes', () => {
    assert.throws(
      () => validateAndNormalizeName('a/b'),
      /Invalid spec name.*lowercase-kebab-case/
    );
  });

  it('rejects reserved names', () => {
    assert.throws(
      () => validateAndNormalizeName('node_modules'),
      /Reserved spec name/
    );
    assert.throws(
      () => validateAndNormalizeName('dist'),
      /Reserved spec name/
    );
    assert.throws(
      () => validateAndNormalizeName('build'),
      /Reserved spec name/
    );
  });

  it('rejects segment longer than 50 characters', () => {
    const longSegment = 'a'.repeat(51);
    assert.throws(
      () => validateAndNormalizeName(longSegment),
      /exceeds maximum length of 50 characters/
    );
  });

  it('rejects path longer than 200 characters', () => {
    // Create a name longer than 200 characters
    const longName = 'a'.repeat(201);
    assert.throws(
      () => validateAndNormalizeName(longName),
      /exceeds maximum length of 200 characters/
    );
  });
});

describe('detectDirectoryType', () => {
  it('detects directory type for existing spec', () => {
    const testDir = path.join(process.cwd(), 'specs', 'templates');
    const type = detectDirectoryType(testDir);
    // templates contains project.md so it detects as project type
    assert.ok(['spec', 'project', 'feature'].includes(type), `Expected valid type, got: ${type}`);
  });

  it('defaults to spec for unknown directory', () => {
    const testDir = path.join(process.cwd(), 'specs', 'nonexistent-test-dir-xyz');
    const type = detectDirectoryType(testDir);
    assert.strictEqual(type, 'spec');
  });
});

describe('resolveSpecPath', () => {
  it('resolves existing spec by exact directory name', () => {
    const result = resolveSpecPath('templates');
    assert.strictEqual(result.name, 'templates');
    assert.ok(result.path.includes('templates'));
    assert.ok(path.isAbsolute(result.path));
    assert.ok(result.path.endsWith(path.sep));
  });

  it('throws on non-existent spec', () => {
    assert.throws(
      () => resolveSpecPath('nonexistent-spec-xyz-999'),
      /not found/
    );
  });

  it('normalizes input name', () => {
    const result = resolveSpecPath('--templates--');
    assert.strictEqual(result.name, 'templates');
  });
});

describe('resolveSpecPath - path format', () => {
  it('returns absolute path with trailing separator', () => {
    // This test validates the contract: resolved paths are absolute and end with separator
    // Actual spec names depend on what exists in the project's specs/ directory
    const specsDir = path.join(process.cwd(), 'specs');
    if (!fs.existsSync(specsDir)) return; // skip if no specs dir

    const entries = fs.readdirSync(specsDir, { withFileTypes: true });
    const firstSpec = entries.find(e => e.isDirectory() && !e.name.startsWith('.'));
    if (!firstSpec) return; // skip if no spec directories

    const result = resolveSpecPath(firstSpec.name);
    assert.ok(path.isAbsolute(result.path), 'path should be absolute');
    assert.ok(result.path.endsWith(path.sep), 'path should end with separator');
    assert.ok(result.type, 'type should be defined');
  });
});
