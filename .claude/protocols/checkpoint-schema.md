# Checkpoint Schema

## Overview

Unified checkpoint schema (v1) for all 7 commands. Used by `checkpoint-manager.cjs` to persist command execution state to `.claude/state/`.

## TypeScript Interface

```typescript
interface UnifiedCheckpoint {
  command:
    | "start"
    | "design"
    | "reconcile"
    | "research"
    | "implement"
    | "ship"
    | "review";
  feature: string;
  version: 1;
  head_commit: string; // git rev-parse HEAD at last save
  started_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  completed_at?: string; // ISO 8601
  state: {
    current_phase: string | null;
    completed_phases: string[];
    pending_phases: string[];
    current_task?: string; // Task ID like "T002"
  };
  phases: {
    [phaseName: string]: {
      status: "pending" | "in_progress" | "complete" | "failed" | "skipped";
      started_at?: string;
      updated_at?: string;
      context_summary?: string; // ≤500 tokens, validated by token-counter.cjs
      files_created?: string[];
      files_modified?: string[];
      error?: string;
    };
  };
  gate?: {
    ship_allowed: boolean;
    blockers: string[];
    head_commit?: string;
  };
}
```

## Command-Specific Variations

| Command   | Typical Phases             | Uses gate? | Notes                          |
| --------- | -------------------------- | ---------- | ------------------------------ |
| start     | branch, issue-creation     | No         | Simple 2-phase workflow        |
| design    | research, planning, specs  | No         | 3-phase: research→plan→write   |
| reconcile | analysis, reconciliation   | No         | Compare plan vs implementation |
| research  | discovery, synthesis       | No         | 2-phase research workflow      |
| implement | implementation, validation | No         | Code generation + tests        |
| ship      | pre-flight, commit, push   | Yes        | Uses gate to block if errors   |
| review    | analysis, feedback         | No         | Review existing code           |

## Phase Status Values

| Status        | Description                 |
| ------------- | --------------------------- |
| `pending`     | Phase not yet started       |
| `in_progress` | Phase currently executing   |
| `complete`    | Phase finished successfully |
| `failed`      | Phase encountered an error  |
| `skipped`     | Phase intentionally skipped |

## Enforcement Rules

- `context_summary` validated on save (≤500 tokens via `token-counter.cjs`)
- Timestamps in ISO 8601 format (`new Date().toISOString()`)
- Schema version must be `1`
- `head_commit` captured automatically via `git rev-parse HEAD` on every save
- Stale checkpoints detected on load (stored `head_commit` vs current HEAD)

## Example

```json
{
  "command": "implement",
  "feature": "checkpoint-infrastructure",
  "version": 1,
  "head_commit": "d36b6b4a1e2f3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
  "started_at": "2026-01-29T10:30:00.000Z",
  "updated_at": "2026-01-29T11:45:00.000Z",
  "state": {
    "current_phase": "implementation",
    "completed_phases": ["research", "design"],
    "pending_phases": ["validation"],
    "current_task": "T002"
  },
  "phases": {
    "research": {
      "status": "complete",
      "started_at": "2026-01-29T10:30:00.000Z",
      "updated_at": "2026-01-29T10:45:00.000Z",
      "context_summary": "Analyzed existing codebase patterns..."
    },
    "implementation": {
      "status": "in_progress",
      "started_at": "2026-01-29T11:00:00.000Z",
      "updated_at": "2026-01-29T11:45:00.000Z",
      "context_summary": "Implementing checkpoint-manager.cjs...",
      "files_created": [".claude/scripts/lib/token-counter.cjs"]
    }
  }
}
```
