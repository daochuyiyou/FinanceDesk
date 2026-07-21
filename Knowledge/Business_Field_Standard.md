# Business Field Standard — FinanceDesk 字段标准

> **BDD-00.8 P3 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-04
> 本文件定义 FinanceDesk 所有字段的命名规范。所有模块必须统一遵守。
> 禁止同义字段重复。禁止不同模块对同一概念使用不同命名。

---

## 一、标准前缀规则

所有外键字段使用 `_id` 后缀，明确表达"关联关系"：

| 标准字段名 | 含义 | 禁止使用的别名 |
|-----------|------|---------------|
| `project_id` | 关联合同 | ❌ `projectId`, `contract_id` |
| `order_id` | 关联订单 | ❌ `orderId`, `orderNo` |
| `supplier_id` | 关联成本供应商合同 | ❌ `supplierId`, `vendor_id` |
| `flow_id` | 关联收入流水（Collection） | ❌ `income_flow_id` |
| `cost_id` | 关联成本流水（Payment） | ❌ `cost_flow_id` |
| `matched_income_id` | 匹配到的收入 ID（ERP 暂存） | ❌ `matched_id` |

---

## 二、通用字段标准

### 2.1 ID

| 标准 | 说明 |
|------|------|
| 字段名 | `id` |
| 类型 | Integer, PK, autoincrement |
| 说明 | 所有表的主键统一命名为 `id` |
| 禁止 | ❌ `projectId`, `order_id` 作为主键 |

### 2.2 编号

| 标准 | 说明 |
|------|------|
| 字段名 | `{object}_no` |
| 示例 | `order_no`, `contract_no`, `erp_no` |
| 禁止 | ❌ `order_code`, `orderId`, `order_number`, `code` |

### 2.3 名称

| 标准 | 说明 |
|------|------|
| 字段名 | `{object}_name` 或 `name` |
| 示例 | `order_name`, `framework_name`, `name` |
| 禁止 | ❌ `title`, `label`, `desc`（描述用 `remark`） |

### 2.4 金额

| 标准 | 说明 |
|------|------|
| 字段名 | `amount` 或 `{type}_amount` |
| 类型 | `Numeric(15,2)` |
| 示例 | `amount`, `taxable_amount`, `non_taxable_amount`, `adjustment_amount` |
| 禁止 | ❌ `total`, `sum`, `price`, `money`, `value` |

**金额精度标准**：

| 场景 | 精度 | 示例 |
|------|:----:|------|
| 订单金额 | 15,2 | `Numeric(15,2)` |
| 预算金额 | 15,2 | `Numeric(15,2)` |
| 单价 | 10,2 | `Numeric(10,2)` |
| 税率 | 5,2 | `Numeric(5,2)` |

### 2.5 日期

| 标准 | 说明 |
|------|------|
| 字段名 | `{type}_date` |
| 类型 | `Date` 或 `DateTime` |
| 示例 | `order_date`, `sign_date`, `invoice_date`, `collection_date` |
| 禁止 | ❌ `date`, `time`, `create_time`, `update_time` |

**系统时间字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `created_at` | DateTime | 创建时间（UTC） |
| `updated_at` | DateTime | 更新时间（UTC，自动更新） |

### 2.6 状态

| 标准 | 说明 |
|------|------|
| 字段名 | `status` |
| 类型 | `String(50)` |
| 示例 | `status` = "待执行/执行中/已完成/已作废" |
| 禁止 | ❌ `state`, `flag`, `stage`, `phase` |

**状态必须字典化**：通过 SysDictionary 管理，不可硬编码。

### 2.7 备注

| 标准 | 说明 |
|------|------|
| 字段名 | `remark` |
| 类型 | Text |
| 禁止 | ❌ `notes`, `comment`, `description`, `memo` |

### 2.8 年度

| 标准 | 说明 |
|------|------|
| 字段名 | `year` |
| 类型 | Integer |
| 示例 | `year` = 2026 |
| 禁止 | ❌ `fiscal_year`, `period`, `session` |

### 2.9 逻辑删除

| 标准 | 说明 |
|------|------|
| 字段名 | `is_deleted` |
| 类型 | Boolean, default=False |
| 查询 | 全部查询必须加 `is_deleted == False` |
| 禁止 | ❌ `deleted`, `is_removed`, `status = 'deleted'` |

---

## 三、外键命名规范

### 3.1 格式

```
[引用表名]_id
```

### 3.2 现有外键命名

| 字段 | 关联表 | 符合标准 |
|------|--------|:--------:|
| `project_id` | project | ✅ |
| `order_id` | order | ✅ |
| `supplier_id` | supplier | ✅ |
| `flow_id` | income_flow | ✅ |
| `cost_id` | cost_flow | ✅ |
| `vendor_id` | vendor | ⚠️ 已弃用（Vendor 已合并入 Supplier） |

### 3.3 禁止的命名模式

| ❌ 禁止 | 正确写法 | 原因 |
|---------|---------|------|
| `orderId` | `order_id` | Python 惯例使用下划线 |
| `projectId` | `project_id` | Python 惯例使用下划线 |
| `supplierId` | `supplier_id` | Python 惯例使用下划线 |
| `orderNo` | `order_no` | Python 惯例使用下划线 |
| `order_code` | `order_no` | 统一用 `_no` 后缀表示编号 |

---

## 四、布尔字段命名

| 标准 | 说明 |
|------|------|
| 前缀 | `is_`, `has_`, `matched` |
| 示例 | `is_deleted`, `matched` |
| 禁止 | ❌ `delete_flag`, `deleted`, `isMatch` |

---

## 五、字典引用

所有可枚举字段均引用 SysDictionary，格式：

| 字典分类 | 字段 | 枚举值示例 |
|---------|------|-----------|
| `project_type` | Project.project_type | 工程施工 / 维护服务 / 设备采购 |
| `order_type` | Order.order_type | 工程施工 / 维护服务 / 设备采购 / 其他 |
| `order_status` | Order.status | 待执行 / 执行中 / 已完成 / 已作废 |
| `income_status` | IncomeFlow.status | 待回款 / 部分回款 / 已回款 |
| `cost_status` | CostFlow.status | 待支付 / 部分支付 / 已支付 |
| `cost_type` | CostFlow.cost_type | 施工费 / 材料费 / 管理费 / 其他 |
| `cost_subject` | CostFlow.cost_subject | 人工费 / 材料费 / 机械费 / 管理费 |
| `contract_type` | — | 单项合同 / 框架合同 |
| `budget_type` | ProjectBudget.budget_type | 初始预算 / 调整预算 |
| `adjustment_reason` | BudgetAdjustment.adjustment_reason | 设计变更 / 工程量增加 / 其他 |

---

## 六、字段标准速查表

| 概念 | 标准字段名 | 类型 | 示例值 |
|------|-----------|------|--------|
| 主键 | `id` | Integer | 1 |
| 编号 | `{obj}_no` | String(100) | "ORDER-2026-001" |
| 合同编号 | `contract_no` | String(100) | "CT-2026-001"（新增必填） |
| 业主单位 | `owner_name` | String(200) | "中国移动崇左分公司" |
| 甲方项目名称 | `owner_project_name` | String(200) | "XX 项目（甲方）" |
| 名称 | `name` / `{obj}_name` | String(200) | "XX 项目框架合同" |
| 金额 | `amount` / `{type}_amount` | Numeric(15,2) | 1000000.00 |
| 单价 | `{type}_price` / `{type}_unit_price` | Numeric(10,2) | 350.00 |
| 税率 | `tax_rate` | Numeric(5,2) | 9.00 |
| 日期 | `{type}_date` | Date | 2026-01-15 |
| 状态 | `status` | String(50) | "待执行" |
| 备注 | `remark` | Text | "补充说明" |
| 年度 | `year` | Integer | 2026 |
| 外键 | `{table}_id` | String(36)/Integer | 42 |
| 创建时间 | `created_at` | DateTime | 2026-07-04T12:00:00Z |
| 更新时间 | `updated_at` | DateTime | 2026-07-04T12:00:00Z |
| 逻辑删除 | `is_deleted` | Boolean | false |
| 来源类型 | `source_type` | String(50) | "manual" / "erp" / "system" |
| 匹配标记 | `matched` | Boolean | true |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-04 | 初始编制，统一字段命名规范 |
