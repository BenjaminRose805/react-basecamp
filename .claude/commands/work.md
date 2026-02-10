# /work

Level-agnostic entry point - sizes work and routes to appropriate workflow.

## Usage

```bash
/work "description of work"       # Auto-size and route
/work "description" --task        # Force task-level
/work "description" --spec        # Force spec-level
/work "description" --feature     # Force feature-level
/work "description" --project     # Force project-level
/work "description" --dry-run     # Preview sizing without executing
```

---

## Flags

| Flag       | Description                    | Example     |
|------------|--------------------------------|-------------|
| --task     | Force task-level workflow      | --task      |
| --spec     | Force spec-level workflow      | --spec      |
| --feature  | Force feature-level workflow   | --feature   |
| --project  | Force project-level workflow   | --project   |
| --dry-run  | Preview sizing without action  | --dry-run   |

---

## MANDATORY: Preview and Agent Delegation

> **Before executing /work:**
>
> 1. **Show preview** - Display sizing analysis
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/work-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

---

## Sizing Flow

```text
User: /work "description"
    |
    v
PHASE 1: QUICK ANALYSIS
    |
    +-- Task(work-sizer / Haiku)
          +-- Returns: {
                level: 'task'|'spec'|'feature'|'project',
                confidence: 'high'|'medium'|'low',
                reasoning: string,
                decision_count: number
              }
    |
    v
IF confidence === 'high':
    |
    +-- Auto-proceed with detected level
    |
IF confidence === 'medium':
    |
    +-- Present sizing with confirmation:
        "Detected level: [LEVEL] (medium confidence)
         Reasoning: [reasoning]

         Proceed as [level]? [yes/no]"
    |
IF confidence === 'low':
    |
    +-- Present multiple level options:
        "I'm uncertain about the scope. This could be:
         (1) Task: ~15 min, no design decisions
         (2) Spec: ~2 hours, 3-5 decisions
         (3) Feature: ~1 day, 10+ decisions

         Which feels right? [1/2/3]"
    |
    v
PHASE 2: ROUTE TO WORKFLOW
    |
    +-- level === 'task' --> Task workflow (inline)
    |
    +-- level === 'spec' --> /design {name} --spec
    |
    +-- level === 'feature' --> /design {name} --feature
    |
    +-- level === 'project' --> /design {name} --project
```

---

## Task Workflow (5-15 minute items)

Tasks skip full spec creation and use inline decisions.

### Task Flow

```text
/work "description" --> sized as task
    |
    v
PHASE 1: TASK BRIEF (task-researcher / Haiku)
    |
    +-- Quick research, inline decision format
    +-- Returns: task-brief with options
    |
    v
CHECKPOINT: Present inline decision
    |
    "Task: Add avatar upload to user profile

     Options:
     (A) Store in S3 with presigned URLs [recommended]
     (B) Store in database as blob

     Proceed with (A)? [yes/no/other]"
    |
    v
PHASE 2: IMPLEMENT (task-executor / Sonnet)
    |
    +-- Direct implementation
    |
    v
PHASE 3: VERIFY (task-validator / Haiku)
    |
    +-- Runs: lint, typecheck, test (if applicable)
    |
    v
Output: "Task complete. Run /ship to commit."
```

### Task Artifacts

Tasks do NOT create spec directories. Instead:

```
.claude/state/tasks/
+-- {timestamp}-{slug}.json
    {
      "description": "original description",
      "decision": "A - S3 with presigned URLs",
      "files_changed": ["src/lib/avatar.ts", "src/components/AvatarUpload.tsx"],
      "started_at": "2026-02-05T10:30:00Z",
      "completed_at": "2026-02-05T10:42:00Z",
      "duration_minutes": 12
    }
```

---

## Preview

```text
+----------------------------------------------------------------------+
| /work - Level-Agnostic Entry Point                                   |
+----------------------------------------------------------------------+
|                                                                      |
| ANALYSIS                                                             |
|   Description: "add user avatar upload"                              |
|   Detected Level: TASK                                               |
|   Confidence: HIGH                                                   |
|   Decisions Required: 1 (storage location)                           |
|                                                                      |
| REASONING                                                            |
|   - Single, well-defined feature                                     |
|   - Follows existing patterns (file upload)                          |
|   - No architectural decisions needed                                |
|   - Can be implemented in one session                                |
|                                                                      |
| WORKFLOW                                                             |
|   1. BRIEF (task-researcher / Haiku)                                 |
|      --> Quick research, inline decision format                      |
|   2. IMPLEMENT (task-executor / Sonnet)                              |
|      --> Direct implementation                                       |
|   3. VERIFY (task-validator / Haiku)                                 |
|      --> Lint, typecheck, test                                       |
|                                                                      |
+----------------------------------------------------------------------+
| [Enter] Proceed as Task  [S] Promote to Spec  [Esc] Cancel           |
+----------------------------------------------------------------------+
```

---

## Output

Task complete:

```text
+----------------------------------------------------------------------+
| TASK COMPLETE                                                        |
+----------------------------------------------------------------------+
|                                                                      |
| Description: Add user avatar upload                                  |
| Decision: S3 with presigned URLs                                     |
|                                                                      |
| Files Changed:                                                       |
|   M src/lib/avatar.ts                                                |
|   A src/components/AvatarUpload.tsx                                  |
|   A src/lib/__tests__/avatar.test.ts                                 |
|                                                                      |
| Verification:                                                        |
|   OK Lint: PASS                                                      |
|   OK Types: PASS                                                     |
|   OK Tests: PASS (3/3)                                               |
|                                                                      |
| Run /ship to commit and create PR.                                   |
+----------------------------------------------------------------------+
```

$ARGUMENTS
