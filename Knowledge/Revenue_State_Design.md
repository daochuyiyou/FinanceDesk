# Revenue State Design — 收入状态推导设计

> **BDD-04A P3 输出 · 业务冻结**
> 更新时间：2026-07-05
> **不设计数据库状态。设计系统推导规则。全部采用计算，不得落库。**

---

## 一、推导原则

| 原则 | 说明 |
|:----:|------|
| **不落库** | income_flow 表不新增 status 字段 |
| **纯计算** | 状态由系统根据关联数据实时计算 |
| **单向推导** | 状态为结果，不可反写回业务表 |

---

## 二、状态定义（全部计算，不落库）

| 状态 | 推导条件 |
|:----:|---------|
| **未开票** | IncomeFlow 记录存在，`taxable_amount = 0` 或刚创建 |
| **已开票（待回款）** | IncomeFlow.taxable_amount > 0 且 SUM(Collection.amount) = 0 |
| **部分回款** | 0 < SUM(Collection.amount) < IncomeFlow.taxable_amount |
| **部分开票** | （订单维度）订单下有多笔 IncomeFlow，合计 > 单笔金额 |
| **已回款** | SUM(Collection.amount) ≥ IncomeFlow.taxable_amount |

---

## 三、推导引擎（预留，Dashboard 使用）

```python
def derive_income_status(income_id: int) -> str:
    income = get IncomeFlow by id
    collection_total = sum Collection.amount where flow_id = income_id

    if income.taxable_amount == 0:
        return "未开票"
    if collection_total == 0:
        return "已开票（待回款）"
    if collection_total < income.taxable_amount:
        return "部分回款"
    return "已回款"

def derive_order_income_status(order_id: int) -> str:
    incomes = get IncomeFlow list where order_id
    total_invoiced = sum income.taxable_amount
    total_collected = sum Collection.amount via incomes

    if total_invoiced == 0:
        return "未开票"
    if total_collected == 0:
        return "已开票（待回款）"
    if total_collected < total_invoiced:
        return "部分回款"
    return "已回款"
```

---

## 四、展示规则

| 状态 | UI 颜色 | 示例展示 |
|:----:|:-------:|---------|
| 未开票 | 🟢 灰色 | 未开票 |
| 已开票（待回款） | 🔵 蓝色 | 已开票 |
| 部分回款 | 🟡 橙色 | 部分回款（¥50k/¥100k） |
| 已回款 | 🟢 绿色 | 已回款 ✅ |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
