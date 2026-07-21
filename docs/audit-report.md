# FinanceDesk V1 Documentation Audit

> Generated: 2026-07-08 | RC-003 Release Package

## Current State: Duplicate & Scattered

### Root-level duplicates (same file at root AND in docs/)

| Root file | docs/ copy | Action |
|-----------|-----------|--------|
| `api-docs.md` | `docs/api-docs.md` | Keep in `docs/api/`, remove root |
| `code-review.md` | `docs/code-review.md` | Keep in `docs/knowledge/`, remove root |
| `data-model-er.md` | `docs/data-model-er.md` | Keep in `docs/architecture/`, remove root |

### Directory Inventory

| Directory | Files | Status |
|-----------|-------|--------|
| `Knowledge/` (capital K) | ~120+ | Most comprehensive docs — all architecture, business, sprint records |
| `docs/` (lowercase) | ~10 | Subset of Knowledge + go-live + UI-002 |
| Root (`api-docs.md` etc.) | 3 | Duplicates of docs/ content |

## Recommended Directory Structure

```
docs/
├── architecture/       # System architecture, data models, ADR, UI architecture
│   ├── data-model-er.md
│   ├── Architecture_Roadmap.md
│   ├── Repository_Architecture.md
│   ├── UI_Architecture.md
│   ├── Workbench_Architecture.md
│   └── ...
├── business/           # Business Constitution, BOS, business rules
│   ├── Business_Constitution.md
│   ├── Business_Object_Standard_V1.md
│   ├── Business_Rule_Catalog.md
│   ├── FinanceDesk_Product_Blueprint.md
│   └── ...
├── api/                # API documentation
│   ├── api-docs.md
│   └── ...
├── go-live/            # Deployment, pilot, import specs
│   ├── pilot-operation-guide.md
│   ├── erp-import-spec.md
│   ├── import-export-spec.md
│   └── ...
├── release/            # Release package (V1.0)
│   ├── Release_Notes.md
│   ├── User_Guide.md
│   ├── Administrator_Guide.md
│   ├── Deployment_Guide.md
│   ├── Change_Log.md
│   ├── Known_Issues.md
│   └── License.md
└── knowledge/          # Sprint records, review docs, design decisions
    ├── AHF-*  (architecture hardening framework)
    ├── BDD-*  (sprint plans & validations)
    ├── F1-* F2-* F3-* (feature validation reports)
    └── ...
```

## Files Requiring Review

| File | Issue | Action |
|------|-------|--------|
| `api-docs.md` (root + docs/) | Duplicate | Consolidate |
| `code-review.md` (root + docs/) | Duplicate | Consolidate |
| `data-model-er.md` (root + docs/) | Duplicate | Consolidate |
| `Knowledge/` vs `docs/` | Split corpus | Unify under `docs/` |
| `start.bat`, `start.sh` | Shell scripts at root | Move to `scripts/` |
