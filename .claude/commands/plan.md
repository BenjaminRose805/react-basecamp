# /plan - Feature Planning

Break down a feature into trackable phases with clear checkpoints.

## Usage

```
/plan [feature]            # Create plan for a feature
/plan --from-spec [file]   # Create plan from existing spec
/plan --quick [feature]    # Quick plan without detailed breakdown
```

## Instructions

When this command is invoked:

### Step 1: Understand the Feature

If a spec exists (`specs/[feature].md`):

- Read the spec
- Extract requirements and acceptance criteria
- Identify technical constraints

If no spec exists:

- Ask clarifying questions
- Understand scope and goals
- Identify key deliverables

### Step 2: Break Down into Phases

Create a structured plan following the standard workflow:

```markdown
# Plan: [Feature Name]

## Overview

[1-2 sentence description]

## Phases

### Phase 1: Specification

- [ ] Research existing patterns (`/spec research`)
- [ ] Write feature spec (`/spec write`)
- [ ] Validate spec (`/spec qa`)

Checkpoint: Spec approved and ready for implementation

### Phase 2: Test Design (TDD)

- [ ] Research test patterns (`/test research`)
- [ ] Write failing tests (`/test write`)
- [ ] Verify tests fail correctly (`/test qa`)

Checkpoint: Tests written, failing as expected (red)

### Phase 3: Implementation

- [ ] Research existing code (`/code research`)
- [ ] Implement feature (`/code write`)
- [ ] Validate implementation (`/code qa`)

Checkpoint: Tests passing (green), code complete

### Phase 4: Quality Assurance

- [ ] Run verification (`/verify`)
- [ ] Security audit (`/security`)
- [ ] Address any issues

Checkpoint: All checks passing

### Phase 5: Review & Merge

- [ ] Create PR (`/pr`)
- [ ] Address review feedback
- [ ] Merge to main

Checkpoint: Feature merged and deployed

## Estimated Scope

- Files to create/modify: ~X
- New tests: ~X
- Complexity: [Low/Medium/High]

## Dependencies

- Requires: [list any prerequisites]
- Blocks: [list what this enables]

## Out of Scope

- [Explicitly excluded items]
```

### Step 3: Create Tasks

Use TaskCreate to add trackable tasks:

```
Task 1: [Phase 1] Write spec for [feature]
Task 2: [Phase 2] Write tests for [feature]
Task 3: [Phase 3] Implement [feature]
Task 4: [Phase 4] Verify and secure [feature]
Task 5: [Phase 5] Create PR for [feature]
```

### Step 4: Output the Plan

Display the full plan and confirm tasks are created.

## Quick Plan Mode

With `--quick`, create a simplified plan:

```
QUICK PLAN: [Feature]
=====================

1. [ ] Spec    → /spec [feature]
2. [ ] Test    → /test [feature]
3. [ ] Code    → /code [feature]
4. [ ] Verify  → /verify
5. [ ] Review  → /pr

Start with: /spec [feature]
```

## Plan Templates

### For Bug Fixes

```
1. [ ] Reproduce → /debug [issue]
2. [ ] Test     → /test [regression test]
3. [ ] Fix      → /code [fix]
4. [ ] Verify   → /verify
5. [ ] Review   → /pr
```

### For UI Components

```
1. [ ] Spec     → /spec [component]
2. [ ] Research → /ui research [component]
3. [ ] Build    → /ui build [component]
4. [ ] Test     → /test [component]
5. [ ] Verify   → /verify
6. [ ] Review   → /pr
```

### For LLM Features

```
1. [ ] Spec     → /distill [feature] or /spec [feature]
2. [ ] Test     → /test [feature]
3. [ ] Eval     → /eval [feature]
4. [ ] Code     → /code [feature]
5. [ ] Security → /security [feature]
6. [ ] Review   → /pr
```

## After Planning

Suggest starting command:

- If spec doesn't exist: `/spec [feature]`
- If spec exists: `/test [feature]`
- If tests exist: `/code [feature]`
