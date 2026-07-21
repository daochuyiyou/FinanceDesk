# Order Health — 订单健康度

> **BDD-02B F3.5 P2 输出 · 业务冻结**
> 更新时间：2026-07-05
> **仅允许系统自动推导，禁止人工维护。暂不落库。**

---

## 一、定义

Order Health（订单健康度）是系统根据订单的收入/成本/回款/付款/Gap 数据自动判断的经营健康状态。

不是工程进度状态。不是风险评级。

## 二、状态定义

| 状态 | 含义 | 推导条件 |
|:----:|------|---------|
| **正常** | 收支节奏正常，无异常 | 0 < 回款 ≤ 收入 且 0 < 付款 ≤ 成本 且 Gap 为正 |
| **风险** | 存在较高应收/应付余额，但仍在可控范围 | Gap > 30 天 或 回款率 < 50% |
| **异常** | 数据明显不合理，需人工介入 | 回款 > 收入 或 付款 > 成本 或 ERP 差异 > 阈值 |

## 三、推导规则

```python
def derive_order_health(order_id: int) -> str:
    summary = get_order_summary(order_id)
    income = summary["income_total"]
    cost = summary["cost_total"]
    collection = summary["collection_total"]
    payment = summary["payment_total"]

    # 异常：数据异常
    if collection > income or payment > cost:
        return "异常"

    # 风险：长时间未回款/未付款
    if income > 0:
        collection_rate = collection / income
    else:
        collection_rate = 1.0
    if cost > 0:
        payment_rate = payment / cost
    else:
        payment_rate = 1.0

    if collection_rate < 0.5 or payment_rate < 0.5:
        return "风险"

    # 正常
    return "正常"
```

## 四、展示规则

| 规则 | 说明 |
|------|------|
| 展示位置 | 订单详情页 → 经营摘要区 |
| 颜色 | 🟢 正常 / 🟡 风险 / 🔴 异常 |
| 暂不落库 | 不新增数据库字段 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始冻结 |
