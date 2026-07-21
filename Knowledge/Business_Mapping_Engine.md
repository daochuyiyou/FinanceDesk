# Business Mapping Engine — 业务映射引擎

> **BDD-06.5 P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **Mapping Engine 只负责解释业务映射规则，不直接计算经营指标。**

---

## 一、定位

Business Mapping Engine 是 ERP 数据在完成匹配后、写入业务表之前，将匹配结果**转换为标准业务事件**的中间层。

| 属性 | 值 |
|:----:|-----|
| 角色 | 规则解释器（Interpreter），非计算器（Calculator） |
| 输入 | ERPStagingFlow（已匹配） |
| 输出 | Business Event（标准业务事件） |
| 规则来源 | `Business_Mapping_Rules.md`（配置化规则库） |
| 解释方式 | 按 Direction + VoucherType 查找规则 → 生成事件 |
| 禁止 | ❌ 硬编码规则 / ❌ 计算经营指标 / ❌ 直接写业务表 |

---

## 二、完整处理链路

```
ERP Fact（erp_staging_flow）
    │
    ▼
Matching Engine（BDD-06D）
    │
    ▼
ERPStagingFlow（已匹配，含 matched_order_id）
    │
    ▼ ══════════════════════════════════════════
        Business Mapping Engine（本文档）
    ▼ ══════════════════════════════════════════
    │
    ├── 1. 查找 Mapping Rule（按 Direction + VoucherType）
    ├── 2. 生成 Business Event（标准事件）
    ├── 3. 事件驱动 Business Action
    │       ├── Create（创建业务对象）
    │       ├── Update（更新业务对象）
    │       ├── Reverse（冲红/冲正）
    │       └── Rollback（回滚已导入事件）
    │
    ▼
Business Object（IncomeFlow / CostFlow / Collection / Payment）
    │
    ▼
Summary Update（Revenue / Cost / Order Summary）
    │
    ▼
Import Log
```

### 各层职责

| 层 | 职责 | 组件 |
|:--:|------|------|
| **ERP Fact** | 保存原始数据 | erp_staging_flow |
| **Matching Engine** | 匹配 ERP 数据到业务主体 | BDD-06D |
| **Mapping Engine** | 解释规则，生成业务事件 | **本文档** |
| **Import Engine** | 事务性执行业务写入 | BDD-06F |
| **Summary** | 计算经营指标 | Order Summary Model |

---

## 三、规则引擎架构

### 规则存储

规则以 **配置化规则表**的形式存储，支持水平扩展：

| 字段 | 说明 | 示例 |
|:----:|------|------|
| `direction` | 借贷方向 | `贷方` / `借方` |
| `voucher_type` | 凭证类型 | `invoice` / `receipt` / `payment` / `cost` |
| `keyword` | 摘要关键词匹配（可选） | `开票` / `收款` / `支付` |
| `business_object` | 目标业务对象 | `IncomeFlow` / `CostFlow` / `Collection` / `Payment` |
| `business_action` | 业务动作 | `create` / `update` / `reverse` |
| `summary_action` | 汇总动作 | `recalc` / `skip` |
| `field_mapping` | 字段映射规则 | JSON 字段映射表 |

### 规则解析流程

```python
def interpret(flow: ERPStagingFlow, rules: list[MappingRule]) -> BusinessEvent:
    """解释规则，生成业务事件。"""
    # 步骤1: 按 direction 初筛
    candidates = [r for r in rules if r.direction == infer_direction(flow)]
    
    # 步骤2: 按 voucher_type 精筛
    if flow.record_type == "collection":
        candidates = [r for r in candidates if r.voucher_type == "receipt"]
    elif flow.amount_in > 0:
        candidates = [r for r in candidates if r.voucher_type in ("invoice", "receipt")]
    
    # 步骤3: 按 keyword 匹配（可选）
    for rule in candidates:
        if rule.keyword and rule.keyword not in (flow.summary or ""):
            continue
        return BusinessEvent(
            business_object=rule.business_object,
            business_action=rule.business_action,
            summary_action=rule.summary_action,
            field_values=apply_mapping(rule.field_mapping, flow),
        )
    
    # 步骤4: 无匹配 → 回退到默认规则
    return BusinessEvent(
        business_object="UNMATCHED",
        business_action="skip",
        summary_action="skip",
        field_values={},
    )
```

---

## 四、Business Event 模型

| 字段 | 类型 | 说明 |
|:----:|:----:|------|
| `business_object` | String | 目标业务对象类型 |
| `business_action` | String | 业务动作: `create` / `update` / `reverse` / `rollback` |
| `summary_action` | String | 汇总动作: `recalc` / `skip` |
| `field_values` | Dict | 映射后的字段值（键值对） |
| `source_flow_id` | Integer | 源暂存记录 ID |
| `batch_no` | String | 归属导入批次 |
| `matched_order_id` | Integer | 关联订单 ID |
| `event_time` | DateTime | 事件生成时间 |

---

## 五、引擎约束

| 规则 | 说明 |
|:----:|------|
| **不计算经营指标** | 引擎不计算利润、Gap、回款率等 |
| **不修改 ERP Fact** | 不对源数据进行任何修改 |
| **不直接写业务表** | 生成事件后交由 Import Engine 写入 |
| **规则配置化** | 所有规则来自配置表，不硬编码 |
| **可扩展** | 新增 voucher_type 不需改引擎代码 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
