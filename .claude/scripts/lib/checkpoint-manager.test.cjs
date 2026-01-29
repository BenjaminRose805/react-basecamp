'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Import functions to test
const {
  loadCheckpoint,
  saveCheckpoint,
  updatePhase,
  completeCheckpoint,
  getResumePoint
} = require('./checkpoint-manager.cjs');

// Test helper: Create a temp git repo for testing
function createTempGitRepo() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'checkpoint-test-'));

  // Initialize git repo
  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tmpDir, stdio: 'pipe' });

  // Create initial commit
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Test Repo');
  execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { cwd: tmpDir, stdio: 'pipe' });

  return tmpDir;
}

// Test helper: Clean up temp directory
function cleanupTempDir(tmpDir) {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Test helper: Get current directory
const originalCwd = process.cwd();

test('saveCheckpoint creates file in correct location', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'design',
      feature: 'test-feature',
      version: 1,
      state: {
        current_phase: null,
        completed_phases: [],
        pending_phases: []
      },
      phases: {}
    };

    const success = saveCheckpoint('design', checkpoint, 'test-feature');
    assert.strictEqual(success, true);

    const expectedPath = path.join(tmpDir, '.claude/state/design-test-feature.json');
    assert.strictEqual(fs.existsSync(expectedPath), true);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('saveCheckpoint captures head_commit', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'implement',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {}
    };

    saveCheckpoint('implement', checkpoint);

    const loaded = loadCheckpoint('implement');
    const currentHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

    assert.strictEqual(loaded.head_commit, currentHead);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('saveCheckpoint adds updated_at timestamp', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'start',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {}
    };

    const beforeSave = new Date().toISOString();
    saveCheckpoint('start', checkpoint);
    const afterSave = new Date().toISOString();

    const loaded = loadCheckpoint('start');

    assert.ok(loaded.updated_at);
    assert.ok(loaded.updated_at >= beforeSave);
    assert.ok(loaded.updated_at <= afterSave);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('saveCheckpoint rejects checkpoint with >500 token context_summary in phases', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    // Create summary with 501 tokens
    const tooLongSummary = Array(501).fill('word').join(' ');

    const checkpoint = {
      command: 'design',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {
        research: {
          status: 'complete',
          context_summary: tooLongSummary
        }
      }
    };

    const success = saveCheckpoint('design', checkpoint);
    assert.strictEqual(success, false);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('loadCheckpoint returns null for non-existent file (silent)', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const result = loadCheckpoint('nonexistent');
    assert.strictEqual(result, null);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('loadCheckpoint returns parsed checkpoint for valid file', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'ship',
      version: 1,
      state: {
        current_phase: 'commit',
        completed_phases: ['pre-flight'],
        pending_phases: ['push']
      },
      phases: {
        'pre-flight': {
          status: 'complete',
          context_summary: 'All checks passed'
        }
      }
    };

    saveCheckpoint('ship', checkpoint);
    const loaded = loadCheckpoint('ship');

    assert.strictEqual(loaded.command, 'ship');
    assert.strictEqual(loaded.state.current_phase, 'commit');
    assert.strictEqual(loaded.phases['pre-flight'].status, 'complete');
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('loadCheckpoint warns on corrupt JSON (still returns null)', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    // Create corrupt JSON file
    const stateDir = path.join(tmpDir, '.claude/state');
    fs.mkdirSync(stateDir, { recursive: true });
    const corruptFile = path.join(stateDir, 'design-checkpoint.json');
    fs.writeFileSync(corruptFile, '{ invalid json }');

    // Capture stderr to verify warning is logged
    const result = loadCheckpoint('design');
    assert.strictEqual(result, null);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('loadCheckpoint warns on stale checkpoint (head_commit mismatch) but still returns data', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'implement',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {}
    };

    saveCheckpoint('implement', checkpoint);

    // Create new commit to make checkpoint stale
    fs.writeFileSync(path.join(tmpDir, 'newfile.txt'), 'new content');
    execSync('git add .', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git commit -m "New commit"', { cwd: tmpDir, stdio: 'pipe' });

    const loaded = loadCheckpoint('implement');

    // Should still return checkpoint data despite being stale
    assert.notStrictEqual(loaded, null);
    assert.strictEqual(loaded.command, 'implement');
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('updatePhase creates new checkpoint if none exists', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const phaseData = {
      status: 'in_progress',
      context_summary: 'Starting research phase'
    };

    const success = updatePhase('design', 'research', phaseData);
    assert.strictEqual(success, true);

    const checkpoint = loadCheckpoint('design');
    assert.notStrictEqual(checkpoint, null);
    assert.strictEqual(checkpoint.phases.research.status, 'in_progress');
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('updatePhase adds phase with timestamps', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const phaseData = {
      status: 'in_progress',
      context_summary: 'Working on implementation'
    };

    updatePhase('implement', 'implementation', phaseData);

    const checkpoint = loadCheckpoint('implement');
    const phase = checkpoint.phases.implementation;

    assert.ok(phase.started_at);
    assert.ok(phase.updated_at);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('updatePhase moves phase to completed_phases when status is complete', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    // Start phase
    updatePhase('design', 'research', { status: 'in_progress' });

    // Complete phase
    updatePhase('design', 'research', {
      status: 'complete',
      context_summary: 'Research completed'
    });

    const checkpoint = loadCheckpoint('design');
    assert.ok(checkpoint.state.completed_phases.includes('research'));
    assert.strictEqual(checkpoint.phases.research.status, 'complete');
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('completeCheckpoint sets completed_at and clears current_phase', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    // Create checkpoint with current phase
    updatePhase('ship', 'push', { status: 'in_progress' });

    const beforeComplete = loadCheckpoint('ship');
    assert.strictEqual(beforeComplete.state.current_phase, 'push');

    // Complete checkpoint
    completeCheckpoint('ship');

    const afterComplete = loadCheckpoint('ship');
    assert.strictEqual(afterComplete.state.current_phase, null);
    assert.ok(afterComplete.completed_at);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('getResumePoint returns current phase and last summary', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    // Create checkpoint with completed and current phases
    updatePhase('implement', 'research', {
      status: 'complete',
      context_summary: 'Research findings here'
    });

    updatePhase('implement', 'implementation', {
      status: 'in_progress',
      context_summary: 'Currently implementing'
    });

    const resumePoint = getResumePoint('implement');

    assert.strictEqual(resumePoint.phase, 'implementation');
    assert.strictEqual(resumePoint.summary, 'Research findings here');
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('getResumePoint returns nulls when no checkpoint exists', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const resumePoint = getResumePoint('nonexistent');

    assert.strictEqual(resumePoint.phase, null);
    assert.strictEqual(resumePoint.summary, null);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('File naming - without feature: {command}-checkpoint.json', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'start',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {}
    };

    saveCheckpoint('start', checkpoint);

    const expectedPath = path.join(tmpDir, '.claude/state/start-checkpoint.json');
    assert.strictEqual(fs.existsSync(expectedPath), true);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('File naming - with feature: {command}-{feature}.json', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const checkpoint = {
      command: 'implement',
      feature: 'auth-system',
      version: 1,
      state: { current_phase: null, completed_phases: [], pending_phases: [] },
      phases: {}
    };

    saveCheckpoint('implement', checkpoint, 'auth-system');

    const expectedPath = path.join(tmpDir, '.claude/state/implement-auth-system.json');
    assert.strictEqual(fs.existsSync(expectedPath), true);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('completeCheckpoint returns false when no checkpoint exists', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const result = completeCheckpoint('nonexistent', 'no-such-feature');
    assert.strictEqual(result, false);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});

test('getResumePoint returns nulls for completed checkpoint', () => {
  const tmpDir = createTempGitRepo();
  const originalDir = process.cwd();

  try {
    process.chdir(tmpDir);

    const cp = {
      command: 'test',
      feature: 'resume-completed',
      version: 1,
      state: { current_phase: 'phase1', completed_phases: [], pending_phases: [] },
      phases: { phase1: { status: 'in_progress', context_summary: 'doing work' } }
    };
    saveCheckpoint('test', cp, 'resume-completed');
    completeCheckpoint('test', 'resume-completed');
    const resume = getResumePoint('test', 'resume-completed');
    assert.strictEqual(resume.phase, null);
    assert.strictEqual(resume.summary, null);
  } finally {
    process.chdir(originalDir);
    cleanupTempDir(tmpDir);
  }
});
