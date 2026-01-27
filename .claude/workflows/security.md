---
name: security
description: Security audit, triage, fix, and re-audit workflow
---

# Security Workflow

Comprehensive security scanning with prioritized remediation.

## Trigger

- `/security [scope]` command

## Stages

```text
AUDIT (check-agent security-scanner)
    ↓
TRIAGE (security-triager sub-agent, Opus)
    ↓
FIX (code-agent OR ui-agent OR git-agent)
    ↓
RE-AUDIT (check-agent security-scanner)
```

## Stage 1: AUDIT

**Agent:** check-agent (security-scanner only)
**Model:** Haiku

### Checks

| Check             | Tool/Method                          |
| ----------------- | ------------------------------------ |
| Dependencies      | `pnpm audit`                         |
| Hardcoded secrets | Grep patterns (API keys, passwords)  |
| Injection vulns   | SQL injection, command injection     |
| XSS patterns      | dangerouslySetInnerHTML, unsanitized |
| OWASP Top 10      | Pattern matching against known vulns |
| Auth issues       | Missing auth checks, token handling  |

### Output

```json
{
  "vulnerabilities": [
    {
      "id": "SEC-001",
      "severity": "CRITICAL",
      "type": "hardcoded_secret",
      "file": "src/lib/api.ts",
      "line": 15,
      "description": "API key hardcoded in source"
    },
    {
      "id": "SEC-002",
      "severity": "HIGH",
      "type": "sql_injection",
      "file": "src/server/routers/user.ts",
      "line": 42,
      "description": "Unsanitized user input in query"
    },
    {
      "id": "SEC-003",
      "severity": "MEDIUM",
      "type": "dependency",
      "package": "lodash@4.17.20",
      "description": "Prototype pollution vulnerability"
    }
  ]
}
```

**Gate:** If no vulnerabilities found, report clean and exit.

---

## Stage 2: TRIAGE

**Sub-agent:** `security-triager` (Opus)
**Profile:** research (read-only)

### Tasks

1. Prioritize vulnerabilities (CRITICAL → HIGH → MEDIUM → LOW)
2. Identify remediation steps for each
3. Classify affected scope (backend/frontend/dependency)
4. Estimate effort and risk

### Output

```json
{
  "prioritized": [
    {
      "id": "SEC-001",
      "severity": "CRITICAL",
      "scope": "backend",
      "remediation": "Move API key to environment variable",
      "effort": "low",
      "files": ["src/lib/api.ts", ".env.example"]
    },
    {
      "id": "SEC-002",
      "severity": "HIGH",
      "scope": "backend",
      "remediation": "Use Prisma parameterized queries",
      "effort": "medium",
      "files": ["src/server/routers/user.ts"]
    },
    {
      "id": "SEC-003",
      "severity": "MEDIUM",
      "scope": "dependency",
      "remediation": "Update lodash to 4.17.21+",
      "effort": "low",
      "files": ["package.json"]
    }
  ],
  "context_summary": "3 vulns found: 1 CRITICAL (hardcoded secret), 1 HIGH (SQL injection), 1 MEDIUM (outdated dep). Focus on CRITICAL first."
}
```

---

## Stage 3: FIX

Route based on vulnerability scope:

### Backend Vulnerabilities → code-agent

For:

- Hardcoded secrets
- SQL injection
- Auth bypass
- Server-side validation

### Frontend Vulnerabilities → ui-agent

For:

- XSS patterns
- Client-side injection
- Unsafe DOM manipulation
- CSRF issues

### Dependency Vulnerabilities → git-agent

For:

- Outdated packages with known CVEs
- Version updates
- Lock file updates

### Priority Order

**Fix in this order:**

1. CRITICAL - Must fix immediately
2. HIGH - Fix in this session
3. MEDIUM - Report for later (optional fix)
4. LOW - Report only

### Constraint

Only fix CRITICAL and HIGH by default. MEDIUM/LOW are reported but not automatically fixed.

---

## Stage 4: RE-AUDIT

**Agent:** check-agent (security-scanner)

### Verification

Run same checks as Stage 1 to verify:

| Requirement                       | Action               |
| --------------------------------- | -------------------- |
| CRITICAL vulnerabilities resolved | Must pass to succeed |
| HIGH vulnerabilities resolved     | Must pass to succeed |
| No new vulnerabilities introduced | Must pass to succeed |
| MEDIUM/LOW remaining              | Report in summary    |

### Output

```markdown
## Security Re-Audit: PASS

### Resolved

| ID      | Severity | Type             | Status   |
| ------- | -------- | ---------------- | -------- |
| SEC-001 | CRITICAL | hardcoded_secret | RESOLVED |
| SEC-002 | HIGH     | sql_injection    | RESOLVED |
| SEC-003 | MEDIUM   | dependency       | RESOLVED |

### Remaining (acceptable)

None

### Summary

All CRITICAL and HIGH vulnerabilities resolved.
No new vulnerabilities introduced.
```

### Failure Handling

- **PASS** → Report success, summarize fixes
- **FAIL (new vulns)** → Rollback, report introduced issues
- **FAIL (remaining CRITICAL/HIGH)** → Retry Stage 3 for remaining issues

---

## Input

```
scope: string  # Optional - specific files/directories to audit
               # If omitted, audits entire codebase
```

## Output

```markdown
## Security Audit Complete

### Initial Findings

| Severity | Count |
| -------- | ----- |
| CRITICAL | 1     |
| HIGH     | 1     |
| MEDIUM   | 1     |
| LOW      | 0     |

### Fixes Applied

1. ✓ SEC-001: Moved API key to .env (CRITICAL)
2. ✓ SEC-002: Converted to Prisma parameterized query (HIGH)
3. ✓ SEC-003: Updated lodash to 4.17.21 (MEDIUM)

### Final Status

| Check             | Status |
| ----------------- | ------ |
| CRITICAL resolved | ✓      |
| HIGH resolved     | ✓      |
| No new vulns      | ✓      |

**Security posture:** IMPROVED

**Ready for:** `/check` → `/ship`
```

## Error Handling

| Error                    | Handling                               |
| ------------------------ | -------------------------------------- |
| Audit fails to run       | Check dependencies, report setup issue |
| Cannot fix CRITICAL      | STOP, escalate to user immediately     |
| Fix introduces new vulns | Rollback, report issue                 |
| Re-audit timeout         | Retry with increased timeout           |

## Context Flow

```text
┌────────────────┐    vulnerabilities    ┌────────────────┐
│  check-agent   │ ───────────────────► │  security-     │
│  (audit)       │      raw list        │  triager       │
└────────────────┘                      └────────────────┘
                                                │
                                         prioritized +
                                         context_summary
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │  code/ui/git   │
                                        │  agent         │
                                        └────────────────┘
                                                │
                                         files_changed
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │  check-agent   │
                                        │  (re-audit)    │
                                        └────────────────┘
```

## Notes

- Security-triager uses read-only profile - only analyzes, doesn't fix
- CRITICAL vulnerabilities require immediate attention
- Dependency updates go through git-agent to update lock files
- Re-audit uses same scanner to ensure consistency
- MEDIUM/LOW are optional - can be deferred if user chooses
