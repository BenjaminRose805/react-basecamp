# /implement - Build Approved Spec

Execute an approved spec with TDD methodology and automatic agent routing.

## Usage

```
/implement                # Build the approved spec
```

## Examples

```bash
/implement    # Build whatever spec was approved via /plan
```

## Prerequisites

- Must have an approved spec from `/plan`
- If no spec exists, you'll be prompted to run `/plan` first

## What Happens

1. **Check**: Verify approved spec exists
2. **Route**: Analyze spec to determine agents needed
3. **Preview**: Show all stages, agents, sub-agents
4. **Execute**: Run TDD workflow (red → green → refactor)
5. **Verify**: Run all quality checks
6. **Report**: Show files created and verification results

## Routing Logic

Based on spec content:

| Spec Content                       | Routes To          |
| ---------------------------------- | ------------------ |
| Backend tasks (tRPC, Prisma, API)  | code-agent         |
| Frontend tasks (React, components) | ui-agent           |
| Documentation tasks                | docs-agent         |
| Evaluation tasks                   | eval-agent         |
| Mixed (backend + frontend)         | implement workflow |

## Preview

```text
┌─────────────────────────────────────────────────────────────────┐
│  /implement                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Spec: specs/user-authentication/ (approved)                    │
│  Tasks: 12 across 4 phases                                      │
│  TDD: Enabled (red → green → refactor)                          │
│                                                                 │
│  STAGE 1: DATABASE SCHEMA                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: code-agent                                           ││
│  │                                                             ││
│  │ 1. RESEARCH         code-researcher        Opus             ││
│  │    □ Find existing DB patterns                              ││
│  │    □ Check Prisma schema                                    ││
│  │                                                             ││
│  │ 2. TDD-RED          code-writer            Sonnet           ││
│  │    □ Write failing tests for User model                     ││
│  │                                                             ││
│  │ 3. TDD-GREEN        code-writer            Sonnet           ││
│  │    □ Implement User model + migration                       ││
│  │                                                             ││
│  │ 4. VALIDATE         code-validator         Haiku            ││
│  │    □ Verify tests pass                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  STAGE 2: AUTH MUTATIONS                                        │
│  └─ [Same pattern]                                              │
│                                                                 │
│  STAGE 3: FINAL VERIFICATION                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Agent: check-agent (parallel)              Haiku            ││
│  │    ⊕ build-checker                                          ││
│  │    ⊕ type-checker                                           ││
│  │    ⊕ lint-checker                                           ││
│  │    ⊕ test-runner                                            ││
│  │    ⊕ security-scanner                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Tools: cclsp, context7, next-devtools                          │
│                                                                 │
│  [Enter] Run  [e] Edit  [?] Details  [Esc] Cancel               │
└─────────────────────────────────────────────────────────────────┘
```

## Progress Display

During execution:

```text
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: DATABASE SCHEMA                          [RUNNING]    │
│  Agent: code-agent                                              │
│  ├─ ✓ code-researcher (Opus)                       [2.1s]       │
│  │   Found: No existing User model, will create fresh          │
│  ├─ ● code-writer (Sonnet)                         [RUNNING]    │
│  │   Writing: src/lib/user.ts                                  │
│  └─ ○ code-validator (Haiku)                       [PENDING]    │
│                                                                 │
│  Progress: ██████░░░░░░░░░░░░░░ 30%                              │
└─────────────────────────────────────────────────────────────────┘
```

## Output

```text
Implementation complete!

Files created:
  • prisma/migrations/..._add_user.sql
  • src/lib/user.ts
  • src/lib/auth.ts
  • src/server/routers/auth.ts
  • + 5 test files

Verification:
  ✓ Build:    PASS
  ✓ Types:    PASS (0 errors)
  ✓ Lint:     PASS (0 errors)
  ✓ Tests:    PASS (23/23, 87% coverage)
  ✓ Security: PASS

Run /ship when ready to create PR.
```

## TDD Workflow

For each implementation task:

1. **RED**: Write failing test that describes expected behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Clean up while keeping tests green

## Final Verification

Always includes (parallel execution):

- Build check (`pnpm build`)
- Type check (`pnpm typecheck`)
- Lint check (`pnpm lint`)
- Test run (`pnpm test:run`)
- Security scan (`pnpm audit`)

## Mode Behavior

| Mode  | Preview | Sub-agents | TDD | Verification |
| ----- | ------- | ---------- | --- | ------------ |
| dev   | Yes     | Yes        | Yes | Yes          |
| basic | No      | No         | Yes | Yes          |

## Error Handling

| Scenario         | Handling                        |
| ---------------- | ------------------------------- |
| No approved spec | Error: Run /plan first          |
| Test failures    | Report and stop                 |
| Build failures   | Report with error details       |
| Type errors      | Report with file/line info      |
| Security issues  | Report severity and suggestions |

## Skills Used

- `routing` - Determine which agents needed
- `preview` - Show execution plan
- `progress` - Real-time status display
- `tdd-workflow` - Red-Green-Refactor cycle
- `qa-checks` - Final verification

## After /implement

1. Review the files created
2. Run `/ship` to commit and create PR
3. Or run `/guide` to see current status

$ARGUMENTS
