# /debug - Bug Investigation

Hunt down and fix bugs when issues are reported.

## Usage

```
/debug [issue description, error, or Sentry ID]
```

## Examples

```
# Investigate reported bugs
/debug SENTRY-12345
/debug "Cannot read property of undefined" in Login.tsx
/debug why is checkout failing intermittently
/debug users can't submit the contact form

# Investigate failing tests
/debug auth tests are flaky
/debug why is this E2E test timing out
```

## When to Use

Use `/debug` when:

- User reports a bug
- Production error in Sentry
- Test suddenly failing
- Runtime error observed
- Unexpected behavior found

**Do NOT use `/debug` for routine validation.** Use the QA agents instead:

- `/code qa` for code validation
- `/test qa` for test validation
- `/ui qa` for component validation

## Workflow

The debugger agent follows this investigation flow:

### Step 1: Gather Information

- Get bug details and error messages
- Check production errors (Sentry)
- Review recent changes

### Step 2: Reproduce

- Reproduce the issue locally
- Confirm it's actually a bug
- Create minimal reproduction

### Step 3: Investigate

- Trace code path
- Identify root cause (not just symptoms)
- Check for related issues

### Step 4: Fix

- Write failing test first
- Make minimal fix
- Verify fix works

### Step 5: Report

- Document root cause
- Show fix applied
- List regression test added

## Agent

| Agent    | Instructions                 |
| -------- | ---------------------------- |
| debugger | `.claude/agents/debugger.md` |

## MCP Servers

```
cclsp          # TypeScript LSP for code intelligence
next-devtools  # Next.js dev server errors
vitest         # Run tests to verify fixes
playwright     # E2E reproduction
sentry         # Production error monitoring
```

## After Fix

After `/debug` successfully fixes the issue:

1. Run `/code qa` to validate the fix
2. Run `/security` if fix touches security-sensitive code
3. Run `/review staged` for approval

$ARGUMENTS
