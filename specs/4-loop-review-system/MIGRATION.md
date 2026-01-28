# Migration Guide: 4-Loop Review System

## Introduction

This guide helps you migrate from the old single-tool CodeRabbit review system to the new 4-loop progressive validation architecture.

### What's Changing

**Old System:**

- Single-phase review using CodeRabbit CLI only
- Rate-limited from the start (2-8 reviews/hour)
- Binary pass/fail with no progressive gates
- Results stored in `review-results.json`

**New System:**

- 4-loop layered architecture with progressive gates
- Free mechanical checks (Loop 1) before rate-limited tools
- Claude Opus AI review (Loop 2) for deep analysis
- CodeRabbit as optional second opinion (Loop 3)
- Async PR review as safety net (Loop 4)
- State distributed across multiple files
- Configurable blocking rules and timeouts

### Why This Change

**Benefits:**

1. **Faster feedback** - Loop 1 completes in <2 min with zero cost
2. **Better coverage** - Claude Opus catches architectural issues CodeRabbit misses
3. **Cost efficiency** - Free checks eliminate 80% of issues before AI review
4. **Rate limit preservation** - CodeRabbit only runs after free checks pass
5. **Flexible workflows** - Use `--free`, `--claude`, or `--all` flags based on needs

## Breaking Changes

### 1. State File Structure

**Old:**

```
.claude/state/review-results.json  # Single file with all results
```

**New:**

```
.claude/state/loop-state.json              # Combined loop status
.claude/state/claude-review-results.json   # Loop 2 findings
.claude/state/rate-limit-state.json        # Loop 3 quota tracking
```

**Impact:** Scripts reading `review-results.json` will break.

**Migration:** Update scripts to read `loop-state.json` instead.

### 2. Command Flags

**Old:**

```bash
/review  # Always runs CodeRabbit (rate-limited)
```

**New:**

```bash
/review          # or /review --all (runs all 4 loops)
/review --free   # Loop 1 only (no AI review)
/review --claude # Loop 1 + Loop 2 (skip CodeRabbit)
/review --skip-cr # Loop 1 + Loop 2, skip Loop 3
```

**Impact:** Old `/review` command behavior is now `/review --all`.

**Migration:** Update scripts/aliases to use new flags.

### 3. Git Ignore Updates

**Old:**

```gitignore
.claude/state/review-results.json
```

**New:**

```gitignore
.claude/state/loop-state.json
.claude/state/claude-review-results.json
.claude/state/rate-limit-state.json
.claude/state/  # Ignore entire state directory
```

**Impact:** State files may be committed if `.gitignore` not updated.

**Migration:** Update `.gitignore` to exclude all state files.

### 4. Configuration File

**New Requirement:**

- Configuration moved from inline constants to `.claude/config/review-config.yaml`
- Old system had no configuration file
- New system uses YAML config with defaults

**Impact:** Configuration changes now require editing YAML file.

**Migration:** Create `review-config.yaml` or rely on embedded defaults.

### 5. /reconcile Command Changes

**Old:**

```bash
/reconcile  # No source specification
```

**New:**

```bash
/reconcile --source claude  # From Claude review
/reconcile --source local   # From combined loop state
/reconcile --source pr      # From PR comments
/reconcile                  # Auto-detect source
```

**Impact:** Reconcile behavior is now source-aware.

**Migration:** Update reconcile calls to specify source or use auto-detect.

### 6. /ship Pre-Flight Check

**Old:**

- Optional check reading `review-results.json`
- Simple critical issue count

**New:**

- Mandatory check reading `loop-state.json`
- Ship gate enforcement with `ship_allowed` boolean
- Stale state detection (head commit changed)

**Impact:** Ship may block if review state is stale.

**Migration:** Re-run `/review` after new commits before shipping.

## Migration Steps

### Step 1: Update .gitignore

Add state directory exclusion:

```bash
# Add to .gitignore
echo "" >> .gitignore
echo "# Claude Code state files" >> .gitignore
echo ".claude/state/" >> .gitignore
```

**Verify:**

```bash
git status .claude/state/  # Should show "not tracked"
```

### Step 2: Remove Old State Files

```bash
# Remove old review state
rm -f .claude/state/review-results.json

# Optionally remove entire state directory to start fresh
rm -rf .claude/state/
```

### Step 3: Create Configuration File (Optional)

If you want to customize loop behavior:

```bash
# Create config file with defaults
cat > .claude/config/review-config.yaml << 'EOF'
loop1:
  tier1_timeout: 30
  tier2_timeout: 120
  parallel_tier1: true
  fail_fast_tier2: true

loop2:
  enabled: true
  model: opus
  spawn_fresh_context: true
  include_specs: true
  include_commits: 5

loop3:
  enabled: true
  rate_limit_per_hour: 8
  skip_on_rate_limit: true
  block_on_new_issues: false

blocking:
  critical_blocks_ship: true
  major_blocks_ship: false
  minor_blocks_ship: false
  secrets_block_ship: true
  build_failure_blocks_ship: true
  test_failure_blocks_ship: true

output:
  show_progress_spinners: true
  show_elapsed_time: true
  unified_report: true
  save_logs: true

paths:
  state_dir: .claude/state
  log_dir: .claude/logs
  config_dir: .claude/config
EOF
```

**Skip this step** if you want to use embedded defaults.

### Step 4: Update Scripts Reading State Files

If you have custom scripts reading review state:

**Old script:**

```javascript
// old-script.js
const results = JSON.parse(
  fs.readFileSync(".claude/state/review-results.json")
);
if (results.summary.critical > 0) {
  console.error("Critical issues found!");
  process.exit(1);
}
```

**New script:**

```javascript
// new-script.js
const state = JSON.parse(fs.readFileSync(".claude/state/loop-state.json"));
if (!state.ship_allowed) {
  console.error("Ship blocked by review findings:");
  state.blockers.forEach((b) => console.error(`  - ${b}`));
  process.exit(1);
}

// Also check for stale state
const currentCommit = execSync("git rev-parse HEAD").toString().trim();
if (state.head_commit !== currentCommit) {
  console.error("Review state is stale. Re-run /review.");
  process.exit(1);
}
```

### Step 5: Run Initial Review

Initialize the new state files:

```bash
# Run full review to generate all state files
/review --all
```

**Expected Output:**

- `.claude/state/loop-state.json` created
- `.claude/state/claude-review-results.json` created (if Loop 2 runs)
- `.claude/state/rate-limit-state.json` created (if Loop 3 runs)
- Unified report displayed

### Step 6: Verify /ship Integration

Test that ship gate reads new state:

```bash
# Should pass if review passed
/ship

# Or test manually
cat .claude/state/loop-state.json | grep ship_allowed
# Expected: "ship_allowed": true
```

### Step 7: Update Team Documentation

Update any team docs, READMEs, or runbooks that reference:

- Old `/review` behavior
- `review-results.json` file location
- CodeRabbit-only review process

## New Features

### Progressive Validation

Run only the loops you need:

```bash
# Fast iteration - free checks only (30s)
/review --free

# Before commit - free + Claude review (2-3min)
/review --claude

# Before PR - all loops including CodeRabbit (3-5min)
/review --all
```

### Configurable Blocking Rules

Control what blocks ship:

```yaml
blocking:
  critical_blocks_ship: true # Security issues block
  major_blocks_ship: true # Now you can block on major issues too!
  minor_blocks_ship: false # Style issues never block
```

### Multi-Source Reconciliation

Load feedback from different sources:

```bash
# After local Claude review
/reconcile --source claude

# After all loops complete
/reconcile --source local

# After PR created and reviewed
/reconcile --source pr
```

### Detailed State Tracking

Inspect loop execution history:

```bash
# View combined status
cat .claude/state/loop-state.json

# View Claude findings
cat .claude/state/claude-review-results.json

# Check rate limit quota
cat .claude/state/rate-limit-state.json
```

### Secret Scanning

Loop 1 Tier 2 now includes automatic secret detection:

- API keys
- Private keys (RSA, EC, OpenSSH)
- AWS credentials
- GitHub tokens
- Database URLs
- JWT secrets
- OAuth secrets

**Auto-blocks ship** if secrets detected.

### Ship Gate Enforcement

Ship command now **requires** valid review state:

```bash
/ship
# Checks:
# - loop-state.json exists
# - ship_allowed === true
# - head_commit matches current commit
# - No blocking issues
```

## Configuration Examples

### Example 1: Disable Claude, Keep CodeRabbit Only

```yaml
loop2:
  enabled: false
loop3:
  enabled: true
  rate_limit_per_hour: 8
```

Result: `/review` runs Loop 1 + Loop 3 (skip Loop 2).

### Example 2: Fast Checks + Claude Only (No CodeRabbit)

```yaml
loop2:
  enabled: true
loop3:
  enabled: false
```

Result: `/review` runs Loop 1 + Loop 2 (skip Loop 3).

### Example 3: Aggressive Blocking (Major Issues Block)

```yaml
blocking:
  critical_blocks_ship: true
  major_blocks_ship: true # Changed from default false
  minor_blocks_ship: false
```

Result: Major findings now block ship instead of just warning.

### Example 4: Reduce Timeouts for Fast Feedback

```yaml
loop1:
  tier1_timeout: 20 # Default 30s
  tier2_timeout: 90 # Default 120s

loop2:
  timeout: 180 # Default 300s (5min)
```

Result: Faster feedback at cost of potential timeouts on large codebases.

## Troubleshooting Migration Issues

### Issue: Review Command Not Found

**Symptom:** `/review` command doesn't work after migration

**Solution:** Update `.claude/commands/review.md` from the new spec files.

### Issue: State Files Keep Getting Committed

**Symptom:** Git tracks `.claude/state/*.json` files

**Solution:**

```bash
# Update .gitignore
echo ".claude/state/" >> .gitignore

# Untrack already-committed files
git rm --cached .claude/state/*.json
git commit -m "chore: untrack review state files"
```

### Issue: Ship Always Blocks

**Symptom:** `/ship` always blocks even after passing `/review`

**Diagnosis:**

```bash
# Check if state exists
ls -la .claude/state/loop-state.json

# Check if state is stale
cat .claude/state/loop-state.json | grep head_commit
git rev-parse HEAD
```

**Solution:**

```bash
# Re-run review to refresh state
/review --all
```

### Issue: CodeRabbit Never Runs

**Symptom:** Loop 3 always shows "SKIP"

**Diagnosis:**

```bash
# Check rate limit state
cat .claude/state/rate-limit-state.json

# Check if CLI is installed
command -v coderabbit

# Check if authenticated
coderabbit auth status
```

**Solution:**

```bash
# If rate limited, wait or reset state
rm .claude/state/rate-limit-state.json

# If not installed
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# If not authenticated
coderabbit auth login
```

### Issue: Reconcile Can't Find Feedback

**Symptom:** `/reconcile` reports "No feedback found"

**Solution:**

```bash
# Specify source explicitly
/reconcile --source claude   # If Claude review ran
/reconcile --source local    # If full review ran
/reconcile --source pr       # If PR created and reviewed
```

## Rollback Instructions

If you need to revert to the old system:

### Step 1: Restore Old State File Schema

```bash
# Remove new state files
rm -f .claude/state/loop-state.json
rm -f .claude/state/claude-review-results.json
rm -f .claude/state/rate-limit-state.json

# Recreate old structure
mkdir -p .claude/state
touch .claude/state/review-results.json
```

### Step 2: Restore Old Command Files

```bash
# Check out old review command from git history
git checkout <previous-commit> -- .claude/commands/review.md
git checkout <previous-commit> -- .claude/skills/code-review/SKILL.md
```

### Step 3: Remove Configuration File

```bash
# Remove new config file
rm -f .claude/config/review-config.yaml
```

### Step 4: Update .gitignore

```bash
# Revert to old ignore pattern
sed -i '/.claude\/state\//d' .gitignore
echo ".claude/state/review-results.json" >> .gitignore
```

### Step 5: Run Old Review

```bash
/review  # Should now use old single-tool system
```

## Getting Help

If you encounter migration issues:

1. **Check logs:** `.claude/logs/review-*.log`
2. **Validate state:** `cat .claude/state/loop-state.json`
3. **Reset state:** `rm -rf .claude/state/` and re-run `/review`
4. **Review config:** Check `.claude/config/review-config.yaml` syntax
5. **Test loops individually:**
   - `/review --free` (Loop 1 only)
   - `/review --claude` (Loop 1+2)
   - `/review --all` (all loops)

## Next Steps

After migration:

1. Run `/review --all` on your current branch to initialize state
2. Test ship gate: `/ship` should respect review state
3. Try reconcile: Make a PR, get feedback, run `/reconcile --source pr`
4. Customize config: Edit `review-config.yaml` for your workflow
5. Train team: Share new flags (`--free`, `--claude`, `--skip-cr`)

---

**Migration Version:** 1.0
**Last Updated:** 2026-01-28
**Spec Version:** 4-loop-review-system v1.0
