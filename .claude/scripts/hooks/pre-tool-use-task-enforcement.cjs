#!/usr/bin/env node
/**
 * Task tool enforcement hook
 *
 * When in "command mode" (after /plan, /implement, /ship):
 * - Tracks tool calls
 * - Warns when direct tools are used instead of Task
 * - Allows exceptions (reading agent files, quick reference)
 * - Records Task usage for verification
 *
 * This does NOT block operations (exit 0 always) - it provides
 * warnings and reminders. Blocking would break legitimate use cases.
 *
 * Exit codes:
 * - 0: Always (warnings only, no blocking)
 */

const path = require('path');
const fs = require('fs');
const {
  readStdinJson,
  logError,
  logContext,
  getGitRoot,
  readFile,
  writeFile,
} = require('../lib/utils.cjs');

function getStatePath() {
  const gitRoot = getGitRoot() || process.cwd();
  return path.join(gitRoot, '.claude', 'state', 'command-mode.json');
}

function readCommandMode() {
  try {
    const statePath = getStatePath();
    if (!fs.existsSync(statePath)) {
      return null;
    }
    const content = readFile(statePath);
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

function updateCommandMode(state) {
  try {
    writeFile(getStatePath(), JSON.stringify(state, null, 2));
  } catch (err) {
    // Fail silently
  }
}

// Files that are allowed to be read directly during command mode
const ALLOWED_READ_PATTERNS = [
  /\.claude\/agents\/.*\.md$/,           // Agent files
  /\.claude\/sub-agents\/.*\.md$/,       // Sub-agent docs
  /\.claude\/skills\/.*\.md$/,           // Skill files
  /\.claude\/commands\/.*\.md$/,         // Command files
  /\.claude\/rules\/.*\.md$/,            // Rule files
  /specs\/.*\.(md|json)$/,               // Spec files
  /CLAUDE\.md$/,                         // Main config
];

// Tools that should be delegated to sub-agents during command mode
const DELEGATED_TOOLS = [
  'Grep',
  'Glob',
  // 'Read' - handled specially with allowlist
  'Write',
  'Edit',
  'Bash',
  'NotebookEdit',
];

// Tools that are always allowed
const ALWAYS_ALLOWED = [
  'Task',                // This is what we WANT them to use
  'AskUserQuestion',     // User interaction is fine
  'TaskCreate',          // Task management is fine
  'TaskUpdate',
  'TaskList',
  'TaskGet',
  'EnterPlanMode',       // Planning mode is fine
  'ExitPlanMode',
  'Skill',               // Skill invocation is fine
];

async function main() {
  try {
    const input = await readStdinJson();
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    // Check if we're in command mode
    const commandMode = readCommandMode();
    if (!commandMode) {
      // Not in command mode - allow everything
      process.exit(0);
    }

    // Update tool call count
    commandMode.toolCallCount = (commandMode.toolCallCount || 0) + 1;

    // Check if this is a Task call (what we want!)
    if (toolName === 'Task') {
      commandMode.taskCallCount = (commandMode.taskCallCount || 0) + 1;
      updateCommandMode(commandMode);

      // Positive reinforcement
      if (commandMode.taskCallCount === 1) {
        logError(`[Hook] ✓ Task tool used - spawning sub-agent correctly`);
      }
      process.exit(0);
    }

    // Check if always allowed
    if (ALWAYS_ALLOWED.includes(toolName)) {
      updateCommandMode(commandMode);
      process.exit(0);
    }

    // Special handling for Read - allow if reading allowed files
    if (toolName === 'Read') {
      const filePath = toolInput.file_path || '';
      const isAllowed = ALLOWED_READ_PATTERNS.some(pattern => pattern.test(filePath));

      if (isAllowed) {
        updateCommandMode(commandMode);
        process.exit(0);
      }

      // Reading other files during command mode - warn
      if (commandMode.taskCallCount === 0) {
        logContext(`
---
**⚠️ REMINDER: You are in /${commandMode.command} command mode**

You just used \`Read\` directly. For command execution, you should:
1. Spawn a researcher sub-agent via \`Task\` tool
2. Let the sub-agent do the reading in isolated context

This prevents context overflow and follows the 3-agent pattern.

If you're reading an agent/spec file to understand what to do, that's OK.
But for actual research work, use: \`Task({ subagent_type: "general-purpose", description: "Research...", ... })\`
---
`);
      }
      updateCommandMode(commandMode);
      process.exit(0);
    }

    // Check if this is a delegated tool (should use sub-agent)
    if (DELEGATED_TOOLS.includes(toolName)) {
      updateCommandMode(commandMode);

      // Only warn if no Task has been called yet
      if (commandMode.taskCallCount === 0) {
        logContext(`
---
**⚠️ WARNING: Direct tool use in /${commandMode.command} command mode**

You used \`${toolName}\` directly. During command execution, you should:
1. Spawn a sub-agent via \`Task\` tool
2. Let the sub-agent use \`${toolName}\` in isolated context

**Required pattern:**
\`\`\`typescript
Task({
  subagent_type: "general-purpose",
  description: "...",
  prompt: "...",
  model: "sonnet",  // or opus/haiku
})
\`\`\`

Read the agent file first: \`.claude/agents/${commandMode.agent.split(' ')[0]}.md\`
---
`);
      }
      process.exit(0);
    }

    // MCP tools during command mode - warn for non-read operations
    if (toolName.startsWith('mcp__')) {
      updateCommandMode(commandMode);

      if (commandMode.taskCallCount === 0) {
        // Only warn on first few MCP uses
        if (commandMode.toolCallCount <= 3) {
          logError(`[Hook] Note: MCP tool ${toolName} used directly. Consider delegating to sub-agent.`);
        }
      }
      process.exit(0);
    }

    // All other tools - allow without warning
    updateCommandMode(commandMode);
    process.exit(0);

  } catch (err) {
    // Fail silently - don't block on enforcement errors
    process.exit(0);
  }
}

main();
