# Business Rule Catalog — 统一业务规则目录

> **BDD-06.8 P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **所有业务规则集中管理，禁止散落在各模块 CRUD 代码中。新增规则只需加行，不需改代码。**

---

## 一、Rule Catalog 结构

### 规则定义

| 字段 | 类型 | 必填 | 说明 |
|:----:|:----:|:----:|------|
| `rule_id` | String | ✅ | 规则唯一标识，如 `RULE-001` |
| `rule_name` | String | ✅ | 规则名，如 `收入创建` |
| `trigger_event` | String | ✅ | 触发事件类型 |
| `condition` | JSON | ❌ | 业务条件表达式（空则总是执行） |
| `actions` | JSON | ✅ | 需要执行的动作列表 |
| `summary_action` | String | ✅ | `recalc` / `skip` |
| `dashboard_refresh` | Boolean | ✅ | 是否触发 Dashboard 刷新 |
| `ai_trigger` | Boolean | ✅ | 是否通知 AI Agent |
| `priority` | Integer | ✅ | 执行优先级 |
| `is_active` | Boolean | ✅ | 是否启用 |
| `description` | String | ❌ | 规则说明 |

---

## 二、标准规则清单

### RULE-001：收入创建

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-001` |
| rule_name | `收入创建` |
| trigger_event | `IncomeFlow.create` |
| condition | `amount > 0` |
| actions | `["create_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `false` |
| priority | 10 |

**条件**：`field("taxable_amount") > 0`

**Actions**：
1. Import Engine 创建 IncomeFlow 记录
2. Summary Engine 重新计算该订单的 Revenue Summary
3. Dashboard 标记需刷新

### RULE-002：收入更新

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-002` |
| rule_name | `收入更新` |
| trigger_event | `IncomeFlow.update` |
| condition | `amount_changed == true` |
| actions | `["update_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `true` |
| priority | 10 |

### RULE-003：收入冲红

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-003` |
| rule_name | `收入冲红` |
| trigger_event | `IncomeFlow.reverse` |
| condition | `amount < 0` |
| actions | `["create_reversal", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `true` |
| priority | 5 |

### RULE-004：成本创建

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-004` |
| rule_name | `成本创建` |
| trigger_event | `CostFlow.create` |
| condition | `amount > 0` |
| actions | `["create_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `false` |
| priority | 10 |

### RULE-005：成本更新

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-005` |
| rule_name | `成本更新` |
| trigger_event | `CostFlow.update` |
| condition | `amount_changed == true` |
| actions | `["update_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `true` |
| priority | 10 |

### RULE-006：收款创建

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-006` |
| rule_name | `收款创建` |
| trigger_event | `Collection.create` |
| condition | `amount > 0` |
| actions | `["create_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `false` |
| priority | 10 |

### RULE-007：付款创建

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-007` |
| rule_name | `付款创建` |
| trigger_event | `Payment.create` |
| condition | `amount > 0` |
| actions | `["create_business_object", "recalc_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `false` |
| priority | 10 |

### RULE-008：订单创建

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-008` |
| rule_name | `订单创建` |
| trigger_event | `Order.create` |
| condition | 空 |
| actions | `["create_business_object", "init_order_summary"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `false` |
| priority | 10 |

### RULE-009：订单关闭

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-009` |
| rule_name | `订单关闭` |
| trigger_event | `Order.close` |
| condition | `所有关联流水已结清` |
| actions | `["update_order_status", "recalc_order_summary", "notify_completion"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `true` |
| priority | 5 |

### RULE-010：Batch 回滚

| 字段 | 值 |
|:----:|-----|
| rule_id | `RULE-010` |
| rule_name | `Batch 回滚` |
| trigger_event | `Batch.rollback` |
| condition | `batch.status == "completed"` |
| actions | `["logical_delete_all", "recalc_order_summary", "log_rollback"]` |
| summary_action | `recalc` |
| dashboard_refresh | `true` |
| ai_trigger | `true` |
| priority | 1 |

---

## 三、事件 → 规则映射表

| 事件类型 | 匹配规则 | Mirror |
|:---------:|:--------:|:------:|
| `IncomeFlow.create` | RULE-001 | ↔ RULE-004 (Cost.create) |
| `IncomeFlow.update` | RULE-002 | ↔ RULE-005 (Cost.update) |
| `IncomeFlow.reverse` | RULE-003 | ↔ (无，成本单边) |
| `CostFlow.create` | RULE-004 | ↔ RULE-001 (Income.create) |
| `CostFlow.update` | RULE-005 | ↔ RULE-002 (Income.update) |
| `Collection.create` | RULE-006 | ↔ RULE-007 (Payment.create) |
| `Payment.create` | RULE-007 | ↔ RULE-006 (Collection.create) |
| `Order.create` | RULE-008 | — |
| `Order.close` | RULE-009 | — |
| `Batch.rollback` | RULE-010 | — |

---

## 四、规则扩展

### 新增规则

```
1. 在 Rule Catalog 添加一行（rule_id + trigger_event + actions）
2. ✅ 完成 — 无需修改 Rule Engine 代码
```

### 新增事件类型

```
1. 在 Business Event Model 中注册新 Event Type
2. 在 Rule Catalog 中添加对应规则
3. ✅ 完成 — Engine 自动适配
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制，10 条标准规则 |
