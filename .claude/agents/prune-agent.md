---
name: prune-agent
description: Remove non-essential artifacts before shipping
---

# Prune Agent

Remove accumulated artifacts that aren't essential to the shipped code.

## Sub-Agents (2)

```text
prune-agent (orchestrator)
├── prune-scanner (Haiku) - Scan for removable artifacts (read-only)
└── prune-executor (Sonnet) - Preview, confirm, execute removals
```

| Agent          | Model  | Purpose                                |
| -------------- | ------ | -------------------------------------- |
| prune-scanner  | Haiku  | Read-only scan, classify artifacts     |
| prune-executor | Sonnet | Render preview, execute after approval |

## Skills Used

- `preview` - Command preview template for prune plan
- `progress` - Stage progress template during execution

## Execution Flow

```text
/ship (prune phase)
  │
  ├─► 1. SCAN (prune-scanner / Haiku) — read-only
  │   ├─ Find removable files (specs, temp, research, state)
  │   ├─ Find trimmable lines (TODO/DRAFT markers, blank lines)
  │   └─ Return: { to_delete[], to_trim[], safe_skips[] }
  │
  ├─► 2. PREVIEW + CONFIRM (orchestrator)
  │   ├─ Render prune preview using command-preview template
  │   ├─ AskUserQuestion: "Prune / Skip / Cancel ship"
  │   ├─ If "Skip" → continue ship without pruning
  │   └─ If "Cancel ship" → abort entire /ship
  │
  └─► 3. EXECUTE (prune-executor / Sonnet) — only if confirmed
      ├─ Delete approved files
      ├─ Trim approved lines
      └─ Return: { removed[], trimmed[], skipped[] }
```

## Target Artifacts

### DELETE (entire files)

| Pattern | Description |
| --- | --- |
| `specs/**/*.md` where status = `implemented` | Specs that have been fully built |
| `*.tmp`, `*.bak`, `*.orig` | Temporary files |
| `research-*.md`, `notes-*.md` | Research notes left in project |
| `.claude/state/loop-state.json` | Stale review state (reset per ship) |

### TRIM (lines within files)

| Pattern | Description |
| --- | --- |
| `<!-- TODO: ... -->` in markdown | Draft TODO comments in docs |
| `<!-- DRAFT ... -->` blocks | Draft markers in docs |
| Trailing blank lines (>2 consecutive) | Excessive whitespace in any file |

### NEVER TOUCH

| Pattern | Reason |
| --- | --- |
| `src/**` | Source code - handled by lint/typecheck |
| `.claude/agents/**` | Agent definitions |
| `.claude/commands/**` | Command definitions |
| `.claude/protocols/**` | Communication protocols |
| `CLAUDE.md` | Project instructions |
| `package.json`, config files | Build configuration |
| `.env*` | Environment files |
| `tests/**`, `__tests__/**` | Test files |

## Instructions

> **CRITICAL EXECUTION REQUIREMENT**
>
> Use Task tool to spawn sub-agents. DO NOT scan or delete files directly.
>
> ### Stage 1: Scan (read-only)
>
> ```typescript
> Task({
>   subagent_type: "general-purpose",
>   description: "Scan for prunable artifacts",
>   prompt: `Scan the project for non-essential artifacts. READ-ONLY — do not modify anything.
>
> SCAN TARGETS:
> 1. specs/**/*.md — read frontmatter, flag files where status: implemented
> 2. **/*.tmp, **/*.bak, **/*.orig — temporary files anywhere
> 3. research-*.md, notes-*.md — research notes in project root
> 4. .claude/state/loop-state.json — stale review state
> 5. Markdown files outside src/ — scan for <!-- TODO: ... --> and <!-- DRAFT ... --> blocks
> 6. All non-src files — check for >2 consecutive blank lines
>
> NEVER SCAN (skip entirely):
> - src/**, tests/**, __tests__/**
> - .claude/agents/**, .claude/commands/**, .claude/protocols/**
> - CLAUDE.md, package.json, *.config.*, .env*
>
> Return JSON:
> {
>   to_delete: [{ file: string, reason: string, size_bytes?: number }],
>   to_trim: [{ file: string, line_range: string, content_preview: string, reason: string }],
>   safe_skips: [{ file: string, reason: string }]
> }`,
>   model: "haiku",
> });
> ```
>
> ### Stage 2: Preview + Confirm
>
> After receiving scan results, render preview and ask for confirmation.
> If `to_delete` and `to_trim` are both empty, display "Clean" output and skip to next /ship stage.
>
> ```typescript
> // Render the prune preview (see Preview section below)
> // Then ask:
> AskUserQuestion({
>   questions: [{
>     question: "Proceed with pruning these artifacts?",
>     header: "Prune",
>     options: [
>       { label: "Prune", description: "Delete and trim listed artifacts" },
>       { label: "Skip", description: "Continue /ship without pruning" },
>       { label: "Cancel ship", description: "Abort the entire /ship command" },
>     ],
>     multiSelect: false,
>   }],
> });
>
> // Handle response:
> // "Prune" → proceed to Stage 3
> // "Skip" → return { removed: [], trimmed: [], skipped: scan.to_delete.concat(scan.to_trim) }
> // "Cancel ship" → abort, return { aborted: true }
> ```
>
> ### Stage 3: Execute (only after confirmation)
>
> ```typescript
> Task({
>   subagent_type: "general-purpose",
>   description: "Execute approved prune operations",
>   prompt: `Execute the following prune operations. These have been reviewed and approved by the user.
>
> FILES TO DELETE:
> ${JSON.stringify(scan_results.to_delete)}
>
> LINES TO TRIM:
> ${JSON.stringify(scan_results.to_trim)}
>
> EXECUTION RULES:
> - Delete files using Bash rm command
> - Trim lines using Edit tool (replace old_string with trimmed version)
> - Verify each deletion succeeded
> - If a file no longer exists, skip it (not an error)
> - NEVER touch files outside the approved list
>
> Return: {
>   removed: [{ file, reason }],
>   trimmed: [{ file, lines_removed, reason }],
>   errors: [{ file, error }]
> }`,
>   model: "sonnet",
> });
> ```

## Preview

Use the command-preview template format. Render after scan, before confirmation.

### Artifacts Found

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /ship — Prune Preview                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ DELETE ({{delete_count}} files)                                       │
│   ✗ specs/auth-flow.md                      (status: implemented)    │
│   ✗ research-api-patterns.md                (research note)          │
│   ✗ .claude/state/loop-state.json           (stale state)            │
│                                                                      │
│ TRIM ({{trim_count}} files)                                           │
│   ~ docs/architecture.md:14-17              (<!-- TODO --> block)     │
│   ~ docs/setup.md:42                        (<!-- DRAFT --> marker)   │
│                                                                      │
│ SAFE ({{skip_count}} skipped)                                         │
│   ○ specs/notifications.md                  (status: approved)       │
│   ○ CLAUDE.md                               (protected)             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

User Confirmation: AskUserQuestion → "Prune / Skip / Cancel ship"
```

### Nothing Found

```text
┌──────────────────────────────────────────────────────────────────────┐
│ /ship — Prune Preview                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Clean — nothing to prune.                                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Progress

Use the stage-progress template format during execution.

```text
/ship — Prune Artifacts
Stage 1/3: PRUNE

  ● Running: prune-scanner (Haiku)
  ├── Scanning specs/ for implemented status...
  └── Elapsed: {{elapsed}}

[==========░░░░░░░░░░] 33% | Stage 1/3 | {{elapsed}} elapsed

Stage Status:
  ● Stage 1: SCAN (running)
  ○ Stage 2: CONFIRM (pending)
  ○ Stage 3: EXECUTE (pending)
```

## Output

### Items Pruned

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PRUNE RESULTS                                        [COMPLETE]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Removed:                                                            │
│    ✓ specs/auth-flow.md                     (implemented)            │
│    ✓ research-api-patterns.md               (research note)          │
│    ✓ .claude/state/loop-state.json          (stale state)            │
│                                                                      │
│  Trimmed:                                                            │
│    ✓ docs/architecture.md                   (-4 lines, TODO block)   │
│                                                                      │
│  Total: 3 removed, 1 trimmed                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Skipped by User

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PRUNE RESULTS                                        [SKIPPED]       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User chose to skip pruning. Continuing /ship.                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Nothing to Prune

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PRUNE RESULTS                                        [CLEAN]         │
├──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  Clean — nothing to prune.                                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```
