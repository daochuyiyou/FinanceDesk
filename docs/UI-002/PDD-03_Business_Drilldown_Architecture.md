# PDD-03: Business Drill-down Architecture

> **Principle:** 所有经营数字必须具有来源，任何金额必须能够逐级点击查看来源。禁止出现不能 Drill-down 的数字。
>
> Type: **Permanent Design Decision**
> Status: **Proposed** | Version: v0.1

---

## 1. Scope

This PDD applies to **every page** in FinanceDesk that displays a financial KPI — from the top-level Dashboard Summary down to the individual flow line items. It does **not** apply to system pages (AuditLog, DataImport) that have no business KPIs.

---

## 2. The Drill-down Chain

```
Company
  └─ Period: 2026-06
      └─ Dimension: Company / Contract / Project / Order
          ↓
Contract / Project List
  └─ Click a row → Order Business Workbench (per-project)
      ↓
Order Business Table
  └─ Order Amount      → Order Detail
  └─ Revenue           → Income Flow List (filtered)
  └─ Collection        → Collection List (filtered)
  └─ Cost              → Cost Flow List (filtered)
  └─ Payment           → Payment List (filtered)
  └─ Profit            → Profit Analysis
      ↓
Flow Detail (Drawer)
  └─ Single flow record with full fields
```

**Visual representation:**

```
  ┌──────────────────────────────────────────────┐
  │  Dashboard Summary KPI                       │
  │  project_count | total_amount | invoiced...  │
  │           ↓ (click project)                  │
  ├──────────────────────────────────────────────┤
  │  Order Business Workbench                    │
  │  ┌─ Order Summary ────────────────────────┐  │
  │  │  Count | Amount | Revenue | Cost | ...  │  │
  │  └─────────────────────────────────────────┘  │
  │  ┌─ Order Business Table ─────────────────┐  │
  │  │  Order | Amount | Rev | Col | Cost |   │  │
  │  │  Pay | Profit | Gap | Status            │  │
  │  │         ↓ (click Revenue)               │  │
  │  └─────────────────────────────────────────┘  │
  ├──────────────────────────────────────────────┤
  │  <Drawer> Income Flow List                   │
  │  invoice_date | taxable_amount | invoice_no  │
  └──────────────────────────────────────────────┘
```

---

## 3. Component Hierarchy

Each drillable KPI is rendered as `<DrillableKPI>`:

```
<DrillableKPI
  label="累计收入"
  value={¥1,234,567}
  onClick={() => openDrawer('income', orderId)}
/>
```

All Drillable KPIs sharing the same `<DetailDrawer>` per page:

```
<PageLayout title="订单经营分析" ...>
  <OrderSummaryKPI />        ← 6-8 drillable stat cards
  <OrderBusinessTable />     ← each row has drillable cells
  <DetailDrawer />           ← shared drawer for all drill-downs
</PageLayout>
```

---

## 4. Drill-down Targets

| Source KPI | Click Target | Data Source | Component |
|-----------|-------------|-------------|----------|
| Dashboard: Project Name | Order Business Workbench (filtered) | `GET /dashboard/order-detail/{project_id}` | `<OrderBusinessTable>` |
| Order Workbench: Revenue | Income Flow List in Drawer | `GET /income-flows?order_id={id}` | `<FlowTable>` |
| Order Workbench: Collection | Collection List in Drawer | `GET /collections?flow_id__in={income_ids}` | `<FlowTable>` |
| Order Workbench: Cost | Cost Flow List in Drawer | `GET /cost-flows?order_id={id}` | `<FlowTable>` |
| Order Workbench: Payment | Payment List in Drawer | `GET /payments?cost_id__in={cost_ids}` | `<FlowTable>` |
| Order Workbench: Order Row | Order Detail | `GET /orders/{id}/summary` | `<OrderDetailDrawer>` |

---

## 5. Constraints

- **No lazy loading on hover** — all drill-downs are click → open, not hover → preview
- **No numbers without a click target** — every KPI in Summary must implement `onClick`
- **No modals for drill-down** — use Drawer (side panel) to preserve page context
- **Drawer width:** `720px` for flow tables, `960px` for order detail

---

## 6. Adopted From

- Business Analyzer (全局分析栏) — provides period/dimension/object context
- PageLayout (UI-001) — provides breadcrumb/title/toolbar/context bar
