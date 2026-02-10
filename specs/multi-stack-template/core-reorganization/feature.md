# Feature: core-reorganization

**Status:** Approved

---

## Overview

Establish the foundation for the multi-stack template system by extracting generic, reusable components into a dedicated core/ directory structure.

This feature addresses the need to separate stack-agnostic infrastructure (agents, commands, protocols, scripts, skills, sub-agents, and spec templates) from stack-specific implementations. By creating a clean core/ foundation, the template system can support multiple technology stacks (React, Vue, Angular, Python/Flask, Go, etc.) without duplicating generic workflow infrastructure. This reorganization enables the partial-file abstraction system to reference generic vs. specific components and allows the stack profile system to compose new stacks from the core foundation.

**Key Capabilities:**

- Extract ~38 generic files into a mirrored core/.claude/ structure
- Preserve stack-specific files in their current locations (code-agent.md, ui-agent.md, frontend-patterns/, etc.)
- Create a MANIFEST.md documenting all core contents and their purposes
- Enable downstream features (stack-profile-system, partial-file-abstraction) to build on this foundation

---

## Spec List

| Spec            | Description            | Status     | Dependencies   |
| --------------- | ---------------------- | ---------- | -------------- |
| directory-structure-and-agents | Create core/.claude/ hierarchy and migrate all generic agents and validator templates | pending | [] |
| workflow-migration | Migrate commands, protocols, scripts, hooks, and config files | pending | ["directory-structure-and-agents"] |
| content-migration | Migrate generic skills, sub-agent templates, spec templates, and create MANIFEST.md | pending | ["workflow-migration"] |

---

## Build Order

**Phase 1: Foundation**

- directory-structure-and-agents - Establishes the core directory structure and moves the most critical components (agents and validators) that define the workflow system

**Phase 2: Infrastructure**

- workflow-migration - Migrates the operational components (commands, protocols, scripts) that depend on the agent structure being in place

**Phase 3: Content & Documentation**

- content-migration - Moves remaining content (skills, sub-agents, templates) and creates documentation once the full structure is stable

**Rationale:** Sequential execution ensures each layer is complete before building on it. The agent structure must exist before migrating commands that reference those agents. All infrastructure must be in place before migrating content and creating comprehensive documentation.

---

## Cross-Feature Dependencies

**This feature depends on:**

- None - This is the first feature in the multi-stack-template project with no external dependencies.

**This feature is depended on by:**

- `multi-stack-template/stack-profile-system/profile-schema` - Requires core/ structure to define which components are generic vs. stack-specific
- `multi-stack-template/partial-file-abstraction/marker-system` - Requires core/ organization to implement partial file inheritance logic
- `multi-stack-template/stack-profile-system/instantiation-engine` - Requires core/ as the source for copying generic components into new stack instances

**Example format for depends_on references:**

```text
project-name/feature-name/spec-name
other-project/other-feature/other-spec
```

---

**Note:** Parent features.json may be stale. Update manually if needed. Feature refinements do not propagate to parent.
