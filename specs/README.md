# Specifications

This directory contains feature specifications for the project using a **directory-based format** with optional **nested hierarchy**.

## Overview

Specs are organized as directories (not single files) and support two organizational patterns:

1. **Nested Hierarchy** - Group related features under project directories
2. **Standalone Specs** - Top-level feature directories

The centralized path resolver (`spec-path-resolver.cjs`) automatically handles both formats.

## Spec Directory Structure

### Nested Hierarchy Example

```
specs/
├── basecamp/                  # PROJECT level
│   ├── project.md            # Project overview
│   ├── requirements.md       # Project requirements
│   ├── meta.yaml             # Project metadata
│   ├── auth/                 # FEATURE level
│   │   ├── feature.md        # Feature overview
│   │   ├── requirements.md   # Feature requirements
│   │   ├── design.md         # Technical design
│   │   ├── tasks.md          # Implementation tasks
│   │   ├── meta.yaml         # Feature metadata
│   │   ├── summary.md        # Executive summary
│   │   └── spec.json         # Structured spec data
│   └── dashboard/            # FEATURE level
│       ├── feature.md
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       ├── meta.yaml
│       ├── summary.md
│       └── spec.json
└── user-profile/             # Standalone FEATURE
    ├── requirements.md
    ├── design.md
    ├── tasks.md
    ├── meta.yaml
    ├── summary.md
    └── spec.json
```

### Standalone Example

```
specs/
├── user-authentication/      # Standalone FEATURE
│   ├── requirements.md
│   ├── design.md
│   ├── tasks.md
│   ├── meta.yaml
│   ├── summary.md
│   └── spec.json
└── payment-integration/      # Standalone FEATURE
    ├── requirements.md
    ├── design.md
    ├── tasks.md
    ├── meta.yaml
    ├── summary.md
    └── spec.json
```

## Nested Hierarchy

### PROJECT Level

Project directories group related features and provide high-level context.

**Required Files:**

- `project.md` - Project overview and goals
- `requirements.md` - Cross-feature requirements
- `meta.yaml` - Project metadata

### FEATURE Level

Feature directories contain detailed specifications for individual features.

**Required Files:**

- `feature.md` - Feature overview (nested only)
- `requirements.md` - Feature requirements
- `design.md` - Technical design
- `tasks.md` - Implementation tasks
- `meta.yaml` - Feature metadata
- `summary.md` - Executive summary
- `spec.json` - Structured spec data

## Standalone Specs

Standalone specs are top-level feature directories without a project parent.

**Required Files:**

- `requirements.md` - Feature requirements
- `design.md` - Technical design
- `tasks.md` - Implementation tasks
- `meta.yaml` - Feature metadata
- `summary.md` - Executive summary
- `spec.json` - Structured spec data

## Path Resolution

The centralized path resolver (`.claude/scripts/lib/spec-path-resolver.cjs`) automatically detects whether a spec is nested or standalone:

**Resolution Examples:**

- `basecamp/auth` → `specs/basecamp/auth/`
- `user-authentication` → `specs/user-authentication/`
- Detects format by checking for `project.md` in parent directory

## Required Files

| Level      | Required Files                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| PROJECT    | `project.md`, `requirements.md`, `meta.yaml`                                                                   |
| FEATURE    | `feature.md` (nested only), `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json` |
| STANDALONE | `requirements.md`, `design.md`, `tasks.md`, `meta.yaml`, `summary.md`, `spec.json`                             |

## Finding Specs

### List All Projects

```bash
ls specs/
```

### View Project Overview

```bash
cat specs/basecamp/project.md
```

### List Features in a Project

```bash
ls specs/basecamp/
```

### View Feature Specification

```bash
cat specs/basecamp/auth/requirements.md
cat specs/basecamp/auth/design.md
```

### Find All Feature Specs

```bash
find specs -name 'meta.yaml'
```

### Search Within Specs

```bash
grep -r "authentication" specs/
```

## Backward Compatibility

Existing standalone specs remain fully valid. The system supports both nested and standalone formats:

- **New projects** can use nested hierarchy for better organization
- **Existing specs** continue to work as standalone features
- **Mixed usage** is supported - use nested or standalone as appropriate

The path resolver handles both formats transparently, so agents and commands work identically regardless of organization pattern.
