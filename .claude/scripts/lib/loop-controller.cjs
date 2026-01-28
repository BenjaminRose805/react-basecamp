/**
 * Loop Controller for 4-Loop Review System
 *
 * Orchestrates execution of all review loops with state persistence,
 * rate limiting, and ship decision logic.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { RateLimitTracker } = require('./rate-limit-tracker.cjs');
const { runTier1Checks, runTier2Checks } = require('./free-checks.cjs');
const {
  buildReviewPrompt,
  runClaudeReview,
  loadReviewContext,
  parseClaudeOutput,
  saveReviewResults
} = require('./claude-reviewer.cjs');

class LoopController {
  /**
   * @param {Object} config - Configuration object
   * @param {string} stateDir - Directory for state files
   */
  constructor(config, stateDir) {
    this.config = config;
    this.stateDir = stateDir;
    this.stateFile = path.join(stateDir, 'loop-state.json');
    this.rateLimitFile = path.join(stateDir, 'rate-limit-state.json');
    this.rateLimiter = new RateLimitTracker(
      this.rateLimitFile,
      config.loop3?.rate_limit_per_hour || 8
    );
  }

  /**
   * Get current git branch and HEAD commit
   * @returns {{branch: string, commit: string}}
   */
  getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      return { branch, commit };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown' };
    }
  }

  /**
   * Execute Loop 1 Tier 1 (fast free checks)
   * @returns {Promise<Object>}
   */
  async executeLoop1Tier1() {
    const startTime = Date.now();
    console.log('[Loop1-T1] Running fast free checks...');

    try {
      const result = await runTier1Checks(this.config.loop1?.tier1_timeout || 30);
      const elapsed = Date.now() - startTime;

      return {
        status: result.passed ? 'pass' : 'fail',
        elapsed_ms: elapsed,
        details: result
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      return {
        status: 'fail',
        elapsed_ms: elapsed,
        details: { error: error.message }
      };
    }
  }

  /**
   * Execute Loop 1 Tier 2 (slower free checks)
   * @returns {Promise<Object>}
   */
  async executeLoop1Tier2() {
    const startTime = Date.now();
    console.log('[Loop1-T2] Running comprehensive free checks...');

    try {
      const result = await runTier2Checks(this.config.loop1?.tier2_timeout || 120);
      const elapsed = Date.now() - startTime;

      return {
        status: result.passed ? 'pass' : 'fail',
        elapsed_ms: elapsed,
        details: result
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      return {
        status: 'fail',
        elapsed_ms: elapsed,
        details: { error: error.message }
      };
    }
  }

  /**
   * Execute Loop 2 (Claude reviewer)
   * Returns prompt for sub-agent spawning rather than executing directly
   * @returns {Promise<Object>}
   */
  async executeLoop2() {
    const startTime = Date.now();
    console.log('[Loop2] Preparing Claude review...');

    try {
      if (!this.config.loop2?.enabled) {
        return {
          status: 'skip',
          reason: 'disabled_in_config',
          elapsed_ms: Date.now() - startTime
        };
      }

      // Load review context (files, diff)
      const context = await loadReviewContext();

      // Build review prompt
      const reviewPrompt = buildReviewPrompt(context);

      // Return prompt for spawning sub-agent (following anti-patterns rule)
      return {
        status: 'ready',
        elapsed_ms: Date.now() - startTime,
        context,
        reviewPrompt,
        model: this.config.loop2?.model || 'opus',
        message: 'Ready for sub-agent execution. Spawn Task with this prompt.'
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      return {
        status: 'fail',
        elapsed_ms: elapsed,
        details: { error: error.message }
      };
    }
  }

  /**
   * Execute Loop 3 (CodeRabbit with rate limiting)
   * @param {Object} flags - Command flags
   * @returns {Promise<Object>}
   */
  async executeLoop3(flags = {}) {
    const startTime = Date.now();
    console.log('[Loop3] Checking CodeRabbit availability...');

    try {
      // Check skip flag
      if (flags.skipCr) {
        return {
          status: 'skip',
          reason: 'flag_skip',
          elapsed_ms: Date.now() - startTime
        };
      }

      // Check if enabled
      if (!this.config.loop3?.enabled) {
        return {
          status: 'skip',
          reason: 'disabled_in_config',
          elapsed_ms: Date.now() - startTime
        };
      }

      // Check rate limit
      const canExecute = await this.rateLimiter.canExecute();
      const remaining = await this.rateLimiter.getRemainingQuota();

      if (!canExecute) {
        console.log(`[Loop3] Rate limit exceeded (${remaining} remaining this hour)`);
        return {
          status: 'skip',
          reason: 'rate_limit_exceeded',
          elapsed_ms: Date.now() - startTime,
          remaining_quota: remaining
        };
      }

      console.log(`[Loop3] Running CodeRabbit (${remaining - 1} remaining after this)...`);

      // Execute CodeRabbit (placeholder - may not be installed)
      let output;
      try {
        // Get staged diff and pass to CodeRabbit
        const diff = execSync('git diff --cached', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

        if (!diff.trim()) {
          return {
            status: 'skip',
            reason: 'no_staged_changes',
            elapsed_ms: Date.now() - startTime
          };
        }

        // Try to execute CodeRabbit
        output = execSync('coderabbit review --stdin', {
          input: diff,
          encoding: 'utf8',
          timeout: 60000, // 60s timeout
          maxBuffer: 10 * 1024 * 1024
        });

        // Record execution
        await this.rateLimiter.recordExecution();
      } catch (error) {
        // CodeRabbit not installed or failed
        if (error.message.includes('command not found') || error.code === 'ENOENT') {
          console.log('[Loop3] CodeRabbit CLI not installed, skipping');
          return {
            status: 'skip',
            reason: 'coderabbit_not_installed',
            elapsed_ms: Date.now() - startTime
          };
        }

        // Other execution error
        return {
          status: 'fail',
          elapsed_ms: Date.now() - startTime,
          details: { error: error.message }
        };
      }

      // Parse CodeRabbit output (simple parsing)
      const findings = this.parseCodeRabbitOutput(output);

      return {
        status: findings.some(f => f.severity === 'critical') ? 'fail' : 'pass',
        elapsed_ms: Date.now() - startTime,
        findings,
        remaining_quota: remaining - 1
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      return {
        status: 'fail',
        elapsed_ms: elapsed,
        details: { error: error.message }
      };
    }
  }

  /**
   * Parse CodeRabbit output into findings
   * @param {string} output
   * @returns {Array<Object>}
   */
  parseCodeRabbitOutput(output) {
    const findings = [];

    // Simple parsing - look for common patterns
    const lines = output.split('\n');
    for (const line of lines) {
      // Example: "ERROR: Security issue in file.js:42"
      const errorMatch = line.match(/ERROR:\s*(.+)/i);
      if (errorMatch) {
        findings.push({
          severity: 'critical',
          message: errorMatch[1],
          source: 'coderabbit'
        });
        continue;
      }

      // Example: "WARNING: Code smell in file.js:10"
      const warningMatch = line.match(/WARNING:\s*(.+)/i);
      if (warningMatch) {
        findings.push({
          severity: 'major',
          message: warningMatch[1],
          source: 'coderabbit'
        });
      }
    }

    return findings;
  }

  /**
   * Execute all loops based on flags
   * @param {Object} flags - { free, claude, skipCr, all }
   * @returns {Promise<Object>}
   */
  async executeAll(flags = {}) {
    const results = {
      loops: {}
    };

    let shouldContinue = true;

    // Loop 1 Tier 1 (always run unless --claude or --skip-cr only)
    if (!flags.claude || flags.free || flags.all || (!flags.free && !flags.claude && !flags.skipCr)) {
      results.loops.loop1_tier1 = await this.executeLoop1Tier1();
      shouldContinue = results.loops.loop1_tier1.status === 'pass';

      if (!shouldContinue) {
        console.log('[Gate] Loop1-T1 failed, stopping execution');
        return results;
      }
    }

    // Loop 1 Tier 2 (if not --free only)
    if (shouldContinue && !flags.free) {
      results.loops.loop1_tier2 = await this.executeLoop1Tier2();
      shouldContinue = results.loops.loop1_tier2.status === 'pass';

      if (!shouldContinue) {
        console.log('[Gate] Loop1-T2 failed, stopping execution');
        return results;
      }
    }

    // Loop 2 (Claude) - if --claude or --all
    if (shouldContinue && (flags.claude || flags.all || (!flags.free && !flags.skipCr))) {
      results.loops.loop2_claude = await this.executeLoop2();

      // Gate: Critical findings block ship
      if (results.loops.loop2_claude.status === 'fail') {
        const hasCritical = results.loops.loop2_claude.findings?.some(
          f => f.severity === 'critical'
        );
        if (hasCritical && this.config.blocking?.critical_blocks_ship) {
          shouldContinue = false;
          console.log('[Gate] Loop2 found critical issues, blocking ship');
          return results;
        }
      }
    }

    // Loop 3 (CodeRabbit) - if not --free and not --skip-cr
    if (shouldContinue && !flags.free && !flags.skipCr) {
      results.loops.loop3_coderabbit = await this.executeLoop3(flags);
    }

    return results;
  }

  /**
   * Apply blocking rules and determine if ship is allowed
   * @param {Object} results - Loop execution results
   * @returns {{shipAllowed: boolean, blockers: Array<string>}}
   */
  getShipDecision(results) {
    const blockers = [];

    // Loop 1 failures always block
    if (results.loops.loop1_tier1?.status === 'fail') {
      blockers.push('Loop1-T1 failed: Fast checks did not pass');
    }
    if (results.loops.loop1_tier2?.status === 'fail') {
      blockers.push('Loop1-T2 failed: Comprehensive checks did not pass');
    }

    // Loop 2 critical findings block if configured
    if (results.loops.loop2_claude?.status === 'fail') {
      const findings = results.loops.loop2_claude.findings || [];
      const critical = findings.filter(f => f.severity === 'critical');
      const major = findings.filter(f => f.severity === 'major');

      if (critical.length > 0 && this.config.blocking?.critical_blocks_ship) {
        blockers.push(`Loop2 found ${critical.length} critical issue(s)`);
      }
      if (major.length > 0 && this.config.blocking?.major_blocks_ship) {
        blockers.push(`Loop2 found ${major.length} major issue(s)`);
      }
    }

    // Loop 3 failures block only if critical
    if (results.loops.loop3_coderabbit?.status === 'fail') {
      const findings = results.loops.loop3_coderabbit.findings || [];
      const critical = findings.filter(f => f.severity === 'critical');
      if (critical.length > 0) {
        blockers.push(`Loop3 (CodeRabbit) found ${critical.length} critical issue(s)`);
      }
    }

    return {
      shipAllowed: blockers.length === 0,
      blockers
    };
  }

  /**
   * Save state to disk atomically
   * @param {Object} results - Loop execution results
   * @returns {Promise<void>}
   */
  async saveState(results) {
    try {
      const gitInfo = this.getGitInfo();
      const shipDecision = this.getShipDecision(results);

      const state = {
        version: '1.0',
        branch: gitInfo.branch,
        head_commit: gitInfo.commit,
        timestamp: new Date().toISOString(),
        loops: results.loops,
        ship_allowed: shipDecision.shipAllowed,
        blockers: shipDecision.blockers
      };

      // Ensure directory exists
      if (!fs.existsSync(this.stateDir)) {
        fs.mkdirSync(this.stateDir, { recursive: true });
      }

      // Atomic write
      const tmpFile = `${this.stateFile}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
      fs.renameSync(tmpFile, this.stateFile);

      console.log(`[State] Saved to ${this.stateFile}`);
    } catch (error) {
      console.error('[State] Failed to save:', error.message);
      throw error;
    }
  }

  /**
   * Load state from disk and validate
   * @returns {Promise<Object|null>}
   */
  async loadState() {
    try {
      if (!fs.existsSync(this.stateFile)) {
        return null;
      }

      const content = fs.readFileSync(this.stateFile, 'utf8');
      const state = JSON.parse(content);

      // Validate schema
      if (!state.version || !state.loops || typeof state.ship_allowed !== 'boolean') {
        console.warn('[State] Invalid schema, ignoring cached state');
        return null;
      }

      // Check if commit has changed
      const gitInfo = this.getGitInfo();
      if (state.head_commit !== gitInfo.commit) {
        console.log('[State] HEAD commit changed, invalidating cached state');
        await this.invalidateState();
        return null;
      }

      console.log(`[State] Loaded cached state from ${this.stateFile}`);
      return state;
    } catch (error) {
      console.warn('[State] Failed to load:', error.message);
      return null;
    }
  }

  /**
   * Invalidate state (delete if commit changed)
   * @returns {Promise<void>}
   */
  async invalidateState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
        console.log('[State] Invalidated cached state');
      }
    } catch (error) {
      console.warn('[State] Failed to invalidate:', error.message);
    }
  }
}

module.exports = { LoopController };
