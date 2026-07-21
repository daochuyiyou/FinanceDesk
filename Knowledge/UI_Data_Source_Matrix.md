# UI Data Source Matrix — 页面数据来源矩阵

> **BDD-00.5 P3 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-04
> 原则：任何字段都可以追溯来源（R004）

---

## 一、来源标识

| 标识 | 含义 | 颜色标记 |
|:----:|------|:--------:|
| `M` | 人工录入 | 🟢 |
| `E` | ERP 导入 | 🔵 |
| `S` | 系统自动计算 | 🟠 |
| `A` | 系统自动关联 | ⚪ |

---

## 二、合同中心 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| framework_name | M / E | 人工录入或 ERP 同步 |
| contract_no | M | 合同编号（新增必填，历史可为空） |
| owner_name | M | 业主单位 |
| owner_contact | M | 联系人 |
| owner_phone | M | 联系电话 |
| contract_year | M / S | 所属年度（默认取签订日期年份，可修改） |
| status | S / M | 合同状态（系统推导为主；人工仅可终止） |
| sign_date | M / E | 签订日期 |
| start_date | M / E | 合同开始时间 |
| end_date | M / E | 合同结束时间 |
| internal_or_external | M | 集团内外（字典） |
| project_type | M | 项目类型（字典） |
| erp_no | E | ERP 项目编号 🔵 只读 |
| is_deleted | S | 逻辑删除标记 |
| created_at | S | 创建时间 |
| updated_at | S | 更新时间 |

**来源说明**：项目可通过人工创建，也可通过 ERP 同步。ERP 来源的项目 `erp_no` 字段为只读。

---

## 三、订单中心 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| order_no | M / E | 订单编号 |
| order_name | M / E | 订单名称 |
| project_id | A | 从合同中心关联 🟢 选择或 A 搜索 |
| supplier_id | A | 从成本供应商合同库关联 |
| amount | M / E | 含税金额 |
| non_tax_amount | M / E | 不含税金额 |
| order_date | M / E | 订单日期 |
| order_type | M | 订单类型（字典） |
| status | M | 状态（字典） |
| customer_name | M / E | 甲方单位（兼容字段） |
| erp_no | E | ERP 编号 🔵 只读 |
| mobile_project_no | M | 移动项目编号 |
| mobile_contact | M | 移动对接人 |
| is_deleted | S | 逻辑删除标记 |

**来源说明**：`project_id` 和 `supplier_id` 为系统自动关联（A），从已有合同和合同库中选择。

---

## 四、收入管理 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| order_id | A | 从订单中心关联 |
| invoice_count | M | 开票次数 |
| tax_rate | M | 税率(%) 🔵 默认可从配置获取 |
| taxable_amount | M / E | 开票金额含税 |
| non_taxable_amount | M / E | 开票金额不含税 |
| invoice_date | M / E | 开票时间 |
| invoice_no | M / E | 发票号码 |
| remark | M | 备注 |
| status | S / M | 状态：自动计算（待回款/部分回款/已回款）或手工标记 |
| is_deleted | S | 逻辑删除标记 |

**状态自动计算规则**：系统根据关联的 Collection 金额聚合计算——0 回款=待回款，部分=部分回款，全额=已回款。

---

## 五、成本执行 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| order_id | A | 从订单中心关联 |
| supplier_id | A | 从成本供应商合同库关联 |
| cost_party | M | 成本方 |
| cost_type | M | 成本类型（字典） |
| tax_rate | M | 税率(%) |
| taxable_amount | M / E | 成本金额含税 |
| non_taxable_amount | M / E | 成本金额不含税 |
| cost_subject | M | 成本科目（字典） |
| budget_item | M | 对应预算项 |
| remark | M | 备注 |
| status | S / M | 状态：自动计算（待支付/部分支付/已支付） |
| is_deleted | S | 逻辑删除标记 |

---

## 六、收款管理 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| flow_id | A | 从收入流水关联 |
| collection_date | M | 回款日期 |
| amount | M | 回款金额 |
| receipt_no | M | 收款凭证号 |
| is_deleted | S | 逻辑删除标记 |

---

## 七、付款管理 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| cost_id | A | 从成本流水关联 |
| payment_date | M | 支付日期 |
| payee | M | 支付对象 |
| voucher_no | M | 支付凭证 |
| amount | M | 支付金额 |
| is_deleted | S | 逻辑删除标记 |

---

## 八、成本供应商合同库 — 字段来源矩阵

### 主表（Supplier）

| 字段 | 来源 | 说明 |
|------|:----:|------|
| name | M | 合同名称/供应商名称 |
| framework | M | 所属框架 |
| framework_no | M | 框架编号 |
| framework_start_date | M | 有效期开始 |
| framework_end_date | M | 有效期结束 |
| year | M | 所属年度 |
| is_deleted | S | 逻辑删除标记 |

### 合同补充信息（SupplierContract）

| 字段 | 来源 | 说明 |
|------|:----:|------|
| contract_no | M | 合同编号 |
| sign_date | M | 签订日期 |
| start_date | M | 开始日期 |
| end_date | M | 结束日期 |
| amount | M | 合同金额 |
| status | M | 合同状态（字典） |

### 单价（SupplierUnitPrice / SupplierYearPrice）

| 字段 | 来源 | 说明 |
|------|:----:|------|
| year | M | 年度 |
| laborer_price | M | 普工单价 |
| technician_price | M | 技工单价 |
| senior_technician_price | M | 高级技工单价 |
| special_work_price | M | 特种作业单价 |
| comprehensive_price | M | 综合单价 |

**来源说明**：成本供应商合同库全部字段为 M（人工维护/Excel 导入），不来自 ERP 同步。

---

## 九、财务集成核对 — 字段来源矩阵

| 字段 | 来源 | 说明 |
|------|:----:|------|
| 同步状态 | E | ERP 数据状态 |
| 匹配结果 | S | 系统自动匹配 |
| 差异金额 | S | 系统自动计算 |
| 匹配规则 | M | 人工维护 |
| 差异标记 | M | 人工标注处理状态 |

---

## 十、经营驾驶舱 — 字段来源矩阵

| 指标 | 来源 | 计算方式 |
|------|:----:|---------|
| 项目汇总 | S | 从 Project + Order 聚合 |
| 订单数 | S | 按 project_id COUNT |
| 合同总额 | S | SUM(Order.amount) |
| 已开票 | S | SUM(IncomeFlow.taxable_amount) |
| 已回款 | S | SUM(Collection.amount) |
| 应收余额 (Gap) | S | `已开票 - 已回款` |
| 项目利润 | S | `收入合计 - 成本合计` |
| 订单毛利 | S | 按订单维度计算 |
| 回款率 | S | `已回款 ÷ 应回款` |
| 成本率 | S | `已支付 ÷ 应付` |
| 预算执行率 | S | `实际支出 ÷ 预算金额` |
| 应收账龄 | S | 按回款日期 - 开票日期计算 |

**来源说明**：Dashboard 全部指标为 S（系统自动计算），无任何 M 或 E 字段。

---

## 十一、来源汇总图

```
                                       M 人工
                                      ╱
                       ┌── 合同中心 ──┤
                       │              ╲
                       │               E ERP
              ┌── 订单中心 ──── M / E / A
              │
              │       ┌── 收入管理 ──── M / E / A
              │       ├── 成本执行 ──── M / E / A
   合同中心 ──┤       │
              │       ├── 收款管理 ──── M / A
              │       │
              │       └── 付款管理 ──── M / A
              │
              ├── 财务集成核对 ── E / S / M
              │
              └── 经营驾驶舱 ──── S（纯系统计算）

              成本供应商合同库 ── M（纯人工）
              系统字典 ───────── M（纯人工）
              Excel 模板 ─────── M（纯人工）
              参数配置 ───────── M（纯人工）
```

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-04 | 初始编制，12 个模块字段来源矩阵 |
