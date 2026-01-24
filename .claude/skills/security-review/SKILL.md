---
name: security-review
description: Security review checklist and patterns. Use when adding authentication, handling user input, working with secrets, or creating API endpoints.
---

# Security Review Skill

Comprehensive security checklist for code review and implementation.

## When to Activate

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Working with secrets or credentials
- Storing or transmitting sensitive data
- Integrating third-party APIs

## Security Checklist

### 1. Secrets Management

**NEVER Do This:**

```typescript
const apiKey = "sk-proj-xxxxx"; // Hardcoded secret
const dbUrl = "postgres://user:pass@host/db"; // In source code
```

**ALWAYS Do This:**

```typescript
const apiKey = process.env.ANTHROPIC_API_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY not configured");
}
```

**Verification:**

- [ ] No hardcoded API keys, tokens, or passwords
- [ ] All secrets in environment variables
- [ ] `.env.local` in .gitignore
- [ ] No secrets in git history
- [ ] Production secrets in hosting platform

### 2. Input Validation

**Always Validate with Zod:**

```typescript
import { z } from "zod";

const CreateUserSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
    age: z.number().int().min(0).max(150),
  })

  // In tRPC
  .input(CreateUserSchema)
  .mutation(async ({ input }) => {
    // input is validated and typed
  });
```

**File Upload Validation:**

```typescript
function validateFileUpload(file: File) {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("File too large (max 5MB)");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  return true;
}
```

**Verification:**

- [ ] All user inputs validated with Zod schemas
- [ ] File uploads restricted (size, type)
- [ ] No direct use of user input in queries
- [ ] Whitelist validation (not blacklist)
- [ ] Error messages don't leak sensitive info

### 3. SQL/Query Injection Prevention

**NEVER Concatenate Queries:**

```typescript
// DANGEROUS
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

**ALWAYS Use Parameterized Queries:**

```typescript
// Prisma - safe by default
const user = await db.user.findUnique({
  where: { email: userEmail },
});

// Raw query with parameters
const users = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`;
```

**Verification:**

- [ ] All database queries use Prisma or parameterized queries
- [ ] No string concatenation in queries
- [ ] Raw SQL uses template literals with parameters

### 4. Authentication & Authorization

**JWT Token Handling:**

```typescript
// Use httpOnly cookies, not localStorage
import { cookies } from "next/headers";

export async function setAuthCookie(token: string) {
  cookies().set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
```

**Authorization Checks:**

```typescript
// In tRPC middleware
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

// In route handler
export const protectedProcedure = t.procedure
  .use(isAuthed)

  // Resource-level authorization
  .mutation(async ({ input, ctx }) => {
    const resource = await db.resource.findUnique({ where: { id: input.id } });

    if (resource.ownerId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    // Proceed with operation
  });
```

**Verification:**

- [ ] Tokens stored in httpOnly cookies (not localStorage)
- [ ] Authorization checks before sensitive operations
- [ ] Role-based access control implemented
- [ ] Session management secure

### 5. XSS Prevention

**Sanitize HTML:**

```typescript
import DOMPurify from 'isomorphic-dompurify'

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

**Content Security Policy:**

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];
```

**Verification:**

- [ ] User-provided HTML sanitized
- [ ] CSP headers configured
- [ ] No dangerouslySetInnerHTML without sanitization
- [ ] React's built-in XSS protection used

### 6. CSRF Protection

```typescript
// SameSite cookies provide CSRF protection
cookies().set("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict", // CSRF protection
});

// For additional protection, use CSRF tokens
import { csrf } from "@/lib/csrf";

export async function POST(request: Request) {
  const token = request.headers.get("X-CSRF-Token");

  if (!csrf.verify(token)) {
    return Response.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Process request
}
```

**Verification:**

- [ ] SameSite=Strict on all cookies
- [ ] CSRF tokens on state-changing operations
- [ ] Origin/Referer header validation

### 7. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});

// Stricter limits for expensive operations
const searchLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

**Verification:**

- [ ] Rate limiting on all API endpoints
- [ ] Stricter limits on expensive operations
- [ ] IP-based rate limiting
- [ ] User-based rate limiting (authenticated)

### 8. Sensitive Data Exposure

**Logging:**

```typescript
// WRONG: Logging sensitive data
console.log("User login:", { email, password });
console.log("Payment:", { cardNumber, cvv });

// CORRECT: Redact sensitive data
console.log("User login:", { email, userId });
console.log("Payment:", { last4: card.last4, userId });
```

**Error Messages:**

```typescript
// WRONG: Exposing internal details
catch (error) {
  return Response.json({
    error: error.message,
    stack: error.stack
  }, { status: 500 })
}

// CORRECT: Generic error messages
catch (error) {
  console.error('Internal error:', error)
  return Response.json({
    error: 'An error occurred. Please try again.'
  }, { status: 500 })
}
```

**Verification:**

- [ ] No passwords, tokens, or secrets in logs
- [ ] Error messages generic for users
- [ ] Detailed errors only in server logs
- [ ] No stack traces exposed to users

### 9. Dependency Security

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically fixable issues
pnpm audit fix

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

**Verification:**

- [ ] Dependencies up to date
- [ ] No known vulnerabilities (pnpm audit clean)
- [ ] Lock files committed
- [ ] Dependabot enabled on GitHub

### 10. AI-Specific Security

**Prompt Injection Prevention:**

```typescript
// WRONG: User input directly in prompt
const prompt = `Analyze: ${userInput}`;

// CORRECT: Structured with clear boundaries
const prompt = `
<system>You are a code analyzer. Only analyze the code provided.</system>
<user_code>
${sanitizeInput(userInput)}
</user_code>
<instructions>Analyze the code above for bugs.</instructions>
`;
```

**LLM Output Validation:**

```typescript
// NEVER trust LLM outputs blindly
const code = await llm.generateCode(request);

// Validate before use
const validated = validateGeneratedCode(code);
if (!validated.safe) {
  throw new Error("Generated code failed validation");
}
```

**Verification:**

- [ ] User input isolated in prompts
- [ ] LLM outputs validated before use
- [ ] No direct execution of LLM-generated code
- [ ] Rate limits on LLM endpoints

## Pre-Deployment Checklist

Before ANY production deployment:

- [ ] **Secrets**: No hardcoded secrets, all in env vars
- [ ] **Input Validation**: All user inputs validated
- [ ] **SQL Injection**: All queries parameterized
- [ ] **XSS**: User content sanitized
- [ ] **CSRF**: Protection enabled
- [ ] **Authentication**: Proper token handling
- [ ] **Authorization**: Role checks in place
- [ ] **Rate Limiting**: Enabled on all endpoints
- [ ] **HTTPS**: Enforced in production
- [ ] **Security Headers**: CSP, X-Frame-Options configured
- [ ] **Error Handling**: No sensitive data in errors
- [ ] **Logging**: No sensitive data logged
- [ ] **Dependencies**: Up to date, no vulnerabilities
- [ ] **CORS**: Properly configured
- [ ] **File Uploads**: Validated (size, type)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [tRPC Security](https://trpc.io/docs/server/authorization)

---

**Remember**: Security is not optional. One vulnerability can compromise the entire platform. When in doubt, err on the side of caution.
