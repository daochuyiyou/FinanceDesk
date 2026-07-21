# FinanceDesk V1.0.0-rc1 Release Checklist

> Final gate before Enterprise Pilot

## Freeze Gates

| Gate | Status | Date |
|------|--------|------|
| ✅ Business Freeze | Frozen | 2026-06 |
| ✅ BOS Freeze | Frozen | 2026-06 |
| ✅ Dashboard Freeze | Frozen | 2026-07 |
| ✅ Import Freeze | Frozen | 2026-07 |
| ✅ API Freeze | Frozen | 2026-07 |
| ✅ UI Freeze | Frozen | 2026-07 |
| ✅ RC-001 Bug Close | Closed | 2026-07-08 |
| ✅ RC-002 Standard Dataset | Created | 2026-07-08 |
| ⏳ RC-003 Documentation Freeze | In Progress | 2026-07-08 |
| ⏳ RC-004 Repository Audit | Pending | — |
| ⏳ RC-005 Release Readiness | Pending | — |

## P0/P1 Bug Status

| Category | Total | Closed | Open |
|----------|-------|--------|------|
| P0 | 8 | 8 | 0 |
| P1 | 7 | 7 | 0 |

## Data Verification

- [ ] Import demo dataset: `python3 demo-data/load.py`
- [ ] Verify counts match `demo-data/expected-result.md`
- [ ] Verify Dashboard snapshots match `demo-data/verification/`

## Release Package

- [x] Release_Notes.md
- [x] Known_Issues.md
- [ ] Deployment_Guide.md
- [ ] Change_Log.md
- [ ] User_Guide.md
- [ ] License.md

## Repository

- [ ] .gitignore covers all patterns
- [ ] No garbage files (pycache, dist, .bak, .sqlite-journal)
- [ ] README.md exists and passes 5-minute test
- [ ] requirements.txt / package.json valid
- [ ] All docs under `docs/` (no stray Knowledge/, api-docs.md at root)
- [ ] Version tag: `v1.0.0-rc1`

## Pilot Readiness

- [ ] UAT completed by finance team
- [ ] UAT completed by project manager
- [ ] UAT completed by business director
- [ ] All blocking UAT issues closed
