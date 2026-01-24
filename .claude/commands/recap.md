# /recap - Session Recap

Summarize what was accomplished in the current session.

## Usage

```
/recap                     # Full session recap
/recap --short             # Brief summary only
/recap --commits           # Focus on commits made
/recap --tasks             # Focus on tasks completed
```

## Instructions

When this command is invoked:

### Step 1: Gather Session Activity

1. **Git activity**

   ```bash
   # Commits made today/recently
   git log --oneline --since="8 hours ago" --author="$(git config user.name)"

   # Files changed
   git diff --stat HEAD~5..HEAD 2>/dev/null || git diff --stat
   ```

2. **Task completions** (from TaskList if available)
   - Tasks completed this session
   - Tasks still in progress
   - Tasks created

3. **Commands run** (from conversation context)
   - Which /commands were invoked
   - Their outcomes (pass/fail)

### Step 2: Analyze Accomplishments

Categorize work done:

- **Features implemented**
- **Bugs fixed**
- **Tests written**
- **Documentation updated**
- **Refactoring done**
- **Reviews completed**

### Step 3: Generate Summary

```markdown
# SESSION RECAP

## Summary

[1-2 sentence overview of what was accomplished]

## Commits Made

- `abc1234` feat(auth): add login form component
- `def5678` test(auth): add login form tests
- `ghi9012` fix(auth): resolve validation edge case

## Files Changed

- `src/components/LoginForm.tsx` (created)
- `src/components/LoginForm.test.tsx` (created)
- `src/lib/validation.ts` (modified)

## Tasks Completed

- [x] Write spec for login form
- [x] Implement login form component
- [x] Add form validation tests

## Tasks Remaining

- [ ] Add E2E tests for login flow
- [ ] Security review

## Quality Status

- Tests: 45/45 passing (+3 new)
- Coverage: 78% (+2%)
- Types: No errors
- Lint: No errors

## Next Session

Suggested starting point:

- Continue with: `/test e2e login-flow`
- Or: `/security auth`
```

## Short Mode

With `--short`:

```
SESSION RECAP (Brief)
=====================

Commits: 3
Files changed: 5
Tests added: 8
Tasks completed: 3/5

Key accomplishment: Implemented login form with validation

Next: /test e2e login-flow
```

## Commits Focus

With `--commits`:

```
COMMITS THIS SESSION
====================

feat(auth): add login form component
├─ src/components/LoginForm.tsx
├─ src/components/LoginForm.module.css
└─ src/hooks/useLoginForm.ts

test(auth): add login form tests
├─ src/components/LoginForm.test.tsx
└─ src/hooks/useLoginForm.test.ts

fix(auth): resolve validation edge case
└─ src/lib/validation.ts

Total: 3 commits, 6 files
```

## Tasks Focus

With `--tasks`:

```
TASK PROGRESS
=============

Completed this session:
✓ Write spec for login form
✓ Implement login form component
✓ Add form validation tests

Still in progress:
→ Add E2E tests for login flow

Created for later:
○ Security review for auth module
○ Documentation for auth flow

Progress: 3/5 tasks (60%)
```

## End of Day Usage

Good for end of session to:

1. Record what was done
2. Identify what to do next
3. Prepare handoff notes
4. Update any tracking systems

## After Recap

Suggest:

- If work remains: `/next` for suggested action
- If ready to stop: Commit any remaining changes
- If starting tomorrow: Note the "Next Session" suggestion
