# Revenue Business Scenario — 收入业务走查

> **BDD-04B 产出 · 业务走查**
> 更新时间：2026-07-05

---

## 场景一：单项合同 → 唯一 Order → 收入 → 收款 → ERP → Dashboard

### 流程

```
单项合同创建
    ↓
唯一订单创建（单项合同限制：仅 1 个订单）
    ↓
收入登记（开票）
    ↓
收款登记（回款）
    ↓
ERP 开票/回款同步
    ↓
Dashboard 更新
```

### 数据来源

| 步骤 | 数据 | 来源 |
|:----:|------|:----:|
| 合同 | contract_no, owner_name | M |
| 订单 | order_no, amount | M |
| 收入 | invoice_no, taxable_amount | M/E |
| 收款 | amount, receipt_no | M |
| ERP | erp_invoice_no, erp_amount | E |

### 数据流向

```
Project(order_no, amount) → IncomeFlow(invoice_no, taxable_amount)
    → Collection(amount, receipt_no)
    → Revenue Summary(Invoice Rate, Collection Rate)
    → Dashboard
```

### 自动计算内容

| 指标 | 计算方 |
|:----:|:------:|
| Invoice Rate | Revenue Summary |
| Collection Rate | Revenue Summary |
| Remaining Amount | Revenue Summary |
| Gap | Dashboard |

### 人工维护内容

| 操作 | 维护人 |
|:----:|:------:|
| 创建合同 | 项目经理 |
| 创建订单 | 项目经理 |
| 登记收入 | 财务人员 |
| 登记回款 | 财务人员 |

---

## 场景二：框架合同 → 多个 Order → 多次收入 → 多次收款 → ERP → Dashboard

### 流程

```
框架合同创建
    ↓
订单 1 创建 → 收入 1 → 收款 1
订单 2 创建 → 收入 2 → 收款 2
订单 3 创建 → 收入 3 → （待回款）
    ↓
ERP 同步（匹配既有回款+新增回款）
    ↓
Dashboard 聚合展示
```

### 数据来源

同场景一，但存在以下差异：

| 差异 | 场景一 | 场景二 |
|:----:|:------:|:------:|
| 合同类型 | 单项合同 | 框架合同 |
| 订单数 | 1 | N |
| 收入次数 | 1 | N |
| 收款次数 | 1 | N |
| 订单限制 | order_source=单项合同 | order_source=框架合同 |

### 数据流向

```
Project(order_no_1, amount_1) → Income_1 → Collection_1
Project(order_no_2, amount_2) → Income_2 → Collection_2
Project(order_no_3, amount_3) → Income_3 → (pending)

→ Revenue Summary (per order)
→ Dashboard (consolidated)
```

### 自动计算内容

| 指标 | 订单级 | 合同级 |
|:----:|:------:|:------:|
| Invoice Rate | ✅ | ✅ |
| Collection Rate | ✅ | ✅ |
| Remaining Amount | ✅ | ✅ |

### 人工维护内容

同场景一。每个订单独立维护收入。

---

## 场景三：收入红冲 → 重新登记 → Dashboard 自动更新

### 流程

```
原始收入登记（invoice_no: INV-001, amount: 100,000）
    ↓
发现开票错误，需要红冲
    ↓
登记红冲收入（invoice_reason: 红冲, amount: -100,000）
    ↓
重新登记正确收入（invoice_no: INV-002, amount: 80,000）
    ↓
收款登记（amount: 80,000）
    ↓
Dashboard 自动更新
```

### 数据来源

| 步骤 | 数据 | 来源 |
|:----:|------|:----:|
| 原始收入 | invoice_no, taxable_amount | M |
| 红冲收入 | invoice_reason=红冲, taxable_amount=负数 | M |
| 正确收入 | invoice_no, taxable_amount | M |
| 收款 | amount | M |

### 数据流向

```
IncomeFlow(inv-001, +100k) → ← IncomeFlow(inv-001-red, -100k)
IncomeFlow(inv-002, +80k) → Collection(80k)
→ Revenue Summary(taxable=80k, collected=80k)
→ Dashboard(Invoice Rate=100%, Collection Rate=100%)
```

### 自动计算内容

| 指标 | 计算方式 |
|:----:|---------|
| Total Invoice | 红冲后自动取净额（-100k + 80k = 原始应在 ±80k） |
| Collection Rate | 基于净额计算 |
| Invoice Rate | 基于净额计算 |

### 人工维护内容

| 操作 | 说明 |
|:----:|------|
| 登记红冲收入 | invoice_reason=红冲 |
| 重新登记收入 | 新 invoice_no |
| 登记回款 | 正常流程 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
