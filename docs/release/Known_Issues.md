# Known Issues — FinanceDesk V1.0.0-rc1

> Status as of 2026-07-08

## Open Items (non-blocking for Pilot)

| ID | Issue | Severity | Impact | Workaround |
|----|-------|----------|--------|------------|
| K001 | `// @ts-nocheck` in 15 frontend files | Low | TypeScript type safety bypassed | Functional — no runtime impact |
| K002 | Empty state messages inconsistent across pages | Low | Minor visual inconsistency | No workaround needed |
| K003 | No authentication (single-user mode) | Low | No user isolation | Acceptable for Pilot |
| K004 | Delete success message text varies ("已删除" vs "删除成功") | Low | Cosmetic | No workaround needed |
| K005 | Collection page has dynamic import of collection service | Low | Bundle warning | No functional impact |
| K006 | No pagination on dashboard summary queries | Low | Performance at scale | Acceptable for current data volume |
| K007 | SQLite concurrent write limitation | Medium | Cannot scale to multi-user concurrent writes | Acceptable for single-user Pilot |

## Resolved Issues

| ID | Issue | Resolution |
|----|-------|------------|
| P0-001 | All "新增" buttons non-functional | Root cause: dist stale. Fixed: rebuild + add internal buttons to Contract |
| P0-002 | Contract page cannot create new contracts | Fixed: added internal "新增合同" button + ContractCreateDialog |
| P0-003 | Import endpoints returning 500 | Fixed: data_import.py validation + registration in main.py |
| P1-001 | Toolbar "新增" button broken | Fixed: removed showNew from all PageLayout configs |
