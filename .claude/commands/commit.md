# /commit - Create Conventional Commits

Create well-formatted conventional commits with proper messages.

## Usage

```
/commit                    # Analyze staged changes, create commit
/commit --amend            # Amend the last commit (use carefully)
/commit --fixup [hash]     # Create fixup commit for later squash
```

## Instructions

When this command is invoked:

### Step 1: Check Git State

```bash
git status
git diff --cached --stat
```

If nothing is staged, suggest files to stage based on recent edits.

### Step 2: Analyze Changes

1. **Read the diff**

   ```bash
   git diff --cached
   ```

2. **Categorize the change type:**
   - `feat` - New feature
   - `fix` - Bug fix
   - `refactor` - Code change that neither fixes nor adds
   - `test` - Adding or updating tests
   - `docs` - Documentation only
   - `chore` - Maintenance, dependencies
   - `perf` - Performance improvement
   - `ci` - CI/CD changes
   - `style` - Formatting, no code change

3. **Identify scope** (optional):
   - Component name
   - Feature area
   - File/module affected

### Step 3: Review Recent Commits

```bash
git log --oneline -10
```

Match the repository's commit message style.

### Step 4: Draft Commit Message

Format:

```
<type>(<scope>): <description>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

Rules:

- Description in imperative mood ("add" not "added")
- Max 72 characters for subject line
- Body explains "why" not "what"
- Reference issues if applicable (`fixes #123`)

### Step 5: Create Commit

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body if needed>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 6: Confirm Success

```bash
git log -1 --oneline
```

## Examples

```
# Simple feature
feat(auth): add password reset functionality

# Bug fix with issue reference
fix(api): resolve race condition in task queue

Fixes #42

# Refactoring with explanation
refactor(components): extract validation logic to shared util

Validation was duplicated across 3 forms. Consolidated into
useFormValidation hook for consistency.
```

## Safety Rules

- NEVER commit files containing secrets (.env, credentials)
- NEVER use `--no-verify` unless explicitly requested
- NEVER commit to main/master directly (warn user)
- ALWAYS review diff before committing
- PREFER specific file staging over `git add .`

## After Completion

Suggest next steps:

- `git push` if ready to push
- `/pr` if ready to create pull request
- Continue working if more changes needed
