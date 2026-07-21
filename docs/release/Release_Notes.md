# FinanceDesk V1.0.0-rc1 Release Notes

> Release Candidate 1 — Enterprise Pilot Ready

## Overview

FinanceDesk is a financial management system built for **中移建设崇左分公司**. It provides end-to-end management of contracts (projects), orders, revenue/cost flows, collections, and payments — with both manual entry and Excel template import capabilities.

## Version

- **Release**: v1.0.0-rc1
- **Build**: 2026-07-08
- **Status**: Release Candidate

## What's Included

### Core Business Modules (6)

| Module | Features | Data Entry |
|--------|----------|------------|
| **Contracts (合同管理)** | Full CRUD, contract summary, drill-down drawer | Manual + Excel import |
| **Orders (订单管理)** | Full CRUD, order detail drawer | Manual + Excel import |
| **Revenue (收入管理)** | Invoice tracking, status management | Manual + Excel import |
| **Cost (成本执行)** | Cost flow tracking, supplier cost types | Manual + Excel import |
| **Collection (收款)** | Collection against invoices, remaining tracking | Manual + Excel import |
| **Payment (付款)** | Payment against costs, remaining tracking | Manual + Excel import |

### Dashboard & Analytics

- **经营看板** (Business Dashboard): Project summary, AR aging, profit analysis
- **合同经营分析** (Contract Business Analysis): Per-contract profit/loss view
- **订单经营分析** (Order Business Analysis): Per-order drill-down with flows timeline

### Import Pipeline

- 6 Excel template imports (contract, order, income, cost, collection, payment)
- Chinese column header auto-mapping
- Pydantic validation with error reporting
- Duplicate detection (unique constraints)
- Unified import workbench at **数据导入** tab

### Architecture

- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React 18 + Ant Design 5 + Vite
- Test: pytest (backend) + Vitest (frontend)
- Deployment: systemd service + Docker-ready

## Data Import Templates

| Template | Expected Headers |
|----------|-----------------|
| 合同导入模板 | 框架合同名称, 签订时间, 合同开始时间, 合同结束时间, 集团内外, 项目类型 |
| 订单导入模板 | 项目ID, 订单编号, 订单名称, 甲方单位, 含税金额, 不含税金额, 签订日期, 订单类型, 状态 |
| 收入流水导入模板 | 订单ID, 税率, 含税金额, 不含税金额, 开票日期, 发票号码, 备注 |
| 成本流水导入模板 | 订单ID, 供应商ID, 成本类型, 税率, 含税金额, 不含税金额, 成本科目, 备注 |
| 回款导入模板 | 流水ID, 回款日期, 回款金额, 收款凭证号 |
| 付款导入模板 | 成本流水ID, 支付日期, 支付金额, 支付对象, 支付凭证号 |

## Known Issues

See [Known_Issues.md](./Known_Issues.md) for the complete list.

### Critical (P0) — All Resolved

All P0 bugs identified during RC-001 stabilization have been closed:
- Contract/Order create buttons restored
- ImportButton integration completed
- Navigation stability fixed
- All API endpoints verified

### Open Items (non-blocking for Pilot)

- 15 frontend files have `// @ts-nocheck` — legacy bypass, type-safe in next iteration
- Empty state messages not fully unified across all pages
- No authentication/authorization (single-user mode)

## Quick Start

```bash
# Prerequisites: Python 3.11+, Node.js 20+
cd backend
pip install -r requirements.txt
python main.py

# Open http://localhost:8000
```

## Upgrade from Previous Version

1. Backup database: `cp backend/FinanceDesk_Data/finance.db backend/FinanceDesk_Data/finance.db.bak`
2. Replace backend/ and frontend/ with new version
3. Run Alembic migrations: `cd backend && alembic upgrade head`
4. Rebuild frontend: `cd frontend && npm install && npx vite build`
5. Restart service
