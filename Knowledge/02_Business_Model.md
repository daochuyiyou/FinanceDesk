# FinanceDesk 业务模型

> **永久文档 · Single Source of Truth**
> 更新时间：2026-07-04
> 交叉引用：[01_Project_Position](./01_Project_Position.md) · [03_Business_Architecture](./03_Business_Architecture.md) · [04_Data_Model](./04_Data_Model.md)

---

## 1. 业务领域划分

FinanceDesk 覆盖 7 大业务领域：

| # | 领域 | 核心实体 | 说明 |
|---|------|---------|------|
| ① | 项目管理 | Project, ProjectBudget | 合同级项目信息及预算 |
| ② | 供应商管理 | Vendor, Supplier, SupplierPrice, SupplierYearPrice | 供应商主体、框架合同、单价 |
| ③ | 订单管理 | Order | 订单信息，关联项目和供应商 |
| ④ | 预算管理 | BudgetAdjustment | 项目预算调整（正负均可） |
| ⑤ | 流水管理 | IncomeFlow, CostFlow | 收入/成本流水，关联订单 |
| ⑥ | 回款支付 | Collection, Payment | 回款关联收入流水，支付关联成本流水 |
| ⑦ | 经营分析 | Dashboard（聚合查询） | 项目汇总、利润分析、应收账龄 |

## 2. 核心业务流程

```
用户创建项目 (Project)
    │
    ├── 设置项目预算 (ProjectBudget)
    │
    ├── 建立供应商框架 (Vendor → Supplier)
    │
    ├── 创建订单 (Order)，关联 Project + Supplier
    │       │
    │       ├── 收入流水 (IncomeFlow) ────→ 回款 (Collection)
    │       └── 成本流水 (CostFlow) ──────→ 支付 (Payment)
    │
    └── 预算调整 (BudgetAdjustment)
```

## 3. 业务规则

### 3.1 项目管理
- 项目是顶层容器，所有业务活动围绕项目展开
- 项目支持逻辑删除（`is_deleted`），不影响关联数据查询
- 项目类型：集团内/集团外，用于区分利润核算

### 3.2 供应商体系
- **Vendor** = 法律主体（唯一名称约束）
- **Supplier** = 框架合同（关联 Vendor，可多个框架）
- **SupplierPrice** = 旧单价表（仅 INDEX，无物理 FK）
- **SupplierYearPrice** = 年度单价（UQ: vendor_id + year）

### 3.3 订单规则
- `order_no` 全局唯一
- 订单创建时应用层校验 `project_id` 和 `supplier_id` 存在性（无物理外键）
- 订单类型、状态由字典表 [SysDictionary](./04_Data_Model.md#7-系统字典) 管理

### 3.4 流水规则
- 收入流水必须关联一个有效订单
- 成本流水必须关联一个有效订单
- 流水有状态：收入流水状态 = `待回款/部分回款/已回款`，成本流水状态 = `待支付/部分支付/已支付`

### 3.5 回款支付规则
- 回款必须关联一个有效的收入流水 (FK)
- 支付必须关联一个有效的成本流水 (FK)
- 回款金额和支付金额 ≥ 0

### 3.6 预算规则
- 支持多版本预算（`budget_type` 区分）
- 预算调整可正可负（`adjustment_amount`），范围 -1e9 ~ 1e9

## 4. 数据源类型

详见 [05_Data_Source](./05_Data_Source.md)：

| 来源 | 方式 | 频率 |
|------|------|------|
| 手工录入 | 前端 CRUD | 按需 |
| Excel 导入 | 9 种模板，批量导入 | 批量/月度 |
| ERP 对接 | 智慧工程平台双轨 ETL | 增量同步 |
