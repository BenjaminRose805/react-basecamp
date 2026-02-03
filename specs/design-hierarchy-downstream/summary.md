# Design Hierarchy Downstream

> **Status:** Draft

## Summary

Updates 14 downstream files across 6 areas to adopt the nested spec hierarchy from specs 1-2. Reconciles template field mismatches in meta.yaml and spec.json, extends CI workflow validation for recursive discovery and level-aware rules, updates skill/agent documentation for nested path patterns, modifies GitHub templates and command docs for nested support, and rewrites specs/README.md for directory-based specs. All changes preserve backward compatibility with existing standalone specs while enabling optional project/feature nesting.

---

## Key Decisions

- meta.yaml template reconciliation prioritizes actual usage over original template fields (removes unused author/version, adds tasks_total/tasks_complete)
- CI branch mapping prefers nested paths when both nested and flat directories exist for the same branch name
- Path display width standardized at 60 characters across preview/progress templates to accommodate nested paths
- specs/README.md receives complete rewrite rather than incremental updates to clearly document directory-based format
- review-config.yaml gets documentation-only comment (no functional change) to clarify nested support

---

## Specs

- [Requirements](./requirements.md)
- [Design](./design.md)
- [Tasks](./tasks.md)
- [Metadata](./meta.yaml)
- [Spec JSON](./spec.json)
