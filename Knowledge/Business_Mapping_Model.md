# Business Mapping Engine — ERP → 业务对象映射规则

> **BDD-06B 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **禁止直接写入业务对象。必须经过 Mapping Engine。**

---

## 一、定位

Mapping Engine 是 ERP Fact 到 Business Object 的**转换中间层**。

| 属性 | 值 |
|:----:|-----|
| 输入 | ERP Fact 记录 |
| 输出 | Business Object（Order / Income / Cost / Collection / Payment） |
| 规则库 | 基于 `order_no` + `direction` 的精确匹配 |
| 只读 | ❌ 不修改 ERP Fact（仅标记 `match_status`） |
| 幂等 | 同一条 ERP Fact 重复入站结果相同 |

---

## 二、映射优先级

| 优先级 | 匹配方式 | 方向 | 目标业务对象 |
|:------:|---------|:----:|:-----------:|
| **P0** | `order_no` 精确匹配 + `direction` | 贷方 | IncomeFlow |
| **P1** | `order_no` 精确匹配 + `direction` | 借方 | CostFlow |
| **P2** | `order_no` 精确匹配 + `客商` | 贷方 | Collection |
| **P3** | `order_no` 精确匹配 + `客商` | 借方 | Payment |

---

## 三、按 Direction 分流

| Direction | 业务含义 | 目标表 |
|:---------:|---------|:------:|
| 贷方（Credit） | 收入相关（开票/回款） | IncomeFlow / Collection |
| 借方（Debit） | 成本相关（成本/付款） | CostFlow / Payment |

### 分流规则

```python
def route_fact(fact: ERPFact) -> str:
    if fact.direction == "贷方":
        if is_invoice(fact):      # 摘要包含"发票"/"开票"
            return "IncomeFlow"
        else:
            return "Collection"
    elif fact.direction == "借方":
        if is_cost_record(fact):  # 摘要包含"成本"/"支出"
            return "CostFlow"
        else:
            return "Payment"
    else:
        return "UNMATCHED"
```

---

## 四、匹配规则链

```python
def match_fact(fact: ERPFact, db: Session) -> MappingResult:
    # Step 1: 按 order_no 精确匹配
    order = db.query(Order).filter(Order.order_no == fact.voucher_no).first()
    if order:
        return MappingResult(
            match_status="已匹配",
            match_order_id=order.id,
            match_result=f"order_no 精确匹配: {fact.voucher_no}"
        )

    # Step 2: 按 ERP 项目编号模糊匹配
    if fact.erp_project_no:
        project = db.query(Project).filter(Project.erp_no == fact.erp_project_no).first()
        if project and project.orders:
            return MappingResult(
                match_status="已匹配",
                match_order_id=project.orders[0].id,
                match_result=f"erp_project_no 模糊匹配: {fact.erp_project_no}"
            )

    # Step 3: 未匹配
    return MappingResult(
        match_status="未匹配",
        match_result="未找到匹配的订单或合同"
    )
```

---

## 五、匹配状态

| 状态 | 含义 | 后续动作 |
|:----:|------|---------|
| **未匹配** | ERP 数据无法匹配到任何业务对象 | 人工核对修正 |
| **已匹配** | 已成功匹配到业务对象 | 自动进入经营流程 |
| **差异** | 匹配但金额不一致 | Dashboard 展示差异 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
