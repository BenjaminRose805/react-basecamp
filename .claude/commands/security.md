# /security - Security Audit

Audit code for security vulnerabilities.

## Usage

```
/security [scope: file, directory, feature, or "full"]
```

## Examples

```
/security src/app/api
/security src/components/Login.tsx
/security full
/security auth feature
/security staged
```

## What Gets Audited

### OWASP Top 10

- Injection (SQL, NoSQL, command)
- Broken authentication
- Sensitive data exposure
- XXE
- Broken access control
- Security misconfiguration
- XSS
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging

### React/Next.js Specific

- `dangerouslySetInnerHTML` usage
- SSRF in server components
- Client-side secrets exposure
- Improper auth in API routes

### Dependencies

- Known CVEs
- Outdated packages
- Supply chain risks

## Agent

| Agent            | Instructions                         |
| ---------------- | ------------------------------------ |
| security-auditor | `.claude/agents/security-auditor.md` |

## MCP Servers

```
cclsp       # TypeScript LSP for code intelligence
context7    # Verify secure API usage patterns
```

## When to Run

Run `/security` before `/review`:

1. Complete implementation (`/code`)
2. Pass QA (`/code qa`)
3. **Run security audit (`/security`)**
4. Final review (`/review`)

Also run after:

- Any auth-related changes
- API route changes
- New dependencies added
- User input handling changes

## Report Format

```markdown
## Security Audit Report

### Critical Vulnerabilities

- [file:line] Type: Description. Impact. Fix.

### High Severity

- [file:line] Issue

### Medium Severity

- [file:line] Issue

### Low Severity

- [file:line] Issue

### Recommendations

1. Prioritized fixes
2. Security improvements
```

## Severity Ratings

- **Critical**: Exploitable now, severe impact (RCE, auth bypass)
- **High**: Exploitable with effort, significant impact
- **Medium**: Requires specific conditions, moderate impact
- **Low**: Minor issue, minimal impact

$ARGUMENTS
