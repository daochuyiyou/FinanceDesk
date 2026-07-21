# Business Data Model — FinanceDesk 业务数据模型

> **BDD-00.8 P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-04
> 交叉引用：[Business_Constitution](./Business_Constitution.md) · [Business_Rules](./Business_Rules.md) · [04_Data_Model](./04_Data_Model.md)

---

## 一、对象总览

| # | 业务对象 | 类型 | 对应表 | 来源 |
|:-:|---------|:----:|--------|:----:|
| 1 | 合同（Contract） | 经营实体 | `project` | M / E |
| 2 | 订单（Order） | 经营实体 | `order` | M / E |
| 3 | 收入（Income） | 经营实体 | `income_flow` | M / E |
| 4 | 收款（Collection） | 经营实体 | `collection` | M |
| 5 | 成本（Cost） | 经营实体 | `cost_flow` | M / E |
| 6 | 付款（Payment） | 经营实体 | `payment` | M |
| 7 | 成本供应商合同（SupplierContract） | Master Data | `supplier` / `supplier_contract` / `supplier_unit_price` | M |
| 8 | ERP 收支流水 | ERP 暂存 | `erp_income_flow` | E |
| 9 | ERP 收款流水 | ERP 暂存 | `erp_collection` | E |
| 10 | ERP 付款流水 | ERP 暂存 | `erp_payment` | E |
| 11 | ERP 应收账款 | ERP 暂存 | `erp_ar` | E |

---

## 二、对象定义

### 1. 合同（Contract）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| framework_name | String(200) | | | | M/E | 框架合同名称 |
| contract_no | String(100) | | ✅(新) | ✅(历史) | M | 合同编号（新增必填，历史可为空） |
| owner_name | String(200) | | | | M | 业主单位（必填） |
| owner_contact | String(100) | | | ✅ | M | 联系人 |
| owner_phone | String(50) | | | ✅ | M | 联系电话 |
| contract_year | Integer | | | ✅ | M/S | 所属年度（默认取签订日期年份） |
| status | String(50) | | | ✅ | S/M | 合同状态（默认待执行；系统推导为主，人工仅可终止） |
| sign_date | Date | | | ✅ | M/E | 签订时间 |
| start_date | Date | | | ✅ | M/E | 合同开始时间 |
| end_date | Date | | | ✅ | M/E | 合同结束时间 |
| internal_or_external | String(20) | | | | M | 集团内外（字典） |
| project_type | String(100) | | | | M | 项目类型（字典） |
| erp_no | String(100) | | | ✅ | E | ERP 项目编号 |
| is_deleted | Boolean | | | | S | 逻辑删除 |
| created_at | DateTime | | | | S | 创建时间 |
| updated_at | DateTime | | | | S | 更新时间 |

**表名**: `project` · **生命周期**: 签订 → 执行 → 完成/作废
**主数据**: 系统字典（project_type, internal_or_external）

---

### 2. 订单（Order）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| order_no | String(100) | | ✅ | | M | **甲方订单编号**（ERP 按此匹配，禁止自动生成） |
| order_source | String(20) | | | ✅ | S | **自动推导**（框架合同/单项合同，禁止人工修改） |
| project_id | Integer | | | | A | 🔗 关联合同 |
| supplier_id | Integer | | | ✅ | A | 🔗 关联成本供应商合同 |
| order_name | String(200) | | | ✅ | M/E | 订单名称 |
| amount | Numeric(15,2) | | | | M/E | 金额含税 |
| non_tax_amount | Numeric(15,2) | | | ✅ | M/E | 金额不含税 |
| order_date | Date | | | ✅ | M/E | 订单日期 |
| order_type | String(50) | | | ✅ | M | 订单类型（字典） |
| status | String(50) | | | ✅ | M | 状态（字典） |
| customer_name | String(200) | | | ✅ | M/E | 甲方单位 |
| owner_project_name | String(200) | | | ✅ | M | **甲方项目名称**（仅归属信息，不建立立项模块） |
| owner_project_no | String(100) | | | ✅ | M | **甲方项目编号**（可选） |
| erp_no | String(100) | | | ✅ | E | ERP 编号 |
| mobile_project_no | String(100) | | | ✅ | M | 移动项目编号 |
| mobile_contact | String(100) | | | ✅ | M | 移动对接人 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**表名**: `order` · **生命周期**: 创建 → 执行中 → 已完成 / 已作废
**红线**: 唯一经营结算单元（**R001**），所有收支归属订单

---

### 3. 收入（Income）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| order_id | Integer | | | | A | 🔗 关联订单 |
| invoice_count | Integer | | | | M | 开票次数 |
| tax_rate | Numeric(5,2) | | | ✅ | M | 税率(%) |
| taxable_amount | Numeric(15,2) | | | | M/E | 开票金额含税 |
| non_taxable_amount | Numeric(15,2) | | | | M/E | 开票金额不含税 |
| invoice_date | Date | | | ✅ | M/E | 开票时间 |
| invoice_no | String(200) | | | ✅ | M/E | 发票号码 |
| remark | Text | | | ✅ | M | 备注 |
| status | String(50) | | | | S/M | 状态：自动/手工 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**表名**: `income_flow` · **生命周期**: 创建 → 部分回款 → 已回款 / 已作废
**状态自动计算规则**: Collection 合计 < 开票合计 → 部分回款；= → 已回款；0 → 待回款

---

### 4. 收款（Collection）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| flow_id | Integer | | | | A | 🔗 关联收入 |
| collection_date | Date | | | ✅ | M | 回款日期 |
| amount | Numeric(15,2) | | | | M | 回款金额 |
| receipt_no | String(200) | | | ✅ | M | 收款凭证号 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**表名**: `collection` · **生命周期**: 创建 → 已确认
**禁则**: 金额 ≥ 0

---

### 5. 成本（Cost）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| order_id | Integer | | | | A | 🔗 关联订单 |
| supplier_id | Integer | | | ✅ | A | 🔗 关联成本供应商合同 |
| cost_party | String(200) | | | ✅ | M | 成本方 |
| cost_type | String(100) | | | | M | 成本类型（字典） |
| tax_rate | Numeric(5,2) | | | ✅ | M | 税率(%) |
| taxable_amount | Numeric(15,2) | | | | M/E | 成本金额含税 |
| non_taxable_amount | Numeric(15,2) | | | | M/E | 成本金额不含税 |
| cost_subject | String(200) | | | ✅ | M | 成本科目（字典） |
| budget_item | String(200) | | | ✅ | M | 对应预算项 |
| remark | Text | | | ✅ | M | 备注 |
| status | String(50) | | | | S/M | 状态：自动/手工 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**表名**: `cost_flow` · **生命周期**: 创建 → 部分支付 → 已支付 / 已作废
**引用**: 成本供应商合同库（supplier_id），不修改合同信息

---

### 6. 付款（Payment）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键 |
| cost_id | Integer | | | | A | 🔗 关联成本 |
| payment_date | Date | | | ✅ | M | 支付日期 |
| payee | String(200) | | | ✅ | M | 支付对象 |
| voucher_no | String(200) | | | ✅ | M | 支付凭证 |
| amount | Numeric(15,2) | | | | M | 支付金额 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**表名**: `payment` · **生命周期**: 创建 → 已确认
**禁则**: 金额 ≥ 0

---

### 7. 成本供应商合同（SupplierContract）

| 字段 | 类型 | PK | UK | NULL | 来源 | 说明 |
|------|------|:--:|:--:|:----:|:----:|------|
| id | Integer | ✅ | | | S | 主键（supplier.id） |
| name | String(200) | | | | M | 合同名称 |
| framework | String(200) | | | ✅ | M | 所属框架 |
| framework_no | String(100) | | | | M | 框架编号 |
| framework_start_date | Date | | | ✅ | M | 有效期开始 |
| framework_end_date | Date | | | ✅ | M | 有效期结束 |
| year | Integer | | ✅(复合) | ✅ | M | 年度 |
| contract_no | String(100) | | ✅ | ✅ | M | 合同编号 |
| status | String(50) | | | ✅ | M | 合同状态 |
| is_deleted | Boolean | | | | S | 逻辑删除 |

**子对象 — 单价（UnitPrice）**:

| 字段 | 类型 | NULL | 说明 |
|------|------|:----:|------|
| year | Integer | | 年度 |
| laborer_price | Numeric(10,2) | ✅ | 普工单价 |
| technician_price | Numeric(10,2) | ✅ | 技工单价 |
| senior_technician_price | Numeric(10,2) | ✅ | 高级技工单价 |
| special_work_price | Numeric(10,2) | ✅ | 特种作业单价 |
| comprehensive_price | Numeric(10,2) | ✅ | 综合单价 |

**表名**: `supplier` + `supplier_contract` + `supplier_unit_price`
**生命周期**: 年度签订 → 到期 → 次年新签
**红线（R008 + F007）**: Master Data，不得承担业务流程职责
**禁则**: 一条记录 = 一份年度合同，不等于一个供应商主体

---

### 8. ERP 收支流水

| 字段 | 类型 | NULL | 来源 | 说明 |
|------|------|:----:|:----:|------|
| id | Integer | | E | 主键 |
| erp_order_no | String | | E | ERP 订单编号 |
| invoice_no | String | ✅ | E | ERP 发票号 |
| taxable_amount | Numeric(15,2) | | E | ERP 开票金额 |
| invoice_date | Date | ✅ | E | ERP 开票日期 |
| matched | Boolean | | S | 是否已匹配业务收入 |
| matched_income_id | Integer | ✅ | S | 匹配到的收入 ID |
| match_status | String | | S | 匹配状态（待匹配/已匹配/差异） |

**说明**: ERP 同步的原始开票数据，属于暂存层，不直接参与业务。
**生命周期**: 同步 → 匹配 → 确认写入业务表 / 标记差异

---

### 9. ERP 收款流水

| 字段 | 类型 | NULL | 来源 | 说明 |
|------|------|:----:|:----:|------|
| id | Integer | | E | 主键 |
| erp_invoice_no | String | ✅ | E | ERP 发票号 |
| collection_date | Date | ✅ | E | ERP 回款日期 |
| amount | Numeric(15,2) | | E | ERP 回款金额 |
| matched | Boolean | | S | 是否已匹配 |
| matched_collection_id | Integer | ✅ | S | 匹配到的收款 ID |

**说明**: ERP 同步的原始回款数据，暂存层。
**生命周期**: 同步 → 匹配 → 确认

---

### 10. ERP 付款流水

| 字段 | 类型 | NULL | 来源 | 说明 |
|------|------|:----:|:----:|------|
| id | Integer | | E | 主键 |
| erp_cost_no | String | ✅ | E | ERP 成本编号 |
| payment_date | Date | ✅ | E | ERP 付款日期 |
| amount | Numeric(15,2) | | E | ERP 付款金额 |
| matched | Boolean | | S | 是否已匹配 |
| matched_payment_id | Integer | ✅ | S | 匹配到的付款 ID |

**说明**: ERP 同步的原始付款数据，暂存层。
**生命周期**: 同步 → 匹配 → 确认

---

### 11. ERP 应收账款

| 字段 | 类型 | NULL | 来源 | 说明 |
|------|------|:----:|:----:|------|
| id | Integer | | E | 主键 |
| erp_order_no | String | ✅ | E | ERP 订单号 |
| ar_amount | Numeric(15,2) | | E | 应收金额 |
| ar_balance | Numeric(15,2) | | S | 应收余额 |
| aging_days | Integer | | S | 账龄天数 |
| due_date | Date | ✅ | E | 到期日 |
| matched | Boolean | | S | 是否已与业务数据核对 |

**说明**: ERP 的应收账龄数据，用于与 Dashboard 的应收数据交叉核对。
**生命周期**: 同步 → 对账 → 差异处理

---

## 三、对象关系总图

```
┌───────────────────────┐
│  ① 合同（Contract）    │ ◄── ERP 同步
└─────────┬─────────────┘
          │ project_id
          ▼
┌───────────────────────┐          ┌───────────────────────────┐
│  ② 订单（Order）       │◄────────┤ ⑦ 成本供应商合同           │
│    (唯一结算单元 R001)  │ supplier_id│ (SupplierContract)      │
└────┬──────────┬───────┘          └───────────────────────────┘
     │          │
     │ order_id │ order_id
     ▼          ▼
┌────────┐ ┌────────┐
│③ 收入  │ │⑤ 成本  │
│(Income)│ │(Cost)  │
└───┬────┘ └───┬────┘
    │ flow_id  │ cost_id
    ▼          ▼
┌────────┐ ┌────────┐
│④ 收款  │ │⑥ 付款  │
│(Collect)││(Payment)│
└────────┘ └────────┘

ERP 侧（暂存层）：
⑧ ERP 收支流水 ──→ 匹配 ──→ ③ 收入
⑨ ERP 收款流水 ──→ 匹配 ──→ ④ 收款
⑩ ERP 付款流水 ──→ 匹配 ──→ ⑥ 付款
⑪ ERP 应收账款 ──── 对账 ──→ Dashboard
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-04 | 初始编制，11 个业务对象 |
