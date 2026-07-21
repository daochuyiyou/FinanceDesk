# Cost Model — 成本对象模型

> **BDD-05A P1 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **必须保持与 Revenue Entry 镜像。不得出现两套不同的业务逻辑。**

---

## 一、成本对象定义

| 属性 | 值 |
|------|-----|
| 业务对象 | **成本（Cost / CostFlow）** |
| 对应表 | `cost_flow` |
| 归属层级 | **订单**（order_id FK） |
| 与 Order 关系 | N:1（一个订单可有多条成本流水） |
| 与 Payment 关系 | 1:N（一条成本流水可对应多次付款） |
| 与 Cost Contract 关系 | 引用（supplier_id → Cost Contract） |

### 字段定义（镜像 Revenue）

| 字段 | 类型 | NULL | 来源 | Revenue 对标 | 说明 |
|------|:----:|:----:|:----:|:-----------:|------|
| id | Integer | | S | id | 主键 |
| order_id | Integer | | A | order_id | 🔗 关联订单 |
| cost_party | String(200) | ✅ | M | customer_name | 成本方 |
| cost_type | String(100) | | M | — | 成本类型 |
| cost_subject | String(200) | ✅ | M | — | 成本科目 |
| taxable_amount | Numeric(15,2) | | M/E | taxable_amount | 成本金额含税 |
| non_taxable_amount | Numeric(15,2) | ✅ | M/E | non_taxable_amount | 成本金额不含税 |
| tax_rate | Numeric(5,2) | ✅ | M | tax_rate | 税率 |
| **cost_stage** | String(50) | ✅ | **M** | invoice_stage | **成本阶段**（新增） |
| **cost_reason** | String(50) | ✅ | **M** | invoice_reason | **成本原因**（新增） |
| **business_date** | Date | ✅ | **M** | business_date | **经营发生日期**（新增） |
| **expected_payment_date** | Date | ✅ | **M** | expected_collection_date | **预计付款日期**（新增） |
| **business_owner** | String(100) | ✅ | **M** | business_owner | **经营责任人**（新增） |
| remark | Text | ✅ | M | remark | 备注 |

---

## 二、禁止维护字段

| 字段 | 维护位置 | 原因 |
|:----:|:--------:|------|
| 利润 | Dashboard | R006 自动计算 |
| 成本率 | Dashboard / Cost Summary | 统一计算 |
| 剩余预算 | Cost Summary | 统一计算 |
| 已完成 | Dashboard | 系统推导 |
| 已结清 | Dashboard | 系统推导 |

---

## 三、生命周期

```
成本流水创建 → 待支付 → 部分支付 → 已支付 → 闭环
                                ↘ 已作废
```

---

## 四、与 Revenue 的镜像关系

| Revenue 字段 | Cost 字段 | 必须一致 |
|:-----------:|:---------:|:--------:|
| invoice_stage | cost_stage | ✅ |
| invoice_reason | cost_reason | ✅ |
| business_date | business_date | ✅ |
| expected_collection_date | expected_payment_date | ✅ |
| business_owner | business_owner | ✅ |
| taxable_amount | taxable_amount | ✅ 金额语义不同但命名一致 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
