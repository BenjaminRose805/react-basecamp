const test = require('node:test');
const assert = require('node:assert');
const { MAX_SUMMARY_TOKENS, countTokens, validateContextSummary } = require('./token-counter.cjs');

test('countTokens - counts words in simple text', () => {
  assert.strictEqual(countTokens('hello world'), 2);
});

test('countTokens - handles multiple spaces', () => {
  assert.strictEqual(countTokens('  multiple   spaces  '), 2);
});

test('countTokens - returns 0 for empty string', () => {
  assert.strictEqual(countTokens(''), 0);
});

test('countTokens - returns 0 for null', () => {
  assert.strictEqual(countTokens(null), 0);
});

test('countTokens - returns 0 for undefined', () => {
  assert.strictEqual(countTokens(undefined), 0);
});

test('validateContextSummary - valid short summary', () => {
  const result = validateContextSummary('short summary');
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.tokenCount, 2);
  assert.strictEqual(result.limit, 500);
  assert.strictEqual(result.error, undefined);
});

test('validateContextSummary - exceeds 500 token limit', () => {
  const longText = Array(501).fill('word').join(' ');
  const result = validateContextSummary(longText);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.tokenCount, 501);
  assert.strictEqual(result.limit, 500);
  assert.match(result.error, /exceeds 500 token limit/);
  assert.match(result.error, /501 tokens/);
});

test('validateContextSummary - exactly 500 tokens', () => {
  const exactText = Array(500).fill('word').join(' ');
  const result = validateContextSummary(exactText);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.tokenCount, 500);
  assert.strictEqual(result.limit, 500);
  assert.strictEqual(result.error, undefined);
});

test('validateContextSummary - custom maxTokens override', () => {
  const text = 'one two three';
  const result = validateContextSummary(text, 2);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.tokenCount, 3);
  assert.strictEqual(result.limit, 2);
  assert.match(result.error, /exceeds 2 token limit/);
  assert.match(result.error, /3 tokens/);
});

test('validateContextSummary - custom maxTokens within limit', () => {
  const text = 'one two';
  const result = validateContextSummary(text, 5);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.tokenCount, 2);
  assert.strictEqual(result.limit, 5);
  assert.strictEqual(result.error, undefined);
});

test('MAX_SUMMARY_TOKENS - constant is defined', () => {
  assert.strictEqual(MAX_SUMMARY_TOKENS, 500);
});
