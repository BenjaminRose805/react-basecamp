---
name: security-patterns
description: Security checklist, OWASP patterns, and vulnerability detection for code review.
---

# Security Patterns Skill

Security checklist and vulnerability detection.

## When Used

| Agent       | Phase    |
| ----------- | -------- |
| check-agent | SECURITY |

## Steps

### 1. Secret Detection

```bash
# Check for hardcoded API keys
grep -rn "sk-" --include="*.ts" --include="*.tsx" src/
grep -rn "api_key\s*=" --include="*.ts" src/
grep -rn "apiKey\s*=" --include="*.ts" src/

# Check for hardcoded passwords
grep -rn "password\s*=" --include="*.ts" src/
grep -rn "secret\s*=" --include="*.ts" src/

# Check for hardcoded URLs with credentials
grep -rn "://.*:.*@" --include="*.ts" src/
```

**CRITICAL:** Any hardcoded secret must be removed immediately.

**Fix:** Move to environment variables:

```typescript
// BAD
const apiKey = "sk-proj-xxxxx";

// GOOD
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
```

---

### 2. Console.log Check

```bash
grep -rn "console\.log" --include="*.ts" --include="*.tsx" src/
```

**Issue:** console.log can leak sensitive data and affect performance.

**Fix:** Remove or use structured logger.

---

### 3. Input Validation

**Check all tRPC routes have Zod validation:**

```bash
# Find routes without .input()
grep -rn "procedure\." --include="*.ts" src/server/
```

**Required pattern:**

```typescript
.input(z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
}))
```

---

### 4. SQL Injection Prevention

**Check for raw queries without parameters:**

```bash
grep -rn "\$queryRaw" --include="*.ts" src/
grep -rn "\$executeRaw" --include="*.ts" src/
```

**Safe pattern:**

```typescript
// Use template literal (parameterized)
await db.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// NEVER concatenate
// BAD: await db.$queryRaw(`SELECT * FROM users WHERE email = '${email}'`);
```

---

### 5. XSS Prevention

**Check for dangerouslySetInnerHTML:**

```bash
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" src/
```

**If found, verify sanitization:**

```typescript
import DOMPurify from "isomorphic-dompurify";

// REQUIRED: Sanitize before rendering
const clean = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p"],
  ALLOWED_ATTR: [],
});

<div dangerouslySetInnerHTML={{ __html: clean }} />
```

---

### 6. Authentication Check

**Verify protected routes use auth middleware:**

```bash
# Find routes that should be protected
grep -rn "protectedProcedure\|publicProcedure" --include="*.ts" src/server/
```

**Check:**

- Sensitive operations use `protectedProcedure`
- Resource ownership verified before access

```typescript
// Verify ownership
const item = await db.item.findUnique({ where: { id } });
if (item.ownerId !== ctx.user.id) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

---

### 7. Error Message Review

**Check error responses don't leak internals:**

```bash
grep -rn "error\.message\|error\.stack" --include="*.ts" src/
```

**Safe pattern:**

```typescript
// BAD: Exposes internal details
catch (error) {
  return { error: error.message, stack: error.stack };
}

// GOOD: Generic message, log details server-side
catch (error) {
  console.error('Internal error:', error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An error occurred",
  });
}
```

---

### 8. OWASP Top 10 Checklist

| Risk                      | Mitigation                   | Check                    |
| ------------------------- | ---------------------------- | ------------------------ |
| Injection                 | Prisma ORM, Zod validation   | Raw queries sanitized    |
| Broken Auth               | NextAuth, httpOnly cookies   | Token handling secure    |
| Sensitive Data Exposure   | Env vars, no logging         | Secrets in env vars      |
| XXE                       | No XML parsing               | N/A                      |
| Broken Access Control     | tRPC middleware              | Ownership checks         |
| Security Misconfiguration | CSP headers, secure defaults | Headers configured       |
| XSS                       | React escaping, DOMPurify    | No unsafe innerHTML      |
| Insecure Deserialization  | Zod validation               | All inputs validated     |
| Vulnerable Components     | pnpm audit                   | No known vulnerabilities |
| Insufficient Logging      | Structured logging           | Audit trail exists       |

---

### 9. Dependency Audit

```bash
pnpm audit
```

**Pass criteria:** No high or critical vulnerabilities.

**Fix:**

```bash
pnpm audit fix
pnpm update
```

## Severity Levels

| Severity | Examples                          | Action               |
| -------- | --------------------------------- | -------------------- |
| CRITICAL | Hardcoded secrets, SQL injection  | Block, fix now       |
| HIGH     | Missing auth, XSS vulnerability   | Block, fix before PR |
| MEDIUM   | console.log, missing validation   | Should fix           |
| LOW      | TODO comments, minor improvements | Track for later      |

## Output Format

```markdown
## SECURITY SCAN REPORT

### Findings

| #   | Severity | Issue                    | Location           |
| --- | -------- | ------------------------ | ------------------ |
| 1   | CRITICAL | Hardcoded API key        | src/lib/api.ts:15  |
| 2   | HIGH     | Missing input validation | src/server/user.ts |
| 3   | MEDIUM   | console.log statement    | src/lib/utils.ts:8 |

### Details

#### 1. Hardcoded API key (CRITICAL)

**Location:** `src/lib/api.ts:15`
**Code:** `const key = "sk-proj-xxx..."`
**Fix:** Move to `process.env.API_KEY`

#### 2. Missing input validation (HIGH)

**Location:** `src/server/user.ts:30`
**Issue:** Route accepts input without Zod schema
**Fix:** Add `.input(z.object({...}))`

### Summary

- CRITICAL: 1 (must fix)
- HIGH: 1 (must fix)
- MEDIUM: 1 (should fix)
- LOW: 0

**Verdict:** FAIL - Fix CRITICAL and HIGH issues before proceeding.
```

## Error Handling

| Finding           | Severity | Blocking |
| ----------------- | -------- | -------- |
| Hardcoded secret  | CRITICAL | Yes      |
| SQL injection     | CRITICAL | Yes      |
| Missing auth      | HIGH     | Yes      |
| XSS vulnerability | HIGH     | Yes      |
| console.log       | MEDIUM   | No       |
| TODO comment      | LOW      | No       |

## AI-Specific Security

### Prompt Injection Prevention

```typescript
// BAD: User input directly in prompt
const prompt = `Analyze: ${userInput}`;

// GOOD: Structured with boundaries
const prompt = `
<system>Analyze the code provided.</system>
<user_code>
${sanitizeInput(userInput)}
</user_code>
`;
```

### LLM Output Validation

```typescript
// NEVER trust LLM output blindly
const code = await llm.generateCode(request);

// ALWAYS validate
const validated = validateGeneratedCode(code);
if (!validated.safe) {
  throw new Error("Generated code failed validation");
}
```
