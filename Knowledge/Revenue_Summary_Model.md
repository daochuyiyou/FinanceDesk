# Revenue Summary Model — 收入汇总计算模型

> **BDD-04A.1 P1 输出 · 业务冻结**
> 更新时间：2026-07-05
> **Revenue Summary 不建表、不落库。统一计算对象，Dashboard、Order Detail、ERP Integration 全部引用同一计算逻辑。**

---

## 一、定位

Revenue Summary 是**计算对象**，不是数据库表。

| 属性 | 值 |
|------|-----|
| 落库 | ❌ 不建表、不落库 |
| 计算位置 | API 层实时计算（或 Dashboard 缓存） |
| 引用方 | Dashboard、Order Detail、ERP Integration |
| 计算基础 | IncomeFlow + Collection + Order |

---

## 二、计算指标定义

| 指标 | 公式 | 说明 |
|:----:|------|------|
| **Order Amount** | `Order.amount` | 订单含税金额 |
| **Total Invoice Amount** | `SUM(IncomeFlow.taxable_amount)` | 已开票金额合计 |
| **Remaining Invoice Amount** | `Order.amount - SUM(IncomeFlow.taxable_amount)` | 剩余可开票金额（负数表示超开） |
| **Total Collection Amount** | `SUM(Collection.amount)` | 已回款金额合计 |
| **Remaining Collection Amount** | `SUM(IncomeFlow.taxable_amount) - SUM(Collection.amount)` | 应收余额（Gap） |
| **Invoice Rate** | `SUM(IncomeFlow.taxable_amount) / Order.amount` | 开票率（0~1） |
| **Collection Rate** | `SUM(Collection.amount) / SUM(IncomeFlow.taxable_amount)` | 回款率（0~1） |

---

## 三、统一计算逻辑

```python
# 所有模块引用此同一逻辑

def get_revenue_summary(order_id: int) -> dict:
    order = get Order by order_id
    incomes = get IncomeFlow list where order_id
    collections = sum Collection.amount via incomes

    order_amount = float(order.amount or 0)
    total_invoiced = sum(i.taxable_amount for i in incomes) or 0
    total_collected = collections or 0

    return {
        "order_amount": order_amount,
        "total_invoice_amount": total_invoiced,
        "remaining_invoice_amount": order_amount - total_invoiced,
        "total_collection_amount": total_collected,
        "remaining_collection_amount": total_invoiced - total_collected,
        "invoice_rate": total_invoiced / order_amount if order_amount > 0 else 0,
        "collection_rate": total_collected / total_invoiced if total_invoiced > 0 else 0,
    }
```

---

## 四、引用规则

| 模块 | 引用方式 | 说明 |
|:----:|:--------:|------|
| Dashboard | 调用 `/api/v1/orders/{id}/summary` | 当前已实现 |
| Order Detail | 调用同一端点 | 经营摘要复用 |
| ERP Integration | 调用同一端点 | 与 ERP 数据对比 |

**禁止任何模块自行实现重复计算逻辑。**

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
