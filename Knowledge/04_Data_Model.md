# FinanceDesk 数据模型

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 来源：合并自 `data-model-er.md`（根目录 + docs/ 两个副本）
> 交叉引用：[02_Business_Model](./02_Business_Model.md) · [03_Business_Architecture](./03_Business_Architecture.md) · [05_Data_Source](./05_Data_Source.md) · [06_ERP_Integration](./06_ERP_Integration.md)

---

## 1. 基础模型（HermesBaseModel）

所有 12 个 ORM 模型继承自 `app/database.py` 中的 `HermesBaseModel`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | Integer PK, autoincrement | 主键 |
| `is_deleted` | Boolean, default=False | 逻辑删除标记 |
| `created_at` | DateTime, default=utcnow | 创建时间 |
| `updated_at` | DateTime, default=utcnow, onupdate=utcnow | 更新时间 |

## 2. 12 个 ORM 模型

### 2.1 项目模块

**Project** — 项目（`project`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| framework_name | String(200) | NOT NULL | 框架合同名称 |
| sign_date | Date | NULL | 签订时间 |
| start_date | Date | NULL | 合同开始时间 |
| end_date | Date | NULL | 合同结束时间 |
| internal_or_external | String(20) | NOT NULL, default=集团内 | 集团内外 |
| project_type | String(100) | NOT NULL, default=其他 | 项目类型 |
| **关系** | | | budgets → ProjectBudget, budget_adjustments → BudgetAdjustment |

**ProjectBudget** — 项目预算（`project_budget`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| project_id | String(36) | FK → project.id, NOT NULL | 项目 ID |
| budget_type | String(100) | NOT NULL, default=初始预算 | 预算类型 |
| labor_budget | Numeric(15,2) | NOT NULL, default=0 | 人工费预算 |
| material_budget | Numeric(15,2) | NOT NULL, default=0 | 材料费预算 |
| management_budget | Numeric(15,2) | NOT NULL, default=0 | 管理费预算 |
| gross_margin_rate | Numeric(5,2) | NULL | 毛利率 |
| preparation_date | Date | NULL | 编制日期 |
| preparer | String(100) | NULL | 编制人 |

**BudgetAdjustment** — 预算调整（`budget_adjustment`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| project_id | String(36) | FK → project.id, NOT NULL | 项目 ID |
| adjustment_date | Date | NULL | 调整日期 |
| adjustment_reason | String(500) | NULL | 调整原因 |
| adjustment_amount | Numeric(15,2) | NOT NULL, default=0 | 调整金额(正=调增，负=调减) |
| remark | Text | NULL | 备注 |

### 2.2 供应商模块

**Vendor** — 供应商主体（`vendor`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| name | String(200) | NOT NULL, UNIQUE | 供应商名称(法律主体) |
| remark | Text | NULL | 备注 |
| **关系** | | | contracts → Supplier |

**Supplier** — 框架合同（`supplier`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| vendor_id | String(36) | FK → vendor.id, NOT NULL | 关联 Vendor |
| name | String(200) | NULL | 供应商名称(冗余) |
| framework | String(200) | NULL | 所属框架 |
| framework_no | String(100) | NOT NULL | 框架编号 |
| framework_start_date | Date | NULL | 开始时间 |
| framework_end_date | Date | NULL | 结束时间 |
| year | Integer | NULL | 年度 |

**SupplierPrice** — 旧单价（`supplier_price`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| supplier_id | String(36) | NOT NULL, INDEX | 关联 Supplier(无FK) |
| work_type | String(100) | NOT NULL | 工种名称 |
| unit_price | Text | NULL | 综合单价 |
| remark | Text | NULL | 备注 |

**SupplierYearPrice** — 年度单价（`supplier_year_price`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| vendor_id | String(36) | FK → vendor.id, NOT NULL | 关联 Vendor |
| year | Integer | NULL, UQ(vendor_id,year) | 年度 |
| laborer_unit_price | Numeric(10,2) | NULL | 普工单价 |
| technician_unit_price | Numeric(10,2) | NULL | 技工单价 |
| senior_technician_unit_price | Numeric(10,2) | NULL | 高级技工单价 |
| special_work_type | String(100) | NULL | 特种作业工种 |
| special_work_price | Numeric(10,2) | NULL | 特种作业单价 |
| comprehensive_unit_price | Numeric(10,2) | NULL | 综合单价 |
| remark | Text | NULL | 备注 |

### 2.3 订单模块

**Order** — 订单（`order`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| project_id | String(36) | NOT NULL, INDEX(无FK) | 关联 Project |
| supplier_id | String(36) | NOT NULL, INDEX(无FK) | 关联 Supplier |
| order_no | String(100) | NOT NULL, UNIQUE | 订单编号 |
| order_name | String(200) | NULL | 订单名称 |
| order_date | Date | NULL | 订单日期 |
| amount | Numeric(15,2) | NOT NULL, default=0 | 金额含税 |
| non_tax_amount | Numeric(15,2) | NULL, default=0 | 金额不含税 |
| erp_no | String(100) | NULL | ERP编号 |
| mobile_project_no | String(100) | NULL | 移动项目编号 |
| order_type | String(50) | NULL | 订单类型 |
| mobile_contact | String(100) | NULL | 移动对接人 |
| status | String(50) | NULL, default=待执行 | 状态 |

### 2.4 流水模块

**IncomeFlow** — 收入流水（`income_flow`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| order_id | String(36) | FK → order.id, NOT NULL | 订单 ID |
| invoice_count | Integer | NOT NULL, default=1 | 开票次数 |
| tax_rate | Numeric(5,2) | NULL | 税率(%) |
| taxable_amount | Numeric(15,2) | NOT NULL, default=0 | 开票金额含税 |
| non_taxable_amount | Numeric(15,2) | NOT NULL, default=0 | 开票金额不含税 |
| invoice_date | Date | NULL | 开票时间 |
| invoice_no | String(200) | NULL | 发票号码 |
| remark | Text | NULL | 备注 |
| status | String(50) | NOT NULL, default=待回款 | 状态 |

**CostFlow** — 成本流水（`cost_flow`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| order_id | String(36) | FK → order.id, NOT NULL | 订单 ID |
| cost_party | String(200) | NULL | 成本方 |
| cost_type | String(100) | NOT NULL, default=其他 | 成本类型 |
| tax_rate | Numeric(5,2) | NULL | 税率(%) |
| taxable_amount | Numeric(15,2) | NOT NULL, default=0 | 成本金额含税 |
| non_taxable_amount | Numeric(15,2) | NOT NULL, default=0 | 成本金额不含税 |
| cost_subject | String(200) | NULL | 成本科目 |
| budget_item | String(200) | NULL | 对应预算项 |
| remark | Text | NULL | 备注 |
| status | String(50) | NOT NULL, default=待支付 | 状态 |

### 2.5 回款支付模块

**Collection** — 回款（`collection`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| flow_id | String(36) | FK → income_flow.id, NOT NULL | 收入流水 ID |
| collection_date | Date | NULL | 回款日期 |
| amount | Numeric(15,2) | NOT NULL, default=0 | 回款金额 |
| receipt_no | String(200) | NULL | 收款凭证号 |

**Payment** — 支付（`payment`）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| cost_id | String(36) | FK → cost_flow.id, NOT NULL | 成本流水 ID |
| payment_date | Date | NULL | 支付日期 |
| payee | String(200) | NULL | 支付对象 |
| voucher_no | String(200) | NULL | 支付凭证 |
| amount | Numeric(15,2) | NOT NULL, default=0 | 支付金额 |

## 3. 外键汇总

### 8 条物理外键（模型层声明，RESTRICT 删除规则）

```
#1  project_budget.project_id     ──→ project.id
#2  income_flow.order_id          ──→ order.id
#3  cost_flow.order_id            ──→ order.id
#4  collection.flow_id            ──→ income_flow.id
#5  payment.cost_id               ──→ cost_flow.id
#6  Supplier.vendor_id            ──→ vendor.id
#7  SupplierYearPrice.vendor_id   ──→ vendor.id
#8  BudgetAdjustment.project_id   ──→ project.id
```

### 2 条逻辑关联（INDEX + 应用层校验，无物理 FK 约束）

```
order.project_id   ──→ project.id      (仅 INDEX，应用层 create_order 手动校验)
order.supplier_id  ──→ supplier.id     (仅 INDEX，应用层 create_order 手动校验)
```

## 4. ER 关联图

```
Project ◄── ProjectBudget (FK #1)
  ├── BudgetAdjustment (FK #8)
  └── Order (逻辑关联: project_id)
         ├── IncomeFlow (FK #2: order_id)
         │      └── Collection (FK #4: flow_id)
         └── CostFlow (FK #3: order_id)
                └── Payment (FK #5: cost_id)

Vendor ◄── Supplier (FK #6: vendor_id)
  ├── SupplierPrice (INDEX only, 无FK)
  └── SupplierYearPrice (FK #7: vendor_id)

Order ──→ Supplier (逻辑关联: supplier_id, 无FK)
```

## 5. 数据库

| 属性 | 值 |
|------|-----|
| 引擎 | SQLite |
| 路径 | `backend/FinanceDesk_Data/finance.db` |
| 迁移 | Alembic（已初始化，初始迁移脚本已生成） |
| 连接 | `check_same_thread=False` |

## 6. 模型文件索引

| 文件 | 包含模型 |
|------|---------|
| `app/models/project.py` | Project, ProjectBudget |
| `app/models/budget.py` | BudgetAdjustment |
| `app/models/vendor.py` | Vendor, Supplier, SupplierPrice, SupplierYearPrice |
| `app/models/order.py` | Order |
| `app/models/flow.py` | IncomeFlow, CostFlow |
| `app/models/collection.py` | Collection, Payment |

## 7. 系统字典（SysDictionary）

| 字段 | 类型 | 说明 |
|------|------|------|
| category | String | 分类标识 |
| value | String | 字典值 |
| label | String | 显示标签 |
| sort_order | Integer | 排序 |

**已知分类**：`project_type`, `budget_type`, `order_type`, `order_status`, `cost_type`, `cost_subject`, `income_status`, `cost_status`, `contract_type`, `adjustment_reason`（共 10 分类，44 条种子数据，详见 `scripts/seed_dictionary.py`）

**API**：`GET /api/v1/dict/{category}` · `POST /api/v1/dict/{category}/ensure`
