# /context - Load Context Mode

Switch between different working modes to adjust behavior and priorities.

## Usage

```
/context dev       # Implementation mode - write code, run tests
/context review    # Code review mode - find issues, verify quality
/context research  # Exploration mode - understand before acting
```

## Instructions

When this command is invoked:

1. Read the corresponding context file from `.claude/contexts/[mode].md`
2. Acknowledge the mode switch
3. Adjust behavior according to the context

## Available Contexts

### dev (Development)

**Focus:** Active implementation

- Code first, explain after
- TDD workflow (test → implement → verify)
- Use `/code`, `/test`, `/verify` agents
- Commit when green

### review (Review)

**Focus:** Quality assurance

- Security first priority
- Thorough analysis before suggestions
- Use `/security`, `/review`, `/verify` agents
- Constructive feedback

### research (Research)

**Focus:** Exploration

- Read extensively before suggesting
- Don't modify code without approval
- Use research subcommands (`/code research`, etc.)
- Document findings, present options

## Context Files

- `.claude/contexts/dev.md` - Development context
- `.claude/contexts/review.md` - Review context
- `.claude/contexts/research.md` - Research context

## Output

When switching context, confirm:

```
Switched to [MODE] context.

Mode: [Brief description]
Focus: [Primary focus]
Priority: [Top priority]

Ready for [MODE] tasks.
```
