# Agent Optimization

> **Status:** Implemented

## Overview

Aggressive cleanup of the `.claude/` system to remove unused code and simplify configuration.

## Requirements

### Cleanup

- [x] Remove 73 legacy files (archived agents, workflows, examples, tests)
- [x] Simplify settings.json from 23 hooks to 9 essential hooks
- [x] Update CLAUDE.md command table to 7 commands
- [x] Fix settings.json format for new hook structure
- [x] Add description fields to all agent frontmatters

## Acceptance Criteria

- [x] AC-1: Only 7 commands remain: start, research, design, reconcile, implement, review, ship
- [x] AC-2: settings.json uses new matcher/hooks format
- [x] AC-3: All agent files have valid frontmatter with name and description
- [x] AC-4: No archived/ directory exists
- [x] AC-5: All pre-push checks pass (typecheck, tests, lint)
