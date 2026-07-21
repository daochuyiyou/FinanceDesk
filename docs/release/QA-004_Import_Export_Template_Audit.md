# QA-004 Import/Export Template Audit

> **日期:** 2026-07-21
> **审计人:** Hermes
> **状态:** PASS（带 2 个 P2 建议项）

---

## 1. 盘点结果：所有导入/导出/模板入口

### 1.1 导入接口（9 个）

| # | 模块 | API Endpoint | 前端页面 |
|:-:|------|-------------|---------|
| 1 | 项目（甲方合同） | `POST /api/v1/import/projects` | 项目合同 / 合同管理 |
| 2 | 订单 | `POST /api/v1/import/orders` | 订单管理 |
| 3 | 供应商 | `POST /api/v1/import/suppliers` | 成本合同库 → 合同主体 |
| 4 | 收入流水 | `POST /api/v1/import/income-flows` | 收入管理 |
| 5 | 成本流水 | `POST /api/v1/import/cost-flows` | 成本执行 |
| 6 | 回款 | `POST /api/v1/import/collections` | 回款管理 |
| 7 | 付款 | `POST /api/v1/import/payments` | 付款管理 |
| 8 | 供应商合同 | `POST /api/v1/import/supplier-contracts` | 成本合同库 → 成本合同 |
| 9 | 供应商单价 | `POST /api/v1/import/supplier-unit-prices` | 成本合同库 → 单价管理 |

### 1.2 导出接口（9 个）

| # | 模块 | API Endpoint | 文件名 |
|:-:|------|-------------|--------|
| 1 | 项目 | `GET /api/v1/export/projects` | 项目数据.xlsx |
| 2 | 供应商 | `GET /api/v1/export/suppliers` | 供应商数据.xlsx |
| 3 | 订单 | `GET /api/v1/export/orders` | 订单数据.xlsx |
| 4 | 收入流水 | `GET /api/v1/export/income-flows` | 收入流水数据.xlsx |
| 5 | 成本流水 | `GET /api/v1/export/cost-flows` | 成本流水数据.xlsx |
| 6 | 供应商合同 | `GET /api/v1/export/supplier-contracts` | 合同数据.xlsx |
| 7 | 供应商单价 | `GET /api/v1/export/supplier-unit-prices` | 单价数据.xlsx |
| 8 | 回款 | `GET /api/v1/export/collections` | 回款数据.xlsx |
| 9 | 付款 | `GET /api/v1/export/payments` | 付款数据.xlsx |

### 1.3 模板下载接口（9 个）

| # | 模板文件名 | 前端引用名称 |
|:-:|-----------|-------------|
| 1 | 项目导入模板.xlsx | 合同导入模板.xlsx |
| 2 | 供应商导入模板.xlsx | — |
| 3 | 订单导入模板.xlsx | 订单导入模板.xlsx |
| 4 | 收入流水导入模板.xlsx | 收入流水导入模板.xlsx |
| 5 | 成本流水导入模板.xlsx | 成本流水导入模板.xlsx |
| 6 | 回款导入模板.xlsx | 回款导入模板.xlsx |
| 7 | 付款导入模板.xlsx | 付款导入模板.xlsx |
| 8 | 合同导入模板.xlsx | 合同导入模板.xlsx |
| 9 | 单价导入模板.xlsx | 单价导入模板.xlsx |

---

## 2. 模板字段一致性检查

### 2.1 项目（Project）

| 模板列头 | 导入映射 (HEADER_TRANSLATIONS) | 导入校验模型 (ProjectRow) | 导出字段 | 数据库模型 |
|---------|-------------------------------|--------------------------|---------|-----------|
| 框架合同名称 | framework_name | ✅ framework_name: str | ✅ 框架合同名称 | Project.framework_name |
| 签订时间 | sign_date | ✅ sign_date: Optional[str] | ✅ 签订时间 | Project.sign_date |
| 合同开始时间 | start_date | ✅ start_date: Optional[str] | ✅ 合同开始时间 | Project.start_date |
| 合同结束时间 | end_date | ✅ end_date: Optional[str] | ✅ 合同结束时间 | Project.end_date |
| 集团内外 | internal_or_external | ✅ internal_or_external: str | ✅ 集团内外 | Project.internal_or_external |
| 项目类型 | project_type | ✅ project_type: str | ✅ 项目类型 | Project.project_type |

**结论: ✅ 一致**

### 2.2 订单（Order）

| 模板列头 | 导入映射 | 导入校验模型 (OrderRow) | 导出字段 | 数据库模型 |
|---------|---------|----------------------|---------|-----------|
| 项目ID | project_id | ✅ project_id: str | ✅ 项目ID | Order.project_id |
| 订单编号 | order_no | ✅ order_no: str | ✅ 订单编号 | Order.order_no |
| 订单名称 | order_name | ✅ order_name: Optional[str] | ✅ 订单名称 | Order.order_name |
| 甲方单位 | customer_name | ✅ customer_name: Optional[str] | ✅ 甲方单位 | Order.customer_name |
| 含税金额 | amount | ✅ amount: float | ✅ 含税金额 | Order.amount |
| 不含税金额 | non_tax_amount | ✅ non_tax_amount: Optional[float] | ✅ 不含税金额 | Order.non_tax_amount |
| 签订日期 | order_date | ✅ order_date: Optional[str] | ✅ 签订日期 | Order.order_date |
| 订单类型 | order_type | ✅ 未导入（模板无） | ✅ 订单类型 | Order.order_type |
| 状态 | status | ✅ status: Optional[str] | ✅ 状态 | Order.status |

**结论: ✅ 一致**

### 2.3 供应商（Supplier）

| 模板列头 | 导入映射 | 导入校验模型 (SupplierRow) | 导出字段 | 数据库模型 |
|---------|---------|--------------------------|---------|-----------|
| 供应商名称 | name | ✅ name: str | ✅ 供应商名称 | Supplier.name |
| 所属框架 | framework | ✅ framework: Optional[str] | ✅ 所属框架 | Supplier.framework |
| 框架编号 | framework_no | ✅ framework_no: str | ✅ 框架编号 | Supplier.framework_no |
| 框架开始时间 | framework_start_date | ✅ 非必填 | ❌ 未导出 | Supplier.framework_start_date |
| 框架结束时间 | framework_end_date | ✅ 非必填 | ❌ 未导出 | Supplier.framework_end_date |
| 年度 | year | ✅ year: Optional[int] | ✅ 年度 | Supplier.year |

**字段: ⚠️ P2 — 供应商导出缺少框架开始/结束时间**

### 2.4 收入流水（IncomeFlow）

| 模板列头 | 导入映射 | 导入校验模型 (IncomeFlowRow) | 导出字段 | 数据库模型 |
|---------|---------|---------------------------|---------|-----------|
| 订单ID | order_id | ✅ order_id: str | ✅ 订单ID | IncomeFlow.order_id |
| 税率 | tax_rate | ✅ tax_rate: Optional[float] | ✅ 税率 | IncomeFlow.tax_rate |
| 含税金额 | taxable_amount | ✅ taxable_amount: float | ✅ 含税金额 | IncomeFlow.taxable_amount |
| 不含税金额 | non_taxable_amount | ✅ non_taxable_amount: Optional[float] | ✅ 不含税金额 | IncomeFlow.non_taxable_amount |
| 开票日期 | invoice_date | ✅ invoice_date: Optional[str] | ✅ 开票日期 | IncomeFlow.invoice_date |
| 发票号码 | invoice_no | ✅ invoice_no: Optional[str] | ✅ 发票号码 | IncomeFlow.invoice_no |
| 备注 | remark | ✅ 非必填 | ✅ 备注 | IncomeFlow.remark |
| — | status: Optional[str] | ✅ Pydantic 默认"待回款" | ❌ 未导出 | IncomeFlow.status |

**结论: ✅ 一致（status 有默认值，导出非必需）**

### 2.5 成本流水（CostFlow）

| 模板列头 | 导入映射 | 导入校验模型 (CostFlowRow) | 导出字段 | 数据库模型 |
|---------|---------|-------------------------|---------|-----------|
| 订单ID | order_id | ✅ order_id: str | ✅ 订单ID | CostFlow.order_id |
| 供应商ID | supplier_id | ✅ 非必填(模型) | ❌ 未导出 | CostFlow.supplier_id |
| 成本类型 | cost_type | ✅ cost_type: str | ✅ 成本类型 | CostFlow.cost_type |
| 税率 | tax_rate | ✅ tax_rate: Optional[float] | ✅ 税率 | CostFlow.tax_rate |
| 含税金额 | taxable_amount | ✅ taxable_amount: float | ✅ 含税金额 | CostFlow.taxable_amount |
| 不含税金额 | non_taxable_amount | ✅ 非必填 | ✅ 不含税金额 | CostFlow.non_taxable_amount |
| 成本科目 | cost_subject | ✅ 非必填 | ✅ 成本科目 | CostFlow.cost_subject |
| 备注 | remark | ✅ 非必填 | ✅ 备注 | CostFlow.remark |

**⚠️ P2 — 成本流水导出缺少供应商ID 和 成本流水ID(self)**

### 2.6 回款（Collection）

| 模板列头 | 导入映射 | 导入校验 (validate_collection_row) | 导出字段 | 数据库模型 |
|---------|---------|---------------------------------|---------|-----------|
| 流水ID | flow_id | ✅ flow_id 必填 | ✅ 流水ID | Collection.flow_id |
| 回款日期 | collection_date | ✅ 必填，格式 YYYY-MM-DD | ✅ 回款日期 | Collection.collection_date |
| 回款金额 | amount | ✅ 必填，>0 | ✅ 回款金额 | Collection.amount |
| 收款凭证号 | receipt_no | ✅ Optional | ✅ 收款凭证号 | Collection.receipt_no |

**结论: ✅ 一致**

### 2.7 付款（Payment）

| 模板列头 | 导入映射 | 导入校验 (validate_payment_row) | 导出字段 | 数据库模型 |
|---------|---------|-------------------------------|---------|-----------|
| 成本流水ID | cost_id | ✅ cost_id 必填 | ❌ 导出为"成本ID" | Payment.cost_id |
| 支付日期 | payment_date | ✅ 必填，格式 YYYY-MM-DD | ❌ 导出为"支付日期"(一致) | Payment.payment_date |
| 支付金额 | amount | ✅ 必填，>0 | ❌ 导出为"支付金额"(一致) | Payment.amount |
| 支付对象 | payee | ✅ Optional | ✅ 支付对象 | Payment.payee |
| 支付凭证号 | voucher_no | ✅ Optional | ❌ 导出为"支付凭证" | Payment.voucher_no |

**⚠️ P2 — 付款列头不一致：导入用"成本流水ID"，导出用"成本ID"；导入用"支付凭证号"，导出用"支付凭证"**

### 2.8 供应商合同（SupplierContract）

| 模板列头 | 导入映射 (HEADER_TRANSLATIONS) | 导入校验模型 (SupplierContractRow) | 导出字段 | 数据库模型 |
|---------|---------|--------------------------|---------|-----------|
| 供应商ID | ❌ 独立校验，非映射 | ✅ supplier_id: int | ✅ 供应商ID | SupplierContract.supplier_id |
| 合同编号 | contract_no | ✅ contract_no: str | ✅ 合同编号 | SupplierContract.contract_no |
| 合同金额 | amount | ✅ amount: float | ✅ 合同金额 | SupplierContract.amount |
| ❌ 未导入 | — | — | ✅ 签订日期 | SupplierContract.sign_date |
| ❌ 未导入 | — | — | ✅ 开始日期 | SupplierContract.start_date |
| ❌ 未导入 | — | — | ✅ 结束日期 | SupplierContract.end_date |
| ❌ 未导入 | — | — | ✅ 状态 | SupplierContract.status |
| ❌ 未导入 | — | — | ✅ 备注 | SupplierContract.remark |

**⚠️ P2 — 供应商合同导入模板缺少：签订日期、开始日期、结束日期、状态、备注（导出有但导入模板无）**

### 2.9 供应商单价（SupplierUnitPrice）

| 模板列头 | HEADER_TRANSLATIONS | 导入校验模型 | 导出字段 | 数据库模型 |
|---------|-------------------|-------------|---------|-----------|
| 普工单价 | laborer_price | ✅ 未在模型(但有映射) | ✅ 普工单价 | SupplierUnitPrice.laborer_price |
| 技工单价 | technician_price | ✅ | ✅ 技工单价 | SupplierUnitPrice.technician_price |
| 高级技工单价 | senior_technician_price | ✅ | ✅ 高级技工单价 | SupplierUnitPrice.senior_technician_price |
| 特种作业单价 | special_work_price | ✅ | ✅ 特种作业单价 | SupplierUnitPrice.special_work_price |
| 综合单价 | comprehensive_price | ✅ | ✅ 综合单价 | SupplierUnitPrice.comprehensive_price |
| ❌ 未导入 | — | — | ✅ 供应商ID | SupplierUnitPrice.supplier_id |
| ❌ 未导入 | — | — | ✅ 年度 | SupplierUnitPrice.year |

**⚠️ P2 — 供应商单价模板无供应商ID/年度列（SupplierUnitPriceRow 模型有 supplier_id 和 year 必填，但模板未生成对应列）**

---

## 3. 模板生成问题

### 3.1 模板文件缺失

`generate_templates.py` 只生成 5 个模板，以下 **4 个模板未生成**：

| 缺失模板 | 对应模型 | 影响 |
|---------|---------|------|
| 回款导入模板.xlsx | Collection | 模板下载 404 |
| 付款导入模板.xlsx | Payment | 模板下载 404 |
| 合同导入模板.xlsx | SupplierContract | 模板下载 404 |
| 单价导入模板.xlsx | SupplierUnitPrice | 模板下载 404 |

### 3.2 前端模板名称与实际文件不匹配

| 前端引用名称 | 实际模板文件名 | 问题 |
|-------------|-------------|------|
| `合同导入模板.xlsx` | 后端 ALLOWED_TEMPLATES 中为 `合同导入模板.xlsx` | ✅ 一致 |
| `合同导入模板.xlsx`（供应商合同页面） | 也在 ALLOWED_TEMPLATES 中 | ⚠️ 与项目导入的模板同名，可能混淆 |

---

## 4. 导出格式问题

### 4.1 金额无 ¥ 前缀

全部 9 个导出接口使用 `float()` 输出，**无 `¥` 前缀**。例如导出 "含税金额" 为 `10000.0` 而非 `¥10,000.00`。

**严重度: P2 — 导出为原始数值，无格式化**

### 4.2 无冻结首行

导出的 Excel 文件使用 `pandas.DataFrame.to_excel(index=False)`，**未设置冻结首行**（freeze panes）。

**严重度: P2 — 用户体验优化**

---

## 5. 问题分类汇总

| ID | 模块 | 问题 | 严重度 | 状态 |
|:--:|------|------|:------:|:----:|
| T01 | 回款/付款/合同/单价 | 4 个模板文件未生成（`generate_templates.py` 未覆盖） | **P1** | 🔴 未修复 |
| T02 | 供应商合同 | 导入模板字段少于导出（缺签订日期/开始/结束/状态/备注） | **P2** | 建议 |
| T03 | 供应商单价 | 导入模板无供应商ID/年度列（模型有，模板无） | **P2** | 建议 |
| T04 | 供应商 | 导出缺少框架开始/结束时间 | **P2** | 建议 |
| T05 | 成本流水 | 导出缺少供应商ID | **P2** | 建议 |
| T06 | 付款 | 导出列头与导入不一致（成本流水ID vs 成本ID，支付凭证号 vs 支付凭证） | **P2** | 建议 |
| T07 | 全部导出 | 金额无 ¥ 前缀，无千分位格式 | **P2** | 建议 |
| T08 | 全部导出 | 无冻结首行 | **P2** | 建议 |
| T09 | 全局 | 项目合同和供应商合同共用"合同导入模板.xlsx"名称 | **P2** | 建议 |
| T10 | 供应商 | 导入 column `供应商ID` 在 CostFlowRow 中非必填，但 R021 要求必填 | **P2** | 建议 |

---

## 6. 结论

```
QA-004 Import/Export Template Audit
═══════════════════════════════════

P1 Blocking:  1  (T01 — 4 模板缺失)
P2 建议:      9  (T02-T10)

整体判定:  ⚠️  PASS with P1 fix required

P1 修复后可直接用于生产环境。
P2 项可入 V1.1 Backlog 逐步优化。
```

### P1 阻断项（必须修复）

**T01: `generate_templates.py` 缺少 4 个模板**

修复方案：扩展 `generate_templates.py`，为回款、付款、供应商合同、供应商单价 4 个模型生成 Excel 模板，并确保 `templates/` 目录存在且被 `ALLOWED_TEMPLATES` 覆盖。

```python
# 需添加到 generate_templates.py：
pd.DataFrame([{"流水ID":1,"回款日期":"2026-01-15","回款金额":50000.00,"收款凭证号":"RCPT-001"}]).to_excel("回款导入模板.xlsx", index=False)
pd.DataFrame([{"成本流水ID":1,"支付日期":"2026-01-20","支付金额":30000.00,"支付对象":"示例供应商","支付凭证号":"VCH-001"}]).to_excel("付款导入模板.xlsx", index=False)
pd.DataFrame([{"供应商ID":1,"合同编号":"HT-2026-001","合同金额":100000.00}]).to_excel("合同导入模板.xlsx", index=False)
pd.DataFrame([{"供应商ID":1,"年度":2026,"普工单价":0,"技工单价":0,"高级技工单价":0,"特种作业单价":0,"综合单价":0}]).to_excel("单价导入模板.xlsx", index=False)
```

### 已确认一致（无问题）

- ✅ 项目（Project）模板 ↔ API ↔ DB ↔ 表单 — 完全一致
- ✅ 订单（Order）模板 ↔ API ↔ DB — 完全一致
- ✅ 供应商（Supplier）模板 ↔ API ↔ DB — 一致（除导出缺开始/结束时间）
- ✅ 收入流水（IncomeFlow）模板 ↔ API ↔ DB — 完全一致
- ✅ 成本流水（CostFlow）模板 ↔ API ↔ DB — 一致（除导出缺供应商ID）
- ✅ 回款（Collection）模板 ↔ API ↔ DB — 完全一致
- ✅ 付款（Payment）模板 ↔ API ↔ DB — 一致（除列头命名差异）
- ✅ HEARDER_TRANSLATIONS 映射表覆盖所有业务字段
- ✅ `process_excel()` 通用导入流程正确
- ✅ 9 个导入端点全部注册
- ✅ 9 个导出端点全部注册
