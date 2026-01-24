# AI Development Platform

## High-Level Specification

**Version 1.0 | January 2026**

---

## Executive Summary

The AI Development Platform is a unified system for managing AI-assisted software development workflows. It combines specification-driven development, visual workflow management, and intelligent agent orchestration into a single cohesive platform.

The platform introduces a novel unified work item model that merges the concepts of feature specifications, project board cards, and workflow DAG nodes into a single entity. This eliminates data synchronization issues between disparate systems and provides multiple views (board, graph, list, editor) of the same underlying work.

Key differentiators include first-class dependency management enabling automatic parallel/sequential execution, integrated AI agent assignment at the work item level, and seamless human-in-the-loop capabilities for review and approval workflows.

---

## Vision and Goals

### Vision Statement

To create an AI development platform where humans and AI agents collaborate seamlessly on software development, with clear specifications driving automated workflows while maintaining human oversight and control at every stage.

### Primary Goals

- **Unified Work Management:** Eliminate the fragmentation between specs, project boards, and execution systems by treating them as views of the same data.
- **Dependency-First Design:** Make work item dependencies explicit and visual, enabling automatic determination of what can run in parallel versus what must be sequential.
- **Spec-Driven Development:** Ensure every piece of work has clear requirements and acceptance criteria before execution begins.
- **Intelligent Automation:** Allow AI agents to execute well-defined work items autonomously while routing ambiguous or high-stakes decisions to humans.
- **Transparency and Auditability:** Provide complete visibility into what agents are doing, why, and with what results.

---

## Core Concepts

### The Unified Work Item

The work item is the fundamental unit of work in the platform. It unifies three traditionally separate concepts:

- **Card (Jira-like):** Title, type, status, assignee, priority, labels
- **Specification:** Requirements, acceptance criteria, detailed description
- **DAG Node:** Dependencies, execution configuration, runtime state

This unified model means there is a single source of truth for work. The board view, graph view, and spec editor are simply different presentations of the same underlying data.

### Work Item Types

| Type      | Purpose                                         | Characteristics                                               |
| --------- | ----------------------------------------------- | ------------------------------------------------------------- |
| Epic      | Large initiative containing multiple work items | Has children, no direct execution, tracks aggregate progress  |
| Story     | User-facing feature or capability               | Full spec with requirements and acceptance criteria           |
| Task      | Technical work item                             | Focused scope, may have lighter spec                          |
| Spike     | Timeboxed research or investigation             | Has a question to answer, timebox constraint, findings output |
| Bug       | Defect fix                                      | Reproduction steps, expected vs actual behavior               |
| Milestone | Progress marker                                 | No work content, represents a target state                    |

### Dependency Model

Every work item can declare dependencies on other work items. This creates a directed acyclic graph (DAG) of work that enables:

- **Automatic status calculation:** Items are Ready when all dependencies are Done
- **Parallel execution identification:** Items with no shared dependencies can run simultaneously
- **Blocking visualization:** Clear indication of what is waiting on what
- **Critical path analysis:** Understanding which items gate overall completion

---

## System Architecture

### Architecture Philosophy

The platform is built as multiple independent applications that share common infrastructure through a template project. Each application owns its domain while communicating through well-defined APIs and events.

### Template Project (react-basecamp)

All applications are scaffolded from a shared template containing:

- Authentication setup (pre-configured provider)
- Design system and UI components
- Database layer (Prisma configuration, base models)
- API layer (tRPC patterns, gateway utilities)
- Shared types, constants, and validation schemas
- Versioning utilities for history tracking
- Analytics and audit logging infrastructure
- CI/CD pipelines, testing setup, linting, and formatting

### Backend Services

| Service               | Responsibility                                                | Key Data                                                        |
| --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Work Item Service     | Work definition, specs, dependencies, status transitions      | Work items, requirements, acceptance criteria, dependency graph |
| Agent Manager         | Agent definitions, tool registry, instance lifecycle          | Agent configs, tool definitions, running instances              |
| Prompt Manager        | Prompt storage, versioning, variable resolution               | Prompt templates, versions, usage tracking                      |
| Execution Engine      | Workflow runtime, step execution, agent coordination          | Execution instances, step states, outputs                       |
| Communication Service | Message routing, human-agent interaction, real-time streaming | Messages, threads, channels, presence                           |

### Integration Patterns

Services communicate through a hybrid approach:

- **Shared Database:** Core entities (work items, agents, prompts) live in a shared database for transactional consistency and simple cross-service queries.
- **Event Streaming:** Runtime events (execution progress, messages, status changes) flow through an event bus for real-time updates.
- **Direct API Calls:** Synchronous operations (prompt resolution, agent instantiation) use direct service-to-service calls.

---

## Visual Interfaces

The platform provides multiple interactive interfaces, each optimized for different user intents and mental models. All interfaces are fully interactive workspaces, not passive dashboards.

### Core Interfaces

#### Home Dashboard

The landing page providing system overview and quick actions.

- Activity feed across all projects and work items
- Quick stats: active workflows, pending reviews, failed executions
- Quick actions: create spec, resume workflow, review pending items
- Pinned and recently accessed items

#### Work Item Manager

The unified interface for managing all work items with multiple view modes:

- **Board View:** Kanban-style lanes derived from work item status and dependency state. Lanes are calculated automatically: Blocked (has incomplete dependencies), Ready (dependencies done, not started), In Progress, Review, Done.
- **Graph View:** Visual DAG showing dependencies between items. Nodes are color-coded by status. Edges show dependency direction. Supports zoom, pan, and minimap for large graphs.
- **List View:** Sortable, filterable table of all work items with inline editing capabilities.
- **Editor View:** Full specification editor for a single work item with rich text editing, structured requirements, and acceptance criteria management.

#### Communication Hub

Real-time interaction interface for human-agent communication.

- Threaded conversations organized by work item, workflow, or ad-hoc topics
- Real-time streaming of agent outputs
- Inline actions: approve, reject, edit and approve, redirect to another agent
- Slash commands for power users (/pause, /retry, /assign)
- Voice input integration (connects to external systems like Discord)

#### Task Queue

Focused interface for human tasks generated by workflows.

- Categorized by task type: approvals, reviews, input requests, decisions
- Bulk actions for processing multiple similar tasks
- Priority and due date filtering
- Context preservation: see the workflow and work item that generated each task

### Authoring Interfaces

#### Workflow Designer

Visual builder for creating workflow templates.

- Drag-and-drop node placement from a palette of step types
- Connection drawing between nodes to define execution flow
- Node configuration: agent assignment, conditions, timeouts, retry policies
- Validation with error highlighting before save
- Template saving and versioning
- Dry run capability with mock inputs

#### Agent Builder

Configuration interface for creating and testing agents.

- System prompt selection from Prompt Manager
- Tool selection and permission configuration
- Live test panel: chat with the agent while configuring
- Version management and rollback
- Publishing to different environments

#### Prompt Manager

Library interface for prompt template management.

- Prompt creation with variable placeholders
- Version history with diff comparison
- Usage tracking: which agents use which prompts
- Testing playground with variable injection
- Organization through folders and tags

#### Library

Repository of reusable templates across all entity types.

- Work item templates (common spec structures)
- Workflow templates (reusable process patterns)
- Agent templates (pre-configured agent setups)
- Prompt templates (common prompt patterns)
- Import/export for sharing across projects

### Execution Interface

#### Execution Monitor

Runtime visualization and control for executing workflows.

- **DAG View:** Real-time graph showing execution progress. Nodes update status as steps complete. Click to inspect inputs, outputs, and logs.
- **Timeline View:** Gantt-style visualization showing step duration and parallelism over time.
- **Logs View:** Aggregated log stream with filtering by node, level, and time range.

Control capabilities:

- Pause/resume execution
- Retry failed steps
- Skip steps with justification
- Inject inputs to unblock waiting steps
- Cancel execution

### System Interfaces

#### Settings and Administration

- User management and role-based access control
- API key management for external integrations
- Webhook configuration for event notifications
- External tool registry (MCP servers, APIs)
- Global settings and defaults
- Usage analytics and cost tracking

---

## Data Models

### Work Item

| Field              | Type             | Description                                        |
| ------------------ | ---------------- | -------------------------------------------------- |
| id                 | string           | Unique identifier                                  |
| title              | string           | Display name                                       |
| type               | enum             | epic, story, task, spike, bug, milestone           |
| status             | enum             | draft, ready, in_progress, review, done, cancelled |
| priority           | enum             | low, medium, high, critical                        |
| assignee           | string?          | User or agent ID                                   |
| labels             | string[]         | Categorization tags                                |
| description        | string           | Detailed description (markdown)                    |
| requirements       | Requirement[]    | List of requirements                               |
| acceptanceCriteria | Criterion[]      | List of acceptance criteria                        |
| dependencies       | string[]         | IDs of work items this depends on                  |
| dependents         | string[]         | IDs of work items depending on this (computed)     |
| parentId           | string?          | Parent epic ID if nested                           |
| executionConfig    | ExecutionConfig? | Agent/workflow assignment                          |
| execution          | ExecutionState?  | Current execution state if running                 |

### Agent Definition

| Field           | Type         | Description                     |
| --------------- | ------------ | ------------------------------- |
| id              | string       | Unique identifier               |
| name            | string       | Display name                    |
| description     | string       | What this agent does            |
| systemPromptRef | PromptRef    | Reference to system prompt      |
| tools           | ToolConfig[] | Available tools and permissions |
| modelConfig     | ModelConfig  | Model selection and parameters  |
| version         | string       | Current version tag             |
| publishedAt     | datetime?    | When published to production    |

### Prompt

| Field         | Type       | Description                                |
| ------------- | ---------- | ------------------------------------------ |
| id            | string     | Unique identifier                          |
| name          | string     | Display name                               |
| content       | string     | Prompt template with {{variables}}         |
| variables     | Variable[] | Declared variables with types and defaults |
| version       | string     | Version identifier                         |
| parentVersion | string?    | Previous version for history               |
| tags          | string[]   | Organization tags                          |
| usedBy        | string[]   | Agent IDs using this prompt (computed)     |

### Workflow Definition

| Field       | Type           | Description                     |
| ----------- | -------------- | ------------------------------- |
| id          | string         | Unique identifier               |
| name        | string         | Display name                    |
| description | string         | What this workflow accomplishes |
| nodes       | WorkflowNode[] | Steps in the workflow           |
| edges       | WorkflowEdge[] | Connections between nodes       |
| inputs      | InputSchema    | Required inputs to start        |
| outputs     | OutputSchema   | Expected outputs on completion  |
| version     | string         | Version identifier              |

---

## Interaction Patterns

### Common Patterns Across Interfaces

- **Optimistic Updates:** UI updates immediately on user action, with rollback on server failure.
- **Undo/Redo:** Command history pattern with Cmd+Z / Cmd+Shift+Z support.
- **Real-time Sync:** WebSocket connections for live updates when data changes.
- **Contextual Search:** Each interface has scoped search for its domain (messages, prompts, work items, etc.).
- **Keyboard Shortcuts:** Consistent shortcuts: Cmd+S (save), Cmd+Enter (execute), Escape (cancel).

### Cross-Interface Navigation

Interfaces are deeply linked for seamless context switching:

- Click a work item in Board View opens its Editor View
- Click an execution in Work Item opens Execution Monitor
- Click a message reference opens Communication Hub at that message
- Split-view mode for side-by-side interface display
- Breadcrumb navigation showing context path

### Selection Synchronization

When an entity is selected in one interface, related interfaces can highlight it:

- Select work item in Board highlights it in Graph
- Select execution node shows related messages in Communication Hub
- Hover on dependency in Editor highlights both items in Graph

---

## Key User Flows

### Flow 1: Creating and Executing a Feature

1. User opens Work Item Manager, clicks Create, selects Story type
2. In Editor View, user writes title, description, requirements, acceptance criteria
3. User adds dependencies by searching and selecting existing work items
4. User assigns an agent from Agent Builder to handle implementation
5. User saves; work item appears in Board View in Ready lane (if no blockers)
6. User clicks Start; execution begins with assigned agent
7. Execution Monitor shows progress; Communication Hub streams agent output
8. Agent requests human review; Task Queue shows approval request
9. User reviews, provides feedback or approves
10. On approval, execution continues; on completion, work item moves to Done

### Flow 2: Building a Reusable Workflow

1. User opens Workflow Designer, creates new workflow
2. Drags start node, adds agent steps, human review step, end node
3. Connects nodes to define flow; adds conditional branches if needed
4. Configures each node: selects agent, sets timeout, defines retry policy
5. Validates workflow; fixes any highlighted errors
6. Runs dry run with test inputs to verify behavior
7. Saves as template in Library for reuse

### Flow 3: Configuring an Agent

1. User opens Agent Builder, creates new agent
2. Opens Prompt Manager in side panel, browses prompts
3. Selects or creates system prompt, assigns to agent
4. Adds tools from tool palette; configures permissions per tool
5. Opens test panel; sends test messages to verify behavior
6. Iterates on prompt until satisfied
7. Versions and publishes agent

### Flow 4: Monitoring and Intervening in Execution

1. User receives notification of failed step
2. Opens Execution Monitor, sees failed node highlighted
3. Clicks node to inspect: sees error message, inputs, partial outputs
4. Determines fix: modifies input or switches to different agent
5. Uses Retry with modified input action
6. Watches execution resume and complete

---

## Technical Implementation

### Technology Stack

| Layer            | Technology                      | Rationale                                   |
| ---------------- | ------------------------------- | ------------------------------------------- |
| Frontend         | React + TypeScript              | Type safety, component model, ecosystem     |
| State Management | TBD (Zustand/Jotai)             | Lightweight, TypeScript-friendly            |
| Styling          | Tailwind CSS                    | Utility-first, consistent with template     |
| API Layer        | tRPC                            | End-to-end type safety with React           |
| Database         | PostgreSQL + Prisma             | Relational model, strong typing, migrations |
| Real-time        | WebSocket (native or Socket.io) | Live updates across interfaces              |
| Testing          | Vitest + Playwright             | Fast unit tests, E2E coverage               |

### Migration Strategy

The platform will be built using a Strangler Fig pattern:

1. **Phase 1:** Build each application independently, fully functional standalone
2. **Phase 2:** Create unified shell with shared navigation and authentication
3. **Phase 3:** Embed applications into shell as micro-frontends or routes
4. **Phase 4:** Gradually merge shared functionality, eliminate duplication
5. **Phase 5:** Full integration with seamless cross-application navigation

### Quality Gates

All code must pass before merge:

- **TypeScript:** No type errors (strict mode)
- **Linting:** ESLint with agreed ruleset
- **Formatting:** Prettier (automated)
- **Unit Tests:** Minimum coverage thresholds
- **E2E Tests:** Critical paths covered
- **CI/CD:** Automated build and deploy pipelines

---

## Appendix

### Interface Summary

| Interface         | Category  | Primary Purpose                                   |
| ----------------- | --------- | ------------------------------------------------- |
| Home Dashboard    | Core      | Overview, activity feed, quick actions            |
| Work Item Manager | Core      | Unified work management (board/graph/list/editor) |
| Communication Hub | Core      | Human-agent interaction, conversations            |
| Task Queue        | Core      | Human tasks from workflow executions              |
| Workflow Designer | Authoring | Visual DAG builder for workflows                  |
| Agent Builder     | Authoring | Agent configuration and testing                   |
| Prompt Manager    | Authoring | Prompt library and versioning                     |
| Library           | Authoring | Reusable templates across entity types            |
| Execution Monitor | Execution | Runtime visualization and control                 |
| Settings/Admin    | System    | Configuration, users, integrations                |

### Backend Service Summary

| Service               | Primary Interfaces               | Key Capabilities                    |
| --------------------- | -------------------------------- | ----------------------------------- |
| Work Item Service     | Work Item Manager, Home          | CRUD, dependencies, status, specs   |
| Agent Manager         | Agent Builder, Execution Monitor | Definitions, instances, lifecycle   |
| Prompt Manager        | Prompt Manager, Agent Builder    | Templates, versions, resolution     |
| Execution Engine      | Execution Monitor, Task Queue    | Workflow runtime, step coordination |
| Communication Service | Communication Hub, Task Queue    | Messages, routing, streaming        |

### Glossary

- **Work Item:** The unified entity combining spec, card, and DAG node concepts.
- **Dependency:** A relationship where one work item must complete before another can start.
- **Agent:** An AI entity configured with a prompt and tools to perform work.
- **Workflow:** A defined sequence of steps (DAG) that can be executed.
- **Execution:** A running instance of a workflow processing a work item.
- **Task:** A human action requested by a workflow (approval, review, input).
- **Prompt:** A template defining how an agent should behave.
- **Tool:** A capability an agent can use (search, code execution, API calls).

---

_— End of Specification —_
