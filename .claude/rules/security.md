# Security Guidelines

Security rules for react-basecamp projects, including AI-specific concerns.

## Mandatory Security Checks

Before ANY commit:

- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated (Zod schemas)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React auto-escapes, no dangerouslySetInnerHTML)
- [ ] CSRF protection enabled (Next.js built-in)
- [ ] Authentication/authorization verified
- [ ] Rate limiting on API endpoints
- [ ] Error messages don't leak sensitive data

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx";

// ALWAYS: Environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY not configured");
}
```

### Environment Variable Checklist

| Variable      | Location                 | gitignored           |
| ------------- | ------------------------ | -------------------- |
| Database URLs | `.env.local`             | Yes                  |
| API keys      | `.env.local`             | Yes                  |
| Public keys   | `.env`                   | No (if truly public) |
| Secrets       | Vercel/hosting dashboard | N/A                  |

## AI-Specific Security Concerns

### Prompt Injection Prevention

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

### LLM Output Validation

NEVER trust LLM outputs blindly:

```typescript
// WRONG: Direct execution
const code = await llm.generateCode(request);
eval(code); // DANGEROUS!

// CORRECT: Validate and sandbox
const code = await llm.generateCode(request);
const validated = validateGeneratedCode(code);
if (validated.safe) {
  executeInSandbox(validated.code);
}
```

### Agent Guardrails

- **Tool permissions**: Limit what tools agents can use
- **Output limits**: Cap response sizes
- **Action logging**: Audit all agent actions
- **Human-in-the-loop**: Require approval for destructive actions

## Sensitive Data Handling

### Never Log Sensitive Data

```typescript
// WRONG
console.log("User data:", user);
console.log("API response:", response);

// CORRECT
console.log("User action:", { userId: user.id, action: "login" });
```

### Sanitize Error Messages

```typescript
// WRONG: Leaks internal details
throw new Error(`Database error: ${dbError.message}`);

// CORRECT: User-safe message
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Unable to complete request",
  // Log actual error server-side only
});
```

## Security Response Protocol

If security issue found:

1. **STOP** immediately
2. Use `/security` command to run security-auditor
3. Fix CRITICAL issues before continuing
4. Rotate any exposed secrets
5. Review entire codebase for similar issues
6. Add regression tests for the vulnerability

## OWASP Top 10 Checklist

| Risk                      | Mitigation                 | Status      |
| ------------------------- | -------------------------- | ----------- |
| Injection                 | Prisma ORM, Zod validation | ✅          |
| Broken Auth               | NextAuth.js (when needed)  | ⏸️ Deferred |
| Sensitive Data Exposure   | Env vars, no logging       | ✅          |
| XXE                       | No XML parsing             | N/A         |
| Broken Access Control     | tRPC middleware            | ✅          |
| Security Misconfiguration | Strict CSP, secure headers | ✅          |
| XSS                       | React escaping             | ✅          |
| Insecure Deserialization  | Zod validation             | ✅          |
| Vulnerable Components     | Regular updates            | ✅          |
| Insufficient Logging      | Structured logging         | ✅          |
