#!/usr/bin/env node
/**
 * Pre-tool-use hook for dev server commands
 * Shows tip about using tmux for log access
 *
 * Exit codes:
 * - 0: Always (informational only)
 */

const { readStdinJson, logError } = require('../lib/utils.cjs');

async function main() {
  try {
    const input = await readStdinJson();
    const toolInput = input.tool_input || {};
    const command = toolInput.command || '';

    if (/(npm run dev|pnpm( run)? dev|yarn dev|bun run dev)/.test(command)) {
      logError('[Hook] TIP: Consider running dev server in tmux for log access');
      logError('[Hook] Use: tmux new-session -d -s dev "pnpm dev"');
    }

    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
}

main();
