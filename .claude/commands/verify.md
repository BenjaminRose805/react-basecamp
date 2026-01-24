# /verify - Pre-PR Verification

Run comprehensive quality checks before creating a PR.

## Usage

```
/verify              # Full verification
/verify build        # Build only
/verify types        # Type check only
/verify lint         # Lint only
/verify tests        # Tests with coverage
/verify security     # Security scan only
/verify diff         # Review changed files
```

## Instructions

When this command is invoked, run the verification-loop skill from `.claude/skills/verification-loop/SKILL.md`.

### Full Verification Flow

1. **Build Check**

   ```bash
   pnpm build
   ```

   If fails, STOP and report.

2. **Type Check**

   ```bash
   pnpm typecheck
   ```

   Report all errors.

3. **Lint Check**

   ```bash
   pnpm lint
   ```

   Auto-fix when possible: `pnpm lint --fix`

4. **Test Suite**

   ```bash
   pnpm test:run --coverage
   ```

   Report: passed/failed count, coverage percentage.

5. **Security Scan**
   Check for:
   - Hardcoded API keys (`sk-`, `api_key`)
   - Console.log statements in src/
   - TODO/FIXME comments

6. **Diff Review**
   ```bash
   git diff --stat
   ```
   Review changes for unintended modifications.

### Output Format

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

### Scope Options

- `build` - Only run build check
- `types` - Only run type check
- `lint` - Only run lint check
- `tests` - Only run test suite
- `security` - Only run security scan
- `diff` - Only review changed files

If no scope provided, run all phases.
