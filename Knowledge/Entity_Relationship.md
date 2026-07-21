# Entity Relationship — FinanceDesk 业务 ER 图

> **BDD-00.8 P2 输出 · 永久文档（SSoT）**
> 更新时间：2026-07-04
> 交叉引用：[Business_Data_Model](./Business_Data_Model.md) · [Business_Rules](./Business_Rules.md)

---

## 一、核心业务 — 收入侧

> 合同 → 订单 → 收入 → 收款

```mermaid
erDiagram
    Contract ||--o{ Order : "project_id"
    Order ||--o{ Income : "order_id"
    Income ||--o{ Collection : "flow_id"

    Contract {
        int id PK
        string framework_name
        date sign_date
        date start_date
        date end_date
        string internal_or_external
        string project_type
        string erp_no "ERP only, readonly"
    }

    Order {
        int id PK
        string order_no UK
        int project_id FK
        decimal amount
        decimal non_tax_amount
        string status
    }

    Income {
        int id PK
        int order_id FK
        decimal taxable_amount
        decimal non_taxable_amount
        string invoice_no
        string status "待回款/部分回款/已回款"
    }

    Collection {
        int id PK
        int flow_id FK
        date collection_date
        decimal amount
        string receipt_no
    }
```

**关系说明**：

| 关系 | 类型 | 约束 |
|------|:----:|------|
| Contract → Order | 1:N | `project_id` FK（RESTRICT） |
| Order → Income | 1:N | `order_id` FK（RESTRICT） |
| Income → Collection | 1:N | `flow_id` FK（RESTRICT） |

---

## 二、核心业务 — 成本侧

> 合同 → 订单 → 成本 → 付款

```mermaid
erDiagram
    Contract ||--o{ Order : "project_id"
    Order ||--o{ Cost : "order_id"
    SupplierContract ||--o{ Cost : "supplier_id"
    Cost ||--o{ Payment : "cost_id"

    Cost {
        int id PK
        int order_id FK
        int supplier_id FK "引用 SupplierContract"
        string cost_party
        string cost_type
        decimal taxable_amount
        decimal non_taxable_amount
        string status "待支付/部分支付/已支付"
    }

    Payment {
        int id PK
        int cost_id FK
        date payment_date
        string payee
        decimal amount
        string voucher_no
    }

    SupplierContract {
        int id PK
        string name
        string framework_no
        int year
        string contract_no UK
    }
```

**关系说明**：

| 关系 | 类型 | 约束 |
|------|:----:|------|
| Contract → Order | 1:N | `project_id` FK |
| Order → Cost | 1:N | `order_id` FK |
| SupplierContract → Cost | 1:N | `supplier_id` FK（引用，不修改） |
| Cost → Payment | 1:N | `cost_id` FK |

---

## 三、ERP 集成

> ERP → 暂存表 → 匹配 → 业务表 → Dashboard

```mermaid
erDiagram
    ErpIncomeFlow ||--o| Income : "matched"
    ErpCollection ||--o| Collection : "matched"
    ErpPayment ||--o| Payment : "matched"

    ErpIncomeFlow {
        int id PK
        string erp_order_no
        string invoice_no
        decimal taxable_amount
        boolean matched
        int matched_income_id "FK nullable"
    }

    ErpCollection {
        int id PK
        string erp_invoice_no
        date collection_date
        decimal amount
        boolean matched
        int matched_collection_id "FK nullable"
    }

    ErpPayment {
        int id PK
        string erp_cost_no
        date payment_date
        decimal amount
        boolean matched
        int matched_payment_id "FK nullable"
    }

    Income ||--o{ Collection : "flow_id"
    Cost ||--o{ Payment : "cost_id"
```

---

## 四、全量 ER 图

```mermaid
erDiagram
    Contract ||--o{ Order : project_id
    Order ||--o{ Income : order_id
    Order ||--o{ Cost : order_id
    Income ||--o{ Collection : flow_id
    Cost ||--o{ Payment : cost_id
    SupplierContract ||--o{ Cost : supplier_id

    ErpIncomeFlow }o--|| Income : "matched →"
    ErpCollection }o--|| Collection : "matched →"
    ErpPayment }o--|| Payment : "matched →"

    Contract {
        int id PK
        string framework_name
        string erp_no
    }

    Order {
        int id PK
        string order_no UK
        int project_id FK
        int supplier_id FK
        decimal amount
    }

    Income {
        int id PK
        int order_id FK
        decimal taxable_amount
        string status
    }

    Collection {
        int id PK
        int flow_id FK
        date collection_date
        decimal amount
    }

    Cost {
        int id PK
        int order_id FK
        int supplier_id FK
        decimal taxable_amount
        string status
    }

    Payment {
        int id PK
        int cost_id FK
        date payment_date
        decimal amount
    }

    SupplierContract {
        int id PK
        string name
        string framework_no
        int year
    }
```

---

## 五、引用关系表

| 实体 | 引用对象 | 类型 | 说明 |
|------|---------|:----:|------|
| Order | Contract | FK | 订单必须归属合同（物理 FK） |
| Order | SupplierContract | FK | 订单可选关联成本供应商合同（物理 FK） |
| Income | Order | FK | 收入流水必须归属订单（物理 FK） |
| Cost | Order | FK | 成本流水必须归属订单（物理 FK） |
| Cost | SupplierContract | FK | 成本可选引用合同库单价（物理 FK） |
| Collection | Income | FK | 回款必须关联收入流水的 FK |
| Payment | Cost | FK | 付款必须关联成本流水的 FK |
| ErpIncomeFlow | Income | 逻辑 | ERP 数据匹配到业务收入 |
| ErpCollection | Collection | 逻辑 | ERP 数据匹配到业务收款 |
| ErpPayment | Payment | 逻辑 | ERP 数据匹配到业务付款 |

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-07-04 | 初始编制，4 张 Mermaid ER 图 |
