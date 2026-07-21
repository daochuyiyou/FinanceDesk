# Order Business Workbench

> 订单不是流水。订单是经营对象。
> 每个订单展示：Order Amount → Revenue → Collection → Cost → Payment → Profit → Gap → Status

---

## 1. Entry Points

| From | How | Filter |
|------|-----|--------|
| Dashboard Tab 1 (Project Table) | Click "进入订单工作台" or project name | All orders for that project |
| Dashboard Tab 2 (AR Aging) | Click project name | All orders for that project |
| Dashboard Tab 3 (Profit) | Click project name | All orders for that project |
| Sidebar → 订单管理 | Direct navigation | All orders (or filtered by Analyzer) |
| Business Analyzer | Dim=订单, Object=特定订单 | Single order |

---

## 2. Layout

```
┌─ Business Analyzer（全局）─────────────────────────────┐
├─ Breadcrumb ───────────────────────────────────────────┤
│  经营分析 > 合同中心 > 订单管理 (或: 项目名称 > 订单)   │
├─ Title + Toolbar ──────────────────────────────────────┤
│  订单经营分析                    [新增] [导出] [刷新]   │
├─ ContextBar ───────────────────────────────────────────┤
│  经营期间: 2026-06 | 分析维度: 项目 | 经营对象: xxx     │
├─ Order Summary KPI ────────────────────────────────────┤
│  7-10 drillable stat cards                             │
├─ Order Business Table ─────────────────────────────────┤
│  Order | Amount | Revenue | Collection | Cost |         │
│  Payment | Profit | RevGap | PayGap | Status           │
├─ Detail Drawer (shared, 720px) ────────────────────────┤
│  Flow table or order detail                            │
├─ StatusBar ────────────────────────────────────────────┤
│  数据来源: ERP | 更新时间: ×× | 经营期间: ××            │
└────────────────────────────────────────────────────────┘
```

---

## 3. Order Summary KPI

Source: `GET /api/v1/orders/batch-summary?project_id={id}` (new endpoint)

| KPI | Calculation | Drill-down |
|-----|-----------|-----------|
| 订单数量 | `COUNT(orders)` | — |
| 订单总金额 | `SUM(order.amount)` | — |
| 累计收入 | `SUM(income_flow.taxable_amount)` | → Drawer: Income Flow |
| 累计成本 | `SUM(cost_flow.taxable_amount)` | → Drawer: Cost Flow |
| 累计利润 | `income - cost` | — |
| 累计开票 | `SUM(income_flow.taxable_amount)` | — |
| 累计回款 | `SUM(collection.amount)` | → Drawer: Collection |
| 累计付款 | `SUM(payment.amount)` | — |
| 收入Gap | `order.amount - income_total` | — |
| 成本Gap | `cost_total - payment_total` | — |

**Card design:**

```
┌─────────────────────┐
│ 累计收入             │  ← label (gray #999)
│ ¥ 12,037,378.99    │  ← value (bold #333, cursor:pointer)
│                     │
└─────────────────────┘
```

Revenue/Cost/Collection/Payment cards: **cursor: pointer** with underline hover effect.
Non-clickable cards: normal cursor.

---

## 4. Order Business Table

**Columns:**

| Column | Type | Width | Clickable? | Drill to |
|--------|------|-------|-----------|----------|
| 订单编号 | text | 160 | ✅ | Order Detail Drawer |
| 订单名称 | text | 200 | ✅ | Order Detail Drawer |
| 订单金额 | money | 140 | ❌ | — |
| 累计收入 | money | 140 | ✅ | Income Flow Drawer |
| 累计回款 | money | 140 | ✅ | Collection Drawer |
| 累计成本 | money | 140 | ✅ | Cost Flow Drawer |
| 累计付款 | money | 140 | ✅ | Payment Drawer |
| 利润 | money | 140 | ❌ | (color-coded) |
| 收入Gap | money | 120 | ❌ | (color-coded) |
| 成本Gap | money | 120 | ❌ | (color-coded) |
| 状态 | tag | 100 | ❌ | — |

**Gap color rules:**

| Condition | Color |
|-----------|-------|
| Gap = 0 | `#52c41a` (green) |
| Gap > 0 | `#ff4d4f` (red) |

**Profit color rules:**

| Condition | Color |
|-----------|-------|
| Profit >= 0 | `#52c41a` (green) |
| Profit < 0 | `#ff4d4f` (red) |

---

## 5. Order Detail Drawer

When clicking an order row:

```
┌─ Drawer (960px) ──────────────────────────────────┐
│ Header: {order_name} ({order_no})                 │
├────────────────────────────────────────────────────┤
│ Tabs:                                              │
│  ① 经营摘要  |  ② 收入流水  |  ③ 成本流水          │
│  ④ 回款记录  |  ⑤ 付款记录                        │
├────────────────────────────────────────────────────┤
│ Tab ①: Order Summary                               │
│ ┌─ Order Info ─────────────────────────────────┐  │
│ │ 订单金额: ¥XXX  | 不含税: ¥XXX                │  │
│ │ 甲方: XXX     | 类型: XXX                    │  │
│ │ 日期: YYYY-MM-DD  | 状态: 执行中              │  │
│ └──────────────────────────────────────────────┘  │
│ ┌─ KPI Cards ─────────────────────────────────┐  │
│ │ 收入 XX | 回款 XX | 成本 XX | 付款 XX         │  │
│ │ 利润 XX | 收入Gap XX | 成本Gap XX            │  │
│ └──────────────────────────────────────────────┘  │
│ ┌─ Next Action ──────────────────────────────┐  │
│ │ 下一步: 继续收款 (P1)  | 来自系统自动推导    │  │
│ └──────────────────────────────────────────────┘  │
│                                                   │
│ Tab ②-⑤: Filtered Flow Tables                    │
│ ┌─ Income Flow Table ─────────────────────────┐  │
│ │ 开票日期 | 含税金额 | 不含税金额 | 发票号      │  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Data sources for drawer:**
- `GET /api/v1/orders/{id}` — order info
- `GET /api/v1/orders/{id}/summary` — financial KPIs
- `GET /api/v1/orders/{id}/next-action` — next action
- `GET /api/v1/income-flows?order_id={id}` — income flows
- `GET /api/v1/cost-flows?order_id={id}` — cost flows
- `GET /api/v1/collections?order_id={id}` — collections (via income_flow join)
- `GET /api/v1/payments?order_id={id}` — payments (via cost_flow join)

---

## 6. Drill-down Drawer (Shared)

For clicking individual KPI cells (Revenue, Cost, etc.):

```
┌─ Drawer (720px) ─────────────────────────────────┐
│ Header: {Order Name} → {KPI Type}                │
├──────────────────────────────────────────────────┤
│ ┌─ Flow Table ────────────────────────────────┐  │
│ │  Columns depend on flow type:               │  │
│ │  Income: 日期 | 类型 | 含税金额 | 发票号      │  │
│ │  Cost:   日期 | 类型 | 含税金额 | 供应商       │  │
│ │  Collection: 日期 | 金额 | 回款方式 | 状态    │  │
│ │  Payment: 日期 | 金额 | 付款方式 | 状态       │  │
│ └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

---

## 7. Status Derivation

All statuses are **auto-derived**, no manual maintenance.

| Status | Condition |
|--------|-----------|
| ✅ 正常 | Revenue = Collection AND Cost = Payment AND Revenue >= Cost |
| ⏳ 待开票 | Revenue = 0 (no income_flow records) |
| ⏳ 待回款 | Revenue > 0 AND Collection = 0 |
| ⏳ 待付款 | Cost > 0 AND Payment = 0 |
| ⚠️ 成本超支 | Cost > Order Amount |
| ⚠️ 利润异常 | Profit < 0 AND Revenue > 0 |
| 🔄 部分回款 | 0 < Collection < Revenue |
| 🔄 部分付款 | 0 < Payment < Cost |

**Priority:** Display the most severe status. Resolution: Critical > Warning > Info > Normal.

---

## 8. API Extension: Batch Order Summary

New endpoint: `GET /api/v1/orders/batch-summary?project_id={id}&period={period}`

Returns:

```json
{
  "summary": {
    "order_count": 10,
    "total_amount": 10000000.00,
    "total_income": 8000000.00,
    "total_cost": 5000000.00,
    "total_profit": 3000000.00,
    "total_collected": 4000000.00,
    "total_paid": 2000000.00,
    "revenue_gap": 4000000.00,
    "cost_gap": 3000000.00
  },
  "orders": [
    {
      "order_id": "1",
      "order_no": "CG-2026-001",
      "order_name": "设备采购",
      "order_amount": 1000000.00,
      "income_total": 800000.00,
      "collection_total": 500000.00,
      "cost_total": 300000.00,
      "payment_total": 100000.00,
      "profit": 500000.00,
      "revenue_gap": 200000.00,
      "cost_gap": 200000.00,
      "status": "部分回款"
    }
  ]
}
```

> This endpoint is **read-only aggregate**. It does not modify Engine/Repository/Summary.
> Implementation: raw SQL query in dashboard router (same pattern as existing endpoints).
