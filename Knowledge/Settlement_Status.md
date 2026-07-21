# Settlement Status — 经营结算状态

> **BDD-02B F2 业务冻结**
> 更新时间：2026-07-05
> 本概念已冻结业务定义，暂不落库、暂不开发。

---

## 一、定义

Settlement Status（经营结算状态）是订单维度的经营分析状态。

**不是工程状态。** 不反映施工进度，只反映经营结算进度。

## 二、状态列表

| 状态 | 含义 | 自动推导条件 |
|:----:|------|-------------|
| **未开始** | 订单已创建，但无任何收入/成本流水 | 无流水记录 |
| **结算中** | 已有收入或成本流水，但未闭环 | 有流水，但收入≠回款 或 成本≠付款 |
| **待回款** | 已开票未回款 | 收入 > 0 且 回款 = 0 |
| **已结清** | 所有收支闭环 | 收入=回款 且 成本=付款 |
| **异常** | 收/支/回/付数据不匹配 | 回款 > 收入 或 付款 > 成本 或 ERP Gap 异常 |

## 三、规则

| 规则 | 说明 |
|------|------|
| 来源 | **系统自动推导**，禁止人工维护 |
| 落库 | 暂不落库（不新增数据库字段） |
| 展示 | 订单列表中预留展示位，当前显示"冻结中" |
| 启用 | 待 BDD-07（经营驾驶舱）开发时一并启用 |

## 四、推导引擎（预留）

```python
# 预留推导逻辑（BDD-07 实现）
def derive_settlement_status(order_id: int) -> str:
    income_total = sum IncomeFlow amount where order_id
    cost_total = sum CostFlow amount where order_id
    collection_total = sum Collection amount via IncomeFlow where order_id
    payment_total = sum Payment amount via CostFlow where order_id

    if income_total == 0 and cost_total == 0:
        return "未开始"
    if income_total == collection_total and cost_total == payment_total:
        return "已结清"
    if collection_total == 0 and income_total > 0:
        return "待回款"
    if collection_total > income_total or payment_total > cost_total:
        return "异常"
    return "结算中"
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始冻结 |
