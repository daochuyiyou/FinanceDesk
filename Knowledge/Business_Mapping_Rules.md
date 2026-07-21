# Business Mapping Rules — 业务映射规则库

> **BDD-06.5 P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **所有规则采用配置化设计，禁止硬编码。新 ERP 字段扩展只需新增规则行，不需改代码。**

---

## 一、配置化规则表

### 规则表结构

| 字段 | 类型 | 必填 | 说明 |
|:----:|:----:|:----:|------|
| `rule_id` | UUID | ✅ | 规则唯一标识 |
| `direction` | String | ✅ | 借贷方向：`贷方` / `借方` |
| `voucher_type` | String | ✅ | 凭证类型：`invoice` / `receipt` / `payment` / `cost` / `reverse_invoice` / `reverse_receipt` |
| `keyword` | String | ❌ | 摘要关键词（用于分区，空则全匹配） |
| `business_object` | String | ✅ | 目标业务对象类名 |
| `business_action` | String | ✅ | 业务动作：`create` / `update` / `reverse` |
| `summary_action` | String | ✅ | 汇总动作：`recalc` / `skip` |
| `priority` | Integer | ✅ | 规则优先级（数值越小优先级越高） |
| `field_mapping` | JSON | ✅ | 字段映射规则（见下） |
| `is_active` | Boolean | ✅ | 是否启用 |
| `description` | String | ❌ | 规则说明 |

### 规则存储

规则可存储在：
1. **数据库配置表**（推荐）：`mapping_rule` 表，支持运行时热加载
2. **JSON 配置文件**：`mapping_rules.json`，启动时加载

---

## 二、标准映射规则清单

### R001：贷方 → 收入（标准开票）

| 字段 | 值 |
|:----:|-----|
| direction | `贷方` |
| voucher_type | `invoice` |
| keyword | 空（所有贷方金额行） |
| business_object | `IncomeFlow` |
| business_action | `create` |
| summary_action | `recalc` |
| priority | 10 |

#### 字段映射

| 暂存字段 | 业务字段 | 转换 |
|:--------:|:--------:|:----:|
| `erp_record_id` | `invoice_no` | 直接映射 |
| `occur_date` | `invoice_date` | `str → date` |
| `amount_in` | `taxable_amount` | `Decimal` |
| `summary` | `remark` | 直接映射 |
| `matched_order_id` | `order_id` | FK 关联 |
| — | `non_taxable_amount` | 默认 `0.0` |
| — | `tax_rate` | 默认 `null` |
| — | `status` | 默认 `"待回款"` |

### R002：借方 → 成本（标准支出）

| 字段 | 值 |
|:----:|-----|
| direction | `借方` |
| voucher_type | `cost` |
| keyword | 空（所有借方金额行） |
| business_object | `CostFlow` |
| business_action | `create` |
| summary_action | `recalc` |
| priority | 10 |

#### 字段映射

| 暂存字段 | 业务字段 | 转换 |
|:--------:|:--------:|:----:|
| `erp_record_id` | `voucher_no` | 直接映射 |
| `occur_date` | `cost_date` | `str → date` |
| `amount_out` | `taxable_amount` | `Decimal` |
| `summary` | `remark` | 直接映射 |
| `matched_order_id` | `order_id` | FK 关联 |
| — | `non_taxable_amount` | 默认 `0.0` |
| — | `cost_type` | 默认 `null` |
| — | `status` | 默认 `"待支付"` |

### R003：贷方+收款 → 收款

| 字段 | 值 |
|:----:|-----|
| direction | `贷方` |
| voucher_type | `receipt` |
| keyword | 空 |
| business_object | `Collection` |
| business_action | `create` |
| summary_action | `recalc` |
| priority | 20 |

#### 字段映射

| 暂存字段 | 业务字段 | 转换 |
|:--------:|:--------:|:----:|
| `erp_record_id` | `receipt_no` | 直接映射 |
| `occur_date` | `collection_date` | `str → date` |
| `amount_in` | `amount` | `Decimal` |
| `matched_order_id` | `order_id` | FK 关联 |

### R004：借方+付款 → 付款

| 字段 | 值 |
|:----:|-----|
| direction | `借方` |
| voucher_type | `payment` |
| keyword | 空 |
| business_object | `Payment` |
| business_action | `create` |
| summary_action | `recalc` |
| priority | 20 |

#### 字段映射

| 暂存字段 | 业务字段 | 转换 |
|:--------:|:--------:|:----:|
| `erp_record_id` | `voucher_no` | 直接映射 |
| `occur_date` | `payment_date` | `str → date` |
| `amount_out` | `amount` | `Decimal` |
| `matched_order_id` | `order_id` | FK 关联 |

### R005：贷方+红冲 → 收入冲红

| 字段 | 值 |
|:----:|-----|
| direction | `贷方` |
| voucher_type | `reverse_invoice` |
| keyword | `红冲` / `冲红` / `负数` |
| business_object | `IncomeFlow` |
| business_action | `reverse` |
| summary_action | `recalc` |
| priority | 5 |

#### 字段映射

同 R001，但金额为负值。

### R006：借方+红冲 → 成本冲红

| 字段 | 值 |
|:----:|-----|
| direction | `借方` |
| voucher_type | `reverse_cost` |
| keyword | `红冲` / `冲红` / `负数` |
| business_object | `CostFlow` |
| business_action | `reverse` |
| summary_action | `recalc` |
| priority | 5 |

#### 字段映射

同 R002，但金额为负值。

---

## 三、规则优先级

| 优先级 | 匹配顺序 | 规则 |
|:------:|---------|:----:|
| 5 （最高） | 关键词精确匹配 | R005, R006（红冲规则） |
| 10 | Direction + VoucherType | R001, R002（标准规则） |
| 20 | Direction + Keyword | R003, R004（收款/付款规则） |
| 99 （最低） | 回退规则 | 标记 UNMATCHED |

---

## 四、字段映射语法

### 映射类型

| 类型 | 语法 | 说明 |
|:----:|:----:|------|
| `direct` | `"erp_record_id" → "invoice_no"` | 字段直接映射 |
| `default` | `"status" = "待回款"` | 固定默认值 |
| `convert` | `"occur_date" → date("invoice_date")` | 带类型转换 |
| `expression` | `amount_in → field("taxable_amount") * 1.13` | 表达式计算 |
| `condition` | `if(amount_in > 0, "贷方", "借方")` | 条件赋值 |

### JSON 映射格式

```json
{
  "field_mapping": [
    {"target": "invoice_no", "source": "erp_record_id", "type": "direct"},
    {"target": "invoice_date", "source": "occur_date", "type": "convert", "converter": "str_to_date"},
    {"target": "taxable_amount", "source": "amount_in", "type": "direct"},
    {"target": "remark", "source": "summary", "type": "direct"},
    {"target": "order_id", "source": "matched_order_id", "type": "direct"},
    {"target": "non_taxable_amount", "value": "0.0", "type": "default"},
    {"target": "status", "value": "待回款", "type": "default"}
  ]
}
```

---

## 五、扩展规则

### 新增 ERP 字段的步骤

```
1. 新增字段到 erp_staging_flow
2. 在 field_mapping JSON 中添加映射行
3. 重启引擎或热加载规则
4. ✅ 完成 — 无需修改代码
```

### 新增 voucher_type 的步骤

```
1. 在规则表中新增一行（direction + voucher_type + 映射）
2. 更新前端解析器（如需要识别新类型）
3. ✅ 完成 — 引擎自动适配新规则
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制，6 条标准规则 + 配置化框架 |
