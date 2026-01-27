# /ship

Commit, create PR, wait for CI and CodeRabbit.

## MANDATORY: Preview and Agent Delegation

> **Before executing /ship:**
>
> 1. **Show preview** - Display execution plan
> 2. **Get confirmation** - Wait for [Enter] or [Esc]
> 3. **Read** `.claude/agents/git-agent.md`
> 4. **Use Task tool** - Spawn sub-agents, NEVER execute directly

## Preview

```text
┌─────────────────────────────────────────────────────────────┐
│  /ship                                                      │
├─────────────────────────────────────────────────────────────┤
│  Branch: feature/[name]                                     │
│                                                             │
│  STAGES                                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. ANALYZE & COMMIT                                     ││
│  │    └─ git-writer (Sonnet) - Diff → commit → push        ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 2. CREATE PR & MONITOR                                  ││
│  │    └─ git-executor (Haiku) - PR → CI → CodeRabbit       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Enter] Run  [Esc] Cancel                                  │
└─────────────────────────────────────────────────────────────┘
```

## Sub-Agents (2 total)

| Phase | Agent        | Model  | Purpose                       |
| ----- | ------------ | ------ | ----------------------------- |
| 1     | git-writer   | Sonnet | Analyze diff, commit, push    |
| 2     | git-executor | Haiku  | Create PR, poll CI/CodeRabbit |

## Progress

```text
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: ANALYZE & COMMIT                     [COMPLETE]   │
│  └─ ✓ git-writer (Sonnet)                      [3.2s]       │
│      Commit: abc1234 - feat: add feature                    │
│                                                             │
│  STAGE 2: CREATE PR & MONITOR                  [RUNNING]    │
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
│  Run /plan to reconcile feedback.                           │
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
│  Run /plan to investigate and fix.                          │
└─────────────────────────────────────────────────────────────┘
```

$ARGUMENTS
