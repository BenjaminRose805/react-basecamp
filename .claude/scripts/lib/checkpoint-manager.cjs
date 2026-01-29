'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readFile, writeFile, ensureDir, getStateDir, logError } = require('./utils.cjs');
const { validateContextSummary } = require('./token-counter.cjs');

/**
 * Get checkpoint filename based on command and optional feature
 * @param {string} command - Command name (start|design|implement|ship|review|reconcile|research)
 * @param {string|null} feature - Optional feature name
 * @returns {string} Checkpoint filename
 */
function getCheckpointFilename(command, feature) {
  return feature ? `${command}-${feature}.json` : `${command}-checkpoint.json`;
}

/**
 * Get current git HEAD commit hash
 * @returns {string|null} Current HEAD commit hash or null if error
 */
function getCurrentHead() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Load checkpoint for a command
 * @param {string} command - Command name (start|design|implement|ship|review|reconcile|research)
 * @param {string} [feature=null] - Optional feature name for feature-specific checkpoints
 * @returns {Object|null} Checkpoint object or null if not found/error
 */
function loadCheckpoint(command, feature = null) {
  try {
    const filePath = path.join(getStateDir(), getCheckpointFilename(command, feature));

    // If file doesn't exist, return null silently (expected case)
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Read file
    const data = readFile(filePath);
    if (!data) {
      return null;
    }

    // Parse JSON
    let checkpoint;
    try {
      checkpoint = JSON.parse(data);
    } catch (parseError) {
      logError(`Checkpoint file exists but is corrupt: ${filePath}`);
      return null;
    }

    // Compare head_commit to current HEAD (warn if different, non-blocking)
    const currentHead = getCurrentHead();
    if (currentHead && checkpoint.head_commit && checkpoint.head_commit !== currentHead) {
      logError(`Checkpoint is stale (saved at ${checkpoint.head_commit.slice(0, 7)}, current HEAD is ${currentHead.slice(0, 7)})`);
    }

    return checkpoint;
  } catch (error) {
    logError(`Failed to load checkpoint: ${error.message}`);
    return null;
  }
}

/**
 * Save checkpoint for a command
 * @param {string} command - Command name
 * @param {Object} checkpoint - Checkpoint data
 * @param {string} [feature=null] - Optional feature name
 * @returns {boolean} True if saved successfully, false otherwise
 */
function saveCheckpoint(command, checkpoint, feature = null) {
  try {
    // Validate context_summary in all phases
    if (checkpoint.phases) {
      for (const [phaseName, phaseData] of Object.entries(checkpoint.phases)) {
        if (phaseData.context_summary) {
          const validation = validateContextSummary(phaseData.context_summary);
          if (!validation.valid) {
            logError(`Phase "${phaseName}" ${validation.error}`);
            return false;
          }
        }
      }
    }

    // Capture current HEAD commit
    const headCommit = getCurrentHead();
    if (headCommit) {
      checkpoint.head_commit = headCommit;
    }

    // Set updated_at timestamp
    checkpoint.updated_at = new Date().toISOString();

    // Set started_at if not already set
    if (!checkpoint.started_at) {
      checkpoint.started_at = new Date().toISOString();
    }

    // Ensure state directory exists
    ensureDir(getStateDir());

    // Build file path
    const filePath = path.join(getStateDir(), getCheckpointFilename(command, feature));

    // Write checkpoint
    writeFile(filePath, JSON.stringify(checkpoint, null, 2));

    return true;
  } catch (error) {
    logError(`Failed to save checkpoint: ${error.message}`);
    return false;
  }
}

/**
 * Update a specific phase in checkpoint
 * @param {string} command - Command name
 * @param {string} phaseName - Phase to update
 * @param {Object} phaseData - Phase data (status, context_summary, files, etc.)
 * @param {string} [feature=null] - Optional feature name
 * @returns {boolean} True if updated successfully, false otherwise
 */
function updatePhase(command, phaseName, phaseData, feature = null) {
  try {
    // Load existing checkpoint or create new one
    let checkpoint = loadCheckpoint(command, feature);

    if (!checkpoint) {
      // Create new checkpoint with defaults
      checkpoint = {
        command,
        version: 1,
        state: {
          current_phase: null,
          completed_phases: [],
          pending_phases: []
        },
        phases: {}
      };

      if (feature) {
        checkpoint.feature = feature;
      }
    }

    // Initialize phases object if missing
    if (!checkpoint.phases) {
      checkpoint.phases = {};
    }

    // Initialize state if missing
    if (!checkpoint.state) {
      checkpoint.state = {
        current_phase: null,
        completed_phases: [],
        pending_phases: []
      };
    }

    // Add started_at if new phase and status is in_progress
    if (!checkpoint.phases[phaseName] && phaseData.status === 'in_progress') {
      phaseData.started_at = new Date().toISOString();
    }

    // Always set updated_at
    phaseData.updated_at = new Date().toISOString();

    // Update phase data
    checkpoint.phases[phaseName] = {
      ...checkpoint.phases[phaseName],
      ...phaseData
    };

    // Update state based on phase status
    if (phaseData.status === 'in_progress') {
      checkpoint.state.current_phase = phaseName;
    }

    if (phaseData.status === 'complete') {
      // Add to completed_phases if not already there
      if (!checkpoint.state.completed_phases.includes(phaseName)) {
        checkpoint.state.completed_phases.push(phaseName);
      }

      // Remove from pending_phases if present
      checkpoint.state.pending_phases = checkpoint.state.pending_phases.filter(p => p !== phaseName);
    }

    if (phaseData.status === 'failed') {
      // Remove from pending_phases if present (do NOT add to completed_phases)
      checkpoint.state.pending_phases = checkpoint.state.pending_phases.filter(p => p !== phaseName);
    }

    // Save checkpoint
    return saveCheckpoint(command, checkpoint, feature);
  } catch (error) {
    logError(`Failed to update phase: ${error.message}`);
    return false;
  }
}

/**
 * Mark checkpoint as complete
 * @param {string} command - Command name
 * @param {string} [feature=null] - Optional feature name
 * @returns {boolean} True if marked complete, false otherwise
 */
function completeCheckpoint(command, feature = null) {
  try {
    // Load checkpoint
    const checkpoint = loadCheckpoint(command, feature);

    if (!checkpoint) {
      logError('Cannot complete checkpoint: no checkpoint found');
      return false;
    }

    // Set state
    checkpoint.state.current_phase = null;
    checkpoint.state.pending_phases = [];

    // Add completed_at timestamp
    checkpoint.completed_at = new Date().toISOString();

    // Save checkpoint
    return saveCheckpoint(command, checkpoint, feature);
  } catch (error) {
    logError(`Failed to complete checkpoint: ${error.message}`);
    return false;
  }
}

/**
 * Get resume point from checkpoint
 * @param {string} command - Command name
 * @param {string} [feature=null] - Optional feature name
 * @returns {{phase: string|null, summary: string|null}} Resume point info
 */
function getResumePoint(command, feature = null) {
  try {
    // Load checkpoint
    const checkpoint = loadCheckpoint(command, feature);

    // Return nulls if no checkpoint or checkpoint is complete
    if (!checkpoint || checkpoint.completed_at) {
      return { phase: null, summary: null };
    }

    // Get current phase
    const currentPhase = checkpoint.state?.current_phase || null;

    // Find last completed phase's context_summary
    let lastSummary = null;
    if (checkpoint.state?.completed_phases && checkpoint.phases) {
      const completedPhases = checkpoint.state.completed_phases;
      // Get the last completed phase
      if (completedPhases.length > 0) {
        const lastPhase = completedPhases[completedPhases.length - 1];
        if (checkpoint.phases[lastPhase]?.context_summary) {
          lastSummary = checkpoint.phases[lastPhase].context_summary;
        }
      }
    }

    return { phase: currentPhase, summary: lastSummary };
  } catch (error) {
    logError(`Failed to get resume point: ${error.message}`);
    return { phase: null, summary: null };
  }
}

module.exports = {
  loadCheckpoint,
  saveCheckpoint,
  updatePhase,
  completeCheckpoint,
  getResumePoint
};
