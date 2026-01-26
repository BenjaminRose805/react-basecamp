#!/usr/bin/env node
/**
 * Auto-start spec-workflow dashboard (non-blocking)
 *
 * Fire-and-forget: Starts dashboard in background without waiting.
 * Does NOT block session startup.
 *
 * Output: stderr only (status messages)
 */

const { spawn } = require('child_process');
const http = require('http');
const { logError } = require('../lib/utils.cjs');

const DASHBOARD_PORT = 5000;
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;
const PROJECT_PATH = process.cwd();

function checkDashboard() {
  return new Promise((resolve) => {
    const req = http.get(DASHBOARD_URL, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  try {
    // Quick check if dashboard is running
    const isRunning = await checkDashboard();

    if (isRunning) {
      logError('[Hook] Dashboard already running at ' + DASHBOARD_URL);
      process.exit(0);
      return;
    }

    // Start dashboard in background (fire-and-forget)
    logError('[Hook] Starting spec-workflow dashboard...');

    const child = spawn('spec-workflow-mcp', ['--dashboard', '--no-open'], {
      detached: true,
      stdio: 'ignore',
      cwd: PROJECT_PATH,
      shell: true,
    });

    // Fully detach - don't wait for anything
    child.unref();

    logError('[Hook] Dashboard starting at ' + DASHBOARD_URL);
    process.exit(0);
  } catch (err) {
    logError('[Hook] Dashboard error: ' + err.message);
    process.exit(0); // Don't block on errors
  }
}

main();
