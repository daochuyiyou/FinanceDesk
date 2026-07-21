# Cost Summary Model — 成本汇总计算模型

> **BDD-05A P3 输出 · 业务冻结**
> 更新时间：2026-07-05
> **不建表、不落库。Dashboard 与 Order Detail 全部引用统一计算逻辑。**

---

## 一、定位

Cost Summary 是**计算对象**，不是数据库表。

| 属性 | 值 |
|:----:|-----|
| 落库 | ❌ 不建表、不落库 |
| 计算位置 | API 层实时计算 |
| 引用方 | Dashboard、Order Detail |

---

## 二、计算指标定义

| 指标 | 公式 | 说明 |
|:----:|------|------|
| **Total Cost Amount** | `SUM(CostFlow.taxable_amount)` | 累计成本金额 |
| **Total Payment Amount** | `SUM(Payment.amount)` | 累计付款金额 |
| **Unpaid Amount** | `SUM(CostFlow.taxable_amount) - SUM(Payment.amount)` | 未付款金额 |
| **Cost Rate** | `SUM(CostFlow.taxable_amount) / Order.amount` | 成本占比 |
| **Payment Rate** | `SUM(Payment.amount) / SUM(CostFlow.taxable_amount)` | 付款率 |
| **Remaining Budget** | `Budget.amount - SUM(CostFlow.taxable_amount)` | 剩余预算 |

---

## 三、统一计算逻辑

```python
def get_cost_summary(order_id: int) -> dict:
    costs = get CostFlow list where order_id
    payments = sum Payment.amount via costs

    total_cost = sum(c.taxable_amount for c in costs) or 0
    total_paid = payments or 0
    order_amount = get Order.amount

    return {
        "total_cost_amount": total_cost,
        "total_payment_amount": total_paid,
        "unpaid_amount": total_cost - total_paid,
        "cost_rate": total_cost / order_amount if order_amount > 0 else 0,
        "payment_rate": total_paid / total_cost if total_cost > 0 else 0,
        "remaining_budget": 0,  # 需关联 Budget 模块
    }
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
