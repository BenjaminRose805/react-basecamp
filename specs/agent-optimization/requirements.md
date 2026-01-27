# Agent Optimization

## Goal

Enable main agents to work on longer specs without running out of context by implementing sub-agent delegation, context isolation, and phase-boundary compaction, while consolidating the agent architecture to 7 focused agents and 5 intuitive user commands.

## User Stories

- As a developer, I want to work on complex features without hitting context limits so that I can tackle larger specifications without workflow interruptions
- As a developer, I want agents to execute quality checks in parallel so that validation completes 3x faster (~20s instead of ~60s)
- As a developer, I want a simplified command interface (5 commands instead of 13+) so that I can be productive without memorizing complex workflows
- As a developer, I want clear agent boundaries with no overlaps so that I know which agent to use for each task
- As a developer, I want sub-agents to operate in isolated contexts so that individual tasks don't pollute the main orchestrator's memory
- As a developer, I want automatic workflow routing so that the system handles agent chaining without manual intervention

## Success Criteria

- [ ] Sub-agent delegation works for all commands via Task tool
- [ ] Context loading is optimized with lazy loading (30-40% savings, target 60-70% usage vs 100% current)
- [ ] Agent count reduced from 11 to 7 with no gaps or overlaps (plan, code, ui, docs, eval, check, git)
- [ ] User commands consolidated to 5 core commands (/plan, /build, /fix, /check, /ship) + utility commands (/start, /guide, /mode)
- [ ] Quality check duration reduced from ~60s to ~20s (3x speedup)
- [ ] Max spec complexity extended 2x through context efficiency
- [ ] All 8 workflows operational (implement, fix, refactor, ship, review, full-feature, security, research)
- [ ] Phase-boundary compaction delivers context summaries instead of raw findings
- [ ] CodeRabbit feedback from PR #11 addressed (200+ stale references removed)
- [ ] Validation testing complete with no regression in output quality
- [ ] Preview system operational for user confirmation before execution
- [ ] All 10 sub-specs implemented (01-infrastructure through 10-cleanup-consolidation)

## Technical Constraints

- Must use Task tool for all sub-agent spawning (enforced via MANDATORY blocks in command files)
- Must follow orchestrator memory rules (spawn sub-agents instead of using Read/Edit/Bash directly)
- Must pass `context_summary` between phases, NOT raw findings
- Must maintain 3-file spec format (requirements.md, design.md, tasks.md)
- Phase 09 (task-tool-binding) is CRITICAL - binds documentation to actual Task tool execution
- Sub-agents operate in isolated context windows with handoff protocol
- Model assignments: Opus for orchestrators, Sonnet/Haiku for sub-agents based on complexity
- Must support parallel sub-agent execution for independent tasks
- Must preserve existing Next.js 15 + TypeScript + Vitest + Playwright stack
- Must maintain compatibility with existing pnpm workflows (dev, build, test, lint, typecheck)

## Out of Scope

- Changes to the underlying Next.js/TypeScript/Vitest/Playwright stack
- Modifications to the core Task tool implementation (use as-is)
- Agent personality or conversational style improvements
- New MCP server integrations beyond existing setup
- UI/UX changes to the Claude Code CLI itself
- Performance optimizations unrelated to context management
- Migration to different model providers or API versions
- Changing the 3-file spec format (requirements/design/tasks)
- Beta Next.js versions (only stable and canary supported)
- Automated code generation beyond existing capabilities

## Dependencies

- Phase 01 (infrastructure) is the foundation for all other phases
- Phase 08 (architecture-v2) consolidates agents and must complete before agent-specific phases
- Phases 02, 03, 06 (agent splits) depend on Phase 08 completion
- Phase 07 (workflow-updates) depends on all agent updates being complete
- Phase 09 (task-tool-binding) depends on Phase 07 and is CRITICAL for enforcing sub-agent delegation
- Phase 10 (cleanup-consolidation) runs concurrently and addresses technical debt

## Implementation Status

| Phase | Spec                    | Status         | Complexity |
| ----- | ----------------------- | -------------- | ---------- |
| 01    | Infrastructure          | ✅ Complete    | Low        |
| 04    | Check Agent             | ✅ Complete    | Medium     |
| 05    | Context Compaction      | ✅ Complete    | Medium     |
| 08    | Architecture V2         | ✅ Complete    | High       |
| 02    | Code Agent Split        | 🔵 In Progress | Medium     |
| 06    | Plan Agent Optimization | 🔵 In Progress | Medium     |
| 10    | Cleanup & Consolidation | 🔵 In Progress | Medium     |
| 03    | UI Agent Split          | ⏸️ Blocked     | Medium     |
| 07    | Workflow Updates        | ⏸️ Blocked     | Medium     |
| 09    | Task Tool Binding       | 📋 Draft       | Medium     |

## Acceptance Tests

- Orchestrator can spawn researcher sub-agent instead of using Grep/Read directly
- Orchestrator can spawn writer sub-agent instead of using Edit/Write directly
- Orchestrator can spawn validator sub-agent instead of using Bash directly
- check-agent runs all quality checks in parallel with isolated contexts
- Commands (/plan, /build, etc.) route to correct agent workflows automatically
- Preview system displays execution plan before running commands
- Context usage metrics show 30-40% reduction compared to baseline
- All 66 uncommitted changes from Phase 10 are committed
- Documentation references only existing agents/commands (no stale refs to debug-agent, pr-agent, etc.)
- Full-feature workflow completes: /plan → /build → /ship with proper sub-agent delegation
