/**
 * Tests for Config Loader with Caching
 * T015: DRY Refactoring - Efficiency
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  loadConfig,
  loadEnvironmentConfig,
  clearCache,
  getCacheStats,
  validateConfig
} = require('./config-loader.cjs');

describe('config-loader', () => {
  let tempDir;
  let testConfigPath;

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-loader-test-'));
    testConfigPath = path.join(tempDir, 'test-config.json');

    // Clear cache before each test
    clearCache();
  });

  afterEach(() => {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should load and parse a valid JSON config file', () => {
      const config = { test: 'value', number: 42 };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      const result = loadConfig(testConfigPath);
      assert.deepStrictEqual(result, config);
    });

    it('should cache config file content', () => {
      const config = { cached: true };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      // First load
      const result1 = loadConfig(testConfigPath);

      // Modify file on disk
      fs.writeFileSync(testConfigPath, JSON.stringify({ cached: false }));

      // Second load should return cached version
      const result2 = loadConfig(testConfigPath);

      assert.deepStrictEqual(result1, result2);
      assert.strictEqual(result2.cached, true);
    });

    it('should reload config when reload option is true', () => {
      const config1 = { version: 1 };
      fs.writeFileSync(testConfigPath, JSON.stringify(config1));

      // First load
      loadConfig(testConfigPath);

      // Modify file
      const config2 = { version: 2 };
      fs.writeFileSync(testConfigPath, JSON.stringify(config2));

      // Reload should get new version
      const result = loadConfig(testConfigPath, { reload: true });

      assert.strictEqual(result.version, 2);
    });

    it('should return null for non-existent files', () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.json');
      const result = loadConfig(nonExistentPath);

      assert.strictEqual(result, null);
    });

    it('should cache null for missing files', () => {
      const nonExistentPath = path.join(tempDir, 'missing.json');

      // First call
      loadConfig(nonExistentPath);

      const stats = getCacheStats();
      assert.strictEqual(stats.size, 1);
      assert.ok(stats.keys.includes(nonExistentPath));
    });

    it('should return null for invalid JSON', () => {
      fs.writeFileSync(testConfigPath, 'invalid json {');

      const result = loadConfig(testConfigPath);
      assert.strictEqual(result, null);
    });
  });

  describe('loadEnvironmentConfig', () => {
    it('should load environment.json from .claude directory', () => {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir);

      const config = {
        tools: { npm: 'pnpm' },
        verification: { enabled: true }
      };

      fs.writeFileSync(
        path.join(claudeDir, 'environment.json'),
        JSON.stringify(config)
      );

      const result = loadEnvironmentConfig(tempDir);
      assert.deepStrictEqual(result.tools, config.tools);
      assert.deepStrictEqual(result.verification, config.verification);
    });

    it('should return defaults when environment.json is missing', () => {
      const result = loadEnvironmentConfig(tempDir);

      assert.deepStrictEqual(result.tools, {});
      assert.deepStrictEqual(result.verification, {});
    });

    it('should merge config with defaults', () => {
      const claudeDir = path.join(tempDir, '.claude');
      fs.mkdirSync(claudeDir);

      const config = {
        tools: { npm: 'pnpm' },
        customField: 'value'
      };

      fs.writeFileSync(
        path.join(claudeDir, 'environment.json'),
        JSON.stringify(config)
      );

      const result = loadEnvironmentConfig(tempDir);
      assert.deepStrictEqual(result.tools, { npm: 'pnpm' });
      assert.deepStrictEqual(result.verification, {});
      assert.strictEqual(result.customField, 'value');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached configs', () => {
      const config = { test: true };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      loadConfig(testConfigPath);
      assert.strictEqual(getCacheStats().size, 1);

      clearCache();
      assert.strictEqual(getCacheStats().size, 0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache size and keys', () => {
      const config = { test: true };
      fs.writeFileSync(testConfigPath, JSON.stringify(config));

      loadConfig(testConfigPath);

      const stats = getCacheStats();
      assert.strictEqual(stats.size, 1);
      assert.ok(Array.isArray(stats.keys));
      assert.ok(stats.keys.includes(testConfigPath));
    });

    it('should return empty stats for empty cache', () => {
      const stats = getCacheStats();
      assert.strictEqual(stats.size, 0);
      assert.deepStrictEqual(stats.keys, []);
    });
  });

  describe('validateConfig', () => {
    it('should validate a valid environment config', () => {
      const validConfig = {
        tools: {
          node: {
            required: true,
            versionCommand: 'node --version',
            platforms: ['darwin', 'linux', 'win32']
          }
        },
        verification: {
          lint: true,
          typecheck: true,
          tests: false,
          build: false
        },
        git: {
          requireClean: true,
          defaultBranch: 'main'
        }
      };

      const result = validateConfig(validConfig);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject config with invalid tool.required type', () => {
      const invalidConfig = {
        tools: {
          node: {
            required: 'yes' // Should be boolean
          }
        }
      };

      const result = validateConfig(invalidConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('required') && e.includes('boolean')));
    });

    it('should reject config with invalid platform value', () => {
      const invalidConfig = {
        tools: {
          node: {
            platforms: ['darwin', 'invalid-platform']
          }
        }
      };

      const result = validateConfig(invalidConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('platform')));
    });

    it('should reject config with invalid verification type', () => {
      const invalidConfig = {
        verification: {
          lint: 'yes' // Should be boolean
        }
      };

      const result = validateConfig(invalidConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('verification') && e.includes('boolean')));
    });

    it('should reject config with invalid git.requireClean type', () => {
      const invalidConfig = {
        git: {
          requireClean: 'yes' // Should be boolean
        }
      };

      const result = validateConfig(invalidConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('git.requireClean') && e.includes('boolean')));
    });

    it('should reject config with invalid git.defaultBranch type', () => {
      const invalidConfig = {
        git: {
          defaultBranch: 123 // Should be string
        }
      };

      const result = validateConfig(invalidConfig);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('git.defaultBranch') && e.includes('string')));
    });

    it('should validate empty config', () => {
      const emptyConfig = {};
      const result = validateConfig(emptyConfig);
      assert.strictEqual(result.valid, true);
    });

    it('should allow additional properties in config', () => {
      const configWithExtra = {
        tools: {},
        customField: 'value',
        anotherField: 123
      };

      const result = validateConfig(configWithExtra);
      assert.strictEqual(result.valid, true);
    });

    it('should validate config with missing optional fields', () => {
      const minimalConfig = {
        tools: {
          node: {
            versionCommand: 'node --version'
          }
        }
      };

      const result = validateConfig(minimalConfig);
      assert.strictEqual(result.valid, true);
    });
  });
});
