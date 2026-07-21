# Payment Model — 付款对象模型

> **BDD-05A P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05
> **Payment 与 Cost 为 1:N。ERP 为事实来源。状态全部系统推导。**

---

## 一、付款对象定义

| 属性 | 值 |
|------|-----|
| 业务对象 | **付款（Payment）** |
| 对应表 | `payment` |
| 与 Cost 关系 | N:1（一条成本流水可对应多次付款） |
| ERP 定位 | 事实来源，FinanceDesk 记录经营过程 |

### 字段定义（镜像 Collection）

| 字段 | 类型 | NULL | 来源 | Collection 对标 | 说明 |
|------|:----:|:----:|:----:|:-------------:|------|
| id | Integer | | S | id | 主键 |
| cost_id | Integer | | A | flow_id | 🔗 关联成本流水（FK） |
| payment_date | Date | ✅ | M | collection_date | 付款日期 |
| payee | String(200) | ✅ | M | — | 支付对象 |
| amount | Numeric(15,2) | | M | amount | 付款金额 |
| voucher_no | String(200) | ✅ | M | receipt_no | 支付凭证号 |

---

## 二、ERP 匹配规则

| 场景 | 匹配键 | 说明 |
|:----:|:------:|------|
| ERP 付款同步 | `voucher_no` | 支付凭证号精确匹配 |
| 无凭证号匹配 | `cost_id + amount` | 按成本流水+金额模糊匹配 |

---

## 三、状态推导（不落库）

| 状态 | 推导条件 |
|:----:|---------|
| 待支付 | CostFlow 存在，Payment.amount = 0 |
| 部分支付 | 0 < Payment.amount < CostFlow.taxable_amount |
| 已支付 | Payment.amount ≥ CostFlow.taxable_amount |

**状态全部系统推导，禁止人工维护。**

---

## 四、与 Cost 的关系

```
Cost (1)
  └── Payment (N)     ← 一条成本可多次付款
```

### 约束

| 规则 | 说明 |
|:----:|------|
| Payment 必须关联有效 Cost | cost_id FK（RESTRICT） |
| 付款金额 ≥ 0 | amount ≥ 0 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
