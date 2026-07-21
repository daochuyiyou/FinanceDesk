# FinanceDesk V1 — Pilot Operations Checklist

> This checklist must be completed before and during the enterprise Pilot run.

---

## 1. Installation & Setup

- [ ] **Server requirements**: Python 3.11+, Node.js 20+, 4GB RAM, 10GB disk
- [ ] **Clone repository**: `git clone <repo-url>`
- [ ] **Backend install**: `cd backend && pip install -r requirements.txt`
- [ ] **Frontend build**: `cd frontend && npm install && npx vite build`
- [ ] **Start backend**: `cd backend && python main.py`
- [ ] **Verify**: `curl http://localhost:8000/api/v1/projects?page=1` returns 200
- [ ] **Browser**: Open http://localhost:8000, Dashboard loads

## 2. Database Initialization

- [ ] SQLite database created at `backend/FinanceDesk_Data/finance.db`
- [ ] All 12 ORM tables exist (`PRAGMA table_list`)
- [ ] System dictionary seeded (project types, cost types, etc.)

## 3. Data Import

- [ ] **Contracts**: Download template → fill → import via **数据导入** tab
- [ ] **Orders**: Download template → fill → import
- [ ] **Income Flows**: Download template → fill → import
- [ ] **Cost Flows**: Download template → fill → import
- [ ] **Collections**: Download template → fill → import
- [ ] **Payments**: Download template → fill → import
- [ ] Verify counts match uploaded data

## 4. Manual Business Entry

- [ ] **Contract**: Click "新增合同" → fill form → save
- [ ] **Order**: Click "新增订单" → select project → fill → save
- [ ] **Income Flow**: Click "新增收入开票" → select order → fill → save
- [ ] **Cost Flow**: Click "新增成本流水" → select order → fill → save
- [ ] **Collection**: Click "新增回款" → select income flow → fill → save
- [ ] **Payment**: Click "新增付款" → select cost flow → fill → save

## 5. Dashboard Verification

- [ ] Dashboard loads with correct project count
- [ ] KPI totals match imported/manual data
- [ ] "项目经营" tab shows correct per-project summaries
- [ ] "应收账龄" tab renders correctly
- [ ] "项目利润" tab renders correctly
- [ ] Drill-down to contract-level dashboard works
- [ ] Drill-down to order-level dashboard works

## 6. CRUD Operations

- [ ] **Edit**: Open existing record → modify field → save → verify
- [ ] **Search**: Type in search box → results filtered correctly
- [ ] **Delete**: Click delete → Popconfirm appears → confirm → record soft-deleted
- [ ] **Delete protection**: Cannot delete order with income/cost flows (409)
- [ ] **Delete protection**: Cannot delete income flow with collections (409)

## 7. Import/Export

- [ ] **Download template**: Each of 6 templates downloads correctly
- [ ] **Import with errors**: Upload file with bad data → error report displayed
- [ ] **Import duplicate**: Upload same file twice → dedup detection
- [ ] **Export data**: Click export → Excel file downloads with current data

## 8. Backup & Recovery

- [ ] **Backup database**: `cp backend/FinanceDesk_Data/finance.db backup/finance.db.bak`
- [ ] **Restore**: Replace finance.db with backup → restart → data intact
- [ ] **Verify backup**: Dashboard counts match before/after restore

## 9. Navigation

- [ ] All 13 sidebar menu items navigate correctly
- [ ] Submenu (成本合同库) expands and items navigate correctly
- [ ] Breadcrumb trail updates correctly
- [ ] Browser back/forward works (SPA history)

## 10. Performance Check (for Pilot Administrator)

- [ ] Dashboard loads in under 1 second
- [ ] Import 1,000 records in under 15 seconds
- [ ] Page switching feels responsive (< 500ms)

## Known Limitations During Pilot

| Issue | Workaround |
|-------|------------|
| Single-user mode | Only one person can use the system at a time |
| SQLite concurrency | Avoid simultaneous writes from multiple sessions |
| No audit trail viewer | Check `audit_log` table directly via SQLite CLI |
| No email/notification | Manual communication for payment reminders |

---

**Pilot Administrator**: After completing all checks, sign off below.

```
Date: _______________
Signed: _______________
Role: _______________
