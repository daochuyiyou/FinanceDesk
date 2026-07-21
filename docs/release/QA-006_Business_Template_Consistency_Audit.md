# QA-006 Business Template Consistency Audit

> **日期:** 2026-07-21
> **审计人:** Hermes
> **目标:** 遍历所有一级业务菜单，比对 UI 新增表单 → 导入模板 → 导出字段 → API Schema → DB Schema 的字段级一致性
> **状态:** ⚠️ 待定

---

## 审计方法

对每个业务模块，审计 6 个数据层的字段一致性：

| 层 | 来源 | 说明 |
|:--:|------|------|
| DB | SQLAlchemy Model | 数据库物理字段 |
| API Req | Pydantic Create Schema | 新增/编辑 API 请求字段 |
| API Resp | Pydantic Response Schema | API 响应字段 |
| UI 表单 | 前端 Modal/Drawer | 用户填写字段 |
| 导入模板 | Excel 模板列头 | 批量导入字段 |
| 导出 | Excel 导出列 | 批量导出字段 |

### 一致性类型

| 标记 | 含义 |
|:----:|------|
| ✅ | 各层一致 |
| ❌ | 缺失字段 |
| ⚠️ | 命名不一致 |
| 🔶 | 类型不一致 |
| 🔷 | 必填不一致 |
| 📋 | 字典不一致 |

---

## 1. 项目（Project）一致性矩阵

### DB字段总览（20 字段 + 8 审计字段）

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | framework_name | String(200) REQ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | contract_no | String(100) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 3 | contract_type | String(20) REQ | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 4 | owner_name | String(200) REQ | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 5 | owner_contact | String(100) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 6 | owner_phone | String(50) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 7 | contract_amount | Numeric(15,2) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 8 | budget_amount | Numeric(15,2) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 9 | sign_date | Date OPT | ✅ | ✅ | ✅ 签订时间 | ✅ 签订时间 | ✅ |
| 10 | start_date | Date OPT | ✅ | ✅ | ✅ 合同开始时间 | ✅ 合同开始时间 | ✅ |
| 11 | end_date | Date OPT | ✅ | ✅ | ✅ 合同结束时间 | ✅ 合同结束时间 | ✅ |
| 12 | contract_year | Integer OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 13 | department | String(100) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 14 | manager | String(100) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 15 | internal_or_external | String(20) REQ | ✅ | ✅ | ✅ 集团内外 | ✅ 集团内外 | ✅ |
| 16 | project_type | String(100) REQ | ✅ | ✅ | ✅ 项目类型 | ✅ 项目类型 | ✅ |
| 17 | status | String(50) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 18 | remark | Text OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 19 | erp_no | String(100) OPT | ❌ | ❌ | ❌ | ❌ | ✅ 系统只读 |

**项目模块一致率: 7/19 = 37%**（导入模板仅含 6 字段，DB 有 19 业务字段）

**问题: P1 — 导入模板与 DB 模型严重不匹配（6 vs 19 字段）**

---

## 2. 订单（Order）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | project_id | String(36) REQ | ✅ | ✅ | ✅ 项目ID | ✅ 项目ID | ✅ |
| 2 | supplier_id | String(36) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 3 | order_no | String(100) REQ | ✅ | ✅ | ✅ 订单编号 | ✅ 订单编号 | ✅ |
| 4 | order_name | String(200) OPT | ✅ | ✅ | ✅ 订单名称 | ✅ 订单名称 | ✅ |
| 5 | customer_name | String(200) OPT | ✅ | ✅ | ✅ 甲方单位 | ✅ 甲方单位 | ✅ |
| 6 | amount | Numeric(15,2) REQ | ✅ | ✅ | ✅ 含税金额 | ✅ 含税金额 | ✅ |
| 7 | non_tax_amount | Numeric(15,2) OPT | ✅ | ✅ | ✅ 不含税金额 | ✅ 不含税金额 | ✅ |
| 8 | order_date | Date OPT | ✅ | ✅ | ✅ 签订日期 | ✅ 签订日期 | ✅ |
| 9 | order_type | String(20) OPT | ✅ | ✅ | ✅ 订单类型 | ✅ 订单类型 | ✅ |
| 10 | status | String(50) OPT | ✅ | ✅ | ✅ 状态 | ✅ 状态 | ✅ |
| 11 | order_source | String(20) OPT | ❌ | ❌ | ❌ | ❌ | ✅ 系统内部 |
| 12 | remark | Text OPT | ❌ | ❌ | ❌ | ❌ | ⚠️ 缺 API/模板/导出 |

**订单模块一致率: 10/12 = 83%**

**问题: P2 — 缺少备注/供应商ID 字段在模板和导出中**

---

## 3. 供应商（Supplier）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | name | String(200) REQ | ✅ | ✅ | ✅ 供应商名称 | ✅ 供应商名称 | ✅ |
| 2 | framework | String(200) OPT | ✅ | ✅ | ✅ 所属框架 | ✅ 所属框架 | ✅ |
| 3 | framework_no | String(100) REQ | ✅ | ✅ | ✅ 框架编号 | ✅ 框架编号 | ✅ |
| 4 | framework_start_date | Date OPT | ✅ | ✅ | ✅ 框架开始时间 | ❌ | ⚠️ 缺导出 |
| 5 | framework_end_date | Date OPT | ✅ | ✅ | ✅ 框架结束时间 | ❌ | ⚠️ 缺导出 |
| 6 | year | Integer OPT | ✅ | ✅ | ✅ 年度 | ✅ 年度 | ✅ |
| 7 | bank_account | String(100) REQ | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |
| 8 | remark | Text OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |

**供应商模块一致率: 6/8 = 75%**

**问题: P2 — 银行账号/备注字段在导入模板和导出中缺失**

---

## 4. 收入流水（IncomeFlow）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | order_id | String(36) REQ | ✅ | ✅ | ✅ 订单ID | ✅ 订单ID | ✅ |
| 2 | invoice_count | Integer OPT | ❌ | ❌ | ❌ | ❌ | ✅ 系统维护 |
| 3 | tax_rate | Numeric(5,2) OPT | ✅ | ✅ | ✅ 税率 | ✅ 税率 | ✅ |
| 4 | taxable_amount | Numeric(15,2) REQ | ✅ | ✅ | ✅ 含税金额 | ✅ 含税金额 | ✅ |
| 5 | non_taxable_amount | Numeric(15,2) OPT | ✅ | ✅ | ✅ 不含税金额 | ✅ 不含税金额 | ✅ |
| 6 | invoice_date | Date OPT | ✅ | ✅ | ✅ 开票日期 | ✅ 开票日期 | ✅ |
| 7 | invoice_no | String(200) OPT | ✅ | ✅ | ✅ 发票号码 | ✅ 发票号码 | ✅ |
| 8 | remark | Text OPT | ✅ | ✅ | ✅ 备注 | ✅ 备注 | ✅ |
| 9 | status | String(50) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |

**收入模块一致率: 8/9 = 89%** ✅

---

## 5. 成本流水（CostFlow）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | order_id | String(36) REQ | ✅ | ✅ | ✅ 订单ID | ✅ 订单ID | ✅ |
| 2 | supplier_id | String(36) REQ (R021) | ✅ | ✅ | ✅ 供应商ID | ❌ | ⚠️ 缺导出 |
| 3 | cost_type | String(100) REQ | ✅ | ✅ | ✅ 成本类型 | ✅ 成本类型 | ✅ |
| 4 | tax_rate | Numeric(5,2) OPT | ✅ | ✅ | ✅ 税率 | ✅ 税率 | ✅ |
| 5 | taxable_amount | Numeric(15,2) REQ | ✅ | ✅ | ✅ 含税金额 | ✅ 含税金额 | ✅ |
| 6 | non_taxable_amount | Numeric(15,2) OPT | ✅ | ✅ | ✅ 不含税金额 | ✅ 不含税金额 | ✅ |
| 7 | cost_subject | String(100) OPT | ✅ | ✅ | ✅ 成本科目 | ✅ 成本科目 | ✅ |
| 8 | remark | Text OPT | ✅ | ✅ | ✅ 备注 | ✅ 备注 | ✅ |
| 9 | status | String(50) OPT | ✅ | ✅ | ❌ | ❌ | ⚠️ 缺模板/导出 |

**成本模块一致率: 8/9 = 89%** ✅

---

## 6. 回款（Collection）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | flow_id | String(36) REQ | ✅ | ✅ | ✅ 流水ID | ✅ 流水ID | ✅ |
| 2 | collection_date | Date REQ | ✅ | ✅ | ✅ 回款日期 | ✅ 回款日期 | ✅ |
| 3 | amount | Numeric(15,2) REQ | ✅ | ✅ | ✅ 回款金额 | ✅ 回款金额 | ✅ |
| 4 | receipt_no | String(200) OPT | ✅ | ✅ | ✅ 收款凭证号 | ✅ 收款凭证号 | ✅ |

**回款模块一致率: 4/4 = 100%** ✅

---

## 7. 付款（Payment）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | cost_id | String(36) REQ | ✅ | ✅ | ✅ 成本流水ID | ⚠️ 成本ID | 🔷 命名不一致 |
| 2 | payment_date | Date REQ | ✅ | ✅ | ✅ 支付日期 | ✅ 支付日期 | ✅ |
| 3 | amount | Numeric(15,2) REQ | ✅ | ✅ | ✅ 支付金额 | ✅ 支付金额 | ✅ |
| 4 | payee | String(200) OPT | ✅ | ✅ | ✅ 支付对象 | ✅ 支付对象 | ✅ |
| 5 | voucher_no | String(200) OPT | ✅ | ✅ | ✅ 支付凭证号 | ⚠️ 支付凭证 | 🔷 命名不一致 |

**付款模块一致率: 4/5 = 80%**（2 处命名不一致）

---

## 8. 供应商合同（SupplierContract）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | supplier_id | Integer REQ | ✅ | ✅ | ✅ 供应商ID | ✅ 供应商ID | ✅ |
| 2 | contract_no | String(200) REQ | ✅ | ✅ | ✅ 合同编号 | ✅ 合同编号 | ✅ |
| 3 | sign_date | Date OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 签订日期 | ❌ 缺 API/UI/模板 |
| 4 | start_date | Date OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 开始日期 | ❌ 缺 API/UI/模板 |
| 5 | end_date | Date OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 结束日期 | ❌ 缺 API/UI/模板 |
| 6 | amount | Numeric(15,2) OPT | ✅ | ✅ | ✅ 合同金额 | ✅ 合同金额 | ✅ |
| 7 | status | String(50) OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 状态 | ❌ 缺 API/UI/模板 |
| 8 | remark | Text OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 备注 | ❌ 缺 API/UI/模板 |

**供应商合同一致率: 3/8 = 38%**

**问题: P1 — 5 个字段（签订日期/开始日期/结束日期/状态/备注）存在于 DB 和导出中，但缺失 API Schema、UI 表单、导入模板**

---

## 9. 供应商单价（SupplierUnitPrice）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入模板 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:--------:|:----:|:----:|
| 1 | supplier_id | Integer REQ | ✅ | ✅ | ✅ 供应商ID | ✅ 供应商ID | ✅ |
| 2 | year | Integer REQ | ✅ | ✅ | ✅ 年度 | ✅ 年度 | ✅ |
| 3 | laborer_price | Numeric(10,2) OPT | ✅ | ✅ | ✅ 普工单价 | ✅ 普工单价 | ✅ |
| 4 | technician_price | Numeric(10,2) OPT | ✅ | ✅ | ✅ 技工单价 | ✅ 技工单价 | ✅ |
| 5 | senior_technician_price | Numeric(10,2) OPT | ✅ | ✅ | ✅ 高级技工单价 | ✅ 高级技工单价 | ✅ |
| 6 | special_work_price | Numeric(10,2) OPT | ✅ | ✅ | ✅ 特种作业单价 | ✅ 特种作业单价 | ✅ |
| 7 | comprehensive_price | Numeric(10,2) OPT | ✅ | ✅ | ✅ 综合单价 | ✅ 综合单价 | ✅ |
| 8 | remark | Text OPT | ❌ 缺 | ❌ 缺 | ❌ 缺 | ✅ 备注 | ⚠️ 缺 API/UI/模板 |

**供应商单价一致率: 7/8 = 88%** ✅

---

## 10. 预算（BudgetAdjustment）一致性矩阵

| # | 字段 | DB | API Req | UI 新增 | 导入 | 导出 | 状态 |
|:-:|------|:--:|:-------:|:-------:|:----:|:----:|:----:|
| 1 | project_id | String(36) REQ | ✅ | ✅ | — | — | ✅ |
| 2 | adjustment_date | Date REQ | ✅ | ✅ | — | ✅ | ✅ |
| 3 | adjustment_reason | String(500) REQ | ✅ | ✅ | — | ✅ | ✅ |
| 4 | adjustment_amount | Numeric(15,2) REQ | ✅ | ✅ | — | ✅ | ✅ |
| 5 | remark | Text OPT | ✅ | ✅ | — | ✅ | ✅ |

**预算模块一致率: 5/5 = 100%** ✅（无导入，仅有导出）

---

## 问题汇总

| ID | 模块 | 问题 | 严重度 | 说明 |
|:--:|------|------|:------:|------|
| C01 | 项目 | 导入模板仅含 6/19 字段 | **P1** | 19 个业务字段中只有 6 个可导入 |
| C02 | 供应商合同 | 5 字段 DB→导出 但缺失 API/UI/模板 | **P1** | 签订日期/开始/结束/状态/备注 |
| C03 | 供应商合同 | 整体一致率 38% | **P1** | 核心业务字段缺失 |
| C04 | 订单 | 缺少备注/供应商ID 在模板和导出 | P2 | 导出优化 |
| C05 | 供应商 | 银行账号/备注在模板和导出中缺失 | P2 | 导出优化 |
| C06 | 付款 | 导出列头命名不一致 | P2 | 成本流水ID vs 成本ID / 支付凭证号 vs 支付凭证 |
| C07 | 供应商单价 | 备注字段缺 API/UI/模板 | P2 | 补充备注 |
| C08 | 项目 | 12 个业务字段在导入模板中缺失 | P1 | contract_no, contract_type, owner_name, contract_amount 等 |

---

## 各模块一致率

| 模块 | 总字段 | 一致 | 一致率 | 状态 |
|------|:-----:|:----:|:------:|:----:|
| 回款 Collection | 4 | 4 | **100%** | ✅ |
| 预算 BudgetAdjustment | 5 | 5 | **100%** | ✅ |
| 收入流水 IncomeFlow | 9 | 8 | **89%** | ✅ |
| 成本流水 CostFlow | 9 | 8 | **89%** | ✅ |
| 供应商单价 UnitPrice | 8 | 7 | **88%** | ✅ |
| 订单 Order | 12 | 10 | **83%** | ✅ |
| 供应商 Supplier | 8 | 6 | **75%** | ⚠️ |
| 付款 Payment | 5 | 4 | **80%** | ⚠️ |
| 供应商合同 SupplierContract | 8 | 3 | **38%** | **🔴 P1** |
| 项目 Project | 19 | 7 | **37%** | **🔴 P1** |
| **总体** | **87** | **62** | **71%** | **⚠️** |

---

## 结论

```
QA-006 Business Template Consistency Audit
════════════════════════════════════════════

P0 Blocking:  0
P1 严重:      2 （C01 项目模板字段缺失 / C02 供应商合同 API/UI 缺失）
P2 建议:      5 （各类导出优化）
P3 信息:      1 （供应商合同一致率低）

整体一致率:    71% （62/87）

Release 红线判定: ❌ 不通过
───────────────────────────────────────
P1 问题存在 → 禁止进入 Release
修复 P1 后方可解封
───────────────────────────────────────
```

### Release 红线

**若存在 P0 或 P1 一致性问题，则禁止进入 Release。**

当前存在 **2 个 P1 问题**：
1. **C01**: 项目导入模板仅覆盖 6/19 字段（32%）
2. **C02**: 供应商合同 5 字段存在于 DB 但缺失 API Schema / UI 表单 / 导入模板

### 推荐修复顺序

1. **C02（供应商合同）** — 补充 API Schema 的 sign_date / start_date / end_date / status / remark 字段
2. **C01（项目）** — 扩展导入模板覆盖核心业务字段（contract_no, contract_type, owner_name, contract_amount, 等）
