# Identity Matrix — 业务编码对应关系矩阵

> **BDD-02A.2 P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-05

---

## 一、编码对应关系图

```mermaid
flowchart LR
    subgraph Contract["合同中心"]
        CN[contract_no]
        EN[erp_no]
    end

    subgraph Order["订单中心"]
        ON[order_no]
    end

    subgraph Supplier["成本供应商合同库"]
        SCN[contract_no<br/>supplier_contract]
    end

    subgraph Income["收入管理"]
        INV[invoice_no]
    end

    subgraph Collection["收款管理"]
        RN[receipt_no]
    end

    subgraph Cost["成本执行"]
        COST_NO[无独立编码<br/>依赖 order_id]
    end

    subgraph Payment["付款管理"]
        VN[voucher_no]
    end

    subgraph ERP["智慧工程平台"]
        ERP_NO[erp_no]
        ERP_ORD[erp_order_no]
        ERP_INV[erp_invoice_no]
        ERP_COL[erp_collection_no]
        ERP_PAY[erp_payment_no]
    end

    CN -->|匹配| ON
    EN --- ERP_NO
    ON --- ERP_ORD
    INV --- ERP_INV
    RN --- ERP_COL
    VN --- ERP_PAY
    ON -->|归属| INV
    ON -->|归属| COST_NO
    INV -->|追溯| RN
    COST_NO -->|追溯| VN
```

---

## 二、编码对应矩阵

### 2.1 核心业务编码

| FinanceDesk 对象 | FinanceDesk 编码 | ERP 编码 | 匹配关系 |
|-----------------|:----------------:|:--------:|---------|
| 合同 (Project) | `contract_no` | `erp_no`（辅助） | 合同编号与 ERP 项目编号独立记录，通过 `erp_no` 字段关联 |
| 订单 (Order) | `order_no` | `erp_order_no` | **ERP 按 `order_no` 精确匹配**（BDD-02A.1 确认） |
| 成本供应商合同 | `contract_no`（supplier_contract） | — | 不参与 ERP 匹配（Master Data） |

### 2.2 流水编码

| FinanceDesk 对象 | FinanceDesk 编码 | ERP 编码 | 匹配关系 |
|-----------------|:----------------:|:--------:|---------|
| 收入流水 (IncomeFlow) | `invoice_no` | `erp_invoice_no` | ERP 开票按发票号码匹配 |
| 成本流水 (CostFlow) | 无独立编码 | `erp_cost_no` | 按 `order_id + supplier_id` 模糊匹配 |
| 收款 (Collection) | `receipt_no` | `erp_collection_no` | ERP 回款按凭证号匹配 |
| 付款 (Payment) | `voucher_no` | `erp_payment_no` | ERP 付款按凭证号匹配 |

---

## 三、编码流向

### 正向流（FinanceDesk → ERP 核对）

```
contract_no ──→ order_no ──→ invoice_no ──→ receipt_no
                              └──→ voucher_no
```

### 逆向流（ERP → FinanceDesk 同步）

```
erp_no ──→ contract_no（辅助）
erp_order_no ──→ order_no（主要匹配）
erp_invoice_no ──→ invoice_no
erp_collection_no ──→ receipt_no
erp_payment_no ──→ voucher_no
```

---

## 四、匹配键优先级

| 业务场景 | 主匹配键 | 备选匹配键 |
|---------|:--------:|:----------:|
| 订单匹配 | `order_no` | 无备选 |
| 收入匹配 | `invoice_no` | `order_id + 金额` |
| 成本匹配 | 模糊匹配 | `order_id + supplier_id + 金额` |
| 收款匹配 | `receipt_no` | `flow_id + 金额` |
| 付款匹配 | `voucher_no` | `cost_id + 金额` |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-05 | 初始编制 |
