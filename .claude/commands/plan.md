# /plan - Design Spec or Reconcile PR Feedback

Conversational spec creation or PR feedback reconciliation.

## Usage

```
/plan                    # Start conversational planning
```

**Note:** This is a conversational command, not a one-shot. It will ask questions until requirements are clear, then generate a spec for approval.

---

## MANDATORY: Load Agent Instructions First

> **STOP. Before doing anything else, you MUST:**
>
> 1. Read the agent file: `.claude/agents/plan-agent.md`
> 2. Follow the CRITICAL EXECUTION REQUIREMENT in that file
> 3. Use Task tool to spawn sub-agents - NEVER execute directly
>
> **If you skip this step, you will execute incorrectly.**

---

## Task Tool Examples

### Spawn Plan Researcher (Parallel)

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Analyze requirements for [feature]",
  prompt: `You are a requirement-analyzer sub-agent.

TASK: Analyze requirements for [feature]
INPUT: [user description]
OUTPUT FORMAT:
{
  "decision": "PROCEED | STOP | CLARIFY",
  "context_summary": "max 500 tokens summary",
  "requirements": [...],
  "ambiguities": [...]
}

Use Read, Grep, Glob, mcp__cclsp__* tools to analyze.
Return structured JSON only.`,
  model: "opus",
  run_in_background: true,
});
```

### Spawn Plan Writer

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Write spec for [feature]",
  prompt: `You are a plan-writer sub-agent.

TASK: Create spec files for [feature]
INPUT SUMMARY: ${analysis_summary}

Create these files:
- specs/[feature]/requirements.md (EARS format)
- specs/[feature]/design.md (architecture)
- specs/[feature]/tasks.md (phased tasks)

Use Write tool to create files.
Follow templates in existing specs/ directories.`,
  model: "sonnet",
});
```

### Spawn Plan Validator

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Validate spec for [feature]",
  prompt: `You are a plan-validator sub-agent.

TASK: Validate spec at specs/[feature]/
CHECKS:
- EARS format compliance
- Acceptance criteria present
- _Prompt fields in tasks
- Requirement links

Return: { "passed": true/false, "issues": [...] }`,
  model: "haiku",
});
```

---

## Examples

```bash
/plan                    # Start new spec conversation
# Claude asks: "What would you like to build?"
# User: "A login system with email/password"
# Claude asks clarifying questions...
# User provides answers
# Claude generates spec, asks for approval
```

## Agent

Routes to: `plan-agent` (read `.claude/agents/plan-agent.md` first)

## Mode Detection

```text
/plan
  │
  ├── Check for pending CodeRabbit comments (from /ship state)
  │   │
  │   ├── Has comments → Reconcile mode
  │   │
  │   └── No comments → Define mode
```

---

## Define Mode (Default)

Conversational spec creation for new features.

### Flow

1. **CONVERSATION** - Ask questions until requirements are clear
2. **PREVIEW** - Show execution plan for spec generation
3. **GENERATE** - Create spec files
4. **APPROVAL** - Ask user to approve or request changes

### Conversation Phase

Claude asks clarifying questions to understand:

- What problem does this solve?
- What are the key requirements?
- What are the constraints?
- What decisions need to be made?

Example conversation:

```text
Claude: "What would you like to build?"
User: "A login system with email/password"

Claude: "Let me understand better:
         1. Password requirements?
         2. JWT or server sessions?
         3. Password reset needed?
         4. Rate limiting?"

User: "8 char min, JWT, yes, yes"

Claude: "Got it. Here's what I'll do:"
```

### Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /plan user-authentication                                  │
├─────────────────────────────────────────────────────────────┤
│  Mode: Define                                               │
│  Feature: User authentication with email/password           │
│                                                             │
│  PHASES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. RESEARCH         plan-researcher        Opus         ││
│  │    □ Search existing auth patterns                      ││
│  │    □ Check for conflicts                                ││
│  │    □ Identify integration points                        ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. WRITE            plan-writer            Sonnet       ││
│  │    □ Create requirements.md (EARS format)               ││
│  │    □ Create design.md (architecture)                    ││
│  │    □ Create tasks.md (phased work items)                ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 3. VALIDATE         plan-validator         Haiku        ││
│  │    □ Verify EARS compliance                             ││
│  │    □ Check acceptance criteria                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Output: specs/user-authentication/                         │
│                                                             │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel           │
└─────────────────────────────────────────────────────────────┘
```

### Progress

```text
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: RESEARCH                              [COMPLETE]  │
│  ├─ ✓ plan-researcher (Opus)                    [3.2s]      │
│  │   Found: session.ts, email.ts - no conflicts             │
│                                                             │
│  PHASE 2: WRITE                                 [RUNNING]   │
│  ├─ ● plan-writer (Sonnet)                      [RUNNING]   │
│  │   Writing: specs/user-authentication/design.md           │
│                                                             │
│  PHASE 3: VALIDATE                              [PENDING]   │
│  └─ ○ plan-validator (Haiku)                                │
│                                                             │
│  Progress: ██████████░░░░░░░░░░ 50%                         │
└─────────────────────────────────────────────────────────────┘
```

### Approval Request

After spec is generated:

```text
Spec created at specs/user-authentication/:

  requirements.md - 8 functional requirements
  design.md       - JWT + Prisma architecture
  tasks.md        - 4 phases, 12 tasks

Key decisions:
  • JWT with 1hr expiry, refresh tokens
  • Prisma for user storage
  • Rate limit: 5 attempts per 15 min

Does this spec look good? Any changes needed?
```

User can:

- **Approve** → Spec marked as approved, ready for `/implement`
- **Request changes** → Claude modifies spec
- **Reject** → Start over with different requirements

---

## Reconcile Mode

Activated when CodeRabbit comments are detected from a previous `/ship`.

### Flow

1. **DETECT** - Find pending CodeRabbit comments from PR
2. **PREVIEW** - Show issues and fix plan outline
3. **ANALYZE** - Review each comment, assess complexity
4. **PLAN** - Create prioritized fix tasks
5. **APPROVAL** - Ask user to approve fix plan

### Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /plan (reconcile PR #42)                                   │
├─────────────────────────────────────────────────────────────┤
│  Mode: Reconcile                                            │
│  PR: #42 - Add user authentication                          │
│  CodeRabbit comments: 3                                     │
│                                                             │
│  ISSUES TO ADDRESS                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. [Security] Use bcrypt, not SHA256                    ││
│  │ 2. [Performance] Add index on email column              ││
│  │ 3. [Style] Use early returns in validatePassword()      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  PHASES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. ANALYZE          plan-researcher        Opus         ││
│  │    □ Review each CodeRabbit comment                     ││
│  │    □ Identify affected files                            ││
│  │    □ Assess fix complexity                              ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. PLAN             plan-writer            Sonnet       ││
│  │    □ Create fix plan with tasks                         ││
│  │    □ Prioritize by severity                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel           │
└─────────────────────────────────────────────────────────────┘
```

### Comment Detection

Detect CodeRabbit comments via `gh` CLI:

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments \
  --jq '.[] | select(.user.login == "coderabbitai[bot]")'
```

Filter for unresolved threads.

---

## Sub-Agents

| Phase    | Sub-Agent       | Model  | Purpose                    |
| -------- | --------------- | ------ | -------------------------- |
| Research | plan-researcher | Opus   | Find patterns, conflicts   |
| Write    | plan-writer     | Sonnet | Generate spec documents    |
| Validate | plan-validator  | Haiku  | Check EARS, completeness   |
| Analyze  | plan-researcher | Opus   | Review CodeRabbit comments |

## MCP Servers

```
cclsp          # Navigate existing code for context
```

## Skills Used

- `preview` - Show execution plan before generation
- `progress` - Show real-time progress during generation
- `research` - Find existing patterns, check conflicts

## Output

### After Define Mode

```markdown
## Spec Created: APPROVED

Spec: specs/user-authentication/
Status: Approved by user

Files:
• requirements.md - 8 functional requirements
• design.md - Architecture with JWT + Prisma
• tasks.md - 4 phases, 12 tasks

Run /implement when ready to build.
```

### After Reconcile Mode

```markdown
## Fix Plan Created: APPROVED

PR: #42
Issues: 3 CodeRabbit comments

Fix Plan:

1. [High] Replace SHA256 with bcrypt in auth.ts
2. [Medium] Add migration for email index
3. [Low] Refactor validatePassword() for early returns

Run /implement to apply fixes.
```

## After /plan

1. Review spec/fix plan if needed
2. Run `/implement` to build
3. Run `/ship` when complete

$ARGUMENTS
