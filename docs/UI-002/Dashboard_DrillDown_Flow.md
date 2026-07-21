# Dashboard Drill-down Flow

> 完整的经营分析 Drill-down 交互流程

---

## 1. Entry: Dashboard (经营看板)

```
┌──────────────────────────────────────────────────────┐
│  Dashboard                                           │
│                                                      │
│  [项目数: 13] [合同总额: ¥14.6M] [累计收入: ¥12M] ..  │
│                                                      │
│  ┌─ Tab: 项目维度 ─────────────────────────────────┐  │
│  │  项目名称     | 合同总额 | 收入    | 操作         │  │
│  │  ────────────────────────────────────────────  │  │
│  │  Engine Test  | ¥800K   | ¥1.75M | [进入订单]   │  │
│  │                        ↓ click                  │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↓                            │
│           ┌──────────────────────────────┐              │
│           │  Navigate to Order Business  │              │
│           │  Workbench (filtered by      │              │
│           │  project_id)                 │              │
│           └──────────────────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

**Flow:** Dashboard → click project name/button → `setCurrentPage('orders')` with `projectId` → Order Business Workbench loads.

---

## 2. Order Business Workbench

```
┌─ Order Summary KPI ──────────────────────────────────────┐
│  [订单数] [总金额] [收入] [成本] [利润]                     │
│  [回款] [付款] [收入Gap] [成本Gap]                         │
├─ Order Business Table ───────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐    │
│  │  CG-001 | 设备采购 | ¥1M | ¥800K | ¥500K | ...  │    │
│  │                  ↓ click Revenue cell             │    │
│  └──────────────────────────────────────────────────┘    │
│                          ↓                                │
│  ┌────────────────────────────────────────────────────┐   │
│  │ DetailDrawer (720px)                               │   │
│  │ {order_no} → 收入流水                              │   │
│  │                                                    │   │
│  │ 开票日期    | 含税金额    | 发票号                   │   │
│  │ ────────────────────────────────────────────       │   │
│  │ 2026-01-15 | ¥500,000.00 | INV-2026-001          │   │
│  │ 2026-03-20 | ¥300,000.00 | INV-2026-002          │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Drill-down State Machine

```
DASHBOARD (project-summary)
  │ click project
  ▼
ORDER_WORKBENCH (batch-summary?project_id=X)
  │ click order row
  ├──▶ ORDER_DETAIL_DRAWER (order info + all KPIs + tabs)
  │ click KPI cell
  ├──▶ FLOW_DRAWER (income/cost/collection/payment)
  │ click "返回订单工作台"
  ▼
ORDER_WORKBENCH (back to same state)
  │ click breadcrumb "合同中心" or "经营分析"
  ▼
DASHBOARD
```

---

## 4. Drawer Types

### 4a. Flow Drawer (for single KPI drill-down)

```
State: { type: 'flow', flowType: 'income'|'cost'|'collection'|'payment', orderId }
```

```
┌─ Drawer (720px) ────────────────────────────────────────┐
│  ← 返回订单工作台    | 设备采购 → 收入流水              │
├─────────────────────────────────────────────────────────┤
│  ┌─ Income Flow Table ──────────────────────────────┐   │
│  │  # | 开票日期 | 含税金额 | 不含税 | 发票号 | 备注  │   │
│  │  ─────────────────────────────────────────────   │   │
│  │  1 | 01-15   | ¥500K  | ¥450K  | INV-001 | 一期  │   │
│  │  2 | 03-20   | ¥300K  | ¥270K  | INV-002 | 二期  │   │
│  │                                    ↓ click row     │   │
│  └────────────────────────────────────────────────────┘   │
│                           ↓                                │
│  ┌─ Flow Detail Panel (inline expand) ───────────────┐   │
│  │  ID: 1 | Tax Rate: 9% | Status: 正常              │   │
│  │  Created: 2026-01-15 | Updated: 2026-01-20       │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 4b. Order Detail Drawer (for order row click)

```
State: { type: 'orderDetail', orderId }
```

```
┌─ Drawer (960px) ────────────────────────────────────────┐
│  ← 返回订单工作台 | 设备采购 (CG-2026-001)              │
├─ Tabs: [经营摘要] [收入流水] [成本流水] [回款] [付款] ───┤
│                                                          │
│ Tab: 经营摘要                                             │
│ ┌─ Order Info ───────────────────────────────────────┐   │
│ │ 订单金额: ¥1,000,000.00 | 不含税: ¥900,000.00       │   │
│ │ 甲方: 崇左移动   | 类型: 工程施工                    │   │
│ │ 日期: 2026-01-10 | 来源: 框架合同                   │   │
│ │ 供应商: 广西建工  | 负责人: 张三                     │   │
│ └────────────────────────────────────────────────────┘   │
│ ┌─ KPI Cards ─────────────────────────────────────────┐   │
│ │ 收入 ¥800K | 回款 ¥500K | 成本 ¥300K | 付款 ¥100K   │   │
│ │ 利润 ¥500K | 收入Gap ¥200K | 成本Gap ¥200K          │   │
│ └────────────────────────────────────────────────────┘   │
│ ┌─ Status & Next Action ─────────────────────────────┐   │
│ │ 状态: 部分回款  | 下一步: 继续收款 (P1)             │   │
│ └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Navigation Consistency

| Action | Behavior |
|--------|----------|
| Click breadcrumb | Navigate to parent page (preserve Analyzer state) |
| Click Dashboard tab | Switch tab (no navigation) |
| Open Drawer | Preserve page scroll position |
| Close Drawer | Return to same scroll position |
| Change Analyzer period | Reload current page with new period |

---

## 6. URL State

All drill-down states are URL-driven (not React state alone):

```
?period=2026-06&dimension=project&object=P001&drawer=flow&drawerType=income&orderId=5
```

This enables:
- Browser back/forward navigation
- Bookmarkable states
- Refresh-resistant

---

## 7. Error States

| Scenario | Behavior |
|----------|----------|
| API timeout | Drawer shows "加载失败" with retry button |
| Empty flow (no income) | Drawer shows "暂无记录" with empty state illustration |
| Order deleted while viewing | Drawer closes, toast "订单已删除" |
| Network error | Inline retry, not full page reload |
