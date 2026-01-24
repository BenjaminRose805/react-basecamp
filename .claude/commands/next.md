# /next - Suggest Next Action

Analyze current state and recommend the most appropriate next action.

## Usage

```
/next                      # Analyze and suggest next action
/next --explain            # Include detailed reasoning
/next --options            # Show all available options, not just recommended
```

## Instructions

When this command is invoked:

### Step 1: Gather Context

1. **Git state**

   ```bash
   git status --short
   git diff --cached --stat
   git log --oneline -5
   ```

2. **Task state** (from TaskList if available)

3. **Test state**

   ```bash
   pnpm test:run --reporter=dot 2>&1 | tail -3
   ```

4. **Recent commands** (from conversation context)

### Step 2: Detect Current Situation

| Situation                    | Indicators                      |
| ---------------------------- | ------------------------------- |
| **Uncommitted work**         | `git status` shows changes      |
| **Tests failing**            | Test run shows failures         |
| **Tests passing, no commit** | Tests pass, changes uncommitted |
| **Ready for PR**             | Branch pushed, tests pass       |
| **PR exists**                | Active PR on branch             |
| **Just finished spec**       | Spec file recently written      |
| **Just finished tests**      | Test files written, tests fail  |
| **Just finished code**       | Implementation done, tests pass |
| **QA failed**                | Verification found issues       |
| **Review requested changes** | PR has change requests          |

### Step 3: Generate Recommendation

Based on situation, provide ONE clear recommendation:

```
NEXT ACTION
===========

Situation: [detected situation]

Recommended: /[command] [args]

Why: [brief explanation]

Run this now? (or type a different command)
```

### Decision Tree

```
Has uncommitted changes?
├─ Yes → Are changes ready?
│        ├─ Yes → `/commit`
│        └─ No → Continue working or `/status` to review
│
└─ No → Is there a current task?
         ├─ Yes → What phase?
         │        ├─ Spec written → `/test [feature]`
         │        ├─ Tests written (failing) → `/code [feature]`
         │        ├─ Code written (tests pass) → `/verify`
         │        ├─ Verified → `/security [feature]`
         │        ├─ Security passed → `/review staged`
         │        └─ Review approved → `/commit` then `git push`
         │
         └─ No → Is there a PR?
                  ├─ Yes → Check PR status
                  │        ├─ Changes requested → `/code` to fix
                  │        ├─ Approved → Merge
                  │        └─ CI failing → Fix issues
                  │
                  └─ No → Start new work
                           └─ `/plan [feature]` or `/spec [feature]`
```

## Output Examples

### Example 1: Uncommitted Changes

```
NEXT ACTION
===========

Situation: You have staged changes ready to commit

Recommended: /commit

Why: 3 files staged with changes to auth module.
     Tests are passing. Ready to commit.
```

### Example 2: After Writing Tests

```
NEXT ACTION
===========

Situation: Tests written but failing (TDD red phase)

Recommended: /code write user-auth

Why: 4 tests failing as expected for TDD.
     Time to implement the feature.
```

### Example 3: All Green

```
NEXT ACTION
===========

Situation: Tests passing, code complete, not yet pushed

Recommended: /verify

Why: Run full verification before creating PR.
     This checks build, types, lint, tests, security.
```

## Options Mode

With `--options`, show all available actions:

```
AVAILABLE ACTIONS
=================

Recommended:
  → /commit              Stage and commit current changes

Also available:
  - /status              Review current state in detail
  - /verify              Run full verification suite
  - /code qa [feature]   Re-run QA validation
  - /test [feature]      Add more tests

Context:
  - Branch: feat/user-auth
  - Changes: 3 files modified
  - Tests: 24/24 passing
```
