/**
 * Rate Limit Tracker for CodeRabbit API calls
 *
 * Tracks hourly usage with time-bucketed state persistence.
 * Default: 8 executions per hour
 */

const fs = require('fs');
const path = require('path');

class RateLimitTracker {
  /**
   * @param {string} stateFile - Path to state file
   * @param {number} limitPerHour - Max executions per hour (default: 8)
   */
  constructor(stateFile, limitPerHour = 8) {
    this.stateFile = stateFile;
    this.limitPerHour = limitPerHour;
    this.defaultState = {
      version: '1.0',
      limit_per_hour: limitPerHour,
      buckets: {},
      total_executions: 0,
      last_execution: null
    };
  }

  /**
   * Get current hour bucket key (YYYY-M-D-H format)
   * @returns {string}
   */
  getCurrentHourBucket() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  }

  /**
   * Load state from disk (or initialize if missing)
   * @returns {Object}
   */
  async loadState() {
    try {
      if (!fs.existsSync(this.stateFile)) {
        // Ensure directory exists
        const dir = path.dirname(this.stateFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        return { ...this.defaultState };
      }

      const content = fs.readFileSync(this.stateFile, 'utf8');
      const state = JSON.parse(content);

      // Validate schema
      if (!state.version || !state.buckets || typeof state.total_executions !== 'number') {
        console.warn('[RateLimitTracker] Invalid state schema, resetting');
        return { ...this.defaultState };
      }

      // Update limit if changed
      if (state.limit_per_hour !== this.limitPerHour) {
        state.limit_per_hour = this.limitPerHour;
      }

      return state;
    } catch (error) {
      console.warn('[RateLimitTracker] Failed to load state:', error.message);
      return { ...this.defaultState };
    }
  }

  /**
   * Save state to disk atomically
   * @param {Object} state
   */
  async saveState(state) {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tmpFile = `${this.stateFile}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(tmpFile, this.stateFile);
    } catch (error) {
      console.error('[RateLimitTracker] Failed to save state:', error.message);
      throw error;
    }
  }

  /**
   * Remove buckets older than 2 hours
   * @param {Object} state
   */
  async cleanupOldBuckets(state) {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const cleanedBuckets = {};
    let removedCount = 0;

    for (const [bucket, count] of Object.entries(state.buckets)) {
      try {
        // Parse bucket: "YYYY-M-D-H"
        const [year, month, day, hour] = bucket.split('-').map(Number);
        const bucketTime = new Date(year, month - 1, day, hour);

        if (bucketTime >= twoHoursAgo) {
          cleanedBuckets[bucket] = count;
        } else {
          removedCount++;
        }
      } catch (error) {
        // Invalid bucket format, remove it
        removedCount++;
      }
    }

    if (removedCount > 0) {
      state.buckets = cleanedBuckets;
    }
  }

  /**
   * Check if execution can proceed (quota available)
   * @returns {Promise<boolean>}
   */
  async canExecute() {
    const state = await this.loadState();
    await this.cleanupOldBuckets(state);

    const currentBucket = this.getCurrentHourBucket();
    const currentUsage = state.buckets[currentBucket] || 0;

    return currentUsage < this.limitPerHour;
  }

  /**
   * Record an execution (increment usage counter)
   * @returns {Promise<void>}
   */
  async recordExecution() {
    const state = await this.loadState();
    await this.cleanupOldBuckets(state);

    const currentBucket = this.getCurrentHourBucket();
    state.buckets[currentBucket] = (state.buckets[currentBucket] || 0) + 1;
    state.total_executions += 1;
    state.last_execution = new Date().toISOString();

    await this.saveState(state);
  }

  /**
   * Get remaining quota for current hour
   * @returns {Promise<number>}
   */
  async getRemainingQuota() {
    const state = await this.loadState();
    await this.cleanupOldBuckets(state);

    const currentBucket = this.getCurrentHourBucket();
    const currentUsage = state.buckets[currentBucket] || 0;

    return Math.max(0, this.limitPerHour - currentUsage);
  }
}

module.exports = { RateLimitTracker };
