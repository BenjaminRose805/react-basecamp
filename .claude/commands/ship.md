# /ship

Commit, create PR, wait for CI and CodeRabbit.

## MANDATORY: Preview and Agent Delegation

> **Before executing /ship:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/git-agent.md` and `.claude/agents/prune-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Ship Gate Validation

The `user-prompt-ship.cjs` hook validates review state BEFORE this command executes.

**Check the context for gate status:**

### If Blocked (`blocked: true` in context)

- Display: "🚫 Ship gate: BLOCKED"
- Show the reason from context (no state, stale, failed review)
- Show blockers list if available
- Suggest running `/review` to resolve
- **DO NOT proceed with git operations**

### If Approved (`Ship Gate: APPROVED` in context)

- Display: "✅ Ship gate: APPROVED"
- Proceed with preview and agent delegation

### If No Gate Info

- Warn user that review state wasn't checked
- Proceed with caution

## Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship                                                      │
├─────────────────────────────────────────────────────────────┤
│  Branch: feature/[name]                                     │
│  Gate: ✅ APPROVED (or 🚫 BLOCKED)                          │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 0. VALIDATE GATE                                        ││
│  │    └─ Check review state from user-prompt-ship.cjs      ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 1. PRUNE ARTIFACTS                                      ││
│  │    ├─ prune-scanner (Haiku) - Scan for artifacts         ││
│  │    ├─ PREVIEW → Confirm / Skip / Cancel                  ││
│  │    └─ prune-executor (Sonnet) - Execute if confirmed     ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. ANALYZE & COMMIT                                     ││
│  │    └─ git-writer (Sonnet) - Diff → commit → push        ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 3. CREATE PR & MONITOR                                  ││
│  │    └─ git-executor (Haiku) - PR → CI → CodeRabbit       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

## Sub-Agents (4 total)

| Phase | Agent          | Model  | Purpose                              |
| ----- | -------------- | ------ | ------------------------------------ |
| 1a    | prune-scanner  | Haiku  | Scan for removable artifacts         |
| 1b    | prune-executor | Sonnet | Execute removals (after confirmation)|
| 2     | git-writer     | Sonnet | Analyze diff, commit, push           |
| 3     | git-executor   | Haiku  | Create PR, poll CI/CodeRabbit        |

## Progress

```text
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: PRUNE ARTIFACTS                      [COMPLETE]   │
│  ├─ ✓ prune-scanner (Haiku)                    [1.2s]       │
│  │   Found: 3 to delete, 1 to trim                         │
│  ├─ ✓ User confirmed pruning                                │
│  └─ ✓ prune-executor (Sonnet)                  [0.8s]       │
│      3 removed, 1 trimmed                                   │
│                                                             │
│  STAGE 2: ANALYZE & COMMIT                     [COMPLETE]   │
│  └─ ✓ git-writer (Sonnet)                      [3.2s]       │
│      Commit: abc1234 - feat: add feature                    │
│                                                             │
│  STAGE 3: CREATE PR & MONITOR                  [RUNNING]    │
│  └─ ● git-executor (Haiku)                                  │
│      PR: #42 created                                        │
│      CI: ██████████░░░░░░░░░░ Build PASS | Tests RUNNING    │
│      CodeRabbit: Waiting...                                 │
│                                                             │
│  Progress: ██████████████░░░░░░ 70%                         │
└─────────────────────────────────────────────────────────────┘
```

## Outcomes

### Clean (CI + CodeRabbit pass)

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIPPED!                                                   │
├─────────────────────────────────────────────────────────────┤
│  Commit: abc1234                                            │
│  PR: https://github.com/owner/repo/pull/42                  │
│                                                             │
│  CI: ✓ PASS                                                 │
│  CodeRabbit: ✓ APPROVED                                     │
│                                                             │
│  Merge now? (yes/no)                                        │
└─────────────────────────────────────────────────────────────┘
```

### Has Comments

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIPPED (with feedback)                                    │
├─────────────────────────────────────────────────────────────┤
│  PR: #42                                                    │
│  CI: ✓ PASS                                                 │
│  CodeRabbit: ⚠ 3 comments                                   │
│                                                             │
│  Run /reconcile to reconcile feedback.                      │
└─────────────────────────────────────────────────────────────┘
```

### CI Failed

```text
┌─────────────────────────────────────────────────────────────┐
│  SHIP FAILED                                                │
├─────────────────────────────────────────────────────────────┤
│  PR: #42                                                    │
│  CI: ✗ FAILED (test job)                                    │
│                                                             │
│  Run /design to investigate and fix.                        │
└─────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Ship Blocked: No Review State

Run `/review` before shipping.

### Ship Blocked: Stale Review

Your review is for a different commit. Run `/review` again.

### Ship Blocked: Failed Loops

Fix the issues shown in blockers, then run `/review` again.

### Bypass Gate (Emergency)

Use `/ship --force` to bypass the gate. Not recommended.

$ARGUMENTS
