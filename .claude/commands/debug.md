# /debug - Bug Investigation

Investigate and diagnose bugs.

## Usage

```
/debug [issue]
```

## Examples

```bash
/debug "TypeError in login flow"
/debug "Tests failing intermittently"
/debug "Sentry issue PROJ-123"
```

## Agent

Routes to: `debug-agent`

## Phases

### GATHER

- Collect error information
- Check Sentry for related issues
- Check GitHub for similar reports
- Read relevant code

### ANALYZE

- Identify root cause
- Trace execution path
- Check for similar patterns
- Determine impact scope

### REPORT

- Summarize findings
- Provide recommended fix
- Suggest regression test
- Estimate complexity

## Output

````markdown
## Bug Investigation

### Root Cause

The issue occurs in `src/lib/api.ts:45` where...

### Recommended Fix

```typescript
// Before
const result = data.property;

// After
const result = data?.property ?? defaultValue;
```
````

### Regression Test

```typescript
it("handles missing property", () => {
  expect(() => fn({})).not.toThrow();
});
```

### Complexity

- Effort: Small
- Risk: Low
- Files: 1

```

## MCP Servers Used

```

cclsp # Code navigation
sentry # Production errors
vitest # Run tests
playwright # Browser issues
next-devtools # Dev errors
github # Related issues

```

## After /debug

1. Run `/code` to implement fix
2. Add regression test
3. Run `/check` to verify
4. Run `/ship` when ready

$ARGUMENTS
```
