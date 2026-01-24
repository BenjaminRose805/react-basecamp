# Git Workflow

Git and version control rules for react-basecamp projects.

## Commit Message Format

Use conventional commits:

```
<type>: <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type       | Use For                                 |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `refactor` | Code change that neither fixes nor adds |
| `docs`     | Documentation only                      |
| `test`     | Adding or updating tests                |
| `chore`    | Maintenance, dependencies               |
| `perf`     | Performance improvement                 |
| `ci`       | CI/CD changes                           |

### Examples

```bash
feat: add work item status filter

fix: resolve race condition in task queue

refactor: extract validation logic to shared util

test: add integration tests for workflow router
```

## Branch Strategy

```
main
├── feature/work-item-filters
├── feature/workflow-execution
├── fix/task-queue-deadlock
└── refactor/api-error-handling
```

### Branch Naming

- `feature/<description>` - New features
- `fix/<description>` - Bug fixes
- `refactor/<description>` - Refactoring
- `docs/<description>` - Documentation
- `test/<description>` - Test additions

## Pull Request Workflow

### Before Creating PR

1. Run all quality checks:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test:run
   pnpm build
   ```

2. Review your own changes:

   ```bash
   git diff main...HEAD
   ```

3. Ensure no console.log statements
4. Ensure no hardcoded secrets

### Creating PR

Use `/review` command which will:

1. Analyze full commit history (not just latest)
2. Run `git diff [base-branch]...HEAD`
3. Draft comprehensive PR summary
4. Include test plan
5. Create PR with proper formatting

### PR Template

```markdown
## Summary

- Bullet points describing changes

## Test Plan

- [ ] Manual testing steps
- [ ] Automated tests added/updated
- [ ] Edge cases considered

🤖 Generated with Claude Code
```

## Feature Implementation Workflow

### 1. Plan First

```bash
# Create spec before coding
/spec feature-name
```

- Identify dependencies and risks
- Break down into phases
- Get user approval

### 2. TDD Approach

```bash
# Write tests first
/test feature-name

# Then implement
/code feature-name
```

- Red → Green → Refactor
- Verify 70%+ coverage

### 3. Security Check

```bash
/security
```

- Address all CRITICAL issues
- Address HIGH issues when possible

### 4. Code Review

```bash
/review staged
```

- Address CRITICAL and HIGH feedback
- Address MEDIUM when possible

### 5. Commit & Push

```bash
git add <specific-files>
git commit -m "feat: description"
git push -u origin feature/branch-name
```

## Pre-Commit Checks

Automated via hooks:

- Lint check (ESLint)
- Type check (TypeScript)
- Format check (Prettier)
- Test related files (Vitest)

## Commit Safety Rules

### DO

- Commit working code only
- Use specific file adds, not `git add .`
- Write meaningful commit messages
- Reference issues when applicable (`fixes #123`)

### DON'T

- Commit console.log statements
- Commit hardcoded secrets
- Commit broken builds
- Use `--force` push without approval
- Commit generated files (unless intended)

## .gitignore Essentials

```gitignore
# Dependencies
node_modules/

# Build
.next/
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# Testing
coverage/
playwright-report/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

## Recovery Commands

### Undo Last Commit (keep changes)

```bash
git reset --soft HEAD~1
```

### Discard Local Changes

```bash
git checkout -- <file>
```

### Fix Commit Message

```bash
git commit --amend -m "new message"
```

### Interactive Rebase (use carefully)

```bash
git rebase -i HEAD~3
```

**Note:** Never rebase public/shared branches.
