# Project: multi-stack-template

**Status:** Approved

---

## Vision

A reusable Claude Code workflow template system that decouples the proven workflow (/start → /design → /implement → /ship → /review → /reconcile) from any specific tech stack, using a core-plus-overlay architecture with declarative stack profiles.

The current React/Next.js template has proven value but is tightly coupled to a single stack. By extracting generic workflow components into a core template and creating a profile-driven overlay system, we enable teams using Python, Go, Rust, and other stacks to benefit from the same workflow patterns. The system builds on existing foundations: package-manager.cjs auto-detection, CLAUDE.md template variables, and the skills/core/ vs skills/stack/ separation.

---

## Scope

This project transforms the existing React/Next.js template into a multi-stack template system while maintaining backward compatibility. Analysis shows ~38 files (60%) are already generic, ~14 files (22%) are partially generic with stack-specific references, and ~11 files (18%) are fully stack-specific.

**In Scope:**

- File reorganization into core/ directory structure
- Stack profile system with declarative JSON schemas
- Assembly script for generating valid .claude/ directories from core + overlays
- Partial file abstraction (splitting 14 files into core + overlay versions)
- React/Next.js overlay extraction and validation
- Python/FastAPI overlay as proof-of-design
- Runtime profile resolution extending package-manager.cjs pattern
- Update mechanism for upgrading existing projects

**Success Criteria:**

- Round-trip validation: init.cjs assembly produces bit-identical output to current template for React/Next.js stack
- Python/FastAPI overlay generates valid .claude/ directory with working environment-check.cjs and routing
- update.cjs successfully upgrades test project with 3-way merge and diff preview
- Zero regressions in existing React/Next.js workflow functionality
- All 8 features implemented in build order with passing validation

---

## Feature List

| Feature                      | Description                                                               | Priority | Status  |
| ---------------------------- | ------------------------------------------------------------------------- | -------- | ------- |
| core-reorganization          | Move 38 generic files into core/ directory structure                     | High     | Pending |
| stack-profile-system         | Define JSON schema and build profile reader module                       | High     | Pending |
| partial-file-abstraction     | Split 14 partial files into generic core + stack overlay versions        | High     | Pending |
| assembly-script              | init.cjs for copying core, merging overlays, substituting variables      | High     | Pending |
| react-nextjs-overlay         | Extract current stack into stacks/react-nextjs/ with validation          | High     | Pending |
| python-fastapi-overlay       | Create Python/FastAPI overlay as proof-of-design (~15 new files)         | Medium   | Pending |
| runtime-profile-resolution   | Extend runtime resolution pattern to stack-profile.cjs                   | Medium   | Pending |
| update-mechanism             | update.cjs for upgrading projects with 3-way merge and dry-run support   | Medium   | Pending |

---

## Out of Scope

- Building actual projects with the template system (templates only)
- Production-ready alternative stacks beyond Python/FastAPI validation
- CI/CD pipeline integration for multi-stack projects
- Community contribution workflow for new stack overlays
- Interactive CLI scaffolding tool
- Documentation site or registry for available stacks
- Automated testing framework for template system itself

---

## Dependencies

| Dependency           | Type     | Status   | Impact                                           |
| -------------------- | -------- | -------- | ------------------------------------------------ |
| package-manager.cjs  | Internal | Complete | Required for runtime detection pattern extension |
| CLAUDE.md templates  | Internal | Complete | Foundation for variable substitution system      |
| skills/core/ pattern | Internal | Complete | Existing separation guides overlay design        |
| Node.js runtime      | External | Stable   | Required for assembly/update scripts only        |

---
