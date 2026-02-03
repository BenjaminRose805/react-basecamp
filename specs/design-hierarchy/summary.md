# Design Hierarchy

> **Status:** Draft

## Summary

Extends the `/design` command with a 3-tier hierarchy: project (produces project.md + features.json), feature (produces feature.md + specs.json with DAG dependencies), and spec (current 6-file behavior). Adds `--project`, `--feature`, `--spec` flags with mutual exclusivity and prompt-if-missing, `--parent=X` for nested structure, level-specific 3-phase pipeline routing, nested directory creation with collision detection, level-prefixed checkpoint keys, and level-specific validation (structure check for projects, DAG cycle detection for features, EARS for specs). Linear integration remains spec-level only.

---

## Key Decisions

- Level-aware pipeline routing uses the same 3-phase structure (research, write, validate) with different sub-agent prompts and output artifacts per level, rather than separate commands
- Standalone fallback (flat directory with warning) when parent is missing, supporting out-of-order creation without blocking user workflow
- Level-prefixed checkpoint keys (`design-{level}-{name}.json`) enable separate checkpoint state per hierarchy level without modifying checkpoint-manager.cjs
- Interactive checkpoint questions differ per level (6+6 project-specific, 6+6 feature-specific) while spec-level questions remain unchanged from design-incremental-execution
- DAG cycle detection for feature-level specs uses DFS traversal with O(V+E) complexity, treating cross-feature dependencies as external (no cycle check across features)

---

## Specs

- [Requirements](./requirements.md)
- [Design](./design.md)
- [Tasks](./tasks.md)
- [Metadata](./meta.yaml)
- [Spec JSON](./spec.json)
