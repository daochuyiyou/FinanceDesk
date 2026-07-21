# Order Summary Model — 订单经营汇总模型

> **BDD-05D 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **不得落库。单一经营计算来源。**

---

## 一、定位

Order Summary 是所有订单级经营指标的**唯一计算入口**。

| 属性 | 值 |
|:----:|-----|
| 落库 | ❌ 不建表、不落库 |
| 计算位置 | API 层实时计算 |
| 引用方 | **Order Detail** / **Dashboard** / **ERP Integration** / **AI Analysis** |

---

## 二、计算指标定义

| 指标 | 公式 | 来源 |
|:----:|------|:----:|
| **Order Amount** | `Order.amount` | 订单表 |
| **Revenue** | `SUM(IncomeFlow.taxable_amount)` | Revenue Summary |
| **Cost** | `SUM(CostFlow.taxable_amount)` | Cost Summary |
| **Profit** | Revenue - Cost | 计算 |
| **Profit Rate** | Profit / Order Amount | 计算 |
| **Collection** | `SUM(Collection.amount)` | Revenue Summary |
| **Payment** | `SUM(Payment.amount)` | Cost Summary |
| **Gap** | Revenue - Collection | 计算 |
| **Order Health** | 健康度推导 | 系统自动（正常/风险/异常） |
| **Settlement Status** | 结算状态推导 | 系统自动（5 种） |

---

## 三、统一计算逻辑

```python
def get_order_summary(order_id: int) -> dict:
    order = get Order
    revenue = get_revenue_summary(order_id)
    cost = get_cost_summary(order_id)

    profit = revenue["total_invoice_amount"] - cost["total_cost_amount"]

    # Health derivation
    if revenue.get("remaining_collection_amount", 0) > 0 and cost.get("unpaid_amount", 0) > 0:
        health = "风险"
    elif ...:
        health = "正常"
    else:
        health = "异常"

    return {
        "order_amount": float(order.amount),
        "revenue": revenue["total_invoice_amount"],
        "cost": cost["total_cost_amount"],
        "profit": max(profit, 0),
        "profit_rate": profit / float(order.amount) if float(order.amount) > 0 else 0,
        "collection": revenue["total_collection_amount"],
        "payment": cost["total_payment_amount"],
        "gap": revenue["remaining_collection_amount"],
        "order_health": health,
        "settlement_status": derive_settlement_status(order_id),
    }
```

---

## 四、引用关系

```
Revenue Summary ──┐
                  ├──→ Order Summary ──→ Dashboard
Cost Summary ─────┘     │
                        ├──→ Order Detail
                        ├──→ ERP Integration
                        └──→ AI Analysis
```

**禁止任何页面自行计算。全部通过 Order Summary 获取。**

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
