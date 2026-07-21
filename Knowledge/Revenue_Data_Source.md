# Revenue Data Source — 收入字段来源矩阵

> **BDD-04A P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05

---

## 一、来源标识

| 标识 | 含义 | 颜色 |
|:----:|------|:----:|
| `M` | 人工录入 | 🟢 |
| `E` | ERP 导入 | 🔵 |
| `A` | 系统自动关联 | ⚪ |
| `S` | 系统自动计算 | 🟠 |

---

## 二、收入流水字段来源

| 字段 | 来源 | 允许人工 | 说明 |
|------|:----:|:--------:|------|
| id | S | ❌ | 主键 |
| order_id | **A** | ❌ | 从订单中心关联 |
| invoice_no | **M / E** | ✅ | 发票号码，ERP 匹配键 |
| taxable_amount | **M / E** | ✅ | 含税金额 |
| non_taxable_amount | **M / E** | ✅ | 不含税金额 |
| tax_rate | **M** | ✅ | 税率 |
| invoice_count | **M** | ✅ | 开票次数，默认 1 |
| invoice_date | **M / E** | ✅ | 开票日期 |
| business_date | **M** | ✅ | **经营发生日期，≠ invoice_date** |
| expected_collection_date | **M** | ✅ | **预计回款日期** |
| business_owner | **M** | ✅ | **经营责任人** |
| remark | **M** | ✅ | 备注 |
| status | **S** | ❌ | 状态由系统推导（见 Revenue_State_Design） |
| is_deleted | S | ❌ | 逻辑删除 |

---

## 三、来源规则

| 规则 | 说明 |
|:----:|------|
| invoice_no | 人工录入→M；ERP 同步→E；两者不可同时存在 |
| taxable_amount | 人工录入时 M，ERP 导入时 E |
| order_id | A—从订单列表选择，不可手工输入数字 |
| status | **S—禁止人工维护**，全部系统推导 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
