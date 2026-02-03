# Spec Path Resolution

> **Status:** Draft

## Summary

Centralizes spec path handling by creating a unified resolver utility at `.claude/scripts/lib/spec-resolver.cjs` that validates spec names (kebab-case, length limits, reserved names), resolves paths across flat and hierarchical layouts, detects directory types via marker files (project.md, feature.md, requirements.md), and handles ambiguity with actionable errors. Updates 15+ consumers (implement.md, routing skill, agents, sub-agent templates, protocols) to use the resolver instead of hardcoded `specs/${feature}/` paths, enabling future hierarchy support without further changes.

---

## Key Decisions

- Search order priority: flat standalone > project-scoped > feature-scoped > feature-list
- Ambiguity is a blocking error (fail-fast), not an arbitrary selection
- Type detection via marker files runs after path resolution, not during search
- CommonJS module format following existing `checkpoint-manager.cjs` and `command-utils.cjs` patterns
- All returned paths are absolute with trailing slash for consistency

---

## Specs

- [Requirements](./requirements.md)
- [Design](./design.md)
- [Tasks](./tasks.md)
- [Metadata](./meta.yaml)
- [Spec JSON](./spec.json)
