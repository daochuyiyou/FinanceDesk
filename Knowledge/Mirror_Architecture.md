# Mirror Architecture — 收入与成本镜像架构

> **BDD-05A P4 输出 · 永久架构约束**
> 更新时间：2026-07-05
> **Revenue 和 Cost 必须保持镜像设计。不得出现两套不同的业务逻辑。**

---

## 一、架构镜像总图

```
收入链                          成本链
─────────                      ────────
Revenue (IncomeFlow)           Cost (CostFlow)
    │                               │
    ▼                               ▼
Collection                      Payment
    │                               │
    ▼                               ▼
Revenue Summary                 Cost Summary
    │                               │
    ▼                               ▼
Dashboard                       Dashboard
```

---

## 二、字段镜像对照表

### 核心字段（必须一致）

| Revenue 字段 | Cost 字段 | 镜像规则 |
|:-----------:|:---------:|:--------:|
| `id` | `id` | 主键 |
| `order_id` | `order_id` | 归属订单 FK ✅ |
| `taxable_amount` | `taxable_amount` | 金额含税 ✅ |
| `non_taxable_amount` | `non_taxable_amount` | 金额不含税 ✅ |
| `tax_rate` | `tax_rate` | 税率 ✅ |
| `invoice_date` | — | 收入特有，成本无对应 |
| `invoice_no` | — | 发票号码，成本无对应 |
| — | `cost_party` | 成本方，收入无对应 |
| — | `cost_type` | 成本类型，收入无对应 |
| — | `cost_subject` | 成本科目，收入无对应 |

### 经营字段（必须一致）

| Revenue | Cost | 镜像规则 |
|:-------:|:----:|:--------:|
| `invoice_stage` | **`cost_stage`** | ✅ 对称命名 |
| `invoice_reason` | **`cost_reason`** | ✅ 对称命名 |
| `business_date` | **`business_date`** | ✅ 完全相同 |
| `expected_collection_date` | **`expected_payment_date`** | ✅ 对称命名 |
| `business_owner` | **`business_owner`** | ✅ 完全相同 |

### 关联关系（必须一致）

| Revenue 链 | Cost 链 | 镜像规则 |
|:---------:|:-------:|:--------:|
| IncomeFlow → Collection (1:N) | CostFlow → Payment (1:N) | ✅ 一致 |
| ERP 匹配：invoice_no | ERP 匹配：voucher_no | ✅ 一致 |
| Summary：Revenue_Summary_Model | Summary：Cost_Summary_Model | ✅ 一致 |

---

## 三、允许差异的字段

| Revenue 特有 | Cost 特有 | 原因 |
|:-----------:|:---------:|------|
| `customer_name` | `cost_party` | 业务语义不同 |
| `invoice_no` | — | 发票为收入特有 |
| — | `cost_type` | 成本分类为成本特有 |
| — | `cost_subject` | 成本科目为成本特有 |

---

## 四、架构约束（永久）

| 约束 | 说明 |
|:----:|------|
| Revenue 与 Cost 的 CRUD API 必须保持相同的 URL 模式 |
| Revenue 与 Cost 的 Schema 结构必须保持一致的字段顺序 |
| Revenue 与 Cost 的 Summary 计算逻辑必须使用相同的模式 |
| Revenue 与 Cost 的 UI 布局必须保持一致的 Tab 结构 |
| 新增字段时，如果收入侧有对应字段，成本侧必须同步添加 |
| 任何一方修改业务逻辑时，另一方必须同步评估影响 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
