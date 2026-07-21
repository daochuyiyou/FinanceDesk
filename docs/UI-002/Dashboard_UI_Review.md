# Dashboard UI Review

> Current state vs proposed workbench: Before / After for UI-002 Order Business Workbench

---

## 1. Dashboard (经营看板)

### Before

```
┌──────────────────────────────────────────────┐
│  数据看板                                      │
│                                              │
│  项目汇总 | 应收账龄 | 项目利润                │
│  ┌──────────────────────────────────────┐    │
│  │ [项目数] [合同总额] [已开票] [应收余额] │    │
│  │                                       │    │
│  │ ProTable: 项目 | 订单数 | 总额 | ...   │    │
│  │                     [查看订单] → Modal │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  Modal: 订单明细 (basic columns)              │
│  └─ no drill-down, no summary               │
└──────────────────────────────────────────────┘
```

**Issues:**
1. The page has its own `<div style={{padding: 24, background: '#f5f5f5'}}>` — conflicts with PageLayout
2. `<Title level={4}>数据看板</Title>` — page-level title, should use PageLayout's WorkbenchHeader
3. "查看订单" opens a Modal → should open the full Order Business Workbench page
4. Modal only shows 4 columns (no income, no profit, no gaps, no status)
5. No drill-down on any KPI
6. Summary cards are not clickable
7. No project-level income/cost/profit columns

### After

```
┌─ Breadcrumb: 经营分析 ──────────────────────────┐
├─ Title: 经营看板                    [刷新]       │
├─ ContextBar: 期间 | 维度 | 对象                  │
├─ Summary KPI Bar (all clickable) ────────────────┤
│  [项目数] [合同总额] [累计收入] [累计成本]         │
│  [累计利润] [累计开票] [累计回款] [收入Gap]       │
├─ Tabs ───────────────────────────────────────────┤
│  项目维度 | 应收账龄 | 项目利润                   │
│  ┌─ Tab: 项目维度 ───────────────────────────┐   │
│  │  ProTable: 项目 | 订单数 | 总额 | 收入     │   │
│  │  成本 | 毛利 | 回款 | 付款 | 应收 | 操作    │   │
│  │  [进入订单工作台]                          │   │
│  └───────────────────────────────────────────┘   │
├─ StatusBar ──────────────────────────────────────┤
└──────────────────────────────────────────────────┘
```

**Changes:**
1. ✅ Wrapped in PageLayout (removes self-styled div)
2. ✅ Title from PageLayout (removes `<Title level={4}>`)
3. ✅ "查看订单" → navigates to Order Business Workbench (not Modal)
4. ✅ New columns: 收入, 成本, 毛利, 回款, 付款
5. ✅ All KPI numbers clickable → drill-down
6. ✅ Summary KPI bar with 8 drillable cards
7. ✅ StatusBar for data freshness

---

## 2. OrderPage (订单管理 → Order Business Workbench)

### Before

```
┌─ Project Selector ──────────────────────────────┐
│  [Dropdown: 选择一个项目]                        │
├─ ProTable ──────────────────────────────────────┤
│  项目名称 | 供应商 | 订单名称 | 金额 | 操作      │
│  [Edit] [Delete]                                │
├─ Modal ─────────────────────────────────────────┤
│  Create/Edit form                               │
└─────────────────────────────────────────────────┘
```

**Issues:**
1. Pure CRUD page — no business KPIs
2. No order-level financial summary
3. No drill-down
4. "金额" is just the raw order amount, no revenue/cost context
5. No status auto-derivation
6. Order is treated as a data entry row, not a "business object"

### After

```
┌─ Breadcrumb: 经营分析 > 合同中心 > 订单管理 ────────┐
├─ Title: 订单经营分析             [新增] [导出] [刷新] │
├─ ContextBar: 期间 | 维度: 项目 | 对象: xxx          │
├─ Order Summary KPI ────────────────────────────────┤
│  [订单数] [总金额] [收入] [成本] [利润] [回款]       │
│  [付款] [收入Gap] [成本Gap]                         │
├─ Order Business Table ─────────────────────────────┤
│  订单编号 | 名称 | 金额 | 收入 | 回款 | 成本 | 付款  │
│  利润 | 收入Gap | 成本Gap | 状态                    │
│  (all KPIs drillable → Drawer)                    │
├─ Detail Drawer (shared) ───────────────────────────┤
│  Income/Cost/Collection/Payment flow tables        │
│  Order detail with tabs                            │
├─ StatusBar ────────────────────────────────────────┤
└────────────────────────────────────────────────────┘
```

**Changes:**
1. ✅ PageLayout integration (from UI-001)
2. ✅ Summary KPI bar (9 drillable cards)
3. ✅ Order Business Table with 11 columns + drillable KPIs
4. ✅ Shared Detail Drawer for all drill-downs
5. ✅ Auto-derived status (7 states)
6. ✅ Order Detail Drawer with 5 tabs
7. ✅ Order is a business object, not a CRUD row
8. ✅ Keep CRUD (新增) in Toolbar — operations not removed, just repositioned

---

## 3. Component Comparison

| Component | Current | Proposed |
|-----------|---------|----------|
| Dashboard.tsx | 448 lines, self-styled, 3 tabs, modal | Same tabs + Summary KPI + drillable columns + PageLayout |
| OrderPage.tsx | 403 lines, CRUD table + project selector | New OrderBusinessWorkbench component OR heavily refactored OrderPage |
| New: SummaryKPI | — | Reusable `<SummaryKPI>` component for drillable stat cards |
| New: DetailDrawer | — | Shared `<DetailDrawer>` for all drill-down flows |
| New: OrderDetailDrawer | — | `<OrderDetailDrawer>` with tabs for full order view |
| New: FlowTable | — | `<FlowTable>` for income/cost/collection/payment display |

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/SummaryKPI.tsx` | Drillable stat card group |
| `frontend/src/components/DetailDrawer.tsx` | Shared flow drawer for KPI drill-down |
| `frontend/src/components/OrderDetailDrawer.tsx` | Full order detail with tabs |
| `frontend/src/components/FlowTable.tsx` | Reusable flow table (income/cost/collection/payment) |
| `frontend/src/utils/kpi.ts` | Status derivation + formatting helpers |

## 5. Files to Modify

| File | Change |
|------|--------|
| `frontend/src/pages/Dashboard.tsx` | Add SummaryKPI, drillable columns, PageLayout, navigate to OrderWorkbench |
| `frontend/src/pages/OrderPage.tsx` → OrderBusinessWorkbench | Complete rewrite: KPI bar + business table + drawer |
| `frontend/src/App.tsx` | Add route for OrderWorkbench with project_id param |
| `frontend/src/services/dashboard.ts` | Add batch-summary API call |
| `backend/app/routers/dashboard.py` | EXTEND `/summary` and `/project-summary`, add `/orders/batch-summary` |

## 6. API Changes

| Endpoint | Status | Change |
|----------|--------|--------|
| `GET /dashboard/summary` | EXTEND | Add total_income, total_cost, total_profit, total_collected, total_paid |
| `GET /dashboard/project-summary` | EXTEND | Add total_income, total_cost, gross_profit, total_paid |
| `GET /orders/batch-summary?project_id=` | NEW | Return all orders with financial KPIs |
| `GET /orders/{id}/summary` | EXISTING | Already returns order_amount, income, cost, profit, collection, payment, erp_gap |
| `GET /orders/{id}/next-action` | EXISTING | Already returns action + priority |
