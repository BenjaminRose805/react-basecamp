# /help - User Assistance

Get help with the development system. Ask questions in plain language.

## Usage

```
/help <question>    # Ask anything in plain language
```

## Examples

```bash
/help what should I do next?
/help how does TDD work in this project?
/help what commands are available?
/help I'm stuck on testing, what do I do?
/help summarize what we did today
/help how do I create a PR?
/help what's the difference between /code and /build?
/help where did we leave off?
```

## Agent

Routes to: `help-agent`

## What You Can Ask

**Getting oriented:**

- "what should I do next?"
- "where did we leave off?"
- "what's the current status?"

**Understanding concepts:**

- "how does TDD work here?"
- "what's the difference between /code and /build?"
- "when should I use /plan?"

**Learning the system:**

- "what commands are available?"
- "how do I create a PR?"
- "what's the typical workflow?"

**Session context:**

- "summarize what we did"
- "what have we accomplished?"
- "what's left to do?"

**When stuck:**

- "I'm getting test failures, what do I do?"
- "how do I fix type errors?"
- "the build is failing, help"

## Quick Reference

### Common Workflows

**Feature Development:**

```
/git branch → /plan → /build → /check → /ship
```

**Bug Fix:**

```
/debug → /code → /check → /ship
```

**PR Review:**

```
/pr review <number>
```

### Command Summary

| Command    | Purpose                    |
| ---------- | -------------------------- |
| `/plan`    | Create specs               |
| `/build`   | Full implementation        |
| `/code`    | Backend only               |
| `/ui`      | Frontend only              |
| `/check`   | Quality verification       |
| `/git`     | Git operations             |
| `/pr`      | Pull request management    |
| `/ship`    | Complete shipping workflow |
| `/debug`   | Bug investigation          |
| `/help`    | This help                  |
| `/context` | Switch working mode        |

$ARGUMENTS
