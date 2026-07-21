# Dashboard Workbench Model

> FinanceDesk 主页 → 项目经理每天打开工作的经营工作台。
> 不是首页，是工作台。

---

## 1. Layout

```
┌─ Business Analyzer（全局：期间/维度/对象/高级过滤）──┐
├─ Summary KPI Bar ─────────────────────────────────────┤
│  [项目数] [合同总额] [累计收入] [累计成本] [累计利润]  │
│  [累计开票] [累计回款] [收入Gap] [成本Gap]            │
├─ Tab: 项目维度 ───────────────────────────────────────┤
│  ┌─ Project Business Table ────────────────────────┐  │
│  │  项目名称 | 订单数 | 合同总额 | 收入 | 成本     │  │
│  │  利润 | 回款 | 付款 | 操作 (进入订单工作台)      │  │
│  └──────────────────────────────────────────────────┘  │
├─ Tab: 应收账龄 ───────────────────────────────────────┤
│  ┌─ AR Aging Chart (Stacked Bar) ─────────────────┐  │
│  └─ AR Aging Table ───────────────────────────────┘  │
├─ Tab: 项目利润 ───────────────────────────────────────┤
│  ┌─ Profit Chart (Bar) ───────────────────────────┐  │
│  └─ Profit Table ─────────────────────────────────┘  │
├─ StatusBar ───────────────────────────────────────────┤
│  数据来源: ERP | 更新时间: 2026-06-30 | 经营期间: ××  │
└───────────────────────────────────────────────────────┘
```

---

## 2. Summary KPI Bar

All KPIs from `GET /api/v1/dashboard/summary`:

| KPI | Field | Drill-down |
|-----|-------|-----------|
| 项目数 | `project_count` | —|
| 订单数 | `total_order_count` | —|
| 合同总额 | `total_contract_amount` | → Order Business Workbench |
| 累计收入 | *(new)* | → Order Business Workbench |
| 累计成本 | *(new)* | → Order Business Workbench |
| 累计利润 | *(new)* | → Order Business Workbench |
| 累计开票 | `total_invoiced_amount` | → Order Business Workbench |
| 应收余额 | `total_receivable_amount` | → AR Aging tab |

> **Note:** Current `GET /api/v1/dashboard/summary` returns only 5 fields. Need to add: total_income, total_cost, total_profit, total_collected, total_paid.

**Visual design per KPI card:**

```
┌───────────────────┐
│ 累计收入           │  ← label, color #1677ff
│ ¥12,037,378.99    │  ← value, clickable (cursor: pointer)
│                   │
│ +12.3% vs 上月     │  ← trend (optional, future)
└───────────────────┘
```

---

## 3. Tab 1: Project Business Table

Current API `GET /api/v1/dashboard/project-summary` returns:
- `project_id`, `project_name`, `order_count`, `total_amount`, `total_invoiced`, `total_collected`, `receivable_balance`

**New columns to add** (need new API or extended API):
- `total_income` (来自 income_flow)
- `total_cost` (来自 cost_flow)
- `gross_profit` (income - cost)
- `total_paid` (来自 payment via cost_flow)

| Column | Align | Clickable | Drill to |
|--------|-------|-----------|----------|
| 项目名称 | left | ✅ | Order Business Workbench |
| 订单数 | right | ❌ | — |
| 合同总额 | right | ❌ | — |
| 累计收入 | right | ✅ | Income Flow (project-scoped) |
| 累计成本 | right | ✅ | Cost Flow (project-scoped) |
| 毛利 | right | ❌ | — |
| 已回款 | right | ✅ | Collection (project-scoped) |
| 已付款 | right | ✅ | Payment (project-scoped) |
| 应收余额 | right | ❌ | — |
| 操作 | center | ✅ (link) | Order Business Workbench |

---

## 4. Tab 2: AR Aging (Keep as-is)

Current implementation is solid:
- Stacked bar chart (30天内 / 31-60天 / 61-90天 / 90天以上)
- Detail table

**Only change:** Each project name in the table becomes clickable → Order Business Workbench.

---

## 5. Tab 3: Project Profit (Keep as-is)

Current implementation is solid:
- Profit bar chart (green for positive, red for negative)
- Detail table

**Only change:** Each project name becomes clickable → Order Business Workbench.

---

## 6. API Additions Required

| Endpoint | Method | Purpose | Scope |
|----------|--------|---------|-------|
| `/api/v1/dashboard/summary` | **EXTEND** | Add `total_income`, `total_cost`, `total_profit`, `total_collected`, `total_paid` | Read-only |
| `/api/v1/dashboard/project-summary` | **EXTEND** | Add `total_income`, `total_cost`, `gross_profit`, `total_paid` per project | Read-only |
| `/api/v1/orders/batch-summary` | **NEW** | Return all orders with financial KPIs for Order Business Workbench | Read-only |

> All new/endpoints are read-only aggregation. No CRUD modification. No Engine/Repository change. Compliant with sprint constraints.
