# Design Incremental Execution

> **Status:** Approved

## Summary

Extends the `/design` command with incremental execution via `--phase`, `--resume`, `--no-checkpoint`, and `--dry-run` flags. Integrates checkpoint-manager.cjs for crash recovery, adds interactive pre-design and post-design checkpoints between phases, auto-generates summary.md/spec.json/meta.yaml after the write phase, and creates a Linear issue via MCP when the user approves the spec.

---

## Key Decisions

- `--no-checkpoint` skips interactive prompts only, still saves checkpoint files for crash recovery
- Linear MCP failure is a blocking error (halts execution), not a silent skip
- Per-phase checkpoint granularity (one checkpoint after full RESEARCH, not per sub-agent)
- `parseFlags()` extended with string type support rather than manual parsing
- Domain-writer generates all 6 output files in a single pass

---

## Specs

- [Requirements](./requirements.md)
- [Design](./design.md)
- [Tasks](./tasks.md)
- [Metadata](./meta.yaml)
- [Spec JSON](./spec.json)
