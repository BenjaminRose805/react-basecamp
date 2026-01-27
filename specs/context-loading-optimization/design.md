# Context Loading Optimization Design

## Current State

### Context Loading Flow (Before)

```
┌─────────────────────────────────────────────────────────────┐
│  SESSION START                                              │
├─────────────────────────────────────────────────────────────┤
│  1. session-start.cjs hook (SessionStart)                   │
│     - Loads CLAUDE.md (~8,600 tokens)                       │
│     - Logging to stderr only (user-visible status)          │
│     - NO stdout injection (0 tokens to context)             │
│     Total context injection: 8,600 tokens                   │
├─────────────────────────────────────────────────────────────┤
│  2. CLAUDE.md references 9 rule files (lines 612-624)       │
│     ┌───────────────────────────────────────────────────┐   │
│     │  methodology.md    ~2,500 tokens                  │   │
│     │  agents.md         ~1,500 tokens                  │   │
│     │  coding-style.md   ~1,200 tokens                  │   │
│     │  security.md       ~1,800 tokens                  │   │
│     │  patterns.md       ~2,000 tokens                  │   │
│     │  testing.md        ~1,500 tokens                  │   │
│     │  performance.md    ~1,000 tokens                  │   │
│     │  git-workflow.md   ~1,000 tokens                  │   │
│     │  hooks.md          ~1,500 tokens                  │   │
│     └───────────────────────────────────────────────────┘   │
│     Implicitly loaded at session start: ~13,000 tokens      │
├─────────────────────────────────────────────────────────────┤
│  Total Session Start: ~21,600 tokens                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EVERY USER PROMPT                                          │
├─────────────────────────────────────────────────────────────┤
│  user-prompt-submit.cjs hook (UserPromptSubmit)             │
│  - NO stdout injection (0 tokens)                           │
│  - Git status queried via Bash when needed                  │
│  - CONTEXT.md read via Read tool when needed                │
│  - TODO.md read via Read tool when needed                   │
│  Total per prompt: 0 tokens                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  COMMAND EXECUTION (/plan, /implement, /ship)               │
├─────────────────────────────────────────────────────────────┤
│  Agent reads spec/instructions from:                        │
│  - .claude/agents/{agent}-agent.md                          │
│  - .claude/skills/{skill}.md                                │
│  - specs/{feature}/                                         │
│                                                             │
│  Example /plan:                                             │
│  - plan-agent.md (~3,000 tokens)                            │
│  - research.md skill (~9,500 tokens)                        │
│  - Total: ~12,500 tokens                                    │
│                                                             │
│  TOTAL FOR /plan COMMAND:                                   │
│  Session (23,150) + Prompt (550) + Skills (12,500)          │
│  = ~36,200 tokens (without sub-agents)                      │
│  = ~47,200 tokens (with sub-agents ~11,000)                 │
└─────────────────────────────────────────────────────────────┘
```

### Problems Identified

1. **CLAUDE.md Bloat**: 8,600 tokens includes content duplicated in rules
   - TDD workflow details (also in methodology.md)
   - Model selection tables (also in performance.md)
   - Commit message formats (also in git-workflow.md)
   - Code quality limits (also in coding-style.md)

2. **Implicit Rule Loading**: Reference table forces all 9 rules to load
   - Lines 612-624 in CLAUDE.md create implicit loading
   - No mechanism for command-specific filtering
   - Commands get rules they don't need

3. **Unnecessary Hook Injections**: user-prompt-submit injects context
   - Git status can be queried via Bash when needed
   - CONTEXT.md can be read via Read tool when needed
   - TODO.md can be read via Read tool when needed
   - Adds 550 tokens per prompt with no value (never used)

## Target State

### Context Loading Flow (After)

```
┌─────────────────────────────────────────────────────────────┐
│  SESSION START                                              │
├─────────────────────────────────────────────────────────────┤
│  1. session-start.cjs hook (SessionStart)                   │
│     - Loads slim CLAUDE.md (~3,000 tokens)                  │
│     - Logging to stderr only (user-visible status)          │
│     - NO stdout injection (0 tokens to context)             │
│     Total context injection: ~3,000 tokens                  │
├─────────────────────────────────────────────────────────────┤
│  2. NO rule files loaded at session start                   │
│     (Loaded on-demand per command)                          │
├─────────────────────────────────────────────────────────────┤
│  Total Session Start: ~3,000 tokens                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  EVERY USER PROMPT                                          │
├─────────────────────────────────────────────────────────────┤
│  user-prompt-submit.cjs hook (UserPromptSubmit)             │
│  - NO stdout injection (0 tokens)                           │
│  - Git status queried via Bash when needed                  │
│  - CONTEXT.md read via Read tool when needed                │
│  - TODO.md read via Read tool when needed                   │
│  Total per prompt: 0 tokens                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  COMMAND EXECUTION                                          │
├─────────────────────────────────────────────────────────────┤
│  command-mode-detect.cjs detects command (/plan, etc.)      │
│                                                             │
│  NEW: load-orchestrator-rules.cjs (UserPromptSubmit)        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  IF /plan, /implement, /ship THEN load:              │   │
│  │    - .claude/rules/agents.md (~2,700 tokens)         │   │
│  │      (delegation and spawning rules only)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Orchestrator agent reads:                                  │
│  - .claude/agents/{agent}-agent.md                          │
│  - .claude/skills/{skill}.md (if needed)                    │
│  - specs/{feature}/                                         │
│                                                             │
│  Orchestrator spawns sub-agents via Task tool               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Sub-agent prompt includes role-specific rules:      │   │
│  │  - code-researcher: patterns.md, coding-style.md     │   │
│  │  - code-writer: patterns.md, coding-style.md         │   │
│  │  - quality-validator: testing.md                     │   │
│  │  - git-executor: git-workflow.md                     │   │
│  │  - security-scanner: security.md                     │   │
│  │  - pr-reviewer: git-workflow.md, security.md         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  TOTAL FOR /plan COMMAND:                                   │
│  Orchestrator: Session (3,000) + Prompt (0) +               │
│                agents.md (2,700) + Skills (12,500)          │
│              = ~18,200 tokens                               │
│  Sub-agents: ~11,000 + role rules (2,000-4,000)             │
│            = ~13,000-15,000 tokens per sub-agent            │
│  SAVINGS: Rules loaded only when sub-agent spawned          │
│  SAVINGS: Zero hook injection overhead per prompt           │
└─────────────────────────────────────────────────────────────┘
```

### Token Budget Comparison

| Layer                      | Before     | After             | Savings              |
| -------------------------- | ---------- | ----------------- | -------------------- |
| **Session Start**          |            |                   |                      |
| CLAUDE.md                  | 8,600      | 3,000             | 5,600 (65%)          |
| Rules (all 9)              | 13,000     | 0                 | 13,000 (100%)        |
| Hooks                      | 1,550      | 0                 | 1,550 (100%)         |
| **Subtotal**               | **23,150** | **3,000**         | **20,150 (87%)**     |
| **Orchestrator**           |            |                   |                      |
| agents.md                  | 0\*        | 2,700             | -2,700               |
| Skills (varies)            | 12,500     | 12,500            | 0                    |
| **Orchestrator Total**     | **36,200** | **18,200**        | **18,000 (50%)**     |
| **Sub-agents (per spawn)** |            |                   |                      |
| Sub-agent base             | 11,000     | 11,000            | 0                    |
| Role rules                 | 0          | 2,000-4,000       | -2,000 to -4,000     |
| **Sub-agent Total**        | **11,000** | **13,000-15,000** | **-2,000 to -4,000** |

\*Rules implicitly loaded at session start via CLAUDE.md reference
Note: Sub-agent rule injection is one-time cost per sub-agent spawn, not per command

## Component Design

### 1. Sub-Agent Rule Injector

**Location**: `.claude/sub-agents/lib/inject-rules.cjs` (new utility)

**Purpose**: Inject role-specific rules into sub-agent Task prompts

**Input**: Sub-agent role type

**Output**: Rule content to append to Task prompt

**Algorithm**:

```javascript
const roleRuleMap = {
  "code-researcher": ["patterns.md", "coding-style.md"],
  "code-writer": ["patterns.md", "coding-style.md"],
  "ui-researcher": ["patterns.md", "coding-style.md"], // + frontend-patterns skill
  "ui-builder": ["patterns.md", "coding-style.md"], // + frontend-patterns skill
  "plan-researcher": ["methodology.md"],
  "plan-writer": ["methodology.md"],
  "quality-validator": ["testing.md"],
  "quality-checker": ["testing.md"],
  "git-executor": ["git-workflow.md"],
  "security-scanner": ["security.md"],
  "pr-reviewer": ["git-workflow.md", "security.md"],
};

function injectRulesForRole(role) {
  const rules = roleRuleMap[role] || [];
  const content = rules
    .map((rule) => fs.readFileSync(`.claude/rules/${rule}`, "utf-8"))
    .join("\n\n---\n\n");

  return `\n<role-rules>\n${content}\n</role-rules>\n`;
}
```

**Validation**:

- Token count per role bundle matches target (2,000-4,000)
- All referenced rules exist
- No duplicate content within role bundles

### 2. Orchestrator Rule Loader Hook

**Location**: `.claude/scripts/hooks/load-orchestrator-rules.cjs`

**Trigger**: UserPromptSubmit event

**Condition**: Command detected in user prompt (`/plan`, `/implement`, `/ship`)

**Behavior**:

```javascript
async function main() {
  const state = readCommandState(); // from command-mode.json

  if (!state || !state.command) {
    process.exit(0); // No command active
  }

  // All orchestrators get agents.md only
  const commands = ["plan", "implement", "ship"];
  if (!commands.includes(state.command)) {
    process.exit(0); // Not a command that needs agents.md
  }

  const agentsRules = fs.readFileSync(".claude/rules/agents.md", "utf-8");
  logContext(`\n<orchestrator-rules>\n${agentsRules}\n</orchestrator-rules>\n`);
  process.exit(0);
}
```

### 3. Slim CLAUDE.md

**Changes**:

**Remove** (move to rule bundles):

- TDD workflow details (lines 850-900) → methodology.md
- Model selection tables (lines 1100-1200) → performance.md
- Commit message format examples (lines 950-1000) → git-workflow.md
- Code quality limits (lines 800-850) → coding-style.md
- Security checklist (lines 1250-1350) → security.md
- Detailed testing requirements (lines 900-950) → testing.md

**Keep** (essential navigation):

- Commands overview (6 commands with basic descriptions)
- Agent list (7 agents with domains)
- Tech stack and project structure
- MCP server reference table
- File naming conventions
- Key quality thresholds (reference only, details in rules)

**Add** (rule loading explanation):

```markdown
## Rules and Methodology

Detailed rules are loaded intelligently:

- **Orchestrators** (top-level agents) load only agents.md for delegation rules
- **Sub-agents** get role-specific rules injected when spawned:
  - Researchers/writers: patterns.md, coding-style.md
  - Quality validators: testing.md
  - Git executors: git-workflow.md
  - Security scanners: security.md

This architecture ensures rules are loaded only when needed, reducing orchestrator token overhead by 79%.

All rules are available in `.claude/rules/` for reference.
```

### 4. Updated user-prompt-submit Hook

**Location**: `.claude/scripts/hooks/user-prompt-submit.cjs`

**Changes**:

```javascript
async function main() {
  const state = readCommandState();

  // NO stdout injection - query git/CONTEXT/TODO via tools when needed
  // Command detection only (stderr logging for debugging)
  detectCommand();

  process.exit(0);
}
```

**Removed**:

- Git status injection (query via Bash when needed)
- CONTEXT.md injection (read via Read tool when needed)
- TODO.md injection (read via Read tool when needed)

### 5. Updated session-start Hook

**Location**: `.claude/scripts/hooks/session-start.cjs`

**Changes**:

```javascript
async function main() {
  // Load slim CLAUDE.md (will be ~3000 tokens after reduction)
  // This is loaded automatically by Claude Code, no injection needed

  // NO stdout injection - context queried on demand
  // Log session start to stderr for user visibility only
  logError("[Session Start] Context loading optimization enabled");
  logError("[Session Start] Git status: query via Bash when needed");
  logError(
    "[Session Start] CONTEXT.md/TODO.md: read via Read tool when needed"
  );

  process.exit(0);
}
```

**Removed**:

- All stdout injection (git status, CONTEXT.md, TODO.md)
- Context now queried on demand via tools

## Data Flow

### Command Detection and Rule Loading

```
User: "/plan user-authentication"
         │
         ▼
command-mode-detect.cjs (UserPromptSubmit)
         │
         ├─> Creates .claude/state/command-mode.json
         │   { "command": "plan", "agent": "plan-agent", ... }
         │
         ├─> Injects command detection notice to Claude
         │
         ▼
load-orchestrator-rules.cjs (UserPromptSubmit - NEW)
         │
         ├─> Reads command-mode.json
         │
         ├─> Loads agents.md only (~2,700 tokens)
         │
         ├─> Injects to stdout (orchestrator context)
         │   <orchestrator-rules>
         │   [agents.md content - delegation rules only]
         │   </orchestrator-rules>
         │
         ▼
plan-agent.md orchestrator begins execution
         │
         ├─> Spawns plan-researcher sub-agent via Task tool
         │   {
         │     subagent_type: "general-purpose",
         │     prompt: "Research auth patterns\n" +
         │             injectRulesForRole('plan-researcher'),
         │   }
         │   → Sub-agent gets methodology.md injected (~2,500 tokens)
         │
         ├─> Spawns plan-writer sub-agent via Task tool
         │   {
         │     prompt: "Write spec\n" +
         │             injectRulesForRole('plan-writer'),
         │   }
         │   → Sub-agent gets methodology.md injected (~2,500 tokens)
         │
         └─> Rules loaded only when sub-agents spawn
```

## Implementation Notes

### Build Process

1. **Pre-commit**: Run `build-rule-bundles.cjs` to regenerate bundles
2. **CI validation**: Check bundle token counts match targets
3. **Version control**: Commit bundles to git (they're generated but tracked)

### Hook Registration

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/scripts/hooks/user-prompt-submit.cjs"
          },
          {
            "type": "command",
            "command": "node .claude/scripts/hooks/command-mode-detect.cjs"
          },
          {
            "type": "command",
            "command": "node .claude/scripts/hooks/load-orchestrator-rules.cjs"
          }
        ]
      }
    ]
  }
}
```

**Order matters**: command-mode-detect must run before load-orchestrator-rules.

### Fallback Behavior

If orchestrator rule loading fails:

- Log warning to stderr
- Continue without agents.md (orchestrator has minimal delegation logic)
- Session remains functional (degraded but not broken)

If sub-agent rule injection fails:

- Sub-agent proceeds with base template only
- May lack specific implementation patterns
- Still functional for basic tasks

### Testing Strategy

1. **Token counting**: Verify orchestrator gets agents.md only (~2,700 tokens)
2. **Sub-agent rule injection**: Verify role-specific rules injected correctly
3. **Functional testing**: Run each command, verify sub-agents spawn with rules
4. **Content verification**: Ensure no missing rules for sub-agent roles
5. **Regression testing**: All existing workflows still work

## Migration Path

### Phase 1: Create Sub-Agent Rule Bundles (No Breaking Changes)

- Create role-specific rule bundles for sub-agents
- Create inject-rules utility function
- Validate token counts per role (2,000-4,000)
- No changes to loading behavior yet

### Phase 2: Add Orchestrator Hook (Additive Change)

- Add load-orchestrator-rules.cjs hook
- Orchestrator loads agents.md only
- Verify agents.md contains delegation rules only
- No duplicate content issues (agents.md separate from implementation rules)

### Phase 3: Update Hooks (Reduce Redundancy)

- Update user-prompt-submit.cjs to remove duplicates
- Update session-start.cjs with reduced limits
- Verify token savings appear

### Phase 4: Slim CLAUDE.md (Content Reduction)

- Remove duplicated content from CLAUDE.md
- Add rule bundle references
- Verify all commands still functional

### Rollback Plan

If issues found:

1. Revert CLAUDE.md to previous version
2. Remove load-orchestrator-rules.cjs hook from settings.json
3. Restore user-prompt-submit.cjs original behavior
4. Remove sub-agent rule injection calls from agent templates
5. Keep rule files for future attempt

## Future Enhancements

- Dynamic rule loading based on context window usage
- Intelligent caching of rules across sessions
- Compression of skill files (separate effort)
- Sub-agent template consolidation (separate effort)
- User-configurable token budgets
